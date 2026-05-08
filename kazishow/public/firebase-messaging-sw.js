importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Replace the values below with your real Firebase config from the Vercel env vars
// (Service workers can't access process.env — paste the actual values here)
firebase.initializeApp({
  apiKey:            "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain:        "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId:         "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket:     "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "39456734949",
  appId:             "REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "KaziShow";
  const body  = payload.notification?.body  || "You have a new notification";
  const url   = payload.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    icon:    "/logo.png",
    badge:   "/badge.png",
    data:    { url },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
