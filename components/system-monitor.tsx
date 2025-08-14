"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Server, Database, Wifi, AlertCircle } from "lucide-react"

export function SystemMonitor() {
  const systemMetrics = [
    {
      name: "API Response Time",
      value: 245,
      unit: "ms",
      status: "good",
      icon: <Server className="h-4 w-4" />,
    },
    {
      name: "Database Connections",
      value: 23,
      max: 100,
      unit: "active",
      status: "good",
      icon: <Database className="h-4 w-4" />,
    },
    {
      name: "Network Latency",
      value: 12,
      unit: "ms",
      status: "excellent",
      icon: <Wifi className="h-4 w-4" />,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200"
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      {systemMetrics.map((metric, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {metric.icon}
              <span className="font-medium text-sm">{metric.name}</span>
            </div>
            <Badge className={`text-xs ${getStatusColor(metric.status)}`}>{metric.status}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">
              {metric.value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
            </span>
            {metric.max && <span className="text-xs text-muted-foreground">/ {metric.max}</span>}
          </div>

          {metric.max && <Progress value={(metric.value / metric.max) * 100} className="h-2 mt-2" />}
        </Card>
      ))}

      <Card className="p-3 border-yellow-200 bg-yellow-50">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <div>
            <p className="font-medium text-sm text-yellow-800">System Notice</p>
            <p className="text-xs text-yellow-700">Scheduled maintenance in 2 hours</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
