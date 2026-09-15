export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...options, headers: { ...(options?.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...options?.headers } });
  const data = await response.json().catch(() => null);
  if (data === null) throw new Error('Die Sitzung oder Verbindung wurde unterbrochen. Bitte lade die Seite neu oder melde dich erneut an.');
  if (!response.ok) throw new Error(data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' ? data.error : 'Die Verbindung wurde unterbrochen. Bitte versuche es erneut.');
  return data as T;
}
export async function compressPhoto(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Bitte wähle JPG, PNG oder WebP. HEIC-Fotos vorher als JPG exportieren.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Das Originalfoto darf höchstens 25 MB groß sein.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url;
    await img.decode().catch(() => { throw new Error('Das Foto konnte nicht gelesen werden. Bitte wähle eine andere Bilddatei.'); });
    const scale = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Das Foto konnte nicht vorbereitet werden.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Bitte wähle ein anderes Foto.')), 'image/jpeg', 0.88));
    return new File([blob], 'erinnerung.jpg', { type: 'image/jpeg' });
  } finally { URL.revokeObjectURL(url); }
}
