import {GhostPiece} from './chess.mjs';

export class GameState {
	constructor(){
		this.resetstate();
	}
	
	resetstate(){
		this.socket = null;
		this.myroom = 0;
		this.boardtype = '';
		this.myplayerid = 0;
		this.opponentid = 0;
		this.mycolour = '';
		this.showmoves = true;
		this.resetingamestate();
	}
	
	resetingamestate(){
		this.mymove = false;
		this.gameover = false;
		this.mytime = null;
		this.opponenttime = null;
		this.mymovemillis = 0;
		this.opmovemillis = 0;
		this.movehistory = [];
		this.currentpiece = '';
		this.mytimerticking = null;
		this.optimerticking = null;
		this.startedmove = false;
		this.drawopen = false;
		this.rematchopen = false;
		this.boardpiecemap = {};
		this.validmoves = {};
		console.log('reset game state')
	}
	
	rematchchange(time){
		if (this.mycolour=='w') this.mycolour = 'b';
		else if (this.mycolour=='b') this.mycolour = 'w';
		this.mytime = time[this.myplayerid];
		this.opponenttime = time[this.opponentid];
	}
	
	isenemy(piece){return this.mycolour == piece.enemycolour;}
	ismypiece(piece){return this.mycolour == piece.colour;}
	
	myking(boardmap){
		for (const [position, piece] of Object.entries(boardmap)){
			if (piece.name=='king' && piece.colour==this.mycolour) return piece;
		}
		return null;
	}
	
	inCheck(boardmap){
		var kingpos = this.myking(boardmap).pos;
		for (const [position, piece] of Object.entries(boardmap)){
			if (this.isenemy(piece)){
				var moves = piece.candidateMoves(boardmap).map(m => m.move);
				if (moves.includes(kingpos)){
					// console.log('in check');
					// console.log(position,piece,moves,kingpos);
					return true;
				}
			}
		}
		return false;
	}
	
	meInCheck(){
		return this.inCheck(this.boardpiecemap);
	}
	
	allCandidateMoves(){
		console.log('start candidate search')
		var mycandidatemoves = {};
		for (const [position, piece] of Object.entries(this.boardpiecemap)){
			if (this.ismypiece(piece)) {
				mycandidatemoves[piece.pos] = piece.candidateMoves(this.boardpiecemap);
			}
		}
		console.log('solution candidate search:')
		console.log(mycandidatemoves);
		return mycandidatemoves;
	}
	
	findValidMoves(){
		console.log('start valid search')
		var cms = this.allCandidateMoves();
		var myvalidmoves = {};
		// console.log(Object.entries(this.boardpiecemap));
		for (const [position, piece] of Object.entries(this.boardpiecemap)){
			if (this.ismypiece(piece)) {
				myvalidmoves[position] = [];
				for (const candmove of cms[position]){
					var dupboardmap = {};
					for (const [p1, p2] of Object.entries(this.boardpiecemap)){
						if (p1!=candmove.move){
							if (p1!=position) dupboardmap[p1] = p2;
							else dupboardmap[candmove.move] = new GhostPiece(p2.name,p2.colour,candmove.move);
						}
					}
					// console.log(dupboardmap);
					if (!this.inCheck(dupboardmap)) {
						// console.log('not in check!')
						myvalidmoves[position].push(candmove);
					}
				}
			}
		}
		console.log('solution valid search:')
		console.log(myvalidmoves)
		this.validmoves = myvalidmoves;
	}
	
	noValidMoves(){
		var numvalidmoves = 0;
		for (const [position, moves] of Object.entries(this.validmoves)){
			numvalidmoves += moves.length;
		}
		return numvalidmoves==0;
	}
}