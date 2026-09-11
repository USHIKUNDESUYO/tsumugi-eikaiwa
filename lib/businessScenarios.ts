import { BusinessScenarioInfo, BusinessScenario, DifficultyLevel } from '@/types';

export const businessScenarios: Record<BusinessScenario, BusinessScenarioInfo> = {
  'meeting-basics': {
    id: 'meeting-basics',
    label: '会議の基本',
    description: 'アジェンダ確認、丁寧な反対意見、明確化の依頼、アクションアイテムのまとめ',
    emoji: '📊',
    phrases: [
      { english: "Could we go over the agenda first?", japanese: "まず議題を確認できますか？" },
      { english: "I see your point, but have we considered...?", japanese: "おっしゃることは分かりますが、～は検討しましたか？" },
      { english: "Just to clarify, are you saying that...?", japanese: "確認ですが、～ということですか？" },
      { english: "Could you elaborate on that?", japanese: "もう少し詳しく説明していただけますか？" },
      { english: "Let me summarize the action items.", japanese: "アクションアイテムをまとめます。" },
      { english: "Who will be responsible for this?", japanese: "これは誰が担当しますか？" },
      { english: "What's our timeline for this?", japanese: "これのタイムラインはどうなりますか？" },
      { english: "I'd like to add one more point.", japanese: "もう一点追加したいことがあります。" },
    ],
  },
  'email-tone': {
    id: 'email-tone',
    label: 'メールトーン調整',
    description: 'カジュアルな英語をプロフェッショナルなメール英語に書き換え、短い返信練習',
    emoji: '📧',
    phrases: [
      { english: "I hope this email finds you well.", japanese: "お元気でお過ごしのことと存じます。" },
      { english: "Thank you for your prompt response.", japanese: "早速のご返信ありがとうございます。" },
      { english: "I would appreciate it if you could...", japanese: "～していただけると幸いです。" },
      { english: "Please let me know if you need any further information.", japanese: "追加情報が必要な場合はお知らせください。" },
      { english: "I look forward to hearing from you.", japanese: "ご連絡をお待ちしております。" },
      { english: "Could you please clarify...?", japanese: "～を明確にしていただけますか？" },
      { english: "I wanted to follow up on...", japanese: "～についてフォローアップしたく存じます。" },
      { english: "Please find attached...", japanese: "添付ファイルをご確認ください。" },
    ],
  },
  'presentation-qa': {
    id: 'presentation-qa',
    label: 'プレゼンQ&A',
    description: '厳しい質問への対応、時間稼ぎフレーズ、数字の明確化',
    emoji: '🎤',
    phrases: [
      { english: "That's a great question.", japanese: "素晴らしい質問ですね。" },
      { english: "Let me think about that for a moment.", japanese: "少し考えさせてください。" },
      { english: "To clarify, are you asking about...?", japanese: "確認ですが、～についてのご質問ですか？" },
      { english: "I don't have the exact figures right now, but...", japanese: "今正確な数字は手元にありませんが..." },
      { english: "Could you rephrase that question?", japanese: "質問を言い換えていただけますか？" },
      { english: "That's outside my area of expertise, but...", japanese: "それは私の専門外ですが..." },
      { english: "Let me get back to you on that.", japanese: "それについては後ほどお答えします。" },
      { english: "As shown in slide 5...", japanese: "スライド5に示されているように..." },
    ],
  },
  'small-talk-work': {
    id: 'small-talk-work',
    label: '職場での雑談',
    description: 'コーヒーチャット、新チームへの参加、週末から仕事への移行',
    emoji: '☕',
    phrases: [
      { english: "How was your weekend?", japanese: "週末はどうでしたか？" },
      { english: "Did you catch the game last night?", japanese: "昨夜の試合見ましたか？" },
      { english: "I'm still getting used to the new system.", japanese: "まだ新しいシステムに慣れているところです。" },
      { english: "Speaking of which, have you had a chance to...?", japanese: "そういえば、～する機会はありましたか？" },
      { english: "By the way, I wanted to ask you about...", japanese: "ところで、～について聞きたかったのですが..." },
      { english: "That reminds me, we should...", japanese: "そういえば、私たちは～すべきですね。" },
      { english: "I hear you've been working on...", japanese: "～に取り組んでいると聞きました。" },
      { english: "How are you finding the new role?", japanese: "新しい役割はどうですか？" },
    ],
  },
  'negotiation': {
    id: 'negotiation',
    label: '交渉・スケジュール調整',
    description: '時間の提案、丁寧な押し返し、次のステップの確認',
    emoji: '🤝',
    phrases: [
      { english: "Would Thursday at 2pm work for you?", japanese: "木曜日の午後2時はいかがですか？" },
      { english: "I'm afraid that doesn't quite work for us.", japanese: "申し訳ございませんが、それは私たちには合いません。" },
      { english: "Could we possibly move it to...?", japanese: "～に移動できますでしょうか？" },
      { english: "Let me check my calendar and get back to you.", japanese: "カレンダーを確認して折り返します。" },
      { english: "I appreciate the offer, but we were hoping for...", japanese: "ご提案に感謝しますが、～を期待していました。" },
      { english: "What if we split the difference?", japanese: "中間を取るのはどうでしょうか？" },
      { english: "So, to confirm, our next step is...?", japanese: "確認ですが、次のステップは～ですね？" },
      { english: "I'll send you a calendar invite.", japanese: "カレンダー招待を送ります。" },
    ],
  },
  'phone-video': {
    id: 'phone-video',
    label: '電話・ビデオ会議',
    description: '接続確認、発言のターン取り、聞き返し',
    emoji: '📞',
    phrases: [
      { english: "Can you hear me okay?", japanese: "聞こえていますか？" },
      { english: "Sorry, you're breaking up.", japanese: "すみません、音声が途切れています。" },
      { english: "Could you repeat that?", japanese: "もう一度言っていただけますか？" },
      { english: "Let me turn on my camera.", japanese: "カメラをオンにします。" },
      { english: "I think you're on mute.", japanese: "ミュートになっていると思います。" },
      { english: "May I jump in here?", japanese: "ここで割り込んでもよろしいですか？" },
      { english: "Could you share your screen?", japanese: "画面を共有していただけますか？" },
      { english: "I'll let you finish.", japanese: "お話を続けてください。" },
    ],
  },
};

