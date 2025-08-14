"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Shield, Users, Settings, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"
import { crossAppClient } from "@/lib/cross-app-client"

export function CrossAppActions() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createSuccess, setCreateSuccess] = useState(false)

  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  })

  const handleCreateTodo = async () => {
    if (!newTodo.title.trim()) return

    setIsCreating(true)
    try {
      await crossAppClient.createTodo(newTodo)
      setCreateSuccess(true)
      setNewTodo({ title: "", description: "", priority: "medium", dueDate: "" })

      // Close dialog after success message
      setTimeout(() => {
        setIsCreateDialogOpen(false)
        setCreateSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to create todo:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Cross-App
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Cross-App Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Todo (Cross-App)
              </DropdownMenuItem>
            </DialogTrigger>
          </Dialog>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Admin Portal
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Main Dashboard
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem>
            <Settings className="h-4 w-4 mr-2" />
            Cross-App Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Todo via Cross-App Access</DialogTitle>
            <DialogDescription>
              This demonstrates creating a todo item from outside the todo application using secure cross-app API
              access.
            </DialogDescription>
          </DialogHeader>

          {createSuccess ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="font-medium text-green-800">Todo created successfully!</p>
                <p className="text-sm text-green-600">Cross-app access working correctly</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cross-title">Title</Label>
                <Input
                  id="cross-title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  placeholder="Enter todo title..."
                />
              </div>

              <div>
                <Label htmlFor="cross-description">Description</Label>
                <Textarea
                  id="cross-description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cross-priority">Priority</Label>
                  <Select
                    value={newTodo.priority}
                    onValueChange={(value) => setNewTodo({ ...newTodo, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cross-dueDate">Due Date</Label>
                  <Input
                    id="cross-dueDate"
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTodo} disabled={isCreating || !newTodo.title.trim()}>
                  {isCreating ? "Creating..." : "Create Todo"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
