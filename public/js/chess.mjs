import {localstate} from './main.mjs';

const colourname = {'w':'white','b':'black'};

function fileToInt(f){
  return f.charCodeAt() - 64;
}

function intToFile(i){
  if (i%8==0) return 'H';
  else return String.fromCharCode((i+8)%8+64);
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
    this.playedlastmove = false;
  }

  file(){
    return this.pos[0];
  }

  rank(){
    return this.pos[1];
  }

  relativeMoveToPos(move){
    const f = intToFile((fileToInt(this.file())+move.x)%8);
    const r = parseInt(this.rank())+move.y;
    if (0<r && r<9) return f.toString()+r.toString();
    else return '';
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
    console.log('add to capture pieces')
    $('#'+this.enemycolour+'capture').append('<img id="'+this.id+'" class="captured '+colourname[this.colour]+' '+this.name+' piece" src="'+this.src+'" alt="'+this.name+'">');
  }

  move(playercolour,newpos){
    this.removePiece();
    this.pos = newpos;
    this.hasmoved = true;
    this.placePiece(playercolour);
    this.playedlastmove = true;
  }

  capture(piece){
    console.log(this.id + ' has captured ' + piece.id);
    piece.beCaptured();
  }

  beCaptured(){
    console.log('capture ' + this.pos + this.id)
    this.iscaptured = true;
    this.removePiece();
    this.addToCapturedPieces();
  }

  generateAbsoluteMoves(){
    var currentabsmovegroups = [];
    for (const movegroup in this.relativemovegroups) {
      currentabsmovegroups[movegroup] = [];
      for (const relativemove of this.relativemovegroups[movegroup]){
        const abspos = this.relativeMoveToPos(relativemove);
        if (abspos!='' && !(abspos in currentabsmovegroups[movegroup]))
          currentabsmovegroups[movegroup].push(abspos);
      }
    }
    this.absolutemovegroups = currentabsmovegroups;
  }

  filterAbsoluteMoves(boardmap,moves,cumul){
    var ms = [];
    for (const move of moves) {
      if (move in boardmap) {
        if (boardmap[move].enemycolour == this.colour) ms.push({'status':'attack','move':move,'capture':move});
        if (cumul) break;
      }
      else {
        ms.push({'status':'move','move':move,'capture':''});
      }
    }
    return ms;
  }

  filterAbsoluteMovesForAttack(boardmap,moves,cumul){
    var filteredmoves = this.filterAbsoluteMoves(boardmap,moves,cumul);
    var ms = [];
    for (const fmoves of filteredmoves){
      if (fmoves['status']=='attack') ms.push(fmoves);
    }
    return ms;
  }

  filterAbsoluteMovesForNotAttack(boardmap,moves,cumul){
    var filteredmoves = this.filterAbsoluteMoves(boardmap,moves,cumul);
    var ms = [];
    for (const fmoves of filteredmoves){
      if (fmoves['status']!='attack') ms.push(fmoves);
    }
    return ms;
  }
  
  candidateMoves(boardmap){
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

  resetLastPlayedMoveFlag(){
    this.playedlastmove = false;
  }
}

// used for checking if a move puts your king in check (replace piece with GhostPiece at new position in board map and re-run inCheck method).
export class GhostPiece {
  constructor(name,colour,pos) {
    this.name = name;
    this.colour = colour;
    if (this.colour=='w') this.enemycolour = 'b';
    if (this.colour=='b') this.enemycolour = 'w';
    this.pos = pos;
  }
}

export class Pawn extends Piece {
  constructor(id,colour,pos) {
    super(id,'pawn',colour,pos);
    var mult = 1;
    if (this.colour=='b') mult = -1;
    const m1 = {x:0,y:mult};
    const m2 = {x:0,y:2*mult};
    const m3 = {x:-1,y:mult};
    const m4 = {x:1,y:mult};
    const m5 = {x:-1,y:0};
    const m6 = {x:1,y:0};
    this.relativemovegroups = {
      'fromstart': [m1,m2],
      'standard': [m1],
      'attack': [m3,m4],
      'enpassant-captures': [m5,m6]
    }
    this.madesinglemove = false;
  }

  enPassantMoves(boardmap){
    var ms = [];
    if ((this.colour=='w' && this.rank()=='5') || (this.colour=='b' && this.rank()=='4')) {
      const absposmoves = [
        {'move':this.absolutemovegroups['attack'][0],'capture':this.absolutemovegroups['enpassant-captures'][0]},
        {'move':this.absolutemovegroups['attack'][1],'capture':this.absolutemovegroups['enpassant-captures'][1]}
      ];
      for (var movepackage of absposmoves){
        if (!(movepackage['move'] in boardmap) && (movepackage['capture'] in boardmap)){
          const piecetocap = boardmap[movepackage['capture']];
          // console.log(piecetocap)
          if (piecetocap.name == 'pawn' && piecetocap.colour == this.enemycolour && piecetocap.madesinglemove && piecetocap.playedlastmove){
            ms.push({'status':'attack','move':movepackage['move'],'capture':movepackage['capture']});
          }
        }
      }
    }
    return ms;
  }

