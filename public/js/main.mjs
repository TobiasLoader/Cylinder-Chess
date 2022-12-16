// ul#roomsize.game-option
//   +gameoption('roomsize-2','roomsize','room size 2','2',true)
//   +gameoption('roomsize-3','roomsize','room size 3','3',false)

import {strPrettyTimeFormat, updateTimeTimeFormat, updateAfterMove, setToZero } from './time.mjs';
import {initBoard, resizeCylinderBoard, resizeSquareBoard, moveMade, resultMovePieces, mousecylindrag} from './game.mjs';
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
const aboutbutton = $("#aboutbutton");
const coffeebutton = $("#coffeebutton");
const backsharearea = $("#backsharearea");
const backaboutarea = $("#backaboutarea");
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
const helpbtn = $('#helpbtn');

const audioMove = document.createElement('audio');
audioMove.setAttribute('src', 'assets/move-self.mp3');
const audioCapture = document.createElement('audio');
audioCapture.setAttribute('src', 'assets/capture.mp3');

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
    setInGameState('playstate');
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
  if (localstate.opponenttime.current_mil < 0) {
    localstate.opponenttime = setToZero(localstate.opponenttime);
  }
  updatetimeHTML();
  localstate.opmovemillis = Date.now();
}
function waitingroom() {
  updateroomnumber();
  console.log('waiting room is joined');
  setInitState('state-waitingarea');
}

function setuproom(id, board, col, time, showmoves, fetchboardcallback){
  localstate.boardtype = board;
  localstate.myplayerid = id;
  localstate.opponentid = 3 - id;
  localstate.mycolour = col;
  localstate.showmoves = showmoves;
  localstate.mytime = time[localstate.myplayerid];
  localstate.opponenttime = time[localstate.opponentid];
  fetchBoard(localstate.boardtype,localstate.mycolour,fetchboardcallback);
}

function listensocket(){
  localstate.socket.on('setup', (id, board, col, time, showmoves, uniquegameid) => {
    setCookie('uniquegameid',uniquegameid.toString(),1);
    setuproom(id, board, col, time, showmoves, begingame);
  });
  
  localstate.socket.on('joined', (room) => {
    localstate.myroom = room;
  });
    
  localstate.socket.on('rejoin', function (room, id, board, col, time, showmoves) {
    console.log('have rejoined same room');
    localstate.myroom = room;
    setuproom(id, board, col, time, showmoves, ()=>{
      begingame();
      setupgame();
      localstate.socket.emit('readytoreceiverejoinmoves', room, id);
    });
  });
  
  localstate.socket.on('roomstatus', (fullstatus) => {
    console.log('room status: ' + fullstatus)
    if (fullstatus == 'not full') waitingroom();
    else if (fullstatus == 'full') {
      setupgame();
      setInGameState('noboard');
    }
  });
  
  localstate.socket.on('kick', function() {
    console.log('kicked');
    setInitState('state-home');
    deleteCookie('uniquegameid');
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
    gameplay();
  });
  
  localstate.socket.on('play', function () {
    console.log('received play command');
    onmymove();
  });
  
  localstate.socket.on('boardmove', function (movedata, time) {
    console.log('boardmove')
    if (movedata['capture']) audioCapture.play();
    else audioMove.play();
    resultMovePieces(localstate.mycolour,movedata);
    console.log('moved piece');
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
    $('#timerow').remove();
    gameovermsg.empty();
    boardarea.find('#commonboard').remove();
    setInGameState('noboard');
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
  deleteCookie('uniquegameid');
  // console.log('left room');
}

startbutton.click(function(e){
  audioMove.play();
  setInitState('state-startgame',e)
});

function getStartGameOption(name){
  return $('#startgame-options input[name="'+name+'"]:checked').val();
}

createroom.click(function(){
  audioCapture.play();
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
      localstate.socket.emit('join', data['room'], getCookie('uniquegameid'));
      listensocket();
    }
  });
});

stopcreateroom.click(function(e){setInitState('state-home',e)});

joinbutton.click(function(e){
  audioMove.play();
  setInitState('state-joingame',e)
});

joinroom.click(function () {
  audioCapture.play();
  localstate.socket = io();
  var roomnum = Number.parseInt(document.getElementById('roomnum').value);
  if (roomnum != undefined && roomnum >= 1000) localstate.socket.emit('join', roomnum, getCookie('uniquegameid'));
  listensocket();
});

stopjoinroom.click(function(e){setInitState('state-home',e)});

