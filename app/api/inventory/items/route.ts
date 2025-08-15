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
  // Create session key based on user ID and current hour for demo reset
  const currentHour = new Date().getHours()
  const currentDate = new Date().toDateString()
  return `${userId}-${currentDate}-${currentHour}`
}

function getPreloadedInventory(warehouse: string): Omit<InventoryItem, "id" | "createdAt" | "userId">[] {
  const inventoryData = {
    texas: [
      { name: "Pepsi Cola 12oz Cans", category: "Beverages", quantity: 2400, warehouse: "texas", sku: "PEP-12OZ-001" },
      {
        name: "Mountain Dew 20oz Bottles",
        category: "Beverages",
        quantity: 1800,
        warehouse: "texas",
        sku: "MTD-20OZ-002",
      },
      { name: "Lay's Classic Chips", category: "Snacks", quantity: 3200, warehouse: "texas", sku: "LAY-CLS-003" },
      { name: "Doritos Nacho Cheese", category: "Snacks", quantity: 2100, warehouse: "texas", sku: "DOR-NCH-004" },
      {
        name: "Gatorade Fruit Punch",
        category: "Sports Drinks",
        quantity: 1500,
        warehouse: "texas",
        sku: "GAT-FRP-005",
      },
      { name: "Atlas Cola 12oz Cans", category: "Beverages", quantity: 2400, warehouse: "texas", sku: "ATL-12OZ-001" },
    ],
    california: [
      {
        name: "Pepsi Zero Sugar 12oz",
        category: "Beverages",
        quantity: 3100,
        warehouse: "california",
        sku: "PEP-ZER-006",
      },
      { name: "7UP Lemon Lime", category: "Beverages", quantity: 1900, warehouse: "california", sku: "7UP-LEM-007" },
      { name: "Cheetos Crunchy", category: "Snacks", quantity: 2800, warehouse: "california", sku: "CHE-CRU-008" },
      { name: "Ruffles Original", category: "Snacks", quantity: 2200, warehouse: "california", sku: "RUF-ORI-009" },
      {
        name: "Tropicana Orange Juice",
        category: "Juices",
        quantity: 1200,
        warehouse: "california",
        sku: "TRO-ORA-010",
      },
      { name: "Aquafina Water 16.9oz", category: "Water", quantity: 4500, warehouse: "california", sku: "AQU-WAT-011" },
      {
        name: "Atlas Zero Sugar 12oz",
        category: "Beverages",
        quantity: 3100,
        warehouse: "california",
        sku: "ATL-ZER-006",
      },
    ],
    nevada: [
      { name: "Diet Pepsi 12oz Cans", category: "Beverages", quantity: 2600, warehouse: "nevada", sku: "PEP-DIE-012" },
      { name: "Sierra Mist Natural", category: "Beverages", quantity: 1400, warehouse: "nevada", sku: "SIE-NAT-013" },
      { name: "Fritos Corn Chips", category: "Snacks", quantity: 1800, warehouse: "nevada", sku: "FRI-COR-014" },
      { name: "Tostitos Scoops", category: "Snacks", quantity: 2400, warehouse: "nevada", sku: "TOS-SCO-015" },
      {
        name: "Gatorade Lemon Lime",
        category: "Sports Drinks",
        quantity: 1700,
        warehouse: "nevada",
        sku: "GAT-LEM-016",
      },
      { name: "Lipton Iced Tea", category: "Beverages", quantity: 1300, warehouse: "nevada", sku: "LIP-ICE-017" },
      {
        name: "Diet Atlas Cola 12oz Cans",
        category: "Beverages",
        quantity: 2600,
        warehouse: "nevada",
        sku: "ATL-DIE-012",
      },
    ],
  }

  return inventoryData[warehouse as keyof typeof inventoryData] || []
}

function initializeInventory(userId: string) {
  const sessionKey = getSessionKey(userId)

  if (!inventorySessions.has(sessionKey)) {
    const allInventory: InventoryItem[] = []

    for (const warehouse of ["texas", "california", "nevada"]) {
      const preloadedItems = getPreloadedInventory(warehouse)
      for (const item of preloadedItems) {
        allInventory.push({
          ...item,
          id: `${warehouse}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          userId,
        })
      }
    }

    inventorySessions.set(sessionKey, allInventory)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get("warehouse") || "texas"

    const authHeader = request.headers.get("authorization")
    let userId = "00up6GlznvCobuu31d7" // Use real Okta user ID as default

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      const validationResponse = await fetch(`${request.nextUrl.origin}/api/inventory/validate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (validationResponse.ok) {
        const validation = await validationResponse.json()
        if (validation.valid) {
          userId = validation.user_id
          console.log("[v0] Inventory access granted via token:", {
            userId: validation.user_id,
            sourceApp: validation.source_app,
            warehouse,
          })
        }
      }
    }

    initializeInventory(userId)
    const sessionKey = getSessionKey(userId)
    const allInventory = inventorySessions.get(sessionKey) || []

    const warehouseInventory = allInventory.filter((item) => item.warehouse === warehouse)

    return NextResponse.json({
      items: warehouseInventory,
      count: warehouseInventory.length,
      warehouse,
    })
  } catch (error) {
    console.error("[v0] Failed to get inventory:", error)
    return NextResponse.json({ error: "Failed to get inventory" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, category, quantity, warehouse, sku } = await request.json()

    if (!name || !category || !sku || !warehouse) {
      return NextResponse.json({ error: "Name, category, SKU, and warehouse are required" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    let userId = "00up6GlznvCobuu31d7" // Default to real Okta user ID

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(token.split(".")[1]))
        userId = payload.sub || payload.user_id || userId
      } catch (error) {
        console.log("[v0] Could not decode token, using default user ID")
      }
    }

    initializeInventory(userId)
    const sessionKey = getSessionKey(userId)
    const inventory = inventorySessions.get(sessionKey) || []

    const newItem: InventoryItem = {
      id: `${warehouse}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      category: category.trim(),
      quantity: Math.max(0, Number.parseInt(quantity) || 0),
      warehouse,
      sku: sku.trim(),
      createdAt: new Date().toISOString(),
      userId,
    }

    inventory.push(newItem)
    inventorySessions.set(sessionKey, inventory)

    return NextResponse.json({ item: newItem })
  } catch (error) {
    console.error("[v0] Failed to create inventory item:", error)
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get("warehouse")

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
    const allInventory = inventorySessions.get(sessionKey) || []

    if (warehouse) {
      const otherWarehouseInventory = allInventory.filter((item) => item.warehouse !== warehouse)
      const preloadedItems = getPreloadedInventory(warehouse)

      for (const item of preloadedItems) {
        otherWarehouseInventory.push({
          ...item,
          id: `${warehouse}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          userId,
        })
      }

      inventorySessions.set(sessionKey, otherWarehouseInventory)
      console.log("[v0] Reset inventory for warehouse:", { userId, warehouse })
    } else {
      // Clear all inventory and reinitialize
      inventorySessions.delete(sessionKey)
      initializeInventory(userId)
      console.log("[v0] Reset all inventory for demo:", { userId })
    }

    return NextResponse.json({ message: "Inventory reset successfully" })
  } catch (error) {
    console.error("[v0] Failed to reset inventory:", error)
    return NextResponse.json({ error: "Failed to reset inventory" }, { status: 500 })
  }
}
