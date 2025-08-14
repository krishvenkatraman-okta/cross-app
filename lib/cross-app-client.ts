"use client"

// Cross-app API client for secure data sharing
class CrossAppClient {
  private baseUrl = "/api/cross-app"
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Network error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Todo API methods
  async getTodos(filters?: { userId?: string; status?: string }) {
    const params = new URLSearchParams()
    if (filters?.userId) params.append("userId", filters.userId)
    if (filters?.status) params.append("status", filters.status)

    const query = params.toString()
    return this.request(`/todos${query ? `?${query}` : ""}`)
  }

  async createTodo(todo: { title: string; description?: string; priority?: string; dueDate?: string }) {
    return this.request("/todos", {
      method: "POST",
      body: JSON.stringify(todo),
    })
  }

  // User API methods
  async getUsers(filters?: { status?: string; group?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.group) params.append("group", filters.group)

    const query = params.toString()
    return this.request(`/users${query ? `?${query}` : ""}`)
  }

  async updateUser(userId: string, updates: { status?: string; groups?: string[] }) {
    return this.request("/users", {
      method: "PUT",
      body: JSON.stringify({ userId, ...updates }),
    })
  }

  // Permission checking
  async checkPermission(permission: string) {
    try {
      // Make a test request to see if we have permission
      if (permission.startsWith("todo:")) {
        await this.getTodos()
        return true
      } else if (permission.startsWith("users:")) {
        await this.getUsers()
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }
}

export const crossAppClient = new CrossAppClient()

// Mock token for demo purposes
// In a real app, this would come from Okta
crossAppClient.setToken("demo-token-123")
