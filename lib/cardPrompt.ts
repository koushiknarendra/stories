const CATEGORY_FOCUS: Record<string, string> = {
  technology:  "What changed technically, who it affects, and what builders or users should do differently.",
  science:     "The discovery itself, why researchers were surprised, and what it means for our understanding.",
  business:    "Market dynamics, who wins and loses, and what founders or professionals should watch.",
  health:      "What this means for daily habits, risks, or decisions the reader makes about their body.",
  design:      "The insight or principle behind the work — what can be learned and applied elsewhere.",
  world:       "The human stakes — who is affected and why it matters beyond the news cycle.",
  finance:     "Actionable implications — what this means for spending, saving, or investing behavior.",
  philosophy:  "The central tension or paradox, then two legitimate ways to think about it.",
  culture:     "The underlying shift in values or behavior this represents, not just the surface event.",
  lifestyle:   "Immediately applicable — one concrete thing the reader can do or change today.",
};

const RULES = `
Rules:
1. FIRST CARD — open with the most surprising or counter-intuitive point in the article, not the introduction.
2. HEADLINES — must be fully self-contained: a reader who sees ONLY this headline (with no article title, no other cards, and weeks later) must immediately understand the subject AND feel curious.
   The formula is: [subject or context] + [curiosity gap or tension]. Do NOT write a curiosity gap without first anchoring the topic.
   Weak: "Why you stay — even when you know better"  ← topic missing, cryptic out of context
   Weak: "AI Models Now Process 1 Million Tokens"  ← no curiosity gap
   Strong: "Why people stay in bad relationships — economists finally have an answer"
   Strong: "The AI that read your entire novel — and still wants more context"
3. BULLETS — first two are concrete facts, numbers, or insights. Third bullet always answers "So what does this mean for me?" — a personal implication, behavior shift, or thing to watch.
4. Each card must make sense without reading the others and without knowing the article title.
5. Total words per card (headline + 3 bullets) must be under 60.
6. readTime reflects bullet density (10s–30s range).`.trim();

/** For inbox / guest routes — Claude determines the category */
export function buildClassifyPrompt(text: string, title: string, source: string): string {
  return `You are a content editor for a mobile stories app that turns articles into addictive, shareable cards.

Given this article, generate as many story cards as the content warrants — minimum 5, maximum 12. Each card covers ONE key idea and is completely standalone. Richer articles deserve more cards; don't pad thin content.

Return ONLY a valid JSON object — no markdown, no prose:
{
  "category": "<best match: technology|science|business|health|design|world|finance|philosophy|culture|lifestyle>",
  "cards": [
    {
      "headline": "Creates a curiosity gap (max 8 words)",
      "bullets": ["Concrete fact or insight (max 20 words)", "Another point (max 20 words)", "So what this means for you personally (max 20 words)"],
      "readTime": "15s"
    }
  ]
}

CATEGORY FOCUS (apply the one matching the category you assign):
${Object.entries(CATEGORY_FOCUS).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

${RULES}

Title: ${title}
Source: ${source}

Content:
${text.slice(0, 8_000)}`;
}

/** For discover route — category is already known */
export function buildDiscoverPrompt(text: string, title: string, category: string): string {
  const focus = CATEGORY_FOCUS[category] ?? "Concrete facts and insights — what matters and why.";
  return `You are a content editor for a mobile stories app that turns articles into addictive, shareable cards.

Given this article (category: ${category}), generate as many story cards as the content warrants — minimum 5, maximum 12. Each card covers ONE key idea and is completely standalone. Richer articles deserve more cards; don't pad thin content.

CATEGORY FOCUS: ${focus}

Return ONLY a valid JSON array — no markdown, no prose:
[
  {
    "headline": "Creates a curiosity gap (max 8 words)",
    "bullets": ["Concrete fact or insight (max 20 words)", "Another point (max 20 words)", "So what this means for you personally (max 20 words)"],
    "readTime": "15s"
  }
]

${RULES}

Title: ${title}

Content:
${text.slice(0, 8_000)}`;
}
