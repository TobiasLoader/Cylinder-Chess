var socket;
var mymove = false;

const startgame = document.getElementById("startgame");
const joingame = document.getElementById("joingame");
const gamearea = document.getElementById("gamearea");
const closegame = document.getElementById("closegame");

function updateroomnumber(socket) {
  const rooms = document.getElementsByClassName("room");
  for (var i = 0; i < rooms.length; i += 1) {
    rooms[i].innerText = "ROOM ID: " + socket.room.toString();
  }
}

function logsocketresponses(socket) {
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
  gameplay(socket);
}

function gameplay(socket) {
  socket.on('play', function (room, player) {
    console.log('received play', room, player);
    onmymove();
  });
  socket.on('move', function (move) {
    console.log('move played on board', move);
  });
}

function onmymove() {
  mymove = true;
  gamearea.style.background = rgb(200, 100, 100);
  gamearea.style.color = rgb(255, 255, 255);
}
function offmymove() {
  mymove = false;
  gamearea.style.background = rgb(255, 255, 255);
  gamearea.style.color = rgb(0, 0, 0);
}

function closeaction() {
  console.log('game to be/is closed');
  document.getElementById("startgame").style.display = 'block';
  document.getElementById("joingame").style.display = 'block';
  document.getElementById("roomnum").style.display = 'block';
  document.getElementById("waitingarea").style.display = 'none';
  document.getElementById("gamearea").style.display = 'none';
}


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
          socket.on('status', (msg) => {
            if (msg == 'full') begingame(socket);
          });
        }
      });
    }
  });
});

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

gamearea.addEventListener("click", function () {
  if (mymove) {
    console.log('move made by me');
    socket.emit('move', Math.random(), room, player);
    offmymove();
  }
});

closegame.addEventListener("click", function () {
  socket.emit('end');
  closeaction();
});