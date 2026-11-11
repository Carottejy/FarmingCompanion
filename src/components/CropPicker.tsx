import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config';
import { CROPS, SPECIAL_PRECEDENTS } from '../lib/crops';

interface Item {
  id: string;
  name: string;
  sub: string;
}

const ITEMS: Item[] = [
  ...CROPS.map((c) => ({ id: c.id, name: c.name, sub: c.family })),
  ...SPECIAL_PRECEDENTS.map((p) => ({ id: p.id, name: p.name, sub: 'Autre précédent' })),
].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export function CropPicker({
  visible,
  onClose,
  onPick,
  title = 'Choisir une culture',
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
  title?: string;
}) {
  const [q, setQ] = useState('');
  const data = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? ITEMS.filter((i) => i.name.toLowerCase().includes(n) || i.sub.toLowerCase().includes(n)) : ITEMS;
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.close}>Fermer</Text>
          </Pressable>
        </View>
        <TextInput
          placeholder="Rechercher (tomate, Brassicacées…)"
          value={q}
          onChangeText={setQ}
          style={styles.search}
          autoCorrect={false}
        />
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: COLORS.greenLight }]}
              onPress={() => {
                onPick(item.id);
                setQ('');
              }}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.sub}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  close: { fontSize: 16, color: COLORS.green, fontWeight: '600' },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
  },
  row: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border },
  name: { fontSize: 16, color: COLORS.text },
  sub: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
});
