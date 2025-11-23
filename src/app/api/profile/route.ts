import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, hobbies, goals, preferences, mood } = body;

        const userProfile = { id, name, hobbies, goals, preferences, mood };
        await redis.set(`user:${id}`, JSON.stringify(userProfile));

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Erro ao salvar perfil:", err);
        return NextResponse.json({ error: "Erro ao salvar perfil" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const data = await redis.get(`user:${id}`);
    if (!data) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const user = typeof data === "string" ? JSON.parse(data) : data;
    return NextResponse.json(user);
}
