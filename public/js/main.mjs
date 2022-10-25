import {strPrettyTimeFormat, updateTimeTimeFormat, updateAfterMove, setToZero } from './time.mjs';
import {initBoard, resizeCylinderBoard, resizeSquareBoard, moveMade, resultMovePieces} from './game.mjs';
import {GameState} from './gamestate.mjs';

export const localstate = new GameState();

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
const mainpopup = $('#main > .popup .popupcontent');
const popupcrosses = $('.popupcross');

function setInitState(state,event){
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
    rooms[i].innerText = "ROOM ID: " + localstate.myroom.toString();
  }
}

function updatetimeHTML() {
  mytimeel.text("ME: " + strPrettyTimeFormat(localstate.mytime));
  opponenttimeel.text("OP: " + strPrettyTimeFormat(localstate.opponenttime));
}

function updateMyTime(endmove){
  if (endmove) updateAfterMove(localstate.mytime, Date.now() - localstate.mymovemillis);
  else updateTimeTimeFormat(localstate.mytime, Date.now() - localstate.mymovemillis);
  if (localstate.mytime.current_mil < 0) {
    localstate.mytime = setToZero(localstate.mytime);
    localstate.socket.emit('outoftime', localstate.myroom, localstate.myplayerid);
  }
  updatetimeHTML();
  localstate.mymovemillis = Date.now();
}

function updateOpTime(){
  updateTimeTimeFormat(localstate.opponenttime, Date.now() - localstate.opmovemillis);
  updatetimeHTML();
  localstate.opmovemillis = Date.now();
}

function logsocketresponses() {
  localstate.socket.on('error', (msg) => {
    console.log('error: ' + msg);
  });
}

function waitingroom() {
  localstate.myroom = localstate.socket.room;
  updateroomnumber();
  console.log('waiting room is joined');
  setInitState('state-waitingarea');
}

function setupgame() {
  localstate.myroom = localstate.socket.room;
  console.log(localstate);
  updateroomnumber();
  console.log('game is joined');
  setInitState('state-gamearea');

  localstate.socket.on('setup', (id, board, col, time) => {
    localstate.boardtype = board;
    localstate.myplayerid = id;
    localstate.opponentid = 3 - id;
    localstate.mycolour = col;
    console.log(localstate.mycolour)
    console.log('my player id: ' + id);
    localstate.mytime = time[localstate.myplayerid];
    localstate.opponenttime = time[localstate.opponentid];
    fetchBoard(localstate.boardtype,localstate.mycolour,begingame);
  });

  localstate.socket.on('victory',function(player,msg){
    if (!localstate.gameover){
      popUpGameOver();
      gameOver();
      if (player==3-localstate.myplayerid && msg=='ran out of time') localstate.opponenttime = setToZero(localstate.opponenttime)
      if (player==localstate.myplayerid)  {
        mainpopup.append('<h2>VICTORY!</h2><p>Your opponent ' + msg+'</p>');
        gameovermsg.append('VICTORY!');
      }
      else if (player==3-localstate.myplayerid)  {
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
  initBoard(localstate.boardtype,localstate.mycolour);
  localstate.socket.emit('ready',localstate.myroom);
  localstate.socket.on('roomready', function () {
    console.log('room ready');
    gameplay();
  });
}

function gameplay() {
  localstate.mymovemillis = Date.now();
  localstate.opmovemillis = Date.now();
  localstate.mytimerticking = setInterval(function(){if (!localstate.gameover && localstate.mymove) updateMyTime(false)},1000);
  localstate.optimerticking = setInterval(function(){if (!localstate.gameover && !localstate.mymove) updateOpTime()},1000);

  console.log('gameplay begun');
  localstate.socket.on('play', function () {
    console.log('received play command');
    onmymove();
  });
  localstate.socket.on('boardmove', function (movedata, time) {
    resultMovePieces(localstate.mycolour,movedata);
    resetClasses();
    localstate.mytime = time[localstate.myplayerid];
    localstate.opponenttime = time[localstate.opponentid];
    $('#movemade').text('move: from ' + movedata['from'] + ', to ' + movedata['to']);
    localstate.movehistory.push(movedata);
    console.log('move played on board', movedata);
    console.log(strPrettyTimeFormat(time[localstate.myplayerid]), strPrettyTimeFormat(time[localstate.opponentid]));
    console.log('-----');
  });
}

function onmymove() {
  localstate.mymove = true;
  gamearea.addClass('mymove');
  localstate.mymovemillis = Date.now();
  console.log(localstate.inCheck(localstate.boardpiecemap));
  localstate.findValidMoves();
  if (localstate.inCheckmate()) localstate.socket.emit('checkmate',localstate.myroom,localstate.myplayerid);
  else listenMoveMade();
}
function offmymove() {
  $('.mypiece').off('click');
  localstate.mymove = false;
  gamearea.removeClass('mymove');
  localstate.opmovemillis = Date.now();
}

function popUpGameOver(){
  $('#endgamerow').addClass('gameover');
  main.addClass('popup-active');
}

function gameOver(){
  localstate.gameover = true;
  localstate.mymove = false;
  offmymove();
  resetClasses();
  clearInterval(localstate.mytimerticking);
  clearInterval(localstate.optimerticking);
}

function leaveaction() {
  gameOver();
  localstate.resetgamestate();
  boardarea.empty();
  gameovermsg.empty();
  mainpopup.empty();
  $('#endgamerow').removeClass('gameover');
  setInitState('state-home');
  console.log('left room');
}

startbutton.click(function(e){setInitState('state-startgame',e)});

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
      localstate.socket = io();
      localstate.socket.emit('createroom', data['room'], 'user-1', getStartGameOption('colour'), getStartGameOption('time'), getStartGameOption('surface'));
      localstate.socket.emit('join', data['room']);
      logsocketresponses();
      localstate.socket.on('status', (msg) => {
        if (msg == 'joined') {
          console.log('socket is joined')
          localstate.socket.room = data['room'];
          waitingroom();
          localstate.socket.on('status', (msg) => {
            if (msg == 'full') setupgame();
          });
        }
      });
      localstate.socket.on('kick', function() {
        console.log('kicked');
        setInitState('state-home');
        localstate.socket.emit('disconnect');
      });
    }
  });
});

