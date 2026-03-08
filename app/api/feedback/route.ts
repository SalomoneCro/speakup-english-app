import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Common phoneme problems for Spanish speakers with specific articulation tips
const phonemeTips: Record<string, string> = {
  // TH sounds
  "ð": "Para el sonido 'th' (suave, como en 'the'): pon la punta de la lengua entre los dientes superiores e inferiores y sopla suavemente haciendo vibrar la garganta.",
  "θ": "Para el sonido 'th' (fuerte, como en 'think'): pon la punta de la lengua entre los dientes y sopla aire sin hacer vibrar la garganta. Como si dijeras 's' pero con la lengua afuera.",

  // V vs B
  "v": "Para el sonido 'v': muerde suavemente tu labio inferior con los dientes superiores y sopla. Es diferente a la 'b' española — los labios NO se juntan.",

  // W
  "w": "Para el sonido 'w': junta los labios en círculo como si fueras a decir 'u', luego ábrete rápidamente. NO es una 'gu' ni una 'b'.",

  // R (English R is very different from Spanish R)
  "r": "Para el 'r' en inglés: la lengua NO toca el paladar. Dóblala hacia atrás sin tocar nada, como si tragaras la lengua levemente.",
  "ɹ": "Para el 'r' en inglés: la lengua NO toca el paladar. Dóblala hacia atrás sin tocar nada.",

  // H
  "h": "Para el sonido 'h' en inglés: es como un suspiro suave con la boca abierta. No es la 'j' española, es mucho más suave.",

  // Short vowels
  "æ": "Para el sonido 'a' en palabras como 'cat' o 'hat': abre la boca más de lo que crees necesario y baja la mandíbula. Es más abierta que la 'a' española.",
  "ɪ": "Para el sonido 'i' corto (como en 'it', 'sit'): es una 'i' más relajada y corta, no tan tensa como la 'i' española.",
  "ʊ": "Para el sonido 'u' corto (como en 'book', 'put'): labios redondeados pero relajados, no tan tensos como la 'u' española.",
  "ʌ": "Para el sonido 'u' abierto (como en 'cup', 'but'): boca entreabierta y relajada, como una 'a' murmurada.",
  "ə": "Para el sonido 'schwa' (la vocal reducida en sílabas sin acento): es el sonido más neutro posible, como una 'e' muy débil y relajada. Aparece en palabras como 'about', 'teacher'.",

  // Z
  "z": "Para el sonido 'z': es como la 's' pero haciendo vibrar la garganta. Pon la mano en el cuello — debes sentir la vibración.",

  // SH
  "ʃ": "Para el sonido 'sh' (como en 'she', 'wash'): labios hacia adelante en forma de círculo, lengua cerca del paladar pero sin tocarlo. Como decir 'shhh' para pedir silencio.",

  // CH
  "tʃ": "Para el sonido 'ch' en inglés: empieza con la lengua tocando el paladar (como la 't') y luego suéltala con un soplo. Similar al español pero más explosivo.",

  // NG
  "ŋ": "Para el sonido 'ng' (como en 'sing', 'ring'): la parte trasera de la lengua toca el paladar blando (el fondo del paladar). El aire sale por la nariz.",
};

interface WordScore {
  word: string;
  accuracyScore: number;
  worstPhone: { phone: string; quality_score: number; sound_most_like: string } | null;
}

export async function POST(req: NextRequest) {
  try {
    const { referenceText, overallScore, words, focusSound } = await req.json();

    const problematicWords: WordScore[] = words.filter((w: WordScore) => w.accuracyScore < 65);
    const goodWords: WordScore[] = words.filter((w: WordScore) => w.accuracyScore >= 85);

    // Build specific phoneme tips for the worst words
    const phonemeDetails = problematicWords
      .map((w: WordScore) => {
        const phone = w.worstPhone?.phone ?? "";
        const tip = phonemeTips[phone] ?? null;
        const confusedWith = w.worstPhone?.sound_most_like
          ? ` (sonó como '${w.worstPhone.sound_most_like}')`
          : "";
        return `- Palabra "${w.word}" (${w.accuracyScore}%)${confusedWith}${tip ? `\n  Consejo: ${tip}` : ""}`;
      })
      .join("\n");

    const prompt = `Eres un tutor experto de pronunciación en inglés para hispanohablantes nativos.

El usuario practicó: "${referenceText}"
Puntaje general: ${overallScore}/100
Palabras bien pronunciadas: ${goodWords.map((w) => `"${w.word}"`).join(", ") || "ninguna"}
Palabras problemáticas con análisis fonético:
${phonemeDetails || "ninguna"}
Sonido clave de esta oración: ${focusSound}

INSTRUCCIONES:
- Responde SOLO en español
- Sé directo y específico — menciona qué palabra estuvo mal y cómo corregirla físicamente (lengua, dientes, labios)
- Si hay tips fonéticos disponibles arriba, úsalos para dar instrucciones concretas de articulación
- Máximo 3-4 oraciones
- Si el puntaje es 85 o más, felicita con entusiasmo y menciona qué estuvo bien
- Tono: motivador pero honesto, como un buen maestro`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("Feedback API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
