// RFC 6238 / RFC 4226 WebCrypto TOTP Engine (Google Authenticator & Authy compatible)
// Uses 30-second time steps, 6 digits, HMAC-SHA1, Base32 secret encoding.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length: number = 16): string {
  const randomBytes = new Uint8Array(length);
  window.crypto.getRandomValues(randomBytes);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % 32];
  }
  return secret;
}

export function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;
    for (let j = 4; j >= 0; j--) {
      bits.push((val >> j) & 1);
    }
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i * 8 + j];
    }
    bytes[i] = byte;
  }
  return bytes;
}

export async function generateHotp(secretBase32: string, counter: number): Promise<string> {
  const keyBytes = base32ToBytes(secretBase32);
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

export async function verifyTotpCode(
  secretBase32: string,
  code: string,
  windowSteps: number = 1
): Promise<boolean> {
  const cleanedCode = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanedCode) || !secretBase32) {
    return false;
  }

  const currentCounter = Math.floor(Date.now() / 1000 / 30);

  for (let errorWindow = -windowSteps; errorWindow <= windowSteps; errorWindow++) {
    const expected = await generateHotp(secretBase32, currentCounter + errorWindow);
    if (expected === cleanedCode) {
      return true;
    }
  }

  return false;
}

export function buildOtpAuthUri(email: string, secretBase32: string, issuer: string = 'Cyber Bingo Admin'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
