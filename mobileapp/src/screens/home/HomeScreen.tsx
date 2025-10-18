import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../store';
import { loadTasks, processRecurringTasks } from '../../store/slices/taskAsyncThunks';
import { Colors, Strings } from '../../constants';
import { DateUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';

import StatsCard from '../../components/dashboard/StatsCard';
import TaskProgress from '../../components/dashboard/TaskProgress';
import UpcomingTasks from '../../components/dashboard/UpcomingTasks';
import { LoadingSpinner } from '../../components/common';

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, isLoading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = React.useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadData();
      }
    }, [user])
  );

  const loadData = async () => {
    if (!user) return;

    try {
      // Load tasks first
      await dispatch(loadTasks(user.id));

      // Process recurring tasks after data is loaded
      console.log('HomeScreen: Processing recurring tasks...');
      await dispatch(processRecurringTasks(user.id));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'concluida').length;
    const pendingTasks = tasks.filter(task => task.status !== 'concluida').length;
    const overdueTasks = tasks.filter(task =>
      task.status !== 'concluida' &&
      task.dueDate &&
      DateUtils.isOverdue(task.dueDate)
    ).length;

    const highPriorityTasks = tasks.filter(task =>
      task.status !== 'concluida' &&
      task.priority === 'alta'
    ).length;

    const todayTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'concluida') return false;
      const today = new Date().toISOString().split('T')[0];
      return task.dueDate === today;
    }).length;

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      highPriorityTasks,
      todayTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [tasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Faça login para ver suas tarefas</Text>
      </View>
    );
  }

  if (isLoading && tasks.length === 0) {
    return <LoadingSpinner text="Carregando dashboard..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}!</Text>
        <Text style={styles.userName}>{user.name}</Text>
        {stats.totalTasks > 0 && (
          <Text style={styles.subtitle}>
            Você tem {stats.pendingTasks} tarefa(s) pendente(s)
          </Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <StatsCard
              title="Total de Tarefas"
              value={stats.totalTasks}
              icon="list-outline"
              color={Colors.primary}
            />
          </View>
          <View style={styles.statCard}>
            <StatsCard
              title="Concluídas"
              value={stats.completedTasks}
              icon="checkmark-circle-outline"
              color={Colors.success}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <StatsCard
              title="Pendentes"
              value={stats.pendingTasks}
              icon="time-outline"
              color={Colors.warning}
            />
          </View>
          <View style={styles.statCard}>
            <StatsCard
              title="Atrasadas"
              value={stats.overdueTasks}
              icon="alert-circle-outline"
              color={Colors.danger}
            />
          </View>
        </View>

        {stats.todayTasks > 0 && (
          <StatsCard
            title="Para Hoje"
            value={stats.todayTasks}
            icon="today-outline"
            color={Colors.info}
            subtitle="tarefa(s) com vencimento hoje"
          />
        )}

        {stats.highPriorityTasks > 0 && (
          <StatsCard
            title="Alta Prioridade"
            value={stats.highPriorityTasks}
            icon="arrow-up-outline"
            color={Colors.danger}
            subtitle="tarefa(s) importantes pendentes"
          />
        )}
      </View>

      {stats.totalTasks > 0 && (
        <TaskProgress
          completed={stats.completedTasks}
          total={stats.totalTasks}
          title="Progresso Geral"
        />
      )}

      <UpcomingTasks tasks={tasks} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {stats.totalTasks === 0
            ? 'Comece criando sua primeira tarefa!'
            : `Taxa de conclusão: ${stats.completionRate}%`
          }
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userName: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.danger,
    textAlign: 'center',
  },
});