import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildClimateProfile, DEFAULT_LOCATION } from '../lib/climate';
import type { ClimateProfile, ClimateZone, CurrentCrop, HistoryEntry, Location, Planche } from '../lib/types';

export interface Settings {
  location: Location | null;
  placeLabel?: string;
  zoneOverride: ClimateZone | null;
  offsetOverride: number | null;
  includeAbri: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  location: null,
  zoneOverride: null,
  offsetOverride: null,
  includeAbri: true,
};

const KEY_SETTINGS = 'fc.settings.v1';
const KEY_PLANCHES = 'fc.planches.v1';

interface AppStateValue {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  climate: ClimateProfile;
  planches: Planche[];
  addPlanche: (name: string) => Planche;
  renamePlanche: (id: string, name: string) => void;
  deletePlanche: (id: string) => void;
  addHistory: (plancheId: string, entry: HistoryEntry) => void;
  removeHistory: (plancheId: string, index: number) => void;
  /** Définit (ou retire avec null) la culture en cours. */
  setCurrent: (plancheId: string, current: CurrentCrop | null) => void;
  /** Termine la culture en cours : elle passe dans l'historique de la planche. */
  finishCurrent: (plancheId: string) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [planches, setPlanches] = useState<Planche[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([AsyncStorage.getItem(KEY_SETTINGS), AsyncStorage.getItem(KEY_PLANCHES)]);
        if (s) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(s) });
        if (p) setPlanches(JSON.parse(p));
      } catch {
        // stockage illisible : on repart des valeurs par défaut
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)).catch(() => {});
  }, [settings, ready]);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY_PLANCHES, JSON.stringify(planches)).catch(() => {});
  }, [planches, ready]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);

  const climate = useMemo(
    () =>
      buildClimateProfile(settings.location ?? DEFAULT_LOCATION, {
        zone: settings.zoneOverride,
        offsetDays: settings.offsetOverride,
      }),
    [settings.location, settings.zoneOverride, settings.offsetOverride],
  );

  const addPlanche = useCallback((name: string) => {
    const p: Planche = { id: newId(), name: name.trim() || 'Planche', history: [] };
    setPlanches((list) => [...list, p]);
    return p;
  }, []);
  const renamePlanche = useCallback(
    (id: string, name: string) => setPlanches((l) => l.map((p) => (p.id === id ? { ...p, name } : p))),
    [],
  );
  const deletePlanche = useCallback((id: string) => setPlanches((l) => l.filter((p) => p.id !== id)), []);
  const addHistory = useCallback(
    (plancheId: string, entry: HistoryEntry) =>
      setPlanches((l) =>
        l.map((p) =>
          p.id === plancheId
            ? { ...p, history: [...p.history, entry].sort((a, b) => b.date.localeCompare(a.date)) }
            : p,
        ),
      ),
    [],
  );
  const removeHistory = useCallback(
    (plancheId: string, index: number) =>
      setPlanches((l) =>
        l.map((p) => (p.id === plancheId ? { ...p, history: p.history.filter((_, i) => i !== index) } : p)),
      ),
    [],
  );

  const setCurrent = useCallback(
    (plancheId: string, current: CurrentCrop | null) =>
      setPlanches((l) => l.map((p) => (p.id === plancheId ? { ...p, current } : p))),
    [],
  );
  const finishCurrent = useCallback(
    (plancheId: string) =>
      setPlanches((l) =>
        l.map((p) =>
          p.id === plancheId && p.current
            ? {
                ...p,
                current: null,
                history: [...p.history, { cropId: p.current.cropId, date: p.current.sownDate }].sort((a, b) =>
                  b.date.localeCompare(a.date),
                ),
              }
            : p,
        ),
      ),
    [],
  );

  const value: AppStateValue = {
    ready,
    settings,
    updateSettings,
    climate,
    planches,
    addPlanche,
    renamePlanche,
    deletePlanche,
    addHistory,
    removeHistory,
    setCurrent,
    finishCurrent,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState hors du AppStateProvider');
  return v;
}
