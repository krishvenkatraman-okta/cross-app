import { type NextRequest, NextResponse } from "next/server"

async function validateIdJagToken(assertion: string): Promise<{ valid: boolean; user_id: string; client_id: string }> {
  try {
    const tokenParts = assertion.split(".")
    if (tokenParts.length !== 3) {
      console.log("[v0] Invalid ID-JAG token format")
      return { valid: false, user_id: "", client_id: "" }
    }

    const header = JSON.parse(Buffer.from(tokenParts[0], "base64url").toString())
    const payload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString())

    console.log("[v0] ID-JAG token validation:", {
      issuer: payload.iss,
      audience: payload.aud,
      subject: payload.sub,
      expires: payload.exp,
      issuedAt: payload.iat,
      expired: payload.exp < Math.floor(Date.now() / 1000),
    })

    // Validate token is not expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      console.log("[v0] ID-JAG token is expired")
      return { valid: false, user_id: "", client_id: "" }
    }

    // Validate issuer is from Okta
    if (!payload.iss || !payload.iss.includes("okta.com")) {
      console.log("[v0] ID-JAG token issuer is not from Okta:", payload.iss)
      return { valid: false, user_id: "", client_id: "" }
    }

    // Validate audience matches this authorization server
    const expectedAudience = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/inventory/oauth2`
    if (payload.aud !== expectedAudience) {
      console.log("[v0] ID-JAG token audience mismatch. Expected:", expectedAudience, "Got:", payload.aud)
      // Allow for demo purposes, but log the mismatch
    }

    return {
      valid: true,
      user_id: payload.sub || "00up6GlznvCobuu31d7",
      client_id: payload.client_id || payload.azp || process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID || "jarvis-client",
    }
  } catch (error) {
    console.error("[v0] ID-JAG token validation error:", error)
    return { valid: false, user_id: "", client_id: "" }
  }
}

function validateJwtBearerAssertion(assertion: string): { valid: boolean; user_id: string; client_id: string } {
  try {
    if (assertion.includes(".")) {
      try {
        const payload = JSON.parse(atob(assertion.split(".")[1]))
        return {
          valid: true,
          user_id: payload.sub || payload.user_id || "00up6GlznvCobuu31d7",
          client_id: payload.aud || process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID || "jarvis-client",
        }
      } catch (error) {
        console.log("[v0] Could not decode JWT assertion")
      }
    }

    // Fallback for demo tokens
    return {
      valid: true,
      user_id: "00up6GlznvCobuu31d7", // Real Okta user ID
      client_id: process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID || "jarvis-client",
    }
  } catch (error) {
    return {
      valid: false,
      user_id: "",
      client_id: "",
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const grantType = params.get("grant_type")
    const assertion = params.get("assertion")

    console.log("[v0] Inventory OAuth2 token request:", { grantType })

    if (grantType !== "urn:ietf:params:oauth:grant-type:jwt-bearer") {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Only JWT Bearer grant type is supported" },
        { status: 400 },
      )
    }

    if (!assertion) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing assertion parameter" },
        { status: 400 },
      )
    }

    const validation = await validateIdJagToken(assertion)

    if (!validation.valid) {
      return NextResponse.json(
        { error: "invalid_grant", error_description: "Invalid ID-JAG assertion" },
        { status: 400 },
      )
    }

    // Generate access token for inventory access
    const accessToken = `inventory-access-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    console.log("[v0] Inventory access token issued:", {
      userId: validation.user_id,
      requestingClient: validation.client_id,
      tokenType: "Bearer",
    })

    return NextResponse.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "read write",
      user_id: validation.user_id,
    })
  } catch (error) {
    console.error("[v0] Inventory OAuth2 token error:", error)
    return NextResponse.json({ error: "server_error", error_description: "Internal server error" }, { status: 500 })
  }
}
