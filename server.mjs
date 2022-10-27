import { TimeFormat, printTimeFormat } from './public/js/time.mjs';

// Implement the old require function
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

var gameid = 1000;
var gamehost = {};
var numplayers = {};
var roomsockets = {};
var roomtimes = {};
var roomboardtype = {};
var roomplayercolours = {};
var roomready = {};
var roomplaying = {};

const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const pug = require('pug');

app.use(express.static('public'));

app.set('views', './views')
app.set('view engine', 'pug');

const boardfn = pug.compileFile('views/board.pug');
// Render the function
const htmlcylinderwhite = boardfn({ boardtype: 'cylinder', colour: 'w'});
const htmlcylinderblack = boardfn({ boardtype: 'cylinder', colour: 'b'});
const htmlsquarewhite = boardfn({ boardtype: 'square', colour: 'w'});
const htmlsquareblack = boardfn({ boardtype: 'square', colour: 'b'});

app.get('/favicon', (req, res) => {
    res.sendFile('favicon.ico');
})

app.get('/', (req, res) => {
    res.render('index');
})

app.get('/game/cylinder/w', (req, res) => {
    res.send(htmlcylinderwhite);
});
app.get('/game/cylinder/b', (req, res) => {
    res.send(htmlcylinderblack);
})
app.get('/game/square/w', (req, res) => {
    res.send(htmlsquarewhite);
})
app.get('/game/square/b', (req, res) => {
    res.send(htmlsquareblack);
})

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

    socket.on('createroom', function (room, user, colour, timestr, boardtype) {
        console.log('room ' + room.toString() + ' created by ' + user);
        gamehost[room] = user;
        roomsockets[room] = {};
        if (timestr=='u'){
            roomtimes[room] = {
                1: new TimeFormat(true),
                2: new TimeFormat(true)
            };
        } else {
            const timearray = timestr.split('+');
            roomtimes[room] = {
                1: new TimeFormat(false,parseInt(timearray[0]), 0, parseInt(timearray[1])),
                2: new TimeFormat(false,parseInt(timearray[0]), 0, parseInt(timearray[1]))
            };
        }
        roomboardtype[room] = boardtype;
        if (colour=='w') roomplayercolours[room] = {1:'w',2:'b'};
        else if (colour=='b') roomplayercolours[room] = {1:'b',2:'w'};
        else if (colour=='r') {
            if (Math.random()<0.5) roomplayercolours[room] = {1:'w',2:'b'};
            else roomplayercolours[room] = {1:'b',2:'w'};
        }
    });

    socket.on('join', function (room) {
        if (gamehost[room] == undefined) {
            socket.emit('error', 'nosuchroom')
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
                    roomready[room] = 0;
                    for (var i=1; i<=2; i+=1)
                        roomsockets[room][i].emit('setup', i, roomboardtype[room], roomplayercolours[room][i], roomtimes[room]);
                }
            } else {
                socket.emit('error', 'the room is already full, you cannot join')
            }
        }
    });

    socket.on('ready', function (room) {
        roomready[room] += 1;
        if (roomready[room]==numplayers[room]) {
            roomplaying[room] = true;
            io.sockets.in(room).emit('roomready');
            console.log('all players ready');
            if (roomplayercolours[room][1]=='w') roomsockets[room][1].emit('play');
            if (roomplayercolours[room][2]=='w') roomsockets[room][2].emit('play');
        }
    });

    socket.on('move', function (movedata, room, player, time) {
        roomtimes[room] = time;
        printTimeFormat(roomtimes[room][1]);
        printTimeFormat(roomtimes[room][2]);
        console.log('move', movedata, room, player);
        io.sockets.in(room).emit('boardmove', movedata, roomtimes[room]);
        console.log(player);
        // console.log(roomsockets);
        roomsockets[room][3 - player].emit('play');
        console.log('play command sent');
    });

    socket.on('outoftime', function (room, player) {
        io.sockets.in(room).emit('victory', 3-player, 'ran out of time');
    });

    socket.on('resign', function (room, player) {
        io.sockets.in(room).emit('victory', 3-player, 'resigned the game');
    });
    
    socket.on('checkmate', function (room, player) {
        io.sockets.in(room).emit('victory', 3-player, 'got checkmated');
    });

    socket.on('leaveroom', function (room,player) {
        console.log('player ',player,' leave from room ',room);
        if (roomplaying[room]){
            io.sockets.in(room).emit('victory', 3-player, 'left the room');
            socket.emit('leaveserverconfirm');
            socket.on('leaveclientconfirm',function(){
                socket.emit('leaveacknowledged');
                socket.disconnect(0);
            });
        } else {
            socket.emit('leaveacknowledged');
            socket.disconnect(0);
        }
        if (player=='1' || player=='2') roomplaying[room] = false;
    });

    socket.on('destroyroom', function (room) {
        console.log('destroy room request')
        io.sockets.in(room).emit('kick');
        delete gamehost[room];
        delete numplayers[room];
        delete roomsockets[room];
        delete roomtimes[room];
        delete roomboardtype[room];
        delete roomplayercolours[room];
        delete roomtimes[room];
        delete roomready[room];
        // for (const [playerid,sock] of Object.entries(roomsockets[room])){
        //     sock.disconnect(0);
        // }
    });

    socket.on('disconnect', function (){
        console.log('disconnect')
        socket.disconnect(0);
    })
});

server.listen(3000);