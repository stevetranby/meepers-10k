//globals 
function log(msg) { if(console.log) { console.log(msg); }}
function jqdiv(id,cls,str,x,y,w,h) { return $("<div id='" + id + "' class='"+ cls + "'>" + str + "</div>").css({left:x,top:y, width:w, height:h})    ; }
  
var  
  // Loop Vars
  i=0,
  // Constant Vars
  UP = 0, LEFT = 1, RIGHT = 2, DOWN = 3,			
  ALIVE = 0, DEAD = 1, RANDOM = 2, CHASE = 3, EVADE = 4, STILL = 5, PATTERN = 6, EXPLODE = 7,
  // Game Vars
  keys = [],
  cellsize = 24,  
  rows = 12,
  cols = 32,
  numRooms = rows*cols,			      
  numMonsters = 5,
  monsters = [],			
  rooms = [],	
  floors = [],        
  level = 0,

  player = {    
    x:10,
    y:10,
    health: 100,
    rocks: 10,
    keys: 1,
    dx: 0,
    dy: 0,
    state: ALIVE,
    el:jqdiv('p','',':)',this.x,this.y,cellsize,cellsize)
  },  
  
	Game = {
		init: function() {
      
      log('init');
			// init	      
			for(y=0; y<rows; y++) {
				for(x=0; x<cols; x++) {			
					// create div cell          
					$("#a").append(jqdiv('','c','.',x*cellsize,y*cellsize,cellsize,cellsize));
				}
			}	       
      
      // init player
      $("#a").append(player.el);
      
      // init monsters      
      for(i=0; i<numMonsters; i++) {
        monsters[i] = {
          id:i,
          x:50*i+50, 
          y:20, 
          dx: Math.random()*5,
          dy: Math.random()*5,          
          state: ALIVE,
          el: jqdiv('m'+i,'m','M',this.x,this.y,cellsize,cellsize),
          dir: DOWN,
        };
        //log(monsters[i]);
        $("#a").append(monsters[i].el);
      }
		},

    nextLevel: function() {
      dlog('next level');
      level++;      
    },
    
    move: function(e) {
      e.x += e.dx;
      e.y += e.dy;      
      $(e.el).css({left: e.x+'px', top: e.y+'px'});
    },
    
    updatePlayer: function() {  
      if(keys[32]) log('firing weapon');      
      var tdx = 0, tdy = 0;
      
      /*
      // no diagonals
      if(keys[37]) { tdx=-5; tdy=0; }
      if(keys[38]) { tdx=0; tdy=-5; }
      if(keys[39]) { tdx=5; tdy=0; }
      if(keys[40]) { tdx=0; tdy=5; }
      */
      // with diagonal
      if(keys[37]) { tdx=-5; }
      if(keys[38]) { tdy=-5; }
      if(keys[39]) { tdx=5; }
      if(keys[40]) { tdy=5; }
      
      player.dx=tdx; player.dy=tdy; 
      Game.move(player);
    },
    
    updateMonsters: function() {
      //log(monsters.length);
      for(i=0; i<monsters.length; i++) {        
        var m = monsters[i];
        Game.move(m);        
        // if threshold, change dir
        if(m.x > (cols-1)*cellsize) { m.dir = LEFT; m.dx = -m.dx; }
        if(m.x < 0) { m.dir = RIGHT; m.dx = -m.dx; }
        if(m.y > (rows-1)*cellsize) { m.dir = UP; m.dy = -m.dy; }
        if(m.y < 0) { m.dir = DOWN; m.dy = -m.dy; }
      };
    },

    run: function() {
      setInterval(function() {
        Game.updatePlayer();
        Game.updateMonsters();
      }, 20);
    },

  };

$(document).bind('keydown', function(e) {  
  keys[e.keyCode] = true;
});

$(document).bind('keyup', function(e) {
  keys[e.keyCode] = false;
});  

Game.init();	
Game.run();  

/*
/////////////////////
// LEVEL MAP IDEAS //
/////////////////////

Each room can have a door on each side

BYTE for each room
1,2-NorthDoor(00),EastDoor(01),SouthDoor(10),WestDoor(11)
3,4-NoDoor(00),OpenDoor(01),KeyDoor(10),BossDoor(11)

*/