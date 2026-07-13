const VAPID_PUBLIC_KEY = 'BKvt-sKFwbL3YpTrP_VX2EeYSSrhlEWCccO98iUW6cMs-_adPQO7l1yhPH84D5gBU0L068P_y634X002zFn0irA';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestPushSubscription() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permission for notifications not granted');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
      },
    };
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}
