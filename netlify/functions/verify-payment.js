const { sign } = require('./_token');

// Prices in kobo (₦1 = 100 kobo) — must match what the frontend charges,
// so a tampered request can't claim a bigger plan than was actually paid for.
const PLANS = {
  task: { amount: 200000, durationMs: 60 * 60 * 1000 },             // ₦2,000 — 1 hour access, one task
  weekly: { amount: 700000, durationMs: 7 * 24 * 60 * 60 * 1000 },   // ₦7,000
  monthly: { amount: 1000000, durationMs: 30 * 24 * 60 * 60 * 1000 }, // ₦10,000
  yearly: { amount: 4000000, durationMs: 365 * 24 * 60 * 60 * 1000 }, // ₦40,000
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let reference, plan;
  try {
    ({ reference, plan } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) };
  }

  const planConfig = PLANS[plan];
  if (!reference || !planConfig) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid plan or reference' }) };
  }

  try {
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    const data = await resp.json();

    if (!data.status || data.data?.status !== 'success') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Payment not verified' }) };
    }
    if (data.data.amount !== planConfig.amount) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Amount does not match plan' }) };
    }

    const exp = Date.now() + planConfig.durationMs;
    const token = sign({ plan, exp }, process.env.APP_SECRET);

    return { statusCode: 200, body: JSON.stringify({ token, exp, plan }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
