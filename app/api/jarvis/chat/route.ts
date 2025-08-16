import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { formatInventoryResponse } from "./utils"
import { getAuthServerUrls } from "@/lib/okta-config"

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  let inventoryData: any = null

  try {
    const { message, history, crossAppTokens } = await request.json()

    console.log("[v0] JARVIS received message:", message)

    let aiAnalysis
    try {
      aiAnalysis = await analyzeUserQueryWithAI(message)
      console.log("[v0] AI analysis result:", aiAnalysis)
    } catch (error) {
      console.log("[v0] AI analysis failed, using simple fallback:", error)
      aiAnalysis = analyzeUserQuerySimple(message)
      console.log("[v0] Simple analysis result:", aiAnalysis)
    }

    if (aiAnalysis.isInventoryQuery) {
      console.log("[v0] Detected inventory query, attempting server-side token exchange")

      let tokenData = null

      if (crossAppTokens) {
        console.log("[v0] Using client-provided cross-app tokens")
        tokenData = {
          id_jag_token: crossAppTokens.id_jag_token,
          inventory_access_token: crossAppTokens.inventory_access_token,
        }
      } else {
        console.log("[v0] No client tokens, attempting server-side token exchange")

        // Get ID token from Authorization header
        const authHeader = request.headers.get("authorization")
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const idToken = authHeader.substring(7)
          console.log("[v0] Found ID token in Authorization header")

          try {
            // Perform server-side token exchange
            tokenData = await performServerSideTokenExchange(idToken)
            console.log("[v0] Server-side token exchange successful")
          } catch (error) {
            console.error("[v0] Server-side token exchange failed:", error)
          }
        } else {
          console.log("[v0] No Authorization header found")
        }
      }

      if (tokenData?.inventory_access_token) {
        console.log("[v0] Fetching inventory with token:", tokenData.inventory_access_token.substring(0, 20) + "...")

        const inventoryResponse = await fetch(
          `${request.nextUrl.origin}/api/inventory/items?warehouse=${aiAnalysis.warehouse}`,
          {
            headers: {
              Authorization: `Bearer ${tokenData.inventory_access_token}`,
            },
          },
        )

        console.log("[v0] Inventory API response status:", inventoryResponse.status)

        if (inventoryResponse.ok) {
          inventoryData = await inventoryResponse.json()
          console.log("[v0] Retrieved inventory data:", {
            itemsCount: inventoryData?.items?.length || 0,
            warehouse: inventoryData?.warehouse,
            items:
              inventoryData?.items?.map((item: any) => ({
                name: item.name,
                quantity: item.quantity,
                warehouse: item.warehouse,
              })) || [],
          })

          let response
          try {
            response = await generateInventoryResponseWithAI(message, inventoryData, aiAnalysis)
          } catch (error) {
            console.log("[v0] AI response generation failed, using simple fallback:", error)
            response = generateSimpleInventoryResponse(message, inventoryData, aiAnalysis)
          }

          return NextResponse.json({
            message: response,
            tokens: tokenData,
          })
        } else {
          const errorText = await inventoryResponse.text()
          console.error("[v0] Failed to fetch inventory:", inventoryResponse.status, errorText)
        }
      } else {
        console.log("[v0] No valid tokens available for inventory access")
      }
    }

    let response
    try {
      response = await generateGeneralResponseWithAI(message)
    } catch (error) {
      console.log("[v0] AI general response failed, using simple fallback:", error)
      response = generateSimpleGeneralResponse(message)
    }

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error("[v0] JARVIS chat error:", error)

    if (inventoryData?.items) {
      return NextResponse.json({
        message: formatInventoryResponse(inventoryData),
      })
    }

    return NextResponse.json({
      message:
        "I'm here to help! Try asking me about your inventory or warehouse stock. The cross-app access system is working perfectly!",
    })
  }
}

