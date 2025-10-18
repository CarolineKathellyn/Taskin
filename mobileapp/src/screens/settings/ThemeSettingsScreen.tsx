import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/common';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

interface ThemeOption {
  id: ThemeMode;
  title: string;
  description: string;
  icon: string;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    title: 'Claro',
    description: 'Sempre usar tema claro',
    icon: 'sunny-outline',
  },
  {
    id: 'dark',
    title: 'Escuro',
    description: 'Sempre usar tema escuro',
    icon: 'moon-outline',
  },
  {
    id: 'system',
    title: 'Sistema',
    description: 'Seguir configuração do sistema',
    icon: 'phone-portrait-outline',
  },
];

export default function ThemeSettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Escolha como você prefere ver o aplicativo. O tema pode ser alterado a qualquer momento.
      </Text>

      <Card style={styles.card}>
        {themeOptions.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.option,
              index < themeOptions.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border + '40',
              },
            ]}
            onPress={() => handleThemeSelect(option.id)}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                  {option.title}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
            </View>
            {themeMode === option.id && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </Card>

      <Card style={styles.previewCard}>
        <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
          Pré-visualização
        </Text>
        <View style={styles.previewContent}>
          <View style={[styles.previewItem, { backgroundColor: theme.colors.background }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewDot, { backgroundColor: theme.colors.primary }]} />
              <Text style={[styles.previewText, { color: theme.colors.text }]}>
                Tarefa de Exemplo
              </Text>
            </View>
            <Text style={[styles.previewSubtext, { color: theme.colors.textSecondary }]}>
              Esta é uma tarefa de exemplo mostrando como o tema aparece
            </Text>
            <View style={styles.previewProgress}>
              <View style={[styles.previewProgressTrack, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.previewProgressFill,
                    { backgroundColor: theme.colors.primary, width: '60%' },
                  ]}
                />
              </View>
              <Text style={[styles.previewProgressText, { color: theme.colors.text }]}>
                60%
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          O tema será aplicado imediatamente em todo o aplicativo.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
  },
  previewCard: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  previewContent: {
    padding: 8,
  },
  previewItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewSubtext: {
    fontSize: 12,
    marginBottom: 12,
  },
  previewProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  previewProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  previewProgressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 30,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});