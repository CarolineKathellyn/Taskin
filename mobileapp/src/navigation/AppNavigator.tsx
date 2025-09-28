import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { RootState } from '../store';
import { useTheme } from '../contexts/ThemeContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import TaskListScreen from '../screens/tasks/TaskListScreen';
import TaskFormScreen from '../screens/tasks/TaskFormScreen';
import TaskDetailsScreen from '../screens/tasks/TaskDetailsScreen';
import ProjectListScreen from '../screens/projects/ProjectListScreen';
import ProjectFormScreen from '../screens/projects/ProjectFormScreen';
import ProjectDetailScreen from '../screens/projects/ProjectDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ThemeSettingsScreen from '../screens/settings/ThemeSettingsScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import { NotificationHandler } from '../components/NotificationHandler';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  TaskForm: { taskId?: string; projectId?: string };
  TaskDetails: { taskId: string };
  ProjectForm: { projectId?: string };
  ProjectDetail: { projectId: string };
  ThemeSettings: undefined;
  NotificationSettings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Projects: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const CustomBackButton = ({ canGoBack, navigation }: { canGoBack?: boolean; navigation: any }) => {
  if (!canGoBack) return null;
  return (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{
        marginLeft: 15,
        padding: 8,
        borderRadius: 20,
      }}
    >
      <Ionicons name="chevron-back" size={24} color="#007AFF" />
    </TouchableOpacity>
  );
};

const AuthStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.background,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Entrar' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Criar Conta' }}
      />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Projects':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.background,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen
        name="Tasks"
        component={TaskListScreen}
        options={{ title: 'Tarefas' }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectListScreen}
        options={{ title: 'Projetos' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Tab.Navigator>
  );
};

const MainStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: '#007AFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          color: theme.colors.text,
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TaskForm"
        component={TaskFormScreen}
        options={({ route, navigation }) => ({
          title: route.params?.taskId ? 'Editar Tarefa' : 'Nova Tarefa',
          presentation: 'modal',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomWidth: 1,
            borderBottomColor: '#C6C6C8',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#000000',
          },
          headerLeft: ({ canGoBack }) => <CustomBackButton canGoBack={canGoBack} navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="TaskDetails"
        component={TaskDetailsScreen}
        options={({ navigation }) => ({
          title: 'Detalhes da Tarefa',
          headerTintColor: '#FF0000',
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomWidth: 1,
            borderBottomColor: '#C6C6C8',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#000000',
          },
          headerLeft: ({ canGoBack }) => <CustomBackButton canGoBack={canGoBack} navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ProjectForm"
        component={ProjectFormScreen}
        options={({ route, navigation }) => ({
          title: route.params?.projectId ? 'Editar Projeto' : 'Novo Projeto',
          presentation: 'modal',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomWidth: 1,
            borderBottomColor: '#C6C6C8',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#000000',
          },
          headerLeft: ({ canGoBack }) => <CustomBackButton canGoBack={canGoBack} navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={({ navigation }) => ({
          title: 'Detalhes do Projeto',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomWidth: 1,
            borderBottomColor: '#C6C6C8',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#000000',
          },
          headerLeft: ({ canGoBack }) => <CustomBackButton canGoBack={canGoBack} navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettingsScreen}
        options={({ navigation }) => ({
          title: 'Configurações de Tema',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomWidth: 1,
            borderBottomColor: '#C6C6C8',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#000000',
          },
          headerLeft: ({ canGoBack }) => <CustomBackButton canGoBack={canGoBack} navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={({ navigation }) => ({
          title: 'Configurações de Notificação',
          headerTintColor: '#007AFF',
          headerStyle: {
            backgroundColor: '#F2F2F7',
            borderBottomWidth: 1,
            borderBottomColor: '#C6C6C8',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            color: '#000000',
          },
          headerLeft: ({ canGoBack }) => <CustomBackButton canGoBack={canGoBack} navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
};

export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
      {isAuthenticated && <NotificationHandler />}
    </NavigationContainer>
  );
}