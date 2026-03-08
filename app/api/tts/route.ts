import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json();

    // language: "en-US" for English sentences, "es-ES" for Spanish feedback
    const apiKey = process.env.GOOGLE_TTS_API_KEY!;

    const voiceMap: Record<string, { languageCode: string; name: string }> = {
      "en-US": { languageCode: "en-US", name: "en-US-Neural2-F" },
      "es-ES": { languageCode: "es-US", name: "es-US-Neural2-A" },
    };

    const voice = voiceMap[language] ?? voiceMap["en-US"];

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.languageCode,
            name: voice.name,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: language === "en-US" ? 0.85 : 1.0, // slightly slower for English practice
          },
        }),
      }
    );

    const data = await response.json();

    if (!data.audioContent) {
      console.error("TTS error:", data);
      return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }

    return NextResponse.json({ audioContent: data.audioContent });
  } catch (err) {
    console.error("TTS API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
