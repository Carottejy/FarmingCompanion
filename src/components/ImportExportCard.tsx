import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config';
import { pickFileBytes, shareFile } from '../lib/fileio';
import { applyImport, COLUMN_WIDTHS, exportFileName, exportRows, HEADER, parseImport, SHEET_NAME } from '../lib/planchesIO';
import { readTable, writeXlsx } from '../lib/sheet';
import { newId, useAppState } from '../state/AppState';
import { Button, Card } from './ui';

function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Importer', onPress: () => resolve(true) },
    ]),
  );
}

const list = (names: string[], max = 8) =>
  names.length <= max ? names.join(', ') : `${names.slice(0, max).join(', ')}… (+${names.length - max})`;

/** Import / export de l'historique des planches au format « Synthèse des planches » (.xlsx). */
export function ImportExportCard() {
  const { planches, replacePlanches } = useAppState();
  const [busy, setBusy] = useState<'import' | 'export' | null>(null);
  const [report, setReport] = useState<{ ok: boolean; lines: string[] } | null>(null);

  const doImport = async () => {
    setReport(null);
    setBusy('import');
    try {
      const file = await pickFileBytes();
      if (!file) return;
      const parsed = parseImport(readTable(file.bytes));
      if (parsed.rowCount === 0) {
        setReport({ ok: false, lines: ['Aucune ligne exploitable. Colonnes attendues : Planche, Légume, Date (MM/AAAA), Famille.'] });
        return;
      }
      const result = applyImport(planches, parsed, newId);
      const ok = await confirmAsync(
        'Importer les planches ?',
        `${file.name} : ${parsed.rowCount} lignes, ${parsed.groups.length} planches.\n` +
          `• ${result.created.length} planche(s) créée(s)\n` +
          `• ${result.updated.length} planche(s) mise(s) à jour : leur historique sera remplacé par celui du fichier.\n` +
          'Les autres planches et les cultures en cours ne changent pas.',
      );
      if (!ok) return;
      replacePlanches(result.planches);
      const lines = [
        `✅ ${parsed.rowCount} cultures importées depuis ${file.name}.`,
        `${result.created.length} planche(s) créée(s), ${result.updated.length} mise(s) à jour.`,
      ];
      if (parsed.unknownNames.length)
        lines.push(`Légumes hors base gardés avec la famille du fichier : ${list(parsed.unknownNames)}.`);
      if (parsed.skipped.length)
        lines.push(`⚠️ ${parsed.skipped.length} ligne(s) ignorée(s) : ${parsed.skipped.slice(0, 5).map((s) => `ligne ${s.row} (${s.reason})`).join(', ')}.`);
      setReport({ ok: true, lines });
    } catch (e) {
      setReport({ ok: false, lines: [`Import impossible : ${(e as Error).message}`] });
    } finally {
      setBusy(null);
    }
  };

  const doExport = async () => {
    setReport(null);
    setBusy('export');
    try {
      const rows = exportRows(planches);
      const bytes = writeXlsx({ name: SHEET_NAME, header: HEADER, rows, widths: COLUMN_WIDTHS, textColumns: [2] });
      await shareFile(exportFileName(), bytes);
      setReport({ ok: true, lines: [`📤 ${rows.length} lignes exportées (${planches.length} planches).`] });
    } catch (e) {
      setReport({ ok: false, lines: [`Export impossible : ${(e as Error).message}`] });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <Text style={styles.muted}>
        Fichier Excel « Synthèse des planches » : colonnes Planche, Légume, Date (MM/AAAA), Famille. L'import crée les
        planches manquantes et met à jour l'historique des autres ; l'export produit le même format.
      </Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button small kind="secondary" title="📥 Importer" onPress={doImport} disabled={busy !== null} />
        </View>
        <View style={{ flex: 1 }}>
          <Button small kind="secondary" title="📤 Exporter" onPress={doExport} disabled={busy !== null || planches.length === 0} />
        </View>
      </View>
      {busy && <ActivityIndicator color={COLORS.green} style={{ marginTop: 6 }} />}
      {report?.lines.map((l, i) => (
        <Text key={i} style={[styles.report, !report.ok && { color: COLORS.deconseille }]}>
          {l}
        </Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  muted: { color: COLORS.muted, fontSize: 13, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  report: { fontSize: 13, color: COLORS.text, marginTop: 6 },
});
