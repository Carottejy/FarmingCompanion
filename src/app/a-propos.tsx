import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, SectionTitle } from '../components/ui';
import { COLORS, RELEASES_API, RELEASES_PAGE } from '../config';
import { RELEASE_NOTES } from '../releaseNotes';
import { compareVersions, fetchReleases, type RemoteRelease } from '../lib/updates';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'uptodate'; latest?: RemoteRelease }
  | { kind: 'available'; latest: RemoteRelease }
  | { kind: 'error'; message: string };

export default function AProposScreen() {
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';
  const build = Application.nativeBuildVersion;
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [remote, setRemote] = useState<RemoteRelease[]>([]);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setStatus({ kind: 'loading' });
    try {
      const releases = await fetchReleases(RELEASES_API);
      setRemote(releases);
      setLastCheck(new Date());
      const latest = releases[0];
      if (latest && compareVersions(latest.version, version) > 0) setStatus({ kind: 'available', latest });
      else setStatus({ kind: 'uptodate', latest });
    } catch (e) {
      setStatus({ kind: 'error', message: (e as Error).message || 'Pas de connexion' });
    }
  }, [version]);

  useEffect(() => {
    check();
  }, [check]);

  const openUpdate = (r: RemoteRelease) => {
    Linking.openURL(Platform.OS === 'android' && r.apkUrl ? r.apkUrl : r.url);
  };

  // Notes : celles de GitHub si disponibles, complétées par les notes embarquées (hors connexion).
  const remoteVersions = new Set(remote.map((r) => r.version));
  const localOnly = RELEASE_NOTES.filter((n) => !remoteVersions.has(n.version));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={{ fontSize: 48 }}>🥕</Text>
        <Text style={styles.appName}>FarmingCompanion</Text>
        <Text style={styles.muted}>Le compagnon des planches du jardin partagé</Text>
      </View>

      <SectionTitle>Version</SectionTitle>
      <Card>
        <Text style={styles.text}>
          Version installée : <Text style={{ fontWeight: '700' }}>{version}</Text>
          {build ? ` (build ${build})` : ''}
        </Text>
        <Text style={styles.muted}>Plateforme : {Platform.OS === 'ios' ? 'iPhone / iPad' : Platform.OS === 'android' ? 'Android' : Platform.OS}</Text>
      </Card>

      <SectionTitle>Mises à jour</SectionTitle>
      <Card>
        {status.kind === 'loading' && <ActivityIndicator color={COLORS.green} />}
        {status.kind === 'uptodate' && (
          <Text style={[styles.text, { color: COLORS.excellent }]}>
            ✅ Vous avez la dernière version{status.latest ? ` (${status.latest.version})` : ''}.
          </Text>
        )}
        {status.kind === 'available' && (
          <>
            <Text style={[styles.text, { color: COLORS.earth, fontWeight: '700' }]}>
              🆕 Nouvelle version {status.latest.version} disponible ({status.latest.date})
            </Text>
            <Button
              title={Platform.OS === 'android' && status.latest.apkUrl ? 'Télécharger l\'APK' : 'Voir la mise à jour'}
              onPress={() => openUpdate(status.latest)}
            />
            {Platform.OS === 'android' && (
              <Text style={styles.muted}>Ouvrez le fichier téléchargé pour installer par-dessus la version actuelle (vos planches sont conservées).</Text>
            )}
            {Platform.OS === 'ios' && (
              <Text style={styles.muted}>Sur iPhone, la mise à jour s'installe depuis TestFlight ou l'App Store (ou se recharge automatiquement dans Expo Go).</Text>
            )}
          </>
        )}
        {status.kind === 'error' && <Text style={[styles.text, { color: COLORS.deconseille }]}>⚠️ {status.message}</Text>}
        {lastCheck && <Text style={styles.muted}>Dernière vérification : {lastCheck.toLocaleTimeString('fr-FR')}</Text>}
        <Button kind="secondary" title="Rechercher une mise à jour" onPress={check} disabled={status.kind === 'loading'} />
        <Button kind="secondary" title="Toutes les versions sur GitHub" onPress={() => Linking.openURL(RELEASES_PAGE)} />
      </Card>

      <SectionTitle>Notes de version</SectionTitle>
      {remote.map((r) => (
        <Card key={`r-${r.version}`}>
          <Text style={styles.relTitle}>
            {r.version} <Text style={styles.muted}>· {r.date}</Text>
            {compareVersions(r.version, version) === 0 ? <Text style={{ color: COLORS.green }}>  (installée)</Text> : null}
          </Text>
          <Text style={styles.body}>{r.body.trim() || r.name}</Text>
        </Card>
      ))}
      {localOnly.map((n) => (
        <Card key={`l-${n.version}`}>
          <Text style={styles.relTitle}>
            {n.version} <Text style={styles.muted}>· {n.date}</Text>
            {compareVersions(n.version, version) === 0 ? <Text style={{ color: COLORS.green }}>  (installée)</Text> : null}
          </Text>
          {n.notes.map((t, i) => (
            <Text key={i} style={styles.body}>
              • {t}
            </Text>
          ))}
        </Card>
      ))}

      <SectionTitle>Sources agronomiques</SectionTitle>
      <Card>
        <Text style={styles.body}>
          Règles de rotation, délais de retour et classement des exigences : fiches Agrobio Bretagne / FNAB, FiBL, ITAB,
          Bruxelles Environnement, FREDON, Académie d'agriculture de France, grilles DRAAF des précédents culturaux.
          Décalage climatique : loi bioclimatique de Hopkins. Ce sont des repères : votre observation du sol et de la météo prime.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 16 },
  appName: { fontSize: 24, fontWeight: '800', color: COLORS.green },
  text: { fontSize: 15, color: COLORS.text, marginBottom: 6 },
  muted: { fontSize: 13, color: COLORS.muted },
  relTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  body: { fontSize: 14, color: COLORS.text, marginBottom: 3, lineHeight: 20 },
});
