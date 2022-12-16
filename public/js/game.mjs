import {Pawn,  Knight, Bishop, Rook, Queen, King} from './chess.mjs';
import {localstate} from './main.mjs';

var movenum = 0;

export var mousecylindrag = false;

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
  console.log(localstate.boardpiecemap);
  if (boardtype=='cylinder') cylinderBoardGame(commonboard,mycolour);
  if (boardtype=='square') squareBoardGame(commonboard,mycolour);
}

export function resizeCylinderBoard(){
  const w = $(window).width();
  if (w < 800) {
    document.getElementById('commonboard').style.setProperty("--relativesize",(Math.min($(window).width()/7,$(window).height()/13)).toString()+"px");
  } else {
    document.getElementById('commonboard').style.setProperty("--relativesize",(Math.min($(window).width()/8,$(window).height()/15)).toString()+"px");
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

( function() {

// Based on easing equations from Robert Penner (http://www.robertpenner.com/easing)

var baseEasings = {};

$.each( [ "Quad", "Cubic", "Quart", "Quint", "Expo" ], function( i, name ) {
    baseEasings[ name ] = function( p ) {
      return Math.pow( p, i + 2 );
    };
} );

$.extend( baseEasings, {
    Sine: function( p ) {
        return 1 - Math.cos( p * Math.PI / 2 );
    },
    Circ: function( p ) {
        return 1 - Math.sqrt( 1 - p * p );
    },
    Elastic: function( p ) {
        return p === 0 || p === 1 ? p :
            -Math.pow( 2, 8 * ( p - 1 ) ) * Math.sin( ( ( p - 1 ) * 80 - 7.5 ) * Math.PI / 15 );
    },
    Back: function( p ) {
        return p * p * ( 3 * p - 2 );
    },
    Bounce: function( p ) {
        var pow2,
            bounce = 4;

        while ( p < ( ( pow2 = Math.pow( 2, --bounce ) ) - 1 ) / 11 ) {}
        return 1 / Math.pow( 4, 3 - bounce ) - 7.5625 * Math.pow( ( pow2 * 3 - 2 ) / 22 - p, 2 );
    }
} );

$.each( baseEasings, function( name, easeIn ) {
    $.easing[ "easeIn" + name ] = easeIn;
    $.easing[ "easeOut" + name ] = function( p ) {
        return 1 - easeIn( 1 - p );
    };
    $.easing[ "easeInOut" + name ] = function( p ) {
        return p < 0.5 ?
            easeIn( p * 2 ) / 2 :
            1 - easeIn( p * -2 + 2 ) / 2;
    };
} );

} )();

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
  
  $(window).keydown(function(e){
    console.log(e.keyCode);
    if (e.keyCode==37){
      cylinder.cylmomentum(45);
    } else if (e.keyCode==39){
      cylinder.cylmomentum(-45);
    }
  });
  
  
  var touchstartx = 0;
  var touchcurrentx = 0;
  var touchoffsetx = 0;
  
  commonboard.on('touchstart',function(e){
    touchstartx = e.touches[0].pageX;
    touchcurrentx = e.touches[0].pageX;
    console.log('start touch ', touchstartx);
    cylinder.stop(true,true);
  });
  
  commonboard.on('touchmove',function(e){
        // if (touchrot){
    touchcurrentx = e.touches[0].pageX;
    touchoffsetx = touchcurrentx - touchstartx;
    cylinderroty += touchoffsetx;
    cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
    applyCylinderShadow(cylinderroty,cols);
    touchstartx = e.touches[0].pageX;

    // }
  });
  
  commonboard.on('touchend',function(e){
    cylinder.cylmomentum(-5*touchoffsetx);
  });
  
  commonboard.on('mousedown',function(e){
    e.stopPropagation();
    e.preventDefault();
    touchstartx = e.clientX;
    touchcurrentx = e.clientX;
    cylinder.stop(true,true);
    mousecylindrag = true;
  });
  
  $(window).on('mousemove',function(e){
    if (mousecylindrag){
      touchcurrentx = e.clientX;
      touchoffsetx = touchcurrentx - touchstartx;
      cylinderroty += touchoffsetx;
      cylinder.css('transform','rotateY('+cylinderroty.toString()+'deg)');
      applyCylinderShadow(cylinderroty,cols);
      touchstartx = e.clientX;
    }
  });
  
  $(window).on('mouseup',function(e){
    if (mousecylindrag){
      e.stopPropagation();
      e.preventDefault();
      mousecylindrag = false;
      cylinder.cylmomentum(-5*touchoffsetx);
    }
  });
  
  
  $.fn.cylmomentum = function(angle, complete) {
    return this.each(function() {
      var $elem = $(this);
      var pnow = angle;
      var dnow = 0;
      $({deg: angle}).animate({deg: 0}, {
        duration: 200,
        easing: 'easeOutQuart',
        step: function(now) {
          dnow = now - pnow;
          pnow = now;
          cylinderroty += dnow;
          $elem.css({
            transform: 'rotateY(' + cylinderroty + 'deg)'
          });
          applyCylinderShadow(cylinderroty,cols,mycolour);
        },
        complete: function(){
          touchstartx = touchcurrentx;
          touchoffsetx = 0;
        } 
      });
    });
  };
}

export function resizeSquareBoard(){
  document.getElementById('commonboard').style.setProperty("--relativesize",(Math.min($(window).width()/8.5,$(window).height()/13)).toString()+"px");
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

function placePieceHighlight(pos){
  $('#'+pos).prepend('<div class="replacepiecehighlight"></div>');
}

export async function moveMade(frompos){
  $('#'+frompos).prepend('<div class="piecechosen"></div>');
  const validcandidates = localstate.validmoves[frompos];
  // console.log(validcandidates);
  validcandidates.forEach(function (movedata){
    $('#'+movedata.move).addClass('validcandidate');
    if (movedata.status=='attack') $('#'+movedata.move).addClass('capturecandidate');
    if (localstate.showmoves){
      if (localstate.boardpiecemap[movedata.move]==undefined) {
        localstate.boardpiecemap[frompos].placeSilhouette(movedata.move);
      } else {
        placePieceHighlight(movedata.move);
      }
    }
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


export function resultMovePieces(playercolour,res){
  resetPlayedLastMovedFlags(playercolour);
  if ('capture' in res && res['capture']!='') {
    localstate.boardpiecemap[res['from']].capture(localstate.boardpiecemap[res['capture']]);
    delete localstate.boardpiecemap[res['capture']];
  }
  // console.log('done capture')
  // console.log(localstate.boardpiecemap)
  // console.log(localstate.boardpiecemap[res['from']],playercolour,res['to'])
  const movereturn = localstate.boardpiecemap[res['from']].move(playercolour,res['to']);
  // console.log(movereturn);
  if (movereturn['special']=='queened') {
    // localstate.boardpiecemap[res['to']] = localstate.boardpiecemap[res['from']];
    console.log('queening complete')
  } else if (movereturn['special']=='castled') {
    const movedata = movereturn['data'];
    localstate.boardpiecemap[movedata['newking']] = localstate.boardpiecemap[res['from']];
    // console.log(movedata['oldrook'],localstate.boardpiecemap[movedata['oldrook']])
    localstate.boardpiecemap[movedata['newrook']] = localstate.boardpiecemap[movedata['oldrook']];
    // console.log(movedata['newrook'],localstate.boardpiecemap[movedata['newrook']])
    delete localstate.boardpiecemap[movedata['oldrook']];
    console.log('castle complete')
  } else {
    localstate.boardpiecemap[res['to']] = localstate.boardpiecemap[res['from']];
  }
  
  delete localstate.boardpiecemap[res['from']];
  console.log('board state after: ',localstate.boardpiecemap);
}


function resetPlayedLastMovedFlags(col) {
  for (const [pos,piece] of Object.entries(localstate.boardpiecemap)){
    if (piece.enemycolour == col) piece.resetLastPlayedMoveFlag();
  }
}