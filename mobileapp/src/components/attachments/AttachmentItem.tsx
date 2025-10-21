import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskAttachment } from '../../types';
import AttachmentService from '../../services/AttachmentService';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import * as Sharing from 'expo-sharing';

interface AttachmentItemProps {
  attachment: TaskAttachment;
  onDelete: (attachmentId: string) => void;
}

export default function AttachmentItem({ attachment, onDelete }: AttachmentItemProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (attachment.fileType) {
      case 'image':
        return 'image';
      case 'document':
        return 'document-text';
      case 'link':
        return 'link';
      default:
        return 'attach';
    }
  };

  const getIconColor = (): string => {
    switch (attachment.fileType) {
      case 'image':
        return '#4CAF50';
      case 'document':
        return '#2196F3';
      case 'link':
        return '#FF9800';
      default:
        return theme.colors.primary;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '';
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handlePress = async () => {
    if (attachment.fileType === 'link') {
      // Open link in browser
      let url = attachment.filePath;

      // Add https:// if no protocol is specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link');
      }
    } else {
      // Download and share file
      Alert.alert(
        attachment.fileName,
        'O que deseja fazer?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Baixar e Abrir',
            onPress: () => downloadAndOpen(),
          },
        ]
      );
    }
  };

  const downloadAndOpen = async () => {
    try {
      const fileUri = await AttachmentService.downloadFile(attachment.id, attachment.fileName);

      // Share/open the downloaded file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sucesso', 'Arquivo baixado');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Erro', error.message || 'Erro ao baixar arquivo');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir "${attachment.fileName}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await AttachmentService.deleteAttachment(attachment.id);
              onDelete(attachment.id);
              Alert.alert('Sucesso', 'Anexo excluído');
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Erro', error.message || 'Erro ao excluir anexo');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={handlePress}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
          <Ionicons name={getIconName()} size={20} color={getIconColor()} />
        </View>

        <View style={styles.info}>
          <Text style={styles.fileName} numberOfLines={1}>
            {attachment.fileName}
          </Text>
          {attachment.fileSize !== undefined && attachment.fileSize > 0 && (
            <Text style={styles.fileSize}>{formatFileSize(attachment.fileSize)}</Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#F44336" />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
});
