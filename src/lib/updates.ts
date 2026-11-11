/** Comparaison de versions sémantiques simples ("v1.2.3" ou "1.2.3"). Renvoie >0 si a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.replace(/^v/i, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

export interface RemoteRelease {
  version: string;
  name: string;
  date: string;
  body: string;
  url: string;
  apkUrl?: string;
}

interface GithubRelease {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  body: string | null;
  html_url: string;
  draft: boolean;
  prerelease: boolean;
  assets: { name: string; browser_download_url: string }[];
}

export function parseReleases(json: unknown): RemoteRelease[] {
  if (!Array.isArray(json)) return [];
  return (json as GithubRelease[])
    .filter((r) => !r.draft && !r.prerelease)
    .map((r) => ({
      version: r.tag_name.replace(/^v/i, ''),
      name: r.name || r.tag_name,
      date: (r.published_at ?? '').slice(0, 10),
      body: r.body ?? '',
      url: r.html_url,
      apkUrl: r.assets.find((a) => a.name.toLowerCase().endsWith('.apk'))?.browser_download_url,
    }))
    .sort((a, b) => compareVersions(b.version, a.version));
}

export async function fetchReleases(apiUrl: string): Promise<RemoteRelease[]> {
  let res: Response;
  try {
    res = await fetch(apiUrl, { headers: { Accept: 'application/vnd.github+json' } });
  } catch {
    throw new Error('Hors connexion : impossible de vérifier les mises à jour pour le moment.');
  }
  if (res.status === 404) throw new Error('Dépôt introuvable ou privé : rendez le dépôt public pour activer la recherche de mises à jour.');
  if (!res.ok) throw new Error(`GitHub a répondu ${res.status}`);
  return parseReleases(await res.json());
}