  candidateMoves(boardmap){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    if (!this.hasmoved) this.addMoveDataIfUnique(this.filterAbsoluteMovesForNotAttack(boardmap,this.absolutemovegroups['fromstart'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMovesForNotAttack(boardmap,this.absolutemovegroups['standard'],false),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMovesForAttack(boardmap,this.absolutemovegroups['attack'],false),possiblemoves);
    this.addMoveDataIfUnique(this.enPassantMoves(boardmap),possiblemoves);
    // console.log('possible moves ', possiblemoves);
    return possiblemoves;
  }

  queeningCheck(){
    return (this.colour=='w' && this.rank()=='8') || (this.colour=='b' && this.rank()=='1');
  }

  move(playercolour,newpos){
    if (!this.hasmoved) this.madesinglemove = true;
    else if (this.madesinglemove) this.madesinglemove = false;
    super.move(playercolour,newpos);
    if (this.queeningCheck()) {
      queening(this,new Queen(this.id,this.colour,this.pos));
    } else {
      localstate.boardpiecemap[newpos] = this;
    }
  }
}

function queening(pawn,queen){
  console.log(pawn,queen)
  pawn.removePiece();
  queen.placePiece(queen.colour);
  delete localstate.boardpiecemap[pawn.pos];
  localstate.boardpiecemap[pawn.pos] = queen;
}

export class Queen extends Piece {
  constructor(id,colour,pos) {
    super(id,'queen',colour,pos);
    this.relativemovegroups = {
      'north': [...Array(7).keys()].map(i => ({x:0, y:1+i})),
      'northeast': [...Array(7).keys()].map(i => ({x:1+i, y:1+i})),
      'east': [...Array(7).keys()].map(i => ({x:1+i, y:0})),
      'southeast': [...Array(7).keys()].map(i => ({x:1+i, y:-1-i})),
      'south':[...Array(7).keys()].map(i => ({x:0, y:-1-i})),
      'southwest':[...Array(7).keys()].map(i => ({x:-1-i, y:-1-i})),
      'west':[...Array(7).keys()].map(i => ({x:-1-i, y:0})),
      'northwest':[...Array(7).keys()].map(i => ({x:-1-i, y:1+i})),
    }
  }

  candidateMoves(boardmap){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['north'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['northeast'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['east'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['southeast'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['south'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['southwest'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['west'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['northwest'],true),possiblemoves);
    return possiblemoves;
  }
}

export class Rook extends Piece {
  constructor(id,colour,pos) {
    super(id,'rook',colour,pos);
    this.relativemovegroups = {
      'north': [...Array(7).keys()].map(i => ({x:0, y:1+i})),
      'east': [...Array(7).keys()].map(i => ({x:1+i, y:0})),
      'south':[...Array(7).keys()].map(i => ({x:0, y:-1-i})),
      'west':[...Array(7).keys()].map(i => ({x:-1-i, y:0})),
    }
  }

  candidateMoves(boardmap){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['north'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['east'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['south'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['west'],true),possiblemoves);
    return possiblemoves;
  }
}

export class Knight extends Piece {
  constructor(id,colour,pos) {
    super(id,'knight',colour,pos);
    this.relativemovegroups = {
      'jumps': [{x:1,y:2},{x:2,y:1},{x:2,y:-1},{x:1,y:-2},{x:-1,y:-2},{x:-2,y:-1},{x:-2,y:1},{x:-1,y:2}],
    }
  }

  candidateMoves(boardmap){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['jumps'],false),possiblemoves);
    return possiblemoves;
  }
}

export class Bishop extends Piece {
  constructor(id,colour,pos) {
    super(id,'bishop',colour,pos);
    this.relativemovegroups = {
      'northeast': [...Array(7).keys()].map(i => ({x:1+i, y:1+i})),
      'southeast': [...Array(7).keys()].map(i => ({x:1+i, y:-1-i})),
      'southwest':[...Array(7).keys()].map(i => ({x:-1-i, y:-1-i})),
      'northwest':[...Array(7).keys()].map(i => ({x:-1-i, y:1+i})),
    }
  }

  candidateMoves(boardmap){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['northeast'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['southeast'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['southwest'],true),possiblemoves);
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['northwest'],true),possiblemoves);
    return possiblemoves;
  }
}

export class King extends Piece {
  constructor(id,colour,pos) {
    super(id,'king',colour,pos);
    this.relativemovegroups = {
      'radius1': [{x:0, y:1},{x:1, y:1},{x:1, y:0},{x:1, y:-1},{x:0, y:-1},{x:-1, y:-1},{x:-1, y:0},{x:-1, y:1}],
    }
  }

  candidateMoves(boardmap){
    this.generateAbsoluteMoves();
    var possiblemoves = [];
    this.addMoveDataIfUnique(this.filterAbsoluteMoves(boardmap,this.absolutemovegroups['radius1'],false),possiblemoves);
    return possiblemoves;
  }
}