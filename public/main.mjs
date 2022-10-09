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

const initgame = $("#initgame");
const startgame = $("#startgame");
const createroom = $("#createroom");
const startgameoptions = $("#startgame-options");
const gameoptions = $(".game-option");
const stopcreateroom = $("#stopcreateroom");
const joingame = $("#joingame");
const joingameoptions = $("#joingame-options");
const joinroom = $("#joinroom");
const stopjoinroom = $('#stopjoinroom');
const gamearea = $("#gamearea");
const boardarea = $("#boardarea");
const mytimeel = $("#mytime");
const opponenttimeel = $("#opponenttime");
const leaverooms = $(".leaveroom");

function setInitGameState(state,event){
  if (event != undefined) event.stopPropagation();
  initgame.removeClass();
  initgame.addClass(state);
}

function fetchBoard(board,col,afterfetch) {
  fetch('/game/'+board+'/'+col)
  .then((response) => {
    return response.text();
  })
  .then((html) => {
    boardarea.append(html);
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
  setInitGameState('state-waitingarea');
}

function setupgame() {
  myroom = socket.room;
  updateroomnumber();
  console.log('game is joined');
  setInitGameState('state-gamearea');

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

  socket.on('playerleft',function(player){
    console.log('player ', player, ' left your room.')
    alert('player ' + player.toString() + ' left your room.');
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
    resetClasses();
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

function leaveaction() {
  console.log('game to be/is closed');
  boardarea.empty();
  setInitGameState('state-home');
}

startgame.click(function(e){setInitGameState('state-startgame',e)});

function getStartGameOption(name){
  return $('#startgame-options input[name="'+name+'"]:checked').val();
}

createroom.click(function(){
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
      socket = io();
      socket.emit('createroom', data['room'], 'user-1', getStartGameOption('colour'), getStartGameOption('surface'));
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

stopcreateroom.click(function(e){setInitGameState('state-home',e)});

joingame.click(function(e){setInitGameState('state-joingame',e)});

joinroom.click(function () {
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
});

stopjoinroom.click(function(e){setInitGameState('state-home',e)});

function resetClasses(){
  $('.candidatemove').off( "click");
  $('.piecechosen').removeClass('piecechosen');
  $('.candidatemove').removeClass('candidatemove');
  for (var i=0; i<8; i+=1){
    for (var j=0; j<8; j+=1){
      const c = 'tocapture-'+String.fromCharCode(65+i)+(1+j).toString();
      $('.'+c).removeClass(c);
    }
  }
}

function listenMoveMade(){
  $('.cell').click(function (e) {
    e.stopPropagation();
    resetClasses();
    if ($(this).hasClass('mypiece')) {
      console.log('is my move?', mymove)
      if (mymove) {
        currentpiece = $(this).attr('id');
        console.log('move from ',currentpiece)
        makeMove(currentpiece);
      }
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

leaverooms.click(function () {
  socket.emit('leaveroom',myroom,myplayerid);
  socket.on('leaveacknowledged', function() {
    leaveaction();
  });
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