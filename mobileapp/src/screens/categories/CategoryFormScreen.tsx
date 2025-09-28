import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants';

export default function CategoryFormScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Formulário de Categoria</Text>
      <Text style={styles.subtitle}>Em breve...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});