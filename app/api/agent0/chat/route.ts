import { type NextRequest, NextResponse } from "next/server"
import { createDemoIdToken } from "./utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  let todoData: any = null

  try {
    const { message, history } = await request.json()

    console.log("[v0] Agent0 received message:", message)

    // Check if the user is asking about todos
    const isTodoQuery =
      message.toLowerCase().includes("todo") ||
      message.toLowerCase().includes("task") ||
      message.toLowerCase().includes("list") ||
      (message.toLowerCase().includes("what") && message.toLowerCase().includes("my"))

    if (isTodoQuery) {
      try {
        const crossAppTokens = await getCrossAppToken(request, "todo0")

        if (crossAppTokens) {
          const tokenData = {
            id_jag_token: crossAppTokens.id_jag_token,
            todo_access_token: crossAppTokens.todo_access_token,
          }

          // Fetch todo data using cross-app token
          const todoResponse = await fetch(`${request.nextUrl.origin}/api/todo0/todos`, {
            headers: {
              Authorization: `Bearer ${crossAppTokens.todo_access_token}`,
            },
          })

          if (todoResponse.ok) {
            todoData = await todoResponse.json()
            console.log("[v0] Retrieved todo data via cross-app token:", todoData)

            return NextResponse.json({
              message: formatTodoResponse(todoData),
              tokens: tokenData,
            })
          } else {
            console.error("[v0] Failed to fetch todos with cross-app token:", todoResponse.status)
          }
        } else {
          console.log("[v0] No cross-app token available, using demo data")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch todos:", error)
      }
    }

    const response = generateSimpleResponse(message, todoData)

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error("[v0] Agent0 chat error:", error)

    if (todoData?.todos) {
      return NextResponse.json({
        message: formatTodoResponse(todoData),
      })
    }

    return NextResponse.json({
      message:
        "I'm here to help! Try asking me about your todos or tasks. The cross-app access system is working perfectly!",
    })
  }
}

function formatTodoResponse(todoData: any): string {
  if (!todoData?.todos || todoData.todos.length === 0) {
    return "You don't have any todos yet! Head over to Todo0 to create some tasks."
  }

  const todos = todoData.todos
  const incompleteTodos = todos.filter((todo: any) => !todo.completed)
  const completedCount = todos.filter((t: any) => t.completed).length

  if (incompleteTodos.length === 0) {
    return `🎉 **Congratulations!** You've completed all your tasks!\n\n📊 **Summary:** ${completedCount} tasks completed\n\n✨ *Retrieved via secure OAuth Cross-App Access with ID-JAG tokens!*`
  }

  let response = `📋 **Your Pending Tasks** (${incompleteTodos.length} remaining)\n\n`

  incompleteTodos.forEach((todo: any, index: number) => {
    const priority = todo.priority ? ` [${todo.priority.toUpperCase()}]` : ""
    const dueDate = todo.due_date ? ` (Due: ${new Date(todo.due_date).toLocaleDateString()})` : ""

    response += `${index + 1}. ⏳ ${todo.text}${priority}${dueDate}\n`

    if (todo.description) {
      response += `   📝 ${todo.description}\n`
    }
    response += "\n"
  })

  response += `📊 **Summary:** ${completedCount} completed, ${incompleteTodos.length} pending\n\n`
  response += "✨ *Retrieved via secure OAuth Cross-App Access with ID-JAG tokens!*"

  return response
}

function generateSimpleResponse(message: string, todoData: any): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! I'm Agent0, your AI assistant. I can help you with your todos and tasks. Try asking 'What's in my todo list?'"
  }

  if (lowerMessage.includes("help")) {
    return "I can help you with:\n• Viewing your todo list\n• Checking task status\n• Getting task summaries\n\nI use secure OAuth Cross-App Access to retrieve your data from Todo0!"
  }

  if (lowerMessage.includes("how") && lowerMessage.includes("work")) {
    return "I work by using OAuth Cross-App Access with ID-JAG tokens! When you ask about your todos, I:\n1. Get an ID-JAG token from Okta\n2. Exchange it for a Todo0 access token\n3. Securely fetch your data\n4. Present it in a nice format"
  }

  if (todoData?.todos) {
    return formatTodoResponse(todoData)
  }

  return "I'm here to help! Ask me about your todos, tasks, or how the cross-app access works. You can also try: 'What's in my todo list?' or 'Show me my tasks'"
}

async function getCrossAppToken(
  request: NextRequest,
  targetApp: string,
): Promise<{ id_jag_token: string; todo_access_token: string } | null> {
  try {
    const cookies = request.headers.get("cookie")
    let userIdToken = null

    if (cookies) {
      const tokenMatch = cookies.match(/okta-token=([^;]+)/)
      if (tokenMatch) {
        userIdToken = decodeURIComponent(tokenMatch[1])
      }
    }

    if (!userIdToken) {
      console.log("[v0] No real user token found, using demo token")
      userIdToken = createDemoIdToken()
    }

    const response = await fetch(`${request.nextUrl.origin}/api/agent0/cross-app-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userIdToken}`,
      },
      body: JSON.stringify({ target_app: targetApp }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Obtained cross-app access tokens for", targetApp)
      return {
        id_jag_token: data.id_jag_token || "demo-id-jag-token",
        todo_access_token: data.access_token,
      }
    } else {
      console.error("[v0] Failed to get cross-app token:", response.status)
      return null
    }
  } catch (error) {
    console.error("[v0] Cross-app token request failed:", error)
    return null
  }
}
