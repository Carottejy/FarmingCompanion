import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { addDays, formatDate } from '../lib/dates';

/** Sélecteur de date simple (−7 / −1 / +1 / +7 jours), sans dépendance native. */
export function DateStepper({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  const step = (n: number) => onChange(addDays(value, n));
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Btn text="−7" onPress={() => step(-7)} />
        <Btn text="−1" onPress={() => step(-1)} />
        <Text style={styles.date}>{formatDate(value)}</Text>
        <Btn text="+1" onPress={() => step(1)} />
        <Btn text="+7" onPress={() => step(7)} />
      </View>
    </View>
  );
}

function Btn({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.6 }]}>
      <Text style={styles.btnText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 6 },
  label: { fontSize: 13, color: COLORS.muted, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: COLORS.text },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.green,
    backgroundColor: COLORS.card,
  },
  btnText: { color: COLORS.green, fontWeight: '600', fontSize: 13 },
});
