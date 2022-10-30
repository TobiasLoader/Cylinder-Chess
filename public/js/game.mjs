import {Pawn,  Knight, Bishop, Rook, Queen, King} from './chess.mjs';
import {localstate} from './main.mjs';

var movenum = 0;

function cloneStandardStartingPositions(){
  return {
    'A1': new Rook('0','w','A1'), 
    'B1': new Knight('1','w','B1'), 
    'C1': new Bishop('2','w','C1'), 
    'D1': new Queen('3','w','D1'), 
    'E1': new King('4','w','E1'), 
    'F1': new Bishop('5','w','F1'),
    'G1': new Knight('6','w','G1'), 
    'H1': new Rook('7','w','H1'), 
  
    'A2': new Pawn('8','w','A2'),
    'B2': new Pawn('9','w','B2'), 
    'C2': new Pawn('10','w','C2'), 
    'D2': new Pawn('11','w','D2'), 
    'E2': new Pawn('12','w','E2'), 
    'F2': new Pawn('13','w','F2'), 
    'G2': new Pawn('14','w','G2'), 
    'H2': new Pawn('15','w','H2'),
  
    'A8': new Rook('16','b','A8'), 
    'B8': new Knight('17','b','B8'), 
    'C8': new Bishop('18','b','C8'),
    'D8': new Queen('19','b','D8'), 
    'E8': new King('20','b','E8'), 
    'F8': new Bishop('21','b','F8'),
    'G8': new Knight('22','b','G8'), 
    'H8': new Rook('23','b','H8'), 
  
    'A7': new Pawn('24','b','A7'),
    'B7': new Pawn('25','b','B7'), 
    'C7': new Pawn('26','b','C7'), 
    'D7': new Pawn('27','b','D7'), 
    'E7': new Pawn('28','b','E7'), 
    'F7': new Pawn('29','b','F7'), 
    'G7': new Pawn('30','b','G7'), 
    'H7': new Pawn('31','b','H7'), 
  };
};

export function initBoard(boardtype,mycolour){
  const commonboard = $('#commonboard');
  localstate.boardpiecemap = cloneStandardStartingPositions();
  if (boardtype=='cylinder') cylinderBoardGame(commonboard,mycolour);
  if (boardtype=='square') squareBoardGame(commonboard,mycolour);
}

export function resizeCylinderBoard(){
  const w = $(window).width();
  if (w < 600) {
    document.getElementById('cylinderarea').style.setProperty("--relativesize",(Math.min($('#boardarea').width()/7,$(window).height()/13)).toString()+"px");
  } else {
    document.getElementById('cylinderarea').style.setProperty("--relativesize",(Math.min($('#boardarea').width()/8,$(window).height()/15)).toString()+"px");
  }
}

function scrollMapping(x,y){
  if (x==0 && y==0) return 0;
  if (x==0) return y;
  if (y==0) return x;
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  return ((x+y)*Math.abs(ax-ay))/(ax+ay);
}

function cylinderBoardGame(commonboard,mycolour){
  commonboard.addClass('cyl');
  const cylinderarea = document.getElementById("cylinderarea");
  const cylinder = $("#cylinder");
  const cols = $(".col");
  var cylinderroty = 202.5;
  var touchloc = {x:0,y:0};
  var touchrot = false;
  cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
  startingChessPieces(mycolour);
  resizeCylinderBoard();
  applyCylinderShadow(cylinderroty,cols,mycolour);
  
  cylinderarea.addEventListener('wheel', function (e) {
    cylinderroty += scrollMapping(-e.deltaX,e.deltaY)/10;
    cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
    applyCylinderShadow(cylinderroty,cols);
  });//, {passive: true}
  
  commonboard.on('touchstart',function(e){
    touchloc.x = e.touches[0].pageX;
    touchloc.y = e.touches[0].pageY;
    touchrot = true;
  });
  
  commonboard.on('touchmove',function(e){
    if (touchrot){
      cylinderroty += scrollMapping(-e.deltaX,e.deltaY)/10;
      cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
      applyCylinderShadow(cylinderroty,cols);
    }
  });
  
  commonboard.on('touchend',function(e){
    touchrot = false;
  });
}

export function resizeSquareBoard(){
  document.getElementById('squarearea').style.setProperty("--relativesize",(Math.min($('#boardarea').width()/8,$(window).height()/13)).toString()+"px");
}

function squareBoardGame(commonboard,mycolour){
  commonboard.addClass('sqr');
  startingChessPieces(mycolour);
  resizeSquareBoard();
}

function applyCylinderShadow(cylinderroty,cols,mycolour){    
  var i=0;
  //((i)=>{if (mycolour=='b') return 8-i; else return i;})(i)
  for (var col of cols) {
    col.style.filter = 'brightness('+(0.5+Math.cos(2*Math.PI*(i/8 + cylinderroty/360))/2).toString()+')';
    i+=1;
  }
}

function startingChessPieces(mycolour){
  for (const [position, piece] of Object.entries(localstate.boardpiecemap)){
    piece.placePiece(mycolour);
  }
}

export async function moveMade(frompos){
  $('#'+frompos).addClass('piecechosen');
  const validcandidates = localstate.validmoves[frompos];
  validcandidates.forEach(function (movedata){
    $('#'+movedata.move).addClass('validcandidate');
    if (movedata.status=='attack') $('#'+movedata.move).addClass('tocapture-'+movedata['capture']);
  });
  return new Promise((resolve) => {
    $('.validcandidate').click(function () {
      $('.validcandidate').off( "click");
      var capturepos = '';
      var topos = $(this).attr('id');
      validcandidates.forEach(function (movedata){
        if (movedata['move']==topos) capturepos = movedata['capture'];
      });
      if (capturepos=='') resolve({'from':frompos,'to':topos});
      else resolve({'from':frompos,'to':topos,'capture':capturepos});
    });
  });
}


export function resultMovePieces(playercolour,moveresult){
  resetPlayedLastMovedFlags(playercolour);
  if ('capture' in moveresult && moveresult['capture']!='') {
    localstate.boardpiecemap[moveresult['from']].capture(localstate.boardpiecemap[moveresult['capture']]);
    delete localstate.boardpiecemap[moveresult['capture']];
  }
  localstate.boardpiecemap[moveresult['from']].move(playercolour,moveresult['to']);
  localstate.boardpiecemap[moveresult['to']] = localstate.boardpiecemap[moveresult['from']];
  delete localstate.boardpiecemap[moveresult['from']];
  console.log('board state after: ',localstate.boardpiecemap);
}


function resetPlayedLastMovedFlags(col) {
  for (const [pos,piece] of Object.entries(localstate.boardpiecemap)){
    if (piece.enemycolour == col) piece.resetLastPlayedMoveFlag();
  }
}