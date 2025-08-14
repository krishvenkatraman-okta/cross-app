import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Shield, Users, CheckSquare, Settings, Clock, Key, ArrowRight, Home } from "lucide-react"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { UserProfile } from "@/components/user-profile"
import { AppAccessCard } from "@/components/app-access-card"
import { SessionInfo } from "@/components/session-info"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User Profile Section */}
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading profile...</div>}>
              <UserProfile />
            </Suspense>

            <div className="mt-6">
              <Suspense fallback={<div>Loading session...</div>}>
                <SessionInfo />
              </Suspense>
            </div>
          </div>

          {/* Applications Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Available Applications
                </CardTitle>
                <CardDescription>Applications you have access to with current permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AppAccessCard
                  icon={<CheckSquare className="h-6 w-6 text-green-600" />}
                  title="Todo Application"
                  description="Personal task management with CRUD operations"
                  href="/todo"
                  permissions={["todo:read", "todo:write"]}
                  status="active"
                />

                <Separator />

                <AppAccessCard
                  icon={<Settings className="h-6 w-6 text-purple-600" />}
                  title="Admin Portal"
                  description="Administrative interface with elevated permissions"
                  href="/admin"
                  permissions={["admin:read", "admin:write", "users:manage"]}
                  status="restricted"
                />

                <Separator />

                <AppAccessCard
                  icon={<Users className="h-6 w-6 text-orange-600" />}
                  title="User Management"
                  description="Cross-app user and permission management"
                  href="/users"
                  permissions={["users:read", "users:write", "permissions:manage"]}
                  status="pending"
                />
              </CardContent>
            </Card>

            {/* Cross-App Access Demo */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2 text-amber-600" />
                  Cross-App Access Demo
                </CardTitle>
                <CardDescription>Demonstrate secure resource sharing between applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Todo → Admin Access</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Access admin features from within the todo application
                    </p>
                    <Button variant="outline" size="sm">
                      Test Access <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Admin → Todo Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">View and manage todo data from admin interface</p>
                    <Button variant="outline" size="sm">
                      Test Access <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/">
                <Button variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Refresh Session
              </Button>
              <Button variant="destructive">Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
