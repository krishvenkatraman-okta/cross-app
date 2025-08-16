import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"

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
      console.log("[v0] Detected inventory query, using client-provided tokens")

      if (!crossAppTokens) {
        console.log("[v0] No cross-app tokens provided by client")
        return NextResponse.json({
          message:
            "I need to perform OAuth Cross-App Access to retrieve your inventory data. Please ensure you're properly authenticated and try again.",
          requiresAuth: true,
        })
      }

      console.log("[v0] Using client-provided cross-app tokens for inventory access")
      const tokenData = {
        id_jag_token: crossAppTokens.id_jag_token,
        inventory_access_token: crossAppTokens.inventory_access_token,
      }

      if (tokenData?.inventory_access_token) {
        console.log(
          "[v0] Fetching inventory with ID-JAG derived token:",
          tokenData.inventory_access_token.substring(0, 20) + "...",
        )

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
          console.log("[v0] Retrieved inventory data via OAuth Cross-App Access:", {
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
          console.error("[v0] Failed to fetch inventory with ID-JAG token:", inventoryResponse.status, errorText)
          return NextResponse.json({
            message:
              "I couldn't access the inventory data with the provided OAuth Cross-App Access tokens. Please try authenticating again.",
            error: "inventory_access_failed",
          })
        }
      } else {
        console.log("[v0] No valid ID-JAG derived tokens available for inventory access")
        return NextResponse.json({
          message:
            "OAuth Cross-App Access tokens are missing or invalid. Please authenticate to access inventory data.",
          requiresAuth: true,
        })
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

    return NextResponse.json({
      message:
        "I encountered an error while processing your request. For inventory queries, I need to use OAuth Cross-App Access to securely retrieve your data.",
      error: "processing_error",
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
