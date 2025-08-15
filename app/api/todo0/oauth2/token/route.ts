import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const grant_type = params.get("grant_type")
    const assertion = params.get("assertion")

    console.log("[v0] Todo0 token request:", {
      grant_type,
      assertion: assertion?.substring(0, 20) + "...",
    })

    if (grant_type !== "urn:ietf:params:oauth:grant-type:jwt-bearer") {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Only jwt-bearer grant type is supported" },
        { status: 400 },
      )
    }

    if (!assertion) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "assertion parameter is required" },
        { status: 400 },
      )
    }

    const jagValidation = await validateIdJagToken(assertion)
    if (!jagValidation.valid) {
      return NextResponse.json({ error: "invalid_grant", error_description: "Invalid ID-JAG token" }, { status: 400 })
    }

    const accessToken = await generateTodo0AccessToken({
      userId: jagValidation.userId,
      userEmail: jagValidation.userEmail,
      requestingClient: jagValidation.requestingClient,
    })

    console.log("[v0] Todo0 access token issued:", {
      userId: jagValidation.userId,
      requestingClient: jagValidation.requestingClient,
    })

    return NextResponse.json({
      token_type: "Bearer",
      access_token: accessToken.token,
      expires_in: accessToken.expires_in,
      scope: "read write",
    })
  } catch (error) {
    console.error("[v0] Todo0 token error:", error)
    return NextResponse.json({ error: "server_error", error_description: "Internal server error" }, { status: 500 })
  }
}

async function validateIdJagToken(token: string) {
  try {
    // In production, this would validate the JWT signature using IdP's public key
    // For demo purposes, we'll simulate validation

    const parts = token.split(".")
    if (parts.length !== 3) {
      return { valid: false }
    }

    // Decode the payload (in production, verify signature first)
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())

    // Validate issuer is the IdP
    if (payload.iss !== process.env.NEXT_PUBLIC_OKTA_ISSUER) {
      return { valid: false }
    }

    // Validate audience is this authorization server
    if (!payload.aud || !payload.aud.includes("todo0")) {
      return { valid: false }
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false }
    }

    return {
      valid: true,
      userId: payload.sub,
      userEmail: payload.email,
      requestingClient: payload.requesting_client,
    }
  } catch (error) {
    console.error("[v0] ID-JAG validation error:", error)
    return { valid: false }
  }
}

async function generateTodo0AccessToken(params: {
  userId: string
  userEmail: string
  requestingClient: string
}) {
  const now = Math.floor(Date.now() / 1000)

  const tokenClaims = {
    iss: "todo0-auth-server",
    aud: "todo0-api",
    sub: params.userId,
    email: params.userEmail,
    iat: now,
    exp: now + 86400, // 24 hours
    scope: "read write",
    client_id: params.requestingClient,
  }

  // Create Todo0 access token (in production, this would be a signed JWT)
  const accessToken = `todo0-access.${Buffer.from(JSON.stringify(tokenClaims)).toString("base64")}.signature`

  return {
    token: accessToken,
    expires_in: 86400,
  }
}
