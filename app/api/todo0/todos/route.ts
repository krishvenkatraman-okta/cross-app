import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
const todos: Array<{
  id: string
  text: string
  completed: boolean
  createdAt: string
  userId: string
}> = []

function initializeTodos(userId: string) {
  if (todos.length === 0) {
    todos.push(
      {
        id: "1",
        text: "Analyse current week expenses",
        completed: false,
        createdAt: new Date().toISOString(),
        userId: userId,
      },
      {
        id: "2",
        text: "Water indoor plants",
        completed: false,
        createdAt: new Date().toISOString(),
        userId: userId,
      },
      {
        id: "3",
        text: "Organize wardrobe",
        completed: false,
        createdAt: new Date().toISOString(),
        userId: userId,
      },
      {
        id: "4",
        text: "Deep clean kitchen",
        completed: false,
        createdAt: new Date().toISOString(),
        userId: userId,
      },
    )
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

    const userTodos = todos.filter((todo) => todo.userId === userId)

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

    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      userId,
    }

    todos.push(newTodo)

    return NextResponse.json({ todo: newTodo })
  } catch (error) {
    console.error("[v0] Failed to create todo:", error)
    return NextResponse.json({ error: "Failed to create todo" }, { status: 500 })
  }
}
