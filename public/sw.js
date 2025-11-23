self.addEventListener("push", (e) => {
    let data = {};

    try {
        if (!e.data) {
            return;
        }

        data = e.data.json();
    } catch (err) {
        const text = e.data.text();

        data = {
            title: "Nova Notificação",
            body: text
        };
        console.error("❌ Erro ao ler push:", err);
    }

    self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icons/icon192.png",
        data: { url: data.url || "/" },
        requireInteraction: true
    });
});

self.addEventListener("notificationclick", (e) => {
    e.notification.close();

    const url = e.notification.data?.url || "/";

    e.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                for (const client of windowClients) {
                    if (client.url === url && "focus" in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(url);
            })
    );
});