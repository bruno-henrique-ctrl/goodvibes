"use client";

import { useState, useEffect } from "react";
import { push } from "@/_utils/push";
import { v4 as uuidv4 } from "uuid";

const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY as string;

export default function Home() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [nome, setNome] = useState("");
  const [humor, setHumor] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [goals, setGoals] = useState("");
  const [preferences, setPreferences] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editar, setEditar] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem("userProfile");
      if (saved) {
        const profile = JSON.parse(saved);
        setUserId(profile.id || uuidv4());
        setNome(profile.name || "");
        setHumor(profile.mood || "");
        setHobbies((profile.hobbies || []).join(", "));
        setGoals((profile.goals || []).join(", "));
        setPreferences((profile.preferences || []).join(", "));
      } else {
        setUserId(uuidv4());
      }

      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.register("/sw.js");
          const sub = await reg.pushManager.getSubscription();
          setSubscription(sub);
        } catch (err) {
          console.error(err);
        }
      }
    };
    init();
  }, []);

  const salvarPerfil = async () => {
    const profile = {
      id: userId,
      name: nome,
      hobbies: hobbies.split(",").map(h => h.trim()),
      goals: goals.split(",").map(g => g.trim()),
      preferences: preferences.split(",").map(p => p.trim()),
      mood: humor
    };

    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile)
    });

    localStorage.setItem("userProfile", JSON.stringify(profile));
  };

  const pedirPermissao = async () => {
    if (!("serviceWorker" in navigator)) return;

    const register = await navigator.serviceWorker.ready;
    const sub = await register.pushManager.getSubscription() ||
      await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: push(vapidKey),
      });

    setSubscription(sub);

    await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
  };

  const enviarMensagem = async () => {
    await salvarPerfil();

    const res = await fetch(`/api/generate?id=${userId}`);
    const data = await res.json();

    if (!subscription) return;

    const payload = JSON.stringify({
      title: `Olá, ${nome}! ✨`,
      body: data.message,
      icon: "/icons/icon192.png",
      url: "/"
    });

    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), payload }),
    });

    setMensagem(data.message);
  };

  return (
    <main>
      <h1>Good Vibes PWA</h1>

      <div>
        {!editar
          ? <button type="button" onClick={() => setEditar(true)}>Editar ou criar Perfil</button>
          : <button type="button" onClick={() => setEditar(false)}>Fechar Perfil</button>
        }
        <button type="button" onClick={pedirPermissao}>Permitir Notificações</button>
      </div>

      {editar && (
        <div>
          <input type="text" placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} />
          <input type="text" placeholder="Como você está hoje?" value={humor} onChange={e => setHumor(e.target.value)} />
          <input type="text" placeholder="Seus hobbies (separados por vírgula)" value={hobbies} onChange={e => setHobbies(e.target.value)} />
          <input type="text" placeholder="Seus objetivos (separados por vírgula)" value={goals} onChange={e => setGoals(e.target.value)} />
          <input type="text" placeholder="Suas preferências (separadas por vírgula)" value={preferences} onChange={e => setPreferences(e.target.value)} />
          <button type="button" onClick={salvarPerfil}>Salvar Perfil</button>
        </div>
      )}

      {nome && (
        <details>
          <summary>Perfil</summary>
          <p>Nome: {nome}</p>
          <p>Humor: {humor}</p>
          <p>Hobbies: {hobbies}</p>
          <p>Objetivos: {goals}</p>
          <p>Preferências: {preferences}</p>
        </details>
      )}

      {nome && <h2>Olá, {nome}</h2>}

      <h3>Como você está hoje?</h3>
      <input type="text" placeholder="Como você está hoje?" value={humor} onChange={e => setHumor(e.target.value)} />

      <button type="button" onClick={enviarMensagem} disabled={!subscription}>Receber Mensagem</button>
      {mensagem && <h2>{mensagem}</h2>}
    </main>
  );
}
