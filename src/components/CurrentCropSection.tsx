import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { cropById } from '../lib/crops';
import { cropProgress, daysBetween, estimateHarvest, formatDate, todayIso } from '../lib/dates';
import type { CurrentCrop, Planche } from '../lib/types';
import { useAppState } from '../state/AppState';
import { CropPicker } from './CropPicker';
import { DateStepper } from './DateStepper';
import { Button } from './ui';

interface Draft extends CurrentCrop {
  /** La date de récolte a été ajustée à la main : ne plus la recalculer. */
  harvestEdited: boolean;
}

function confirm(title: string, message: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Confirmer', style: 'destructive', onPress: onOk },
  ]);
}

/** Bloc « Culture en cours » d'une planche : démarrage, suivi, récolte. */
export function CurrentCropSection({ planche }: { planche: Planche }) {
  const { setCurrent, finishCurrent } = useAppState();
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = planche.current ?? null;

  const startDraft = (cropId: string) => {
    const sownDate = todayIso();
    setDraft({ cropId, sownDate, harvestDate: estimateHarvest(cropId, sownDate), harvestEdited: false });
  };

  // ── Édition (nouvelle culture ou modification) ──
  if (draft) {
    const crop = cropById(draft.cropId);
    const invalid = daysBetween(draft.sownDate, draft.harvestDate) <= 0;
    return (
      <View style={styles.box}>
        <Text style={styles.title}>{current ? 'Modifier la culture en cours' : 'Nouvelle culture en cours'}</Text>
        <Text style={styles.cropName}>{crop?.name ?? draft.cropId}</Text>
        <DateStepper
          label="Date de semis / plantation sur la planche"
          value={draft.sownDate}
          onChange={(sownDate) =>
            setDraft({
              ...draft,
              sownDate,
              harvestDate: draft.harvestEdited ? draft.harvestDate : estimateHarvest(draft.cropId, sownDate),
            })
          }
        />
        <DateStepper
          label="Récolte prévisionnelle"
          value={draft.harvestDate}
          onChange={(harvestDate) => setDraft({ ...draft, harvestDate, harvestEdited: true })}
        />
        <Text style={styles.small}>
          {draft.harvestEdited
            ? 'Date de récolte ajustée à la main.'
            : `Estimée d'après un cycle moyen de ~${crop?.cycleDays ?? 90} jours : ajustez selon la variété.`}
        </Text>
        {invalid && <Text style={styles.error}>La récolte doit être après la mise en place.</Text>}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button small kind="secondary" title="Annuler" onPress={() => setDraft(null)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              small
              title="Enregistrer"
              disabled={invalid}
              onPress={() => {
                setCurrent(planche.id, { cropId: draft.cropId, sownDate: draft.sownDate, harvestDate: draft.harvestDate });
                setDraft(null);
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Aucune culture en cours ──
  if (!current) {
    return (
      <>
        <Button small kind="secondary" title="🌿 Démarrer une culture en cours" onPress={() => setPicking(true)} />
        <CropPicker
          visible={picking}
          cropsOnly
          title="Que semez-vous / plantez-vous ?"
          onClose={() => setPicking(false)}
          onPick={(id) => {
            setPicking(false);
            startDraft(id);
          }}
        />
      </>
    );
  }

  // ── Suivi de la culture en cours ──
  const crop = cropById(current.cropId);
  const prog = cropProgress(current.sownDate, current.harvestDate);
  const late = prog.daysLeft < 0;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Culture en cours</Text>
      <Text style={styles.cropName}>🌿 {crop?.name ?? current.cropId}</Text>
      <Text style={styles.line}>Semis / plantation : {formatDate(current.sownDate)}</Text>
      <Text style={styles.line}>Récolte prévue : {formatDate(current.harvestDate)}</Text>
      <View style={styles.barBg}>
        <View style={[styles.bar, { width: `${Math.round(prog.ratio * 100)}%`, backgroundColor: late ? COLORS.possible : COLORS.green }]} />
      </View>
      <Text style={[styles.small, late && { color: COLORS.earth, fontWeight: '600' }]}>{prog.label}</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button small kind="secondary" title="Modifier" onPress={() => setDraft({ ...current, harvestEdited: true })} />
        </View>
        <View style={{ flex: 1.4 }}>
          <Button
            small
            title="✅ Récoltée"
            onPress={() =>
              confirm(
                'Culture terminée',
                `${crop?.name ?? 'La culture'} est terminée ? Elle passera dans l'historique de la planche.`,
                () => finishCurrent(planche.id),
              )
            }
          />
        </View>
      </View>
      <Button
        small
        kind="secondary"
        title="Retirer sans l'ajouter à l'historique"
        onPress={() => confirm('Retirer la culture', 'Retirer la culture en cours sans la garder dans l\'historique ?', () => setCurrent(planche.id, null))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: 8, marginBottom: 6, padding: 10, borderRadius: 10, backgroundColor: COLORS.greenLight },
  title: { fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 2 },
  cropName: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  line: { fontSize: 14, color: COLORS.text, marginBottom: 2 },
  small: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  error: { fontSize: 13, color: COLORS.deconseille, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  barBg: { height: 8, borderRadius: 4, backgroundColor: '#fff', marginTop: 8, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
});
