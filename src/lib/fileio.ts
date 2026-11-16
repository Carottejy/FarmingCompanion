// Lecture / partage de fichiers — version Android et iOS (la version web est dans fileio.web.ts).
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Ouvre le sélecteur de fichiers et renvoie le contenu (null si annulé). */
export async function pickFileBytes(): Promise<{ name: string; bytes: Uint8Array } | null> {
  const res = await DocumentPicker.getDocumentAsync({
    // « */* » : certains gestionnaires Android ne déclarent pas le type des .xlsx ;
    // le contenu est vérifié à la lecture.
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const bytes = await new File(asset.uri).bytes();
  return { name: asset.name, bytes };
}

/** Enregistre le fichier dans le cache puis ouvre la feuille de partage (Fichiers, Drive, mail…). */
export async function shareFile(name: string, bytes: Uint8Array, mimeType = XLSX_MIME): Promise<void> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(bytes);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Le partage de fichiers n\'est pas disponible sur cet appareil.');
  await Sharing.shareAsync(file.uri, {
    mimeType,
    UTI: 'org.openxmlformats.spreadsheetml.sheet',
    dialogTitle: 'Exporter les planches',
  });
}
