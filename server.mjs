import { TimeFormat, printTimeFormat, readTimeStr } from './public/js/time.mjs';

// Implement the old require function
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

var gameid = 1000;
var gamehost = {};
var numplayers = {};
var roomsockets = {};
var roomuniquegameids = {};
var initroomtimes = {};
var roomtimes = {};
var roomboardtype = {};
var roomplayercolours = {};
var roomshowmoves = {};
var roomreadynum = {};
var roomready = {};
var roomplaying = {};
var roomgamemoves = {};
var roomsocketplayersturn = {}

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

const port = process.env.PORT || 3000;

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
        if (body['request'] == 'init_room') {
            body['room'] = gameid;
            gameid += 1;
        }
        res.writeHead(200);
        res.end(Buffer.from(JSON.stringify(body)));
    });
});
//
// function clientIP(socket){
//     return socket.request.connection.remoteAddress;
// }

function destroyroom(room){
    console.log('destroy room request')
    io.sockets.in(room).emit('kick');
    delete gamehost[room];
    delete numplayers[room];
    delete roomsockets[room];
    delete roomtimes[room];
    delete roomboardtype[room];
    delete roomplayercolours[room];
    delete roomtimes[room];
    delete roomreadynum[room];
    delete roomready[room];
    delete roomuniquegameids[room];
    delete roomgamemoves[room];
    delete roomsocketplayersturn[room];
    // for (const [playerid,sock] of Object.entries(roomsockets[room])){
    //     sock.disconnect(0);
    // }
}

