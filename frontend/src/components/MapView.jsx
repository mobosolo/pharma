import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Phone, MapPin, Navigation } from 'lucide-react';
import { formatDistance } from '../utils/distance';

const LOME_CENTER = [6.1375, 1.2123];
const DEFAULT_ZOOM = 13;

function parseCoords(pharmacie) {
  const lat = pharmacie.latitude !== null && pharmacie.latitude !== undefined
    ? parseFloat(pharmacie.latitude)
    : NaN;
  const lng = pharmacie.longitude !== null && pharmacie.longitude !== undefined
    ? parseFloat(pharmacie.longitude)
    : NaN;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) { map.setView(points[0], DEFAULT_ZOOM); return; }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function PharmacyPopup({ pharmacie }) {
  const tel = pharmacie.telephone || '';
  const telLink = tel.replace(/\s/g, '');
  const coords = parseCoords(pharmacie);
  return (
    <div className="min-w-[150px]">
      <p className="font-bold text-xs leading-snug m-0" style={{ color: 'var(--color-text)' }}>{pharmacie.nom}</p>
      {pharmacie.adresse && <p className="text-[11px] mt-0.5 m-0" style={{ color: 'var(--color-muted)' }}>{pharmacie.adresse}</p>}
      {pharmacie.distanceKm !== null && pharmacie.distanceKm !== undefined && (
        <p className="text-[11px] mt-1 m-0 font-semibold" style={{ color: 'var(--color-teal)' }}>
          <MapPin size={10} className="inline mr-0.5" />{formatDistance(pharmacie.distanceKm)}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        {telLink && <a href={`tel:${telLink}`} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--color-teal)' }}><Phone size={11} />Appeler</a>}
        {coords && <a href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'var(--color-teal)' }}><Navigation size={11} />Itinéraire</a>}
      </div>
    </div>
  );
}

export default function MapView({ pharmacies = [], userLocation = null }) {
  const withCoords = useMemo(() => pharmacies.map(p => ({ pharmacie: p, coords: parseCoords(p) })).filter(x => x.coords !== null), [pharmacies]);
  const withoutCoordsCount = pharmacies.length - withCoords.length;
  const boundsPoints = useMemo(() => {
    const pts = withCoords.map(({ coords }) => [coords.lat, coords.lng]);
    if (userLocation) pts.push([userLocation.lat, userLocation.lng]);
    return pts;
  }, [withCoords, userLocation]);
  const center = boundsPoints[0] || LOME_CENTER;

  if (withCoords.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center gap-3 text-center">
        <MapPin size={24} style={{ color: 'var(--color-muted)' }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Aucune pharmacie géolocalisée</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Les pharmacies de cette zone n'ont pas encore de coordonnées. Consultez la liste classique.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', height: 'min(60vh, 420px)', boxShadow: 'var(--shadow-card)' }}>
        <MapContainer center={center} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FitBounds points={boundsPoints} />
          {withCoords.map(({ pharmacie, coords }) => (
            <Marker key={pharmacie.id} position={[coords.lat, coords.lng]}>
              <Popup><PharmacyPopup pharmacie={pharmacie} /></Popup>
            </Marker>
          ))}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({ className: '', html: `<div style="width:14px;height:14px;border-radius:50%;background:var(--color-teal);border:2px solid #fff;box-shadow:0 0 0 3px rgba(13,148,136,.35);"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] })}>
              <Popup>Votre position</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
      {withoutCoordsCount > 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>{withoutCoordsCount} pharmacie{withoutCoordsCount > 1 ? 's' : ''} sans position — visibles dans la liste uniquement</p>
      )}
    </div>
  );
}
