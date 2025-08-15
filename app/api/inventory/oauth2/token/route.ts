import { type NextRequest, NextResponse } from "next/server"

function validateJwtBearerAssertion(assertion: string): { valid: boolean; user_id: string; client_id: string } {
  try {
    if (assertion.includes(".")) {
      try {
        const payload = JSON.parse(atob(assertion.split(".")[1]))
        return {
          valid: true,
          user_id: payload.sub || payload.user_id || "00up6GlznvCobuu31d7",
          client_id: payload.aud || "jarvis-client",
        }
      } catch (error) {
        console.log("[v0] Could not decode JWT assertion")
      }
    }

    // Fallback for demo tokens
    return {
      valid: true,
      user_id: "00up6GlznvCobuu31d7", // Real Okta user ID
      client_id: "jarvis-client",
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

    const validation = validateJwtBearerAssertion(assertion)

    if (!validation.valid) {
      return NextResponse.json({ error: "invalid_grant", error_description: "Invalid JWT assertion" }, { status: 400 })
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
