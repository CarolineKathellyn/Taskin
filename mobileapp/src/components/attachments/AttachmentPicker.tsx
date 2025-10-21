import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { TaskAttachment } from '../../types';
import AttachmentService from '../../services/AttachmentService';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface AttachmentPickerProps {
  taskId: string;
  onAttachmentAdded: (attachment: TaskAttachment) => void;
}

export default function AttachmentPicker({ taskId, onAttachmentAdded }: AttachmentPickerProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [uploading, setUploading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permissão negada', 'É necessário permitir acesso à galeria');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0].uri, result.assets[0].fileName || 'image.jpg', 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Erro ao selecionar imagem');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0].uri, result.assets[0].name, 'document');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erro', 'Erro ao selecionar documento');
    }
  };

  const uploadFile = async (fileUri: string, fileName: string, fileType: 'image' | 'document') => {
    setUploading(true);
    try {
      const attachment = await AttachmentService.uploadFile(taskId, fileUri, fileName, fileType);
      onAttachmentAdded(attachment);
      Alert.alert('Sucesso', 'Arquivo enviado com sucesso');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Erro', error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkUrl.trim()) {
      Alert.alert('Erro', 'Digite uma URL válida');
      return;
    }

    setUploading(true);
    try {
      const attachment = await AttachmentService.addLink(taskId, linkUrl, linkName || linkUrl);
      onAttachmentAdded(attachment);
      setShowLinkModal(false);
      setLinkUrl('');
      setLinkName('');
      Alert.alert('Sucesso', 'Link adicionado com sucesso');
    } catch (error: any) {
      console.error('Add link error:', error);
      Alert.alert('Erro', error.message || 'Erro ao adicionar link');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Anexos</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="image" size={20} color={theme.colors.primary} />
            <Text style={styles.buttonText}>Imagem</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={pickDocument}
            disabled={uploading}
          >
            <Ionicons name="document" size={20} color={theme.colors.primary} />
            <Text style={styles.buttonText}>Documento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowLinkModal(true)}
            disabled={uploading}
          >
            <Ionicons name="link" size={20} color={theme.colors.primary} />
            <Text style={styles.buttonText}>Link</Text>
          </TouchableOpacity>
        </View>
        {uploading && <Text style={styles.uploadingText}>Enviando...</Text>}
      </View>

      {/* Link Modal */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Link</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome (opcional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={linkName}
              onChangeText={setLinkName}
            />

            <TextInput
              style={styles.input}
              placeholder="URL *"
              placeholderTextColor={theme.colors.textSecondary}
              value={linkUrl}
              onChangeText={setLinkUrl}
              keyboardType="url"
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                  setLinkName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddLink}
                disabled={uploading}
              >
                <Text style={styles.addButtonText}>
                  {uploading ? 'Adicionando...' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  uploadingText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.background,
  },
});
