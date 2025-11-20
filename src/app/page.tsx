"use client";

import { useState, useEffect } from "react";
import { push } from "@/_utils/push";

const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY as string;

const goodVibesMessages = [
  "✨ Hoje é um ótimo dia para sorrir!",
  "💪 Continue firme, você consegue!",
  "🌸 Pequenos passos levam a grandes conquistas!",
  "☀️ Boa energia te cerca hoje!",
  "🌈 Um sorriso muda o dia de alguém!"
];

export default function Home() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => console.log("✅ SW registrado:", reg))
        .catch((err) => console.error("❌ Falha ao registrar SW:", err));
    }
  }, []);

  const pedirPermissao = async () => {
    console.log("Botão clicado");
    try {
      if (!("serviceWorker" in navigator)) {
        console.log("Service worker não suportado");
        return;
      }

      const register = await navigator.serviceWorker.ready;

      const sub = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: push(vapidKey),
      });

      setSubscription(sub);
      console.log("Subscrição criada:", sub);
    } catch (err) {
      console.error("Erro ao pedir permissão:", err);
    }
  };

  // ✅ Função para enviar Good Vibes
  const enviarGoodVibes = async () => {
    if (!subscription) return;
    console.log("Enviando Good Vibes...");
    const randomMessage = goodVibesMessages[Math.floor(Math.random() * goodVibesMessages.length)];

    const payload = {
      title: "Good Vibes ✨",
      body: randomMessage,
      icon: "/icon192.png",
      url: "/"
    };

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, payload }),
    });

    console.log("Good Vibes enviada:", payload.body);
  };

  return (
    <main>
      <h1>PWA</h1>
      <button type="button" onClick={pedirPermissao}>
        Permitir Notificações
      </button>

      <button type="button" onClick={enviarGoodVibes} disabled={!subscription}>
        Enviar Good Vibes
      </button>

      {subscription && (
        <pre>{JSON.stringify(subscription.toJSON(), null, 2)}</pre>
      )}
    </main>
  );
}