function resetClasses(){
  $('.validcandidate').off( "click");
  $('.validcandidate').removeClass('validcandidate');
  $('.capturecandidate').removeClass('capturecandidate');
  $('.silhouette').remove();
  $('.replacepiecehighlight').remove();
  $('.piecechosen').remove();
  localstate.currentpiece =  '';
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
    if (localstate.boardtype=='square' || !mousecylindrag){
      const clickchosenpiece = $(this).children('.piecechosen').length > 0;
      resetClasses();
      if (!clickchosenpiece && $(this).hasClass('mypiece')) {
        console.log('is my move?', localstate.mymove)
        if (localstate.mymove) {
          localstate.currentpiece = $(this).attr('id');
          console.log('move from ',localstate.currentpiece)
          makeMove(localstate.currentpiece);
        }
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
  generalpopup.append('<h2>OOPS!</h2><p>No such room exists. Please try a different room id, or start a new game.</p>');
  main.addClass('popup-active');
}
function popUpRoomAbandoned(){
  generalpopup.append('<h2>WHOOPS!</h2><p>The room you tried to enter was abandoned. A game happened here but one (or both) players have left.</p>');
  main.addClass('popup-active');
}
function popUpRoomFull(){
  generalpopup.append('<h2>YIKES!</h2><p>The room is at full capacity. Sorry you can\'t enter.</p>');
  main.addClass('popup-active');
}

function popUpHelp(){
  if ($('#main').hasClass('state-home')){
    generalpopup.append('<h2>Help? -- Main Menu</h2><p>This is the main menu.<br><br>From here you can "Start Game". This allows a player to initiate a new game and choose the configurations they wish (eg. the time format). Once completed, they will enter a "Waiting Room" with a unique room ID. They can share this room ID with their opponent so that they can join the same room. For every game, at least one player must go through this process <br><br>The other button is to "Join Game". This joins a room with a unique room ID (supplied by a player who has already gone through the process of "Start Game").<br><br></p>');
    main.addClass('popup-active');
  } else if ($('#main').hasClass('state-startgame')){
    generalpopup.append('<h2>Help? -- Game Configs</h2><p>Choose your game configurations!<br><br>Player Colour: you have a choice between white, black, or randomised.<br><br>Geometry: both options are topologically equivalent, ie. the A and H files have been effectively glued together. However the player can choose the geometric projection of the board (a 3d cylinder, or a flattened square board)</p>');
    main.addClass('popup-active');
  }  else if ($('#main').hasClass('state-joingame')){
    generalpopup.append('<h2>Help? -- Join Game</h2><p>Type in the room ID of the room you wish to join (if you are not sure you can ask you opponent for theirs, or start a new  game and share that room id with someone).<br><br>Feature coming in the future: randomly match players with similar ELO (so that you could play against people you do not know and you wouldn\'t need to ask them for a room id).</p>');
    main.addClass('popup-active');
  }   else if ($('#main').hasClass('state-aboutarea')){
    generalpopup.append('<h2>Help? -- About</h2><p>Here I\'m just telling you a bit more about me :)<br><br>Also if you\'d like to support me further, you can check out some cool merch I made at:<br>https://www.bagsoflove.co.uk/stores/tobias-loader</p>');
    main.addClass('popup-active');
  } else if ($('#main').hasClass('state-sharearea')){
    generalpopup.append('<h2>Help? -- Share</h2><p>These are the ways you can share cylinderchess.com and spread the word around. You can scan the QR code with a mobile device, and that links to cylinderchess.com :)</p>');
    main.addClass('popup-active');
  }  else if ($('#main').hasClass('state-waitingarea')){
    generalpopup.append('<h2>Help? -- Waiting Room</h2><p>Awesome! You\'ve created a new room (where the game will be played). You just need to invite an opponent to the room. Message them (or communicate in some way) the Room ID, then they can join this room.</p>');
    main.addClass('popup-active');
  }
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

aboutbutton.click(function(){
  setInitState('state-aboutarea');
  $('.scrollpadding').removeClass('scrollpadding');
  scrollbarPosResizing();
});

backaboutarea.click(function(){
  setInitState('state-home');
});

coffeebutton.click(function(){
  window.open("https://donate.stripe.com/6oEcQCdCzc4e6MU000", '_blank');
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
});

copytexts.click(function(){
  navigator.clipboard.writeText($(this).children('p').text());
  $('#sharearea .titlebanner').text('thank you!');
});

backsharearea.click(function(){
  setInitState('state-home');
});

helpbtn.click(function(){
  popUpHelp();
  // setInitState('state-help');
});

$(window).on('resize',function(){
  if (localstate.boardtype=='cylinder') resizeCylinderBoard();
  if (localstate.boardtype=='square') resizeSquareBoard();
});

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function deleteCookie(cname) {
  if(getCookie(cname)!="") {
    document.cookie = cname + "=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT";
  }
}

function scrollbarVisible(element) {
  return element.scrollHeight > element.clientHeight;
}
function scrollbarPosResizing(){
  if (scrollbarVisible(document.getElementById('abouttxtarea'))){
    $('#abouttxtarea').addClass('scrollpadding');
  } else {
    $('.scrollpadding').removeClass('scrollpadding');
  }
}

window.addEventListener('resize', function(event) {
  scrollbarPosResizing();
});

var online = true;
window.addEventListener('offline', function(){
  online = false;
  if (localstate.myroom!=0){  
    boardpopup.empty();  
    boardpopup.append('<h2>OH NOES!</h2><p>You have disconnected from the internet mid game!<br><br>Try to get back online. When you do:<br>1. Refresh the page,<br>2. To rejoin the game, click join and enter room number: '+localstate.myroom.toString()+'<br>3. Voila you are done! Hopefully you can get right back in the game :)</p>');
  } else {
    generalpopup.empty();
    generalpopup.append('<h2>YIKES!</h2><p>You have disconnected from the internet.<br><br>Sorry you can\'t do much on cylinderchess.com until you get back online.</p>');
  }
  main.addClass('popup-active');
});

window.addEventListener('online', function(){
  if (!online){
    if (localstate.myroom!=0){
      boardpopup.empty();  
      boardpopup.append('<h2>YESS!</h2><p>You have reconnected to the internet!<br><br>If you haven\'t done so already:<br>1. Refresh the page,<br>2. To rejoin the game, click join and enter room number: '+localstate.myroom.toString()+'<br>3. Voila you are done! Hopefully you should be right back in the game :)</p>');
    } else {
      generalpopup.empty();
      generalpopup.append('<h2>YESS!</h2><p>You\'re back :)<br><br>Time for some more cylinder chessin’?</p>');
    }
    main.addClass('popup-active');
  }
  online = true;
});