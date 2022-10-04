import {strPrettyTimeFormat, updateTimeTimeFormat } from './time.mjs';
import {initBoard, initNextMove, moveMade, resultMovePieces} from './game.mjs';

var socket;
var mymove = false;
var myroom = 0;
var boardtype = '';
var myplayerid = 0;
var opponentid = 0;
var mytime;
var opponenttime;
var mymovemillis = 0;
var movehistory = [];
var mycolour = '';
var currentpiece = '';
var startedmove = false;

const startgame = $("#startgame");
const joingame = $("#joingame");
const gamearea = $("#gamearea");
const mytimeel = $("#mytime");
const opponenttimeel = $("#opponenttime");
const closegame = $("#closegame");

function fetchBoard(board,col,afterfetch) {
  fetch('/game/'+board+'/'+col)
  .then((response) => {
    return response.text();
  })
  .then((html) => {
    gamearea.append(html);
    afterfetch();
  });
}

function updateroomnumber() {
  const rooms = $(".room");
  for (var i = 0; i < rooms.length; i += 1) {
    rooms[i].innerText = "ROOM ID: " + myroom.toString();
  }
}

function updatetime() {
  mytimeel.text("ME: " + strPrettyTimeFormat(mytime));
  opponenttimeel.text("OP: " + strPrettyTimeFormat(opponenttime));
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
  startgame.css('display','none');
  joingame.css('display','none');
  $("#roomnum").css('display','none');
  $("#waitingarea").css('display','block');
  gamearea.css('display','none');
}

function setupgame() {
  myroom = socket.room;
  updateroomnumber();
  console.log('game is joined');
  startgame.css('display','none');
  joingame.css('display','none');
  $("#roomnum").css('display','none');
  $("#waitingarea").css('display','none');
  gamearea.css('display','block');

  socket.on('setup', (id, board, col, time) => {
    boardtype = board;
    myplayerid = id;
    opponentid = 3 - id;
    mycolour = col;
    console.log(mycolour)
    console.log('my player id: ' + id);
    mytime = time[myplayerid];
    opponenttime = time[opponentid];
    fetchBoard(boardtype,mycolour,begingame);
  });
}

function begingame(){
  updatetime();
  initBoard(boardtype,mycolour);
  socket.emit('ready',myroom);
  socket.on('roomready', function () {
    console.log('room ready');
    gameplay();
  });
}

function gameplay() {
  console.log('gameplay begun');
  socket.on('play', function () {
    console.log('received play command');
    onmymove();
  });
  socket.on('boardmove', function (movedata, time) {
    resultMovePieces(mycolour,movedata);
    mytime = time[myplayerid];
    opponenttime = time[opponentid];
    updatetime();
    $('#movemade').text('move: from ' + movedata['from'] + ', to ' + movedata['to']);
    movehistory.push(movedata);
    console.log('move played on board', movedata);
    console.log(strPrettyTimeFormat(time[myplayerid]), strPrettyTimeFormat(time[opponentid]));
    console.log('-----');
  });
}

function onmymove() {
  initNextMove();
  mymove = true;
  gamearea.addClass('mymove');
  mymovemillis = Date.now();
  listenMoveMade();
}
function offmymove() {
  $('.mypiece').off('click');
  mymove = false;
  gamearea.removeClass('mymove');
  initNextMove();
}

function closeaction() {
  console.log('game to be/is closed');
  startgame.css('display','block');
  joingame.css('display','block');
  $("#roomnum").css('display','block');
  $("#waitingarea").css('display','none');
  gamearea.css('display','none');
}

startgame.click(function () {
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
      socket.emit('createroom', data['room'], 'user-1', 'w', 'cylinder');
      socket.emit('join', data['room']);
      logsocketresponses();
      socket.on('status', (msg) => {
        if (msg == 'joined') {
          console.log('socket is joined')
          socket.room = data['room'];
          waitingroom();
          socket.on('status', (msg) => {
            if (msg == 'full') setupgame();
          });
        }
      });
    }
  });
});

joingame.click(function () {
  if (socket == undefined) {
    socket = io();
    var roomnum = Number.parseInt(document.getElementById('roomnum').value);
    if (roomnum != undefined && roomnum >= 1000) socket.emit('join', roomnum);
    logsocketresponses(socket);
    socket.on('status', (msg) => {
      if (msg == 'joined') {
        console.log('joined')
        socket.room = roomnum;
        setupgame();
      }
    });
  }
});

function listenMoveMade(){
  $('.mypiece').click(function () {
    console.log('is my move?', mymove)
    if (mymove) {
      $('.candidatemove').off( "click");
      $('.piecechosen').removeClass('piecechosen');
      $('.candidatemove').removeClass('candidatemove');
      $('*[class^="tocapture-"]').removeClass (function (index, className) {
        return (className.match ('/(^|\s)tocapture-\S+/g') || '');
      });
      currentpiece = $(this).attr('id');
      console.log('move from ',currentpiece)
      var selectednum = 1;
      makeMove(currentpiece);
    }
  });
}

async function makeMove(frompos){
  var m = {};
  startedmove = true;
  await moveMade(frompos).then((movedata)=>{m = movedata});
  console.log('move to be made by me');
  const movetime = Date.now() - mymovemillis;
  updateTimeTimeFormat(mytime, movetime);
  const newtimeobject = {};
  newtimeobject[myplayerid] = mytime;
  newtimeobject[opponentid] = opponenttime;
  socket.emit('move', m, myroom, myplayerid, newtimeobject);
  offmymove();
}

// function cancelMakeMove(frompos){
//   startedmove = false;
//   currentpiece = '';
//   $('.candidatemove').off('click');
//   $('.piecechosen').off('click');
//   $('.piecechosen').removeClass('piecechosen');
//   $('.candidatemove').removeClass('candidatemove');
//   $('.tocapture').removeClass('tocapture');
// }

closegame.click(function () {
  socket.emit('end');
  closeaction();
});

// $(document).click(function(e){
//   console.log(currentpiece)
//   if (startedmove){
//     if ($(e.target).closest(".candidatemove").length === 0 && $(e.target).closest(".piecechosen").length){
//       console.log('canceled');
//       cancelMakeMove(currentpiece);
//       listenMoveMade();
//     }
//   }
// });