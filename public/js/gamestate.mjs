export class GameState {
	constructor(){
		this.resetgamestate();
	}
	
	resetgamestate(){
		this.socket = null;
		this.mymove = false;
		this.gameover = false;
		this.myroom = 0;
		this.boardtype = '';
		this.myplayerid = 0;
		this.opponentid = 0;
		this.mytime = null;
		this.opponenttime = null;
		this.mymovemillis = 0;
		this.opmovemillis = 0;
		this.movehistory = [];
		this.mycolour = '';
		this.currentpiece = '';
		this.mytimerticking = null;
		this.optimerticking = null;
		this.startedmove = false;
		this.boardpiecemap = {};
		console.log('reset game state')
	}
}