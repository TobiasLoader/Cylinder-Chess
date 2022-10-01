import {boardpiecemap} from './game.mjs';

const colourname = {'w':'white','b':'black'};
const pieceidmap = {};

function fileToInt(f){
  return f.charCodeAt() - 64;
}

function intToFile(i){
  if (i==8) return 'H';
  else return String.fromCharCode(i%8+64);
}

export class Piece {
  constructor(id,name,colour,pos){
    this.id =  id;
    this.name = name;
    this.colour = colour;
    this.enemycolour = '';
    if (this.colour=='w') this.enemycolour = 'b';
    if (this.colour=='b') this.enemycolour = 'w';
    this.pos = pos;
    this.prevpos = pos;
    this.src = 'assets/pieces/'+this.colour+'/'+this.name+'.svg';
    this.hasmoved = false;
    this.iscaptured = false;
    this.relativemovegroups = {};
    this.absolutemovegroups = {};
  }

  file(){
    return this.pos[0];
  }

  rank(){
    return this.pos[1];
  }

  relativeMoveToPos(move){
    return intToFile((fileToInt(this.file())+move.x)%8).toString()+(parseInt(this.rank())+move.y).toString()
  }

  placePiece(playercolour){
    if (playercolour==this.colour) $('#'+this.pos).addClass('mypiece');
    $('#'+this.pos).append('<img id="'+this.id+'" class="'+colourname[this.colour]+' '+this.name+' piece" src="'+this.src+'" alt="'+this.name+'">');
  }
  removePiece(){
    $('#'+this.pos).removeClass('mypiece');
    $('#'+this.pos).removeClass(this.colour+'cell');
    $('#'+this.id).remove();
  }
  addToCapturedPieces(){
    $('#'+this.enemycolour+'capture').append('<img id="'+this.id+'" class="captured '+colourname[this.colour]+' '+this.name+' piece" src="'+this.src+'" alt="'+this.name+'">');
  }

  beCaptured(){
    this.iscaptured = true;
    this.removePiece();
    this.addToCapturedPieces();
  }

  move(newpos){
    console.log(newpos)
    this.pos = newpos;
    this.removePiece();
    this.placePiece(this.colour);
  }

  capture(id){
    console.log(this.id + ' has captured ' + id);
    pieceidmap[id].beCaptured();
  }

  generateAbsoluteMoves(){
    var currentabsmovegroups = [];
    for (const movegroup in this.relativemovegroups) {
      currentabsmovegroups[movegroup] = [];
      for (const relativemove of this.relativemovegroups[movegroup]){
        currentabsmovegroups[movegroup].push(this.relativeMoveToPos(relativemove));
      }
    }
    this.absolutemovegroups = currentabsmovegroups;
  }

  filterAbsoluteMoves(moves,cumul){
    var ms = [];
    for (const move of moves) {
      if (move in boardpiecemap) {
        if (boardpiecemap[move].colour != this.colour) ms.push({'status':'attack','move':move,'capture':move});
        if (cumul) break;
      }
      else {
        ms.push({'status':'move','move':move,'capture':{}});
      }
    }
    return ms;
  }

  filterAbsoluteMovesForAttack(moves,cumul){
    var filteredmoves = this.filterAbsoluteMoves(moves,cumul);
    var ms = [];
    for (const fmoves in filteredmoves){
      if (fmoves['status']=='attack') ms.push(fmoves);
    }
  }
  
  candidateMoves(){
    return [];
  }

  addMoveDataIfUnique(arrayToBeAdded,arrayToAddTo){
    for (const movedata of arrayToBeAdded){
      var posUnique = true;
      for (const existingmovedata of arrayToAddTo){
        if (movedata.move == existingmovedata.move){
          posUnique=false;
          break;
        }
      }
      if (posUnique) arrayToAddTo.push(movedata);
    }
  }
}

export class Pawn extends Piece {
  constructor(id,colour,pos) {
    super(id,'pawn',colour,pos);
    // if (this.colour=='w') this.startRank = '1';
    // else if (this.colour=='b') this.startRank = '8';
    var mult = 1;
    if (this.colour=='b') mult = -1;
    const m1 = {x:0,y:mult};
    const m2 = {x:0,y:2*mult};
    const m3 = {x:-1,y:mult};
    const m4 = {x:1,y:mult};
    this.relativemovegroups = {
      'fromstart': [m1,m2],
      'standard': [m1],
      'attack': [m3,m4],
    }
    this.madesinglemove = false;
  }

  enPassantMoves(){
    var ms = [];
    if ((this.colour=='w' && this.rank()=='5') || (this.colour=='b' && this.rank()=='4')) {
      const absposmoves = [
        {'move':this.relativeMoveToPos({x:-1,y:1}),'capture':this.relativeMoveToPos({x:-1,y:0})},
        {'move':this.relativeMoveToPos({x:1,y:1}),'capture':this.relativeMoveToPos({x:1,y:0})}
      ];
      for (var movepackage in absposmoves){
        if (movepackage['move'] in boardpiecemap){
          if (boardpiecemap[movepackage['move']].name == 'pawn' && boardpiecemap[movepackage['move']].colour == this.enemycolour && boardpiecemap[movepackage['move']].madesinglemove){
            ms.push({'status':'attack','move':movepackage['move'],'capture':movepackage['capture']});
          }
        }
      }
    }
    return ms;
  }

  candidateMoves(){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    if (!this.hasmoved) this.addMoveDataIfUnique(this.filterAbsoluteMoves(this.absolutemovegroups['fromstart'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(this.absolutemovegroups['standard'],false),possiblemoves);
    this.addMoveDataIfUnique(this.enPassantMoves(),possiblemoves);
    return possiblemoves;
  }

  move(newpos){
    super.move(newpos);
    if (!this.hasmoved) this.madesinglemove = true;
    else if (this.madesinglemove) this.madesinglemove = false;
  }
}
