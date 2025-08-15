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

    const aiAnalysis = await analyzeUserQuery(message)
    console.log("[v0] AI analysis result:", aiAnalysis)

    if (aiAnalysis.isInventoryQuery) {
      console.log("[v0] AI-detected inventory query, attempting cross-app access")

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

            const aiResponse = await generateIntelligentResponse(message, inventoryData, aiAnalysis)

            return NextResponse.json({
              message: aiResponse,
              tokens: tokenData,
            })
          } else {
            const errorText = await inventoryResponse.text()
            console.error("[v0] Failed to fetch inventory:", inventoryResponse.status, errorText)
          }
        } else {
          console.log("[v0] No cross-app token available, using demo data")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch inventory:", error)
      }
    }

    const aiResponse = await generateGeneralResponse(message, history)
    return NextResponse.json({ message: aiResponse })
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

async function analyzeUserQuery(message: string): Promise<{
  isInventoryQuery: boolean
  warehouse: string
  queryType: string
}> {
  try {
    const { text } = await generateText({
      model: "gpt-4o-mini",
      system: `You are an AI assistant that analyzes user queries for an Atlas Beverages inventory management system. 
      
      Analyze the user's message and respond with a JSON object containing:
      - isInventoryQuery: boolean (true if asking about inventory, stock, products, warehouses)
      - warehouse: string (texas, california, or nevada - default to texas if not specified)
      - queryType: string (summary, specific_product, stock_levels, or general)
      
      Warehouses: Texas (Dallas), California (Los Angeles), Nevada (Las Vegas)
      
      Examples:
      "What's in my Texas warehouse?" -> {"isInventoryQuery": true, "warehouse": "texas", "queryType": "summary"}
      "Show me Pepsi stock in California" -> {"isInventoryQuery": true, "warehouse": "california", "queryType": "specific_product"}
      "Hello" -> {"isInventoryQuery": false, "warehouse": "texas", "queryType": "general"}`,
      prompt: `Analyze this user message: "${message}"`,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("[v0] AI query analysis failed:", error)
    // Fallback to simple detection
    return {
      isInventoryQuery:
        message.toLowerCase().includes("inventory") ||
        message.toLowerCase().includes("stock") ||
        message.toLowerCase().includes("warehouse"),
      warehouse: extractWarehouse(message),
      queryType: "general",
    }
  }
}

async function generateIntelligentResponse(message: string, inventoryData: any, analysis: any): Promise<string> {
  try {
    const inventoryContext =
      inventoryData?.items
        ?.map((item: any) => `${item.name}: ${item.quantity} units (${item.category}, SKU: ${item.sku})`)
        .join("\n") || "No inventory data available"

    const { text } = await generateText({
      model: "gpt-4o-mini",
      system: `You are JARVIS, Atlas Beverages' AI inventory assistant. You have access to real-time warehouse data via secure OAuth cross-app access.

      Guidelines:
      - Be professional but friendly
      - Provide specific, actionable insights
      - Highlight stock issues (out of stock, low stock)
      - Use relevant emojis sparingly
      - Always mention that data was retrieved via secure OAuth Cross-App Access
      - Focus on the requested warehouse: ${analysis.warehouse}
      
      Warehouse locations:
      - Texas: Dallas Distribution Center
      - California: Los Angeles Distribution Center  
      - Nevada: Las Vegas Distribution Center`,
      prompt: `User asked: "${message}"
      
      Current inventory data for ${analysis.warehouse} warehouse:
      ${inventoryContext}
      
      Provide a helpful response about their inventory.`,
    })

    return text
  } catch (error) {
    console.error("[v0] AI response generation failed:", error)
    // Fallback to formatted response
    return formatInventoryResponse(inventoryData, analysis.warehouse)
  }
}

async function generateGeneralResponse(message: string, history: Message[] = []): Promise<string> {
  try {
    const conversationHistory = history.map((msg) => `${msg.role}: ${msg.content}`).join("\n")

    const { text } = await generateText({
      model: "gpt-4o-mini",
      system: `You are JARVIS, Atlas Beverages' AI inventory assistant. You help users manage warehouse inventory across Texas, California, and Nevada distribution centers.

      Capabilities:
      - Real-time inventory queries via secure OAuth Cross-App Access
      - Stock level monitoring and alerts
      - Warehouse-specific data retrieval
      - Product and SKU information
      
      Be helpful, professional, and guide users toward inventory-related tasks.`,
      prompt: `${conversationHistory ? `Previous conversation:\n${conversationHistory}\n\n` : ""}User: ${message}`,
    })

    return text
  } catch (error) {
    console.error("[v0] AI general response failed:", error)
    return "I'm here to help with your Atlas Beverages inventory! Ask me about warehouse stock levels, product quantities, or specific locations like Texas, California, or Nevada."
  }
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
      const tokenMatch = cookies.match(/okta-token=([^;]+)/)
      if (tokenMatch) {
        userIdToken = decodeURIComponent(tokenMatch[1])
        console.log("[v0] Found real user token:", userIdToken?.substring(0, 20) + "...")
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