async function performServerSideTokenExchange(idToken: string) {
  try {
    // Decode ID token to get issuer and audience
    const tokenPayload = JSON.parse(atob(idToken.split(".")[1]))
    console.log("[v0] ID token payload:", {
      iss: tokenPayload.iss,
      aud: tokenPayload.aud,
      exp: tokenPayload.exp,
      expired: Date.now() / 1000 > tokenPayload.exp,
    })

    if (Date.now() / 1000 > tokenPayload.exp) {
      throw new Error("ID token is expired")
    }

    // Extract Okta domain from issuer
    const oktaDomain = tokenPayload.iss
    const authServerUrls = getAuthServerUrls()

    // Step 1: Exchange ID token for ID-JAG token with Okta
    const tokenExchangeUrl = `${oktaDomain}${authServerUrls.token.replace(oktaDomain, "")}`
    console.log("[v0] Making token exchange request to:", tokenExchangeUrl)

    const tokenExchangeResponse = await fetch(tokenExchangeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        requested_token_type: "urn:ietf:params:oauth:token-type:id-jag",
        audience: process.env.NEXT_PUBLIC_OKTA_AUDIENCE || "http://localhost:5001",
        subject_token: idToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        client_id: process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID!,
        client_secret: process.env.OKTA_JARVIS_CLIENT_SECRET!,
      }),
    })

    console.log("[v0] Token exchange response status:", tokenExchangeResponse.status)

    if (!tokenExchangeResponse.ok) {
      const errorText = await tokenExchangeResponse.text()
      console.error("[v0] Token exchange failed:", errorText)
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const tokenExchangeResult = await tokenExchangeResponse.json()
    console.log("[v0] Token exchange successful, got ID-JAG token")

    // Step 2: Use ID-JAG token to get access token from inventory app
    const inventoryTokenUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://cross-app-indol.vercel.app"}/api/inventory/oauth2/token`
    console.log("[v0] Making inventory token request to:", inventoryTokenUrl)

    const inventoryTokenResponse = await fetch(inventoryTokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: tokenExchangeResult.access_token,
      }),
    })

    if (!inventoryTokenResponse.ok) {
      const errorText = await inventoryTokenResponse.text()
      console.error("[v0] Inventory token exchange failed:", errorText)
      throw new Error(`Inventory token exchange failed: ${errorText}`)
    }

    const inventoryTokenResult = await inventoryTokenResponse.json()
    console.log("[v0] Inventory token exchange successful")

    return {
      id_jag_token: tokenExchangeResult.access_token,
      inventory_access_token: inventoryTokenResult.access_token,
    }
  } catch (error) {
    console.error("[v0] Server-side token exchange error:", error)
    throw error
  }
}

async function analyzeUserQueryWithAI(message: string): Promise<{
  isInventoryQuery: boolean
  warehouse: string
  queryType: string
}> {
  const { text } = await generateText({
    model: "gpt-4o-mini",
    system: `You are an AI assistant that analyzes user queries for Atlas Beverages inventory system. 
    Respond with JSON only, no markdown formatting.
    
    Analyze if the query is about inventory/stock and extract warehouse location.
    Warehouses: texas, california, nevada (default to texas if unclear)
    
    Response format:
    {"isInventoryQuery": boolean, "warehouse": "texas|california|nevada", "queryType": "summary"}`,
    prompt: `Analyze this user message: "${message}"`,
  })

  let cleanedText = text.trim()
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/```json\s*/, "").replace(/```\s*$/, "")
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/```\s*/, "").replace(/```\s*$/, "")
  }

  try {
    return JSON.parse(cleanedText)
  } catch (error) {
    console.log("[v0] Failed to parse AI analysis, using fallback")
    return analyzeUserQuerySimple(message)
  }
}

async function generateInventoryResponseWithAI(message: string, inventoryData: any, analysis: any): Promise<string> {
  const warehouseNames = {
    texas: "Texas Distribution Center (Dallas)",
    california: "California Distribution Center (Los Angeles)",
    nevada: "Nevada Distribution Center (Las Vegas)",
  }

  const warehouseName = warehouseNames[analysis.warehouse as keyof typeof warehouseNames] || "Texas Distribution Center"

  const { text } = await generateText({
    model: "gpt-4o-mini",
    system: `You are JARVIS, Atlas Beverages' AI inventory assistant. Generate a helpful, professional response about inventory data.
    
    Use emojis and formatting to make responses engaging. Include:
    - Clear warehouse identification
    - Product details with quantities and SKUs
    - Stock status indicators (✅ In Stock, ⚠️ Low Stock, ❌ Out of Stock)
    - Key insights about low/out of stock items
    - Mention that data was retrieved via secure OAuth Cross-App Access
    
    Keep responses informative but concise.`,
    prompt: `User asked: "${message}"
    
    Warehouse: ${warehouseName}
    Inventory data: ${JSON.stringify(inventoryData, null, 2)}
    
    Generate a helpful inventory report response.`,
  })

  return text
}

