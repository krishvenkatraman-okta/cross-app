export function createDemoIdToken(): string {
  // Create a properly formatted JWT token for demo purposes
  const header = {
    alg: "HS256",
    typ: "JWT",
  }

  const payload = {
    sub: "00up6GlznvCobuu31d7",
    email: "Arjun@atko.email",
    name: "Arjun",
    iss: "https://dev-01234567.okta.com/oauth2/default",
    aud: "0oa1234567890abcdef",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }

  // Base64url encode (simplified for demo)
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const signature = "demo-signature"

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function formatTodoResponse(todoData: any): string {
  if (!todoData || !todoData.todos || todoData.todos.length === 0) {
    return "You don't have any todos yet! Head over to Todo0 to create some tasks."
  }

  const incompleteTodos = todoData.todos.filter((todo: any) => !todo.completed)

  if (incompleteTodos.length === 0) {
    return "🎉 Congratulations! You've completed all your tasks! Great job staying productive."
  }

  let response = `📋 **Your Pending Tasks** (${incompleteTodos.length} remaining)\n\n`

  incompleteTodos.forEach((todo: any, index: number) => {
    response += `${index + 1}. ⏳ ${todo.text}\n`
  })

  const completedCount = todoData.todos.length - incompleteTodos.length
  response += `\n📊 **Summary:** ${completedCount} completed, ${incompleteTodos.length} pending\n\n`
  response += `✨ *Retrieved via secure OAuth Cross-App Access with ID-JAG tokens!*`

  return response
}

export function formatInventoryResponse(inventoryData: any, requestedWarehouse?: string): string {
  if (!inventoryData || !inventoryData.items || inventoryData.items.length === 0) {
    const warehouseName = getWarehouseName(requestedWarehouse || "texas")
    return `No inventory items found in ${warehouseName}! Head over to Atlas Beverages Inventory to add some products.`
  }

  const warehouse = inventoryData.warehouse || requestedWarehouse || "texas"
  const warehouseName = getWarehouseName(warehouse)
  const items = inventoryData.items

  // Group items by category
  const categories = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  let response = `📦 **${warehouseName} Inventory** (${items.length} products)\n\n`

  // Display items by category
  Object.keys(categories).forEach((category) => {
    response += `**${category}:**\n`
    categories[category].forEach((item: any) => {
      const stockStatus = item.quantity === 0 ? "🔴" : item.quantity < 10 ? "🟡" : "🟢"
      response += `  ${stockStatus} ${item.name} - ${item.quantity} units (SKU: ${item.sku})\n`
    })
    response += `\n`
  })

  // Calculate totals
  const totalItems = items.length
  const outOfStock = items.filter((item: any) => item.quantity === 0).length
  const lowStock = items.filter((item: any) => item.quantity > 0 && item.quantity < 10).length
  const inStock = items.filter((item: any) => item.quantity >= 10).length

  response += `📊 **Stock Summary:**\n`
  response += `  🟢 In Stock: ${inStock} products\n`
  response += `  🟡 Low Stock: ${lowStock} products\n`
  response += `  🔴 Out of Stock: ${outOfStock} products\n\n`

  response += `✨ *Retrieved via secure OAuth Cross-App Access with ID-JAG tokens!*`

  return response
}

function getWarehouseName(warehouse: string): string {
  const warehouseNames = {
    texas: "Texas Distribution Center (Dallas, TX)",
    california: "California Distribution Center (Los Angeles, CA)",
    nevada: "Nevada Distribution Center (Las Vegas, NV)",
  }
  return warehouseNames[warehouse as keyof typeof warehouseNames] || "Unknown Warehouse"
}
