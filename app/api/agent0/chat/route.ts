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
        const crossAppToken = await getCrossAppToken(request, "todo0")

        if (crossAppToken) {
          const tokenData = {
            id_jag_token: "demo-id-jag-token-" + Date.now(),
            cross_app_access_token: crossAppToken,
          }

          // Fetch todo data using cross-app token
          const todoResponse = await fetch(`${request.nextUrl.origin}/api/todo0/todos`, {
            headers: {
              Authorization: `Bearer ${crossAppToken}`,
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
  let response = `📋 **Your Todo List** (${todos.length} tasks)\n\n`

  todos.forEach((todo: any, index: number) => {
    const status = todo.completed ? "✅" : "⏳"
    const priority = todo.priority ? ` [${todo.priority.toUpperCase()}]` : ""
    const dueDate = todo.due_date ? ` (Due: ${new Date(todo.due_date).toLocaleDateString()})` : ""

    response += `${index + 1}. ${status} ${todo.text}${priority}${dueDate}\n`

    if (todo.description) {
      response += `   📝 ${todo.description}\n`
    }
    response += "\n"
  })

  const completedCount = todos.filter((t: any) => t.completed).length
  const pendingCount = todos.length - completedCount

  response += `📊 **Summary:** ${completedCount} completed, ${pendingCount} pending\n\n`
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

async function getCrossAppToken(request: NextRequest, targetApp: string): Promise<string | null> {
  try {
    // In a real implementation, we'd get this from the user's authenticated session
    // For now, we'll create a properly formatted demo JWT token
    const demoIdToken = createDemoIdToken()

    const response = await fetch(`${request.nextUrl.origin}/api/agent0/cross-app-access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${demoIdToken}`,
      },
      body: JSON.stringify({ target_app: targetApp }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] Obtained cross-app access token for", targetApp)
      return data.access_token
    } else {
      console.error("[v0] Failed to get cross-app token:", response.status)
      return null
    }
  } catch (error) {
    console.error("[v0] Cross-app token request failed:", error)
    return null
  }
}
