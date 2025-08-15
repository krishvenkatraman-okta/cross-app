import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { target_app } = await request.json()

    console.log("[v0] Cross-app access request for:", target_app)

    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const idToken = authHeader.substring(7)

    console.log("[v0] ID token length:", idToken.length)
    console.log("[v0] ID token starts with:", idToken.substring(0, 50) + "...")

    // Decode and validate the ID token structure
    let tokenPayload: any
    try {
      const tokenParts = idToken.split(".")
      if (tokenParts.length !== 3) {
        console.error("[v0] Invalid ID token format - not a proper JWT")
        return NextResponse.json({ error: "Invalid ID token format" }, { status: 400 })
      }

      const header = JSON.parse(Buffer.from(tokenParts[0], "base64url").toString())
      tokenPayload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString())

      console.log("[v0] ID token header:", header)
      console.log("[v0] ID token payload:", {
        iss: tokenPayload.iss,
        aud: tokenPayload.aud,
        sub: tokenPayload.sub,
        exp: tokenPayload.exp,
        iat: tokenPayload.iat,
        expired: tokenPayload.exp < Math.floor(Date.now() / 1000),
      })

      // Check if token is expired
      if (tokenPayload.exp < Math.floor(Date.now() / 1000)) {
        console.error("[v0] ID token is expired")
        return NextResponse.json({ error: "ID token is expired" }, { status: 400 })
      }

      // Verify issuer matches expected Okta domain
      if (!tokenPayload.iss || !tokenPayload.iss.includes("okta.com")) {
        console.error("[v0] ID token issuer is not from Okta:", tokenPayload.iss)
        return NextResponse.json({ error: "Invalid ID token issuer" }, { status: 400 })
      }
    } catch (decodeError) {
      console.error("[v0] Failed to decode ID token:", decodeError)
      return NextResponse.json({ error: "Failed to decode ID token" }, { status: 400 })
    }

    const oktaDomain = tokenPayload.iss.replace("/oauth2/default", "").replace("/oauth2", "")
    const dynamicTokenEndpoint = `${oktaDomain}/oauth2/v1/token`

    console.log("[v0] Extracted Okta domain from ID token:", oktaDomain)
    console.log("[v0] Using dynamic token endpoint:", dynamicTokenEndpoint)

    const audienceUrl = target_app === "inventory" ? "https://auth.inventory.com/" : `https://auth.${target_app}.com/`

    const clientId = tokenPayload.aud
    if (!clientId) {
      return NextResponse.json({ error: "Missing client ID from ID token audience" }, { status: 500 })
    }

    const clientAssertion = await generateClientAssertion(clientId, dynamicTokenEndpoint)

    console.log("[v0] Making ID-JAG token exchange request to Okta:", dynamicTokenEndpoint)
    console.log("[v0] Using client ID:", clientId)
    console.log("[v0] Token exchange parameters:", {
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
      audience: audienceUrl,
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      subject_token_length: idToken.length,
    })

    const idJagResponse = await fetch(dynamicTokenEndpoint, {
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
        client_assertion: clientAssertion,
      }),
    })

    if (!idJagResponse.ok) {
      const errorText = await idJagResponse.text()
      console.error("[v0] ID-JAG exchange failed:", {
        status: idJagResponse.status,
        statusText: idJagResponse.statusText,
        body: errorText,
      })
      return NextResponse.json(
        {
          error: "ID-JAG exchange failed",
          details: { status: idJagResponse.status, message: errorText },
        },
        { status: 400 },
      )
    }

    const idJagToken = await idJagResponse.json()
    console.log("[v0] ID-JAG token obtained from Okta")

    const tokenEndpoint =
      target_app === "inventory"
        ? `${request.nextUrl.origin}/api/inventory/oauth2/token`
        : `${request.nextUrl.origin}/api/${target_app}/oauth2/token`

    const clientCredentials = Buffer.from(
      `${clientId}:${process.env.OKTA_JARVIS_CLIENT_SECRET || "jarvis-secret"}`,
    ).toString("base64")

    const accessTokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + clientCredentials,
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

async function generateClientAssertion(clientId: string, audience: string) {
  const now = Math.floor(Date.now() / 1000)

  const claims = {
    iss: clientId,
    sub: clientId,
    aud: audience,
    iat: now,
    exp: now + 300,
    jti: crypto.randomUUID(),
  }

  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(JSON.stringify(claims)).toString("base64url")

  const secret = process.env.OKTA_JARVIS_CLIENT_SECRET || "demo-jwt-secret-key-for-client-assertions"
  const signature = crypto.createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest("base64url")

  return `${encodedHeader}.${encodedPayload}.${signature}`
}
