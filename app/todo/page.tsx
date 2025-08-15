"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckSquare, Plus, ArrowLeft, Settings, LogIn } from "lucide-react"
import Link from "next/link"
import { TodoList } from "@/components/todo-list"
import { AddTodoForm } from "@/components/add-todo-form"
import { TodoStats } from "@/components/todo-stats"
import { CrossAppActions } from "@/components/cross-app-actions"
import { validateOktaConfig } from "@/lib/okta-config"
import { useAuth } from "@/components/auth-provider"

export default function TodoPage() {
  const { user, isLoading, signIn } = useAuth()
  const isAuthenticated = !!user

  const handleSignIn = () => {
    signIn()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Todo Application</CardTitle>
            <p className="text-gray-600 dark:text-gray-400">Please sign in with Okta to access your todos</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSignIn} className="w-full" size="lg">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in with Okta
            </Button>
            <div className="text-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            {!validateOktaConfig("todo") && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Please configure your Okta credentials to enable authentication
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
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
                <CheckSquare className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Todo Application</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {user && (
                <span className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user.name || user.email}</span>
              )}
              <CrossAppActions />
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-green-600" />
                  Add New Task
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddTodoForm />
              </CardContent>
            </Card>

            <Suspense fallback={<div>Loading stats...</div>}>
              <TodoStats />
            </Suspense>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading todos...</div>}>
                  <TodoList />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
