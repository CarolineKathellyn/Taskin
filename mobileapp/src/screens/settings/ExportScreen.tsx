import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '../../store';
import { Button, Card } from '../../components/common';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import PDFExportService, { PDFExportOptions } from '../../services/PDFExportService';

export default function ExportScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const { tasks, projects } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);

  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<PDFExportOptions>({
    includeCompletedTasks: true,
    includePendingTasks: true,
    includeInProgressTasks: true,
    dateRange: 'all',
    fileName: `taskin-relatorio-${new Date().toISOString().split('T')[0]}.pdf`
  });

  const handleExport = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    if (tasks.length === 0) {
      Alert.alert('Aviso', 'Não há tarefas para exportar');
      return;
    }

    setExporting(true);

    try {
      await PDFExportService.exportAndShare(
        tasks,
        projects,
        { name: user.name, email: user.email },
        options
      );

      Alert.alert(
        'Sucesso! 📄',
        'Relatório PDF gerado com sucesso! O arquivo foi salvo e está disponível para compartilhamento.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert(
        'Erro',
        error.message || 'Erro ao gerar relatório PDF. Tente novamente.'
      );
    } finally {
      setExporting(false);
    }
  };

  const updateOption = (key: keyof PDFExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const getTaskCountText = () => {
    let count = 0;
    tasks.forEach(task => {
      if (options.includeCompletedTasks && task.status === 'concluida') count++;
      if (options.includePendingTasks && task.status === 'pendente') count++;
      if (options.includeInProgressTasks && task.status === 'em_progresso') count++;
    });
    return count;
  };

  const completedCount = tasks.filter(t => t.status === 'concluida').length;
  const pendingCount = tasks.filter(t => t.status === 'pendente').length;
  const inProgressCount = tasks.filter(t => t.status === 'em_progresso').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="document-text" size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Exportar para PDF</Text>
          <Text style={styles.subtitle}>
            Gere um relatório completo das suas tarefas em formato PDF
          </Text>
        </View>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Resumo das Tarefas</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{tasks.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.success }]}>
                {completedCount}
              </Text>
              <Text style={styles.summaryLabel}>Concluídas</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.info }]}>
                {inProgressCount}
              </Text>
              <Text style={styles.summaryLabel}>Em Progresso</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: theme.colors.textSecondary }]}>
                {pendingCount}
              </Text>
              <Text style={styles.summaryLabel}>Pendentes</Text>
            </View>
          </View>
        </Card>

        {/* Export Options */}
        <Card style={styles.optionsCard}>
          <Text style={styles.sectionTitle}>Opções de Exportação</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Incluir tarefas concluídas</Text>
              <Text style={styles.optionSubtext}>
                {completedCount} tarefa(s) concluída(s)
              </Text>
            </View>
            <Switch
              value={options.includeCompletedTasks}
              onValueChange={(value) => updateOption('includeCompletedTasks', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={options.includeCompletedTasks ? theme.colors.primary : theme.colors.disabled}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Incluir tarefas em progresso</Text>
              <Text style={styles.optionSubtext}>
                {inProgressCount} tarefa(s) em progresso
              </Text>
            </View>
            <Switch
              value={options.includeInProgressTasks}
              onValueChange={(value) => updateOption('includeInProgressTasks', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={options.includeInProgressTasks ? theme.colors.primary : theme.colors.disabled}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Incluir tarefas pendentes</Text>
              <Text style={styles.optionSubtext}>
                {pendingCount} tarefa(s) pendente(s)
              </Text>
            </View>
            <Switch
              value={options.includePendingTasks}
              onValueChange={(value) => updateOption('includePendingTasks', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={options.includePendingTasks ? theme.colors.primary : theme.colors.disabled}
            />
          </View>
        </Card>

        {/* Export Preview */}
        <Card style={styles.previewCard}>
          <Text style={styles.sectionTitle}>Pré-visualização do Relatório</Text>
          <View style={styles.previewInfo}>
            <Ionicons name="document" size={24} color={theme.colors.primary} />
            <View style={styles.previewText}>
              <Text style={styles.previewTitle}>
                {getTaskCountText()} tarefa(s) serão incluídas no relatório
              </Text>
              <Text style={styles.previewSubtext}>
                Formato: PDF • Organizado por projetos
              </Text>
              <Text style={styles.previewSubtext}>
                Arquivo: {options.fileName}
              </Text>
            </View>
          </View>
        </Card>

        {/* Feature List */}
        <Card style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>O que está incluído</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Resumo geral das tarefas</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Tarefas organizadas por projeto</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Status e prioridade de cada tarefa</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Datas de vencimento e progresso</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.featureText}>Formatação profissional para impressão</Text>
            </View>
          </View>
        </Card>

        {/* Export Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Cancelar"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={exporting ? "Gerando PDF..." : "Gerar PDF"}
            onPress={handleExport}
            loading={exporting}
            disabled={exporting || getTaskCountText() === 0}
            style={styles.exportButton}
            leftIcon="download"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  optionsCard: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  previewCard: {
    marginBottom: 16,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  featuresCard: {
    marginBottom: 24,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
  },
  exportButton: {
    flex: 2,
  },
});