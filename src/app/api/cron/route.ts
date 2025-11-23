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

    const subs = await redis.smembers("subscriptions");

    const payload = JSON.stringify({
        title: "Mensagem diária ☀️",
        body: "Bom dia! São 10h da manhã!",
        icon: "/icons/icon192.png",
        url: "/",
    });

    for (const sub of subs) {
        try {
            const parsed = JSON.parse(sub);
            await webPush.sendNotification(parsed, payload);
        } catch (err) {
            console.error("Erro ao enviar push:", err);
        }
    }

    return NextResponse.json({ ok: true });
}
