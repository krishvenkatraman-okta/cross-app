// Multi-app Okta configuration for cross-app access demo

// Authorization server configuration - can be "org" or "default"
const authServerType = process.env.NEXT_PUBLIC_OKTA_AUTH_SERVER || "org"
const authServerPath = authServerType === "default" ? "/oauth2/default/v1" : "/oauth2/v1"

// Helper function to build authorization server URLs
function buildAuthServerUrl(baseUrl: string, endpoint: string): string {
  return `${baseUrl}${authServerPath}${endpoint}`
}

export const oktaApps = {
  todo: {
    name: "Todo App",
    clientId: process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID || "0oap645dn3T2jSVFm1d7",
    clientSecret:
      process.env.OKTA_TODO_CLIENT_SECRET || "Lqp8iWMWVoHy-Qo2ZQghpBOYC4Ie6yHRb61OX7z9DWR1BM0LBobAIOdECDzGphz6",
    issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://fcxdemo.okta.com",
    tokenEndpoint: buildAuthServerUrl("https://fcxdemo.okta.com", "/token"),
    emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
    scopes: ["openid", "profile", "email", "groups"],
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "",
  },
  agent0: {
    name: "Agent0 App",
    clientId: process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID || "0oap63ve0aiYOYZG81d7",
    clientSecret:
      process.env.OKTA_AGENT0_CLIENT_SECRET || "KnOVc7_7anERg5ZhwaliHPv4vhFCQtIl41yWzPc6fxMdM4RKye-QGxy95hsuEsu6",
    issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://fcxdemo.okta.com",
    tokenEndpoint: buildAuthServerUrl("https://fcxdemo.okta.com", "/token"),
    emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
    scopes: ["openid", "profile", "email", "groups"],
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "",
  },
  jarvis: {
    name: "JARVIS App",
    clientId: process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID || "0oap63ve0aiYOYZG81d7",
    clientSecret:
      process.env.OKTA_JARVIS_CLIENT_SECRET || "KnOVc7_7anERg5ZhwaliHPv4vhFCQtIl41yWzPc6fxMdM4RKye-QGxy95hsuEsu6",
    issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://fcxdemo.okta.com",
    tokenEndpoint: buildAuthServerUrl("https://fcxdemo.okta.com", "/token"),
    emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
    scopes: ["openid", "profile", "email", "groups"],
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "",
  },
  inventory: {
    name: "Inventory App",
    clientId:
      process.env.NEXT_PUBLIC_OKTA_INVENTORY_CLIENT_ID ||
      process.env.NEXT_PUBLIC_OKTA_JARVIS_CLIENT_ID ||
      "0oap63ve0aiYOYZG81d7",
    clientSecret:
      process.env.OKTA_INVENTORY_CLIENT_SECRET ||
      process.env.OKTA_JARVIS_CLIENT_SECRET ||
      "KnOVc7_7anERg5ZhwaliHPv4vhFCQtIl41yWzPc6fxMdM4RKye-QGxy95hsuEsu6",
    issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://fcxdemo.okta.com",
    tokenEndpoint: buildAuthServerUrl("https://fcxdemo.okta.com", "/token"),
    emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
    scopes: ["openid", "profile", "email", "groups"],
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "",
  },
}

// Default configuration (using Todo app as primary)
export const oktaConfig = {
  ...oktaApps.todo,
  pkce: true,
  disableHttpsCheck: process.env.NODE_ENV === "development",
}

// Get configuration for specific app
export function getOktaConfigForApp(appType: "todo" | "agent0" | "jarvis" | "inventory") {
  return {
    ...oktaApps[appType],
    pkce: true,
    disableHttpsCheck: process.env.NODE_ENV === "development",
  }
}

// Cross-app token exchange configuration
export const crossAppConfig = {
  sharedIssuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://fcxdemo.okta.com",
  tokenExchangeEndpoint: buildAuthServerUrl("https://fcxdemo.okta.com", "/token"),
  emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
  allowedApps: ["todo", "agent0", "jarvis", "inventory"],
}

// Validate configuration for specific app
export function validateOktaConfig(appType?: "todo" | "agent0" | "jarvis" | "inventory") {
  const config = appType ? oktaApps[appType] : oktaConfig
  const missing = []

  if (!config.clientId) missing.push(`NEXT_PUBLIC_OKTA_${appType?.toUpperCase() || "TODO"}_CLIENT_ID`)
  if (!config.issuer) missing.push("NEXT_PUBLIC_OKTA_ISSUER")

  if (missing.length > 0) {
    console.warn(`Missing Okta configuration for ${appType || "default"}:`, missing.join(", "))
    return false
  }
  return true
}

// Check if user has access to specific app
export function hasAppAccess(userGroups: string[], appType: "todo" | "agent0" | "jarvis" | "inventory"): boolean {
  // In a real implementation, this would check against Okta groups
  // For demo purposes, we'll allow access based on email domain or groups
  const requiredGroups = {
    todo: ["TodoUsers", "AllUsers", "Employees"],
    agent0: ["AdminUsers", "AllUsers", "Employees", "Admins", "Agents"],
    jarvis: ["AdminUsers", "AllUsers", "Employees", "Admins", "Agents"],
    inventory: ["InventoryUsers", "AllUsers", "Employees", "Admins"],
  }

  return userGroups.some((group) => requiredGroups[appType].includes(group))
}

// Helper function to get authorization server URLs
export function getAuthServerUrls(baseUrl = "https://fcxdemo.okta.com") {
  return {
    authorize: buildAuthServerUrl(baseUrl, "/authorize"),
    token: buildAuthServerUrl(baseUrl, "/token"),
    logout: buildAuthServerUrl(baseUrl, "/logout"),
    userinfo: buildAuthServerUrl(baseUrl, "/userinfo"),
    issuer: authServerType === "default" ? `${baseUrl}/oauth2/default` : baseUrl,
  }
}
