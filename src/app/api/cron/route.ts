import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import webPush from "web-push";

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

    // Recupera todas as subscriptions do Redis
    const subs = await redis.smembers("subscriptions");

    // Aqui você poderia gerar a mensagem dinamicamente
    // Como no botão, você poderia chamar a mesma API /api/generate
    const payloadBase = {
        title: "Mensagem diária ☀️",
        icon: "/icons/icon192.png",
        url: "/",
    };

    for (const sub of subs) {
        try {
            const parsed = JSON.parse(sub);

            // Se quiser gerar uma mensagem para cada usuário, chamaria /api/generate?id=USER_ID
            // Mas se for uma mensagem padrão, pode usar assim:
            const payload = JSON.stringify({
                ...payloadBase,
                body: "Bom dia! Que seu dia seja incrível! ✨",
            });

            await webPush.sendNotification(parsed, payload);
        } catch (err) {
            console.error("Erro ao enviar push:", err, "SUB:", sub);

            await redis.srem("subscriptions", sub);
        }
    }

    return NextResponse.json({ ok: true });
}
