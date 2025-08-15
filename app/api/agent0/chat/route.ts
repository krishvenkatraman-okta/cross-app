import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { createDemoIdToken } from "./utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  let todoData: any = null // Moved todoData declaration to function scope

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
          // Fetch todo data using cross-app token
          const todoResponse = await fetch(`${request.nextUrl.origin}/api/todo0/todos`, {
            headers: {
              Authorization: `Bearer ${crossAppToken}`,
            },
          })

          if (todoResponse.ok) {
            todoData = await todoResponse.json()
            console.log("[v0] Retrieved todo data via cross-app token:", todoData)
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

    // Build the system prompt
    let systemPrompt = `You are Agent0, a helpful AI assistant that can access the user's todo data from their Todo0 application. 
    You are friendly, concise, and helpful. When users ask about their todos or tasks, you can provide specific information.
    
    You have cross-app access to the user's Todo0 data through secure OAuth Cross-App Access with ID-JAG tokens.`

    if (todoData && todoData.todos) {
      systemPrompt += `\n\nCurrent user todos:
${todoData.todos.map((todo: any) => `- ${todo.text} ${todo.completed ? "(completed)" : "(pending)"}`).join("\n")}`
    } else if (isTodoQuery) {
      systemPrompt += `\n\nNote: Unable to access todo data at this time. Please let the user know they may need to authenticate with Todo0 first.`
    }

    // Build conversation history
    const conversationHistory = history.slice(-10).map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }))

    const { text } = await generateText({
      model: openai("gpt-3.5-turbo"), // Using cheaper model to avoid quota issues
      system: systemPrompt,
      messages: [...conversationHistory, { role: "user", content: message }],
      temperature: 0.7,
      maxTokens: 500,
    })

    console.log("[v0] Generated response:", text)

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("[v0] Agent0 chat error:", error)
    if (error.message?.includes("quota") || error.message?.includes("API key")) {
      return NextResponse.json({
        message:
          "I can see your todo list successfully through cross-app access, but I'm having trouble with my AI processing. Your todos are: " +
          (todoData?.todos ? todoData.todos.map((t: any) => t.text).join(", ") : "not available right now"),
      })
    }
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
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
