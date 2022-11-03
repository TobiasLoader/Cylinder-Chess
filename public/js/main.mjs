// ul#roomsize.game-option
//   +gameoption('roomsize-2','roomsize','room size 2','2',true)
//   +gameoption('roomsize-3','roomsize','room size 3','3',false)

import {strPrettyTimeFormat, updateTimeTimeFormat, updateAfterMove, setToZero } from './time.mjs';
import {initBoard, resizeCylinderBoard, resizeSquareBoard, moveMade, resultMovePieces} from './game.mjs';
import {GameState} from './gamestate.mjs';

export const localstate = new GameState();

const body = $("body");
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
const sharebutton = $("#sharebutton");
const backsharearea = $("#backsharearea");
const copytexts = $(".copytext");
const boardarea = $("#boardarea");
const leavewaitingroom = $("#leavewaitingroom");
const leaveroom = $("#leaveroom");
const offerdraw = $("#offerdraw");
const acceptdraw = $("#acceptdraw");
const resigngame = $("#resigngame");
const offerrematch = $("#offerrematch");
const acceptrematch = $("#acceptrematch");

const gameovermsg =  $('#gameovermsg');
const drawoffersent =  $('#drawoffersent');
const generalpopup = $('#generalpopup .popupcontent');
const boardpopup = $('#boardpopup .popupcontent');
const popups = $('.popup .popupcontent')
const popupcrosses = $('.popupcross');

function setInitState(state,event){
  if (event != undefined) event.stopPropagation();
  main.removeClass();
  main.addClass(state);
  if (state == 'state-gamearea') body.addClass('ingame');
  else if (body.hasClass('ingame')) body.removeClass('ingame');
}

function setInGameState(state){
  gamearea.removeClass();
  if (state!=undefined) gamearea.addClass(state);
}

