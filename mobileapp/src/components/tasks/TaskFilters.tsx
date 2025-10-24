import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { TaskFilters as ITaskFilters, TaskPriority, TaskStatus } from '../../types';
import { TaskPriorities, TaskStatuses, HARDCODED_CATEGORIES } from '../../constants';
import { Button, Input } from '../common';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface TaskFiltersProps {
  filters: ITaskFilters;
  onFiltersChange: (filters: ITaskFilters) => void;
  projects: Array<{ id: string; name: string; color: string }>;
  teams: Array<{ id: string; name: string }>;
}

export default function TaskFilters({ filters, onFiltersChange, projects, teams }: TaskFiltersProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme);
  const [isVisible, setIsVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<ITaskFilters>(filters);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ITaskFilters];
    return value !== undefined && value !== '';
  });

  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof ITaskFilters];
    return value !== undefined && value !== '';
  }).length;

  const handleApplyFilters = () => {
    onFiltersChange(tempFilters);
    setIsVisible(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: ITaskFilters = {};
    setTempFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    setIsVisible(false);
  };

  const handleCancel = () => {
    setTempFilters(filters);
    setIsVisible(false);
  };

  const updateFilter = <K extends keyof ITaskFilters>(key: K, value: ITaskFilters[K]) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderPriorityFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Prioridade</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            !tempFilters.priority && styles.selectedOption
          ]}
          onPress={() => updateFilter('priority', undefined)}
        >
          <Text style={[styles.optionText, !tempFilters.priority && styles.selectedText]}>
            Todas
          </Text>
        </TouchableOpacity>
        {Object.entries(TaskPriorities).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterOption,
              tempFilters.priority === key && styles.selectedOption,
              { borderColor: value.color }
            ]}
            onPress={() => updateFilter('priority', key as TaskPriority)}
          >
            <Ionicons name={value.icon as any} size={14} color={value.color} />
            <Text style={[
              styles.optionText,
              tempFilters.priority === key && styles.selectedText,
              { color: value.color }
            ]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStatusFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Status</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            !tempFilters.status && styles.selectedOption
          ]}
          onPress={() => updateFilter('status', undefined)}
        >
          <Text style={[styles.optionText, !tempFilters.status && styles.selectedText]}>
            Todos
          </Text>
        </TouchableOpacity>
        {Object.entries(TaskStatuses).map(([key, value]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterOption,
              tempFilters.status === key && styles.selectedOption,
              { borderColor: value.color }
            ]}
            onPress={() => updateFilter('status', key as TaskStatus)}
          >
            <Ionicons name={value.icon as any} size={14} color={value.color} />
            <Text style={[
              styles.optionText,
              tempFilters.status === key && styles.selectedText,
              { color: value.color }
            ]}>
              {value.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Categoria</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            !tempFilters.categoryId && styles.selectedOption
          ]}
          onPress={() => updateFilter('categoryId', undefined)}
        >
          <Text style={[styles.optionText, !tempFilters.categoryId && styles.selectedText]}>
            Todas
          </Text>
        </TouchableOpacity>
        {HARDCODED_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterOption,
              tempFilters.categoryId === category.id && styles.selectedOption,
              { borderColor: category.color }
            ]}
            onPress={() => updateFilter('categoryId', category.id)}
          >
            <Ionicons name={category.icon as any} size={14} color={category.color} />
            <Text style={[
              styles.optionText,
              tempFilters.categoryId === category.id && styles.selectedText,
              { color: category.color }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderProjectFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Projeto</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            !tempFilters.projectId && styles.selectedOption
          ]}
          onPress={() => updateFilter('projectId', undefined)}
        >
          <Text style={[styles.optionText, !tempFilters.projectId && styles.selectedText]}>
            Todos
          </Text>
        </TouchableOpacity>
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.filterOption,
              tempFilters.projectId === project.id && styles.selectedOption,
              { borderColor: project.color }
            ]}
            onPress={() => updateFilter('projectId', project.id)}
          >
            <View style={[styles.categoryDot, { backgroundColor: project.color }]} />
            <Text style={[
              styles.optionText,
              tempFilters.projectId === project.id && styles.selectedText
            ]}>
              {project.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTeamFilter = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Equipe</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.filterOption,
            !tempFilters.teamId && styles.selectedOption
          ]}
          onPress={() => updateFilter('teamId', undefined)}
        >
          <Text style={[styles.optionText, !tempFilters.teamId && styles.selectedText]}>
            Todas
          </Text>
        </TouchableOpacity>
        {teams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={[
              styles.filterOption,
              tempFilters.teamId === team.id && styles.selectedOption
            ]}
            onPress={() => updateFilter('teamId', team.id)}
          >
            <Ionicons name="people" size={14} color={theme.colors.primary} />
            <Text style={[
              styles.optionText,
              tempFilters.teamId === team.id && styles.selectedText
            ]}>
              {team.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <TouchableOpacity style={styles.filterButton} onPress={() => setIsVisible(true)}>
        <Ionicons name="filter-outline" size={20} color={theme.colors.primary} />
        <Text style={styles.filterButtonText}>Filtros</Text>
        {activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }} showsVerticalScrollIndicator={false}>
            <Input
              label="Buscar por título"
              placeholder="Digite para buscar..."
              value={tempFilters.searchTerm || ''}
              onChangeText={(text) => updateFilter('searchTerm', text)}
              leftIcon="search-outline"
            />

            {renderStatusFilter()}
            {renderPriorityFilter()}
            {renderCategoryFilter()}
            {renderProjectFilter()}
            {renderTeamFilter()}
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <Button
              title="Limpar"
              onPress={handleClearFilters}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              title="Aplicar"
              onPress={handleApplyFilters}
              style={styles.footerButton}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  filterBadge: {
    marginLeft: 6,
    backgroundColor: theme.colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text,
  },
  selectedText: {
    color: theme.colors.background,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerButton: {
    flex: 1,
  },
});