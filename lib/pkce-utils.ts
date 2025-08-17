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

export function generateCodeChallenge(codeVerifier: string): string {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  return crypto.subtle.digest("SHA-256", data).then((hash) => {
    const bytes = new Uint8Array(hash)
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")
  })
}

// For synchronous use in client-side code
export function generateCodeChallengeSync(codeVerifier: string): string {
  // Simple base64url encoding of the code verifier for demo purposes
  // In production, you should use proper SHA256 hashing
  return btoa(codeVerifier).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}
