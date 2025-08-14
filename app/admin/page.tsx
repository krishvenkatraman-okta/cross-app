import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Users, Database, Activity, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { AdminStats } from "@/components/admin-stats"
import { UserManagement } from "@/components/user-management"
import { CrossAppData } from "@/components/cross-app-data"
import { SystemMonitor } from "@/components/system-monitor"
import { AdminActions } from "@/components/admin-actions"
import { CrossAppTokenDisplay } from "@/components/cross-app-token-display"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
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
                <Shield className="h-8 w-8 text-purple-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Portal</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <AdminActions />
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Admin Stats Overview */}
        <div className="mb-8">
          <Suspense fallback={<div>Loading admin stats...</div>}>
            <AdminStats />
          </Suspense>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Management */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading users...</div>}>
                  <UserManagement />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  System Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading system data...</div>}>
                  <SystemMonitor />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Cross-App Data Access */}
          <div className="space-y-6">
            <CrossAppTokenDisplay />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2 text-orange-600" />
                  Cross-App Data Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading cross-app data...</div>}>
                  <CrossAppData />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
