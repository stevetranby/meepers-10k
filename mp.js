//globals 
var keys = [];

function log(msg) { if(console.log) { console.log(msg); }}
function jqdiv(id,cls,str) { return $("<div id='" + id + "' class='"+ cls + "'>" + str + "</div>"); }
  
$(document).ready(function() {  

	var cellsize = 24,  
      rows = 8,
      cols = 16,
			numRooms = rows*cols,			      
								
			// Constants
			up = 0, lt = 1, rt = 2, dn = 3,			
			monsters = [],			
			rooms = [],	
			floors = [],        

  player = {    
    x:10,
    y:10,
    health: 100,
    rocks: 10,
    keys: 1,
    speed: 1,    
    el:jqdiv('p','',':)').css({top:this.x,left:this.y, width:cellsize, height:cellsize})    
  },  
  
	Game = {
		init: function() {
      
      log('init');
			// init	      
			for(y=0; y<rows; y++) {
				for(x=0; x<cols; x++) {			
					// create div cell          
					$("#a").append(jqdiv('','c','.').css({left: x*cellsize, top:y*cellsize, width:cellsize, height:cellsize}));
				}
			}	       
      $("#a").append(player.el);
		},  
    
    run: function() {
      setInterval(function() {
        Game.update(player);
      }, 10);
    },

    update: function(e) {  
      if(keys[32]) log('firing weapon');
      if(keys[37]) Game.move(player,-1,0);
      if(keys[38]) Game.move(player,0,-1);
      if(keys[39]) Game.move(player,1,0);
      if(keys[40]) Game.move(player,0,1);
    },

    move: function(e,dx,dy) {
      e.x += dx*e.speed;
      e.y += dy*e.speed;
      log('x:'+e.x+',y:'+e.y);
      $(e.el).css({left: e.x+'px', top: e.y+'px'});
    }
  
  };

	Game.init();	
	Game.run();  
    
  $(document).bind('keydown', function(e) {  
    keys[e.keyCode] = true;
  });

  $(document).bind('keyup', function(e) {
    keys[e.keyCode] = false;
  });
  
  
});
