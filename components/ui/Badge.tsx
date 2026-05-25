import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
  style?: ViewStyle
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#E1F5EE', text: colors.success },
  warning: { bg: '#FEF3C7', text: '#D97706' },
  danger:  { bg: '#FEE2E2', text: colors.danger },
  info:    { bg: '#DBEAFE', text: colors.info },
  neutral: { bg: colors.border, text: colors.textMuted },
}

export function Badge({ label, variant = 'neutral', style }: BadgeProps) {
  const { bg, text } = variantColors[variant]

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
})
