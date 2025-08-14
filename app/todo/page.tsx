import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckSquare, Plus, ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { TodoList } from "@/components/todo-list"
import { AddTodoForm } from "@/components/add-todo-form"
import { TodoStats } from "@/components/todo-stats"
import { CrossAppActions } from "@/components/cross-app-actions"

export default function TodoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
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
                <CheckSquare className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Todo Application</h1>
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add Todo & Stats */}
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

          {/* Todo List */}
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
