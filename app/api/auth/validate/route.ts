import { type NextRequest, NextResponse } from "next/server"
import { getAuthServerUrls } from "@/lib/okta-config"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[v0] No authorization header provided")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    console.log("[v0] Validating token length:", token.length)

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    const authServer = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER
    console.log("[v0] Environment config:", {
      issuer: issuer ? "present" : "missing",
      authServer: authServer || "default",
    })

    if (!issuer) {
      return NextResponse.json({ error: "Missing Okta configuration" }, { status: 500 })
    }

    const authServerUrls = getAuthServerUrls(issuer)
    console.log("[v0] Generated URLs:", {
      userinfo: authServerUrls.userinfo,
      issuer: authServerUrls.issuer,
    })

    if (!authServerUrls.userinfo) {
      console.error("[v0] Userinfo URL is undefined")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    console.log("[v0] Making userinfo request to:", authServerUrls.userinfo)

    // Validate token with Okta using the correct authorization server
    const userResponse = await fetch(authServerUrls.userinfo, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    console.log("[v0] Userinfo response:", {
      status: userResponse.status,
      statusText: userResponse.statusText,
      ok: userResponse.ok,
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.log("[v0] Token validation failed with response:", errorText)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userInfo = await userResponse.json()

    const user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      groups: userInfo.groups || [],
    }

    console.log("[v0] Token validation successful for user:", user.email)
    return NextResponse.json(user)
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
