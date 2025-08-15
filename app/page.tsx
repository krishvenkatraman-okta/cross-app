import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3">🛡️</span>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Okta Cross-App Access Demo</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Atlas Beverages enterprise inventory management with secure cross-app access using Okta authentication and
            AI integration
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-lg mr-2">📦</span>
                Atlas Beverages Inventory
              </CardTitle>
              <CardDescription>Warehouse inventory management with multi-location tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/inventory">
                <Button className="w-full bg-red-600 hover:bg-red-700">Access Inventory</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-lg mr-2">🤖</span>
                JARVIS AI Assistant
              </CardTitle>
              <CardDescription>
                AI chatbot with cross-app access to inventory data and integrated token viewer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/jarvis">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Chat with JARVIS</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="text-lg mr-2">💬</span>
                Demo Flow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">1. Inventory App</h4>
                  <p className="text-red-700">
                    Authenticate with Okta and manage warehouse inventory across Texas, California, and Nevada
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">2. JARVIS AI</h4>
                  <p className="text-purple-700">Chat with AI assistant that can access your inventory data</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">3. Cross-App Access</h4>
                  <p className="text-blue-700">View tokens in JARVIS sidebar and see secure data sharing in action</p>
                </div>
              </div>
              <div className="text-center pt-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Try asking JARVIS: "What's the inventory in Texas?" or "Show me California warehouse stock"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