io.sockets.on('connection', function (socket) {
    console.log('socket initiated',socket.id);

    // for (var [room, bool] of Object.entries(roomplaying)){
    //     if (bool){
    //
    //     }
    // }

    socket.on('createroom', function (room, user, colour, timestr, boardtype, showmoves) {
        console.log('room ' + room.toString() + ' created by ' + user);
        gamehost[room] = user;
        roomsockets[room] = {};
        initroomtimes[room] = timestr;
        roomtimes[room] = readTimeStr(timestr);
        roomboardtype[room] = boardtype;
        console.log('showmoves ' + showmoves)
        if (showmoves=='t') roomshowmoves[room] = true;
        else if (showmoves=='f') roomshowmoves[room] = false;
        console.log('showmoves ' + roomshowmoves[room].toString())
        if (colour=='w') roomplayercolours[room] = {1:'w',2:'b'};
        else if (colour=='b') roomplayercolours[room] = {1:'b',2:'w'};
        else if (colour=='r') {
            if (Math.random()<0.5) roomplayercolours[room] = {1:'w',2:'b'};
            else roomplayercolours[room] = {1:'b',2:'w'};
        }
        roomready[room] = false;
        roomuniquegameids[room] = {};
        roomgamemoves[room] = [];
        console.log('reached bottom')
    });

    socket.on('join', function (room, existinguniqueid) {
        // console.log(existinguniqueid!="" && roomuniquegameids[room]!=undefined && Object.values(roomuniquegameids[room]).includes(existinguniqueid))
        // console.log(existinguniqueid)
        // console.log(roomuniquegameids[room])
        // console.log(Object.values(roomuniquegameids[room]))
        // console.log((Object.values(roomuniquegameids[room])).includes(parseInt((existinguniqueid))))
        // console.log(Object.values(roomuniquegameids[room]).includes(parseInt((existinguniqueid))))
        if (gamehost[room] == undefined) {
            socket.emit('error', 'nosuchroom');
        } else if (roomready[room] && !roomplaying[room]){
            socket.emit('error', 'roomabandoned');
        } else if (existinguniqueid!="" && roomuniquegameids[room]!=undefined && (Object.values(roomuniquegameids[room])).includes(parseInt(existinguniqueid))){
            const myid = Object.keys(roomuniquegameids[room])[Object.values(roomuniquegameids[room]).indexOf(parseInt(existinguniqueid))];
            console.log('rejoin',myid,existinguniqueid,room,roomuniquegameids[room]);
            roomsockets[room][myid].leave(room);
            roomsockets[room][myid].emit('kick');
            roomsockets[room][myid] = socket;
            socket.join(room);
            socket.emit('rejoin',room,myid,roomboardtype[room],roomplayercolours[room][myid], roomtimes[room], roomshowmoves[room]);
        } else if (numplayers[room] >= 2) {
            socket.emit('error', 'roomfull')
        } else {                
            socket.join(room);
            socket.room = room;
            if (numplayers[room] == undefined) {
                numplayers[room] = 1;
            } else {
                numplayers[room] += 1;
            }
            roomsockets[room][numplayers[room]] = socket;
            var isunique = false;
            while (!isunique){
                roomuniquegameids[room][numplayers[room]] = 10000+Math.floor(Math.random()*89999);
                isunique=true;
                for (var i=0; i<numplayers[room]; i+=1){
                    if (roomuniquegameids[room][i]==roomuniquegameids[room][numplayers[room]]) {
                        isunique=false;
                        break;
                    }
                }
            }
            console.log('joined room ' + room.toString())
            console.log('there are now ' + numplayers[room] + ' players')
            socket.emit('joined',room);
            if (numplayers[room] == 2) {
                io.sockets.in(room).emit('roomstatus', 'full');
                roomreadynum[room] = 0;
                for (var i=1; i<=2; i+=1)
                    roomsockets[room][i].emit('setup', i, roomboardtype[room],  roomplayercolours[room][i], roomtimes[room], roomshowmoves[room], roomuniquegameids[room][i]);
            } else {
                socket.emit('roomstatus', 'not full');
            }
        }
    });
    
    socket.on('readytoreceiverejoinmoves',function(room, player){
        // console.log('readytoreceiverejoinmoves')
        for (var move of roomgamemoves[room]){
            // console.log(move);
            socket.emit('boardmove', move['movedata'], move['time']);
        }
        // console.log(parseInt(player))
        // console.log(roomsocketplayersturn[room])
        if (roomsocketplayersturn[room]!=undefined && parseInt(player) == roomsocketplayersturn[room]){
            // console.log('play')
            socket.emit('play');
        }
    });

    socket.on('ready', function (room) {
        roomreadynum[room] += 1;
        if (roomreadynum[room]==numplayers[room]) {
            roomready[room] = true;
            roomplaying[room] = true;
            io.sockets.in(room).emit('roomready');
            console.log('all players ready');
            if (roomplayercolours[room][1]=='w') roomsocketplayersturn[room] = 1;
            if (roomplayercolours[room][2]=='w') roomsocketplayersturn[room] = 2;
            roomsockets[room][roomsocketplayersturn[room]].emit('play');
        }
    });

    socket.on('move', function (movedata, room, player, time) {
        roomtimes[room] = time;
        roomgamemoves[room].push({'movedata':movedata,'player':player,'time':time});
        // printTimeFormat(roomtimes[room][1]);
        // printTimeFormat(roomtimes[room][2]);
        console.log('move', movedata, room, player);
        io.sockets.in(room).emit('boardmove', movedata, time);
        console.log(player);
        roomsocketplayersturn[room] = 3 - player;
        roomsockets[room][3 - player].emit('play');
        console.log('play command sent');
    });

    socket.on('outoftime', function (room, player) {
        io.to(room).emit('victory', 3-player, 'You Won!','Your opponent ran out of time.','Out of Time!','Your opponent won because you ran out of time.');
    });

    socket.on('resign', function (room, player) {
        io.to(room).emit('victory', 3-player, 'You Won!','Your opponent resigned the game.','Resigned','Your opponent won because you resigned the game.');
    });

    socket.on('checkmate', function (room, player) {
        io.to(room).emit('victory', 3-player, 'CHECKMATE!', 'You won the game!',  'CHECKMATE!', 'Your opponent won the game because they put you into checkmate. Your king was in check and you had no legal moves.');
    });

    socket.on('stalemate', function (room, player) {
        io.to(room).emit('draw', 3-player, 'STALEMATE!', 'The game was a draw, it ended in a stalemate.');
    });

    socket.on('drawoffer', function (room, player) {
        roomsockets[room][3 - player].emit('drawoffer');
    });

    socket.on('declinedraw', function (room) {
        io.sockets.in(room).emit('drawdeclined');
    });

    socket.on('drawaccept', function (room, player) {
        io.sockets.in(room).emit('draw', 3-player, 'DRAW!', '🤝 The players agreed to a draw.');
    });

    socket.on('rematchoffer', function (room, player) {
        roomsockets[room][3 - player].emit('rematchoffer');
    });

    socket.on('declinerematch', function (room) {
        io.sockets.in(room).emit('rematchdeclined');
    });

    socket.on('rematchaccept', function (room, player) {
        console.log('rematch logic');
        roomtimes[room] = readTimeStr(initroomtimes[room]);
        if (roomplayercolours[room][1]=='w') roomplayercolours[room] = {1:'b',2:'w'};
        else roomplayercolours[room] = {1:'w',2:'b'};
        roomreadynum[room] = 0;
        console.log('rematch server set up done');
        io.sockets.in(room).emit('rematch',roomtimes[room]);
    });

    socket.on('leaveroom', function (room,player) {
        console.log('player ',player,' leave from room ',room);
        if (roomplaying[room]){
            io.sockets.in(room).emit('victory', 3-player, 'You Won!', "Your opponent left the room mid game.", 'You left the room!', 'You forfeit the game.');
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
        numplayers[room] -= 1;
        if (numplayers[room]<=0) destroyroom(room);
    });

    socket.on('destroyroom', function (room) {
        destroyroom(room);
    });

    socket.on('disconnect', function (){
        console.log('disconnect')
        socket.disconnect(0);
    })
});

server.listen(port);
