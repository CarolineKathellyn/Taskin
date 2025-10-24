import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { AppDispatch, RootState } from '../../store';
import { updateUser, changePassword } from '../../store/slices/authSlice';
import { Button, Input } from '../../components/common';
import { Strings } from '../../constants';
import { ValidationUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme);
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const validateForm = (): boolean => {
    let isValid = true;

    if (!ValidationUtils.isValidTaskTitle(name)) {
      setNameError('Nome é obrigatório');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!ValidationUtils.isValidEmail(email)) {
      setEmailError('Email inválido');
      isValid = false;
    } else {
      setEmailError('');
    }

    return isValid;
  };

  const validatePasswordForm = (): boolean => {
    let isValid = true;

    if (!currentPassword) {
      setCurrentPasswordError('Senha atual é obrigatória');
      isValid = false;
    } else {
      setCurrentPasswordError('');
    }

    if (!newPassword || newPassword.length < 6) {
      setNewPasswordError('Nova senha deve ter pelo menos 6 caracteres');
      isValid = false;
    } else {
      setNewPasswordError('');
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Confirmação de senha é obrigatória');
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Senhas não conferem');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    return isValid;
  };

  const handleSave = async () => {
    if (saving) return;

    if (!validateForm()) return;

    setSaving(true);

    try {
      await dispatch(updateUser({
        name: name.trim(),
        email: email.trim(),
      })).unwrap();

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Erro', error || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (changingPassword) return;

    if (!validatePasswordForm()) return;

    setChangingPassword(true);

    try {
      await dispatch(changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })).unwrap();

      Alert.alert('Sucesso', 'Senha alterada com sucesso!');

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert('Erro', error || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setNameError('');
      setEmailError('');
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.form}>
          <Text style={styles.title}>Editar Perfil</Text>
          <Text style={styles.subtitle}>
            Atualize suas informações pessoais
          </Text>

          <Input
            label="Nome *"
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            error={nameError}
            maxLength={100}
            leftIcon="person-outline"
          />

          <Input
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="Digite seu email"
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⚠️ Alterações no email podem afetar o login na próxima sessão.
            </Text>
          </View>

          {/* Password Change Section */}
          <View style={styles.passwordSection}>
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
              <Text style={styles.passwordToggleText}>Alterar Senha</Text>
              <Ionicons
                name={showPasswordSection ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            {showPasswordSection && (
              <View style={styles.passwordForm}>
                <Input
                  label="Senha Atual *"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Digite sua senha atual"
                  error={currentPasswordError}
                  secureTextEntry
                  leftIcon="lock-closed-outline"
                />

                <Input
                  label="Nova Senha *"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Digite a nova senha (min. 6 caracteres)"
                  error={newPasswordError}
                  secureTextEntry
                  leftIcon="key-outline"
                />

                <Input
                  label="Confirmar Nova Senha *"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirme a nova senha"
                  error={confirmPasswordError}
                  secureTextEntry
                  leftIcon="checkmark-circle-outline"
                />

                <Button
                  title="Alterar Senha"
                  onPress={handleChangePassword}
                  loading={changingPassword}
                  disabled={changingPassword}
                  style={styles.changePasswordButton}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={Strings.cancel}
            onPress={handleCancel}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  passwordSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  passwordForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  changePasswordButton: {
    marginTop: 8,
  },
});