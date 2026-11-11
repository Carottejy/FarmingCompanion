import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { CropPicker } from '../components/CropPicker';
import { Card, Chip, SectionTitle } from '../components/ui';
import { COLORS } from '../config';
import { precedentInfo } from '../lib/crops';
import { doyToLabel } from '../lib/climate';
import { ACTION_LABEL, recommend } from '../lib/engine';
import type { HistoryEntry, Recommendation, Verdict } from '../lib/types';
import { useAppState } from '../state/AppState';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const VERDICT_COLOR: Record<Verdict, string> = {
  Excellent: COLORS.excellent,
  Bon: COLORS.bon,
  Possible: COLORS.possible,
  Déconseillé: COLORS.deconseille,
};

/** Quinzaine (1–24) → date au milieu de la quinzaine. */
function halfMonthToDate(i: number, year: number): Date {
  const month = Math.floor((i - 1) / 2);
  return new Date(year, month, i % 2 === 1 ? 8 : 23);
}
function dateToHalfMonth(d: Date): number {
  return d.getMonth() * 2 + (d.getDate() > 15 ? 2 : 1);
}
function halfMonthLabel(i: number): string {
  const m = MONTHS[Math.floor((i - 1) / 2)];
  return `${i % 2 === 1 ? '1re' : '2de'} quinz. ${m}`;
}

