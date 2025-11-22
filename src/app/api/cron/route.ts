import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import webPush from "web-push";

const FILE = path.join(process.cwd(), "subscriptions.json");

interface PushSubscriptionJSON {
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

webPush.setVapidDetails(
    "mailto:seuemail@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: NextRequest) {
    // 1️⃣ Autenticação do CRON
    const auth = req.headers.get("Authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (auth !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Carregar subscriptions
    const file = await fs.readFile(FILE, "utf8");
    const subs = JSON.parse(file) as PushSubscriptionJSON[];

    // 3️⃣ Mensagem a enviar
    const payload = JSON.stringify({
        title: "Mensagem diária ☀️",
        body: "Bom dia! São 10h da manhã!",
        icon: "/icons/icon192.png",
        url: "/",
    });

    // 4️⃣ Enviar push para todos
    for (const sub of subs) {
        try {
            await webPush.sendNotification(sub, payload);
        } catch (err) {
            console.error("Erro ao enviar push:", err);
        }
    }

    return NextResponse.json({ ok: true });
}
