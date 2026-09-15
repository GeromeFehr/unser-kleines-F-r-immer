'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, CalendarHeart, Heart, MapPin, RefreshCw, Shuffle, Sparkles, Ticket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { COMPLIMENTS, DEFAULT_SETTINGS, SURPRISES, type Surprise, type SurpriseKind } from '@/lib/forever/content';
import { anniversary, formatMemoryDate, formatStart, relationshipDuration } from '@/lib/forever/time';
import { requestJson } from '@/lib/forever/client';
import type { CoupleSettings, Journal, Memory } from '@/lib/forever/types';
import { Header } from './header';
import { MemoryMap } from './memory-map';
import { MemoryPhoto } from './memory-photo';
import { registerJournalTools } from '@/lib/forever/webmcp';

function Timer({ settings }: { settings: CoupleSettings }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => { setNow(new Date()); timer = setTimeout(tick, 1000 - (Date.now() % 1000) + 8); };
    tick(); const visible = () => { if (document.visibilityState === 'visible') { clearTimeout(timer); tick(); } };
    document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', visible); };
  }, []);
  const d = now ? relationshipDuration(settings, now) : null;
  const a = now ? anniversary(settings, now) : null;
  const units = [['years', 'Jahre', 'Jahr'], ['months', 'Monate', 'Monat'], ['days', 'Tage', 'Tag'], ['hours', 'Stunden', 'Stunde'], ['minutes', 'Minuten', 'Minute'], ['seconds', 'Sekunden', 'Sekunde']] as const;
  return <section className="time-panel" aria-label="Unsere gemeinsame Zeit">
    <div className="time-panel-top"><p><Heart size={16} />Jede Sekunde mit dir.</p><span>Seit {formatStart(settings)} Uhr</span></div>
    <div className="time-grid" role="timer" aria-live="off" aria-label={d ? units.map(([key, plural, singular]) => `${d[key]} ${d[key] === 1 ? singular : plural}`).join(', ') : 'Timer wird geladen'}>
      {units.map(([key, plural, singular]) => <div className={'time-unit unit-' + key} key={key}><span className="time-value">{d ? String(d[key]).padStart(2, '0') : '–'}</span><span className="time-label">{d?.[key] === 1 ? singular : plural}</span></div>)}
    </div>
    <div className="time-panel-bottom"><span>{d?.future ? 'Unser gemeinsamer Anfang liegt noch vor uns.' : <>Und das Schönste? <strong>Wir sind noch lange nicht fertig.</strong></>}</span>{a && !d?.future && <span className="anniversary"><CalendarHeart size={16} />{a.days === 0 ? `Heute ist unser ${a.number}. Jahrestag` : `Noch ${a.days} ${a.days === 1 ? 'Tag' : 'Tage'} bis zum ${a.number}. Jahrestag`}</span>}</div>
  </section>;
}
function SurpriseModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [kind, setKind] = useState<'Alle' | SurpriseKind>('Alle'), [idea, setIdea] = useState<Surprise>(SURPRISES[0]);
  const bags = useRef<Record<string, Surprise[]>>({}); const last = useRef('');
  const draw = useCallback((category: 'Alle' | SurpriseKind) => {
    if (!bags.current[category]?.length) {
      const pool = SURPRISES.filter(i => category === 'Alle' || i.kind === category);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      if (pool.at(-1)?.title === last.current && pool.length > 1) [pool[0], pool[pool.length - 1]] = [pool[pool.length - 1], pool[0]];
      bags.current[category] = pool;
    }
    const next = bags.current[category].pop()!; last.current = next.title; setIdea(next);
  }, []);
  useEffect(() => { if (open) draw(kind); }, [open, kind, draw]);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="surprise-modal" showCloseButton={false}>
    <DialogClose className="modal-close" aria-label="Überraschung schließen"><X size={20} /></DialogClose>
    <span className="surprise-icon">{idea.kind === 'Gutschein' ? <Ticket /> : <Sparkles />}</span>
    <DialogTitle className="surprise-heading">Ein bisschen Zeit für uns.</DialogTitle>
    <DialogDescription>Ein neuer kleiner Grund, heute etwas zusammen zu machen.</DialogDescription>
    <Tabs value={kind} onValueChange={value => setKind(value as typeof kind)}><TabsList className="idea-tabs" aria-label="Art der Überraschung"><TabsTrigger value="Alle">Alles</TabsTrigger><TabsTrigger value="Date-Idee">Dates</TabsTrigger><TabsTrigger value="Gutschein">Gutscheine</TabsTrigger><TabsTrigger value="Kleiner Quatsch">Quatsch</TabsTrigger></TabsList></Tabs>
    <div key={idea.title} className={'idea-reveal' + (idea.kind === 'Gutschein' ? ' is-voucher' : '')} aria-live="polite"><span className="idea-kind">{idea.kind}</span><h3>{idea.title}</h3><p>{idea.text}</p><small>{idea.note}</small></div>
    <Button className="primary-button" onClick={() => draw(kind)}><Shuffle size={17} />Noch eine Idee</Button>
  </DialogContent></Dialog>;
}
export function Dashboard() {
  const [journal, setJournal] = useState<Journal | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [compliment, setCompliment] = useState(0), [surpriseOpen, setSurpriseOpen] = useState(false), [selected, setSelected] = useState<string | null>(null), [detail, setDetail] = useState<Memory | null>(null);
  const settings = journal?.settings || DEFAULT_SETTINGS, memories = journal?.memories || [];
  const load = useCallback(async () => { setLoading(true); setError(''); try { setJournal(await requestJson<Journal>('/api/journal')); } catch(e) { setError(e instanceof Error ? e.message : 'Die Erinnerungen konnten nicht geladen werden.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); setCompliment(Math.floor(Math.random() * COMPLIMENTS.length)); }, [load]);
  useEffect(() => {
    let busy = false;
    const refresh = async () => { if (document.visibilityState !== 'visible' || busy) return; busy = true; try { setJournal(await requestJson<Journal>('/api/journal')); } catch { /* A later refresh can recover; do not discard the visible journal. */ } finally { busy = false; } };
    const timer = setInterval(refresh, 60000); document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  useEffect(() => registerJournalTools(memories, id => { setSelected(id); document.getElementById('erinnerungen')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }), [memories]);
  const changeCompliment = () => setCompliment(index => (index + 1 + Math.floor(Math.random() * (COMPLIMENTS.length - 1))) % COMPLIMENTS.length);
  return <>
    <a className="skip-link" href="#zuhause">Zum Inhalt</a><Header settings={settings} isAdmin={journal?.isAdmin} />
    <main>
      <section id="zuhause" className="dashboard-section content-width">
        <div className="dashboard-heading"><div><p className="hello">Hey {settings.firstName}, schön, dass du da bist <Heart size={15} /></p><h1>Unser kleines <em>Für immer.</em></h1></div><span className="heading-note">Ein Zuhause für<br />alles, was uns ausmacht.</span></div>
        {error && <div className="notice error-notice" role="alert"><p>{error}</p><Button variant="outline" onClick={load}><RefreshCw size={16} />Erneut laden</Button><a href="/signin-with-chatgpt?return_to=%2F" target="_top">Neu anmelden</a></div>}
        <Timer settings={settings} />
        <div className="little-moments">
          <section className="compliment-panel"><div className="panel-label"><Heart size={16} /><h2>Ein kleiner Liebesbrief</h2><span>für heute</span></div><blockquote key={compliment}>{COMPLIMENTS[compliment]}</blockquote><div className="compliment-footer"><span>Für dich, {settings.firstName}. <span className="signature-heart">♡</span></span><Button variant="ghost" size="icon" onClick={changeCompliment} aria-label="Ein anderes Kompliment anzeigen"><Shuffle size={18} /></Button></div></section>
          <section className="date-panel"><span className="date-icon"><Sparkles size={22} strokeWidth={1.5} /></span><h2>Heute schon<br /><em>zusammen gelächelt?</em></h2><p>Ein spontanes Date, ein kleiner Gutschein oder einfach ein bisschen Quatsch.</p><Button className="primary-button surprise-button" onClick={() => setSurpriseOpen(true)}>Mir ist langweilig... ✨<ArrowUpRight size={17} /></Button></section>
        </div>
        <a className="scroll-invitation" href="#erinnerungen"><span>Unsere Geschichte hat viele Lieblingsorte.</span><span className="scroll-circle"><ArrowDown size={17} /></span></a>
      </section>
      <section id="erinnerungen" className="map-section">
        <div className="map-heading"><div><p className="section-kicker"><MapPin size={16} />Unsere Erinnerungskarte</p><h2>Eine Karte. <em>Lauter Wir.</em></h2></div><span className="memory-count">{String(memories.length).padStart(2, '0')} <span>{memories.length === 1 ? 'kleine Geschichte' : 'kleine Geschichten'}</span></span></div>
        <div className="map-workspace"><aside className="memory-rail" aria-label="Liste unserer Erinnerungen"><div className="rail-heading"><h3>Unsere Momente</h3><Heart size={17} /></div>{loading && !journal && <p className="rail-message">Unsere Erinnerungen werden geladen …</p>}{!loading && !memories.length && <div className="empty-state"><MapPin size={27} /><h3>Hier beginnt unsere Karte.</h3><p>Der erste Lieblingsort wartet schon auf euch.</p>{journal?.isAdmin && <a href="/admin">Ersten Moment hinzufügen <ArrowUpRight size={16} /></a>}</div>}
          <div className="memory-list">{memories.map((m, i) => <article key={m.id} className={'memory-list-item' + (selected === m.id ? ' selected' : '')}><button className="memory-select" onClick={() => setSelected(m.id)} aria-label={m.title + ' auf der Karte anzeigen'} aria-pressed={selected === m.id}><div className="memory-thumb"><MemoryPhoto src={m.photoUrl} alt={m.photoAlt} /><span>{String(memories.length - i).padStart(2, '0')}</span></div><div className="memory-list-copy"><span className="memory-date">{formatMemoryDate(m.date)}</span><h4>{m.title}</h4><span className="memory-place"><MapPin size={12} />{m.place}</span>{m.isExample && <span className="example-label">Beispiel · Symbolbild</span>}</div></button><button className="story-link" onClick={() => setDetail(m)}>Den Moment ansehen <ArrowUpRight size={14} /></button></article>)}</div>
          {memories.some(m => m.isExample) && <p className="examples-note">Drei Beispiele zum Starten.<br />Eure echten Momente kommen dazu.</p>}
        </aside><MemoryMap memories={memories} selectedId={selected} onSelect={setSelected} /></div>
        <div className="map-footnote"><span>Manche Orte sind schön. Andere sind <em>unsere.</em></span>{journal?.isAdmin && <a href="/admin">Eine Erinnerung hinzufügen <ArrowUpRight size={15} /></a>}</div>
      </section>
    </main>
    <footer className="site-footer"><span>{settings.firstName} & {settings.secondName}</span><Heart size={15} /><span>Und ganz viel, das noch kommt.</span></footer>
    <SurpriseModal open={surpriseOpen} onOpenChange={setSurpriseOpen} />
    <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}><DialogContent className="detail-modal" showCloseButton={false}><DialogClose className="modal-close photo-close" aria-label="Erinnerung schließen"><X size={20} /></DialogClose>{detail && <><MemoryPhoto src={detail.photoUrl} alt={detail.photoAlt} className="detail-photo" /><div className="detail-body"><span className="idea-kind">{detail.isExample ? 'Beispiel-Erinnerung · Symbolbild' : detail.category}</span><DialogTitle>{detail.title}</DialogTitle><DialogDescription>{formatMemoryDate(detail.date)} · {detail.place}</DialogDescription><p className="detail-story">{detail.story}</p><Button variant="outline" onClick={() => { setSelected(detail.id); setDetail(null); document.getElementById('erinnerungen')?.scrollIntoView({ behavior: 'smooth' }); }}><MapPin size={16} />Auf der Karte ansehen</Button></div></>}</DialogContent></Dialog>
  </>;
}
