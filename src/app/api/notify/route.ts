import webPush from "web-push";

export const runtime = "nodejs";

webPush.setVapidDetails(
    "mailto:seuemail@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
    let body;

    try {
        body = await req.json();
    } catch (err) {
        console.error("❌ Erro ao ler body:", err);
        return Response.json({ error: "Body inválido" }, { status: 400 });
    }

    const { subscription, payload } = body;

    try {
        await webPush.sendNotification(subscription, payload);
        return Response.json({ ok: true });
    } catch (err) {
        console.error("❌ Erro ao enviar push (detalhes):", err);
        return Response.json({ error: String(err) }, { status: 500 });
    }

}
