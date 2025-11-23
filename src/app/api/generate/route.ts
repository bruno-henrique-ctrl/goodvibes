import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const apiKey = process.env.DEEPSEEK_KEY;

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    const data = await redis.get(`user:${id}`);
    if (!data) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const user = typeof data === "string" ? JSON.parse(data) : data;

    const hobbies = user.hobbies?.join(", ") || "nenhum hobby registrado";
    const goals = user.goals?.join(", ") || "nenhum objetivo registrado";
    const preferences = user.preferences?.join(", ") || "nenhuma preferência registrada";

    const prompt = `
        Imagine que você é um amigo muito próximo de ${user.name} e quer enviar uma mensagem carinhosa e motivadora. 
        Ela está se sentindo ${user.mood} hoje. 
        Você conhece bem seus gostos e interesses, como seus hobbies: ${hobbies}, seus objetivos: ${goals}, 
        e coisas que ela gosta ou prefere: ${preferences}. 

        Escreva uma mensagem acolhedora e inspiradora, que encoraje ${user.name} a se sentir melhor, seguir seus objetivos e se alegrar com suas paixões. 
        Faça com que a mensagem pareça pessoal, calorosa e natural, como algo que um amigo verdadeiro escreveria.
    `;


    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "x-ai/grok-4.1-fast:free",
                messages: [{ role: "user", content: prompt }],
                reasoning: { "enabled": true }
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Erro da API: ${res.status} - ${text}`);
        }

        const result = await res.json();
        const message = result.choices?.[0]?.message?.content || "✨ Tenha um ótimo dia!";

        user.lastMessage = message;
        await redis.set(`user:${id}`, JSON.stringify(user));

        return NextResponse.json({ message });
    } catch (err) {
        console.error("Erro ao gerar mensagem:", err);
        return NextResponse.json({ message: "✨ Hoje é um ótimo dia para sorrir!" });
    }
}