function fetchBoard(board,col,afterfetch) {
  fetch('/game/'+board+'/'+col)
  .then((response) => {
    return response.text();
  })
  .then((html) => {
    boardarea.prepend(html);
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
  $("#mytime").text(strPrettyTimeFormat(localstate.mytime));
  $("#opponenttime").text(strPrettyTimeFormat(localstate.opponenttime));
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
function waitingroom() {
  updateroomnumber();
  console.log('waiting room is joined');
  setInitState('state-waitingarea');
}

function listensocket(){
  localstate.socket.on('setup', (id, board, col, time, showmoves) => {
    localstate.boardtype = board;
    localstate.myplayerid = id;
    localstate.opponentid = 3 - id;
    localstate.mycolour = col;
    localstate.showmoves = showmoves;
    console.log('my player id: ' + id);
    localstate.mytime = time[localstate.myplayerid];
    localstate.opponenttime = time[localstate.opponentid];
    fetchBoard(localstate.boardtype,localstate.mycolour,begingame);
  });
  
  // localstate.socket.on('status', (msg, room) => {
  //   if (msg == 'joined') {
  //     console.log('joined')
  //     localstate.socket.room = room;
  //     setupgame();
  //   }
  // });
  
  localstate.socket.on('joined', (room) => {
    console.log('socket joined');
    localstate.myroom = room;
  });
  
  localstate.socket.on('roomstatus', (fullstatus) => {
    console.log('room status: ' + fullstatus)
    if (fullstatus == 'not full') waitingroom();
    else if (fullstatus == 'full') setupgame();
  });
  
  localstate.socket.on('kick', function() {
    console.log('kicked');
    setInitState('state-home');
    localstate.socket.emit('disconnect');
  });
  
  localstate.socket.on('error', (msg) => {
    console.log('error: ' + msg);
    if (msg == 'nosuchroom') popUpNoSuchRoom();
    if (msg == 'roomabandoned') popUpRoomAbandoned();
    if (msg == 'roomfull') popUpRoomFull();
  });
  
  localstate.socket.on('roomready', function () {
    console.log('room ready');
    setInGameState('playstate');
    gameplay();
  });
  
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
    $('.prevmove').remove();
    $('#'+movedata['from']).prepend('<div class="prevmove"></div>');
    $('#'+movedata['to']).prepend('<div class="prevmove"></div>');
    console.log('-----');
  });
  
  localstate.socket.on('drawoffer', function () {
    setInGameState('drawreceived')
    localstate.drawopen = true;
  });
  localstate.socket.on('drawdeclined', function () {
    setInGameState('playstate')
    localstate.drawopen = false;
  });
  localstate.socket.on('rematchoffer', function () {
    setInGameState('rematchreceived')
    localstate.rematchopen = true;
  });
  localstate.socket.on('rematchdeclined', function () {
    setInGameState('gameover')
    localstate.rematchopen = false;
  });
  
  localstate.socket.on('victory',function(player,wintitle,winmsg,losetitle,losemsg){
    if (!localstate.gameover){
      popUpGameOver();
      gameOver();
      console.log(player,wintitle,winmsg,losetitle,losemsg);
      console.log(player==3-localstate.myplayerid);
      if (player==localstate.myplayerid) {
        boardpopup.append('<h2>'+wintitle+'</h2><p>'+winmsg+'</p>');
        gameovermsg.append('VICTORY!');
      }
      else if (player==3-localstate.myplayerid)  {
        boardpopup.append('<h2>'+losetitle+'</h2><p>'+losemsg+'</p>');
        gameovermsg.append('DEFEAT');
        if (losetitle=='Out of Time!') {
          localstate.opponenttime = setToZero(localstate.opponenttime);
        }
      }
      else {
        // boardpopup.append('<h2>Player ' + player + ' won!</h2><p>Their opponent ' + msg+'</p>');
        // gameovermsg.append('Player ' + player + ' won');
      }
    }
  });
  
  localstate.socket.on('draw',function(player,title,msg){
    if (!localstate.gameover){
      popUpGameOver();
      gameOver();
      boardpopup.append('<h2>'+title+'</h2><p>'+msg+'</p>');
      gameovermsg.append('DRAW!');
    }
  });
  
  localstate.socket.on('rematch',function(time){
    console.log('rematch start process');
    localstate.resetingamestate();
    localstate.rematchchange(time);
    gameovermsg.empty();
    boardarea.find('#commonboard').remove();
    // $('.capturearea').empty();
    // $('.piece').remove();
    // $('.mypiece').removeClass('mypiece');
    fetchBoard(localstate.boardtype,localstate.mycolour,begingame);
  });
  
  localstate.socket.on('leaveserverconfirm', function() {
    localstate.socket.emit('leaveclientconfirm');
    popUpGameOver();
  });
  
  localstate.socket.on('leaveacknowledged', function() {
    leaveaction();
  });
}

function setupgame() {
  updateroomnumber();
  console.log('game is joined');
  setInitState('state-gamearea');
  setInGameState('playstate');
}

function begingame(){
  updatetimeHTML();
  initBoard(localstate.boardtype,localstate.mycolour);
  localstate.socket.emit('ready',localstate.myroom);
}

function gameplay() {
  localstate.mymovemillis = Date.now();
  localstate.opmovemillis = Date.now();
  localstate.mytimerticking = setInterval(function(){if (!localstate.gameover && localstate.mymove) updateMyTime(false)},1000);
  localstate.optimerticking = setInterval(function(){if (!localstate.gameover && !localstate.mymove) updateOpTime()},1000);
  console.log('gameplay begun');
}

function onmymove() {
  localstate.mymove = true;
  body.addClass('mymove');
  localstate.mymovemillis = Date.now();
  localstate.findValidMoves();
  const meincheck = localstate.meInCheck();
  console.log('me in check ' + meincheck);
  if (meincheck){
    console.log(localstate.myKing());
    $('#'+localstate.myKing()).prepend('<div class="incheck"></div>');
  }
  if (localstate.noValidMoves()){
    if (meincheck)
      localstate.socket.emit('checkmate',localstate.myroom,localstate.myplayerid);
    else
      localstate.socket.emit('stalemate',localstate.myroom,localstate.myplayerid);
  }
  else listenMoveMade();
}
function offmymove() {
  $('.mypiece').off('click');
  $('.incheck').remove();
  $('.prevmove').remove();
  localstate.mymove = false;
  body.removeClass('mymove');
  localstate.opmovemillis = Date.now();
}

function popUpGameOver(){
  setInGameState('gameover');
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
  localstate.resetstate();
  $('#timerow').remove();
  boardarea.find('#commonboard').remove();
  gameovermsg.empty();
  boardpopup.empty();
  setInGameState();
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
    body: JSON.stringify({ 'request': 'init_room' })
  }).then(function (response) {
    return response.text();
  }).then(function (data) {
    console.log('startgame body:');
    data = JSON.parse(data.toString());
    console.log(data);
    if (data['request'] == 'init_room') {
      localstate.socket = io();
      localstate.socket.emit('createroom', data['room'], 'user-1', getStartGameOption('colour'), getStartGameOption('time'), getStartGameOption('surface'),getStartGameOption('showmoves'));
      localstate.socket.emit('join', data['room']);
      listensocket();
    }
  });
});

