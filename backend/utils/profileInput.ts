/**
 * Accepts what people actually paste into the "connect profile" box and returns a bare username/handle:
 *   "Abhishek_notKnown"
 *   "@Abhishek_notKnown"
 *   "https://leetcode.com/u/Abhishek_notKnown/"
 *   "leetcode.com/Abhishek_notKnown"
 *   "https://codeforces.com/profile/tourist"
 */
export function extractProfileId(input: string, platform: 'leetcode' | 'codeforces'): string {
  let value = (input || '').trim();
  if (!value) return '';

  // Looks like a URL (has a scheme or a known domain)? Pull the id out of the path.
  const looksLikeUrl = /^(https?:\/\/)/i.test(value) || /(leetcode\.(com|cn)|codeforces\.(com|ml))\//i.test(value);
  if (looksLikeUrl) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      const parts = url.pathname.split('/').filter(Boolean);
      if (platform === 'codeforces') {
        const i = parts.findIndex((p) => p.toLowerCase() === 'profile');
        value = i >= 0 ? parts[i + 1] || '' : parts[0] || '';
      } else {
        const i = parts.findIndex((p) => p.toLowerCase() === 'u');
        value = i >= 0 ? parts[i + 1] || '' : parts[0] || '';
      }
    } catch {
      /* fall through with the raw value */
    }
  }

  return decodeURIComponent(value.replace(/^@/, '').replace(/[?#].*$/, '').replace(/\/+$/, '')).trim();
}
