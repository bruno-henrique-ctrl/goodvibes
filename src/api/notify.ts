import type { NextApiRequest, NextApiResponse } from "next";
import webPush from "web-push";

webPush.setVapidDetails(
    'mailto:you@example.com',
    process.env.NEXT_PUBLIC_VAPID_KEY!,
    process.env.NEXT_PRIVATE_VAPID_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { subscription, payload } = req.body;

    try {
        await webPush.sendNotification(subscription, JSON.stringify(payload));
        res.status(200).json({ message: "Good Vibes enviada!" });
    } catch (err) {
        console.error("Erro ao enviar notificação:", err);
        res.status(500).json({ error: "Falha ao enviar notificação" });
    }
}
