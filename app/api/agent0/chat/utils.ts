export function createDemoIdToken(): string {
  // Create a properly formatted JWT ID token for demo purposes
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: "demo-key-id",
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://iam.oktapreview.com",
    aud: process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID || "demo-client-id",
    sub: "00up6GlznvCobuu31d7", // Demo user ID from your logs
    email: "Arjun@atko.email", // Demo email from your logs
    iat: now,
    exp: now + 3600, // 1 hour
    nbf: now,
    auth_time: now,
    amr: ["pwd"],
    // Additional claims for Agent0
    preferred_username: "arjun@atko.email",
    given_name: "Arjun",
    family_name: "Demo",
    locale: "en-US",
  }

  // Create base64url encoded JWT parts
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = "demo-signature-would-be-real-in-production"

  return `${encodedHeader}.${encodedPayload}.${signature}`
}
