// Multi-app Okta configuration for cross-app access demo
export const oktaApps = {
  todo: {
    name: "Todo App",
    clientId: process.env.NEXT_PUBLIC_OKTA_TODO_CLIENT_ID || "0oap645dn3T2jSVFm1d7",
    clientSecret:
      process.env.OKTA_TODO_CLIENT_SECRET || "Lqp8iWMWVoHy-Qo2ZQghpBOYC4Ie6yHRb61OX7z9DWR1BM0LBobAIOdECDzGphz6",
    issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://iam.oktapreview.com",
    emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
    scopes: ["openid", "profile", "email", "groups"],
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/callback` : "",
  },
  agent0: {
    name: "Agent0 App",
    clientId: process.env.NEXT_PUBLIC_OKTA_AGENT0_CLIENT_ID || "0oap63ve0aiYOYZG81d7",
    clientSecret:
      process.env.OKTA_AGENT0_CLIENT_SECRET || "KnOVc7_7anERg5ZhwaliHPv4vhFCQtIl41yWzPc6fxMdM4RKye-QGxy95hsuEsu6",
    issuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://iam.oktapreview.com",
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
export function getOktaConfigForApp(appType: "todo" | "agent0") {
  return {
    ...oktaApps[appType],
    pkce: true,
    disableHttpsCheck: process.env.NODE_ENV === "development",
  }
}

// Cross-app token exchange configuration
export const crossAppConfig = {
  sharedIssuer: process.env.NEXT_PUBLIC_OKTA_ISSUER || "https://iam.oktapreview.com",
  emailDomain: process.env.OKTA_EMAIL_DOMAIN || "tables.fake",
  allowedApps: ["todo", "agent0"],
  tokenExchangeEndpoint: "/api/cross-app/token-exchange",
}

// Validate configuration for specific app
export function validateOktaConfig(appType?: "todo" | "agent0") {
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
export function hasAppAccess(userGroups: string[], appType: "todo" | "agent0"): boolean {
  // In a real implementation, this would check against Okta groups
  // For demo purposes, we'll allow access based on email domain or groups
  const requiredGroups = {
    todo: ["TodoUsers", "AllUsers", "Employees"],
    agent0: ["AdminUsers", "AllUsers", "Employees", "Admins", "Agents"],
  }

  return userGroups.some((group) => requiredGroups[appType].includes(group))
}
