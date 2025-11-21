self.addEventListener('push', (e) => {
    console.log("📩 PUSH RECEBIDO NO SERVICE WORKER");

    let data = {};
    try {
        data = e.data.json();
        console.log("📦 DADOS DO PUSH:", data);
    } catch {
        console.log("⚠️ Erro ao ler o payload");
    }

    const title = data.title || "Sem título";
    const body = data.body || "Sem mensagem";
    const icon = data.icon || "/icon192.png";
    const url = data.url || "/";

    e.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon,
            data: { url }
        })
    );

    console.log("🔔 Notificação exibida");
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

