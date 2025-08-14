import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_OKTA_ISSUER}/oauth2/default/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID}:${process.env.OKTA_TODO_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Token exchange failed")
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_OKTA_ISSUER}/oauth2/default/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error("User info fetch failed")
    }

    const userInfo = await userResponse.json()

    const user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      groups: userInfo.groups || [],
    }

    return NextResponse.json({ user, tokens })
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 })
  }
}
