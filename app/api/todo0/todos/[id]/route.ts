import { type NextRequest, NextResponse } from "next/server"

const todos: Array<{
  id: string
  text: string
  completed: boolean
  createdAt: string
  userId: string
}> = []

if (todos.length === 0) {
  todos.push(
    {
      id: "1",
      text: "Analyse current week expenses",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: "demo-user",
    },
    {
      id: "2",
      text: "Water indoor plants",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: "demo-user",
    },
    {
      id: "3",
      text: "Organize wardrobe",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: "demo-user",
    },
    {
      id: "4",
      text: "Deep clean kitchen",
      completed: false,
      createdAt: new Date().toISOString(),
      userId: "demo-user",
    },
  )
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { completed } = await request.json()
    const todoId = params.id

    // In production, get user from JWT token
    const userId = "demo-user"

    const todoIndex = todos.findIndex((todo) => todo.id === todoId && todo.userId === userId)

    if (todoIndex === -1) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 })
    }

    todos[todoIndex] = {
      ...todos[todoIndex],
      completed: !!completed,
    }

    return NextResponse.json({ todo: todos[todoIndex] })
  } catch (error) {
    console.error("[v0] Failed to update todo:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const todoId = params.id

    // In production, get user from JWT token
    const userId = "demo-user"

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
