import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS } from '../config';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  small,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  small?: boolean;
}) {
  const bg = kind === 'primary' ? COLORS.green : kind === 'danger' ? COLORS.deconseille : COLORS.card;
  const fg = kind === 'secondary' ? COLORS.green : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: COLORS.green },
      ]}
    >
      <Text style={[styles.btnText, small && { fontSize: 14 }, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: COLORS.green, borderColor: COLORS.green }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  section: { fontSize: 13, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', marginVertical: 4 },
  btnSmall: { paddingVertical: 7, paddingHorizontal: 12 },
  btnText: { fontSize: 16, fontWeight: '600' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { color: COLORS.text, fontSize: 14 },
});
