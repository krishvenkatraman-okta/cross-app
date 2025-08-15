import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { grant_type, subject_token, subject_token_type, audience, requested_token_type } = await request.json()

    console.log("[v0] Token exchange request:", {
      grant_type,
      subject_token_type,
      audience,
      requested_token_type,
      subject_token: subject_token?.substring(0, 20) + "...",
    })

    // Validate the token exchange request
    if (grant_type !== "urn:ietf:params:oauth:grant-type:token-exchange") {
      return NextResponse.json(
        { error: "unsupported_grant_type", error_description: "Only token exchange grant type is supported" },
        { status: 400 },
      )
    }

    if (!subject_token || !audience) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "subject_token and audience are required" },
        { status: 400 },
      )
    }

    // Validate the subject token (the token from the requesting app)
    const tokenValidation = await validateSubjectToken(subject_token)
    if (!tokenValidation.valid) {
      return NextResponse.json({ error: "invalid_grant", error_description: "Invalid subject token" }, { status: 400 })
    }

    // Determine the target application based on audience
    const targetApp = determineTargetApp(audience)
    if (!targetApp) {
      return NextResponse.json(
        { error: "invalid_target", error_description: "Invalid audience specified" },
        { status: 400 },
      )
    }

    // Generate a cross-app access token
    const crossAppToken = await generateCrossAppToken({
      sourceApp: tokenValidation.app,
      targetApp,
      userId: tokenValidation.userId,
      userEmail: tokenValidation.userEmail,
      scopes: ["read", "write"], // In production, this would be more granular
    })

    console.log("[v0] Token exchange successful:", {
      sourceApp: tokenValidation.app,
      targetApp,
      userId: tokenValidation.userId,
    })

    return NextResponse.json({
      access_token: crossAppToken.access_token,
      issued_token_type: "urn:ietf:params:oauth:token-type:access_token",
      token_type: "Bearer",
      expires_in: crossAppToken.expires_in,
      scope: crossAppToken.scope,
    })
  } catch (error) {
    console.error("[v0] Token exchange error:", error)
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error during token exchange" },
      { status: 500 },
    )
  }
}

async function validateSubjectToken(token: string) {
  try {
    // In production, this would validate the JWT token properly
    // For demo purposes, we'll simulate token validation

    // Check if it's a valid format (JWT has 3 parts separated by dots)
    const parts = token.split(".")
    if (parts.length !== 3) {
      return { valid: false }
    }

    // Simulate extracting user info from token
    // In production, you'd decode and verify the JWT
    return {
      valid: true,
      app: token.includes("agent0") ? "agent0" : "todo0",
      userId: "demo-user",
      userEmail: "user@tables.fake",
    }
  } catch (error) {
    console.error("[v0] Token validation error:", error)
    return { valid: false }
  }
}

function determineTargetApp(audience: string) {
  const audienceMap: Record<string, string> = {
    "todo0-api": "todo0",
    "agent0-api": "agent0",
    "http://localhost:3000/api/todo0": "todo0",
    "http://localhost:3001/api/agent0": "agent0",
  }

  return audienceMap[audience] || null
}

async function generateCrossAppToken(params: {
  sourceApp: string
  targetApp: string
  userId: string
  userEmail: string
  scopes: string[]
}) {
  // In production, this would generate a proper JWT token
  // For demo purposes, we'll create a simple token structure

  const tokenData = {
    iss: `${params.sourceApp}-auth-server`,
    aud: `${params.targetApp}-api`,
    sub: params.userId,
    email: params.userEmail,
    scope: params.scopes.join(" "),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    cross_app: true,
    source_app: params.sourceApp,
    target_app: params.targetApp,
  }

  // Create a demo token (in production, this would be a signed JWT)
  const demoToken = `cross-app-token.${Buffer.from(JSON.stringify(tokenData)).toString("base64")}.signature`

  return {
    access_token: demoToken,
    expires_in: 3600,
    scope: params.scopes.join(" "),
  }
}
