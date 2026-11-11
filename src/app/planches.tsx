import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CropPicker } from '../components/CropPicker';
import { Button, Card, SectionTitle } from '../components/ui';
import { COLORS } from '../config';
import { precedentInfo } from '../lib/crops';
import { useAppState } from '../state/AppState';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatMonth(iso: string) {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export default function PlanchesScreen() {
  const { planches, addPlanche, deletePlanche, renamePlanche, addHistory, removeHistory } = useAppState();
  const [newName, setNewName] = useState('');
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [pending, setPending] = useState<{ plancheId: string; cropId: string; year: number; month: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const now = new Date();

  const confirmDelete = (id: string, name: string) => {
    // Alert.alert n'affiche rien sur le web (web app iPhone) : on utilise la boîte native du navigateur.
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer « ${name} » et son historique ?`)) deletePlanche(id);
      return;
    }
    Alert.alert('Supprimer la planche', `Supprimer « ${name} » et son historique ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deletePlanche(id) },
    ]);
  };

  const stepMonth = (delta: number) => {
    if (!pending) return;
    let m = pending.month + delta;
    let y = pending.year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setPending({ ...pending, month: m, year: y });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <SectionTitle>Nouvelle planche</SectionTitle>
      <Card>
        <TextInput
          placeholder="Nom (ex. Planche 3 – lot B)"
          value={newName}
          onChangeText={setNewName}
          style={styles.input}
        />
        <Button
          title="Ajouter la planche"
          disabled={!newName.trim()}
          onPress={() => {
            addPlanche(newName);
            setNewName('');
          }}
        />
      </Card>

      <SectionTitle>Mes planches ({planches.length})</SectionTitle>
      {planches.length === 0 && (
        <Card>
          <Text style={styles.muted}>
            Créez une planche puis renseignez ce qui y a poussé : l'onglet Conseils tiendra compte du précédent et des délais
            de retour de chaque famille (ex. 5 ans pour les Alliacées, 4 ans pour les Solanacées).
          </Text>
        </Card>
      )}

      {planches.map((p) => (
        <Card key={p.id}>
          <View style={styles.head}>
            {editing === p.id ? (
              <TextInput
                value={p.name}
                onChangeText={(t) => renamePlanche(p.id, t)}
                onBlur={() => setEditing(null)}
                autoFocus
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
            ) : (
              <Pressable onLongPress={() => setEditing(p.id)} style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
              </Pressable>
            )}
            <Pressable onPress={() => confirmDelete(p.id, p.name)} hitSlop={10}>
              <Text style={{ color: COLORS.deconseille }}>Supprimer</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Appui long sur le nom pour le modifier.</Text>

          {p.history.length === 0 && <Text style={styles.muted}>Aucun historique.</Text>}
          {p.history.map((h, i) => (
            <View key={`${h.cropId}-${h.date}-${i}`} style={styles.histRow}>
              <Text style={[styles.histText, i === 0 && { fontWeight: '700' }]}>
                {i === 0 ? '▶ ' : ''}
                {precedentInfo(h.cropId)?.name ?? h.cropId}
              </Text>
              <Text style={styles.muted}>{formatMonth(h.date)}</Text>
              <Pressable onPress={() => removeHistory(p.id, i)} hitSlop={10} style={{ marginLeft: 10 }}>
                <Text style={{ color: COLORS.muted }}>✕</Text>
              </Pressable>
            </View>
          ))}

          {pending?.plancheId === p.id ? (
            <View style={styles.pending}>
              <Text style={styles.histText}>{precedentInfo(pending.cropId)?.name}</Text>
              <Text style={styles.muted}>Mise en place :</Text>
              <View style={styles.stepper}>
                <Button small kind="secondary" title="◀" onPress={() => stepMonth(-1)} />
                <Text style={styles.stepText}>
                  {MONTHS[pending.month - 1]} {pending.year}
                </Text>
                <Button small kind="secondary" title="▶" onPress={() => stepMonth(1)} />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button small kind="secondary" title="Annuler" onPress={() => setPending(null)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    small
                    title="Enregistrer"
                    onPress={() => {
                      addHistory(p.id, {
                        cropId: pending.cropId,
                        date: `${pending.year}-${String(pending.month).padStart(2, '0')}-01`,
                      });
                      setPending(null);
                    }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <Button small kind="secondary" title="＋ Ajouter une culture à l'historique" onPress={() => setPickFor(p.id)} />
          )}
        </Card>
      ))}

      <CropPicker
        visible={pickFor !== null}
        title="Qu'est-ce qui a poussé ?"
        onClose={() => setPickFor(null)}
        onPick={(cropId) => {
          if (pickFor) setPending({ plancheId: pickFor, cropId, year: now.getFullYear(), month: now.getMonth() + 1 });
          setPickFor(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  input: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  muted: { color: COLORS.muted, fontSize: 14 },
  hint: { color: COLORS.muted, fontSize: 12, marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  histRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: COLORS.border },
  histText: { flex: 1, fontSize: 15, color: COLORS.text },
  pending: { marginTop: 10, padding: 10, backgroundColor: COLORS.greenLight, borderRadius: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  stepText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
});
