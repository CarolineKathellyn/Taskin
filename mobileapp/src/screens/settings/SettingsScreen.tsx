import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { performDeltaSync } from '../../store/slices/syncSlice';
import { Button, Card, Input } from '../../components/common';
import { Colors, Strings } from '../../constants';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement, showArrow = true }: SettingItemProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward-outline" size={16} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sync: syncState } = useSelector((state: RootState) => state);
  const { theme, toggleTheme } = useTheme();
  const styles = getStyles(theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Confirmar Logout',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser()).unwrap();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNotifications = () => {
    Alert.alert('Em breve', 'Configurações de notificação serão implementadas em breve.');
  };

  const handleExportData = () => {
    navigation.navigate('Export');
  };

  const handleAbout = () => {
    Alert.alert(
      'Sobre o Taskin',
      'Taskin v1.0.0\n\nGerenciador de tarefas offline-first desenvolvido com React Native e Spring Boot.',
      [{ text: 'OK' }]
    );
  };

  const handleManualSync = async () => {
    try {
      await dispatch(performDeltaSync()).unwrap();
      Alert.alert(
        'Sucesso',
        `Sincronização concluída!\n\nÚltima sincronização: ${syncState.lastSyncAt || 'Nunca'}\nMudanças pendentes: ${syncState.pendingChanges}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        'Erro na Sincronização',
        error.message || 'Não foi possível sincronizar os dados. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
      {/* User Profile Section */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@exemplo.com'}</Text>
          </View>
          <TouchableOpacity onPress={handleEditProfile}>
            <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações Gerais</Text>
        <Card>
          <SettingItem
            icon="moon-outline"
            title="Configurar Tema"
            subtitle="Personalizar aparência do app"
            onPress={() => navigation.navigate('ThemeSettings')}
          />
          <View style={styles.separator} />
          <SettingItem
            icon="notifications-outline"
            title="Notificações"
            subtitle="Configurar lembretes e alertas"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados</Text>
        <Card>
          <SettingItem
            icon="cloud-upload-outline"
            title="Sincronizar Dados"
            subtitle={syncState.isSyncing ? 'Sincronizando...' : `Última sincronização: ${syncState.lastSyncAt || 'Nunca'}`}
            onPress={handleManualSync}
            rightElement={
              syncState.pendingChanges > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{syncState.pendingChanges}</Text>
                </View>
              ) : null
            }
          />
          <View style={styles.separator} />
          <SettingItem
            icon="document-text-outline"
            title="Exportar para PDF"
            subtitle="Gerar relatório PDF das suas tarefas"
            onPress={handleExportData}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sobre</Text>
        <Card>
          <SettingItem
            icon="information-circle-outline"
            title="Sobre o App"
            subtitle="Versão e informações"
            onPress={handleAbout}
          />
          {/* <View style={styles.separator} />
          <SettingItem
            icon="help-circle-outline"
            title="Ajuda e Suporte"
            subtitle="Obter ajuda"
            onPress={() => Alert.alert('Em breve', 'Central de ajuda será implementada.')}
          /> */}
        </Card>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <Button
          title={Strings.logout}
          onPress={handleLogout}
          variant="danger"
          style={styles.logoutButton}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Taskin v1.0.0</Text>
        <Text style={styles.footerText}>Desenvolvido com ❤️</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileCard: {
    margin: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },
  logoutButton: {
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});