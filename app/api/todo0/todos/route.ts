import { type NextRequest, NextResponse } from "next/server"

const todoSessions = new Map<
  string,
  Array<{
    id: string
    text: string
    completed: boolean
    createdAt: string
    userId: string
  }>
>()

function getSessionKey(userId: string): string {
  // Create session key based on user ID and current hour for demo reset
  const currentHour = new Date().getHours()
  const currentDate = new Date().toDateString()
  return `${userId}-${currentDate}-${currentHour}`
}

function initializeTodos(userId: string) {
  const sessionKey = getSessionKey(userId)

  if (!todoSessions.has(sessionKey)) {
    // Start with empty todos for each new session
    todoSessions.set(sessionKey, [])
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    let userId = "00up6GlznvCobuu31d7" // Use real Okta user ID as default

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7)

      // Validate the token (could be from Todo0 or cross-app from Agent0)
      const validationResponse = await fetch(`${request.nextUrl.origin}/api/todo0/validate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      if (validationResponse.ok) {
        const validation = await validationResponse.json()
        if (validation.valid) {
          userId = validation.user_id
          console.log("[v0] Todo access granted via token:", {
            userId: validation.user_id,
            sourceApp: validation.source_app,
          })
        }
      }
    }

    initializeTodos(userId)
    const sessionKey = getSessionKey(userId)
    const userTodos = todoSessions.get(sessionKey) || []

    return NextResponse.json({
      todos: userTodos,
      count: userTodos.length,
    })
  } catch (error) {
    console.error("[v0] Failed to get todos:", error)
    return NextResponse.json({ error: "Failed to get todos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Todo text is required" }, { status: 400 })
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

    initializeTodos(userId)
    const sessionKey = getSessionKey(userId)
    const todos = todoSessions.get(sessionKey) || []

    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      userId,
    }

    todos.push(newTodo)
    todoSessions.set(sessionKey, todos)

    return NextResponse.json({ todo: newTodo })
  } catch (error) {
    console.error("[v0] Failed to create todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    todoSessions.set(sessionKey, [])

    console.log("[v0] Cleared all todos for demo reset:", { userId, sessionKey })

    return NextResponse.json({ message: "All todos cleared for demo reset" })
  } catch (error) {
    console.error("[v0] Failed to clear todos:", error)
    return NextResponse.json({ error: "Failed to clear todos" }, { status: 500 })
  }
}
