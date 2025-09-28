export interface HardcodedCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const HARDCODED_CATEGORIES: HardcodedCategory[] = [
  {
    id: 'pessoal',
    name: 'Pessoal',
    color: '#6366f1',
    icon: 'person',
    description: 'Tarefas pessoais e lembretes'
  },
  {
    id: 'trabalho',
    name: 'Trabalho',
    color: '#059669',
    icon: 'briefcase',
    description: 'Tarefas relacionadas ao trabalho'
  },
  {
    id: 'casa',
    name: 'Casa',
    color: '#dc2626',
    icon: 'home',
    description: 'Tarefas domésticas e manutenção'
  },
  {
    id: 'contas',
    name: 'Contas',
    color: '#ca8a04',
    icon: 'card',
    description: 'Contas, pagamentos e assinaturas'
  },
  {
    id: 'compras',
    name: 'Compras',
    color: '#7c2d92',
    icon: 'basket',
    description: 'Compras do mercado e produtos'
  },
  {
    id: 'saude',
    name: 'Saúde',
    color: '#ea580c',
    icon: 'medical',
    description: 'Consultas médicas e exercícios'
  },
  {
    id: 'transporte',
    name: 'Transporte',
    color: '#0891b2',
    icon: 'car',
    description: 'Manutenção do carro e viagem'
  },
  {
    id: 'ideias',
    name: 'Ideias',
    color: '#9333ea',
    icon: 'bulb',
    description: 'Projetos futuros e anotações'
  }
];

export const getCategoryById = (id: string): HardcodedCategory | undefined => {
  return HARDCODED_CATEGORIES.find(category => category.id === id);
};

export const getCategoryName = (id?: string): string => {
  if (!id) return '';
  const category = getCategoryById(id);
  return category?.name || '';
};

export const getCategoryColor = (id?: string): string => {
  if (!id) return '#6b7280';
  const category = getCategoryById(id);
  return category?.color || '#6b7280';
};

export const getCategoryIcon = (id?: string): string => {
  if (!id) return 'folder';
  const category = getCategoryById(id);
  return category?.icon || 'folder';
};