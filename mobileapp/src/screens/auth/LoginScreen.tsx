import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

import { RootStackParamList } from '../../navigation/AppNavigator';
import { RootState, AppDispatch } from '../../store';
import { loginUser, loginWithBiometrics, checkBiometricAvailability } from '../../store/slices/authSlice';
import { Button, Input, LoadingSpinner } from '../../components/common';
import { Strings } from '../../constants';
import { ValidationUtils } from '../../utils';
import { useTheme, Theme } from '../../contexts/ThemeContext';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { isLoading, error, biometricEnabled, biometricAvailable, biometricType } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  // Check biometric availability and network status on mount
  useEffect(() => {
    dispatch(checkBiometricAvailability());

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, [dispatch]);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

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

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(loginUser({ email, password })).unwrap();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const handleBiometricLogin = async () => {
    try {
      await dispatch(loginWithBiometrics()).unwrap();
    } catch (error: any) {
      Alert.alert('Erro', error.toString());
    }
  };

  // Determine if biometric login should be shown
  const showBiometricButton = biometricAvailable && biometricEnabled;
  const showPasswordForm = isOnline; // Only show password form when online

  // Get biometric icon based on type
  const getBiometricIcon = () => {
    if (biometricType === 'facial') return 'scan';
    return 'finger-print';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{Strings.appName}</Text>
          <Text style={styles.subtitle}>{Strings.appDescription}</Text>
        </View>

        {/* Biometric Login Button - Show if enabled */}
        {showBiometricButton && (
          <View style={styles.biometricContainer}>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <Ionicons name={getBiometricIcon()} size={48} color={theme.colors.primary} />
              <Text style={styles.biometricText}>
                {biometricType === 'facial' ? 'Usar Face ID' : 'Usar Impressão Digital'}
              </Text>
            </TouchableOpacity>

            {!isOnline && (
              <Text style={styles.offlineText}>Modo Offline - Apenas biometria disponível</Text>
            )}

            {isOnline && (
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OU</Text>
                <View style={styles.dividerLine} />
              </View>
            )}
          </View>
        )}

        {/* Password Form - Show when online */}
        {showPasswordForm && (
          <View style={styles.form}>
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

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              title={Strings.login}
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <Button
              title={Strings.register}
              onPress={navigateToRegister}
              variant="outline"
              style={styles.registerButton}
            />
          </View>
        )}

        {/* Offline Warning - Show when offline and biometric not available */}
        {!isOnline && !showBiometricButton && (
          <View style={styles.offlineWarning}>
            <Ionicons name="cloud-offline-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.offlineWarningTitle}>Modo Offline</Text>
            <Text style={styles.offlineWarningText}>
              Para acessar o app offline, você precisa:
            </Text>
            <Text style={styles.offlineWarningSteps}>
              1. Conectar à internet{'\n'}
              2. Fazer login{'\n'}
              3. Habilitar biometria nas configurações
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{Strings.dontHaveAccount}</Text>
        </View>
      </ScrollView>

      {isLoading && <LoadingSpinner overlay text="Fazendo login..." />}
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
  loginButton: {
    marginTop: 24,
  },
  registerButton: {
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
  biometricContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    minWidth: 200,
  },
  biometricText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  offlineText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.warning,
    textAlign: 'center',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  offlineWarning: {
    alignItems: 'center',
    padding: 24,
    marginTop: 32,
  },
  offlineWarningTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  offlineWarningText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  offlineWarningSteps: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
    fontWeight: '500',
  },
});