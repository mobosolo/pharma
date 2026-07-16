export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function sortPharmaciesByDistance(pharmacies, userLocation) {
  if (!userLocation) return pharmacies;

  const withDistance = pharmacies.map((p) => {
    const lat = p.latitude !== null && p.latitude !== undefined ? parseFloat(p.latitude) : null;
    const lng = p.longitude !== null && p.longitude !== undefined ? parseFloat(p.longitude) : null;

    if (lat === null || lng === null || Number.isNaN(lat) || Number.isNaN(lng)) {
      return { ...p, distanceKm: null };
    }
    return { ...p, distanceKm: distanceKm(userLocation.lat, userLocation.lng, lat, lng) };
  });

  return withDistance.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}