import faqs from "../data/faqs.json";

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

export function findFaqAnswer(userInput: string): { answer: string; matchedId?: string } {
  const q = normalize(userInput);

  // 1) Exact/contains match on provided question variants
  for (const item of faqs) {
    for (const variant of item.questions) {
      const v = normalize(variant);
      if (q.includes(v) || v.includes(q)) {
        return { answer: item.answer, matchedId: item.id };
      }
    }
  }

  // 2) Simple keyword overlap scoring (fallback)
  const words = new Set(q.split(" ").filter(Boolean));
  let best = { score: 0, item: null as (typeof faqs)[number] | null };

  for (const item of faqs) {
    const allText = normalize(item.questions.join(" "));
    const textWords = new Set(allText.split(" ").filter(Boolean));
    let overlap = 0;
    words.forEach((w) => { if (textWords.has(w)) overlap++; });
    const score = overlap / Math.max(1, words.size);

    if (score > best.score) best = { score, item };
  }

  if (best.item && best.score >= 0.25) {
    return { answer: best.item.answer, matchedId: best.item.id };
  }

  // 3) No match
  return {
    answer:
      "Sorry, I don’t have an answer for that yet. Want me to add this question to the FAQ?",
  };
}