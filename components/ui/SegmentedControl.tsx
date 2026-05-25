import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../../theme/colors'

interface SegmentedControlProps {
  options: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

export function SegmentedControl({ options, selectedIndex, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={[styles.tab, index === selectedIndex && styles.tabActive]}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
        >
          <Text style={[styles.text, index === selectedIndex && styles.textActive]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  textActive: {
    color: colors.text,
    fontWeight: '600',
  },
})
