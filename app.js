const {
  addUser,
  getUser,
  removeUsers,
  getUsersInRoom,
} = require('./users')
const cors = require('cors')
const http = require('http')
const express = require('express')
const router = require('./router')
const socketio = require('socket.io')

// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001 

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(router)
app.use(cors())

io.on('connection', (socket) => {
  //  user join chat room
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room })
    
    if (error)
      return callback(error)

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to the room ${user.room}`})
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!`})
    
    socket.join(user.room)

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

    console.log(`> ${user.name} joined room ${user.room}`)
    callback();
  })

  //  user send message
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)

    io.to(user.room).emit('message', { user: user.name, text: message })
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
    
    callback()
  })

  //  user disconnect
  socket.on('disconnect', () => {
    //  remove user from room
    const user = removeUsers(socket.id)

    if(user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left.` })
    }
    console.log(`> ${user.name} left room ${user.room}`)
  })
})

server.listen(PORT, () => {
  console.log(`Server online : ${PORT}`)
})
