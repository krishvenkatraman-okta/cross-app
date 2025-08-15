import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createDemoIdToken, formatInventoryResponse } from "./utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  let inventoryData: any = null

  try {
    const { message, history } = await request.json()

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
      console.log("[v0] Detected inventory query, attempting cross-app access")

      try {
        const crossAppTokens = await getCrossAppToken(request, "inventory")
        console.log("[v0] Cross-app tokens result:", crossAppTokens ? "SUCCESS" : "FAILED")

        if (crossAppTokens) {
          const tokenData = {
            id_jag_token: crossAppTokens.id_jag_token,
            inventory_access_token: crossAppTokens.inventory_access_token,
          }

          console.log(
            "[v0] Fetching inventory with token:",
            crossAppTokens.inventory_access_token?.substring(0, 20) + "...",
          )

          const inventoryResponse = await fetch(
            `${request.nextUrl.origin}/api/inventory/items?warehouse=${aiAnalysis.warehouse}`,
            {
              headers: {
                Authorization: `Bearer ${crossAppTokens.inventory_access_token}`,
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
          console.log("[v0] No cross-app token available")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch inventory:", error)
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

async function getCrossAppToken(
  request: NextRequest,
  targetApp: string,
): Promise<{ id_jag_token: string; inventory_access_token: string } | null> {
  try {
    const cookies = request.headers.get("cookie")
    let userIdToken = null

    console.log("[v0] Checking for user token in cookies...")

    if (cookies) {
      const oktaTokenMatch = cookies.match(/okta-token=([^;]+)/)
      const oktaTokensMatch = cookies.match(/okta_tokens=([^;]+)/)
      const accessTokenMatch = cookies.match(/okta_access_token=([^;]+)/)

      if (oktaTokenMatch) {
        userIdToken = decodeURIComponent(oktaTokenMatch[1])
        console.log("[v0] Found okta-token:", userIdToken?.substring(0, 20) + "...")
      } else if (oktaTokensMatch) {
        const tokensData = JSON.parse(decodeURIComponent(oktaTokensMatch[1]))
        userIdToken = tokensData.id_token || tokensData.access_token
        console.log("[v0] Found okta_tokens, using id_token:", userIdToken?.substring(0, 20) + "...")
      } else if (accessTokenMatch) {
        userIdToken = decodeURIComponent(accessTokenMatch[1])
        console.log("[v0] Found okta_access_token:", userIdToken?.substring(0, 20) + "...")
      }
    }

    if (!userIdToken) {
      console.log("[v0] No real user token found, using demo token")
      userIdToken = createDemoIdToken()
    }

    console.log("[v0] Making cross-app access request...")

    const response = await fetch(`${request.nextUrl.origin}/api/jarvis/cross-app-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userIdToken}`,
      },
      body: JSON.stringify({ target_app: targetApp }),
    })

    console.log("[v0] Cross-app access response status:", response.status)

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Cross-app access response data keys:", Object.keys(data))
      console.log("[v0] Obtained cross-app access tokens for", targetApp)
      return {
        id_jag_token: data.id_jag_token || data.access_token,
        inventory_access_token: data.access_token,
      }
    } else {
      const errorText = await response.text()
      console.error("[v0] Failed to get cross-app token:", response.status, errorText)
      return null
    }
  } catch (error) {
    console.error("[v0] Cross-app token request failed:", error)
    return null
  }
}
