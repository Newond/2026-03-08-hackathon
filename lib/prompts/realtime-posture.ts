/**
 * リアルタイム姿勢分析用のプロンプト
 *
 * ホーム画面で MediaPipe が閾値超過を検出した際に
 * Claude API へ送信するプロンプトを組み立てる。
 *
 * このファイルを編集することでプロンプトを調整できます。
 */

/** Claude API からのレスポンス型 */
export interface PostureAnalysisResult {
  risk: "高" | "中" | "低";
  summary: string;
  instructions: string[];
}

/**
 * システムプロンプトを生成する
 * @param angleInfo - "体幹前傾角: XX°, 頸部屈曲角: XX°" 形式の文字列
 */
export function buildSystemPrompt(angleInfo: string): string {
  return `あなたは介護の姿勢分析の専門家です。
ベッドから椅子への移乗介助場面の画像を分析し、介護者の姿勢に対するリスク評価と改善指示を提供してください。

以下の計測値が提供されます:
${angleInfo}

レスポンスは以下のJSON形式のみで返してください。マークダウンや前置き文は不要です。
体言止めは使わず、完結した文で出力してください（音声読み上げに使用するため）。

{
  "risk": "高" | "中" | "低",
  "summary": "1〜2文の状況説明",
  "instructions": ["具体的指示1", "具体的指示2", "具体的指示3"]
}`;
}

/**
 * ユーザーメッセージのテキスト部分を生成する
 * @param angleInfo - 角度情報文字列
 */
export function buildUserMessage(angleInfo: string): string {
  return `この画像の介護者の姿勢を分析してください。\n${angleInfo}`;
}

/**
 * 角度情報の文字列を組み立てる
 */
export function formatAngleInfo(
  trunkAngle: number | null,
  neckAngle: number | null
): string {
  return `体幹前傾角: ${trunkAngle ?? "不明"}°, 頸部屈曲角: ${neckAngle ?? "不明"}°`;
}

/**
 * Claude API レスポンスのテキストから JSON をパースする
 */
export function parsePostureResponse(text: string): PostureAnalysisResult {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("JSON パースに失敗しました");
  return JSON.parse(match[0]);
}
