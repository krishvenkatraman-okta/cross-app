"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, CheckSquare, Activity, TrendingUp, AlertTriangle } from "lucide-react"

export function AdminStats() {
  const stats = [
    {
      title: "Total Users",
      value: "247",
      change: "+12%",
      icon: <Users className="h-5 w-5 text-blue-600" />,
      trend: "up",
    },
    {
      title: "Active Sessions",
      value: "89",
      change: "+5%",
      icon: <Activity className="h-5 w-5 text-green-600" />,
      trend: "up",
    },
    {
      title: "Todo Items",
      value: "1,234",
      change: "+23%",
      icon: <CheckSquare className="h-5 w-5 text-purple-600" />,
      trend: "up",
    },
    {
      title: "Permission Issues",
      value: "3",
      change: "-2",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      trend: "down",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="flex flex-col items-end">
                {stat.icon}
                <div className="flex items-center mt-2">
                  <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`} />
                  <span className={`text-xs font-medium ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
