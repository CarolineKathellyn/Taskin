import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/NotificationService';

interface UseNotificationsOptions {
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeNotifications() {
      const token = await NotificationService.initialize();
      if (isMounted) {
        setExpoPushToken(token);
      }
    }

    initializeNotifications();

    const notificationListener = NotificationService.addNotificationReceivedListener(
      (notification) => {
        if (isMounted) {
          setNotification(notification);
        }
      }
    );

    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        if (options?.onNotificationResponse) {
          options.onNotificationResponse(response);
        }
      }
    );

    return () => {
      isMounted = false;
      try {
        if (notificationListener && typeof notificationListener.remove === 'function') {
          notificationListener.remove();
        }
        if (responseListener && typeof responseListener.remove === 'function') {
          responseListener.remove();
        }
      } catch (error) {
        console.warn('Error removing notification subscriptions:', error);
      }
    };
  }, [options?.onNotificationResponse]);

  return {
    expoPushToken,
    notification,
    scheduleTaskReminder: NotificationService.scheduleTaskReminder.bind(NotificationService),
    scheduleProjectDeadlineReminder: NotificationService.scheduleProjectDeadlineReminder.bind(NotificationService),
    notifyTaskCompleted: NotificationService.notifyTaskCompleted.bind(NotificationService),
    notifyProjectCompleted: NotificationService.notifyProjectCompleted.bind(NotificationService),
    cancelNotification: NotificationService.cancelNotification.bind(NotificationService),
    cancelAllNotifications: NotificationService.cancelAllNotifications.bind(NotificationService),
    reloadSettings: NotificationService.reloadSettings.bind(NotificationService),
    getSettings: NotificationService.getSettings.bind(NotificationService),
  };
}