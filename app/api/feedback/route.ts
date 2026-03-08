import { NextRequest, NextResponse } from "next/server";

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
  "z":  "Para la 'z': como la 's' pero haciendo vibrar la garganta. Pon la mano en el cuello.",
  "ʃ":  "Para 'sh': labios hacia adelante, lengua cerca del paladar — como cuando pides silencio.",
  "ŋ":  "Para 'ng': la parte trasera de la lengua toca el fondo del paladar y el aire sale por la nariz.",
  "tʃ": "Para 'ch': empieza con la lengua tocando el paladar y suéltala con un soplo.",
};

const encouragements = [
  "¡Excelente pronunciación!",
  "¡Muy bien! Sigue así.",
  "¡Perfecto! Tu pronunciación es muy buena.",
  "¡Genial! Casi sin errores.",
];

interface WordScore {
  word: string;
  accuracyScore: number;
  worstPhone: { phone: string; quality_score: number; sound_most_like: string } | null;
}

export async function POST(req: NextRequest) {
  try {
    const { overallScore, words } = await req.json();

    // High score — just encourage
    if (overallScore >= 85) {
      const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
      return NextResponse.json({ feedback: msg });
    }

    // Find the worst words
    const badWords: WordScore[] = (words as WordScore[])
      .filter((w) => w.accuracyScore < 65)
      .sort((a, b) => a.accuracyScore - b.accuracyScore)
      .slice(0, 2);

    if (badWords.length === 0) {
      return NextResponse.json({
        feedback: "¡Casi perfecto! Sigue practicando para afinar los detalles.",
      });
    }

    const lines: string[] = [];

    for (const w of badWords) {
      const phone = w.worstPhone?.phone ?? "";
      const tip = phonemeTips[phone];
      const confused = w.worstPhone?.sound_most_like
        ? ` (sonó como '${w.worstPhone.sound_most_like}')`
        : "";

      if (tip) {
        lines.push(`En "${w.word}"${confused}: ${tip}`);
      } else {
        lines.push(`La palabra "${w.word}" necesita más práctica (${w.accuracyScore}%).`);
      }
    }

    return NextResponse.json({ feedback: lines.join(" ") });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json({ feedback: "" });
  }
}
