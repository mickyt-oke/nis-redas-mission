"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Search, Send, Paperclip, MoreVertical, X, Edit2, Trash2, Users, MessageSquare, Info, UserPlus } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { ScrollArea } from "../ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Badge } from "../ui/badge"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role?: string
}

interface Message {
  id: number
  conversation_id: number
  user_id: string
  content: string
  attachment_path?: string
  attachment_name?: string
  attachment_url?: string
  is_edited: boolean
  created_at: string
  user: User
}

interface Conversation {
  id: number
  title?: string
  type: string
  other_user?: User
  latest_message?: Message
  unread_count: number
  updated_at: string
}

export default function MessagingPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [activeTab, setActiveTab] = useState("chats")

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${apiUrl}/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`${apiUrl}/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return

    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessages([...messages, result.data])
        setMessageContent("")
        fetchConversations() // Refresh to update latest message
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Error sending message")
    } finally {
      setLoading(false)
    }
  }

  // Update message
  const updateMessage = async () => {
    if (!editingMessage || !messageContent.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/messages/${editingMessage.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const result = await response.json()
        setMessages(messages.map((m) => (m.id === editingMessage.id ? result.data : m)))
        setMessageContent("")
        setEditingMessage(null)
        toast.success("Message updated")
      } else {
        toast.error("Failed to update message")
      }
    } catch (error) {
      console.error("Error updating message:", error)
      toast.error("Error updating message")
    } finally {
      setLoading(false)
    }
  }

  // Delete message
  const deleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`${apiUrl}/messages/${messageId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (response.ok) {
        setMessages(messages.filter((m) => m.id !== messageId))
        toast.success("Message deleted")
      } else {
        toast.error("Failed to delete message")
      }
    } catch (error) {
      console.error("Error deleting message:", error)
      toast.error("Error deleting message")
    }
  }

  // Fetch all users for directory
  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/mission-staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAllUsers(Array.isArray(data) ? data : data.data || [])
      }
    } catch (error) {
      console.error("Error fetching mission staff users:", error)
    }
  }

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(`${apiUrl}/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  // Start conversation with user
  const startConversation = async (userId: string) => {
    try {
      const response = await fetch(`${apiUrl}/conversations/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        const conv = result.conversation
        setSelectedConversation({
          id: conv.id,
          title: conv.title,
          type: conv.type,
          other_user: conv.other_user,
          unread_count: 0,
          updated_at: conv.updated_at,
        })
        setMessages(conv.messages || [])
        setIsNewMessageOpen(false)
        setUserSearchQuery("")
        setSearchResults([])
        fetchConversations()
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      toast.error("Error starting conversation")
    }
  }

  // Select conversation
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  useEffect(() => {
    fetchConversations()
    fetchAllUsers()
    // Poll for new messages every 10 seconds
    const interval = setInterval(() => {
      if (selectedConversation) {
        fetchMessages(selectedConversation.id)
      }
      fetchConversations()
    }, 10000)

    return () => clearInterval(interval)
  }, [selectedConversation])

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.other_user
    if (!otherUser) return false
    const fullName = `${otherUser.first_name} ${otherUser.last_name}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase()) || otherUser.email.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
  }

  const filteredUsers = allUsers.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase()
    return fullName.includes(userSearchQuery.toLowerCase()) || u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  })

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50/50 p-4 gap-4">
      {/* Sidebar Card */}
      <Card className="w-80 flex flex-col shadow-md border-slate-200 overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#1b7b3c]" />
              Messages
            </CardTitle>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-[#1b7b3c] hover:bg-green-50"
              onClick={() => {
                setActiveTab("directory")
                setUserSearchQuery("")
              }}
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="chats" className="text-xs">
                Chats
              </TabsTrigger>
              <TabsTrigger value="directory" className="text-xs">
                Directory
              </TabsTrigger>
            </TabsList>

            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder={activeTab === "chats" ? "Search chats..." : "Search directory..."}
                value={activeTab === "chats" ? searchQuery : userSearchQuery}
                onChange={(e) => (activeTab === "chats" ? setSearchQuery(e.target.value) : setUserSearchQuery(e.target.value))}
                className="pl-9 bg-slate-100/50 border-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-[#1b7b3c]"
              />
            </div>
          </Tabs>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            {activeTab === "chats" ? (
              <div className="flex flex-col">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-3 p-3 cursor-pointer transition-colors border-l-4 border-transparent",
                        selectedConversation?.id === conversation.id
                          ? "bg-green-50/50 border-[#1b7b3c]"
                          : "hover:bg-slate-50 border-transparent",
                      )}
                      onClick={() => selectConversation(conversation)}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-slate-200 text-slate-600 font-semibold">
                            {conversation.other_user
                              ? getInitials(conversation.other_user.first_name, conversation.other_user.last_name)
                              : "?"}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1b7b3c] text-[10px] font-bold text-white ring-2 ring-white">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {conversation.other_user
                              ? `${conversation.other_user.first_name} ${conversation.other_user.last_name}`
                              : "Unknown User"}
                          </p>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {conversation.updated_at &&
                              formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate leading-relaxed">
                          {conversation.latest_message?.content || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No conversations found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="group flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => startConversation(u.id)}
                    >
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                          {getInitials(u.first_name, u.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {u.first_name} {u.last_name}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-slate-100 text-slate-500 font-normal">
                            {u.role || "User"}
                          </Badge>
                          <span className="text-[10px] text-slate-400 truncate">{u.email}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-400">No users found</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Window Card */}
      <Card className="flex-1 flex flex-col shadow-md border-slate-200 overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarFallback className="bg-green-50 text-[#1b7b3c] font-bold">
                    {selectedConversation.other_user
                      ? getInitials(selectedConversation.other_user.first_name, selectedConversation.other_user.last_name)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-900">
                    {selectedConversation.other_user
                      ? `${selectedConversation.other_user.first_name} ${selectedConversation.other_user.last_name}`
                      : "Unknown User"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500" />
                    <p className="text-xs text-slate-500">{selectedConversation.other_user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                  <Info className="w-5 h-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6 bg-slate-50/30">
              <div className="space-y-6">
                {messages.map((message, index) => {
                  const isOwnMessage = message.user_id === user?.id
                  const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id

                  return (
                    <div key={message.id} className={cn("flex items-end gap-2", isOwnMessage ? "justify-end" : "justify-start")}>
                      {!isOwnMessage && (
                        <div className="w-8 h-8 flex-shrink-0">
                          {showAvatar && (
                            <Avatar className="h-8 w-8 border border-slate-100">
                              <AvatarFallback className="text-[10px] bg-slate-200">
                                {getInitials(message.user.first_name, message.user.last_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}
                      <div className={cn("flex flex-col max-w-[75%]", isOwnMessage ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "relative px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                            isOwnMessage
                              ? "bg-[#1b7b3c] text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-100 rounded-bl-none",
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                            {isOwnMessage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 text-white/70 hover:text-white hover:bg-white/10"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingMessage(message)
                                      setMessageContent(message.content)
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteMessage(message.id)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          {message.attachment_url && (
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "flex items-center gap-2 mt-2 p-2 rounded-lg text-xs border transition-colors",
                                isOwnMessage
                                  ? "bg-white/10 border-white/20 hover:bg-white/20"
                                  : "bg-slate-50 border-slate-100 hover:bg-slate-100",
                              )}
                            >
                              <Paperclip className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{message.attachment_name}</span>
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                          {message.is_edited && <span className="text-[10px] text-slate-400 italic">• edited</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-slate-100">
              {editingMessage && (
                <div className="flex items-center justify-between mb-3 p-2 px-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Editing message</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
                    onClick={() => {
                      setEditingMessage(null)
                      setMessageContent("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-[#1b7b3c] focus-within:ring-1 focus-within:ring-[#1b7b3c] transition-all">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-[#1b7b3c] hover:bg-green-50">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Textarea
                  placeholder="Type your message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      if (editingMessage) {
                        updateMessage()
                      } else {
                        sendMessage()
                      }
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-[120px] bg-transparent border-none focus-visible:ring-0 resize-none py-2 text-sm"
                />
                <Button
                  onClick={editingMessage ? updateMessage : sendMessage}
                  disabled={!messageContent.trim() || loading}
                  className="h-9 w-9 rounded-lg bg-[#1b7b3c] hover:bg-[#155730] shadow-sm flex-shrink-0"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 p-12 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-[#1b7b3c]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Your Messages</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8">
              Select a conversation from the list or start a new one from the directory to begin messaging.
            </p>
            <Button
              className="bg-[#1b7b3c] hover:bg-[#155730]"
              onClick={() => {
                setActiveTab("directory")
                setUserSearchQuery("")
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Start New Conversation
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
