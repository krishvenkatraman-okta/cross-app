import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, CheckSquare, Settings } from "lucide-react"
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
            Demonstrate secure cross-application access patterns using Okta authentication and authorization
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Main Dashboard
              </CardTitle>
              <CardDescription>Central hub for managing cross-app access and user sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button className="w-full">Access Dashboard</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="h-5 w-5 mr-2 text-green-600" />
                Todo Application
              </CardTitle>
              <CardDescription>Task management app with user-specific data and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/todo">
                <Button variant="outline" className="w-full bg-transparent">
                  Open Todo App
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Admin Portal
              </CardTitle>
              <CardDescription>
                Administrative interface with elevated permissions and cross-app management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="outline" className="w-full bg-transparent">
                  Admin Access
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>Loading auth status...</div>}>
                <AuthStatus />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AuthStatus() {
  // This will be replaced with actual Okta auth check
  return (
    <div className="space-y-4">
      <p className="text-gray-600 dark:text-gray-300">
        Please configure your Okta credentials to enable authentication
      </p>
      <Button>Sign In with Okta</Button>
    </div>
  )
}
