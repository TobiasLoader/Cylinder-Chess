const cylinderarea = document.getElementById("cylinderarea");
const cylinder = document.getElementById("cylinder");
const cols = document.getElementsByClassName("col");
var cylinderroty = 0;

export function cylinderGame(){
  startingChessPieces();
  applyCylinderShadow();
  cylinderarea.addEventListener("wheel", function (e) {
    cylinderroty += e.deltaY/10;
    cylinder.style.transform = 'rotateY('+cylinderroty.toString()+'deg)';
    applyCylinderShadow();
  });
}

function applyCylinderShadow(){
  var i=0;
  for (var col of cols) {
    col.style.filter = 'brightness('+(0.5+Math.cos(2*Math.PI*(i/8 + cylinderroty/360))/2).toString()+')';
    i+=1;
  }
}

function startingChessPieces(){
  document.getElementById('A1').insertAdjacentHTML('beforeend', '<img class="white rook piece" src="assets/pieces/w/rook.svg" alt="rook">');
  document.getElementById('B1').insertAdjacentHTML('beforeend', '<img class="white knight piece" src="assets/pieces/w/knight.svg" alt="rook">');
  document.getElementById('C1').insertAdjacentHTML('beforeend', '<img class="white bishop piece" src="assets/pieces/w/bishop.svg" alt="bishop">');
  document.getElementById('D1').insertAdjacentHTML('beforeend', '<img class="white queen piece" src="assets/pieces/w/queen.svg" alt="queen">');
  document.getElementById('E1').insertAdjacentHTML('beforeend', '<img class="white king piece" src="assets/pieces/w/king.svg" alt="king">');
  document.getElementById('F1').insertAdjacentHTML('beforeend', '<img class="white bishop piece" src="assets/pieces/w/bishop.svg" alt="bishop">');
  document.getElementById('G1').insertAdjacentHTML('beforeend', '<img class="white knight piece" src="assets/pieces/w/knight.svg" alt="knight">');
  document.getElementById('H1').insertAdjacentHTML('beforeend', '<img class="white rook piece" src="assets/pieces/w/rook.svg" alt="rook">');
  document.getElementById('A2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('B2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('C2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('D2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('E2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('F2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('G2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');
  document.getElementById('H2').insertAdjacentHTML('beforeend', '<img class="white pawn piece" src="assets/pieces/w/pawn.svg" alt="pawn">');

  document.getElementById('A8').insertAdjacentHTML('beforeend', '<img class="black rook piece" src="assets/pieces/b/rook.svg" alt="rook">');
  document.getElementById('B8').insertAdjacentHTML('beforeend', '<img class="black knight piece" src="assets/pieces/b/knight.svg" alt="rook">');
  document.getElementById('C8').insertAdjacentHTML('beforeend', '<img class="black bishop piece" src="assets/pieces/b/bishop.svg" alt="bishop">');
  document.getElementById('D8').insertAdjacentHTML('beforeend', '<img class="black queen piece" src="assets/pieces/b/queen.svg" alt="queen">');
  document.getElementById('E8').insertAdjacentHTML('beforeend', '<img class="black king piece" src="assets/pieces/b/king.svg" alt="king">');
  document.getElementById('F8').insertAdjacentHTML('beforeend', '<img class="black bishop piece" src="assets/pieces/b/bishop.svg" alt="bishop">');
  document.getElementById('G8').insertAdjacentHTML('beforeend', '<img class="black knight piece" src="assets/pieces/b/knight.svg" alt="knight">');
  document.getElementById('H8').insertAdjacentHTML('beforeend', '<img class="black rook piece" src="assets/pieces/b/rook.svg" alt="rook">');
  document.getElementById('A7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('B7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('C7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('D7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('E7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('F7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('G7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
  document.getElementById('H7').insertAdjacentHTML('beforeend', '<img class="black pawn piece" src="assets/pieces/b/pawn.svg" alt="pawn">');
}