"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  warehouse: string
  sku: string
  createdAt: string
}

const WAREHOUSES = [
  { id: "texas", name: "Texas Distribution Center", location: "Dallas, TX" },
  { id: "california", name: "California Distribution Center", location: "Los Angeles, CA" },
  { id: "nevada", name: "Nevada Distribution Center", location: "Las Vegas, NV" },
]

export default function InventoryPage() {
  const { user, signIn, isLoading } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("texas")
  const [newItem, setNewItem] = useState({ name: "", category: "", quantity: 0, sku: "" })
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)

  useEffect(() => {
    if (user) {
      loadInventory()
    }
  }, [user, selectedWarehouse])

  const loadInventory = async () => {
    setIsLoadingInventory(true)
    try {
      const response = await fetch(`/api/inventory/items?warehouse=${selectedWarehouse}`)
      if (response.ok) {
        const data = await response.json()
        setInventory(data.items || [])
      }
    } catch (error) {
      console.error("Failed to load inventory:", error)
    } finally {
      setIsLoadingInventory(false)
    }
  }

  const addItem = async () => {
    if (!newItem.name.trim() || !newItem.category.trim() || !newItem.sku.trim()) return

    try {
      const response = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          warehouse: selectedWarehouse,
          name: newItem.name.trim(),
          category: newItem.category.trim(),
          sku: newItem.sku.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInventory((prev) => [...prev, data.item])
        setNewItem({ name: "", category: "", quantity: 0, sku: "" })
      }
    } catch (error) {
      console.error("Failed to add inventory item:", error)
    }
  }

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 0) return

    try {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
      }
    } catch (error) {
      console.error("Failed to update inventory:", error)
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/items/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setInventory((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete inventory item:", error)
    }
  }

  const clearAllInventory = async () => {
    if (!confirm("Are you sure you want to clear all inventory? This will reset the demo.")) {
      return
    }

    try {
      const response = await fetch(`/api/inventory/items?warehouse=${selectedWarehouse}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setInventory([])
      }
    } catch (error) {
      console.error("Failed to clear inventory:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Atlas Beverages Inventory</h1>
          <p className="text-gray-600 mb-8">Please sign in with Okta to access inventory management</p>
          <Button onClick={() => signIn("inventory")} className="w-full bg-red-600 hover:bg-red-700 text-white py-3">
            Sign in with Okta
          </Button>
        </div>
      </div>
    )
  }

  const selectedWarehouseInfo = WAREHOUSES.find((w) => w.id === selectedWarehouse)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto pt-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Atlas Beverages Inventory</h1>
              <p className="text-gray-600 mt-2">
                {selectedWarehouseInfo?.name} - {selectedWarehouseInfo?.location}
              </p>
            </div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              {WAREHOUSES.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
            <Input
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Product name"
              className="text-lg py-3 px-4 border-gray-200 rounded-lg"
            />
            <Input
              value={newItem.category}
              onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="Category"
              className="text-lg py-3 px-4 border-gray-200 rounded-lg"
            />
            <Input
              value={newItem.sku}
              onChange={(e) => setNewItem((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="SKU"
              className="text-lg py-3 px-4 border-gray-200 rounded-lg"
            />
            <Input
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 0 }))}
              placeholder="Quantity"
              className="text-lg py-3 px-4 border-gray-200 rounded-lg"
              min="0"
            />
            <Button onClick={addItem} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg">
              Add Item
            </Button>
          </div>

          {inventory.length > 0 && (
            <div className="mb-6 flex justify-end">
              <Button
                onClick={clearAllInventory}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
              >
                <span className="mr-2">↻</span>
                Clear All (Demo Reset)
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {isLoadingInventory ? (
              <div className="text-center py-8 text-gray-500">Loading inventory...</div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No inventory items yet. Add one above!</div>
            ) : (
              <>
                <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 rounded-lg font-semibold text-gray-700">
                  <div>Product</div>
                  <div>Category</div>
                  <div>SKU</div>
                  <div>Quantity</div>
                  <div>Actions</div>
                  <div></div>
                </div>
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-6 gap-4 p-4 rounded-lg border bg-gray-50 border-gray-200 items-center"
                  >
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-gray-600">{item.category}</div>
                    <div className="text-gray-600 font-mono text-sm">{item.sku}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 0}
                        className="w-8 h-8 p-0"
                      >
                        -
                      </Button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        item.quantity === 0
                          ? "bg-red-100 text-red-800"
                          : item.quantity < 10
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.quantity === 0 ? "Out of Stock" : item.quantity < 10 ? "Low Stock" : "In Stock"}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <span className="text-lg">🗑</span>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Signed in as {user.email} • {inventory.length} items in {selectedWarehouseInfo?.name}
          </div>
        </div>
      </div>
    </div>
  )
}
