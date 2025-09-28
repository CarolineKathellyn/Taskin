import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { loadTasks, deleteTask } from '../../store/slices/taskAsyncThunks';
import { Button, Card, LoadingSpinner } from '../../components/common';
import { Strings, TaskPriorities, TaskStatuses, getCategoryById } from '../../constants';
import { Task } from '../../types';
import { DateUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';

type ProjectDetailRouteProp = RouteProp<RootStackParamList, 'ProjectDetail'>;
type ProjectDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProjectDetailScreen() {
  const navigation = useNavigation<ProjectDetailNavigationProp>();
  const route = useRoute<ProjectDetailRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, projects, isLoading, error } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useTheme();

  const projectId = route.params?.projectId;
  const project = projects.find(p => p.id === projectId);

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
      await dispatch(loadTasks(user.id));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateTask = () => {
    navigation.navigate('TaskForm', { projectId });
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

  const projectTasks = useMemo(() => {
    return tasks.filter(task => task.projectId === projectId);
  }, [tasks, projectId]);

  const projectProgress = useMemo(() => {
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(task => task.progressPercentage === 100);
    return Math.round((completedTasks.length / projectTasks.length) * 100);
  }, [projectTasks]);

  const styles = getStyles(theme);

  const renderTask = ({ item }: { item: Task }) => {
    const priority = TaskPriorities[item.priority];
    const status = TaskStatuses[item.status];
    const isOverdue = item.dueDate && DateUtils.isOverdue(item.dueDate);

    return (
      <Card style={styles.taskCard} onPress={() => handleViewTask(item.id)}>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{item.title}</Text>
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
      <Text style={styles.emptyTitle}>Nenhuma tarefa neste projeto</Text>
      <Text style={styles.emptySubtitle}>
        Adicione tarefas para organizar seu trabalho
      </Text>
      <Button
        title="Adicionar Tarefa"
        onPress={handleCreateTask}
        style={styles.emptyButton}
      />
    </View>
  );

  if (isLoading && !refreshing) {
    return <LoadingSpinner text="Carregando tarefas..." />;
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Projeto não encontrado</Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Project Header */}
      <View style={styles.projectHeader}>
        <View style={styles.projectInfo}>
          <View style={styles.projectTitleRow}>
            <View style={[styles.iconContainer, { backgroundColor: project.color }]}>
              <Ionicons name={project.icon as any} size={24} color={theme.colors.background} />
            </View>
            <View style={styles.projectDetails}>
              <Text style={styles.projectName}>{project.name}</Text>
              {project.categoryId && (() => {
                const category = getCategoryById(project.categoryId);
                return category ? (
                  <View style={styles.categoryContainer}>
                    <Ionicons name={category.icon as any} size={14} color={category.color} />
                    <Text style={[styles.categoryText, { color: category.color }]}>
                      {category.name}
                    </Text>
                  </View>
                ) : null;
              })()}
            </View>
          </View>
          {project.description && (
            <Text style={styles.projectDescription}>{project.description}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleCreateTask} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {/* Project Progress */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Progresso do Projeto</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${projectProgress}%`,
                    backgroundColor: projectProgress === 100 ? theme.colors.success : theme.colors.primary
                  }
                ]}
              />
            </View>
          </View>
          <Text style={styles.progressPercent}>{projectProgress}%</Text>
        </View>
        <Text style={styles.progressSubtext}>
          {projectTasks.filter(t => t.progressPercentage === 100).length} de {projectTasks.length} tarefas concluídas
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Tentar novamente" onPress={loadData} variant="outline" />
        </View>
      )}

      <FlatList
        data={projectTasks}
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectDetails: {
    flex: 1,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  projectDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 52,
    marginTop: 8,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    minWidth: 40,
  },
  progressSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
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
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
});