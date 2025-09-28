import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../hooks/useNotifications';

export function NotificationHandler() {
  const navigation = useNavigation();

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    try {
      if (data?.type === 'task_reminder' && data?.taskId) {
        navigation.navigate('TaskForm', { taskId: data.taskId });
      } else if (data?.type === 'project_deadline' && data?.projectId) {
        navigation.navigate('ProjectDetail', { projectId: data.projectId });
      } else if (data?.type === 'task_completed' && data?.taskId) {
        navigation.navigate('TaskForm', { taskId: data.taskId });
      } else if (data?.type === 'project_completed' && data?.projectId) {
        navigation.navigate('ProjectDetail', { projectId: data.projectId });
      }
    } catch (error) {
      console.warn('Navigation error from notification:', error);
    }
  };

  const { expoPushToken } = useNotifications({
    onNotificationResponse: handleNotificationResponse,
  });

  useEffect(() => {
    if (expoPushToken) {
      console.log('Push notifications initialized with token:', expoPushToken);
    }
  }, [expoPushToken]);

  // This component doesn't render anything
  return null;
}