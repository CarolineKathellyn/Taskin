import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { registerUser } from '../../store/slices/authSlice';
import { Button, Input, LoadingSpinner } from '../../components/common';
import { Strings } from '../../constants';
import { ValidationUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    try {
      ValidationUtils.validateRequired(name, 'Nome');
    } catch (error: any) {
      setNameError(error.message);
      isValid = false;
    }

    try {
      ValidationUtils.validateEmail(email);
    } catch (error: any) {
      setEmailError(error.message);
      isValid = false;
    }

    try {
      ValidationUtils.validatePassword(password);
    } catch (error: any) {
      setPasswordError(error.message);
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError(Strings.passwordsDoNotMatch);
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(registerUser({ name, email, password })).unwrap();
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junte-se ao {Strings.appName}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={Strings.name}
            placeholder="Digite seu nome completo"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon="person-outline"
            error={nameError}
            required
          />

          <Input
            label={Strings.email}
            placeholder="Digite seu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail-outline"
            error={emailError}
            required
          />

          <Input
            label={Strings.password}
            placeholder="Digite sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
            error={passwordError}
            required
          />

          <Input
            label="Confirmar Senha"
            placeholder="Digite sua senha novamente"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            error={confirmPasswordError}
            required
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title={Strings.register}
            onPress={handleRegister}
            loading={isLoading}
            style={styles.registerButton}
          />

          <Button
            title="Já tenho uma conta"
            onPress={navigateToLogin}
            variant="outline"
            style={styles.loginButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{Strings.alreadyHaveAccount}</Text>
        </View>
      </ScrollView>

      {isLoading && <LoadingSpinner overlay text="Criando conta..." />}
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  registerButton: {
    marginTop: 24,
  },
  loginButton: {
    marginTop: 12,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});