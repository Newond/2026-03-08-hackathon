export const runtime = "edge";

import Anthropic from "@anthropic-ai/sdk";
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
      return new Response("フレームがありません", { status: 400 });
    }

    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return new Response("APIキーが設定されていません", { status: 401 });
    }

    const client = new Anthropic({ apiKey: key });

    // フレーム番号のラベルを挿入
    const contentBlocks: Anthropic.ContentBlockParam[] = [];
    frames.forEach((base64, i) => {
      contentBlocks.push({
        type: "text",
        text: `【フレーム ${i + 1}】`,
      });
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64,
        },
      } as Anthropic.ImageBlockParam);
    });
    contentBlocks.push({
      type: "text",
      text: COACHING_USER_MESSAGE,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: COACHING_SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const text = response.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("");

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error(e);
    return new Response("分析中にエラーが発生しました", { status: 500 });
  }
}
