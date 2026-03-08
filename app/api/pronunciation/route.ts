import { NextRequest, NextResponse } from "next/server";

interface SpeechacePhone {
  phone: string;
  quality_score: number;
  sound_most_like: string;
}

interface SpeechaceWord {
  word: string;
  quality_score: number;
  phone_score_list: SpeechacePhone[];
}

interface SpeechaceResponse {
  status: string;
  text_score: {
    quality_score: number;
    fluency_score?: { overall_fluency_score: number };
    word_score_list: SpeechaceWord[];
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const referenceText = formData.get("referenceText") as string;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: "Missing audio or referenceText" }, { status: 400 });
    }

    const apiKey = process.env.SPEECHACE_API_KEY!;

    // Build multipart form for Speechace
    const speechaceForm = new FormData();
    speechaceForm.append("user_audio_file", audioFile, "recording.webm");
    speechaceForm.append("text", referenceText);
    speechaceForm.append("user_id", "speakup_user");
    speechaceForm.append("dialect", "en-us");

    const response = await fetch(
      `https://api.speechace.co/api/scoring/text/v0.5/json?key=${apiKey}`,
      {
        method: "POST",
        body: speechaceForm,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Speechace error:", errText);
      return NextResponse.json({ error: "Speechace API error" }, { status: 500 });
    }

    const data: SpeechaceResponse = await response.json();

    if (data.status !== "success") {
      console.error("Speechace returned non-success:", data);
      return NextResponse.json({ error: "Speech not recognized" }, { status: 422 });
    }

    // Apply a stricter curve: Speechace raw scores are generous by default.
    // Power of 1.7 brings high scores down meaningfully while keeping perfect scores at 100.
    // e.g. raw 90 → 83, raw 80 → 70, raw 70 → 57, raw 60 → 44, raw 50 → 31
    const stricten = (raw: number) => Math.round(Math.pow(raw / 100, 1.7) * 100);

    const words = data.text_score.word_score_list.map((w) => ({
      word: w.word,
      accuracyScore: stricten(w.quality_score),
      worstPhone: w.phone_score_list?.length
        ? w.phone_score_list.reduce((worst, p) =>
            p.quality_score < worst.quality_score ? p : worst
          )
        : null,
    }));

    const overallScore = stricten(data.text_score.quality_score);
    const fluencyScore = Math.round(
      data.text_score.fluency_score?.overall_fluency_score ?? overallScore
    );

    const completenessScore = Math.round(
      (words.filter((w) => w.accuracyScore > 0).length / words.length) * 100
    );

    return NextResponse.json({
      overallScore,
      fluencyScore,
      completenessScore,
      words,
    });
  } catch (err) {
    console.error("Pronunciation API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
