import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Fallback tips used when Gemini is unavailable
const phonemeTips: Record<string, string> = {
  "ð":  "Para 'th' suave (como en 'the'): pon la lengua entre los dientes y vibra la garganta.",
  "θ":  "Para 'th' fuerte (como en 'think'): pon la lengua entre los dientes y sopla sin vibrar.",
  "v":  "Para la 'v': muerde suavemente el labio inferior con los dientes superiores. No cierres los labios como en la 'b'.",
  "w":  "Para la 'w': junta los labios en forma de 'u' y ábrete rápido. No es 'gu' ni 'b'.",
  "r":  "Para la 'r' en inglés: dobla la lengua hacia atrás sin tocar el paladar.",
  "ɹ":  "Para la 'r' en inglés: dobla la lengua hacia atrás sin tocar el paladar.",
  "h":  "Para la 'h': es un suspiro suave con la boca abierta. No es la 'j' española.",
  "æ":  "Abre la boca más de lo normal y baja la mandíbula para este sonido.",
  "ɪ":  "Este sonido es una 'i' corta y relajada, no tan tensa como la española.",
  "ʊ":  "Labios redondeados pero relajados, menos tensos que la 'u' española.",
  "ʌ":  "Boca entreabierta y relajada, como una 'a' muy suave.",
  "ə":  "Este sonido es casi imperceptible — una vocal muy neutra y débil.",
  "z":  "Para la 'z': como la 's' pero haciendo vibrar la garganta.",
  "ʃ":  "Para 'sh': labios hacia adelante, lengua cerca del paladar — como 'shhh'.",
  "ŋ":  "Para 'ng': la parte trasera de la lengua toca el fondo del paladar, aire por la nariz.",
  "tʃ": "Para 'ch': empieza con la lengua en el paladar y suéltala con un soplo.",
};

interface WordScore {
  word: string;
  accuracyScore: number;
  worstPhone: { phone: string; quality_score: number; sound_most_like: string } | null;
}

function buildRuleBasedFeedback(overallScore: number, words: WordScore[]): string {
  if (overallScore >= 85) {
    return "¡Excelente pronunciación! Sigue así.";
  }

  const imperfectWords = words
    .filter((w) => w.accuracyScore < 85)
    .sort((a, b) => a.accuracyScore - b.accuracyScore)
    .slice(0, 2);

  if (imperfectWords.length === 0) {
    return "¡Casi perfecto! Sigue practicando para afinar los detalles.";
  }

  return imperfectWords.map((w) => {
    const phone = w.worstPhone?.phone ?? "";
    const tip = phonemeTips[phone];
    const confused = w.worstPhone?.sound_most_like
      ? ` (sonó como '${w.worstPhone.sound_most_like}')`
      : "";
    return tip
      ? `En "${w.word}"${confused}: ${tip}`
      : `La palabra "${w.word}" necesita más práctica (${w.accuracyScore}%).`;
  }).join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const { referenceText, overallScore, words } = await req.json();

    // Words that need feedback: both yellow (65-84) and red (<65)
    const imperfectWords: WordScore[] = (words as WordScore[])
      .filter((w) => w.accuracyScore < 85)
      .sort((a, b) => a.accuracyScore - b.accuracyScore)
      .slice(0, 3);

    const wordDetails = imperfectWords.map((w) => {
      const phone = w.worstPhone?.phone ?? "";
      const tip = phonemeTips[phone] ?? "";
      const confused = w.worstPhone?.sound_most_like
        ? `, sonó como '${w.worstPhone.sound_most_like}'`
        : "";
      const quality = w.accuracyScore >= 65 ? "amarilla (mejorable)" : "roja (necesita trabajo)";
      return `• "${w.word}" → puntuación ${w.accuracyScore}% (${quality})${confused}${tip ? `. Tip fonético: ${tip}` : ""}`;
    }).join("\n");

    const prompt = overallScore >= 85
      ? `El estudiante pronunció muy bien "${referenceText}" con ${overallScore}/100. Felicítalo en español en 1 oración entusiasta y corta.`
      : `Eres un tutor de pronunciación inglés para hispanohablantes. El estudiante practicó: "${referenceText}" — puntaje: ${overallScore}/100.

Palabras con pronunciación imperfecta:
${wordDetails || "ninguna específica, pronunciación general imprecisa"}

Escribe en español 2-3 oraciones CORTAS y directas:
- Para cada palabra imperfecta: di qué pronunció mal y cómo corregirlo físicamente (ejemplo: "pronunciaste 'the' como una 'd', pero debes poner la lengua entre los dientes")
- Si una palabra está en amarillo (mejorable), el tono es suave: "está bien pero puedes mejorar haciendo..."
- Si está en rojo, el tono es más directo: "esta palabra necesita trabajo, intenta..."
- Sin saludos ni palabras de relleno. Solo el consejo.`;

    // Try Gemini, fall back to rule-based if unavailable
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return NextResponse.json({ feedback: text });
    } catch (geminiErr) {
      console.warn("Gemini unavailable, using rule-based fallback:", geminiErr);
    }

    // Fallback: rule-based
    return NextResponse.json({ feedback: buildRuleBasedFeedback(overallScore, words) });

  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json({ feedback: "" });
  }
}