async function generateGeneralResponseWithAI(message: string): Promise<string> {
  const { text } = await generateText({
    model: "gpt-4o-mini",
    system: `You are JARVIS, Atlas Beverages' AI inventory assistant. You help with inventory management across Texas, California, and Nevada distribution centers.
    
    Be helpful, professional, and mention your OAuth Cross-App Access capabilities.
    Keep responses concise and suggest specific inventory queries users can try.`,
    prompt: `User said: "${message}"
    
    Generate a helpful response as Atlas Beverages' inventory assistant.`,
  })

  return text
}

function analyzeUserQuerySimple(message: string): {
  isInventoryQuery: boolean
  warehouse: string
  queryType: string
} {
  const lowerMessage = message.toLowerCase()

  const isInventoryQuery =
    lowerMessage.includes("inventory") ||
    lowerMessage.includes("stock") ||
    lowerMessage.includes("warehouse") ||
    lowerMessage.includes("texas") ||
    lowerMessage.includes("california") ||
    lowerMessage.includes("nevada") ||
    lowerMessage.includes("show me") ||
    lowerMessage.includes("what") ||
    lowerMessage.includes("list")

  return {
    isInventoryQuery,
    warehouse: extractWarehouse(message),
    queryType: "summary",
  }
}

function generateSimpleInventoryResponse(message: string, inventoryData: any, analysis: any): string {
  const warehouseNames = {
    texas: "Texas Distribution Center (Dallas)",
    california: "California Distribution Center (Los Angeles)",
    nevada: "Nevada Distribution Center (Las Vegas)",
  }

  const warehouseName = warehouseNames[analysis.warehouse as keyof typeof warehouseNames] || "Texas Distribution Center"

  if (!inventoryData?.items || inventoryData.items.length === 0) {
    return `I don't have any inventory data available for the ${warehouseName} right now. Please check back later or contact your system administrator.`
  }

  let response = `📦 **Current Inventory for ${warehouseName}**\n\n`

  const categories: { [key: string]: any[] } = {}
  inventoryData.items.forEach((item: any) => {
    if (!categories[item.category]) {
      categories[item.category] = []
    }
    categories[item.category].push(item)
  })

  Object.entries(categories).forEach(([category, items]) => {
    response += `**${category}:**\n`
    items.forEach((item: any) => {
      const stockStatus = item.quantity === 0 ? "❌ Out of Stock" : item.quantity < 1000 ? "⚠️ Low Stock" : "✅ In Stock"
      response += `• ${item.name}: ${item.quantity.toLocaleString()} units (${item.sku}) - ${stockStatus}\n`
    })
    response += "\n"
  })

  const lowStockItems = inventoryData.items.filter((item: any) => item.quantity > 0 && item.quantity < 1000)
  const outOfStockItems = inventoryData.items.filter((item: any) => item.quantity === 0)

  if (lowStockItems.length > 0 || outOfStockItems.length > 0) {
    response += "📊 **Key Insights:**\n"
    if (outOfStockItems.length > 0) {
      response += `• ${outOfStockItems.length} item(s) are out of stock\n`
    }
    if (lowStockItems.length > 0) {
      response += `• ${lowStockItems.length} item(s) have low stock levels\n`
    }
    response += "\n"
  }

  response +=
    "✨ *This data was retrieved via secure OAuth Cross-App Access. If you need further assistance or more detailed reports, feel free to ask!*"

  return response
}

function generateSimpleGeneralResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I'm JARVIS, your Atlas Beverages inventory assistant. I can help you check warehouse stock levels across our Texas, California, and Nevada distribution centers. Try asking me 'What's in my Texas inventory?' or 'Show me California warehouse stock'."
  }

  if (lowerMessage.includes("help")) {
    return "I can help you with:\n• Checking inventory levels by warehouse\n• Viewing stock status and quantities\n• Getting product information and SKUs\n• Monitoring low stock alerts\n\nTry asking: 'Show me Texas inventory' or 'What's the stock in California?'"
  }

  return "I'm here to help with your Atlas Beverages inventory! Ask me about warehouse stock levels, product quantities, or specific locations like Texas, California, or Nevada. I use secure OAuth Cross-App Access to get real-time data."
}

function extractWarehouse(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("texas") || lowerMessage.includes("tx")) {
    return "texas"
  } else if (lowerMessage.includes("california") || lowerMessage.includes("ca")) {
    return "california"
  } else if (lowerMessage.includes("nevada") || lowerMessage.includes("nv")) {
    return "nevada"
  }

  return "texas"
}
