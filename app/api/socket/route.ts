import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"

interface User {
  id: string
  name: string
  room: string
  color: string
}

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
  color: string
}

const users: Map<string, User> = new Map()
const rooms: Map<string, Set<string>> = new Map()

const userColors = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-red-500",
]

let io: SocketIOServer

export async function GET() {
  return new Response("Socket.IO server is running", { status: 200 })
}

// This will be called by Next.js when the API route is accessed
export const dynamic = "force-dynamic"

if (!global.io) {
  const httpServer = new HTTPServer()
  global.io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  global.io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("join-room", ({ room, user }) => {
      socket.join(room)

      // Assign a color to the user
      const colorIndex = Array.from(users.values()).filter((u) => u.room === room).length % userColors.length
      const userColor = userColors[colorIndex]

      const userData: User = {
        id: socket.id,
        name: user,
        room: room,
        color: userColor,
      }

      users.set(socket.id, userData)

      if (!rooms.has(room)) {
        rooms.set(room, new Set())
      }
      rooms.get(room)?.add(socket.id)

      // Send updated user list to room
      const roomUsers = Array.from(users.values()).filter((u) => u.room === room)
      global.io.to(room).emit("users-update", roomUsers)

      // Notify others that user joined
      socket.to(room).emit("user-joined", { user })

      console.log(`${user} joined room ${room}`)
    })

    socket.on("message", ({ room, user, message }) => {
      const userData = users.get(socket.id)
      const messageData: Message = {
        id: Date.now().toString() + socket.id,
        user,
        message,
        timestamp: new Date(),
        color: userData?.color || "bg-gray-500",
      }

      global.io.to(room).emit("message", messageData)
      console.log(`Message in ${room} from ${user}: ${message}`)
    })

    socket.on("disconnect", () => {
      const userData = users.get(socket.id)
      if (userData) {
        const { room, name } = userData

        // Remove user from room
        rooms.get(room)?.delete(socket.id)
        users.delete(socket.id)

        // Send updated user list to room
        const roomUsers = Array.from(users.values()).filter((u) => u.room === room)
        global.io.to(room).emit("users-update", roomUsers)

        // Notify others that user left
        socket.to(room).emit("user-left", { user: name })

        console.log(`${name} left room ${room}`)
      }
      console.log("User disconnected:", socket.id)
    })
  })

  io = global.io
}

declare global {
  var io: SocketIOServer | undefined
}
