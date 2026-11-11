import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../config';
import { AppStateProvider } from '../state/AppState';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>{emoji}</Text>;
  };

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: COLORS.green,
            headerStyle: { backgroundColor: COLORS.bg },
            headerTitleStyle: { color: COLORS.text, fontWeight: '700' },
            sceneStyle: { backgroundColor: COLORS.bg },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Conseils', tabBarIcon: icon('🌱') }} />
          <Tabs.Screen name="planches" options={{ title: 'Planches', tabBarIcon: icon('🧺') }} />
          <Tabs.Screen name="parametres" options={{ title: 'Paramètres', tabBarIcon: icon('⚙️') }} />
          <Tabs.Screen name="a-propos" options={{ title: 'À propos', tabBarIcon: icon('ℹ️') }} />
        </Tabs>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
