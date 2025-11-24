import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import webPush, { PushSubscription } from "web-push";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

webPush.setVapidDetails(
    "mailto:seuemail@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
    const auth = req.headers.get("Authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (auth !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subs = await redis.smembers("subscriptions");

    const mensagens = [
        "Bom dia! ✨ Que sua manhã seja leve e cheia de paz.",
        "☀️ Nova manhã, novas oportunidades. Você consegue!",
        "✨ Desejo que hoje você receba boas notícias e bons momentos.",
        "🌻 Respire fundo. Hoje é um bom dia para recomeçar.",
        "💛 Que sua energia hoje atraia coisas lindas!"
    ];

    for (const sub of subs) {
        try {
            const msg = mensagens[Math.floor(Math.random() * mensagens.length)];
            const payload = JSON.stringify({
                title: "Mensagem Diária ☀️",
                body: msg,
                icon: "/icons/icon192.png",
                url: "/"
            });

            const subscription = JSON.parse(sub) as PushSubscription;
            await webPush.sendNotification(subscription, payload);
        } catch (err) {
            console.error("Erro ao enviar push:", err, "SUB:", sub);
        }
    }

    return NextResponse.json({ ok: true });
}
