// Icons referenced below (icon-192.png, badge-72.png) are placeholders —
// drop matching PNGs into public/ once brand assets are available.

self.addEventListener('push', (event) => {
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Wenn Dashboard offen und sichtbar → kein Push zeigen
                const isActive = clientList.some(
                    client => client.visibilityState === 'visible'
                );
                if (isActive) return;

                const data = event.data?.json() ?? {};
                const title = data.title ?? 'Nouvaire';
                const options = {
                    body: data.body ?? '',
                    icon: '/icon-192.png',
                    badge: '/badge-72.png',
                    data: data.data ?? {},
                    vibrate: [200, 100, 200],
                    requireInteraction: data.data?.type === 'message',
                    tag: data.data?.notification_id?.toString() ?? 'nouvaire',
                };
                return self.registration.showNotification(title, options);
            })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const data = event.notification.data;
    let url = '/';
    if (data?.type === 'message' && data?.fourbased_user_id && data?.chat_id) {
        url = `/inbox/${data.fourbased_user_id}/chat/${data.chat_id}`;
    } else if (data?.type === 'message' && data?.fourbased_user_id) {
        url = `/inbox/${data.fourbased_user_id}`;
    } else if (data?.type === 'sale' || data?.type === 'tip') {
        url = '/';
    }
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    client.navigate(url);
                    return;
                }
            }
            clients.openWindow(url);
        })
    );
});
