import { type NextRequest, NextResponse } from "next/server"

const todos: Array<{
  id: string
  text: string
  completed: boolean
  createdAt: string
  userId: string
}> = []

if (todos.length === 0) {
  const realUserId = "00up6GlznvCobuu31d7" // Real Okta user ID
  todos.push(
    {
      id: "1",
      text: "Analyse current week expenses",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: realUserId,
    },
    {
      id: "2",
      text: "Water indoor plants",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: realUserId,
    },
    {
      id: "3",
      text: "Organize wardrobe",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: realUserId,
    },
    {
      id: "4",
      text: "Deep clean kitchen",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: realUserId,
    },
  )
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { completed } = await request.json()
    const todoId = params.id

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

    const todoIndex = todos.findIndex((todo) => todo.id === todoId && todo.userId === userId)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      completed: !!completed,
    }

    console.log("[v0] Todo updated:", { id: todoId, completed: !!completed, userId })

    return NextResponse.json({ todo: todos[todoIndex] })
  } catch (error) {
    console.error("[v0] Failed to update todo:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const todoId = params.id

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

    const todoIndex = todos.findIndex((todo) => todo.id === todoId && todo.userId === userId)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0]

    return NextResponse.json({ todo: deletedTodo })
  } catch (error) {
    console.error("[v0] Failed to delete todo:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
