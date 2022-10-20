import {strPrettyTimeFormat, updateTimeTimeFormat, updateAfterMove, setToZero } from './time.mjs';
import {initBoard, initNextMove, moveMade, resultMovePieces} from './game.mjs';

var socket;
var mymove = false;
var gameover = false;
var myroom = 0;
var boardtype = '';
var myplayerid = 0;
var opponentid = 0;
var mytime;
var opponenttime;
var mymovemillis;
var opmovemillis;
var movehistory = [];
var mycolour = '';
var currentpiece = '';
var mytimerticking;
var optimerticking;
var startedmove = false;

const main = $("#main");
const startbutton = $("#startbutton");
const createroom = $("#createroom");
const startgameoptions = $("#startgame-options");
const gameoptions = $(".game-option");
const stopcreateroom = $("#stopcreateroom");
const joinbutton = $("#joinbutton");
const joingameoptions = $("#joingame-options");
const joinroom = $("#joinroom");
const stopjoinroom = $('#stopjoinroom');
const gamearea = $("#gamearea");
const boardarea = $("#boardarea");
const mytimeel = $("#mytime");
const opponenttimeel = $("#opponenttime");
const leavewaitingroom = $("#leavewaitingroom");
const leaveroom = $("#leaveroom");
const resigngame = $("#resigngame");
const gameovermsg =  $('#gameovermsg');
const gameoverpopup = $('#gameoverpopup');
const mainpopup = $('#main > .popup');
const popupcrosses = $('.popupcross');

function setInitGameState(state,event){
  if (event != undefined) event.stopPropagation();
  main.removeClass();
  main.addClass(state);
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

function updatetimeHTML() {
  mytimeel.text("ME: " + strPrettyTimeFormat(mytime));
  opponenttimeel.text("OP: " + strPrettyTimeFormat(opponenttime));
}

function updateMyTime(endmove){
  if (endmove) updateAfterMove(mytime, Date.now() - mymovemillis);
  else updateTimeTimeFormat(mytime, Date.now() - mymovemillis);
  if (mytime.current_mil < 0) {
    mytime = setToZero(mytime);
    socket.emit('outoftime', myroom, myplayerid);
  }
  updatetimeHTML();
  mymovemillis = Date.now();
}

function updateOpTime(){
  updateTimeTimeFormat(opponenttime, Date.now() - opmovemillis);
  updatetimeHTML();
  opmovemillis = Date.now();
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

  socket.on('victory',function(player,msg){
    if (!gameover){
      popUpGameOver();
      gameOver();
      if (player==3-myplayerid && msg=='ran out of time') opponenttime = setToZero(opponenttime)
      if (player==myplayerid)  {
        mainpopup.append('<h2>VICTORY!</h2><p>Your opponent ' + msg+'</p>');
        gameovermsg.append('VICTORY!');
      }
      else if (player==3-myplayerid)  {
        mainpopup.append('<h2>DEFEAT...</h2><p>You ' + msg+'</p>');
        gameovermsg.append('DEFEAT');
      }
      else {
        mainpopup.append('<h2>Player ' + player + ' won!</h2><p>Their opponent ' + msg+'</p>');
        gameovermsg.append('Player ' + player + ' won');
      }
    }
  });
}

function begingame(){
  updatetimeHTML();
  initBoard(boardtype,mycolour);
  socket.emit('ready',myroom);
  socket.on('roomready', function () {
    console.log('room ready');
    gameplay();
  });
}

function gameplay() {
  mymovemillis = Date.now();
  opmovemillis = Date.now();
  mytimerticking = setInterval(function(){if (!gameover && mymove) updateMyTime(false)},1000);
  optimerticking = setInterval(function(){if (!gameover && !mymove) updateOpTime()},1000);

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
  opmovemillis = Date.now();
  initNextMove();
}

function popUpGameOver(){
  resigngame.css('display','none');
  main.addClass('popup-active');
  gameovermsg.css('display','block');
}

function gameOver(){
  gameover = true;
  mymove = false;
  offmymove();
  resetClasses();
  clearInterval(mytimerticking);
  clearInterval(optimerticking);
}

function leaveaction() {
  gameOver();
  boardarea.empty();
  setInitGameState('state-home');
  console.log('left room');
}

startbutton.click(function(e){setInitGameState('state-startgame',e)});

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
      socket.emit('createroom', data['room'], 'user-1', getStartGameOption('colour'), getStartGameOption('time'), getStartGameOption('surface'));
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
      socket.on('kick', function() {
        console.log('kicked');
        setInitGameState('state-home');
        socket.emit('disconnect');
      });
    }
  });
});

stopcreateroom.click(function(e){setInitGameState('state-home',e)});

joinbutton.click(function(e){setInitGameState('state-joingame',e)});

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
  updateMyTime(true);
  const newtimeobject = {};
  newtimeobject[myplayerid] = mytime;
  newtimeobject[opponentid] = opponenttime;
  socket.emit('move', m, myroom, myplayerid, newtimeobject);
  offmymove();
}

popupcrosses.click(function(){main.removeClass('popup-active');})

resigngame.click(function(){
  socket.emit('resign',myroom,myplayerid);
});

leaveroom.click(function () {
  socket.emit('leaveroom',myroom,myplayerid);
  socket.on('leaveserverconfirm', function() {
    socket.emit('leaveclientconfirm');
    popUpGameOver();
  });
  socket.on('leaveacknowledged', function() {
    leaveaction();
  });
});

leavewaitingroom.click(function(){
  socket.emit('destroyroom',myroom,myplayerid);
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