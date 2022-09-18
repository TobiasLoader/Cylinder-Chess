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
      socket.emit('join', data['room']);
      socket.on('room full', (msg) => {
        console.log('message: ' + msg);
      });
    }
  });
});

const joingame = document.getElementById("joingame");
joingame.addEventListener("click", function () {
  var socket = io();
  var roomnum = Number.parseInt(document.getElementById('room').value);
  if (roomnum != undefined && roomnum >= 1000) socket.emit('join', roomnum);
  socket.on('room full', (msg) => {
    console.log('message: ' + msg);
  });
  // fetch("/join", {
  //   method: "GET",
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ 'type': 'join' })
  // }).then(function (response) {
  //   return response.text();
  // }).then(function (data) {
  //   console.log('joingame body:');
  //   console.log(data);
  // });
});