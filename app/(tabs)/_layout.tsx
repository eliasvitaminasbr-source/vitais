import React from 'react'
import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import {
  Activity,
  FileText,
  HeartPulse,
  Wallet,
  Bell,
  Bot,
} from 'lucide-react-native'
import { colors } from '../../theme/colors'
import { useComunicados } from '../../hooks/useComunicados'

function BellWithBadge({ color, size }: { color: string; size: number }) {
  const { data } = useComunicados()
  const naoLidos = data?.filter((c) => !c.lido).length ?? 0

  return (
    <View>
      <Bell size={size} color={color} />
      {naoLidos > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{naoLidos > 9 ? '9+' : naoLidos}</Text>
        </View>
      )}
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Documentos',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rh"
        options={{
          title: 'RH',
          tabBarIcon: ({ color, size }) => <HeartPulse size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="beneficios"
        options={{
          title: 'Benefícios',
          tabBarIcon: ({ color, size }) => <Wallet size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="comunicados"
        options={{
          title: 'Comunicados',
          tabBarIcon: ({ color, size }) => <BellWithBadge color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="assistente"
        options={{
          title: 'Assistente',
          tabBarIcon: ({ color, size }) => <Bot size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 99,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
})
