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
  const [userId, setUserId] = useState<string>("");
  const [loadingMensagem, setLoadingMensagem] = useState(false);

  useEffect(() => {
    const handler = async () => {
      if (Notification.permission === "default" || !subscription) {
        await pedirPermissao();
      }
      window.removeEventListener("click", handler);
    };

    window.addEventListener("click", handler);
  }, [subscription]);


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
      hobbies: hobbies.split(",").map(h => h.trim()).filter(h => h),
      goals: goals.split(",").map(g => g.trim()).filter(g => g),
      preferences: preferences.split(",").map(p => p.trim()).filter(p => p),
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

    setLoadingMensagem(true);

    try {
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
    } catch (err) {
      console.error(err);
      setMensagem("Erro ao carregar a mensagem. Tente novamente.");
    } finally {
      setLoadingMensagem(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 flex flex-col items-center justify-start p-6">
      <h1 className="text-4xl md:text-5xl font-bold text-purple-700 mb-6 text-center">Ola, {nome ? nome.toUpperCase() : 'Que bom ter você aqui'} ✨</h1>

      <details className="w-full max-w-md text-purple-700 bg-white p-4 rounded-xl shadow-md mb-6">
        <summary className="font-semibold cursor-cursor-pointer">Perfil (adicione suas informações)</summary>
        <p className="mt-2">
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-700"
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
        </p>
        <p>
          <input
            className="w-full px-4 py-2 border rounded-lg text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            type="text"
            placeholder="Como voce esta?"
            value={humor}
            onChange={e => setHumor(e.target.value)}
          />
        </p>

        <p>
          <input
            className="w-full px-4 py-2 border rounded-lg text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            type="text"
            placeholder="Seus hobbies (opcionais)"
            value={hobbies}
            onChange={e => setHobbies(e.target.value)}
          />
        </p>
        <p>
          <input
            className="w-full px-4 py-2 border rounded-lg text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            type="text"
            placeholder="Seus objetivos (opcionais)"
            value={goals}
            onChange={e => setGoals(e.target.value)}
          />
        </p>
        <p>
          <input
            className="w-full px-4 py-2 border rounded-lg text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
            type="text"
            placeholder="Suas preferências (opcionais)"
            value={preferences}
            onChange={e => setPreferences(e.target.value)}
          />
        </p>

        <button
          className="w-full px-4 py-2 cursor-pointer bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
          type="button"
          onClick={salvarPerfil}
        >
          Salvar Perfil
        </button>
      </details>

      <div className="w-full max-w-md mb-6 mx-auto">
        <p className="mt-2">
          <input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-purple-700"
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
        </p>
      </div>

      <div className="w-full max-w-md mb-6 mx-auto">
        <label className="block text-center text-3x1 md:text-base font-semibold text-purple-700 mb-2">
          Conte um pouco de como você está hoje:
        </label>
        <input
          className="w-full px-4 py-2 border rounded-lg text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
          type="text"
          placeholder="Escreva seu humor ou sentimentos..."
          onChange={e => setHumor(e.target.value)}
        />
      </div>

      <button
        className="px-6 py-3 cursor-pointer bg-yellow-400 text-white font-bold rounded-xl shadow-lg hover:bg-yellow-500 transition mb-6"
        type="button"
        onClick={enviarMensagem}
        disabled={!subscription}
      >
        Receber Mensagem
      </button>

      {loadingMensagem ? (
        <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-lg border-t-4 border-yellow-400 text-center">
          <p className="text-lg md:text-xl text-gray-800">Carregando mensagem... ✨</p>
        </div>
      ) : mensagem ? (
        <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-lg border-t-4 border-yellow-400">
          <p className="text-lg md:text-xl text-gray-800">{mensagem}</p>
        </div>
      ) : null}

    </main>
  );
}
