import { TimeFormat } from './time.mjs';

const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static('public'))

app.get('/favicon', (req, res) => {
    res.sendFile('favicon.ico');
})

var gameid = 1000;
var gamehost = {};
var numplayers = {};
var roomsockets = {};
var roomtimes = {};

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
        }
        res.writeHead(200);
        res.end(Buffer.from(JSON.stringify(body)));
    });
});

io.sockets.on('connection', function (socket) {
    console.log('socket initiated');

    socket.on('createroom', function (room, user) {
        console.log('room ' + room.toString() + ' created by ' + user);
        gamehost[room] = user;
        roomsockets[room] = {};
        roomtimes[room] = {
            1: new TimeFormat(5, 0, 0),
            2: new TimeFormat(5, 0, 0)
        };
    });
    socket.on('join', function (room) {
        if (gamehost[room] == undefined) {
            socket.emit('error', 'game doesn\'t exist')
        } else {
            if (numplayers[room] == undefined || numplayers[room] < 2) {
                socket.join(room);
                socket.room = room;
                if (numplayers[room] == undefined) {
                    numplayers[room] = 1;
                } else {
                    numplayers[room] += 1;
                }
                roomsockets[room][numplayers[room]] = socket;
                console.log('joined room ' + room.toString())
                console.log('there are now ' + numplayers[room] + ' players')
                socket.emit('status', 'joined');
                if (numplayers[room] == 2) {
                    io.sockets.in(room).emit('status', 'full');
                    io.sockets.in(room).emit('time', roomtimes[room]);
                    roomsockets[room][1].emit('playerid', 1);
                    roomsockets[room][2].emit('playerid', 2);
                    roomsockets[room][1].emit('play');
                }
            } else {
                socket.emit('error', 'the room is already full, you cannot join')
            }
        }
    });

    socket.on('move', function (move, room, player, time) {
        roomtimes[room] = time;
        console.log(roomtimes[room])
        roomtimes[room][1].print();
        roomtimes[room][2].print();
        console.log('move', move, room, player);
        io.sockets.in(room).emit('boardmove', move, roomtimes[room]);
        roomsockets[room][3 - player].emit('play');
    });

    socket.on('end', function () {
        console.log('disconnect');
        socket.disconnect(0);
    });
});

server.listen(3000);