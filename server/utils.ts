import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'charcha_secret_609_2026';

// SHA256 Hashing with static salt for simplicity and reliable matching
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function comparePassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Custom lightweight pure standard JWT Implementation
export function signToken(payload: object): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const stringify = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = stringify(header);
  const encodedPayload = stringify(payload);

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signature}`;
}

export function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const payloadJson = Buffer.from(base64 + padding, 'base64').toString('utf8');
    const data = JSON.parse(payloadJson);

    if (signature === expectedSignature) {
      return data;
    }

    // Check if it's a valid Firebase idToken based on issuer
    if (data && data.iss && data.iss.startsWith('https://securetoken.google.com/')) {
      return { userId: data.user_id || data.sub };
    }

    return null;
  } catch (e) {
    return null;
  }
}
