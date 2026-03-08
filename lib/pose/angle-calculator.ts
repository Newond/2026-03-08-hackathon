/**
 * MediaPipe Pose Landmarker のランドマークから
 * 体幹前傾角・頸部屈曲角を算出する
 */

import {
  CORE_VISIBILITY_THRESHOLD,
  EAR_VISIBILITY_THRESHOLD,
} from "./constants";

export interface PoseAngles {
  trunk: number | null;
  neck: number | null;
}

interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * 33点のランドマーク配列から体幹前傾角と頸部屈曲角を計算する
 *
 * 使用ランドマーク:
 *   7,8  (left/right_ear)      → 頸部ベクトル
 *   11,12 (left/right_shoulder) → 体幹ベクトル上端
 *   23,24 (left/right_hip)      → 体幹ベクトル下端
 */
export function calcAngles(lm: Landmark[]): PoseAngles {
  // コア4点の visibility チェック
  const coreIndices = [11, 12, 23, 24];
  const coreVisible = coreIndices.every(
    (i) => (lm[i].visibility ?? 0) > CORE_VISIBILITY_THRESHOLD
  );
  if (!coreVisible) return { trunk: null, neck: null };

  // 中点計算
  const shoulderMid = {
    x: (lm[11].x + lm[12].x) / 2,
    y: (lm[11].y + lm[12].y) / 2,
  };
  const hipMid = {
    x: (lm[23].x + lm[24].x) / 2,
    y: (lm[23].y + lm[24].y) / 2,
  };

  // 体幹ベクトル（肩 - 腰）
  const tvx = shoulderMid.x - hipMid.x;
  const tvy = shoulderMid.y - hipMid.y;
  const tMag = Math.sqrt(tvx * tvx + tvy * tvy);

  // 体幹前傾角: arccos(-tvy / |trunk_vec|)
  // y軸下向きのため直立時 tvy < 0 → -tvy/mag ≈ 1 → arccos ≈ 0°
  const trunkAngle =
    tMag > 0.001
      ? Math.acos(Math.min(Math.max(-tvy / tMag, -1), 1)) * (180 / Math.PI)
      : 0;

  // 頸部屈曲角（耳が検出されている場合のみ）
  let neckAngle: number | null = null;
  const earVisible =
    (lm[7].visibility ?? 0) > EAR_VISIBILITY_THRESHOLD &&
    (lm[8].visibility ?? 0) > EAR_VISIBILITY_THRESHOLD;

  if (earVisible) {
    const earMid = {
      x: (lm[7].x + lm[8].x) / 2,
      y: (lm[7].y + lm[8].y) / 2,
    };
    const nvx = earMid.x - shoulderMid.x;
    const nvy = earMid.y - shoulderMid.y;
    const nMag = Math.sqrt(nvx * nvx + nvy * nvy);

    if (nMag > 0.001 && tMag > 0.001) {
      const dot = (nvx * tvx + nvy * tvy) / (nMag * tMag);
      neckAngle =
        Math.acos(Math.min(Math.max(dot, -1), 1)) * (180 / Math.PI);
    }
  }

  return {
    trunk: Math.round(trunkAngle),
    neck: neckAngle !== null ? Math.round(neckAngle) : null,
  };
}
