export function createDemoIdToken(): string {
  // Create a properly formatted JWT token for demo purposes
  const header = {
    alg: "HS256",
    typ: "JWT",
  }

  const payload = {
    sub: "00up6GlznvCobuu31d7",
    email: "Arjun@atko.email",
    name: "Arjun",
    iss: "https://dev-01234567.okta.com/oauth2/default",
    aud: "0oa1234567890abcdef",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }

  // Base64url encode (simplified for demo)
  const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const signature = "demo-signature"

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function formatTodoResponse(todoData: any): string {
  if (!todoData || !todoData.todos || todoData.todos.length === 0) {
    return "You don't have any todos yet! Head over to Todo0 to create some tasks."
  }

  const incompleteTodos = todoData.todos.filter((todo: any) => !todo.completed)

  if (incompleteTodos.length === 0) {
    return "🎉 Congratulations! You've completed all your tasks! Great job staying productive."
  }

  let response = `📋 **Your Pending Tasks** (${incompleteTodos.length} remaining)\n\n`

  incompleteTodos.forEach((todo: any, index: number) => {
    response += `${index + 1}. ⏳ ${todo.text}\n`
  })

  const completedCount = todoData.todos.length - incompleteTodos.length
  response += `\n📊 **Summary:** ${completedCount} completed, ${incompleteTodos.length} pending\n\n`
  response += `✨ *Retrieved via secure OAuth Cross-App Access with ID-JAG tokens!*`

  return response
}
