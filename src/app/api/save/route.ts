// /app/api/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        await redis.sadd("subscriptions", JSON.stringify(body));

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Erro ao salvar subscription:", err);
        return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
    }
}
