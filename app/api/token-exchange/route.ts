import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const grant_type = formData.get("grant_type")?.toString()
    const subject_token = formData.get("subject_token")?.toString()
    const subject_token_type = formData.get("subject_token_type")?.toString()
    const audience = formData.get("audience")?.toString()
    const requested_token_type = formData.get("requested_token_type")?.toString()
    const client_assertion = formData.get("client_assertion")?.toString()
    const client_assertion_type = formData.get("client_assertion_type")?.toString()

    console.log("[v0] Token exchange request:", {
      grant_type,
      subject_token_type,
      audience,
      requested_token_type,
      subject_token: subject_token?.substring(0, 20) + "...",
    })

    if (grant_type !== "urn:ietf:params:oauth:grant-type:token-exchange") {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Only token exchange grant type is supported" },
        { status: 400 },
      )
    }

    if (requested_token_type !== "urn:ietf:params:oauth:token-type:id-jag") {
      return NextResponse.json(
        { error: "unsupported_token_type", error_description: "Only id-jag token type is supported" },
        { status: 400 },
      )
    }

    if (!subject_token || !audience) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "subject_token and audience are required" },
        { status: 400 },
      )
    }

    if (subject_token_type !== "urn:ietf:params:oauth:token-type:id_token") {
      return NextResponse.json(
        { error: "invalid_request", error_description: "subject_token_type must be id_token" },
        { status: 400 },
      )
    }

    // Validate the subject token (the ID token from the requesting app)
    const tokenValidation = await validateIdToken(subject_token)
    if (!tokenValidation.valid) {
      return NextResponse.json({ error: "invalid_grant", error_description: "Invalid ID token" }, { status: 400 })
    }

    if (!client_assertion || client_assertion_type !== "urn:ietf:params:oauth:client-assertion-type:jwt-bearer") {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Client assertion required" },
        { status: 400 },
      )
    }

    // Determine the target application based on audience
    console.log("[v0] Determining target app for audience:", audience)
    const targetApp = determineTargetApp(audience)
    console.log("[v0] Target app determined:", targetApp)

    if (!targetApp) {
      console.error("[v0] No target app found for audience:", audience)
      console.error(
        "[v0] Available audience mappings:",
        Object.keys({
          "https://auth.todo0.com/": "todo0",
          "https://auth.agent0.com/": "agent0",
          "https://auth.inventory.com/": "inventory",
          "todo0-auth-server": "todo0",
          "agent0-auth-server": "agent0",
          "inventory-auth-server": "inventory",
        }),
      )
      return NextResponse.json(
        { error: "invalid_target", error_description: "Invalid audience specified" },
        { status: 400 },
      )
    }

    const idJagToken = await generateIdJagToken({
      sourceApp: tokenValidation.app,
      targetApp,
      userId: tokenValidation.userId,
      userEmail: tokenValidation.userEmail,
      audience,
    })

    console.log("[v0] ID-JAG token exchange successful:", {
      sourceApp: tokenValidation.app,
      targetApp,
      userId: tokenValidation.userId,
    })

    return NextResponse.json({
      issued_token_type: "urn:ietf:params:oauth:token-type:id-jag",
      access_token: idJagToken.token, // Note: called access_token but it's actually an ID-JAG
      token_type: "N_A", // As per spec
      expires_in: idJagToken.expires_in,
    })
  } catch (error) {
    console.error("[v0] Token exchange error:", error)
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error during token exchange" },
      { status: 500 },
    )
  }
}

async function validateIdToken(token: string) {
  try {
    console.log("[v0] Validating ID token:", token.substring(0, 50) + "...")

    // Check if it's a valid format (JWT has 3 parts separated by dots)
    const parts = token.split(".")
    if (parts.length !== 3) {
      console.error("[v0] Invalid JWT format - expected 3 parts, got:", parts.length)
      return { valid: false }
    }

    try {
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString())
      console.log("[v0] Decoded ID token payload:", {
        sub: payload.sub,
        email: payload.email,
        iss: payload.iss,
        aud: payload.aud,
      })

      return {
        valid: true,
        app: "agent0", // The requesting app (Agent0)
        userId: payload.sub || payload.preferred_username || "unknown-user",
        userEmail: payload.email || "user@tables.fake",
      }
    } catch (decodeError) {
      console.error("[v0] Failed to decode ID token payload:", decodeError)
      return { valid: false } // Don't fallback to demo data, fail validation instead
    }
  } catch (error) {
    console.error("[v0] ID token validation error:", error)
    return { valid: false }
  }
}

function determineTargetApp(audience: string) {
  const audienceMap: Record<string, string> = {
    "https://auth.todo0.com/": "todo0",
    "https://auth.agent0.com/": "agent0",
    "https://auth.inventory.com/": "inventory",
    "todo0-auth-server": "todo0",
    "agent0-auth-server": "agent0",
    "inventory-auth-server": "inventory",
  }

  console.log("[v0] Looking up audience in map:", audience)
  const result = audienceMap[audience] || null
  console.log("[v0] Audience lookup result:", result)
  return result
}

async function generateIdJagToken(params: {
  sourceApp: string
  targetApp: string
  userId: string
  userEmail: string
  audience: string
}) {
  // Generate an Identity Assertion JWT (ID-JAG) as per the spec
  const now = Math.floor(Date.now() / 1000)

  const idJagClaims = {
    iss: process.env.NEXT_PUBLIC_OKTA_ISSUER, // The IdP (Okta)
    aud: params.audience, // The target authorization server
    sub: params.userId,
    email: params.userEmail,
    iat: now,
    exp: now + 300, // 5 minutes as per spec
    nbf: now,
    // Additional claims for cross-app access
    requesting_client: params.sourceApp,
    target_client: params.targetApp,
  }

  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(JSON.stringify(idJagClaims)).toString("base64url")
  const idJagToken = `${encodedHeader}.${encodedPayload}.demo-signature`

  return {
    token: idJagToken,
    expires_in: 300, // 5 minutes
  }
}
