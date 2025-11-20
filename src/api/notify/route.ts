import webPush from "web-push";

export async function POST(req: Request) {
    const { subscription, payload } = await req.json();

    webPush.setVapidDetails(
        "mailto:seuemail@gmail.com",
        process.env.NEXT_PUBLIC_VAPID_KEY!,
        process.env.VAPID_PRIVATE_KEY!
    );

    try {
        await webPush.sendNotification(subscription, JSON.stringify(payload));
        return Response.json({ ok: true });
    } catch (err) {
        console.error("Erro ao enviar push:", err);
        return Response.json({ error: "Falha ao enviar notificação" }, { status: 500 });
    }
}
