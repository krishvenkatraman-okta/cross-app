"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react"

export function TodoStats() {
  // Mock stats data
  const stats = {
    total: 15,
    completed: 8,
    pending: 7,
    overdue: 2,
    completionRate: 53,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <TrendingUp className="h-4 w-4 mr-2" />
          Task Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span className="font-medium">{stats.completionRate}%</span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="font-medium">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <div>
              <p className="font-medium">{stats.overdue}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <div>
              <p className="font-medium">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
