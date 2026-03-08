import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: string;
}

export async function POST(req: NextRequest) {
  try {
    const { referenceText, overallScore, words, focusSound } = await req.json();

    const problematicWords = words
      .filter((w: WordScore) => w.accuracyScore < 70)
      .map((w: WordScore) => `"${w.word}" (${w.accuracyScore}%)`)
      .join(", ");

    const goodWords = words
      .filter((w: WordScore) => w.accuracyScore >= 80)
      .map((w: WordScore) => `"${w.word}"`)
      .join(", ");

    const prompt = `Eres un tutor amigable de pronunciación en inglés para hispanohablantes.

El usuario practicó esta oración en inglés: "${referenceText}"
Puntaje general: ${overallScore}/100
Palabras con buena pronunciación: ${goodWords || "ninguna"}
Palabras con pronunciación a mejorar: ${problematicWords || "ninguna"}
Sonido clave a practicar: ${focusSound}

Da retroalimentación en español. Sé breve (máximo 3 oraciones), motivador, y específico sobre cómo mejorar los sonidos problemáticos. Si el puntaje es mayor a 85, felicita al usuario con entusiasmo.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
