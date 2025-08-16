function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

export function generateCodeVerifier(): string {
  return generateRandomString(128)
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const hash = await crypto.subtle.digest("SHA-256", data)
  const bytes = new Uint8Array(hash)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

// Synchronous version for client-side use
export function generateCodeChallengeSync(codeVerifier: string): string {
  // Simple base64url encoding for demo purposes
  // In production, use proper SHA256 hashing
  return btoa(codeVerifier).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}