export function getBusinessScenarioPrompt(
  scenario: BusinessScenario,
  difficulty: DifficultyLevel,
  successfulTurns: number
): string {
  const scenarioDetails = {
    'meeting-basics': {
      beginner: `You are in a team meeting. Start simple: 
- Help the learner confirm the meeting agenda
- Practice asking simple clarification questions ("Could you explain that?")
- Keep sentences short and clear
- Guide them to express agreement/disagreement politely`,
      intermediate: `You are in a project meeting. Practice:
- Discussing action items and responsibilities
- Disagreeing politely with reasons
- Asking for clarification on complex points
- Use natural meeting language`,
      advanced: `You are in a strategic planning meeting. Practice:
- Challenging assumptions diplomatically
- Summarizing complex discussions
- Negotiating priorities and timelines
- Managing meeting dynamics`,
    },
    'email-tone': {
      beginner: `Help the learner write professional emails. Start with:
- Simple greetings and closings
- Making basic requests politely
- Showing "I would like..." and "Could you please..."
- Converting casual phrases to professional tone`,
      intermediate: `Practice professional email writing:
- Following up on previous conversations
- Making requests with proper context
- Handling complaints or concerns politely
- Using formal transitions and connectors`,
      advanced: `Master professional email nuances:
- Writing persuasive proposals
- Handling delicate situations diplomatically
- Adjusting tone for different audiences (clients, executives, team)
- Complex multi-point requests`,
    },
    'presentation-qa': {
      beginner: `You are presenting to a small team. Practice:
- Thanking people for questions
- Admitting when you don't know ("I don't have that information right now")
- Buying time to think
- Asking for question clarification`,
      intermediate: `You are presenting to stakeholders. Practice:
- Handling challenging questions confidently
- Redirecting to your key points
- Promising to follow up on complex queries
- Using data and examples in responses`,
      advanced: `You are presenting to executives. Practice:
- Handling hostile or skeptical questions
- Turning difficult questions into opportunities
- Being concise under pressure
- Defending your recommendations strongly but diplomatically`,
    },
    'small-talk-work': {
      beginner: `Practice casual workplace conversation:
- Weekend small talk ("How was your weekend?")
- Transitioning naturally to work topics
- Showing interest in colleagues
- Simple personal sharing`,
      intermediate: `Build workplace relationships through conversation:
- Finding common ground
- Smooth transitions from personal to professional
- Asking thoughtful follow-up questions
- Balancing friendliness and professionalism`,
      advanced: `Master professional networking conversation:
- Building rapport with new colleagues quickly
- Navigating cultural differences in small talk
- Using small talk strategically for work goals
- Reading social cues and adjusting`,
    },
    negotiation: {
      beginner: `Practice basic scheduling and negotiation:
- Proposing meeting times politely
- Saying no politely ("I'm afraid that doesn't work")
- Suggesting alternatives
- Confirming agreements`,
      intermediate: `Practice professional negotiation:
- Making counteroffers diplomatically
- Explaining constraints without seeming inflexible
- Finding middle ground
- Using "What if..." to explore options`,
      advanced: `Master complex negotiation:
- Strategic concessions and trade-offs
- Handling tough pushback
- Maintaining relationships under pressure
- Creating win-win outcomes from difficult positions`,
    },
    'phone-video': {
      beginner: `Practice basic phone/video call etiquette:
- Checking audio/video ("Can you hear me?")
- Asking people to repeat
- Simple turn-taking
- Basic technical troubleshooting`,
      intermediate: `Handle video calls professionally:
- Managing technical issues smoothly
- Interrupting politely
- Yielding the floor appropriately
- Keeping calls on track`,
      advanced: `Master complex call situations:
- Facilitating multi-party calls
- Handling difficult personalities on calls
- Managing time constraints
- Reading virtual body language`,
    },
  };

  const difficultyText = scenarioDetails[scenario][difficulty];
  
  // Auto-level-up suggestion
  let levelUpHint = '';
  if (difficulty === 'beginner' && successfulTurns >= 4) {
    levelUpHint = '\n\nNote: The learner is doing well. You can gradually increase complexity.';
  } else if (difficulty === 'intermediate' && successfulTurns >= 6) {
    levelUpHint = '\n\nNote: The learner is ready for more advanced scenarios.';
  }

  return difficultyText + levelUpHint;
}

export function getBusinessSessionTips(scenario: BusinessScenario): string[] {
  const tips: Record<BusinessScenario, string[]> = {
    'meeting-basics': [
      "I see your point, but...",
      "Could you elaborate on that?",
      "Let me summarize the action items.",
    ],
    'email-tone': [
      "I would appreciate it if you could...",
      "Thank you for your prompt response.",
      "Please let me know if you need any further information.",
    ],
    'presentation-qa': [
      "That's a great question.",
      "Let me get back to you on that.",
      "As shown in slide X...",
    ],
    'small-talk-work': [
      "How was your weekend?",
      "Speaking of which...",
      "That reminds me...",
    ],
    negotiation: [
      "Would [time] work for you?",
      "I'm afraid that doesn't quite work for us.",
      "What if we split the difference?",
    ],
    'phone-video': [
      "Can you hear me okay?",
      "Sorry, you're breaking up.",
      "May I jump in here?",
    ],
  };
  
  return tips[scenario] || [];
}
