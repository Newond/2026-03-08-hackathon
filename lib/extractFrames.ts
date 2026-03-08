/**
 * 動画URLから指定枚数のフレームをbase64 JPEGとして抽出する
 */
export interface ExtractedFrame {
  base64: string;   // "data:image/jpeg;base64,..."
  timestamp: number; // 秒
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error(`seek failed at ${time}s`));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

export async function extractFrames(
  videoUrl: string,
  frameCount = 8,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const canvas = document.createElement("canvas");

      // 最大640px幅にリサイズ（API送信サイズを抑える）
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext("2d")!;

      const frames: ExtractedFrame[] = [];

      // 先頭と末尾を少し避けた均等間隔でフレームを取る
      const margin = duration * 0.03;
      const usable = duration - margin * 2;

      for (let i = 0; i < frameCount; i++) {
        const t =
          frameCount === 1
            ? duration / 2
            : margin + (usable / (frameCount - 1)) * i;

        try {
          await seekTo(video, t);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push({
            base64: canvas.toDataURL("image/jpeg", 0.82),
            timestamp: t,
          });
          onProgress?.(i + 1, frameCount);
        } catch (e) {
          console.warn(`Frame skip at ${t.toFixed(2)}s`, e);
        }
      }

      resolve(frames);
    };

    video.onerror = () =>
      reject(new Error("動画の読み込みに失敗しました"));
  });
}

/** base64 data URL → 送信用の純粋なbase64文字列 */
export function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1];
}
