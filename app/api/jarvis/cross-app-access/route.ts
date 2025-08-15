import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { target_app } = await request.json()

    console.log("[v0] Cross-app access request for:", target_app)

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const idToken = authHeader.substring(7)

    const audienceUrl = target_app === "inventory" ? "https://auth.inventory.com/" : `https://auth.${target_app}.com/`

    const idJagResponse = await fetch(`${request.nextUrl.origin}/api/token-exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
        audience: audienceUrl,
        subject_token: idToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: "demo-client-assertion",
      }),
    })

    if (!idJagResponse.ok) {
      const error = await idJagResponse.json()
      console.error("[v0] ID-JAG exchange failed:", error)
      return NextResponse.json({ error: "ID-JAG exchange failed", details: error }, { status: 400 })
    }

    const idJagToken = await idJagResponse.json()
    console.log("[v0] ID-JAG token obtained")

    const tokenEndpoint =
      target_app === "inventory"
        ? `${request.nextUrl.origin}/api/inventory/oauth2/token`
        : `${request.nextUrl.origin}/api/${target_app}/oauth2/token`

    const accessTokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from("jarvis-client:jarvis-secret").toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: idJagToken.access_token,
      }),
    })

    if (!accessTokenResponse.ok) {
      const error = await accessTokenResponse.json()
      console.error("[v0] Access token request failed:", error)
      return NextResponse.json({ error: "Access token request failed", details: error }, { status: 400 })
    }

    const accessToken = await accessTokenResponse.json()

    console.log("[v0] Cross-app access token obtained:", {
      tokenType: accessToken.token_type,
      expiresIn: accessToken.expires_in,
      scope: accessToken.scope,
    })

    const responseTokens =
      target_app === "inventory"
        ? {
            access_token: accessToken.access_token,
            inventory_access_token: accessToken.access_token,
            id_jag_token: idJagToken.access_token,
            token_type: accessToken.token_type,
            expires_in: accessToken.expires_in,
            scope: accessToken.scope,
            target_app,
          }
        : {
            access_token: accessToken.access_token,
            id_jag_token: idJagToken.access_token,
            token_type: accessToken.token_type,
            expires_in: accessToken.expires_in,
            scope: accessToken.scope,
            target_app,
          }

    return NextResponse.json(responseTokens)
  } catch (error) {
    console.error("[v0] Cross-app access error:", error)
    return NextResponse.json({ error: "Failed to obtain cross-app access" }, { status: 500 })
  }
}
