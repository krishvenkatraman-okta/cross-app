import { type NextRequest, NextResponse } from "next/server"

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  warehouse: string
  sku: string
  createdAt: string
  userId: string
}

const inventorySessions = new Map<string, InventoryItem[]>()

function getSessionKey(userId: string): string {
  const currentHour = new Date().getHours()
  const currentDate = new Date().toDateString()
  return `${userId}-${currentDate}-${currentHour}`
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { quantity } = await request.json()
    const itemId = params.id

    const authHeader = request.headers.get("authorization")
    let userId = "00up6GlznvCobuu31d7" // Default to real Okta user ID

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.sub || payload.user_id || userId
      } catch (error) {
        console.log("[v0] Could not decode token, using default user ID")
      }
    }

    const sessionKey = getSessionKey(userId)
    const inventory = inventorySessions.get(sessionKey) || []

    const itemIndex = inventory.findIndex((item) => item.id === itemId && item.userId === userId)

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    inventory[itemIndex] = {
      ...inventory[itemIndex],
      quantity: Math.max(0, Number.parseInt(quantity) || 0),
    }

    inventorySessions.set(sessionKey, inventory)

    return NextResponse.json({ item: inventory[itemIndex] })
  } catch (error) {
    console.error("[v0] Failed to update inventory item:", error)
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const itemId = params.id

    const authHeader = request.headers.get("authorization")
    let userId = "00up6GlznvCobuu31d7" // Default to real Okta user ID

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.sub || payload.user_id || userId
      } catch (error) {
        console.log("[v0] Could not decode token, using default user ID")
      }
    }

    const sessionKey = getSessionKey(userId)
    const inventory = inventorySessions.get(sessionKey) || []

    const filteredInventory = inventory.filter((item) => !(item.id === itemId && item.userId === userId))

    if (filteredInventory.length === inventory.length) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 })
    }

    inventorySessions.set(sessionKey, filteredInventory)

    return NextResponse.json({ message: "Inventory item deleted successfully" })
  } catch (error) {
    console.error("[v0] Failed to delete inventory item:", error)
    return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 })
  }
}
