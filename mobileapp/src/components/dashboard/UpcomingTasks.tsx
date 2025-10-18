import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Task } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { TaskPriorities, TaskStatuses } from '../../constants';
import { DateUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface UpcomingTasksProps {
  tasks: Task[];
  maxItems?: number;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function UpcomingTasks({ tasks, maxItems = 5 }: UpcomingTasksProps) {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const upcomingTasks = tasks
    .filter(task => task.status !== 'concluida' && task.dueDate)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, maxItems);

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskForm', { taskId });
  };

  const renderTask = ({ item }: { item: Task }) => {
    const priority = TaskPriorities[item.priority];
    const isOverdue = item.dueDate && DateUtils.isOverdue(item.dueDate);
    const daysUntil = item.dueDate ? DateUtils.getDaysUntilDue(item.dueDate) : 0;

    return (
      <TouchableOpacity
        style={[styles.taskItem, isOverdue && styles.overdueTask]}
        onPress={() => handleTaskPress(item.id)}
      >
        <View style={styles.taskHeader}>
          <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
          <View style={styles.taskContent}>
            <Text style={styles.taskTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.taskMeta}>
              <Text style={[styles.taskDate, isOverdue && styles.overdueText]}>
                {item.dueDate && DateUtils.formatDate(item.dueDate)}
              </Text>
              <Text style={[styles.taskDays, isOverdue && styles.overdueText]}>
                {isOverdue
                  ? `${Math.abs(daysUntil)} dia(s) atrasada`
                  : daysUntil === 0
                    ? 'Hoje'
                    : `${daysUntil} dia(s)`
                }
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward-outline" size={16} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (upcomingTasks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Próximas Tarefas</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.success} />
          <Text style={styles.emptyText}>Todas as tarefas estão em dia!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximas Tarefas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tasks' as any)}>
          <Text style={styles.seeAll}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={upcomingTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.dark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  taskItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  overdueTask: {
    backgroundColor: theme.colors.danger + '10',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.danger,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  taskDays: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  overdueText: {
    color: theme.colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});