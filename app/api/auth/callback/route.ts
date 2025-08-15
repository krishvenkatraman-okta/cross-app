import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()

    console.log("[v0] Callback received:", { code: code?.substring(0, 10) + "...", state })

    const isAgent0 = state === "agent0" || state === "admin"
    const clientId = isAgent0
      ? process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID
      : process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID
    const clientSecret = isAgent0 ? process.env.OKTA_AGENT0_CLIENT_SECRET : process.env.OKTA_TODO_CLIENT_SECRET

    console.log("[v0] Using client:", { clientId, isAgent0, state })

    const host = request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const redirectUri = `${protocol}://${host}/callback`

    console.log("[v0] Token exchange params:", {
      issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER,
      redirectUri,
      clientId,
    })

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_OKTA_ISSUER}/oauth2/default/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      })
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    console.log("[v0] Token exchange successful:", {
      hasAccessToken: !!tokens.access_token,
      tokenType: tokens.token_type,
    })

    // Get user info
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_OKTA_ISSUER}/oauth2/default/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("[v0] User info fetch failed:", {
        status: userResponse.status,
        error: errorText,
      })
      throw new Error(`User info fetch failed: ${userResponse.status} ${errorText}`)
    }

    const userInfo = await userResponse.json()
    console.log("[v0] User info retrieved:", {
      sub: userInfo.sub,
      email: userInfo.email,
    })

    const user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      groups: userInfo.groups || [],
    }

    return NextResponse.json({ user, tokens })
  } catch (error) {
    console.error("[v0] Auth callback error:", error)
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    )
  }
}