stopcreateroom.click(function(e){setInitState('state-home',e)});

joinbutton.click(function(e){setInitState('state-joingame',e)});

joinroom.click(function () {
  localstate.socket = io();
  var roomnum = Number.parseInt(document.getElementById('roomnum').value);
  if (roomnum != undefined && roomnum >= 1000) localstate.socket.emit('join', roomnum);
  logsocketresponses();
  localstate.socket.on('status', (msg) => {
    if (msg == 'joined') {
      console.log('joined')
      localstate.socket.room = roomnum;
      setupgame();
    }
  });
});

stopjoinroom.click(function(e){setInitState('state-home',e)});

function resetClasses(){
  $('.validcandidate').off( "click");
  $('.piecechosen').removeClass('piecechosen');
  $('.validcandidate').removeClass('validcandidate');
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
      console.log('is my move?', localstate.mymove)
      if (localstate.mymove) {
        localstate.currentpiece = $(this).attr('id');
        console.log('move from ',localstate.currentpiece)
        makeMove(localstate.currentpiece);
      }
    }
  });
}

async function makeMove(frompos){
  var m = {};
  // localstate.startedmove = true;
  await moveMade(frompos).then((movedata)=>{m = movedata});
  updateMyTime(true);
  const newtimeobject = {};
  newtimeobject[localstate.myplayerid] = localstate.mytime;
  newtimeobject[localstate.opponentid] = localstate.opponenttime;
  localstate.socket.emit('move', m, localstate.myroom, localstate.myplayerid, newtimeobject);
  offmymove();
}

popupcrosses.click(function(){main.removeClass('popup-active');})

resigngame.click(function(){
  localstate.socket.emit('resign',localstate.myroom,localstate.myplayerid);
});

leaveroom.click(function () {
  localstate.socket.emit('leaveroom',localstate.myroom,localstate.myplayerid);
  localstate.socket.on('leaveserverconfirm', function() {
    localstate.socket.emit('leaveclientconfirm');
    popUpGameOver();
  });
  localstate.socket.on('leaveacknowledged', function() {
    leaveaction();
  });
});

leavewaitingroom.click(function(){
  localstate.socket.emit('destroyroom',localstate.myroom,localstate.myplayerid);
});


$(window).on('resize',function(){
  if (localstate.boardtype=='cylinder') resizeCylinderBoard();
  if (localstate.boardtype=='square') resizeSquareBoard();
});
