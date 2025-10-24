import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants';

/**
 * NotificationService - Handles local and push notifications
 *
 * IMPORTANT: Push notifications are not fully supported in Expo Go (SDK 53+).
 * For full functionality, use a development build. Local notifications still work.
 *
 * Features:
 * - Local notifications with scheduling
 * - Push notification tokens (dev build only)
 * - Task reminders and completion notifications
 * - Project deadline reminders
 * - Graceful degradation for Expo Go
 */

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  trigger?: {
    date?: Date;
    type?: 'timeInterval' | 'date';
    timeInterval?: number;
  };
}

interface NotificationSettings {
  taskReminders: boolean;
  taskCompletions: boolean;
  projectDeadlines: boolean;
  projectCompletions: boolean;
  reminderHours: number;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isExpoGo: boolean = false;
  private settings: NotificationSettings | null = null;

  constructor() {
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.configureNotifications();
    this.loadSettings();
  }

  private configureNotifications() {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.warn('Failed to configure notifications:', error);
    }
  }

  async initialize(): Promise<string | null> {
    console.log('Initializing notification service for local notifications...');

    if (!Device.isDevice) {
      console.log('Running on simulator - local notifications will still work');
      // Don't return null - local notifications work on simulator too
    }

    if (this.isExpoGo) {
      console.log('Running in Expo Go - using local notifications only');
    }

    try {
      console.log('Checking notification permissions...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('Current permission status:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      console.log('Notification permissions granted! Local notifications enabled.');

      // Skip push token setup since we only need local notifications
      console.log('Skipping push token setup - local notifications only');

      if (Platform.OS === 'android') {
        console.log('Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      console.log('Local notification service initialized successfully');
      return null; // No push token needed for local notifications
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  async scheduleLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      console.log('Scheduling notification:', notification.title);
      const { title, body, data, trigger } = notification;

      let schedulingOptions: any = {};

      if (trigger?.date) {
        console.log('Scheduling for date:', trigger.date);
        schedulingOptions = {
          trigger: {
            date: trigger.date,
          },
        };
      } else if (trigger?.timeInterval) {
        console.log('Scheduling for time interval:', trigger.timeInterval);
        schedulingOptions = {
          trigger: {
            seconds: trigger.timeInterval,
          },
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        ...schedulingOptions,
      });

      console.log('Notification scheduled successfully with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async sendImmediateNotification(notification: NotificationData): Promise<string | null> {
    try {
      console.log('Sending immediate notification:', notification.title);
      const { title, body, data } = notification;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null,
      });

      console.log('Immediate notification sent successfully with ID:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error sending immediate notification:', error);
      return null;
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    try {
      return Notifications.addNotificationReceivedListener(listener);
    } catch (error) {
      console.warn('Error adding notification listener:', error);
      return null;
    }
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    try {
      return Notifications.addNotificationResponseReceivedListener(listener);
    } catch (error) {
      console.warn('Error adding notification response listener:', error);
      return null;
    }
  }

  async scheduleTaskReminder(taskTitle: string, dueDate: Date, taskId: string): Promise<string | null> {
    // Parse the due date and set to end of day to avoid midnight issues
    const dueDateObj = new Date(dueDate);
    dueDateObj.setHours(23, 59, 59, 999);

    // Calculate days until due
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Don't schedule if already past due
    if (daysUntilDue < 0) {
      return null;
    }

    // Schedule reminder 1 day before at 9 AM, or same day at 9 AM if due tomorrow
    const reminderDate = new Date(dueDateObj);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0);

    // If reminder date is in the past, schedule for today at current time + 1 minute
    if (reminderDate <= now) {
      reminderDate.setTime(now.getTime() + 60000); // 1 minute from now
    }

    // Create appropriate message based on days remaining
    let message: string;
    if (daysUntilDue === 0) {
      message = `"${taskTitle}" vence hoje`;
    } else if (daysUntilDue === 1) {
      message = `"${taskTitle}" vence amanhã`;
    } else {
      message = `"${taskTitle}" vence em ${daysUntilDue} dias`;
    }

    return this.scheduleLocalNotification({
      title: 'Lembrete de Tarefa',
      body: message,
      data: { taskId, type: 'task_reminder' },
      trigger: { date: reminderDate }
    });
  }

  async scheduleProjectDeadlineReminder(projectName: string, deadline: Date, projectId: string): Promise<string | null> {
    const reminderDate = new Date(deadline);
    reminderDate.setDate(reminderDate.getDate() - 1);

    if (reminderDate <= new Date()) {
      return null;
    }

    return this.scheduleLocalNotification({
      title: 'Prazo do Projeto',
      body: `Projeto "${projectName}" vence amanhã`,
      data: { projectId, type: 'project_deadline' },
      trigger: { date: reminderDate }
    });
  }

  async notifyTaskCompleted(taskTitle: string, taskId: string): Promise<string | null> {
    if (!this.settings?.taskCompletions) {
      console.log('Task completion notifications are disabled');
      return null;
    }

    return this.sendImmediateNotification({
      title: 'Tarefa Concluída! 🎉',
      body: `Parabéns! Você concluiu "${taskTitle}"`,
      data: { taskId, type: 'task_completed' }
    });
  }

  async notifyProjectCompleted(projectName: string, projectId: string): Promise<string | null> {
    if (!this.settings?.projectCompletions) {
      console.log('Project completion notifications are disabled');
      return null;
    }

    return this.sendImmediateNotification({
      title: 'Projeto Concluído! 🚀',
      body: `Fantástico! Você completou o projeto "${projectName}"`,
      data: { projectId, type: 'project_completed' }
    });
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(Config.storageKeys.notificationSettings);
      if (settingsJson) {
        this.settings = JSON.parse(settingsJson);
      } else {
        // Default settings
        this.settings = {
          taskReminders: true,
          taskCompletions: true,
          projectDeadlines: true,
          projectCompletions: true,
          reminderHours: 1,
        };
        await this.saveSettings(this.settings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // Fallback to default settings
      this.settings = {
        taskReminders: true,
        taskCompletions: true,
        projectDeadlines: true,
        projectCompletions: true,
        reminderHours: 1,
      };
    }
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      this.settings = settings;
      await AsyncStorage.setItem(Config.storageKeys.notificationSettings, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  getSettings(): NotificationSettings | null {
    return this.settings;
  }

  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    if (this.settings) {
      const updatedSettings = { ...this.settings, ...newSettings };
      await this.saveSettings(updatedSettings);
    }
  }

  async reloadSettings(): Promise<void> {
    await this.loadSettings();
    console.log('Notification settings reloaded:', this.settings);
  }
}

export default new NotificationService();