/**
 * Real-time posture analysis prompt
 *
 * Sent to Claude API when MediaPipe detects a threshold violation
 * on the Home screen.
 *
 * Edit this file to adjust the prompt.
 */

/** Response schema from Claude API */
export interface PostureAnalysisResult {
  phase: "prep" | "sitting_up" | "pre_lift" | "transfer";
  instruction: string;
  tone: "calm" | "sharp" | "encouraging";
}

/** Phase display labels */
export const PHASE_LABELS: Record<PostureAnalysisResult["phase"], string> = {
  prep: "Prep",
  sitting_up: "Sitting Up",
  pre_lift: "Pre-Lift",
  transfer: "Transfer",
};

/** Tone-based styling */
export const TONE_CONFIG: Record<
  PostureAnalysisResult["tone"],
  { badge: string; text: string }
> = {
  calm: {
    badge: "bg-emerald-500/20 text-emerald-400",
    text: "text-emerald-300",
  },
  sharp: { badge: "bg-red-500/20 text-red-400", text: "text-red-300" },
  encouraging: {
    badge: "bg-sky-500/20 text-sky-400",
    text: "text-sky-300",
  },
};

/**
 * Build the system prompt
 * @param angleInfo - e.g. "Trunk angle: 48°, Neck angle: 22°"
 */
export function buildSystemPrompt(angleInfo: string): string {
  return `【0. System Purpose & Goal】
Objective: Reduce caregiver back strain while supporting safe patient transfer.
Role: You are a real-time body mechanics coach.
Analyze the caregiver posture, patient position, and surrounding setup.
Give one immediate, actionable instruction that best improves safety and body mechanics.
Prioritize high-load risks and visible posture errors.
Do not provide medical diagnosis.

The following measurements are provided:
${angleInfo}

【1. Context Identification (Phase Determination)】
First, identify which phase of the transfer is shown in the image:
Prep (Low load: rolling, or leg positioning)
Sitting up (Medium load: Assisting the patient from lying to a sitting position)
Pre-Lift (Setup for High load: Establishing a stable base and patient's forward lean)
Transfer (High load: The actual lift, pivot, and seating into the wheelchair)

【2. Phase-Specific Decision Tree (The Logic)】
Check items in priority order. Output ONLY THE FIRST error detected. If all checks are "Optimal," output the designated encouragement message with its reason.

CONTEXT 1: Prep (Low Load Phase)
Focus: Environment and basic setup. No strict squatting required.
IF caregiver is too far from patient → "Get closer. Hips in."
IF patient's legs are flat → "Bend patient's knees."
ELSE (Optimal) → "Good prep. Ready to next step"

CONTEXT 2: Sitting up (Medium Load Phase)
Focus: Leveraging weight rather than muscle power.
IF caregiver's feet are too narrow → "Widen feet. Stable base."
IF caregiver's back is excessively hunched → "Back straight, chest up."
IF caregiver's elbows are far from body → "Lean back with weight."
ELSE (Optimal) → "Good leverage! Spine protected."

CONTEXT 3: Pre-Lift (Setup for High Load)
Focus: Critical safety. Shift the center of gravity before the lift.
IF caregiver's back is excessively bent → "Back straight. Hips down."
IF caregiver's feet are too narrow → "Widen feet. Stable base."
IF patient is too upright → "Lean patient forward."
IF wheelchair is too far from bed → "Wheelchair closer."
ELSE → "Strong setup. Ready to lift."

CONTEXT 4: Transfer (Maximum Load Phase)
Focus: Preventing spinal shear and ensuring a safe landing.
IF caregiver is twisting at the waist → "Step with the turn."
IF caregiver's elbows are open (Away from body) → "Tighten elbows. Stay close."
IF patient's seating is too shallow in the chair → "Sit them back deeply."
ELSE (Optimal) → "Smooth pivot! Great core control."

【3. Output Rules】
Respond with ONLY a JSON object. No markdown, no explanation, no preamble.

{
  "phase": "prep" | "sitting_up" | "pre_lift" | "transfer",
  "instruction": "Maximum 6 words",
  "tone": "calm" | "sharp" | "encouraging"
}

Tone guide:
- Prep: "calm"
- High-Load (Pre-Lift/Transfer) with errors: "sharp"
- Optimal (no errors): "encouraging"`;
}

/**
 * Build the user message text
 * @param angleInfo - Angle info string
 */
export function buildUserMessage(angleInfo: string): string {
  return `Analyze the caregiver's posture in this image.\n${angleInfo}`;
}

/**
 * Format angle information string
 */
export function formatAngleInfo(
  trunkAngle: number | null,
  neckAngle: number | null
): string {
  return `Trunk angle: ${trunkAngle ?? "unknown"}°, Neck angle: ${neckAngle ?? "unknown"}°`;
}

/**
 * Parse JSON from Claude API response text
 */
export function parsePostureResponse(text: string): PostureAnalysisResult {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Failed to parse JSON from response");
  return JSON.parse(match[0]);
}
