/** 姿勢推定に関する定数 */

/** 要注意の体幹前傾角（度） */
export const WARN_ANGLE = 30;

/** 危険な体幹前傾角（度） */
export const DANGER_ANGLE = 45;

/** LLM自動トリガーに必要な連続フレーム数（18 × 66ms ≈ 1.2秒） */
export const CONSECUTIVE_FRAMES_THRESHOLD = 18;

/** LLM呼び出しのクールダウン（ms） */
export const LLM_COOLDOWN = 15000;

/** 自動分析の間隔（ms）— 2秒ごとにAPI呼び出し */
export const AUTO_ANALYZE_INTERVAL = 2000;

/** MediaPipe検出間隔（ms） ≈ 15fps */
export const DETECT_INTERVAL = 66;

/** SVGアークゲージの長さ */
export const ARC_LEN = 160;

/** コアランドマーク（肩・腰）のvisibility閾値 */
export const CORE_VISIBILITY_THRESHOLD = 0.45;

/** 耳ランドマークのvisibility閾値 */
export const EAR_VISIBILITY_THRESHOLD = 0.30;
