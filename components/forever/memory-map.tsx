'use client';
import { useEffect, useRef, useState } from 'react';
import { Expand, MapPin, Minus, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadLeaflet, type Leaflet, type MapInstance, type Marker, type LatLng } from '@/lib/forever/leaflet';
import type { Memory } from '@/lib/forever/types';
import { formatMemoryDate } from '@/lib/forever/time';

type Props = {
  memories: Memory[]; selectedId?: string | null; onSelect?: (id: string) => void;
  editable?: boolean; draftPoint?: [number, number] | null; onPick?: (point: LatLng) => void;
};
const colors: Record<string, string> = { Lieblingsmoment: '#b5677b', Date: '#96734f', Abenteuer: '#698a86', Meilenstein: '#8c799b' };
function pin(L: Leaflet, category: string, draft = false) {
  return L.divIcon({ className: 'memory-marker-wrapper', html: `<span class="memory-marker${draft ? ' draft-marker' : ''}" style="--pin-color:${colors[category] || '#b5677b'}"><span>${draft ? '+' : '♡'}</span></span>`, iconSize: [40, 48], iconAnchor: [20, 44], popupAnchor: [0, -42] });
}
// User-provided strings are assigned via textContent, never interpolated into HTML.
function popupFor(m: Memory) {
  const card = document.createElement('article'); card.className = 'memory-popup';
  const photo = document.createElement('div'); photo.className = 'popup-photo';
  if (m.photoUrl) {
    const image = document.createElement('img'); image.src = m.photoUrl; image.alt = m.photoAlt || m.title; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
    image.onerror = () => { photo.textContent = 'Foto gerade nicht erreichbar'; photo.classList.add('photo-fallback'); };
    photo.appendChild(image);
  } else { photo.textContent = 'Platz für euren Moment'; photo.classList.add('photo-fallback'); }
  const body = document.createElement('div'); body.className = 'popup-body';
  const category = document.createElement('p'); category.className = 'popup-category'; category.textContent = m.isExample ? 'Beispiel-Erinnerung · Symbolbild' : m.category;
  const title = document.createElement('h3'); title.textContent = m.title;
  const date = document.createElement('p'); date.className = 'popup-date'; date.textContent = formatMemoryDate(m.date) + ' · ' + m.place;
  const story = document.createElement('p'); story.className = 'popup-story'; story.textContent = m.story;
  [category, title, date, story].forEach(node => body.appendChild(node)); card.appendChild(photo); card.appendChild(body); return card;
}
export function MemoryMap({ memories, selectedId, onSelect, editable = false, draftPoint, onPick }: Props) {
  const element = useRef<HTMLDivElement>(null), mapRef = useRef<MapInstance | null>(null), leaflet = useRef<Leaflet | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map()), draft = useRef<Marker | null>(null);
  const selectRef = useRef(onSelect), pickRef = useRef(onPick), memoriesRef = useRef(memories);
  selectRef.current = onSelect; pickRef.current = onPick; memoriesRef.current = memories;
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0), [tileError, setTileError] = useState(false);
  const fitted = useRef(false);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    let disposed = false, resize: ResizeObserver | undefined;
    setError(''); setReady(false); setTileError(false);
    loadLeaflet().then(L => {
      if (disposed || !element.current) return;
      leaflet.current = L;
      const map = L.map(element.current, { zoomControl: false, scrollWheelZoom: false, keyboard: true, minZoom: 2, maxZoom: 19, worldCopyJump: true });
      mapRef.current = map; map.setView([53.79, 10.39], 9);
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors', maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin' }).addTo(map);
      let failures = 0;
      tiles.on('tileerror', () => { if (++failures >= 3 && !disposed) setTileError(true); });
      tiles.on('tileload', () => { failures = 0; if (!disposed) setTileError(false); });
      if (editable) map.on('click', e => pickRef.current?.({ lat: Math.max(-85, Math.min(85, e.latlng.lat)), lng: ((e.latlng.lng + 180) % 360 + 360) % 360 - 180 }));
      resize = new ResizeObserver(() => map.invalidateSize()); resize.observe(element.current);
      setReady(true);
    }).catch(() => { if (!disposed) setError('Die Karte ist gerade nicht erreichbar. Eure Erinnerungen bleiben in der Liste sichtbar.'); });
    return () => { disposed = true; resize?.disconnect(); mapRef.current?.remove(); mapRef.current = null; markers.current.clear(); draft.current = null; fitted.current = false; };
  }, [retry, editable]);
  useEffect(() => {
    const map = mapRef.current, L = leaflet.current; if (!ready || !map || !L) return;
    for (const marker of markers.current.values()) map.removeLayer(marker); markers.current.clear();
    memories.forEach(m => {
      const marker = L.marker([m.latitude, m.longitude], { icon: pin(L, m.category), title: m.title, alt: m.title, keyboard: true, riseOnHover: true }).addTo(map);
      if (!editable) marker.bindPopup(popupFor(m), { maxWidth: 330, minWidth: 220, autoPanPadding: [24, 24], className: 'forever-popup' });
      marker.on('click', () => selectRef.current?.(m.id)); markers.current.set(m.id, marker);
    });
    if (!fitted.current && memories.length) {
      map.fitBounds(memories.map(m => [m.latitude, m.longitude]), { padding: [65, 65], maxZoom: 12, animate: false }); fitted.current = true;
    }
  }, [memories, ready, editable]);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready || !selectedId) return;
    const m = memories.find(item => item.id === selectedId); if (!m) return;
    map.flyTo([m.latitude, m.longitude], Math.max(map.getZoom(), 12), { animate: !reducedMotion(), duration: 0.7 });
    if (!editable) markers.current.get(m.id)?.openPopup();
  }, [selectedId, ready, memories, editable]);
  useEffect(() => {
    const map = mapRef.current, L = leaflet.current; if (!map || !L || !ready || !editable) return;
    if (!draftPoint) { if (draft.current) map.removeLayer(draft.current); draft.current = null; return; }
    if (draft.current) draft.current.setLatLng(draftPoint);
    else {
      draft.current = L.marker(draftPoint, { icon: pin(L, 'Lieblingsmoment', true), draggable: true, title: 'Position der Erinnerung – zum Verschieben ziehen' }).addTo(map);
      draft.current.on('dragend', event => { const p = event.target.getLatLng(); pickRef.current?.({ lat: Math.max(-85, Math.min(85, p.lat)), lng: ((p.lng + 180) % 360 + 360) % 360 - 180 }); });
    }
  }, [draftPoint, ready, editable]);
  function fitAll() {
    if (!memories.length) mapRef.current?.setView([53.79, 10.39], 9);
    else mapRef.current?.fitBounds(memories.map(m => [m.latitude, m.longitude]), { padding: [65, 65], maxZoom: 12, animate: !reducedMotion() });
  }
  return <div className={'memory-map-shell' + (editable ? ' editable-map' : '')}>
    <div ref={element} className="leaflet-surface" role="region" aria-label={editable ? 'Karte zum Setzen einer Erinnerung. Alternativ Koordinaten im Formular eingeben.' : 'Unsere interaktive Erinnerungskarte. Orte sind auch in der Liste auswählbar.'} />
    {!ready && !error && <div className="map-state"><MapPin className="gentle-pulse" /><p>Unsere Orte werden geladen …</p></div>}
    {error && <div className="map-state"><MapPin /><p>{error}</p><Button variant="outline" onClick={() => setRetry(r => r + 1)}><RefreshCw />Erneut versuchen</Button></div>}
    {tileError && <div className="map-warning" role="status">Der Kartenhintergrund ist gerade nicht erreichbar.<button onClick={() => setRetry(r => r + 1)}>Neu laden</button></div>}
    {ready && <>
      <div className="map-controls"><Button variant="outline" size="icon" aria-label="Karte vergrößern" onClick={() => mapRef.current?.zoomIn()}><Plus /></Button><Button variant="outline" size="icon" aria-label="Karte verkleinern" onClick={() => mapRef.current?.zoomOut()}><Minus /></Button><Button variant="outline" size="icon" aria-label="Alle Erinnerungen auf der Karte anzeigen" onClick={fitAll}><Expand /></Button></div>
      <div className="map-hint"><MapPin size={15} />{editable ? 'Auf die Karte tippen, um einen Pin zu setzen' : 'Jeder Pin ein kleines Stück von uns'}</div>
    </>}
  </div>;
}
