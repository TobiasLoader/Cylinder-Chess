function logsocketresponses(socket) {
  socket.on('capacity', (msg) => {
    console.log('capacity: ' + msg);
  });
  socket.on('error', (msg) => {
    console.log('error: ' + msg);
  });
}

function begingame() {
  console.log('game is joined');
  document.getElementById("startgame").style.display = 'none';
  document.getElementById("joingame").style.display = 'none';
  document.getElementById("roomnum").style.display = 'none';
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
      var socket = io();
      socket.emit('createroom', data['room'], 'user-1');
      socket.emit('join', data['room']);
      logsocketresponses(socket);
      socket.on('status', (msg) => {
        if (msg == 'joined') begingame();
      });
    }
  });
});

const joingame = document.getElementById("joingame");
joingame.addEventListener("click", function () {
  var socket = io();
  var roomnum = Number.parseInt(document.getElementById('roomnum').value);
  if (roomnum != undefined && roomnum >= 1000) socket.emit('join', roomnum);
  logsocketresponses(socket);
  socket.on('status', (msg) => {
    if (msg == 'joined') begingame();
  });
});