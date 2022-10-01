import {Pawn} from './chess.mjs';

const cylinderarea = document.getElementById("cylinderarea");
const cylinder = $("#cylinder");
const cols = $(".col");
var cylinderroty = 0;

var movenum = 0;

export const boardpiecemap = {
  'A2': new Pawn('8','w','A2'),
  'B2': new Pawn('9','w','B2'), 
  'C2': new Pawn('10','w','C2'), 
  'D2': new Pawn('11','w','D2'), 
  'E2': new Pawn('12','w','E2'), 
  'F2': new Pawn('13','w','F2'), 
  'G2': new Pawn('14','w','G2'), 
  'H2': new Pawn('15','w','H2'), 
  'A7': new Pawn('24','b','A7'),
  'B7': new Pawn('25','b','B7'), 
  'C7': new Pawn('26','b','C7'), 
  'D7': new Pawn('27','b','D7'), 
  'E7': new Pawn('28','b','E7'), 
  'F7': new Pawn('29','b','F7'), 
  'G7': new Pawn('30','b','G7'), 
  'H7': new Pawn('31','b','H7'), 
};

export function cylinderGame(mycolour){
  startingChessPieces(mycolour);
  applyCylinderShadow();
  cylinderarea.addEventListener('wheel', function (e) {
    cylinderroty += e.deltaY/10;
    cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
    applyCylinderShadow();
  });//, {passive: true}
}

function applyCylinderShadow(){
  var i=0;
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

export function resultMovePieces(moveresult){
  // for (const [position, piece] of Object.entries(boardpiecemap)){
  //   $('#'+position).off("click");
  // }
  boardpiecemap[moveresult['from']].move(moveresult['to']);
  boardpiecemap[moveresult['to']] = boardpiecemap[moveresult['from']];
  delete boardpiecemap[moveresult['from']];
  console.log('movetriggered',boardpiecemap);
  // $('.candidatemove').off( "click");
  // addClickToPieces();
}

// function addClickToPieces(){
//   console.log(movenum)
//   for (const [position, piece] of Object.entries(boardpiecemap)){
//     console.log(movenum);
//     if ((piece.colour=='w' && movenum%2==0) || (piece.colour=='b' && movenum%2==1)) {
//       $('#'+position).click(function () {
//         console.log('pp',piece,position);
//         chooseGivenPiece(piece,position);
//       });
//     }
//   }
// }

// addClickToPieces();

export function initNextMove(){
  movenum += 1;
  console.log(movenum);
}

export async function moveMade(pos){
  console.log(pos)
  const piece = boardpiecemap[pos];
  $('#'+pos).addClass('piecechosen');
  console.log(pos,piece.candidateMoves())
  piece.candidateMoves().forEach(movedata => console.log(movedata));
  piece.candidateMoves().forEach(movedata => $('#'+movedata.move).addClass('candidatemove'));
  return new Promise((resolve) => {
    $('.candidatemove').click(function () {
      $('.candidatemove').off( "click");
      $('.piecechosen').removeClass('piecechosen');
      $('.candidatemove').removeClass('candidatemove');
      resolve({'from':pos,'to':$(this).attr('id')});
    });
  });
}