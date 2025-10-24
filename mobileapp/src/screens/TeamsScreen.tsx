import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchUserTeams,
  createTeam,
  deleteTeam,
  clearTeamsError,
} from '../store/slices/teamsSlice';
import { TeamRequest } from '../services/teamService';
import { useTheme, Theme } from '../contexts/ThemeContext';

export const TeamsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  const { teams, isLoading, error } = useSelector((state: RootState) => state.teams);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [modalVisible, setModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  useEffect(() => {
    dispatch(fetchUserTeams());
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error);
      dispatch(clearTeamsError());
    }
  }, [error]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Erro', 'Nome da equipe é obrigatório');
      return;
    }

    const request: TeamRequest = {
      name: teamName.trim(),
      description: teamDescription.trim() || undefined,
    };

    try {
      await dispatch(createTeam(request)).unwrap();
      setModalVisible(false);
      setTeamName('');
      setTeamDescription('');
      Alert.alert('Sucesso', 'Equipe criada com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error || 'Falha ao criar equipe');
    }
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja deletar a equipe "${teamName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTeam(teamId)).unwrap();
              Alert.alert('Sucesso', 'Equipe deletada com sucesso!');
            } catch (error: any) {
              Alert.alert('Erro', error || 'Falha ao deletar equipe');
            }
          },
        },
      ]
    );
  };

  const handleTeamPress = (teamId: string) => {
    navigation.navigate('TeamDetails', { teamId });
  };

  const renderTeamItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.teamCard}
      onPress={() => handleTeamPress(item.id)}
    >
      <View style={styles.teamHeader}>
        <Text style={styles.teamName}>{item.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.userRole === 'owner' ? 'Proprietário' : 'Membro'}</Text>
        </View>
      </View>
      {item.description && (
        <Text style={styles.teamDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.teamFooter}>
        <Text style={styles.memberCount}>{item.memberCount} membro(s)</Text>
        {item.userRole === 'owner' && (
          <TouchableOpacity
            onPress={() => handleDeleteTeam(item.id, item.name)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteButtonText}>Deletar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && teams.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Equipes</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.createButtonText}>+ Nova Equipe</Text>
        </TouchableOpacity>
      </View>

      {teams.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Você ainda não faz parte de nenhuma equipe</Text>
          <Text style={styles.emptySubtext}>Crie uma nova equipe para começar a colaborar</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          renderItem={renderTeamItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={isLoading}
          onRefresh={() => dispatch(fetchUserTeams())}
        />
      )}

      {/* Create Team Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Equipe</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome da equipe"
              value={teamName}
              onChangeText={setTeamName}
              maxLength={100}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              value={teamDescription}
              onChangeText={setTeamDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setTeamName('');
                  setTeamDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleCreateTeam}
                disabled={!teamName.trim()}
              >
                <Text style={styles.submitButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  teamCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  roleBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  teamDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  teamFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    marginRight: 8,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
  },
  submitButtonText: {
    color: theme.colors.background,
    fontWeight: '600',
  },
});
