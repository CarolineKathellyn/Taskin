import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Card, Button } from '../../components/common';
import { Config } from '../../constants';
import { useNotifications } from '../../hooks/useNotifications';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface NotificationSettings {
  taskReminders: boolean;
  taskCompletions: boolean;
  projectDeadlines: boolean;
  projectCompletions: boolean;
  reminderHours: number;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  taskReminders: true,
  taskCompletions: true,
  projectDeadlines: true,
  projectCompletions: true,
  reminderHours: 1,
};

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { expoPushToken, cancelAllNotifications, reloadSettings } = useNotifications();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(Config.storageKeys.notificationSettings);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem(Config.storageKeys.notificationSettings, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('Notification settings saved:', newSettings);

      // Reload settings in the notification service to sync the changes
      await reloadSettings();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Limpar Notificações',
      'Tem certeza que deseja cancelar todas as notificações agendadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            await cancelAllNotifications();
            Alert.alert('Sucesso', 'Todas as notificações foram canceladas');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando configurações...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Tarefas</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Lembretes de Prazo</Text>
            <Text style={styles.settingDescription}>
              Receba notificações 1 hora antes do prazo
            </Text>
          </View>
          <Switch
            value={settings.taskReminders}
            onValueChange={(value) => updateSetting('taskReminders', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={settings.taskReminders ? theme.colors.primary : theme.colors.disabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Conclusão de Tarefas</Text>
            <Text style={styles.settingDescription}>
              Receba parabéns quando completar uma tarefa
            </Text>
          </View>
          <Switch
            value={settings.taskCompletions}
            onValueChange={(value) => updateSetting('taskCompletions', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={settings.taskCompletions ? theme.colors.primary : theme.colors.disabled}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="folder" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Projetos</Text>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Prazos de Projeto</Text>
            <Text style={styles.settingDescription}>
              Receba lembretes sobre prazos de projetos
            </Text>
          </View>
          <Switch
            value={settings.projectDeadlines}
            onValueChange={(value) => updateSetting('projectDeadlines', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={settings.projectDeadlines ? theme.colors.primary : theme.colors.disabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Conclusão de Projetos</Text>
            <Text style={styles.settingDescription}>
              Receba parabéns quando completar um projeto
            </Text>
          </View>
          <Switch
            value={settings.projectCompletions}
            onValueChange={(value) => updateSetting('projectCompletions', value)}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
            thumbColor={settings.projectCompletions ? theme.colors.primary : theme.colors.disabled}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Gerenciar</Text>
        </View>

        <Button
          title="Cancelar Todas as Notificações"
          onPress={handleClearAllNotifications}
          variant="outline"
          style={styles.clearButton}
        />
      </Card>
    </ScrollView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginTop: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  tokenText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 8,
    backgroundColor: theme.colors.border + '40',
    padding: 8,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '40',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  clearButton: {
    marginTop: 8,
  },
});