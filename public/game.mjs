import {Pawn,  Knight, Bishop, Rook, Queen, King} from './chess.mjs';

var movenum = 0;

export const boardpiecemap = {
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

export function initBoard(boardtype,mycolour){
  if (boardtype=='cylinder') {
    cylinderBoardGame(mycolour);
  }
  if (boardtype=='square'){
    squareBoardGame(mycolour);
  }
}

function cylinderBoardGame(mycolour){
  const cylinderarea = document.getElementById("cylinderarea");
  const cylinder = $("#cylinder");
  const cols = $(".col");
  var cylinderroty = 202.5;
  cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
  startingChessPieces(mycolour);
  applyCylinderShadow(cylinderroty,cols,mycolour);
  cylinderarea.addEventListener('wheel', function (e) {
    cylinderroty += e.deltaY/10;
    cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
    applyCylinderShadow(cylinderroty,cols);
  });//, {passive: true}
}

function squareBoardGame(mycolour){
  startingChessPieces(mycolour);
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
  for (const [position, piece] of Object.entries(boardpiecemap)){
    piece.placePiece(mycolour);
  }
}

export function initNextMove(){
  movenum += 1;
  console.log(movenum);
}

export async function moveMade(pos){
  const piece = boardpiecemap[pos];
  $('#'+pos).addClass('piecechosen');
  const candidates = piece.candidateMoves();
  candidates.forEach(function (movedata){
    $('#'+movedata.move).addClass('candidatemove');
    if (movedata.status=='attack') $('#'+movedata.move).addClass('tocapture-'+movedata['capture']);
  });
  return new Promise((resolve) => {
    $('.candidatemove').click(function () {
      $('.candidatemove').off( "click");
      const classes = $(this).attr('class').split(' ');
      var capturepos = '';
      for (const theclass of classes){
        if (theclass.length == 12 && theclass.substring(0,10)=='tocapture-'){
          capturepos = theclass.substring(10,12)
          break;
        }
      }
      resolve({'from':pos,'to':$(this).attr('id'),'capture':capturepos});
    });
  });
}


export function resultMovePieces(playercolour,moveresult){
  resetPlayedLastMovedFlags(playercolour);
  if (moveresult['capture']!='') {
    boardpiecemap[moveresult['from']].capture(boardpiecemap[moveresult['capture']]);
    delete boardpiecemap[moveresult['capture']];
  }
  boardpiecemap[moveresult['from']].move(playercolour,moveresult['to']);
  // boardpiecemap[moveresult['to']] = boardpiecemap[moveresult['from']];
  delete boardpiecemap[moveresult['from']];
  console.log('board state after: ',boardpiecemap);
}


function resetPlayedLastMovedFlags(col) {
  for (const [pos,piece] of Object.entries(boardpiecemap)){
    if (piece.enemycolour == col) piece.resetLastPlayedMoveFlag();
  }
}
