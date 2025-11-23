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

    const payloadBase = {
        title: "Mensagem diária ☀️",
        icon: "/icons/icon192.png",
        url: "/",
    };

    for (const sub of subs) {
        try {
            const parsed: { userId: string; sub: PushSubscription } = JSON.parse(sub);

            const res = await fetch(`/api/generate?id=${parsed.userId}`);
            const data = await res.json();

            const payload = JSON.stringify({
                ...payloadBase,
                body: data.message || "Bom dia! Que seu dia seja incrível! ✨",
            });

            await webPush.sendNotification(parsed.sub, payload);
        } catch (err) {
            console.error("Erro ao enviar push:", err, "SUB:", sub);
        }
    }

    return NextResponse.json({ ok: true });
}
