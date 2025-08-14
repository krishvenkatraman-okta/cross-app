import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { UserManagement } from "@/components/user-management"
import { CrossAppActions } from "@/components/cross-app-actions"

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-orange-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CrossAppActions />
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management via Cross-App Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading users...</div>}>
              <UserManagement />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
