export const runtime = "edge";

import { NextRequest } from "next/server";
import {
  buildSystemPrompt,
  buildUserMessage,
  formatAngleInfo,
} from "@/lib/prompts/realtime-posture";

export async function POST(req: NextRequest) {
  try {
    const { frame, trunkAngle, neckAngle, apiKey } = (await req.json()) as {
      frame: string;
      trunkAngle: number | null;
      neckAngle: number | null;
      apiKey?: string;
    };

    if (!frame) {
      return new Response("No frame provided", { status: 400 });
    }

    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return new Response("API key not configured", { status: 401 });
    }

    const angleInfo = formatAngleInfo(trunkAngle, neckAngle);

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 600,
        system: buildSystemPrompt(angleInfo),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: frame,
                },
              },
              {
                type: "text",
                text: buildUserMessage(angleInfo),
              },
            ],
          },
        ],
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
    console.error("realtime-analyze error:", msg);
    return new Response(`Analysis error: ${msg}`, { status: 500 });
  }
}
