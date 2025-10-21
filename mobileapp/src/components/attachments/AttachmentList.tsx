import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TaskAttachment } from '../../types';
import AttachmentItem from './AttachmentItem';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface AttachmentListProps {
  attachments: TaskAttachment[];
  onDelete: (attachmentId: string) => void;
}

export default function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Anexos ({attachments.length})</Text>
      {attachments.map((attachment) => (
        <AttachmentItem
          key={attachment.id}
          attachment={attachment}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

const getStyles = (theme: Theme) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
});
