import { NextRequest } from "next/server";
import { promises as fs } from "fs";

interface PushSubscriptionJSON {
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

const FILE = "subscriptions.json";

export async function POST(req: NextRequest) {
    const subscription = await req.json();

    const file = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(file);

    // evita duplicados
    const exists = data.find((x: PushSubscriptionJSON) => x.endpoint === subscription.endpoint);
    if (!exists) {
        data.push(subscription);
        await fs.writeFile(FILE, JSON.stringify(data, null, 2));
    }

    return Response.json({ ok: true });
}
