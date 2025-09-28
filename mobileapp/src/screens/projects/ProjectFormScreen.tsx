import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { createProject, updateProject } from '../../store/slices/projectAsyncThunks';
import { Button, Input, LoadingSpinner } from '../../components/common';
import { Colors, Strings, CategoryColors, ProjectIcons, HARDCODED_CATEGORIES } from '../../constants';
import { Project } from '../../types';
import { ValidationUtils } from '../../utils';

type ProjectFormRouteProp = RouteProp<RootStackParamList, 'ProjectForm'>;

export default function ProjectFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<ProjectFormRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { projects, isLoading } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);

  const projectId = route.params?.projectId;
  const isEditing = !!projectId;
  const existingProject = projects.find(project => project.id === projectId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(CategoryColors[0]);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState<string>('briefcase');

  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && existingProject) {
      setName(existingProject.name);
      setDescription(existingProject.description || '');
      setColor(existingProject.color);
      setCategoryId(existingProject.categoryId);
      setIcon(existingProject.icon || 'briefcase');
    }
  }, [isEditing, existingProject]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!ValidationUtils.isValidTaskTitle(name)) {
      setNameError('Nome do projeto é obrigatório');
      isValid = false;
    } else {
      setNameError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (saving) return;

    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado. Faça login novamente.');
      return;
    }

    if (!validateForm()) return;

    setSaving(true);

    try {
      const projectData = {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        categoryId,
        icon,
        userId: user.id,
      };

      if (isEditing && projectId) {
        await dispatch(updateProject({ id: projectId, updates: projectData })).unwrap();
      } else {
        await dispatch(createProject(projectData)).unwrap();
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Erro', error.message || 'Erro ao salvar projeto');
    } finally {
      setSaving(false);
    }
  };

  const renderCategorySelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Categoria</Text>
      <View style={styles.optionsGrid}>
        <TouchableOpacity
          style={[
            styles.categoryOption,
            !categoryId && styles.selectedOption
          ]}
          onPress={() => setCategoryId(undefined)}
        >
          <Text style={[styles.optionText, !categoryId && styles.selectedText]}>Nenhuma</Text>
        </TouchableOpacity>
        {HARDCODED_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryOption,
              categoryId === category.id && styles.selectedOption,
              { borderColor: category.color }
            ]}
            onPress={() => setCategoryId(category.id)}
          >
            <Ionicons name={category.icon as any} size={16} color={category.color} />
            <Text style={[
              styles.optionText,
              categoryId === category.id && styles.selectedText,
              { color: category.color }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderIconSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Ícone *</Text>
      <View style={styles.iconGrid}>
        {ProjectIcons.map((iconOption) => (
          <TouchableOpacity
            key={iconOption.name}
            style={[
              styles.iconOption,
              icon === iconOption.name && styles.selectedIcon
            ]}
            onPress={() => setIcon(iconOption.name)}
          >
            <Ionicons name={iconOption.name as any} size={20} color={icon === iconOption.name ? Colors.background : Colors.text} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.selectedIconLabel}>
        {ProjectIcons.find(i => i.name === icon)?.label || 'Briefcase'}
      </Text>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Cor *</Text>
      <View style={styles.colorGrid}>
        {CategoryColors.map((colorOption) => (
          <TouchableOpacity
            key={colorOption}
            style={[
              styles.colorOption,
              { backgroundColor: colorOption },
              color === colorOption && styles.selectedColor,
            ]}
            onPress={() => setColor(colorOption)}
          >
            {color === colorOption && (
              <Ionicons name="checkmark" size={16} color={Colors.background} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading && isEditing && !existingProject) {
    return <LoadingSpinner text="Carregando projeto..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Input
            label="Nome do projeto *"
            value={name}
            onChangeText={setName}
            placeholder="Digite o nome do projeto"
            error={nameError}
            maxLength={100}
          />

          <Input
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Digite uma descrição (opcional)"
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          {renderCategorySelector()}
          {renderIconSelector()}
          {renderColorSelector()}
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 16,
    flex: 1,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: Colors.text,
    borderWidth: 3,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 6,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedText: {
    color: Colors.background,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIcon: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectedIconLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});