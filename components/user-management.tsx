"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, UserCheck, UserX, Shield, Eye } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  status: "active" | "inactive" | "suspended"
  groups: string[]
  lastLogin: string
  todoCount: number
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users] = useState<User[]>([
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@company.com",
      status: "active",
      groups: ["users", "todo-users", "admin-users"],
      lastLogin: "2025-01-15T10:30:00Z",
      todoCount: 8,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@company.com",
      status: "active",
      groups: ["users", "todo-users"],
      lastLogin: "2025-01-15T09:15:00Z",
      todoCount: 12,
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob.johnson@company.com",
      status: "inactive",
      groups: ["users"],
      lastLogin: "2025-01-10T14:20:00Z",
      todoCount: 3,
    },
    {
      id: "4",
      name: "Alice Brown",
      email: "alice.brown@company.com",
      status: "suspended",
      groups: ["users", "todo-users"],
      lastLogin: "2025-01-08T11:45:00Z",
      todoCount: 0,
    },
  ])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "suspended":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatLastLogin = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button size="sm">Add User</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Todos</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`/abstract-geometric-shapes.png?height=32&width=32&query=${user.name}`} />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(user.status)} capitalize`}>{user.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.groups.slice(0, 2).map((group) => (
                      <Badge key={group} variant="outline" className="text-xs">
                        {group}
                      </Badge>
                    ))}
                    {user.groups.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.groups.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{user.todoCount}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatLastLogin(user.lastLogin)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="h-4 w-4 mr-2" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === "active" ? (
                        <DropdownMenuItem>
                          <UserX className="h-4 w-4 mr-2" />
                          Suspend User
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Activate User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
