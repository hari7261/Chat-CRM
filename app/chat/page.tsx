"use client"

import type React from "react"

import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Users, Copy, Check, ArrowLeft, Circle } from "lucide-react"

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
  color: string
}

interface User {
  id: string
  name: string
  color: string
}

function ChatContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [message, setMessage] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const roomCode = searchParams.get("room")
  const userName = searchParams.get("name")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (!roomCode || !userName) {
      router.push("/")
      return
    }

    // Initialize socket connection
    const socketInitializer = async () => {
      try {
        // Initialize the socket server
        await fetch("/api/socket")

        const newSocket = io({
          path: "/api/socket",
          addTrailingSlash: false,
        })

        newSocket.on("connect", () => {
          console.log("Connected to server with ID:", newSocket.id)
          setIsConnected(true)
          setConnectionError(null)
          newSocket.emit("join-room", { room: roomCode, user: userName })
        })

        newSocket.on("disconnect", () => {
          console.log("Disconnected from server")
          setIsConnected(false)
        })

        newSocket.on("connect_error", (error) => {
          console.error("Connection error:", error)
          setIsConnected(false)
          setConnectionError("Failed to connect to chat server")
        })

        newSocket.on("message", (data: Message) => {
          console.log("Received message:", data)
          setMessages((prev) => [...prev, data])
        })

        newSocket.on("users-update", (users: User[]) => {
          console.log("Users updated:", users)
          setUsers(users)
        })

        newSocket.on("user-joined", (data: { user: string }) => {
          console.log("User joined:", data.user)
          const joinMessage: Message = {
            id: Date.now().toString(),
            user: "System",
            message: `${data.user} joined the room`,
            timestamp: new Date(),
            color: "bg-gray-500",
          }
          setMessages((prev) => [...prev, joinMessage])
        })

        newSocket.on("user-left", (data: { user: string }) => {
          console.log("User left:", data.user)
          const leaveMessage: Message = {
            id: Date.now().toString(),
            user: "System",
            message: `${data.user} left the room`,
            timestamp: new Date(),
            color: "bg-gray-500",
          }
          setMessages((prev) => [...prev, leaveMessage])
        })

        setSocket(newSocket)
      } catch (error) {
        console.error("Socket initialization error:", error)
        setConnectionError("Failed to initialize chat")
      }
    }

    socketInitializer()

    return () => {
      if (socket) {
        console.log("Cleaning up socket connection")
        socket.close()
      }
    }
  }, [roomCode, userName, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && socket && isConnected) {
      console.log("Sending message:", message)
      socket.emit("message", {
        room: roomCode,
        user: userName,
        message: message.trim(),
      })
      setMessage("")
    } else {
      console.log("Cannot send message - socket:", !!socket, "connected:", isConnected, "message:", message.trim())
    }
  }

  const copyRoomCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserColor = (userName: string) => {
    const user = users.find((u) => u.name === userName)
    return user?.color || "bg-gray-500"
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave
            </Button>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Circle
                  className={`h-3 w-3 ${isConnected ? "text-green-500 fill-current" : "text-red-500 fill-current"}`}
                />
                <span className="text-sm font-medium">
                  {isConnected ? "Connected" : connectionError || "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={copyRoomCode} className="rounded-xl">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {roomCode}
            </Button>
            <Badge variant="secondary" className="rounded-xl">
              <Users className="h-3 w-3 mr-1" />
              {users.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col p-4">
          <Card className="flex-1 border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  {!isConnected && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-500">Connecting to chat...</p>
                      {connectionError && <p className="text-red-500 text-sm mt-2">{connectionError}</p>}
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-3 ${
                        msg.user === userName ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      {msg.user !== "System" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${getUserColor(msg.user)} text-white text-xs`}>
                            {getInitials(msg.user)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`flex flex-col ${msg.user === userName ? "items-end" : "items-start"} max-w-xs sm:max-w-md`}
                      >
                        {msg.user !== "System" && (
                          <span className="text-xs text-gray-500 mb-1 px-2">
                            {msg.user === userName ? "You" : msg.user}
                          </span>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            msg.user === "System"
                              ? "bg-gray-100 text-gray-600 text-sm italic mx-auto"
                              : msg.user === userName
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-2">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100">
                <form onSubmit={sendMessage} className="flex space-x-3">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isConnected ? "Type your message..." : "Connecting..."}
                    className="flex-1 h-12 rounded-2xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
                    disabled={!isConnected}
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim() || !isConnected}
                    className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Sidebar */}
        <div className="w-80 p-4 hidden lg:block">
          <Card className="h-full border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Online Users ({users.length})</span>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {users.length === 0 && isConnected && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">No users online</p>
                    </div>
                  )}
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${user.color} text-white`}>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {user.name === userName ? `${user.name} (You)` : user.name}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Circle className="h-2 w-2 text-green-500 fill-current" />
                          <span className="text-xs text-gray-500">Online</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
