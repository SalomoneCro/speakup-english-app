"use client";

import { useState, useRef, useCallback } from "react";
import { Difficulty, Sentence, getRandomSentence } from "@/lib/sentences";
import DifficultySelector from "@/components/DifficultySelector";
import WordScoreDisplay from "@/components/WordScoreDisplay";
import ScoreRing from "@/components/ScoreRing";

type AppState = "home" | "practice" | "recording" | "processing" | "results";

interface WordScore {
  word: string;
  accuracyScore: number;
  errorType: string;
}

interface PronunciationResult {
  recognizedText: string;
  overallScore: number;
  fluencyScore: number;
  completenessScore: number;
  words: WordScore[];
}

async function playTTS(text: string, language: "en-US" | "es-ES") {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  const data = await res.json();
  if (!data.audioContent) return;
  const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
  return new Promise<void>((resolve) => {
    audio.onended = () => resolve();
    audio.play();
  });
}

const BG = "bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("home");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const loadSentence = useCallback(async (diff: Difficulty, excludeId?: number) => {
    const sentence = getRandomSentence(diff, excludeId);
    setCurrentSentence(sentence);
    setResult(null);
    setFeedback("");
    setAppState("practice");
    setIsPlayingAudio(true);
    await playTTS(`Repeat after me. ${sentence.text}`, "en-US");
    setIsPlayingAudio(false);
  }, []);

  const handleStart = () => loadSentence(difficulty);

  const handleRepeat = async () => {
    if (!currentSentence || isPlayingAudio) return;
    setIsPlayingAudio(true);
    await playTTS(currentSentence.text, "en-US");
    setIsPlayingAudio(false);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      setAppState("recording");
    } catch {
      alert("No se pudo acceder al micrófono. Por favor permite el acceso.");
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current || !currentSentence) return;
    setAppState("processing");
    const mediaRecorder = mediaRecorderRef.current;

    await new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("referenceText", currentSentence.text);

        try {
          const pronRes = await fetch("/api/pronunciation", { method: "POST", body: formData });
          const pronData: PronunciationResult = await pronRes.json();
          setResult(pronData);

          const feedbackRes = await fetch("/api/feedback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referenceText: currentSentence.text,
              overallScore: pronData.overallScore,
              words: pronData.words,
              focusSound: currentSentence.focusSound,
            }),
          });
          const feedbackData = await feedbackRes.json();
          setFeedback(feedbackData.feedback);
          setAppState("results");

          if (feedbackData.feedback) {
            setIsPlayingAudio(true);
            await playTTS(feedbackData.feedback, "es-ES");
            setIsPlayingAudio(false);
          }
        } catch (err) {
          console.error(err);
          alert("Hubo un error procesando tu pronunciación. Intenta de nuevo.");
          setAppState("practice");
        }
        resolve();
      };
      mediaRecorder.stop();
    });
  };

  const handleTryAgain = async () => {
    if (!currentSentence) return;
    setResult(null);
    setFeedback("");
    setAppState("practice");
    setIsPlayingAudio(true);
    await playTTS(`Inténtalo de nuevo. ${currentSentence.text}`, "en-US");
    setIsPlayingAudio(false);
  };

  const handleNextSentence = () => loadSentence(difficulty, currentSentence?.id);

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    if (appState === "results") loadSentence(d);
  };

  // ── HOME ─────────────────────────────────────────────────
  if (appState === "home") {
    return (
      <main className={`${BG} h-screen flex flex-col items-center justify-between p-8`}>
        {/* Top spacer */}
        <div />

        {/* Center content */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="text-7xl">🎙️</div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">SpeakUp</h1>
            <p className="text-white/60 text-base">Aprende inglés hablando</p>
          </div>
          <DifficultySelector selected={difficulty} onChange={setDifficulty} />
        </div>

        {/* Bottom button */}
        <button
          onClick={handleStart}
          className="w-full max-w-xs bg-white text-purple-900 font-bold text-xl py-5 rounded-3xl shadow-2xl active:scale-95 transition-transform"
        >
          Empezar práctica
        </button>
      </main>
    );
  }

  // ── PRACTICE / RECORDING ─────────────────────────────────
  if (appState === "practice" || appState === "recording") {
    return (
      <main className={`${BG} h-screen flex flex-col p-6`}>
        {/* Header */}
        <div className="flex justify-between items-center pt-2 pb-4">
          <button onClick={() => setAppState("home")} className="text-white/60 text-sm active:text-white">
            ← Inicio
          </button>
          <span className="text-white/60 text-sm">
            {difficulty === "easy" ? "🟢 Básico" : difficulty === "medium" ? "🟡 Intermedio" : "🔴 Avanzado"}
          </span>
        </div>

        {/* Sentence card — grows to fill space */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <p className="text-white/50 text-xs uppercase tracking-widest">Repite en inglés</p>
          <div className="bg-white/10 backdrop-blur rounded-3xl p-6 w-full text-center border border-white/20">
            <p className="text-white text-2xl font-semibold leading-snug">
              {currentSentence?.text}
            </p>
            <p className="text-white/40 text-sm mt-3">
              Sonido clave: <span className="text-white/70">{currentSentence?.focusSound}</span>
            </p>
          </div>
          <button
            onClick={handleRepeat}
            disabled={isPlayingAudio}
            className="flex items-center gap-2 text-white/70 bg-white/10 border border-white/20 rounded-2xl px-5 py-2.5 text-sm active:scale-95 transition-transform disabled:opacity-30"
          >
            🔄 Escuchar de nuevo
          </button>
        </div>

        {/* Mic button — pinned to bottom */}
        <div className="flex flex-col items-center gap-3 pb-4">
          {appState === "recording" && (
            <div className="flex items-center gap-2 text-red-400 animate-pulse">
              <span className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-sm font-medium">Grabando...</span>
            </div>
          )}
          {appState === "practice" ? (
            <button
              onClick={handleStartRecording}
              disabled={isPlayingAudio}
              className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center text-4xl active:scale-90 transition-transform disabled:opacity-30"
            >
              🎤
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="w-20 h-20 bg-red-500 rounded-full shadow-2xl flex items-center justify-center text-4xl active:scale-90 transition-transform animate-pulse"
            >
              ⏹️
            </button>
          )}
          <p className="text-white/50 text-sm">
            {appState === "practice"
              ? isPlayingAudio ? "Escucha primero..." : "Toca para hablar"
              : "Toca para parar"}
          </p>
        </div>
      </main>
    );
  }

  // ── PROCESSING ───────────────────────────────────────────
  if (appState === "processing") {
    return (
      <main className={`${BG} h-screen flex flex-col items-center justify-center gap-4`}>
        <div className="text-5xl animate-bounce">🔍</div>
        <p className="text-white text-xl font-semibold">Analizando pronunciación...</p>
        <p className="text-white/50 text-sm">Esto toma unos segundos</p>
      </main>
    );
  }

  // ── RESULTS ──────────────────────────────────────────────
  if (appState === "results" && result) {
    return (
      <main className={`${BG} h-screen flex flex-col p-5`}>

        {/* Top: score + sub-scores */}
        <div className="flex items-center justify-between pt-2 pb-3">
          <ScoreRing score={result.overallScore} />
          <div className="flex flex-col gap-2 flex-1 ml-4">
            <div className="bg-white/10 rounded-2xl px-4 py-2 text-center">
              <p className="text-white/50 text-xs">Fluidez</p>
              <p className="text-white font-bold text-lg">{result.fluencyScore}%</p>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-2 text-center">
              <p className="text-white/50 text-xs">Completitud</p>
              <p className="text-white font-bold text-lg">{result.completenessScore}%</p>
            </div>
          </div>
        </div>

        {/* Middle: word colors + feedback — scrollable if needed */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
          {/* Word breakdown */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-3 text-center">
              Palabra por palabra
            </p>
            <WordScoreDisplay words={result.words} />
            <div className="flex justify-center gap-3 mt-3 text-xs text-white/40">
              <span>🟢 Bien</span>
              <span>🟡 Regular</span>
              <span>🔴 Mejorar</span>
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="bg-indigo-500/20 border border-indigo-400/30 rounded-2xl p-4">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">💬 Retroalimentación</p>
              <p className="text-white/90 text-sm leading-relaxed">{feedback}</p>
              <button
                onClick={() => playTTS(feedback, "es-ES")}
                disabled={isPlayingAudio}
                className="mt-2 text-indigo-300 text-xs disabled:opacity-40"
              >
                🔊 Escuchar de nuevo
              </button>
            </div>
          )}
        </div>

        {/* Bottom: action buttons + difficulty change */}
        <div className="flex flex-col gap-2 pt-3">
          <div className="flex gap-2">
            <button
              onClick={handleTryAgain}
              className="flex-1 bg-white/15 border border-white/25 text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-transform text-sm"
            >
              🔄 Intentar de nuevo
            </button>
            <button
              onClick={handleNextSentence}
              className="flex-1 bg-white text-purple-900 font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform text-sm"
            >
              Siguiente →
            </button>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <p className="text-white/40 text-xs whitespace-nowrap">Cambiar nivel:</p>
            <DifficultySelector selected={difficulty} onChange={handleDifficultyChange} compact />
          </div>
        </div>
      </main>
    );
  }

  return null;
}
