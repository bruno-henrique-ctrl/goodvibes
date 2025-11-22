import { promises as fs } from "fs";
import webPush from "web-push";

const FILE = "subscriptions.json";

webPush.setVapidDetails(
    "mailto:seuemail@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function GET() {
    const file = await fs.readFile(FILE, "utf8");
    const subs = JSON.parse(file);

    const payload = JSON.stringify({
        title: "Mensagem diária ☀️",
        body: "Bom dia! São 10h da manhã!",
        icon: "/icons/icon192.png",
        url: "/",
    });

    for (const sub of subs) {
        try {
            await webPush.sendNotification(sub, payload);
        } catch (e) {
            console.error("Erro ao enviar push:", e);
        }
    }

    return Response.json({ ok: true });
}