stopcreateroom.click(function(e){setInitState('state-home',e)});

joinbutton.click(function(e){setInitState('state-joingame',e)});

joinroom.click(function () {
  localstate.socket = io();
  var roomnum = Number.parseInt(document.getElementById('roomnum').value);
  if (roomnum != undefined && roomnum >= 1000) localstate.socket.emit('join', roomnum);
  listensocket();
});

stopjoinroom.click(function(e){setInitState('state-home',e)});

function resetClasses(){
  $('.validcandidate').off( "click");
  $('.piecechosen').removeClass('piecechosen');
  $('.validcandidate').removeClass('validcandidate');
  $('.capturecandidate').removeClass('capturecandidate');
  $('.silhouette').remove();
  $('.replacepiecehighlight').remove();

  // for (var i=0; i<8; i+=1){
  //   for (var j=0; j<8; j+=1){
  //     const c = 'tocapture-'+String.fromCharCode(65+i)+(1+j).toString();
  //     $('.'+c).removeClass(c);
  //   }
  // }
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
  if (localstate.drawopen) localstate.socket.emit('declinedraw',localstate.myroom);
  localstate.socket.emit('move', m, localstate.myroom, localstate.myplayerid, newtimeobject);
  offmymove();
}

function popUpNoSuchRoom(){
  generalpopup.append('<h2>OH NOES!</h2><p>No such room exists. Please try a different room id, or start a new game.</p>');
  main.addClass('popup-active');
}
function popUpRoomAbandoned(){
  generalpopup.append('<h2>OH NOES!</h2><p>The room you tried to enter was abandoned. A game happened here but one (or both) players have left.</p>');
  main.addClass('popup-active');
}
function popUpRoomFull(){
  generalpopup.append('<h2>OH NOES!</h2><p>The room is at full capacity. Sorry you can\'t enter.</p>');
  main.addClass('popup-active');
}

popupcrosses.click(function(){
  popups.empty();
  main.removeClass('popup-active');
});

offerdraw.click(function(){
  localstate.socket.emit('drawoffer',localstate.myroom,localstate.myplayerid);
  setInGameState('drawsent');
  localstate.drawopen = true;
});

acceptdraw.click(function(){
  localstate.socket.emit('drawaccept',localstate.myroom,localstate.myplayerid);
  localstate.drawopen = false;
});

resigngame.click(function(){
  localstate.socket.emit('resign',localstate.myroom,localstate.myplayerid);
});

offerrematch.click(function(){
  localstate.socket.emit('rematchoffer',localstate.myroom,localstate.myplayerid);
  setInGameState('rematchsent');
  localstate.rematchopen = true;
});

acceptrematch.click(function(){
  localstate.socket.emit('rematchaccept',localstate.myroom,localstate.myplayerid);
  localstate.rematchopen = false;
});

leaveroom.click(function () {
  localstate.socket.emit('leaveroom',localstate.myroom,localstate.myplayerid);
});

leavewaitingroom.click(function(){
  localstate.socket.emit('destroyroom',localstate.myroom,localstate.myplayerid);
});

async function tryWebShare(){
  if (navigator.share) {
    try {
      await navigator.share({
        title: "CylinderChess.com",
        url: 'cylinderchess.com'
      });
      console.log("Data was shared successfully");
    } catch (err) {
      console.error("Share failed:", err.message);
    }
  } else {
    setInitState('state-sharearea');
  }
}

sharebutton.click(function(){
  tryWebShare();
})

copytexts.click(function(){
  navigator.clipboard.writeText($(this).children('p').text());
  $('#sharearea .titlebanner').text('thank you!');
});

backsharearea.click(function(){
  setInitState('state-home');
});

$(window).on('resize',function(){
  if (localstate.boardtype=='cylinder') resizeCylinderBoard();
  if (localstate.boardtype=='square') resizeSquareBoard();
});
