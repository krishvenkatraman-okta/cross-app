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
  const currentHour = new Date().getHours()
  const currentDate = new Date().toDateString()
  return `${userId}-${currentDate}-${currentHour}`
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

    const sessionKey = getSessionKey(userId)
    const todos = todoSessions.get(sessionKey) || []
    const todoIndex = todos.findIndex((todo) => todo.id === todoId && todo.userId === userId)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      completed: !!completed,
    }

    todoSessions.set(sessionKey, todos)

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

    const sessionKey = getSessionKey(userId)
    const todos = todoSessions.get(sessionKey) || []
    const todoIndex = todos.findIndex((todo) => todo.id === todoId && todo.userId === userId)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    const deletedTodo = todos.splice(todoIndex, 1)[0]
    todoSessions.set(sessionKey, todos)

    return NextResponse.json({ todo: deletedTodo })
  } catch (error) {
    console.error("[v0] Failed to delete todo:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