export default function ConseilsScreen() {
  const { climate, planches, settings } = useAppState();
  const [plancheId, setPlancheId] = useState<string | null>(planches[0]?.id ?? null);
  const [adhocPrev, setAdhocPrev] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [halfMonth, setHalfMonth] = useState<number | null>(null); // null = aujourd'hui
  const [showBad, setShowBad] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Les planches sont chargées en asynchrone : sélectionner la première dès qu'elle existe.
  const [autoSelected, setAutoSelected] = useState(false);
  useEffect(() => {
    if (!autoSelected && planches.length > 0) {
      setPlancheId((id) => id ?? planches[0].id);
      setAutoSelected(true);
    }
    if (plancheId && !planches.some((p) => p.id === plancheId)) setPlancheId(null);
  }, [planches, autoSelected, plancheId]);

  const today = new Date();
  const date = halfMonth === null ? today : halfMonthToDate(halfMonth, today.getFullYear());
  const planche = planches.find((p) => p.id === plancheId) ?? null;

  const history: HistoryEntry[] = useMemo(() => {
    if (planche) return planche.history;
    if (adhocPrev) {
      const d = new Date(date);
      d.setMonth(d.getMonth() - 2);
      return [{ cropId: adhocPrev, date: d.toISOString().slice(0, 10) }];
    }
    return [];
  }, [planche, adhocPrev, date.getTime()]);

  const results = useMemo(
    () => recommend({ date, climate, history, includeAbri: settings.includeAbri }),
    [date.getTime(), climate, history, settings.includeAbri],
  );
  const visible = showBad ? results : results.filter((r) => r.verdict !== 'Déconseillé');
  const hiddenCount = results.length - visible.length;
  const previous = history[0] ? precedentInfo(history[0].cropId) : undefined;

  const shiftPeriod = (delta: number) => {
    const cur = halfMonth ?? dateToHalfMonth(today);
    setHalfMonth(((cur - 1 + delta + 24) % 24) + 1);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <Text style={styles.climate}>
          📍 {settings.placeLabel ?? (settings.location ? 'Position enregistrée' : 'Position non configurée (référence Paris)')}
        </Text>
        <Text style={styles.muted}>
          Climat {climate.zone} · calendrier {climate.offsetDays === 0 ? 'de référence' : `${climate.offsetDays > 0 ? '+' : ''}${climate.offsetDays} j`} ·
          gelées ~{doyToLabel(climate.lastFrostDoy)} → ~{doyToLabel(climate.firstFrostDoy)}
        </Text>
      </Card>

      <SectionTitle>Période</SectionTitle>
      <View style={styles.periodRow}>
        <Pressable onPress={() => shiftPeriod(-1)} hitSlop={10} style={styles.arrow}>
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.period}>
            {halfMonth === null
              ? `Aujourd'hui (${today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})`
              : halfMonthLabel(halfMonth)}
          </Text>
          {halfMonth !== null && (
            <Pressable onPress={() => setHalfMonth(null)}>
              <Text style={styles.link}>Revenir à aujourd'hui</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => shiftPeriod(1)} hitSlop={10} style={styles.arrow}>
          <Text style={styles.arrowText}>▶</Text>
        </Pressable>
      </View>

      <SectionTitle>Planche</SectionTitle>
      <View style={styles.wrap}>
        {planches.map((p) => (
          <Chip key={p.id} label={p.name} selected={p.id === plancheId} onPress={() => setPlancheId(p.id)} />
        ))}
        <Chip label="Sans planche" selected={plancheId === null} onPress={() => setPlancheId(null)} />
      </View>
      {plancheId === null && (
        <Pressable onPress={() => setPickerOpen(true)} style={styles.prevBox}>
          <Text style={styles.muted}>Culture précédente</Text>
          <Text style={styles.prevName}>{adhocPrev ? precedentInfo(adhocPrev)?.name : 'Choisir… (facultatif)'}</Text>
        </Pressable>
      )}
      {planche && (
        <Text style={[styles.muted, { marginBottom: 8 }]}>
          Précédent : {previous ? previous.name : 'aucun historique — ajoutez-en dans l\'onglet Planches'}
        </Text>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.muted}>Afficher les cultures déconseillées{hiddenCount ? ` (${hiddenCount})` : ''}</Text>
        <Switch value={showBad} onValueChange={setShowBad} trackColor={{ true: COLORS.green }} />
      </View>

      <SectionTitle>Cultures proposées ({visible.length})</SectionTitle>
      {visible.length === 0 && (
        <Card>
          <Text style={styles.muted}>Rien à semer ni planter à cette période. Pensez à un engrais vert ou au paillage de la planche.</Text>
        </Card>
      )}
      {visible.map((r, i) => (
        <ResultCard
          key={r.crop.id}
          rank={i + 1}
          r={r}
          open={expanded === r.crop.id}
          onToggle={() => setExpanded(expanded === r.crop.id ? null : r.crop.id)}
        />
      ))}

      <CropPicker
        visible={pickerOpen}
        title="Culture précédente"
        onClose={() => setPickerOpen(false)}
        onPick={(id) => {
          setAdhocPrev(id);
          setPickerOpen(false);
        }}
      />
    </ScrollView>
  );
}

function ResultCard({ r, rank, open, onToggle }: { r: Recommendation; rank: number; open: boolean; onToggle: () => void }) {
  const color = VERDICT_COLOR[r.verdict];
  return (
    <Pressable onPress={onToggle}>
      <Card style={{ borderLeftWidth: 5, borderLeftColor: color }}>
        <View style={styles.resultHead}>
          <View style={[styles.score, { borderColor: color }]}>
            <Text style={[styles.scoreText, { color }]}>{r.score}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cropName}>
              {rank}. {r.crop.name}
            </Text>
            <Text style={styles.muted}>
              {r.crop.family} · {ACTION_LABEL[r.action]}
            </Text>
          </View>
          <Text style={[styles.verdict, { color }]}>{r.verdict}</Text>
        </View>
        {open && (
          <View style={{ marginTop: 10 }}>
            {r.reasons.map((x, i) => (
              <Text key={i} style={[styles.reason, { color: x.delta > 0 ? COLORS.excellent : x.delta < 0 ? COLORS.deconseille : COLORS.muted }]}>
                {x.delta > 0 ? '＋' : x.delta < 0 ? '－' : '•'} {x.text}
              </Text>
            ))}
            {r.crop.tip && <Text style={styles.tip}>💡 {r.crop.tip}</Text>}
            {r.crop.goodNeighbours && <Text style={styles.small}>Bons voisins : {r.crop.goodNeighbours.join(', ')}</Text>}
            {r.crop.badNeighbours && <Text style={styles.small}>À éloigner : {r.crop.badNeighbours.join(', ')}</Text>}
            <Text style={styles.small}>
              Délai de retour conseillé : {r.crop.returnYears} an(s) · cycle ~{r.crop.cycleDays} j
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  climate: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  muted: { color: COLORS.muted, fontSize: 14 },
  periodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  arrow: { padding: 10, backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  arrowText: { fontSize: 16, color: COLORS.green },
  period: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  link: { color: COLORS.green, marginTop: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  prevBox: { backgroundColor: COLORS.card, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8 },
  prevName: { fontSize: 16, color: COLORS.text, marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },
  resultHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  score: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontWeight: '800', fontSize: 16 },
  cropName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  verdict: { fontWeight: '700', fontSize: 13 },
  reason: { fontSize: 14, marginBottom: 4 },
  tip: { fontSize: 14, color: COLORS.earth, marginTop: 6 },
  small: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
});
