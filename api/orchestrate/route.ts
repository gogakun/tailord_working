// src/app/api/orchestrate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { researchOutfit } from "@/agents/research";
import { findProductsForQuery } from "@/agents/search";

const Body = z.object({ query: z.string().min(1) });

export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const backend = process.env.BACKEND_URL;
    if (backend) {
      const r = await fetch(`${backend}/recommend`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: await req.text(),
      });
      return new NextResponse(await r.text(), {
        status: r.status,
        headers: { "content-type": "application/json" },
      });
    }

    const body = Body.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: "Bad input" }, { status: 400 });

    const spec = await researchOutfit(body.data.query);

    const all = (
      await Promise.all(
        spec.map(async (s) => {
          // IMPORTANT: exclude color from query; pass role for scoring.
          const q = s.query || (s.role === "bottom" ? "jeans" : s.role === "top" ? "shirt" : s.role === "shoes" ? "sneakers" : s.role === "outerwear" ? "jacket" : s.role === "accessory" ? "bag" : "");
          return findProductsForQuery(q, { role: s.role, limit: 3, budgetUSD: s.budgetUSD });
        })
      )
    ).flat();

    const seen = new Set<string>();
    const items = all.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("orchestrate error:", e);
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
