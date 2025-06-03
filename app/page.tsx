"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MessageCircle, Plus, ArrowRight } from "lucide-react"

export default function HomePage() {
  const [studentName, setStudentName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateRoom = () => {
    if (!studentName.trim()) return
    const newRoomCode = generateRoomCode()
    router.push(`/chat?room=${newRoomCode}&name=${encodeURIComponent(studentName)}`)
  }

  const handleJoinRoom = () => {
    if (!studentName.trim() || !roomCode.trim()) return
    router.push(`/chat?room=${roomCode.toUpperCase()}&name=${encodeURIComponent(studentName)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Student Chat CRM
          </h1>
          <p className="text-gray-600">Connect and collaborate in real-time</p>
        </div>

        {/* Student Name Input */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Your Identity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter your name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 transition-colors"
            />
          </CardContent>
        </Card>

        {/* Room Actions */}
        <div className="space-y-4">
          {/* Create Room */}
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Create New Room</h3>
                  <p className="text-blue-100 text-sm">Start a new chat session</p>
                </div>
                <Button
                  onClick={handleCreateRoom}
                  disabled={!studentName.trim()}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl h-12 px-6"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <ArrowRight className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-lg">Join Existing Room</h3>
              </div>
              <Input
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="h-12 rounded-xl border-2 border-gray-200 focus:border-green-500 transition-colors"
              />
              <Button
                onClick={handleJoinRoom}
                disabled={!studentName.trim() || !roomCode.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Join Room
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mt-8">
          <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Real-time Chat</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-white/60 backdrop-blur-sm">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">Multi-user Rooms</p>
          </div>
        </div>
      </div>
    </div>
  )
}
