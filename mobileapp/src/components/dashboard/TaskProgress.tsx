import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface TaskProgressProps {
  completed: number;
  total: number;
  title: string;
}

export default function TaskProgress({ completed, total, title }: TaskProgressProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.stats}>
          {completed}/{total} ({Math.round(percentage)}%)
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%` }]} />
      </View>

      <View style={styles.labels}>
        <Text style={styles.label}>Concluídas: {completed}</Text>
        <Text style={styles.label}>Pendentes: {total - completed}</Text>
      </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  stats: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});