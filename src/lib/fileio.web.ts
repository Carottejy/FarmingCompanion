// Lecture / partage de fichiers — version web (web app iPhone, navigateur).

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Ouvre le sélecteur de fichiers du navigateur (Fichiers / iCloud sur iPhone). */
export function pickFileBytes(): Promise<{ name: string; bytes: Uint8Array } | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
    input.style.display = 'none';
    let settled = false;
    input.onchange = async () => {
      settled = true;
      const f = input.files?.[0];
      input.remove();
      if (!f) return resolve(null);
      try {
        resolve({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
      } catch (e) {
        reject(e);
      }
    };
    // Annulation : certains navigateurs émettent « cancel », sinon on résout au retour du focus.
    input.addEventListener('cancel', () => { if (!settled) { settled = true; input.remove(); resolve(null); } });
    document.body.appendChild(input);
    input.click();
  });
}

/**
 * iPhone (web app) : feuille de partage native (Enregistrer dans Fichiers, AirDrop, mail…).
 * Ailleurs : téléchargement classique.
 */
export async function shareFile(name: string, bytes: Uint8Array, mimeType = XLSX_MIME): Promise<void> {
  const blob = new Blob([bytes as BlobPart], { type: mimeType });
  const file = typeof File !== 'undefined' ? new File([blob], name, { type: mimeType }) : null;
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (file && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // partage annulé
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
