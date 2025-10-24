import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { loadTasks, deleteTask, processRecurringTasks } from '../../store/slices/taskAsyncThunks';
import { loadProjects } from '../../store/slices/projectAsyncThunks';
import { performDeltaSync } from '../../store/slices/syncSlice';
import { updateFilters, clearFilters, setFilters } from '../../store/slices/taskSlice';
import { Button, Card, LoadingSpinner } from '../../components/common';
import TaskFilters from '../../components/tasks/TaskFilters';
import { Strings, TaskPriorities, TaskStatuses, getCategoryName } from '../../constants';
import { Task, TaskFilters as ITaskFilters } from '../../types';
import { DateUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { ExportService } from '../../services/ExportService';

type TaskListNavigationProp = StackNavigationProp<RootStackParamList>;

export default function TaskListScreen() {
  const navigation = useNavigation<TaskListNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, projects, isLoading, error, filters } = useSelector((state: RootState) => state.tasks);
  const { teams } = useSelector((state: RootState) => state.teams);
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

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
      // Try to sync with server (will fail silently if no internet)
      try {
        console.log('TaskListScreen: Attempting to sync with server...');
        await dispatch(performDeltaSync()).unwrap();
        console.log('TaskListScreen: Sync complete');
      } catch (syncError) {
        console.log('TaskListScreen: Sync failed (may be offline), continuing with local data');
        // Continue with local data even if sync fails
      }

      // Load all data first
      await Promise.all([
        dispatch(loadTasks(user.id)),
        dispatch(loadProjects(user.id))
      ]);

      // Process recurring tasks after data is loaded
      console.log('TaskListScreen: Processing recurring tasks...');
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

  const handleCreateTask = () => {
    navigation.navigate('TaskForm', {});
  };

  const handleViewTask = (taskId: string) => {
    navigation.navigate('TaskDetails', { taskId });
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Excluir Tarefa',
      `Tem certeza que deseja excluir "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => dispatch(deleteTask(task.id))
        }
      ]
    );
  };

  const getCategoryDisplayName = (categoryId?: string) => {
    return getCategoryName(categoryId) || null;
  };

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by search term
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }

    // Filter by category
    if (filters.categoryId) {
      filtered = filtered.filter(task => task.categoryId === filters.categoryId);
    }

    // Filter by project
    if (filters.projectId) {
      filtered = filtered.filter(task => task.projectId === filters.projectId);
    }

    // Filter by team
    if (filters.teamId) {
      filtered = filtered.filter(task => task.teamId === filters.teamId);
    }

    // Filter by date range
    if (filters.dateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0); // Set to start of day

      filtered = filtered.filter(task => {
        if (!task.dueDate) return filters.dateRange !== 'overdue';

        // Parse the due date properly, handling YYYY-MM-DD format
        let taskDate: Date;
        if (/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
          const [year, month, day] = task.dueDate.split('-').map(Number);
          taskDate = new Date(year, month - 1, day); // month is 0-indexed
        } else {
          taskDate = new Date(task.dueDate);
        }
        taskDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

        switch (filters.dateRange) {
          case 'today':
            return taskDate.getTime() === today.getTime();
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return taskDate >= weekStart && taskDate <= weekEnd;
          case 'this_month':
            return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
          case 'overdue':
            return taskDate.getTime() < today.getTime() && task.status !== 'concluida';
          default:
            return true;
        }
      });
    }

    // Filter by completion status
    if (filters.completedFilter) {
      switch (filters.completedFilter) {
        case 'completed':
          filtered = filtered.filter(task => task.status === 'concluida');
          break;
        case 'pending':
          filtered = filtered.filter(task => task.status !== 'concluida');
          break;
        // 'all' shows everything, no filter needed
      }
    }

    // Sort by due date, then by priority
    return filtered.sort((a, b) => {
      // First, sort by overdue status
      const aOverdue = a.dueDate && DateUtils.isOverdue(a.dueDate);
      const bOverdue = b.dueDate && DateUtils.isOverdue(b.dueDate);

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        const dateComparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateComparison !== 0) return dateComparison;
      }

      // Finally by priority
      const priorityOrder = { 'alta': 0, 'media': 1, 'baixa': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, filters]);

  const handleFiltersChange = (newFilters: ITaskFilters) => {
    // If it's an empty object, use clearFilters; otherwise use setFilters to replace all filters
    if (Object.keys(newFilters).length === 0) {
      dispatch(clearFilters());
    } else {
      dispatch(setFilters(newFilters));
    }
  };

  const handleExportTasks = async () => {
    try {
      const hasFilters = Object.keys(filters).some(key => {
        const value = filters[key as keyof ITaskFilters];
        return value !== undefined && value !== '';
      });

      if (hasFilters) {
        // Export filtered tasks with description
        const filterParts = [];
        if (filters.searchTerm) filterParts.push(`busca-${filters.searchTerm}`);
        if (filters.status) filterParts.push(TaskStatuses[filters.status].label.toLowerCase());
        if (filters.priority) filterParts.push(TaskPriorities[filters.priority].label.toLowerCase());
        if (filters.dateRange) filterParts.push(filters.dateRange.replace('_', '-'));

        const filterDescription = filterParts.join('-') || 'filtradas';
        await ExportService.exportFilteredTasks(filteredTasks, categories, projects, filterDescription);
      } else {
        // Export all tasks
        await ExportService.exportTasksToCSV(filteredTasks, categories, projects);
      }

      Alert.alert('Sucesso', 'Tarefas exportadas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível exportar as tarefas');
    }
  };

  const renderTask = ({ item }: { item: Task }) => {
    const priority = TaskPriorities[item.priority];
    const status = TaskStatuses[item.status];
    const categoryName = getCategoryDisplayName(item.categoryId);
    const isOverdue = item.dueDate && DateUtils.isOverdue(item.dueDate);

    return (
      <Card style={styles.taskCard} onPress={() => handleViewTask(item.id)}>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              {item.isRecurring && (
                <Ionicons name="repeat" size={14} color={theme.colors.primary} />
              )}
              {item.parentTaskId && (
                <Ionicons name="copy" size={14} color={theme.colors.textSecondary} />
              )}
            </View>
            {categoryName && (
              <Text style={styles.categoryText}>{categoryName}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteTask(item)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>

        {item.description && (
          <Text style={styles.taskDescription}>{item.description}</Text>
        )}

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progresso</Text>
            <Text style={styles.progressText}>{item.progressPercentage}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.progressPercentage}%`,
                  backgroundColor: item.progressPercentage === 100 ? theme.colors.success : theme.colors.primary
                }
              ]}
            />
          </View>
        </View>

        <View style={styles.taskMeta}>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: priority.color }]}>
              <Ionicons name={priority.icon as any} size={12} color={theme.colors.background} />
              <Text style={styles.badgeText}>{priority.label}</Text>
            </View>

            <View style={[styles.badge, { backgroundColor: status.color }]}>
              <Ionicons name={status.icon as any} size={12} color={theme.colors.background} />
              <Text style={styles.badgeText}>{status.label}</Text>
            </View>
          </View>

          {item.dueDate && (
            <Text style={[
              styles.dueDate,
              isOverdue && styles.overdue
            ]}>
              {DateUtils.formatDate(item.dueDate)}
            </Text>
          )}
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>{Strings.noTasks}</Text>
      <Button
        title={Strings.addTask}
        onPress={handleCreateTask}
        style={styles.emptyButton}
      />
    </View>
  );

  if (isLoading && !refreshing) {
    return <LoadingSpinner text="Carregando tarefas..." />;
  }

  const styles = getStyles(theme);

  const quickFilters = [
    { key: 'today', label: 'Hoje', icon: 'today' },
    { key: 'this_week', label: 'Semana', icon: 'calendar' },
    { key: 'overdue', label: 'Atrasadas', icon: 'warning' },
    { key: 'high_priority', label: 'Alta Prioridade', icon: 'flag' },
  ];

  const handleQuickFilter = (filterKey: string) => {
    let newFilters: ITaskFilters = {};

    switch (filterKey) {
      case 'today':
        newFilters = { dateRange: 'today' };
        break;
      case 'this_week':
        newFilters = { dateRange: 'this_week' };
        break;
      case 'overdue':
        newFilters = { dateRange: 'overdue' };
        break;
      case 'high_priority':
        newFilters = { priority: 'alta' };
        break;
    }

    handleFiltersChange(newFilters);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Tarefas</Text>
        <View style={styles.headerActions}>
          <TaskFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            projects={projects}
            teams={teams}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Export')} style={styles.exportButton}>
            <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreateTask} style={styles.addButton}>
            <Ionicons name="add" size={24} color={theme.colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContent}
          style={{ flex: 1 }}
        >
        {quickFilters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.quickFilterButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
            ]}
            onPress={() => handleQuickFilter(filter.key)}
          >
            <Ionicons name={filter.icon as any} size={14} color={theme.colors.text} />
            <Text style={[styles.quickFilterText, { color: theme.colors.text }]}>{filter.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.quickFilterButton,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
          ]}
          onPress={() => dispatch(clearFilters())}
        >
          <Ionicons name="refresh" size={14} color={theme.colors.text} />
          <Text style={[styles.quickFilterText, { color: theme.colors.text }]}>Todos</Text>
        </TouchableOpacity>
        </ScrollView>
      </View>

      {Object.keys(filters).length > 0 && (
        <View style={styles.filtersInfo}>
          <Text style={styles.filtersText}>
            {filteredTasks.length} de {tasks.length} tarefa(s)
            {filters.searchTerm && ` • "${filters.searchTerm}"`}
            {filters.status && ` • ${TaskStatuses[filters.status].label}`}
            {filters.priority && ` • ${TaskPriorities[filters.priority].label}`}
            {filters.categoryId && ` • ${categories.find(c => c.id === filters.categoryId)?.name || 'Categoria'}`}
            {filters.projectId && ` • ${projects.find(p => p.id === filters.projectId)?.name || 'Projeto'}`}
            {filters.teamId && ` • ${teams.find(t => t.id === filters.teamId)?.name || 'Equipe'}`}
          </Text>
          <TouchableOpacity onPress={() => dispatch(clearFilters())}>
            <Text style={styles.clearFilters}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Tentar novamente" onPress={loadData} variant="outline" />
        </View>
      )}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
      />
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filtersText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  clearFilters: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.background,
  },
  dueDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  overdue: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 120,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: theme.colors.danger + '20',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  quickFilters: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    height: 28,
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    alignItems: 'flex-start',
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    height: 26,
  },
  quickFilterText: {
    fontSize: 11,
    fontWeight: '500',
  },
});