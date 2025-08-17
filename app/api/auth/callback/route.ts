import { type NextRequest, NextResponse } from "next/server"
import { getAuthServerUrls } from "@/lib/okta-config"

export async function POST(request: NextRequest) {
  console.log("[v0] === CALLBACK API START ===")

  try {
    const { code, state, codeVerifier } = await request.json()

    console.log("[v0] Callback received:", {
      code: code?.substring(0, 10) + "...",
      state,
      hasCodeVerifier: !!codeVerifier,
    })

    const requiredEnvVars = ["NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID", "NEXT_PUBLIC_OKTA_AUTH_SERVER"]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`[v0] Missing required environment variable: ${envVar}`)
        throw new Error(`Server configuration error: Missing ${envVar}`)
      }
    }

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

    if (!clientId) {
      console.error("[v0] Missing client ID for state:", state)
      throw new Error(`Missing client ID for state: ${state}`)
    }

    const usePKCE = !!codeVerifier
    console.log("[v0] Authentication method:", usePKCE ? "PKCE" : "Client Secret")

    const host = request.headers.get("host")
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/callback`
      : `${protocol}://${host}/callback`

    const authServerUrls = getAuthServerUrls()
    const tokenEndpoint = authServerUrls.token
    const userinfoEndpoint = authServerUrls.userinfo

    if (!tokenEndpoint || !userinfoEndpoint) {
      console.error("[v0] Invalid auth server URLs:", { tokenEndpoint, userinfoEndpoint })
      throw new Error("Invalid authorization server configuration")
    }

    console.log("[v0] Token exchange details:", {
      issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER,
      tokenEndpoint,
      userinfoEndpoint,
      redirectUri,
      clientId,
      authMethod: usePKCE ? "PKCE" : "Client Secret",
      codeVerifierLength: codeVerifier?.length,
      host,
      protocol,
    })

    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
    })

    if (usePKCE) {
      tokenBody.append("code_verifier", codeVerifier)
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    }

    if (!usePKCE) {
      const clientSecret = isJarvis
        ? process.env.OKTA_JARVIS_CLIENT_SECRET
        : isAgent0
          ? process.env.OKTA_AGENT0_CLIENT_SECRET
          : isInventory
            ? process.env.OKTA_INVENTORY_CLIENT_SECRET
            : process.env.OKTA_TODO_CLIENT_SECRET

      if (!clientSecret) {
        console.error("[v0] Missing client secret for non-PKCE authentication")
        throw new Error("Client secret required for non-PKCE authentication")
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
      headers.Authorization = `Basic ${credentials}`
    }

    console.log("[v0] Token request body:", tokenBody.toString())
    console.log("[v0] Making token exchange request to:", tokenEndpoint)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error("[v0] Token exchange request timed out after 15 seconds")
      controller.abort()
    }, 15000)

    try {
      const tokenResponse = await fetch(tokenEndpoint, {
        method: "POST",
        headers,
        body: tokenBody,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log("[v0] Token response status:", tokenResponse.status, tokenResponse.statusText)

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error("[v0] Token exchange failed:", {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText,
          headers: Object.fromEntries(tokenResponse.headers.entries()),
          requestDetails: {
            tokenEndpoint,
            redirectUri,
            clientId,
            grantType: "authorization_code",
            authMethod: usePKCE ? "PKCE" : "Client Secret",
          },
        })
        throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`)
      }

      const tokens = await tokenResponse.json()
      console.log("[v0] Token exchange successful:", {
        hasAccessToken: !!tokens.access_token,
        hasIdToken: !!tokens.id_token,
        tokenType: tokens.token_type,
        accessTokenLength: tokens.access_token?.length,
        idTokenLength: tokens.id_token?.length,
        authMethod: usePKCE ? "PKCE" : "Client Secret",
      })

      const userinfoController = new AbortController()
      const userinfoTimeoutId = setTimeout(() => {
        console.error("[v0] Userinfo request timed out after 10 seconds")
        userinfoController.abort()
      }, 10000)

      try {
        console.log("[v0] Making userinfo request to:", userinfoEndpoint)
        const userResponse = await fetch(userinfoEndpoint, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
          signal: userinfoController.signal,
        })

        clearTimeout(userinfoTimeoutId)

        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error("[v0] User info fetch failed:", {
            status: userResponse.status,
            error: errorText,
            userinfoEndpoint,
            accessTokenLength: tokens.access_token?.length,
          })
          throw new Error(`User info fetch failed: ${userResponse.status} ${errorText}`)
        }

        const userInfo = await userResponse.json()
        console.log("[v0] User info retrieved:", {
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          hasGroups: !!userInfo.groups,
        })

        const user = {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          groups: userInfo.groups || [],
        }

        console.log("[v0] === CALLBACK API SUCCESS ===")
        return NextResponse.json({ user, tokens })
      } catch (userinfoError) {
        clearTimeout(userinfoTimeoutId)
        if (userinfoError.name === "AbortError") {
          throw new Error("Userinfo request timed out")
        }
        throw userinfoError
      }
    } catch (tokenError) {
      clearTimeout(timeoutId)
      if (tokenError.name === "AbortError") {
        throw new Error("Token exchange request timed out")
      }
      throw tokenError
    }
  } catch (error) {
    console.error("[v0] === CALLBACK API ERROR ===")
    console.error("[v0] Auth callback error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    )
  }
}
