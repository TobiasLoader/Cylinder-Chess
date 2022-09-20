class TimeFormat {
  constructor(min, sec, inc) {
    this.min = min;
    this.sec = sec;
    this.mil = 0;
    this.inc = inc;
    this.current_mil = 1000 * (60 * min + sec);
  }
  print() {
    console.log(this.min, this.sec, this.mil, this.inc, this.current_mil);
  }
  printPretty() {
    const m = Math.floor(this.current_mil / 60000);
    const s = Math.floor((this.current_mil / 1000) - m);
    console.log(m + ":" + s);
  }
  updateTime(movetime) {
    this.current_mil -= movetime;
  }
}

var socket;
var mymove = false;
var myroom = 0;
var myplayerid = 0;
var opponentid = 0;
var mytime = new TimeFormat(5, 0, 0);
var opponenttime = new TimeFormat(5, 0, 0);
var mymovemillis = 0;

const startgame = document.getElementById("startgame");
const joingame = document.getElementById("joingame");
const gamearea = document.getElementById("gamearea");
const closegame = document.getElementById("closegame");

function updateroomnumber() {
  const rooms = document.getElementsByClassName("room");
  for (var i = 0; i < rooms.length; i += 1) {
    rooms[i].innerText = "ROOM ID: " + myroom.toString();
  }
}

function logsocketresponses() {
  socket.on('error', (msg) => {
    console.log('error: ' + msg);
  });
}

function waitingroom() {
  myroom = socket.room;
  updateroomnumber();
  console.log('waiting room is joined');
  startgame.style.display = 'none';
  joingame.style.display = 'none';
  document.getElementById("roomnum").style.display = 'none';
  document.getElementById("waitingarea").style.display = 'block';
  gamearea.style.display = 'none';
}

function begingame() {
  myroom = socket.room;
  updateroomnumber();
  console.log('game is joined');
  startgame.style.display = 'none';
  joingame.style.display = 'none';
  document.getElementById("roomnum").style.display = 'none';
  document.getElementById("waitingarea").style.display = 'none';
  gamearea.style.display = 'block';

  socket.on('playerid', (id) => {
    myplayerid = id;
    opponentid = 3 - id;
    console.log('my player id: ' + id);
    gameplay(socket);
  });
}

function gameplay() {
  console.log('gameplay begun');
  socket.on('time', function (time) {
    mytime = time[myplayerid];
    opponenttime = time[opponentid];
  });
  socket.on('play', function () {
    console.log('received play command');
    onmymove();
  });
  socket.on('boardmove', function (move, time) {
    console.log('move played on board', move);
    time[myplayerid].print();
    console.log('-----');
    document.getElementById('movemade').innerText = 'move: ' + move.toString();
  });
}

function onmymove() {
  mymove = true;
  gamearea.style.background = 'rgb(200, 100, 100)';
  gamearea.style.color = 'rgb(255, 255, 255)';
  mymovemillis = Date.now();
}
function offmymove() {
  mymove = false;
  gamearea.style.background = 'rgb(255, 255, 255)';
  gamearea.style.color = 'rgb(0, 0, 0)';
}

function closeaction() {
  console.log('game to be/is closed');
  startgame.style.display = 'block';
  joingame.style.display = 'block';
  document.getElementById("roomnum").style.display = 'block';
  document.getElementById("waitingarea").style.display = 'none';
  gamearea.style.display = 'none';
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
          console.log('socket is joined')
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
  if (socket == undefined) {
    socket = io();
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
  }
});

gamearea.addEventListener("click", function () {
  console.log('my move: ' + mymove.toString())
  if (mymove) {
    console.log('move made by me');
    const movetime = Date.now() - mymovemillis;
    mytime.updateTime(movetime);
    mytime.printPretty();
    socket.emit('move', Math.random(), myroom, myplayerid, {
      myplayerid: mytime,
      opponentid: opponenttime
    }
    );
    offmymove();
  }
});

closegame.addEventListener("click", function () {
  socket.emit('end');
  closeaction();
});