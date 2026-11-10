const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** 6 random chars, child-friendly alphabet (no 0/O/1/I/L). */
export function generateInviteCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function formatInviteCode(code: string): string {
  const n = normalizeInviteCode(code);
  if (n.length !== 6) return n;
  return `${n.slice(0, 3)}-${n.slice(3)}`;
}
