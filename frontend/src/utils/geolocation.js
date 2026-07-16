export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GEOLOCATION_UNSUPPORTED'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        if (err.code === 1) reject(new Error('GEOLOCATION_DENIED'));
        else if (err.code === 3) reject(new Error('GEOLOCATION_TIMEOUT'));
        else reject(new Error('GEOLOCATION_UNAVAILABLE'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

export const GEOLOCATION_ERROR_MESSAGES = {
  GEOLOCATION_UNSUPPORTED: "Votre appareil ne supporte pas la géolocalisation.",
  GEOLOCATION_DENIED: "Vous avez refusé l'accès à votre position. Vous pouvez l'autoriser dans les réglages de votre navigateur.",
  GEOLOCATION_TIMEOUT: "La localisation a pris trop de temps. Réessayez.",
  GEOLOCATION_UNAVAILABLE: "Impossible de déterminer votre position pour le moment.",
};

export function getGeolocationErrorMessage(err) {
  return GEOLOCATION_ERROR_MESSAGES[err.message] || GEOLOCATION_ERROR_MESSAGES.GEOLOCATION_UNAVAILABLE;
}