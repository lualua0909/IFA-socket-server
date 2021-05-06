const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
const socket = require("socket.io")
const io = socket(server)
var cors = require('cors')

app.use(cors())

io.on("connection", socket => {
    console.log(socket.id + ' ==== connected')
    //PRIVATE CHATTING CHANNEL
    socket.on('subscribe', function (room) {
        console.log('joining room', room)
        socket.join(room)
    })

    socket.on('send message', function (data) {
        socket.broadcast.to(data.room).emit('private_channel', {
            sender: data.sender,
            message: data.message
        })
    })
})


server.listen(3001, () => console.log("server is running on port 8000"))