import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

class NotificationService {
  private expoPushToken: string | null = null;
  private isExpoGo: boolean = false;

  constructor() {
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.configureNotifications();
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
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    if (this.isExpoGo) {
      console.warn('Push notifications are not fully supported in Expo Go. Use development build for full functionality.');
      // Still try to initialize for local notifications
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return null;
      }

      // Only try to get push token if not in Expo Go
      if (!this.isExpoGo) {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
          });
          this.expoPushToken = token.data;
          console.log('Expo Push Token:', this.expoPushToken);
        } catch (tokenError) {
          console.warn('Failed to get push token (normal in Expo Go):', tokenError);
        }
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  async scheduleLocalNotification(notification: NotificationData): Promise<string | null> {
    try {
      const { title, body, data, trigger } = notification;

      let schedulingOptions: any = {};

      if (trigger?.date) {
        schedulingOptions = {
          trigger: {
            date: trigger.date,
          },
        };
      } else if (trigger?.timeInterval) {
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

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async sendImmediateNotification(notification: NotificationData): Promise<string | null> {
    try {
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
    const reminderDate = new Date(dueDate);
    reminderDate.setHours(reminderDate.getHours() - 1);

    if (reminderDate <= new Date()) {
      return null;
    }

    return this.scheduleLocalNotification({
      title: 'Lembrete de Tarefa',
      body: `"${taskTitle}" vence em 1 hora`,
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
    return this.sendImmediateNotification({
      title: 'Tarefa Concluída! 🎉',
      body: `Parabéns! Você concluiu "${taskTitle}"`,
      data: { taskId, type: 'task_completed' }
    });
  }

  async notifyProjectCompleted(projectName: string, projectId: string): Promise<string | null> {
    return this.sendImmediateNotification({
      title: 'Projeto Concluído! 🚀',
      body: `Fantástico! Você completou o projeto "${projectName}"`,
      data: { projectId, type: 'project_completed' }
    });
  }
}

export default new NotificationService();