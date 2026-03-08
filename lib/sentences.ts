export type Difficulty = "easy" | "medium" | "hard";

export interface Sentence {
  id: number;
  text: string;
  difficulty: Difficulty;
  focusSound: string; // hint for what to practice
}

export const sentences: Sentence[] = [
  // EASY — short, common words, simple sounds
  { id: 1, text: "I like to eat apples.", difficulty: "easy", focusSound: "vocales cortas" },
  { id: 2, text: "She has a red bag.", difficulty: "easy", focusSound: "vocal corta 'a'" },
  { id: 3, text: "He runs every day.", difficulty: "easy", focusSound: "sonido 'r' suave" },
  { id: 4, text: "The dog is big.", difficulty: "easy", focusSound: "sonido 'th'" },
  { id: 5, text: "I am very happy.", difficulty: "easy", focusSound: "vocal 'a'" },
  { id: 6, text: "We live in a house.", difficulty: "easy", focusSound: "sonido 'v'" },
  { id: 7, text: "It is a sunny day.", difficulty: "easy", focusSound: "vocal 'u'" },
  { id: 8, text: "My name is Maria.", difficulty: "easy", focusSound: "diptongo" },
  { id: 9, text: "I drink water every morning.", difficulty: "easy", focusSound: "sonido 'w'" },
  { id: 10, text: "She loves her cat.", difficulty: "easy", focusSound: "sonido 'v'" },

  // MEDIUM — tricky sounds for Spanish speakers: th, v/b, w, silent letters
  { id: 11, text: "The weather is very nice today.", difficulty: "medium", focusSound: "sonido 'th' y 'w'" },
  { id: 12, text: "I think that this is the right answer.", difficulty: "medium", focusSound: "sonido 'th'" },
  { id: 13, text: "She wanted to visit the village.", difficulty: "medium", focusSound: "sonido 'v'" },
  { id: 14, text: "Would you like some water?", difficulty: "medium", focusSound: "sonido 'w'" },
  { id: 15, text: "The library closes at nine.", difficulty: "medium", focusSound: "sílaba 'bra'" },
  { id: 16, text: "I usually wake up very early.", difficulty: "medium", focusSound: "sonido 'w' y 'v'" },
  { id: 17, text: "They both live on the same street.", difficulty: "medium", focusSound: "sonido 'th'" },
  { id: 18, text: "He bought a white shirt yesterday.", difficulty: "medium", focusSound: "letra 'h' silenciosa" },
  { id: 19, text: "We were waiting for the bus.", difficulty: "medium", focusSound: "sonido 'w'" },
  { id: 20, text: "I would love to travel the world.", difficulty: "medium", focusSound: "sonido 'w' y 'v'" },

  // HARD — long sentences, multiple tricky sounds, rhythm, stress
  { id: 21, text: "The thought of visiting three different countries thrilled her.", difficulty: "hard", focusSound: "múltiples 'th'" },
  { id: 22, text: "Whether the weather is warm or cold, we will work together.", difficulty: "hard", focusSound: "sonido 'w', 'th', 'r'" },
  { id: 23, text: "She specifically requested a vegetarian meal with vegetables.", difficulty: "hard", focusSound: "acento en sílabas" },
  { id: 24, text: "The whole neighborhood was watching the thunderstorm.", difficulty: "hard", focusSound: "letra 'h' silenciosa y 'th'" },
  { id: 25, text: "He thoroughly enjoyed the thrilling experience.", difficulty: "hard", focusSound: "sonido 'th' y 'r'" },
  { id: 26, text: "Virtual reality technology is revolutionizing education.", difficulty: "hard", focusSound: "sonido 'v' y 'r'" },
  { id: 27, text: "I would have visited if I had known about the event.", difficulty: "hard", focusSound: "contracciones y fluidez" },
  { id: 28, text: "The volunteer organization works with vulnerable communities.", difficulty: "hard", focusSound: "sonido 'v' y acento" },
  { id: 29, text: "Throughout history, thousands of things have changed.", difficulty: "hard", focusSound: "múltiples 'th'" },
  { id: 30, text: "Worthwhile achievements require both strength and perseverance.", difficulty: "hard", focusSound: "sonido 'th', 'w', y acento" },
];

export function getRandomSentence(difficulty: Difficulty, excludeId?: number): Sentence {
  const pool = sentences.filter(
    (s) => s.difficulty === difficulty && s.id !== excludeId
  );
  return pool[Math.floor(Math.random() * pool.length)];
}
