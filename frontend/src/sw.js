import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Precache injection point
precacheAndRoute(self.__WB_MANIFEST || [])

// Runtime caching for Netlify functions (zones & gardes-actuelle & gardes-nationwide)
registerRoute(
  ({ url }) => 
    url.pathname.includes('/.netlify/functions/zones') || 
    url.pathname.includes('/.netlify/functions/gardes-actuelle') ||
    url.pathname.includes('/.netlify/functions/gardes-nationwide'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours
      }),
    ],
  })
)

self.addEventListener('push', function(event) {
  let data = { title: "Notification", body: "Nouvelle information disponible." };
  if (event.data) {
      try {
        data = event.data.json();
      } catch(e) {}
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    data: data.data
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
      event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
