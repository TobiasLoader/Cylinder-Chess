var socket;

function updateroomnumber(socket) {
  const rooms = document.getElementsByClassName("room");
  console.log(rooms);
  for (var i = 0; i < rooms.length; i += 1) {
    rooms[i].innerText = "ROOM ID: " + socket.room.toString();
  }
}

function logsocketresponses(socket) {
  // socket.on('capacity', (msg) => {
  //   console.log('capacity: ' + msg);
  // });
  socket.on('error', (msg) => {
    console.log('error: ' + msg);
  });
}

function waitingroom(socket) {
  updateroomnumber(socket);
  console.log('game is joined');
  document.getElementById("startgame").style.display = 'none';
  document.getElementById("joingame").style.display = 'none';
  document.getElementById("roomnum").style.display = 'none';
  document.getElementById("waitingarea").style.display = 'block';
  document.getElementById("gamearea").style.display = 'none';
}

function begingame(socket) {
  updateroomnumber(socket);
  console.log('game is joined');
  document.getElementById("startgame").style.display = 'none';
  document.getElementById("joingame").style.display = 'none';
  document.getElementById("roomnum").style.display = 'none';
  document.getElementById("waitingarea").style.display = 'none';
  document.getElementById("gamearea").style.display = 'block';
}


const startgame = document.getElementById("startgame");
startgame.addEventListener("click", function () {
  fetch("/game_init", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'type': 'init' })
  }).then(function (response) {
    return response.text();
  }).then(function (data) {
    console.log('startgame body:');
    data = JSON.parse(data.toString());
    console.log(data);
    if (data['type'] == 'init') {
      if (socket == undefined) socket = io();
      socket.emit('createroom', data['room'], 'user-1');
      socket.emit('join', data['room']);
      logsocketresponses(socket);
      socket.on('status', (msg) => {
        if (msg == 'joined') {
          console.log('joined')
          socket.room = data['room'];
          waitingroom(socket);
        }
      });
    }
  });
});

const joingame = document.getElementById("joingame");
joingame.addEventListener("click", function () {
  if (socket == undefined) socket = io();
  var roomnum = Number.parseInt(document.getElementById('roomnum').value);
  if (roomnum != undefined && roomnum >= 1000) socket.emit('join', roomnum);
  logsocketresponses(socket);
  socket.on('status', (msg) => {
    if (msg == 'joined') {
      console.log('joined')
      socket.room = roomnum;
      begingame(socket);
    }
  });
});