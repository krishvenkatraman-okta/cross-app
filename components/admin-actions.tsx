"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, RefreshCw, Download, Upload, AlertTriangle, CheckSquare } from "lucide-react"
import Link from "next/link"

export function AdminActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Admin Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>System Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All Data
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Download className="h-4 w-4 mr-2" />
          Export User Data
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Upload className="h-4 w-4 mr-2" />
          Import Users
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Cross-App Actions</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href="/todo" className="flex items-center">
            <CheckSquare className="h-4 w-4 mr-2" />
            Access Todo App
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <AlertTriangle className="h-4 w-4 mr-2" />
          System Maintenance
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
