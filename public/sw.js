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
