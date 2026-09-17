// Small helper to create and check "you paid" tokens without needing a database.
// The token is just {plan, exp} signed with a secret only your server knows,
// so nobody can forge a fake "I paid" token from the browser.
const crypto = require('crypto');

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  if (sig !== expected) return null; // tampered or forged
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null; // expired
    return payload; // { plan, exp }
  } catch {
    return null;
  }
}

module.exports = { sign, verify };
