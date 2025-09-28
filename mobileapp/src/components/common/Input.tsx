import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required = false,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles = [styles.container, containerStyle];
  const inputContainerStyles = [
    styles.inputContainer,
    isFocused && styles.focused,
    error && styles.error,
  ];
  const inputStyles = [styles.input, style];

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={inputContainerStyles}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? Colors.primary : Colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={inputStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.placeholder}
          {...props}
        />
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={Colors.textSecondary}
            style={styles.rightIcon}
            onPress={onRightIconPress}
          />
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.background,
    minHeight: 44,
  },
  focused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  error: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  leftIcon: {
    marginLeft: 12,
  },
  rightIcon: {
    marginRight: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
    marginTop: 4,
  },
});