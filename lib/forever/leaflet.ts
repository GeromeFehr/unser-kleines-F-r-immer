// Leaflet is deliberately loaded through a pinned CDN URL, as requested.
export type LatLng = { lat: number; lng: number };
type LeafletEvent = { latlng: LatLng; target: Marker };
export type MapInstance = {
  setView(point: [number, number], zoom: number, options?: object): MapInstance;
  flyTo(point: [number, number], zoom: number, options?: object): MapInstance;
  fitBounds(points: [number, number][], options?: object): MapInstance;
  on(event: string, callback: (event: LeafletEvent) => void): MapInstance;
  off(event: string, callback?: (event: LeafletEvent) => void): MapInstance;
  remove(): void; removeLayer(layer: Layer | Marker): MapInstance; invalidateSize(): MapInstance;
  getZoom(): number; zoomIn(): void; zoomOut(): void; closePopup(): void;
};
export type Layer = { addTo(map: MapInstance): Layer; on(event: string, callback: () => void): Layer };
export type Marker = {
  addTo(map: MapInstance): Marker; bindPopup(element: HTMLElement, options?: object): Marker;
  openPopup(): Marker; closePopup(): Marker; on(event: string, callback: (event: LeafletEvent) => void): Marker;
  setLatLng(point: [number, number]): Marker; getLatLng(): LatLng;
};
export type Leaflet = {
  map(element: HTMLElement, options?: object): MapInstance;
  tileLayer(url: string, options: object): Layer;
  marker(point: [number, number], options?: object): Marker;
  divIcon(options: object): unknown;
};
declare global { interface Window { L?: Leaflet } }
let loading: Promise<Leaflet> | null = null;
export function loadLeaflet(): Promise<Leaflet> {
  if (window.L) return Promise.resolve(window.L);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const css = document.querySelector('#leaflet-css') || document.createElement('link');
    if (!css.id) {
      const link = css as HTMLLinkElement; link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='; link.crossOrigin = '';
      document.head.appendChild(link);
    }
    const script = document.createElement('script'); script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='; script.crossOrigin = ''; script.async = true;
    const timeout = window.setTimeout(failed, 15000);
    function failed() { window.clearTimeout(timeout); script.remove(); loading = null; reject(new Error('Die Karte konnte nicht geladen werden.')); }
    script.onerror = failed;
    script.onload = () => { window.clearTimeout(timeout); if (window.L) resolve(window.L); else failed(); };
    document.head.appendChild(script);
  });
  return loading;
}
