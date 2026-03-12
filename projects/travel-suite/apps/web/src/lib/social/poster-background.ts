// ---------------------------------------------------------------------------
// Background image preparation (smart crop + enhancement)
// ---------------------------------------------------------------------------

import sharp from "sharp";

export async function prepareBackground(
  url: string,
  width: number,
  height: number
): Promise<Buffer> {
  let buffer: Buffer;
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1];
    if (!base64Data) throw new Error("Invalid data URL");
    buffer = Buffer.from(base64Data, "base64");
  } else {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Failed to fetch background: ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
  }

  return sharp(buffer)
    .resize(width, height, { fit: "cover", position: "attention" })
    .modulate({ saturation: 1.12, brightness: 0.97 })
    .sharpen({ sigma: 0.6 })
    .toBuffer();
}
