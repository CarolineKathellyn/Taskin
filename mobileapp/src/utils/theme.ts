import { Theme } from '../contexts/ThemeContext';

// Backward compatibility - creates a Colors object from theme
export function getColorsFromTheme(theme: Theme) {
  return theme.colors;
}

// Utility to create theme-aware styles
export function createThemedStyles<T extends Record<string, any>>(
  styleFactory: (colors: Theme['colors']) => T
) {
  return (theme: Theme) => styleFactory(theme.colors);
}

// Category colors that work in both light and dark themes
export const getCategoryColors = (isDark: boolean) => {
  if (isDark) {
    return [
      '#FF7979', '#74B9FF', '#A29BFE', '#6C5CE7',
      '#FDCB6E', '#55A3FF', '#E17055', '#00B894',
      '#E84393', '#0984E3', '#00CEC9', '#FD79A8'
    ];
  }

  return [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
    '#00D2D3', '#FF9F43', '#EE5A24', '#0984E3',
    '#6C5CE7', '#A29BFE', '#FD79A8', '#E17055'
  ];
};

// Task priorities with theme-aware colors
export const getTaskPriorities = (colors: Theme['colors']) => ({
  baixa: { label: 'Baixa', color: colors.success, icon: 'arrow-down-outline' },
  media: { label: 'Média', color: colors.warning, icon: 'remove-outline' },
  alta: { label: 'Alta', color: colors.danger, icon: 'arrow-up-outline' },
});

// Task statuses with theme-aware colors
export const getTaskStatuses = (colors: Theme['colors']) => ({
  pendente: { label: 'Pendente', color: colors.textSecondary, icon: 'time-outline' },
  em_progresso: { label: 'Em Progresso', color: colors.info, icon: 'play-outline' },
  concluida: { label: 'Concluída', color: colors.success, icon: 'checkmark-outline' },
});