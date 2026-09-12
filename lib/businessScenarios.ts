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
  'difficult-clients': {
    id: 'difficult-clients',
    label: '難しいクライアント対応',
    description: '不満への対応、期待値調整、冷静な問題解決',
    emoji: '🤝',
    phrases: [
      { english: "I understand your concern, and I appreciate you bringing this up.", japanese: "ご懸念は理解しています。お伝えいただきありがとうございます。" },
      { english: "Let's see what we can do to address this.", japanese: "これに対処するために何ができるか見てみましょう。" },
      { english: "I hear you. Can we explore some options together?", japanese: "おっしゃることは分かります。一緒にいくつかの選択肢を探れますか？" },
      { english: "I want to make sure we're on the same page.", japanese: "お互いに理解が一致していることを確認したいです。" },
      { english: "What outcome would you like to see here?", japanese: "ここでどのような結果を期待されていますか？" },
      { english: "I'll look into this right away and get back to you.", japanese: "すぐに確認して、折り返しご連絡します。" },
      { english: "Thank you for your patience while we work through this.", japanese: "解決に向けて取り組む間、ご辛抱いただきありがとうございます。" },
    ],
  },
  'status-updates': {
    id: 'status-updates',
    label: 'ステータス報告',
    description: '進捗報告、遅延の説明、次のステップの明確化',
    emoji: '📈',
    phrases: [
      { english: "Just a quick update on the project.", japanese: "プロジェクトの簡単な進捗報告です。" },
      { english: "We're on track to meet the deadline.", japanese: "期限内に完了する見込みです。" },
      { english: "We've hit a small roadblock, but we're working on it.", japanese: "小さな障害がありましたが、対応中です。" },
      { english: "I wanted to flag a potential delay.", japanese: "遅延の可能性についてお知らせしたく。" },
      { english: "We completed phase one ahead of schedule.", japanese: "フェーズ1を予定より早く完了しました。" },
      { english: "The next milestone is scheduled for...", japanese: "次のマイルストーンは～を予定しています。" },
      { english: "I'll keep you posted as things develop.", japanese: "進展があり次第お知らせします。" },
    ],
  },
  'one-on-one-feedback': {
    id: 'one-on-one-feedback',
    label: '1対1フィードバック',
    description: '建設的なフィードバック、成長の話し合い、目標設定',
    emoji: '💬',
    phrases: [
      { english: "I wanted to touch base about your recent work.", japanese: "最近のあなたの仕事について話したいと思います。" },
      { english: "You did a great job on...", japanese: "～において素晴らしい仕事をしましたね。" },
      { english: "One area where I think you could grow is...", japanese: "成長できると思う分野の一つは～です。" },
      { english: "How are you feeling about your workload?", japanese: "あなたの作業量についてどう感じていますか？" },
      { english: "What support do you need from me?", japanese: "私からどのようなサポートが必要ですか？" },
      { english: "Let's set some goals for the next quarter.", japanese: "次の四半期の目標を設定しましょう。" },
      { english: "Is there anything you'd like to discuss?", japanese: "何か話し合いたいことはありますか？" },
      { english: "I appreciate you being open about this.", japanese: "このことについてオープンに話してくれて感謝します。" },
    ],
  },
  'networking': {
    id: 'networking',
    label: 'ネットワーキング',
    description: '自己紹介、関係構築、フォローアップ',
    emoji: '🌐',
    phrases: [
      { english: "Nice to meet you! I'm [name] from [company].", japanese: "初めまして！[会社]の[名前]です。" },
      { english: "What brings you to this event?", japanese: "このイベントには何で参加されましたか？" },
      { english: "What kind of work do you do?", japanese: "どのような仕事をされていますか？" },
      { english: "That sounds really interesting. Tell me more!", japanese: "とても興味深いですね。もっと聞かせてください！" },
      { english: "We should definitely stay in touch.", japanese: "ぜひ連絡を取り合いましょう。" },
      { english: "Can I grab your LinkedIn?", japanese: "LinkedInを交換できますか？" },
      { english: "It was great chatting with you.", japanese: "お話しできて良かったです。" },
      { english: "I'd love to follow up on this.", japanese: "これについてフォローアップしたいです。" },
    ],
  },
  'timezone-scheduling': {
    id: 'timezone-scheduling',
    label: 'タイムゾーン調整',
    description: '国際会議の時間調整、タイムゾーン配慮',
    emoji: '🌍',
    phrases: [
      { english: "What time zone are you in?", japanese: "どのタイムゾーンにいらっしゃいますか？" },
      { english: "Would 9am EST work for you? That's 10pm JST.", japanese: "東部時間の午前9時はいかがですか？日本時間では午後10時です。" },
      { english: "I know this is outside your regular hours.", japanese: "これがあなたの通常の勤務時間外であることは承知しています。" },
      { english: "Let's find a time that works for everyone.", japanese: "全員に都合の良い時間を見つけましょう。" },
      { english: "I'm flexible on timing.", japanese: "時間は柔軟に対応できます。" },
      { english: "Sorry for the early/late call.", japanese: "早朝・深夜の通話で申し訳ありません。" },
      { english: "Can we rotate the meeting time to be fair?", japanese: "公平に会議時間を交代できますか？" },
      { english: "Let me check what time that is in my zone.", japanese: "私のタイムゾーンでは何時か確認させてください。" },
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
      beginner: `You are in a team meeting. Let's start simple: 
- Help the learner confirm the meeting agenda gently
- Practice asking simple clarification questions like "Could you explain that?"
- Keep sentences short and clear
- Guide them to express agreement or disagreement politely — it's okay to take your time`,
      intermediate: `You are in a project meeting. Let's practice:
- Discussing action items and who's responsible
- Disagreeing politely with reasons (it takes courage!)
- Asking for clarification on complex points
- Using natural meeting language that feels professional but not stiff`,
      advanced: `You are in a strategic planning meeting. Let's practice:
- Challenging assumptions diplomatically (this is a good skill!)
- Summarizing complex discussions clearly
- Negotiating priorities and timelines
- Managing meeting dynamics with confidence`,
    },
    'email-tone': {
      beginner: `Let's help the learner write professional emails. Start with basics:
- Simple greetings and closings that feel polite
- Making basic requests kindly using "I would like..." and "Could you please..."
- Converting casual phrases to professional tone (it's easier than you think!)
- Remember: professional doesn't mean unfriendly`,
      intermediate: `Let's practice professional email writing:
- Following up on previous conversations naturally
- Making requests with proper context
- Handling complaints or concerns politely (this is important!)
- Using formal transitions and connectors smoothly`,
      advanced: `Let's master professional email nuances:
- Writing persuasive proposals that sound confident
- Handling delicate situations diplomatically
- Adjusting tone for different audiences — clients, executives, teammates
- Managing complex multi-point requests clearly`,
    },
    'presentation-qa': {
      beginner: `You are presenting to a small team. Let's practice:
- Thanking people for questions (it shows confidence!)
- It's okay to admit when you don't know something: "I don't have that information right now"
- Buying time to think is perfectly fine
- Asking for clarification if a question isn't clear`,
      intermediate: `You are presenting to stakeholders. Let's practice:
- Handling challenging questions with confidence (you can do this!)
- Redirecting smoothly to your key points
- Promising to follow up on complex queries — that's professional
- Using data and examples to support your responses`,
      advanced: `You are presenting to executives. Let's practice:
- Handling difficult or skeptical questions calmly
- Turning challenging questions into opportunities to shine
- Being concise under pressure (take a breath, you've got this)
- Defending your recommendations firmly but diplomatically`,
    },
    'small-talk-work': {
      beginner: `Let's practice casual workplace conversation:
- Weekend small talk like "How was your weekend?" — it's a nice way to connect
- Transitioning naturally to work topics (don't worry, it gets easier!)
- Showing genuine interest in colleagues
- Simple personal sharing that feels comfortable`,
      intermediate: `Let's build workplace relationships through conversation:
- Finding common ground with colleagues
- Smooth transitions from personal to professional topics
- Asking thoughtful follow-up questions (this shows you care)
- Balancing friendliness and professionalism`,
      advanced: `Let's master professional networking conversation:
- Building rapport with new colleagues naturally and quickly
- Navigating cultural differences in small talk with sensitivity
- Using small talk strategically to build work relationships
- Reading social cues and adjusting your approach`,
    },
    negotiation: {
      beginner: `Let's practice basic scheduling and negotiation:
- Proposing meeting times politely
- Saying no kindly: "I'm afraid that doesn't work for me"
- Suggesting alternatives (this shows flexibility!)
- Confirming agreements clearly`,
      intermediate: `Let's practice professional negotiation:
- Making counteroffers diplomatically
- Explaining your constraints without seeming inflexible
- Finding middle ground — this is a valuable skill
- Using "What if..." to explore options together`,
      advanced: `Let's master complex negotiation:
- Strategic concessions and trade-offs
- Handling tough pushback while staying calm
- Maintaining good relationships even under pressure
- Creating win-win outcomes from difficult starting positions`,
    },
    'phone-video': {
      beginner: `Let's practice basic phone and video call etiquette:
- Checking audio and video: "Can you hear me okay?"
- It's perfectly fine to ask people to repeat
- Simple turn-taking in conversation
- Basic technical troubleshooting (everyone deals with this!)`,
      intermediate: `Let's handle video calls professionally:
- Managing technical issues smoothly and calmly
- Interrupting politely when needed
- Yielding the floor appropriately
- Keeping calls on track without being pushy`,
      advanced: `Let's master complex call situations:
- Facilitating multi-party calls confidently
- Handling difficult personalities on calls with grace
- Managing time constraints tactfully
- Reading virtual body language and adapting`,
    },
    'difficult-clients': {
      beginner: `Let's practice handling challenging client situations:
- Acknowledging concerns with empathy: "I understand your concern"
- Staying calm and professional (you're doing great!)
- Asking clarifying questions to understand the issue
- Simple problem-solving phrases that feel supportive`,
      intermediate: `Let's handle difficult clients professionally:
- De-escalating tense situations with calm language
- Setting realistic expectations diplomatically
- Finding middle ground when demands are high
- Following up to rebuild trust`,
      advanced: `Let's master challenging client relationships:
- Turning complaints into opportunities
- Managing unrealistic expectations while maintaining relationships
- Strategic concessions vs. firm boundaries
- Long-term relationship repair after conflicts`,
    },
    'status-updates': {
      beginner: `Let's practice giving clear status updates:
- Starting with simple progress statements
- Reporting good news and delays honestly
- Using clear timeline language: "We're on track"
- It's okay to say when something is delayed!`,
      intermediate: `Let's give professional status updates:
- Structuring updates: what's done, what's next, any blockers
- Explaining delays with context and solutions
- Managing expectations proactively
- Highlighting achievements without overselling`,
      advanced: `Let's master strategic status communication:
- Framing setbacks constructively while being transparent
- Anticipating stakeholder concerns and addressing them
- Balancing optimism with realistic risk assessment
- Updates that drive decisions, not just inform`,
    },
    'one-on-one-feedback': {
      beginner: `Let's practice giving and receiving 1-on-1 feedback:
- Starting with positive observations (people appreciate this!)
- Using "I" statements: "I noticed that..."
- Asking open questions: "How are you feeling about...?"
- Creating a safe, comfortable conversation`,
      intermediate: `Let's have productive 1-on-1 conversations:
- Balancing positive feedback with growth areas
- Asking for the other person's perspective first
- Setting collaborative goals together
- Active listening and genuine curiosity`,
      advanced: `Let's master developmental conversations:
- Delivering difficult feedback with compassion
- Coaching through challenges, not just evaluating
- Navigating sensitive topics about performance or fit
- Creating accountability with empowerment`,
    },
    'networking': {
      beginner: `Let's practice networking basics:
- Friendly introductions: "Nice to meet you! I'm..."
- Simple conversation starters that feel natural
- Showing genuine interest in others (this makes you memorable!)
- Exchanging contact information comfortably`,
      intermediate: `Let's network effectively:
- Finding common ground quickly
- Memorable self-introductions (your "elevator pitch")
- Moving beyond small talk to meaningful exchange
- Following up after events authentically`,
      advanced: `Let's master professional networking:
- Building instant rapport across different cultures
- Strategic relationship building with intent
- Turning brief encounters into lasting connections
- Networking with senior leaders confidently`,
    },
    'timezone-scheduling': {
      beginner: `Let's practice scheduling across time zones:
- Asking about time zones politely
- Converting times clearly (this takes practice!)
- Acknowledging inconvenient timing with appreciation
- Simple flexibility phrases: "I'm flexible on timing"`,
      intermediate: `Let's handle international scheduling professionally:
- Proposing times that consider multiple zones
- Showing consideration for others' work hours
- Using time zone abbreviations correctly (EST, JST, etc.)
- Finding compromise when no time is perfect`,
      advanced: `Let's master global scheduling:
- Anticipating time zone challenges in recurring meetings
- Rotating meeting times fairly across regions
- Balancing urgency with respect for personal time
- Cultural sensitivity around work-life boundaries`,
    },
  };

  const difficultyText = scenarioDetails[scenario][difficulty];
  
  // Auto-level-up suggestion
  let levelUpHint = '';
  if (difficulty === 'beginner' && successfulTurns >= 4) {
    levelUpHint = '\n\nNote: The learner is doing really well! You can gently start introducing slightly more complex expressions.';
  } else if (difficulty === 'intermediate' && successfulTurns >= 6) {
    levelUpHint = '\n\nNote: The learner is ready for more advanced scenarios. They\'re making great progress!';
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
    'difficult-clients': [
      "I understand your concern.",
      "Let's see what we can do to address this.",
      "Thank you for your patience.",
    ],
    'status-updates': [
      "Just a quick update on the project.",
      "We're on track to meet the deadline.",
      "I'll keep you posted as things develop.",
    ],
    'one-on-one-feedback': [
      "You did a great job on...",
      "How are you feeling about your workload?",
      "What support do you need from me?",
    ],
    'networking': [
      "What brings you to this event?",
      "That sounds really interesting!",
      "We should definitely stay in touch.",
    ],
    'timezone-scheduling': [
      "What time zone are you in?",
      "Let's find a time that works for everyone.",
      "I'm flexible on timing.",
    ],
  };
  
  return tips[scenario] || [];
}
