import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, SectionTitle } from '../components/ui';
import { COLORS } from '../config';
import { detectZone, doyToLabel, ZONES } from '../lib/climate';
import { useAppState } from '../state/AppState';

// iOS : le pavé décimal n'a pas de signe moins (longitudes ouest) → clavier chiffres + ponctuation.
const COORD_KEYBOARD = Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric';

const num = (s: string) => {
  const v = parseFloat(s.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
};

export default function ParametresScreen() {
  const { settings, updateSettings, climate } = useAppState();
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [alt, setAlt] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings.location) {
      setLat(settings.location.latitude.toFixed(5));
      setLon(settings.location.longitude.toFixed(5));
      setAlt(settings.location.altitude != null ? String(Math.round(settings.location.altitude)) : '');
    }
  }, [settings.location]);

  const useGps = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setMessage('Autorisation de localisation refusée. Vous pouvez saisir les coordonnées à la main.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const loc = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude ?? undefined,
      };
      let placeLabel: string | undefined;
      try {
        const [addr] = await Location.reverseGeocodeAsync(loc);
        if (addr) placeLabel = [addr.city ?? addr.subregion, addr.region].filter(Boolean).join(', ') || undefined;
      } catch {
        // le géocodage inverse est facultatif
      }
      updateSettings({ location: loc, placeLabel });
      setMessage('Position du jardin enregistrée.');
    } catch (e) {
      setMessage(`Impossible d'obtenir la position : ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const saveManual = () => {
    const la = num(lat);
    const lo = num(lon);
    const al = alt.trim() ? num(alt) : null;
    if (la === null || lo === null || la < -90 || la > 90 || lo < -180 || lo > 180) {
      setMessage('Coordonnées invalides (latitude −90…90, longitude −180…180).');
      return;
    }
    updateSettings({ location: { latitude: la, longitude: lo, altitude: al ?? undefined }, placeLabel: undefined });
    setMessage('Coordonnées enregistrées.');
  };

  const detected = settings.location ? detectZone(settings.location) : null;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <SectionTitle>Position du jardin</SectionTitle>
      <Card>
        <Text style={styles.text}>
          {settings.location
            ? `${settings.placeLabel ? settings.placeLabel + ' · ' : ''}${settings.location.latitude.toFixed(4)}, ${settings.location.longitude.toFixed(4)}${settings.location.altitude != null ? ` · ${Math.round(settings.location.altitude)} m` : ''}`
            : 'Non configurée : les conseils utilisent le calendrier de référence (Paris).'}
        </Text>
        <Text style={styles.muted}>Faites-le depuis le jardin pour avoir l'altitude exacte.</Text>
        {busy ? <ActivityIndicator color={COLORS.green} style={{ margin: 12 }} /> : <Button title="📍 Utiliser ma position actuelle" onPress={useGps} />}

        <Text style={[styles.label, { marginTop: 12 }]}>Ou saisie manuelle</Text>
        <View style={styles.row}>
          <TextInput style={styles.input} placeholder="Latitude" keyboardType={COORD_KEYBOARD} value={lat} onChangeText={setLat} />
          <TextInput style={styles.input} placeholder="Longitude" keyboardType={COORD_KEYBOARD} value={lon} onChangeText={setLon} />
          <TextInput style={[styles.input, { flex: 0.7 }]} placeholder="Alt. (m)" keyboardType="numeric" value={alt} onChangeText={setAlt} />
        </View>
        <Button kind="secondary" title="Enregistrer les coordonnées" onPress={saveManual} />
        {message && <Text style={styles.message}>{message}</Text>}
      </Card>

      <SectionTitle>Climat</SectionTitle>
      <Card>
        <Text style={styles.text}>
          Zone utilisée : <Text style={{ fontWeight: '700' }}>{climate.zone}</Text>
          {detected && settings.zoneOverride && ` (détectée : ${detected})`}
        </Text>
        <Text style={styles.muted}>
          Calendrier décalé de {climate.offsetDays > 0 ? '+' : ''}{climate.offsetDays} jours par rapport à Paris (loi de Hopkins + correction de zone).
        </Text>
        <Text style={styles.muted}>
          Dernières gelées ~{doyToLabel(climate.lastFrostDoy)} · premières gelées ~{doyToLabel(climate.firstFrostDoy)}
        </Text>

        <Text style={[styles.label, { marginTop: 12 }]}>Forcer la zone</Text>
        <View style={styles.wrap}>
          <Chip label="Auto" selected={!settings.zoneOverride} onPress={() => updateSettings({ zoneOverride: null })} />
          {ZONES.map((z) => (
            <Chip key={z} label={z} selected={settings.zoneOverride === z} onPress={() => updateSettings({ zoneOverride: z })} />
          ))}
        </View>

        <Text style={styles.label}>Ajuster le décalage (microclimat, planche abritée…)</Text>
        <View style={styles.stepper}>
          <Button small kind="secondary" title="−7 j" onPress={() => updateSettings({ offsetOverride: climate.offsetDays - 7 })} />
          <Text style={styles.text}>
            {settings.offsetOverride === null ? 'Auto' : `${settings.offsetOverride > 0 ? '+' : ''}${settings.offsetOverride} j`}
          </Text>
          <Button small kind="secondary" title="+7 j" onPress={() => updateSettings({ offsetOverride: climate.offsetDays + 7 })} />
        </View>
        {settings.offsetOverride !== null && <Button small kind="secondary" title="Revenir au calcul automatique" onPress={() => updateSettings({ offsetOverride: null })} />}
      </Card>

      <SectionTitle>Conseils</SectionTitle>
      <Card>
        <View style={styles.toggle}>
          <Text style={[styles.text, { flex: 1 }]}>Proposer aussi les semis sous abri (godets, châssis)</Text>
          <Switch value={settings.includeAbri} onValueChange={(v) => updateSettings({ includeAbri: v })} trackColor={{ true: COLORS.green }} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  text: { fontSize: 15, color: COLORS.text, marginBottom: 4 },
  muted: { fontSize: 13, color: COLORS.muted, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  message: { marginTop: 8, color: COLORS.earth },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', alignItems: 'center' },
});
