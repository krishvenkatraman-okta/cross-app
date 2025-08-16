import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { target_app, action } = body

    if (action === "token-exchange") {
      console.log("[v0] Client-side token exchange request")

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

      const audienceUrl = process.env.NEXT_PUBLIC_OKTA_AUDIENCE || "http://localhost:5001"

      const clientId = process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
      const clientSecret = process.env.OKTA_JARVIS_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        return NextResponse.json({ error: "Missing JARVIS client credentials configuration" }, { status: 500 })
      }

      console.log("[v0] Making ID-JAG token exchange request to Okta:", dynamicTokenEndpoint)
      console.log("[v0] Using client ID:", clientId)
      console.log("[v0] Using audience:", audienceUrl)

      const requestBody = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
        subject_token: idToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        audience: audienceUrl,
        client_id: clientId,
        client_secret: clientSecret,
      })

      const headers: Record<string, string> = {
        "Content-Type": "application/x-www-form-urlencoded",
      }

      console.log("[v0] Making token exchange request to match working curl format")

      const idJagResponse = await fetch(dynamicTokenEndpoint, {
        method: "POST",
        headers,
        body: requestBody,
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
      console.log("[v0] ID-JAG token obtained from Okta:", {
        issued_token_type: idJagToken.issued_token_type,
        token_type: idJagToken.token_type,
        expires_in: idJagToken.expires_in,
      })

      return NextResponse.json({
        id_jag_token: idJagToken.access_token,
        inventory_access_token: idJagToken.access_token,
        token_type: idJagToken.token_type,
        expires_in: idJagToken.expires_in,
      })
    }

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

    const audienceUrl = process.env.NEXT_PUBLIC_OKTA_AUDIENCE || "http://localhost:5001"

    const clientId = process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID
    const clientSecret = process.env.OKTA_JARVIS_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing JARVIS client credentials configuration" }, { status: 500 })
    }

    console.log("[v0] Making ID-JAG token exchange request to Okta:", dynamicTokenEndpoint)
    console.log("[v0] Using client ID:", clientId)
    console.log("[v0] Using audience:", audienceUrl)
    console.log("[v0] Token exchange parameters:", {
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
      audience: audienceUrl,
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      subject_token_length: idToken.length,
      client_id: clientId,
      client_secret: "***", // Don't log the actual secret
    })

    const requestBody = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
      subject_token: idToken,
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      audience: audienceUrl,
      client_id: clientId,
      client_secret: clientSecret,
    })

    console.log("[v0] Request body parameters:", Array.from(requestBody.keys()))
    console.log("[v0] Subject token is present in request:", requestBody.has("subject_token"))

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    }

    console.log("[v0] Making simple request to match working curl format")

    const idJagResponse = await fetch(dynamicTokenEndpoint, {
      method: "POST",
      headers,
      body: requestBody,
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
    console.log("[v0] ID-JAG token obtained from Okta:", {
      issued_token_type: idJagToken.issued_token_type,
      token_type: idJagToken.token_type,
      expires_in: idJagToken.expires_in,
    })

    const tokenEndpoint =
      target_app === "inventory"
        ? `${request.nextUrl.origin}/api/inventory/oauth2/token`
        : `${request.nextUrl.origin}/api/${target_app}/oauth2/token`

    const clientCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

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
