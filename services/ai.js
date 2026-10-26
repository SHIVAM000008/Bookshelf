const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';

class AIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function generateSummary(book) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AIError('AI is not configured. Add ANTHROPIC_API_KEY to your .env file', 503);
  }

  const details = [`Title: ${book.title}`, `Author: ${book.author}`];
  if (book.genre) details.push(`Genre: ${book.genre}`);
  if (book.year) details.push(`Year: ${book.year}`);

  const prompt = [
    'Write a short, spoiler-free summary of this book in 2 or 3 sentences.',
    'If you are not sure about the book, say so briefly instead of guessing.',
    '',
    details.join('\n')
  ].join('\n');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('AI request failed:', res.status, body);
    throw new AIError('The AI service could not generate a summary right now', 502);
  }

  const data = await res.json();
  const text = data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  if (!text) throw new AIError('The AI service returned an empty summary', 502);
  return text;
}

module.exports = { generateSummary, AIError };
