import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { loadProjects, deleteProject } from '../../store/slices/projectAsyncThunks';
import { loadTasks } from '../../store/slices/taskAsyncThunks';
import { Button, Card, LoadingSpinner } from '../../components/common';
import { Strings, getCategoryById } from '../../constants';
import { Project } from '../../types';
import { useTheme, Theme } from '../../contexts/ThemeContext';

type ProjectListNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProjectListScreen() {
  const navigation = useNavigation<ProjectListNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { projects, tasks, isLoading, error } = useSelector((state: RootState) => state.tasks);
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
      await Promise.all([
        dispatch(loadProjects(user.id)),
        dispatch(loadTasks(user.id))
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    navigation.navigate('ProjectForm', {});
  };

  const handleViewProject = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const handleEditProject = (projectId: string) => {
    navigation.navigate('ProjectForm', { projectId });
  };

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId).length;
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Excluir Projeto',
      `Tem certeza que deseja excluir "${project.name}"?\n\nTodas as tarefas deste projeto perderão a associação com ele.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => dispatch(deleteProject(project.id))
        }
      ]
    );
  };

  const renderProject = ({ item }: { item: Project }) => {
    const taskCount = getProjectTaskCount(item.id);
    const category = item.categoryId ? getCategoryById(item.categoryId) : null;

    return (
      <Card style={styles.projectCard} onPress={() => handleViewProject(item.id)}>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <View style={styles.projectTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={20} color={theme.colors.background} />
              </View>
              <Text style={styles.projectName}>{item.name}</Text>
            </View>
            {item.description && (
              <Text style={styles.projectDescription}>{item.description}</Text>
            )}
            <View style={styles.projectMeta}>
              <View style={styles.taskCountContainer}>
                <Ionicons name="list-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.taskCount}>
                  {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
                </Text>
              </View>
              {category && (
                <View style={styles.categoryContainer}>
                  <Ionicons name={category.icon as any} size={14} color={category.color} />
                  <Text style={[styles.categoryText, { color: category.color }]}>
                    {category.name}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.projectActions}>
            <TouchableOpacity
              onPress={() => handleEditProject(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteProject(item)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>Nenhum projeto criado</Text>
      <Text style={styles.emptySubtitle}>
        Organize suas tarefas criando projetos
      </Text>
      <Button
        title="Criar Projeto"
        onPress={handleCreateProject}
        style={styles.emptyButton}
      />
    </View>
  );

  if (isLoading && !refreshing) {
    return <LoadingSpinner text="Carregando projetos..." />;
  }

  const styles = getStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Projetos</Text>
        <TouchableOpacity onPress={handleCreateProject} style={styles.addButton}>
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Tentar novamente" onPress={loadData} variant="outline" />
        </View>
      )}

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProject}
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
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  projectCard: {
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 44,
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 44,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  taskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
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