const { verify } = require('./_token');

// Cheap, fast model for free-tier short answers.
const FREE_MODEL = 'claude-haiku-4-5-20251001';
// Stronger model for premium document/questionnaire/essay generation.
const PREMIUM_MODEL = 'claude-sonnet-5';

const FREE_SYSTEM = `You are the ThesisPoint website assistant.
ThesisPoint offers student research support: data analysis (SPSS/Excel), questionnaire
and instrument design, academic writing/editing, and full project/thesis packages.
Founder: David Akpoaresine Timipere, Agricultural Economics, Hensard University.

In FREE mode you may ONLY:
- Answer questions about ThesisPoint's services, prices, the founder, and how ordering works.
- Keep every answer under 50 words. Be direct and warm, no filler.

If the user asks you to WRITE, GENERATE, or PRODUCE anything for them — a questionnaire,
an essay, a document, a data analysis, a full write-up, or anything similarly substantial —
do not attempt it and do not explain why in your own words. Reply with EXACTLY this token
and nothing else: PREMIUM_REQUIRED`;

const PREMIUM_SYSTEM = `You are the ThesisPoint AI assistant in PREMIUM mode, for a user who has
paid for full access. Write at a professional, polished academic standard — clear structure,
strong organization, careful language, well laid out with headings where appropriate.
Fully complete whatever the user asks for: questionnaires, essays, academic writing, data
analysis write-ups, or full project support. Do not artificially shorten your answers.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let message, token;
  try {
    ({ message, token } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }
  if (!message || typeof message !== 'string') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing message' }) };
  }

  const unlocked = verify(token, process.env.APP_SECRET);
  const system = unlocked ? PREMIUM_SYSTEM : FREE_SYSTEM;
  const model = unlocked ? PREMIUM_MODEL : FREE_MODEL;
  const maxTokens = unlocked ? 3000 : 120;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: data?.error?.message || 'AI request failed' }) };
    }

    const text = (data.content || []).map((c) => c.text || '').join('').trim();

    if (!unlocked && text === 'PREMIUM_REQUIRED') {
      return {
        statusCode: 200,
        body: JSON.stringify({ premiumRequired: true }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ reply: text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
