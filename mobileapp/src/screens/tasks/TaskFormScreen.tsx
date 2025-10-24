import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { createTask, updateTask } from '../../store/slices/taskAsyncThunks';
import { loadProjects } from '../../store/slices/projectAsyncThunks';
import { Button, Input, LoadingSpinner, DatePicker } from '../../components/common';
import { AttachmentPicker, AttachmentList } from '../../components/attachments';
import { Colors, Strings, TaskPriorities, TaskStatuses, CategoryColors, HARDCODED_CATEGORIES } from '../../constants';
import { Task, TaskPriority, TaskStatus, TaskAttachment } from '../../types';
import { ValidationUtils, DateUtils } from '../../utils';
import { useNotifications } from '../../hooks/useNotifications';
import { RecurringTaskService } from '../../services/RecurringTaskService';
import { useTheme, Theme } from '../../contexts/ThemeContext';

type TaskFormRouteProp = RouteProp<RootStackParamList, 'TaskForm'>;

export default function TaskFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<TaskFormRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, projects, isLoading } = useSelector((state: RootState) => state.tasks);
  const { teams } = useSelector((state: RootState) => state.teams);
  const { user } = useSelector((state: RootState) => state.auth);
  const { scheduleTaskReminder, notifyTaskCompleted } = useNotifications();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme);

  const taskId = route.params?.taskId;
  const routeProjectId = route.params?.projectId;
  const isEditing = !!taskId;
  const existingTask = tasks.find(task => task.id === taskId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [status, setStatus] = useState<TaskStatus>('pendente');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [teamId, setTeamId] = useState<string | undefined>();
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  const [titleError, setTitleError] = useState('');
  const [dueDateError, setDueDateError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(loadProjects(user.id));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (isEditing && existingTask) {
      setTitle(existingTask.title);
      setDescription(existingTask.description || '');
      setNotes(existingTask.notes || '');
      setPriority(existingTask.priority);
      setStatus(existingTask.status);
      setDueDate(existingTask.dueDate || '');
      setCategoryId(existingTask.categoryId);
      setProjectId(existingTask.projectId);
      setTeamId(existingTask.teamId);
      setProgressPercentage(existingTask.progressPercentage);
      setIsRecurring(existingTask.isRecurring || false);
      setRecurrencePattern(existingTask.recurrencePattern || 'weekly');
      setAttachments(existingTask.attachments || []);
    } else if (routeProjectId) {
      // Pre-select project when creating task from project screen
      setProjectId(routeProjectId);

      // Also pre-select team if project belongs to a team
      const selectedProject = projects.find(p => p.id === routeProjectId);
      if (selectedProject && selectedProject.teamId) {
        setTeamId(selectedProject.teamId);
        console.log(`[TaskForm] Auto-selected team ${selectedProject.teamId} from project`);
      }
    }
  }, [isEditing, existingTask, routeProjectId, projects]);

  const handleAttachmentAdded = (attachment: TaskAttachment) => {
    setAttachments([...attachments, attachment]);
  };

  const handleAttachmentDeleted = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const validateForm = (): boolean => {
    let isValid = true;
    setTitleError('');
    setDueDateError('');

    console.log('Validating form...');
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Due date:', dueDate);

    try {
      ValidationUtils.validateRequired(title, 'Título');
      if (!ValidationUtils.isValidTaskTitle(title)) {
        throw new Error('Título deve ter entre 1 e 100 caracteres');
      }
      console.log('Title validation passed');
    } catch (error: any) {
      console.log('Title validation failed:', error.message);
      setTitleError(error.message);
      isValid = false;
    }

    if (description && !ValidationUtils.isValidTaskDescription(description)) {
      console.log('Description validation failed');
      isValid = false;
    }

    // Validate due date - now required for all tasks
    if (!dueDate) {
      console.log('Due date is required for all tasks');
      setDueDateError('Data de vencimento é obrigatória');
      isValid = false;
    } else if (!DateUtils.isValidDate(dueDate)) {
      console.log('Date validation failed');
      setDueDateError('Data inválida');
      isValid = false;
    } else {
      setDueDateError('');
    }

    console.log('Form validation result:', isValid);
    return isValid;
  };

  const handleSave = async () => {
    console.log('Save button pressed');
    console.log('Title:', title);
    console.log('User:', user);

    if (saving) {
      console.log('Already saving, ignoring click');
      return;
    }

    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      return;
    }

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed, saving task...');
    setSaving(true);

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        priority,
        status,
        dueDate: dueDate, // Now required - validation ensures this is not empty
        categoryId,
        projectId,
        teamId, // Include team ID for sharing
        progressPercentage,
        userId: user.id,
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        attachments: attachments,
      };

      console.log('Task data:', taskData);

      let result;
      if (isEditing && taskId) {
        console.log('Updating task:', taskId);
        result = await dispatch(updateTask({ id: taskId, updates: taskData })).unwrap();
        console.log('Update result:', result);

        // Check if task was completed
        if (existingTask?.progressPercentage !== 100 && progressPercentage === 100) {
          await notifyTaskCompleted(title, taskId);
        }
      } else {
        console.log('Creating new task');
        result = await dispatch(createTask(taskData)).unwrap();
        console.log('Create result:', result);
      }

      // Schedule reminder for new or updated tasks with due dates
      if (dueDate && progressPercentage < 100) {
        const dueDateObj = new Date(dueDate);
        await scheduleTaskReminder(title, dueDateObj, result.id || taskId);
      }

      console.log('Task saved successfully');
      navigation.goBack();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Erro', error.message || 'Erro ao salvar tarefa');
    } finally {
      setSaving(false);
    }
  };

  const renderPrioritySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Prioridade *</Text>
      <View style={styles.optionsContainer}>
        {Object.entries(TaskPriorities).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              priority === key && styles.selectedOption,
              { borderColor: value.color }
            ]}
            onPress={() => setPriority(key as TaskPriority)}
          >
            <Ionicons name={value.icon as any} size={16} color={value.color} />
            <Text style={[styles.optionText, { color: value.color }]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatusSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Status</Text>
      <View style={styles.optionsContainer}>
        {Object.entries(TaskStatuses).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.option,
              status === key && styles.selectedOption,
              { borderColor: value.color }
            ]}
            onPress={() => setStatus(key as TaskStatus)}
          >
            <Ionicons name={value.icon as any} size={16} color={value.color} />
            <Text style={[styles.optionText, { color: value.color }]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Categoria</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            !categoryId && styles.selectedOption
          ]}
          onPress={() => setCategoryId(undefined)}
        >
          <Text style={styles.optionText}>Nenhuma</Text>
        </TouchableOpacity>
        {HARDCODED_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.option,
              categoryId === category.id && styles.selectedOption,
              { borderColor: category.color }
            ]}
            onPress={() => setCategoryId(category.id)}
          >
            <Ionicons name={category.icon as any} size={16} color={category.color} />
            <Text style={[styles.optionText, { color: category.color }]}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProjectSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Projeto</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            !projectId && styles.selectedOption
          ]}
          onPress={() => setProjectId(undefined)}
        >
          <Text style={styles.optionText}>Nenhum</Text>
        </TouchableOpacity>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.option,
              projectId === project.id && styles.selectedOption,
              { borderColor: project.color }
            ]}
            onPress={() => setProjectId(project.id)}
          >
            <View style={[styles.categoryDot, { backgroundColor: project.color }]} />
            <Text style={styles.optionText}>{project.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTeamSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Equipe</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            !teamId && styles.selectedOption
          ]}
          onPress={() => setTeamId(undefined)}
        >
          <Ionicons name="person-outline" size={16} color={theme.colors.text} />
          <Text style={styles.optionText}>Pessoal</Text>
        </TouchableOpacity>
        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={[
              styles.option,
              teamId === team.id && styles.selectedOption,
              { borderColor: Colors.info }
            ]}
            onPress={() => setTeamId(team.id)}
          >
            <Ionicons name="people" size={16} color={Colors.info} />
            <Text style={styles.optionText}>{team.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProgressSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Progresso: {progressPercentage}%</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressSliderContainer}>
          <TouchableOpacity
            style={styles.progressButton}
            onPress={() => setProgressPercentage(Math.max(0, progressPercentage - 10))}
          >
            <Ionicons name="remove" size={20} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progressPercentage}%</Text>
          </View>

          <TouchableOpacity
            style={styles.progressButton}
            onPress={() => setProgressPercentage(Math.min(100, progressPercentage + 10))}
          >
            <Ionicons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressPresets}>
          {[0, 25, 50, 75, 100].map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                progressPercentage === preset && styles.selectedPreset
              ]}
              onPress={() => setProgressPercentage(preset)}
            >
              <Text style={[
                styles.presetText,
                progressPercentage === preset && styles.selectedPresetText
              ]}>
                {preset}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderRecurringSelector = () => (
    <View style={styles.selectorContainer}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorLabel}>Tarefa Recorrente</Text>
        <TouchableOpacity
          style={[styles.toggleButton, isRecurring && styles.toggleButtonActive]}
          onPress={() => setIsRecurring(!isRecurring)}
        >
          <Text style={[styles.toggleText, isRecurring && styles.toggleTextActive]}>
            {isRecurring ? 'Ativado' : 'Desativado'}
          </Text>
        </TouchableOpacity>
      </View>

      {isRecurring && (
        <View style={styles.recurrencePatternContainer}>
          <Text style={styles.selectorSubLabel}>Repetir:</Text>
          <View style={styles.recurrenceOptions}>
            {(['daily', 'weekly', 'monthly'] as const).map((pattern) => (
              <TouchableOpacity
                key={pattern}
                style={[
                  styles.recurrenceOption,
                  recurrencePattern === pattern && styles.recurrenceOptionActive
                ]}
                onPress={() => setRecurrencePattern(pattern)}
              >
                <Text style={[
                  styles.recurrenceOptionText,
                  recurrencePattern === pattern && styles.recurrenceOptionTextActive
                ]}>
                  {RecurringTaskService.getRecurrenceLabel(pattern)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {dueDate && (
            <Text style={styles.recurrenceHint}>
              Próxima ocorrência: {DateUtils.formatDate(
                RecurringTaskService.calculateNextDueDate(dueDate, recurrencePattern)
              )}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner text="Carregando..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <Input
          label={Strings.taskTitle}
          placeholder="Digite o título da tarefa"
          value={title}
          onChangeText={setTitle}
          error={titleError}
          required
        />

        <Input
          label={Strings.taskDescription}
          placeholder="Descreva a tarefa (opcional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Input
          label="Notas"
          placeholder="Adicione notas ou observações (opcional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <DatePicker
          label={Strings.dueDate}
          placeholder="Selecionar data de vencimento (obrigatório)"
          value={dueDate}
          onDateChange={setDueDate}
          error={dueDateError}
          required={true}
        />

        {renderPrioritySelector()}
        {isEditing && renderStatusSelector()}
        {renderCategorySelector()}
        {renderProjectSelector()}
        {renderTeamSelector()}
        {isEditing && renderProgressSelector()}
        {renderRecurringSelector()}

        {/* Attachments section - only show if editing (task already created) */}
        {isEditing && taskId && (
          <>
            <AttachmentList
              attachments={attachments}
              onDelete={handleAttachmentDeleted}
            />
            <AttachmentPicker
              taskId={taskId}
              onAttachmentAdded={handleAttachmentAdded}
            />
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title={Strings.cancel}
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={Strings.save}
            onPress={handleSave}
            loading={saving || isLoading}
            disabled={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 6,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  progressContainer: {
    gap: 16,
  },
  progressSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  selectedPreset: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  selectedPresetText: {
    color: theme.colors.background,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorSubLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  toggleTextActive: {
    color: theme.colors.background,
  },
  recurrencePatternContainer: {
    marginTop: 8,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  recurrenceOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  recurrenceOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  recurrenceOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  recurrenceOptionTextActive: {
    color: theme.colors.background,
  },
  recurrenceHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});