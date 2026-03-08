export const runtime = "edge";

import Anthropic from "@anthropic-ai/sdk";
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

    const client = new Anthropic({ apiKey: key });

    const angleInfo = formatAngleInfo(trunkAngle, neckAngle);

    const response = await client.messages.create({
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
    });

    const text = response.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Error during real-time analysis", {
      status: 500,
    });
  }
}
