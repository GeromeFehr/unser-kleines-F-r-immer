'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, Heart, ImagePlus, LoaderCircle, MapPin, Plus, RefreshCw, Save, Settings2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CATEGORIES, type CoupleSettings, type Journal, type Memory, type MemoryDraft } from '@/lib/forever/types';
import { DEFAULT_SETTINGS } from '@/lib/forever/content';
import { formatMemoryDate } from '@/lib/forever/time';
import { memorySchema, settingsSchema } from '@/lib/forever/validation';
import { compressPhoto, requestJson } from '@/lib/forever/client';
import { Header } from './header';
import { MemoryPhoto } from './memory-photo';
import { MemoryMap } from './memory-map';

type FormFields = Omit<MemoryDraft, 'latitude' | 'longitude'>;
const emptyForm = (): FormFields => ({ title: '', place: '', date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date()), story: '', category: 'Lieblingsmoment', photoUrl: '', photoAlt: '', isExample: false });
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Das hat gerade nicht geklappt. Bitte versuche es erneut.';
export function AdminPanel() {
  const [journal, setJournal] = useState<Journal | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [tab, setTab] = useState('memories'), [editing, setEditing] = useState<Memory | null>(null), [form, setForm] = useState<FormFields>(emptyForm), [lat, setLat] = useState(''), [lng, setLng] = useState('');
  const [baseline, setBaseline] = useState(''), [settings, setSettings] = useState<CoupleSettings>(DEFAULT_SETTINGS), [settingsBaseline, setSettingsBaseline] = useState(JSON.stringify(DEFAULT_SETTINGS));
  const [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false), [deleting, setDeleting] = useState<Memory | null>(null), [discardOpen, setDiscardOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null), formTop = useRef<HTMLDivElement>(null), skipUnload = useRef(false);
  const current = JSON.stringify({ form, lat, lng });
  const dirty = baseline ? current !== baseline : Boolean(form.title || form.place || form.story || form.photoUrl || lat || lng);
  const settingsDirty = JSON.stringify(settings) !== settingsBaseline;
  const busy = saving || uploading;
  const point = useMemo<[number, number] | null>(() => lat.trim() && lng.trim() && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat)) <= 85 && Math.abs(Number(lng)) <= 180 ? [Number(lat), Number(lng)] : null, [lat, lng]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await requestJson<Journal>('/api/journal'); setJournal(data); setSettings(data.settings); setSettingsBaseline(JSON.stringify(data.settings));
    } catch(e) { setError(errorText(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!dirty && !settingsDirty) return;
    const before = (event: BeforeUnloadEvent) => { if (!skipUnload.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty, settingsDirty]);
  function guard(action: () => void) { if (dirty || settingsDirty) { pendingAction.current = action; setDiscardOpen(true); } else action(); }
  function reset(m: Memory | null = null) {
    const f: FormFields = m ? { title: m.title, place: m.place, date: m.date, story: m.story, category: m.category, photoUrl: m.photoUrl, photoAlt: m.photoAlt, isExample: m.isExample } : emptyForm();
    const la = m ? String(m.latitude) : '', lo = m ? String(m.longitude) : '';
    setEditing(m); setForm(f); setLat(la); setLng(lo); setBaseline(JSON.stringify({ form: f, lat: la, lng: lo })); setError('');
  }
  function selectMemory(m: Memory) { guard(() => { reset(m); setSuccess(''); formTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
  async function saveMemory(event: FormEvent) {
    event.preventDefault(); if (busy) return; setError(''); setSuccess('');
    if (!point) { setError('Setze zuerst einen Pin auf der Karte oder gib gültige Koordinaten ein.'); return; }
    const parsed = memorySchema.safeParse({ ...form, latitude: point[0], longitude: point[1] });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setSaving(true);
    try {
      const result = await requestJson<Memory>(editing ? '/api/memories/' + editing.id : '/api/memories', { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...parsed.data, ...(editing ? { revision: editing.revision } : {}) }) });
      const complete = { ...editing, ...result } as Memory;
      setJournal(j => j ? { ...j, memories: [...j.memories.filter(m => m.id !== complete.id), complete].sort((a,b) => b.date.localeCompare(a.date)) } : j);
      reset(complete); setSuccess('Eure Erinnerung ist gespeichert. Sie ist jetzt auf eurer Karte zu sehen.');
    } catch(e) { setError(errorText(e)); } finally { setSaving(false); }
  }
  async function upload(file?: File) {
    if (!file || busy) return; setUploading(true); setError(''); setSuccess('');
    try {
      const compressed = await compressPhoto(file); const data = new FormData(); data.append('photo', compressed);
      const result = await requestJson<{ photoUrl: string }>('/api/upload', { method: 'POST', body: data });
      setForm(f => ({ ...f, photoUrl: result.photoUrl }));
    } catch(e) { setError(errorText(e)); } finally { setUploading(false); }
  }
  async function deleteMemory(m: Memory) {
    setSaving(true); setError(''); setSuccess('');
    try {
      await requestJson('/api/memories/' + m.id, { method: 'DELETE', body: JSON.stringify({ revision: m.revision }) });
      setJournal(j => j ? { ...j, memories: j.memories.filter(row => row.id !== m.id) } : j); if (editing?.id === m.id) reset();
      setSuccess('Die Erinnerung wurde entfernt.'); setDeleting(null);
    } catch(e) { setError(errorText(e)); setDeleting(null); } finally { setSaving(false); }
  }
  async function saveSettings(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess('');
    const parsed = settingsSchema.safeParse(settings); if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    setSaving(true);
    try {
      const result = await requestJson<CoupleSettings>('/api/settings', { method: 'PUT', body: JSON.stringify(parsed.data) });
      setSettings(result); setSettingsBaseline(JSON.stringify(result)); setJournal(j => j ? { ...j, settings: result } : j); setSuccess('Eure Namen und euer gemeinsamer Anfang sind gespeichert.');
    } catch(e) { setError(errorText(e)); } finally { setSaving(false); }
  }
  return <>
    <div onClickCapture={event => { const anchor = (event.target as HTMLElement).closest('a[href="/"]'); if (anchor && (dirty || settingsDirty)) { event.preventDefault(); guard(() => { skipUnload.current = true; location.href = '/'; }); } }}><Header settings={journal?.settings || DEFAULT_SETTINGS} admin guardLogout={action => guard(() => { skipUnload.current = true; action(); })} /></div>
    <main className="admin-main content-width"><div className="admin-heading"><div><p className="section-kicker"><Heart size={16} />Mit Liebe festhalten</p><h1>Platz für <em>eure Geschichte.</em></h1><p>Lieblingsorte sammeln, Fotos hinzufügen und kleine Momente bewahren.</p></div><span className="admin-secure"><Settings2 size={16} />Deine Verwaltung</span></div>
      <div aria-live="polite">{success && <div className="notice success-notice"><Check size={18} /><p>{success}</p><button aria-label="Hinweis schließen" onClick={() => setSuccess('')}><X size={17} /></button></div>}</div>
      {error && <div className="notice error-notice" role="alert"><p>{error}</p><Button variant="outline" disabled={busy} onClick={() => guard(() => { reset(); void load(); })}><RefreshCw size={16} />Liste neu laden</Button></div>}
      {loading && !journal ? <div className="admin-loading"><LoaderCircle className="spin" />Eure Erinnerungen werden geladen …</div> : !journal ? <div className="access-state"><h2>Gerade keine Verbindung.</h2><Button onClick={load}>Erneut versuchen</Button></div> : <Tabs value={tab} onValueChange={next => guard(() => { reset(); setSettings(journal.settings); setSettingsBaseline(JSON.stringify(journal.settings)); setTab(next); })}>
        <TabsList className="admin-tabs" variant="line"><TabsTrigger value="memories"><MapPin size={16} />Erinnerungen <span>{journal.memories.length}</span></TabsTrigger><TabsTrigger value="settings"><Settings2 size={16} />Unser Anfang</TabsTrigger></TabsList>
        <TabsContent value="memories"><div className="admin-workspace"><aside className="admin-list"><Button className="primary-button" disabled={busy} onClick={() => guard(() => { reset(); setSuccess(''); })}><Plus size={18} />Neue Erinnerung</Button><div className="admin-list-items">{journal.memories.map(m => <button key={m.id} className={'admin-memory-row' + (editing?.id === m.id ? ' active' : '')} disabled={busy} onClick={() => selectMemory(m)}><MemoryPhoto src={m.photoUrl} alt={m.photoAlt} /><span><strong>{m.title}</strong><small>{formatMemoryDate(m.date)}</small>{m.isExample && <small className="example-label">Beispiel</small>}</span></button>)}{!journal.memories.length && <p className="rail-message">Dein erster Pin wartet schon auf dich.</p>}</div><p className="admin-note">Die Beispiel-Pins kannst du bearbeiten oder löschen. Neue Erinnerungen werden für euch beide gespeichert.</p></aside>
          <div className="editor" ref={formTop}><div className="editor-title"><h2>{editing ? 'Diesen Moment bewahren' : 'Ein neuer Lieblingsmoment'}</h2>{dirty && <span className="unsaved">Noch nicht gespeichert</span>}</div>
            <div className="editor-map"><MemoryMap memories={journal.memories} selectedId={editing?.id} editable draftPoint={point} onPick={p => { if (!busy) { setLat(p.lat.toFixed(6)); setLng(p.lng.toFixed(6)); } }} onSelect={id => { const m = journal.memories.find(item => item.id === id); if (m && !busy) selectMemory(m); }} /></div>
            <form onSubmit={saveMemory} className="memory-form"><fieldset disabled={busy}>
              <div className="field-row coordinates"><label>Breitengrad<Input type="number" step="any" min="-85" max="85" value={lat} placeholder="53.5500" onChange={e => setLat(e.target.value)} required /></label><label>Längengrad<Input type="number" step="any" min="-180" max="180" value={lng} placeholder="10.0000" onChange={e => setLng(e.target.value)} required /></label><p>Auf die Karte klicken oder den rosafarbenen Pin verschieben.</p></div>
              <label>Wie heißt euer Moment?<Input value={form.title} maxLength={100} placeholder="Der Abend, an dem wir die Zeit vergessen haben" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
              <div className="field-row"><label>Ort<Input value={form.place} maxLength={120} placeholder="Zum Beispiel: Alster, Hamburg" onChange={e => setForm(f => ({ ...f, place: e.target.value }))} required /></label><label>Datum<Input type="date" min="1900-01-01" max="2200-12-31" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></label></div>
              <label>Kategorie<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Memory['category'] }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
              <label>Was macht diesen Moment besonders?<Textarea value={form.story} rows={5} maxLength={3000} placeholder="Manchmal sind es die kleinen Dinge, an die wir uns am längsten erinnern …" onChange={e => setForm(f => ({ ...f, story: e.target.value }))} required /><span className="field-note">{form.story.length} / 3.000 Zeichen</span></label>
              <div className="photo-editor"><div className="upload-preview"><MemoryPhoto src={form.photoUrl} alt={form.photoAlt} /></div><div><h3>Ein Bild sagt: Weißt du noch?</h3><p>JPG, PNG oder WebP. Große Fotos werden vor dem Hochladen verkleinert.</p><label className="upload-button"><ImagePlus size={18} />{uploading ? 'Foto wird vorbereitet …' : 'Foto auswählen'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>{form.photoUrl && <Button type="button" variant="ghost" onClick={() => setForm(f => ({ ...f, photoUrl: '', photoAlt: '' }))}>Foto entfernen</Button>}</div></div>
              <label>Oder ein Bildlink <span className="optional">optional</span><Input type="text" value={form.photoUrl} placeholder="https://…" maxLength={2048} onChange={e => setForm(f => ({ ...f, photoUrl: e.target.value }))} /></label>
              <label>Bildbeschreibung <span className="optional">für barrierefreien Zugang</span><Input value={form.photoAlt} maxLength={300} placeholder="Wir beide am Strand im Abendlicht" onChange={e => setForm(f => ({ ...f, photoAlt: e.target.value }))} /></label>
              <div className="switch-field"><label htmlFor="example-switch">Als Beispiel-Erinnerung kennzeichnen<small>Aktiv lassen, solange der Pin nur ein Platzhalter ist.</small></label><Switch id="example-switch" checked={form.isExample} onCheckedChange={checked => setForm(f => ({ ...f, isExample: checked }))} /></div>
            </fieldset><div className="form-actions"><Button className="primary-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{uploading ? 'Foto wird hochgeladen …' : saving ? 'Wird gespeichert …' : 'Erinnerung speichern'}</Button>{editing && <Button type="button" variant="ghost" className="delete-button" disabled={busy} onClick={() => setDeleting(editing)}><Trash2 size={16} />Löschen</Button>}</div></form>
          </div></div></TabsContent>
        <TabsContent value="settings"><form className="settings-form" onSubmit={saveSettings}><h2>Hier hat unser Wir begonnen.</h2><p>Namen und Startzeit passen sich auf der gesamten Seite an.</p><fieldset disabled={busy}><div className="field-row"><label>Dein Lieblingsmensch<Input value={settings.firstName} maxLength={50} onChange={e => setSettings(s => ({ ...s, firstName: e.target.value }))} required /></label><label>Dein Name<Input value={settings.secondName} maxLength={50} onChange={e => setSettings(s => ({ ...s, secondName: e.target.value }))} required /></label></div><label>Zusammen seit<Input type="datetime-local" step="1" value={settings.startLocal} min="1900-01-01T00:00" max="2200-12-31T23:59" onChange={e => setSettings(s => ({ ...s, startLocal: e.target.value }))} required /></label><label>Zeitzone<select value={settings.timeZone} onChange={e => setSettings(s => ({ ...s, timeZone: e.target.value }))}><option value="Europe/Berlin">Deutschland · Europe/Berlin</option><option value="Europe/Vienna">Österreich · Europe/Vienna</option><option value="Europe/Zurich">Schweiz · Europe/Zurich</option><option value="UTC">UTC</option></select></label><p className="field-note">Der voreingestellte 12. Oktober 2023 um 20:00 Uhr ist ein Platzhalter. Sommer- und Winterzeit werden automatisch berücksichtigt.</p></fieldset><Button className="primary-button" disabled={busy || !settingsDirty}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}Änderungen speichern</Button></form></TabsContent>
      </Tabs>}
    </main>
    <AlertDialog open={!!deleting} onOpenChange={open => { if (!open && !saving) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Diese Erinnerung löschen?</AlertDialogTitle><AlertDialogDescription>„{deleting?.title}“ wird dauerhaft von eurer Karte entfernt.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>Behalten</AlertDialogCancel><AlertDialogAction className="delete-confirm" disabled={saving} onClick={event => { event.preventDefault(); if (deleting) void deleteMemory(deleting); }}>{saving ? 'Wird gelöscht …' : 'Erinnerung löschen'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle><AlertDialogDescription>Du hast noch ungespeicherte Eingaben. Bleib hier, um sie zuerst zu speichern.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hier bleiben</AlertDialogCancel><AlertDialogAction onClick={() => { setDiscardOpen(false); pendingAction.current?.(); pendingAction.current = null; }}>Verwerfen und weiter</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}
