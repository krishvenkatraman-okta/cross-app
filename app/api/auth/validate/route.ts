import { type NextRequest, NextResponse } from "next/server"
import { getAuthServerUrls } from "@/lib/okta-config"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    const issuer = process.env.NEXT_PUBLIC_OKTA_ISSUER
    if (!issuer) {
      return NextResponse.json({ error: "Missing Okta configuration" }, { status: 500 })
    }

    const authServerUrls = getAuthServerUrls(issuer)

    // Validate token with Okta using the correct authorization server
    const userResponse = await fetch(`${authServerUrls.userinfo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      console.log("[v0] Token validation failed:", userResponse.status, userResponse.statusText)
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
