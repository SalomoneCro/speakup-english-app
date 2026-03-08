import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const referenceText = formData.get("referenceText") as string;

    if (!audioFile || !referenceText) {
      return NextResponse.json({ error: "Missing audio or referenceText" }, { status: 400 });
    }

    const key = process.env.AZURE_SPEECH_KEY!;
    const region = process.env.AZURE_SPEECH_REGION!;

    const arrayBuffer = await audioFile.arrayBuffer();

    const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
    speechConfig.speechRecognitionLanguage = "en-US";

    const pushStream = sdk.AudioInputStream.createPushStream(
      sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
    );
    pushStream.write(arrayBuffer);
    pushStream.close();

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    pronunciationConfig.applyTo(recognizer);

    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(resolve, reject);
    });

    recognizer.close();

    if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
      return NextResponse.json({ error: "Speech not recognized" }, { status: 422 });
    }

    const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);

    // Build word-level scores
    const words = pronunciationResult.detailResult?.Words?.map((w) => ({
      word: w.Word,
      accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
      errorType: w.PronunciationAssessment?.ErrorType ?? "None",
    })) ?? [];

    return NextResponse.json({
      recognizedText: result.text,
      overallScore: Math.round(pronunciationResult.accuracyScore),
      fluencyScore: Math.round(pronunciationResult.fluencyScore),
      completenessScore: Math.round(pronunciationResult.completenessScore),
      words,
    });
  } catch (err) {
    console.error("Pronunciation API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
