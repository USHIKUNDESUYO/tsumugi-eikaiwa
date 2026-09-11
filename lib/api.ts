import { Message, Correction } from "./types";

export async function generateTsumugiResponse(
  userMessage: string,
  conversationHistory: Message[]
): Promise<{ content: string; corrections: Correction[] }> {
  // Mock API - gentle English teacher personality inspired by Tsumugi
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

  const corrections: Correction[] = [];

  // Simple grammar check examples
  if (userMessage.toLowerCase().includes("i go") && userMessage.toLowerCase().includes("yesterday")) {
    corrections.push({
      original: "I go yesterday",
      corrected: "I went yesterday",
      explanation: "過去の出来事なので went を使いましょう 📝",
    });
  }

  if (userMessage.toLowerCase().includes("she don't")) {
    corrections.push({
      original: "she don't",
      corrected: "she doesn't",
      explanation: "三人称単数には doesn't を使います 😊",
    });
  }

  // Generate friendly response
  const responses = [
    "That's interesting! Tell me more about it. 🌸",
    "I see! How did that make you feel?",
    "Wonderful! What happened next?",
    "Oh, that sounds nice! 😊",
    "Great! I'd love to hear more about that.",
    "That's a good point! What do you think about...?",
    "Interesting perspective! Have you considered...?",
  ];

  let content = responses[Math.floor(Math.random() * responses.length)];

  if (corrections.length > 0) {
    content = `${content}\n\n✨ちょっとだけアドバイス: "${corrections[0].corrected}" の方が自然ですよ！${corrections[0].explanation}`;
  }

  return { content, corrections };
}

export async function getBusinessScenario(topic: string): Promise<Message[]> {
  const scenarios: Record<string, Message[]> = {
    meeting: [
      {
        id: "1",
        role: "assistant",
        content:
          "Let's practice a business meeting scenario! 📊 I'll be your colleague. You're leading today's meeting. Try starting with a greeting and agenda introduction.",
        timestamp: new Date(),
      },
    ],
    presentation: [
      {
        id: "1",
        role: "assistant",
        content:
          "Time for presentation practice! 🎯 Imagine you're presenting a new product. Start with an attention-grabbing opening.",
        timestamp: new Date(),
      },
    ],
    negotiation: [
      {
        id: "1",
        role: "assistant",
        content:
          "Let's practice negotiation skills! 🤝 I'm a potential client. Try to persuade me about your proposal.",
        timestamp: new Date(),
      },
    ],
  };

  return (
    scenarios[topic] || [
      {
        id: "1",
        role: "assistant",
        content: "Let's practice business English! What would you like to focus on? 💼",
        timestamp: new Date(),
      },
    ]
  );
}
