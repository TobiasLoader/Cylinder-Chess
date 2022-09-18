const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))
// app.use('/join', express.static('join'))


app.get('/favicon', (req, res) => {
    res.sendFile('favicon.ico');
})

var gameid = 1000;
var numplayers = {};

app.post('/game_init', (req, res) => {
    const { headers, method, url } = req;
    console.log(method, url);
    let body = [];
    req.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        body = JSON.parse(body);
        if (body['type'] == 'init') {
            body['room'] = gameid;
            gameid += 1;
        } else if (body['type'] == 'join') {
            app.use(express.static('public'))
        }
        res.writeHead(200);
        res.end(Buffer.from(JSON.stringify(body)));
    });
});

io.sockets.on('connection', function (socket) {
    console.log('connected');
    socket.on('join', function (room) {
        if (numplayers[room] < 2) {
            socket.join(room);
            socket.room = room;
            if (numplayers[room] == undefined) {
                numplayers[room] = 1;
            } else {
                numplayers[room] += 1;
            }
            console.log('joined room ' + room.toString())
            console.log('there are now ' + numplayers[room] + ' players')
            if (numplayers[room] == 2) {
                io.sockets.in(room).emit('room full', 'true');
            }
        }
    });
});

server.listen(3000);