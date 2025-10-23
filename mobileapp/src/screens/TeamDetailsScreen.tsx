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
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchTeamMembers,
  addTeamMember,
  removeTeamMember,
  clearTeamsError,
} from '../store/slices/teamsSlice';

interface TeamDetailsScreenProps {
  route: {
    params: {
      teamId: string;
    };
  };
  navigation: any;
}

export const TeamDetailsScreen = ({ route, navigation }: TeamDetailsScreenProps) => {
  const { teamId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { teams, members, isLoading, error } = useSelector((state: RootState) => state.teams);
  const { user } = useSelector((state: RootState) => state.auth);
  const [modalVisible, setModalVisible] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const team = teams.find((t) => t.id === teamId);

  useEffect(() => {
    if (!team) {
      Alert.alert('Erro', 'Equipe não encontrada');
      navigation.goBack();
      return;
    }
    loadMembers();
  }, [team]);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error);
      dispatch(clearTeamsError());
    }
  }, [error]);

  const loadMembers = async () => {
    try {
      await dispatch(fetchTeamMembers(teamId)).unwrap();
    } catch (error: any) {
      console.error('Failed to load members:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      Alert.alert('Erro', 'Email é obrigatório');
      return;
    }

    try {
      await dispatch(addTeamMember({ teamId, request: { email: memberEmail.trim() } })).unwrap();
      setModalVisible(false);
      setMemberEmail('');
      Alert.alert('Sucesso', 'Membro adicionado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error || 'Falha ao adicionar membro');
    }
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    if (userId === user?.id) {
      Alert.alert('Erro', 'Você não pode remover a si mesmo. Use a opção "Sair da Equipe".');
      return;
    }

    Alert.alert(
      'Confirmar remoção',
      `Tem certeza que deseja remover ${userName} da equipe?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeTeamMember({ teamId, userId })).unwrap();
              Alert.alert('Sucesso', 'Membro removido com sucesso!');
            } catch (error: any) {
              Alert.alert('Erro', error || 'Falha ao remover membro');
            }
          },
        },
      ]
    );
  };

  const renderMemberItem = ({ item }: any) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Ionicons name="person-circle" size={40} color="#007AFF" />
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name || 'Usuário'}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.memberActions}>
        {item.role === 'owner' ? (
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>Dono</Text>
          </View>
        ) : team.userRole === 'owner' ? (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.userId, item.name || item.email)}
          >
            <Ionicons name="close-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (!team) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.teamName}>{team.name}</Text>
        {team.description && (
          <Text style={styles.teamDescription}>{team.description}</Text>
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {team.userRole === 'owner' ? 'Proprietário' : 'Membro'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Membros ({members.length})</Text>
          {team.userRole === 'owner' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="person-add" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading && members.length === 0 ? (
          <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : members.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum membro ainda</Text>
          </View>
        ) : (
          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.userId}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarefas Compartilhadas</Text>
        <TouchableOpacity
          style={styles.viewTasksButton}
          onPress={() => {
            // Navigate to tasks screen filtered by team
            navigation.navigate('MainTabs', {
              screen: 'Tasks',
              params: { teamId: teamId }
            });
          }}
        >
          <Text style={styles.viewTasksButtonText}>Ver Tarefas da Equipe</Text>
          <Ionicons name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.infoText}>
          Para compartilhar uma tarefa com esta equipe, edite a tarefa e selecione esta equipe.
        </Text>
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Membro</Text>

            <TextInput
              style={styles.input}
              placeholder="Email do membro"
              value={memberEmail}
              onChangeText={setMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setMemberEmail('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleAddMember}
                disabled={!memberEmail.trim()}
              >
                <Text style={styles.submitButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {
    marginLeft: 12,
  },
  ownerBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B6914',
  },
  removeButton: {
    padding: 4,
  },
  viewTasksButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  viewTasksButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
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
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TeamDetailsScreen;
