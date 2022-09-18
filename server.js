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

var gameid = 0;

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
        body['room'] = gameid;
        gameid += 1;
        res.writeHead(200);
        res.end(body);
    });
});

io.sockets.on('connection', function (socket) {
    socket.on('join', function (room) {
        socket.join(room);
        console.log('joined room ' + r0oom.toString())
    });
});
server.listen(3000);