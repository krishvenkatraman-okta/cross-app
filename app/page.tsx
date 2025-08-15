import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Bot, CheckSquare, Eye, MessageSquare } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Okta Cross-App Access Demo</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Enterprise applications with secure cross-app access using Okta authentication and AI integration
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-green-600" />
                Todo0 Enterprise App
              </CardTitle>
              <CardDescription>Task management application with Okta OIDC authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/todo0">
                <Button className="w-full bg-green-600 hover:bg-green-700">Access Todo0</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="h-5 w-5 mr-2 text-purple-600" />
                Agent0 AI Assistant
              </CardTitle>
              <CardDescription>AI chatbot with cross-app access to Todo0 data via token exchange</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/agent0">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Chat with Agent0</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-blue-600" />
                Token Viewer
              </CardTitle>
              <CardDescription>View OAuth tokens and cross-app access credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tokens">
                <Button variant="outline" className="w-full bg-transparent">
                  View Tokens
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-indigo-600" />
                Demo Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">1. Todo0 App</h4>
                  <p className="text-green-700">Authenticate with Okta and create some todo tasks</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">2. Agent0 AI</h4>
                  <p className="text-purple-700">Chat with AI assistant that can access your todos</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">3. Cross-App Access</h4>
                  <p className="text-blue-700">View tokens and see secure data sharing in action</p>
                </div>
              </div>
              <div className="text-center pt-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Try asking Agent0: "What's in my todo list?" or "Show me my tasks"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
