import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { updateTask, deleteTask } from '../../store/slices/taskAsyncThunks';
import { Button, Card, LoadingSpinner } from '../../components/common';
import { TaskPriorities, TaskStatuses } from '../../constants';
import { HARDCODED_CATEGORIES } from '../../constants/Categories';
import { Task } from '../../types';
import { DateUtils } from '../../utils';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import { RecurringTaskService } from '../../services/RecurringTaskService';
import { createTask } from '../../store/slices/taskAsyncThunks';

type TaskDetailsRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

export default function TaskDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<TaskDetailsRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, projects } = useSelector((state: RootState) => state.tasks);
  const { notifyTaskCompleted } = useNotifications();
  const { theme } = useTheme();

  const taskId = route.params?.taskId;
  const task = tasks.find(t => t.id === taskId);
  const [updating, setUpdating] = useState(false);

  const category = useMemo(() => {
    return task?.categoryId ? HARDCODED_CATEGORIES.find(c => c.id === task.categoryId) : null;
  }, [task?.categoryId]);

  const project = useMemo(() => {
    return task?.projectId ? projects.find(p => p.id === task.projectId) : null;
  }, [task?.projectId, projects]);

  const priority = task ? TaskPriorities[task.priority] : null;
  const status = task ? TaskStatuses[task.status] : null;
  const isOverdue = task?.dueDate && DateUtils.isOverdue(task.dueDate);

  const styles = getStyles(theme);

  const handleProgressChange = async (newProgress: number) => {
    if (!task) return;

    setUpdating(true);
    try {
      const wasCompleted = task.progressPercentage === 100;
      const isNowCompleted = newProgress === 100;

      await dispatch(updateTask({
        id: task.id,
        updates: {
          progressPercentage: newProgress,
          status: newProgress === 100 ? 'concluida' :
                 newProgress > 0 ? 'em_progresso' : 'pendente',
          completedAt: newProgress === 100 ? DateUtils.getCurrentISOString() : undefined
        }
      })).unwrap();

      // Notify when task is completed
      if (!wasCompleted && isNowCompleted) {
        await notifyTaskCompleted(task.title, task.id);

        // Create next recurring instance if applicable
        // Use updated task data with the new status for the check
        const updatedTask = {
          ...task,
          status: 'concluida' as const,
          progressPercentage: 100,
          completedAt: DateUtils.getCurrentISOString()
        };

        console.log('Checking if recurring instance should be created:', {
          isRecurring: updatedTask.isRecurring,
          recurrencePattern: updatedTask.recurrencePattern,
          status: updatedTask.status,
          parentTaskId: updatedTask.parentTaskId
        });

        if (RecurringTaskService.shouldCreateNextInstance(updatedTask)) {
          try {
            const nextInstance = RecurringTaskService.createRecurringInstance(updatedTask);
            await dispatch(createTask(nextInstance));
            console.log('Successfully created next recurring task instance');
          } catch (error) {
            console.error('Error creating recurring task instance:', error);
            // Don't show error to user as the main task was completed successfully
          }
        } else {
          console.log('No recurring instance created - conditions not met');
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o progresso');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('TaskForm', { taskId: task?.id });
  };

  const handleDelete = () => {
    if (!task) return;

    Alert.alert(
      'Excluir Tarefa',
      `Tem certeza que deseja excluir "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTask(task.id));
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a tarefa');
            }
          }
        }
      ]
    );
  };

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tarefa não encontrada</Text>
        <Button
          title="Voltar"
          onPress={() => navigation.goBack()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{task.title}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
              <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Progress Section */}
      <Card style={styles.progressCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Progresso</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: theme.colors.text }]}>
              {task.progressPercentage}%
            </Text>
            <Text style={[styles.progressStatus, {
              color: task.progressPercentage === 100 ? theme.colors.success : theme.colors.textSecondary
            }]}>
              {task.progressPercentage === 100 ? 'Concluída' : 'Em andamento'}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${task.progressPercentage}%`,
                  backgroundColor: task.progressPercentage === 100 ? theme.colors.success : theme.colors.primary
                }
              ]}
            />
          </View>

          <View style={styles.progressControls}>
            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => handleProgressChange(Math.max(0, task.progressPercentage - 10))}
              disabled={updating}
            >
              <Ionicons name="remove" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            <View style={styles.progressPresets}>
              {[0, 25, 50, 75, 100].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    task.progressPercentage === preset && styles.selectedPreset
                  ]}
                  onPress={() => handleProgressChange(preset)}
                  disabled={updating}
                >
                  <Text style={[
                    styles.presetText,
                    { color: task.progressPercentage === preset ? theme.colors.background : theme.colors.text }
                  ]}>
                    {preset}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => handleProgressChange(Math.min(100, task.progressPercentage + 10))}
              disabled={updating}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Task Details */}
      <Card style={styles.detailsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detalhes</Text>

        {task.description && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Descrição</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{task.description}</Text>
          </View>
        )}

        {task.notes && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Notas</Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>{task.notes}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Prioridade</Text>
          <View style={styles.priorityContainer}>
            <Ionicons name={priority?.icon as any} size={16} color={priority?.color} />
            <Text style={[styles.detailValue, { color: priority?.color }]}>
              {priority?.label}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Status</Text>
          <View style={styles.statusContainer}>
            <Ionicons name={status?.icon as any} size={16} color={status?.color} />
            <Text style={[styles.detailValue, { color: status?.color }]}>
              {status?.label}
            </Text>
          </View>
        </View>

        {task.dueDate && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Prazo</Text>
            <Text style={[
              styles.detailValue,
              { color: isOverdue ? theme.colors.danger : theme.colors.text }
            ]}>
              {DateUtils.formatDate(task.dueDate)}
              {isOverdue && ' (Atrasada)'}
            </Text>
          </View>
        )}

        {category && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Categoria</Text>
            <View style={styles.categoryContainer}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{category.name}</Text>
            </View>
          </View>
        )}

        {project && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Projeto</Text>
            <View style={styles.projectContainer}>
              <View style={[styles.categoryDot, { backgroundColor: project.color }]} />
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{project.name}</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Criada em</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {DateUtils.formatDate(task.createdAt)}
          </Text>
        </View>

        {task.completedAt && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Concluída em</Text>
            <Text style={[styles.detailValue, { color: theme.colors.success }]}>
              {DateUtils.formatDate(task.completedAt)}
            </Text>
          </View>
        )}

        {task.isRecurring && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Recorrência</Text>
            <View style={styles.recurringContainer}>
              <Ionicons name="repeat" size={16} color={theme.colors.primary} />
              <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
                {RecurringTaskService.getRecurrenceLabel(task.recurrencePattern)}
              </Text>
            </View>
          </View>
        )}

        {task.parentTaskId && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Instância de tarefa recorrente</Text>
            <View style={styles.recurringContainer}>
              <Ionicons name="copy" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                Tarefa repetida automaticamente
              </Text>
            </View>
          </View>
        )}
      </Card>

      {updating && <LoadingSpinner text="Atualizando progresso..." />}
    </ScrollView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
  },
  progressCard: {
    margin: 16,
  },
  detailsCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressContainer: {
    gap: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressStatus: {
    fontSize: 14,
    fontWeight: '500',
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
  progressControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPresets: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  presetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.border,
  },
  selectedPreset: {
    backgroundColor: theme.colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  recurringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});