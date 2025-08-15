import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { target_app } = await request.json()

    console.log("[v0] Cross-app access request for:", target_app)

    // Get the current user's token from the request
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const currentToken = authHeader.substring(7)

    // Request a cross-app token via token exchange
    const tokenExchangeResponse = await fetch(`${request.nextUrl.origin}/api/token-exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        subject_token: currentToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
        audience: `${target_app}-api`,
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      }),
    })

    if (!tokenExchangeResponse.ok) {
      const error = await tokenExchangeResponse.json()
      console.error("[v0] Token exchange failed:", error)
      return NextResponse.json({ error: "Token exchange failed", details: error }, { status: 400 })
    }

    const exchangedToken = await tokenExchangeResponse.json()

    console.log("[v0] Cross-app token obtained:", {
      tokenType: exchangedToken.token_type,
      expiresIn: exchangedToken.expires_in,
      scope: exchangedToken.scope,
    })

    return NextResponse.json({
      access_token: exchangedToken.access_token,
      token_type: exchangedToken.token_type,
      expires_in: exchangedToken.expires_in,
      scope: exchangedToken.scope,
      target_app,
    })
  } catch (error) {
    console.error("[v0] Cross-app access error:", error)
    return NextResponse.json({ error: "Failed to obtain cross-app access" }, { status: 500 })
  }
}
