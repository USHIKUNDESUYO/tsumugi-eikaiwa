export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  corrections?: Correction[];
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export type AppMode = "chat" | "review" | "business";

export interface ReviewItem {
  id: string;
  word: string;
  meaning: string;
  example: string;
  reviewCount: number;
}
