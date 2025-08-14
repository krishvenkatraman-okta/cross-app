import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Validate token with Okta
    const userResponse = await fetch(`${process.env.NEXT_PUBLIC_OKTA_ISSUER}/oauth2/default/v1/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userInfo = await userResponse.json()

    const user = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      groups: userInfo.groups || [],
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ error: "Validation failed" }, { status: 500 })
  }
}
