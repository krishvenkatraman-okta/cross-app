import { type NextRequest, NextResponse } from "next/server"
import { getAuthServerUrls } from "@/lib/okta-config"

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()

    console.log("[v0] Callback received:", { code: code?.substring(0, 10) + "...", state })

    const isJarvis = state === "jarvis"
    const isAgent0 = state === "agent0" || state === "admin" || isJarvis
    const isInventory = state === "inventory"
    const isTodo0 = state === "todo0" || state === "todo"

    const clientId = isJarvis
      ? process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
      : isAgent0
        ? process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID
        : isInventory
          ? process.env.NEXT_PUBLIC_OKTA_INVENTORY_CLIENT_ID
          : process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID
    const clientSecret = isJarvis
      ? process.env.OKTA_JARVIS_CLIENT_SECRET
      : isAgent0
        ? process.env.OKTA_AGENT0_CLIENT_SECRET
        : isInventory
          ? process.env.OKTA_INVENTORY_CLIENT_SECRET
          : process.env.OKTA_TODO_CLIENT_SECRET

    console.log("[v0] Using client:", { clientId, isAgent0, isTodo0, isJarvis, isInventory, state })

    const host = request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const redirectUri = `${protocol}://${host}/callback`

    const authServerUrls = getAuthServerUrls()
    const tokenEndpoint = authServerUrls.token
    const userinfoEndpoint = authServerUrls.userinfo

    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`

    console.log("[v0] Token exchange details:", {
      issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER,
      tokenEndpoint,
      userinfoEndpoint,
      redirectUri,
      clientId,
      clientSecretLength: clientSecret?.length,
      authHeaderLength: authHeader.length,
      host,
      protocol,
    })

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    })

    console.log("[v0] Token request body:", tokenBody.toString())

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: tokenBody,
    })

    console.log("[v0] Token response status:", tokenResponse.status, tokenResponse.statusText)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("[v0] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        headers: Object.fromEntries(tokenResponse.headers.entries()),
      })
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    console.log("[v0] Token exchange successful:", {
      hasAccessToken: !!tokens.access_token,
      hasIdToken: !!tokens.id_token,
      tokenType: tokens.token_type,
    })

    // Get user info
    const userResponse = await fetch(userinfoEndpoint, {
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
