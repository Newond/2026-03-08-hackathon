import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは介護・介助動作の専門家コーチです。
送られた動画フレームを時系列で確認し、以下の観点で分析してください。

分析観点：
- 身体の姿勢（腰・膝・背中の使い方）
- 重心移動・バランス
- 患者への接触・支持方法
- 移動・移乗動作の安全性
- ベッドメイキング・体位変換の手順

必ず以下の形式で出力してください（順番・見出しを変えないこと）：

## 総合スコア
SCORE:xx （xxは0〜100の整数）

## カテゴリ別評価
CATEGORY:姿勢・身体の使い方:xx:高
CATEGORY:重心移動・バランス:xx:中
CATEGORY:患者への接触・支持:xx:高
CATEGORY:動作の安全性:xx:高
CATEGORY:手順・技術:xx:中
（各xxは0〜100の整数、最後の項目は重要度：高／中／低）

## 要点まとめ
（最重要な改善ポイントを3つ以内で箇条書き。一文で簡潔に）

## 問題点
（箇条書きで具体的に。何番のフレームで何が問題かを明記）

## 改善方法
（問題点に対応した具体的な修正方法を箇条書きで）

## 総評
（全体的なフィードバックを2〜3文で）

専門用語はなるべく避け、実践しやすい言葉で説明してください。`;

export async function POST(req: NextRequest) {
  try {
    const { frames } = await req.json() as { frames: string[] };

    if (!frames || frames.length === 0) {
      return new Response("フレームがありません", { status: 400 });
    }

    // フレームをClaudeのimage contentに変換
    const imageContents: Anthropic.ImageBlockParam[] = frames.map((base64, i) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: base64,
      },
    }));

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
      text: "上記のフレームを時系列順に確認し、介助動作の問題点と改善方法を分析してください。",
    });

    // ストリーミングレスポンス
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("分析中にエラーが発生しました", { status: 500 });
  }
}
