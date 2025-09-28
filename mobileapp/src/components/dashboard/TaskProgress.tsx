import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants';

interface TaskProgressProps {
  completed: number;
  total: number;
  title: string;
}

export default function TaskProgress({ completed, total, title }: TaskProgressProps) {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.dark,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: Colors.text,
  },
  stats: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});