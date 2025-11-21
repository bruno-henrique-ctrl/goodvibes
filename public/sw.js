self.addEventListener("push", (e) => {
    console.log("📩 PUSH RECEBIDO");

    let data = {};

    try {
        data = e.data.json();
        console.log("📦 JSON:", data);
    } catch (error) {
        const text = e.data.text();
        console.log("⚠️ TEXTO SIMPLES:", text);

        data = {
            title: "Nova Notificação",
            body: text
        };
    }

    self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/icons/icon192.png",
        data: { url: data.url || "/" }
    });
});


self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = e.notification.data;
    e.waitUntil(
        clients.matchAll({ type: 'window' }).then(windowClients => {
            for (let client of windowClients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

self.addEventListener("install", (event) => {
    console.log("SW instalado");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("SW ativado");
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
    console.log("Interceptando fetch:", event.request.url);
});

