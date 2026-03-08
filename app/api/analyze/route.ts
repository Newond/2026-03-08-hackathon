export const runtime = "edge";

import { NextRequest } from "next/server";
import {
  COACHING_SYSTEM_PROMPT,
  COACHING_USER_MESSAGE,
} from "@/lib/prompts/coaching-analysis";

export async function POST(req: NextRequest) {
  try {
    const { frames, apiKey } = (await req.json()) as {
      frames: string[];
      apiKey?: string;
    };

    if (!frames || frames.length === 0) {
      return new Response("No frames provided", { status: 400 });
    }

    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return new Response("API key not configured", { status: 401 });
    }

    // Build content blocks
    const content: unknown[] = [];
    frames.forEach((base64, i) => {
      content.push({ type: "text", text: `[Frame ${i + 1}]` });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64,
        },
      });
    });
    content.push({ type: "text", text: COACHING_USER_MESSAGE });

    // Call Anthropic API directly via fetch
    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: COACHING_SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      console.error("Anthropic API error:", apiRes.status, errBody);
      return new Response(`Anthropic API error: ${apiRes.status} - ${errBody}`, {
        status: apiRes.status,
      });
    }

    const data = (await apiRes.json()) as {
      content: { type: string; text?: string }[];
    };
    const text = data.content
      .map((c) => (c.type === "text" ? c.text ?? "" : ""))
      .join("");

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("analyze error:", msg);
    return new Response(`Analysis error: ${msg}`, { status: 500 });
  }
}
