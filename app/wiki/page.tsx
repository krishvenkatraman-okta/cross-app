"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AppSwitcher } from "@/components/app-switcher"
import { BookOpen, Search, Plus, Edit, Eye, ArrowLeft } from "lucide-react"

interface WikiPage {
  id: string
  title: string
  content: string
  author: string
  lastModified: string
  tags: string[]
  views: number
}

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([
    {
      id: "1",
      title: "Cross-App Access Guide",
      content: "This guide explains how to implement secure cross-application access using Okta authentication...",
      author: "Admin User",
      lastModified: "2024-01-15",
      tags: ["security", "authentication", "okta"],
      views: 45,
    },
    {
      id: "2",
      title: "Todo App Integration",
      content: "Learn how the Todo application integrates with the Wiki system for seamless user experience...",
      author: "Developer",
      lastModified: "2024-01-14",
      tags: ["integration", "todo", "api"],
      views: 23,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState("")
  const [newPageContent, setNewPageContent] = useState("")

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleCreatePage = () => {
    if (newPageTitle.trim() && newPageContent.trim()) {
      const newPage: WikiPage = {
        id: Date.now().toString(),
        title: newPageTitle,
        content: newPageContent,
        author: "Current User",
        lastModified: new Date().toISOString().split("T")[0],
        tags: ["new"],
        views: 0,
      }
      setPages([...pages, newPage])
      setNewPageTitle("")
      setNewPageContent("")
    }
  }

  if (selectedPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedPage(null)} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Wiki
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedPage.views} views</Badge>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? "Preview" : "Edit"}
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{selectedPage.title}</CardTitle>
              <CardDescription>
                By {selectedPage.author} • Last modified {selectedPage.lastModified}
              </CardDescription>
              <div className="flex gap-2">
                {selectedPage.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={selectedPage.content}
                  onChange={(e) => setSelectedPage({ ...selectedPage, content: e.target.value })}
                  className="min-h-[400px]"
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedPage.content}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cross-App Navigation</CardTitle>
              <CardDescription>Switch between applications while maintaining your session</CardDescription>
            </CardHeader>
            <CardContent>
              <AppSwitcher currentApp="wiki" userGroups={["WikiUsers", "AllUsers"]} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Wiki Application</h1>
          </div>
          <p className="text-gray-600">Knowledge base and documentation system</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search wiki pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Wiki Pages</h2>
              <Badge variant="secondary">{filteredPages.length} pages</Badge>
            </div>

            {filteredPages.map((page) => (
              <Card key={page.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader onClick={() => setSelectedPage(page)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg hover:text-green-600">{page.title}</CardTitle>
                      <CardDescription>
                        By {page.author} • {page.lastModified} • {page.views} views
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {page.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">{page.content.substring(0, 150)}...</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Page title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Page content"
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleCreatePage} className="w-full">
                  Create Page
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cross-App Access</CardTitle>
                <CardDescription>Switch between applications</CardDescription>
              </CardHeader>
              <CardContent>
                <AppSwitcher currentApp="wiki" userGroups={["WikiUsers", "AllUsers"]} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
