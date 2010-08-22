////////////////////////////////////////
// Author: Steve Tranby
// TODOs:
// - Encapsulate functionality into various prototypes (Shoot for fewer globals)
// - Fix Monster issue with random selection tending toward the top-right corner
// - Implement Chase AI
// - Implement Evade AI
// - SVG graphics for player
// - SVG graphics for monster 1
// - SVG graphics for monster 2
// - SVG graphics for player weapon 
// - SVG graphics for player sword
// - SVG graphics for lazer weapon 
//
// DONE:
// - Fix wall collision to allow moving (or restrict movement to one direction at a time, might be the better way for now?)
// - Fix off by one calculation of position
////////////////////////////////////////

// log(msg) requires functions to be named --> function _NAME_() <--
function log(msg) {
  if (console.log) {
    var matches = arguments.callee.caller.toString(0).match(/function\s+([^\s\(]+)/);
    if (matches && matches.length > 1) {
      console.log('[' + matches[1] + ']:');
    } else if (matches && matches.length > 0) {
      console.log('[' + matches[0] + ']:');
    }
    console.log(msg);
  }
}

// random number from min to max
// rnd(2, 5) should give 2,3,4,5 randomly
function rnd(min, max) {
  return min + M.floor(M.random() * (max + 1 - min));
}

function jqdiv(id, cls, str, x, y, w, h) {
  return $("<div/>", { 'id': id, 'class': cls, 'html': str }).css({ left: x, top: y, width: w, height: h });
}

function update_hud(p) {
  $("#health").html(p.health);
  $("#rocks").html(p.rocks);
  $("#keys").html(p.keys);
  $("#rooms").html(p.room);
}


//globals
var 
TRUE = true,
FALSE = false,
M = Math,
currentTime = new Date(),
DIR_STILL = 0, DIR_UP = 1, DIR_RIGHT = 2, DIR_LEFT = 3, DIR_DOWN = 4,
ALIVE = 0, DEAD = 1,
AI_RANDOM = 0, AI_CHASE = 1, AI_EVADE = 2, AI_STILL = 3, AI_PATTERN = 4, AI_EXPLODE = 5,
RUNNING = 0, PAUSED = 1,
n_directions = 5,
n_spritestates = 2,
n_aistates = 6,
n_gamestates = 2,
//tiletypes = { WALL: 0, DOOR: 1, FLOOR: 2, KEY: 3, ROCKS: 4 },
TILE_WALL = 0, TILE_DOOR = 1, TILE_FLOOR = 2, TILE_KEY = 3, TILE_ROCKS = 4,
//keycodes
//keycodes = { SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, P: 80, A: 65, W: 87, D: 68, S: 83 },
KEY_SPACE = 32, KEY_LEFT = 37, KEY_UP = 38, KEY_RIGHT = 39, KEY_DOWN = 40, KEY_P = 80, KEY_A = 65, KEY_W = 87, KEY_D = 68, KEY_S = 83,
keys = [],
cellsize = 32,
rows = 15,
cols = 22,
numRooms = rows * cols,
numMonsters = 5,
difficulty = 1, // difficulty 1-5 (should multiply # of monsters, monster quickness to fire weapon, health)
PX = 'px',
idArea = '#area',
idGame = '#game',
idPaused = '#paused',
idHealth = "#health",
idRocks = "#rocks",
idKeys = "#keys",
tiles = [],
monsters = [],
weapons = [],
firing = false,
roomels = [],
// rooms - Doors: t,r,d,l ; Non-Floor-Tiles:
rooms = [{
  cols: 16,
  rows: 10,
  doors: [TRUE, TRUE, TRUE, TRUE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[3, 5], [3, 5], [3, 6], [3, 4]]
}, {
  cols: 15,
  rows: 9,
  doors: [FALSE, TRUE, FALSE, TRUE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 5], [4, 5], [5, 6], [5, 4]]
}, {
  cols: 10,
  rows: 5,
  doors: [FALSE, FALSE, FALSE, TRUE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[1, 2], [8, 3]]
}, {
  cols: 12,
  rows: 12,
  doors: [FALSE, TRUE, TRUE, TRUE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 5], [5, 4]]
}, {
  cols: 10,
  rows: 15,
  doors: [FALSE, TRUE, FALSE, FALSE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 5], [4, 5]]
}, {
  cols: 10,
  rows: 5,
  doors: [FALSE, FALSE, FALSE, TRUE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 2], [4, 3], [5, 2], [5, 4], [5, 1], [5, 3]]
}, {
  cols: 12,
  rows: 12,
  doors: [FALSE, TRUE, TRUE, TRUE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 5], [4, 5], [5, 6]]
}, {
  cols: 10,
  rows: 15,
  doors: [FALSE, TRUE, FALSE, FALSE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 5], [4, 5], [5, 6], [5, 4]]
}, {
  cols: 15,
  rows: 9,
  doors: [FALSE, FALSE, FALSE, FALSE],
  tiles: [[3, 4, TILE_WALL], [6, 8, TILE_KEY], [5, 6, TILE_ROCKS]],
  monsterPositions: [[5, 5], [4, 5], [5, 6], [5, 4], [5, 5], [4, 5], [5, 6], [5, 4], [5, 5], [4, 5], [5, 6], [5, 4], [5, 5], [4, 5], [5, 6], [5, 4]]
}],
curRoom = 0,
curLevel = 0,

dirX = function (dir) {
  if (dir == DIR_LEFT) { return -1; }
  if (dir === DIR_RIGHT) { return 1; }
  return 0;
},
dirY = function (dir) {
  if (dir == DIR_UP) { return -1; }
  if (dir === DIR_DOWN) { return 1; }
  return 0;
},

player = {
  id: 'p0',
  x: 100,
  y: 200,
  dx: 0,
  dy: 0,
  w: cellsize,
  h: cellsize,
  speed: 3,
  state: ALIVE,
  dir: DIR_RIGHT,
  lastDir: DIR_RIGHT,
  health: 100,
  rocks: 100,
  keys: 1,
  attack: 2,
  boundingBox: { x: 0, y: cellsize / 2, w: cellsize, h: cellsize / 2 },
  el: jqdiv('p0', 'p', ':)', this.x, this.y, cellsize, cellsize)
},

game = {
  state: RUNNING,
  cur_room: 0,


  // TODO: check if function name for debugging is compressed with compressor
  // The extra function name is for debugging
  initRoomDemo: function initRoomDemo() {
    log('enter');
    // TODO: create a tile object, and populate from a file or direct in variable
    tiles = [];
    for (y = 0; y < rows; y++) {
      tiles[y] = [];
      for (x = 0; x < cols; x++) {
        // create div cell          
        var cls = 'c c', t = TILE_WALL;

        // Demo Setup
        if (0 === y || 0 === x || rows - 1 === y || cols - 1 === x || (x > 1 && x < cols - 2 && y % 6 === 3) || (x > 1 && x < cols - 2 && y % 6 == 5)) {
          if ((x === 0 || cols - 1 === x) && M.floor(rows / 2) === y) {
            cls += '3';
            t = TILE_DOOR;
          } else {
            cls += '2';
          }
        }
        else {
          cls += '1';
          t = TILE_FLOOR;
        }

        $(idGame).append(jqdiv('c' + (y * x), cls, '.', x * cellsize, y * cellsize, cellsize, cellsize));

        tiles[y][x] = {
          x: x,
          y: y,
          w: cellsize,
          h: cellsize,
          type: t
        };
      }
    }
  },

  initRoom: function initRoom(i) {
    log('enter room ' + i + '');

    if (rooms[i]) {
      room = rooms[i];
      cols = room.cols;
      rows = room.rows;

      // Clear board
      $(idGame + ' .c').remove();

      // Create the Floor/Walls/Doors
      tiles = [];
      for (y = 0; y < rows; y++) {
        tiles[y] = [];
        for (x = 0; x < cols; x++) {
          // create div cell          
          var cls = 'c c', t = TILE_WALL;

          // Demo Setup
          if (0 === y || 0 === x || rows - 1 === y || cols - 1 === x) {
            // doors 0-3 :: up,right,down,left
            if ((room.doors[3] && (0 === x) && M.floor(rows / 2) === y) || (room.doors[1] && (cols - 1 === x) && M.floor(rows / 2) === y) ||
                (room.doors[0] && (0 === y) && M.floor(cols / 2) === x) || (room.doors[2] && (rows - 1 === y) && M.floor(cols / 2) === x)) {
              cls += '3';
              t = TILE_DOOR;
            } else {
              cls += '2';
            }
          }
          else {
            cls += '1';
            t = TILE_FLOOR;
          }

          $(idGame).append(jqdiv('c' + (y * x), cls, '', x * cellsize, y * cellsize, cellsize, cellsize));

          tiles[y][x] = {
            x: x,
            y: y,
            w: cellsize,
            h: cellsize,
            type: t
          };
        } // end for x
      } // end for y

      // Create the room's extra tiles  
      log(room);
      log(room.monsterPositions);
      game.initMonsters(room.monsterPositions);

      // TODO: game.initWeapons      
      // Remove all weapons
      $(idGame + ' .w').remove();
      weapons = [];

      // Set player if first room
      if (player.x < cellsize && player.y < cellsize) {
        player.x = M.floor(cols / 2);
        player.y = M.floor(rows / 2);
      }

    } else {
      alert('error initRoom');
    }
  },

  initMonsters: function initMonsters(mPos) {

    log(mPos);

    $(idGame + ' .m').remove();
    numMonsters = mPos.length;
    monsters = [];

    for (var i = 0; i < numMonsters; ++i) {
      _health = rnd(1, 9);
      _x = mPos[i][0] * cellsize;
      _y = mPos[i][1] * cellsize;

      // TODO: monsters[i] = new Monster();
      monsters[i] = {
        id: 'm' + i,
        x: _x,
        y: _y,
        oldx: _x,
        oldy: _y,
        dx: 0,
        dy: 0,
        w: cellsize,
        h: cellsize,
        attack: 2,
        dir: DIR_UP + rnd(DIR_UP, DIR_DOWN - DIR_UP),
        speed: 2,
        health: _health,
        healthMax: _health,
        state: ALIVE,
        aistate: AI_RANDOM,
        aiTimer: 0,
        aiTimerThreshold: 100,
        dirTimer: 0,
        dirTimerThreshold: 100,
        el: jqdiv('m' + i, 'm', 'M', 0, 0, cellsize, cellsize)
      };
      //log(monsters[i]);
      $(idGame).append(monsters[i].el);
    }
  },

  init: function init() {
    log('enter');

    // init	            
    $(idArea + ',' + idPaused + ',' + idGame).css({ width: cols * cellsize + PX, height: rows * cellsize + PX });

    //game.initRoomDemo();
    game.initRoom(curRoom);

    // init player
    $(idGame).append(player.el);
  },

  nextRoom: function nextRoom(dir) {
    log('enter');
    // TODO: find the next room, and initialize it
    ++curRoom;
    if (curRoom == rooms.length) {
      curRoom = 0;
    }

    game.initRoom(curRoom);
    log(cols + ' x ' + rows);
    // Reset player
    switch (dir) {
      case DIR_LEFT:
        player.x = (cols - 1) * cellsize - M.floor(cellsize / 2);
        player.y = M.floor(rows / 2) * cellsize - 1;
        break;
      case DIR_RIGHT:
        player.x = cellsize + M.floor(cellsize / 2);
        player.y = M.floor(rows / 2) * cellsize - 1;
        break;
      case DIR_UP:
        player.x = M.floor(cols / 2) * cellsize;
        player.y = (rows - 1) * cellsize - M.floor(cellsize / 2);
        break;
      case DIR_DOWN:
        player.x = M.floor(cols / 2) * cellsize;
        player.y = cellsize + M.floor(cellsize / 2);
        break;
    }
    log('p.x=' + player.x + ',p.y=' + player.y);
    game.move(player);
  },

  nextLevel: function nextLevel() {
    log('enter');
    ++curLevel;
    if (curLevel > roomels.length) {
      alert('Game Over!');
    }


  },


  fireWeapon: function fireWeapon(e) {

    //log('firing weapon with x,y,dir = ' + e.x + ',' + e.y + ',' + e.dir);
    var _id = 'w' + weaponsIdCount++;

    //log(e + " is firing weapon with dir = " + e.dir);

    weapons.push({
      id: _id,
      x: e.x + cellsize / 4,
      y: e.y + cellsize / 4,
      oldx: e.x + cellsize / 4,
      oldy: e.y + cellsize / 4,
      dx: 0,
      dy: 0,
      w: cellsize / 2,
      h: cellsize / 2,
      dir: e.lastDir,
      speed: 5,
      parent: e,
      state: ALIVE,
      attack: 1,
      el: jqdiv(_id, 'w w' + ((e == player) ? 'P' : 'M'), 'o', e.x + cellsize / 2, e.y + cellsize / 2, cellsize / 2, cellsize / 2)
    });

    var w = weapons[weapons.length-1];
    $(idGame).append(w.el);

    log('firing weapon(of ' + weapons.length + ') with id, x,y,dx,dy = ' + w.id + ", " + w.el.attr('class') + ',' + w.x + ',' + w.y + ',' + w.dx + ',' + w.dy);

    game.move(w);
    game.update(w);
  },

  move: function move(e) {
    e.oldx = e.x;
    e.oldy = e.y;
    e.dx = 0; e.dy = 0;
    switch (e.dir) {
      case DIR_LEFT:
        e.dx = -e.speed;
        break;
      case DIR_UP:
        e.dy = -e.speed;
        break;
      case DIR_RIGHT:
        e.dx = e.speed;
        break;
      case DIR_DOWN:
        e.dy = e.speed;
        break;
    }
    e.x += e.dx;
    e.y += e.dy;
    if (e.id.indexOf('w') > 0) { log("moving " + e.id + " to " + e.x + "," + e.y); }
  },

  update: function update(e) {
    if (e.el) {
      e.el.css({ left: e.x + PX, top: e.y + PX });
    }
  },

  updatePlayer: function updatePlayer() {

    if (keys[KEY_SPACE]) {
      if (!firing) {
        if (player.rocks > 0) {
          game.fireWeapon(player);
          firing = true;
          --player.rocks;
        }
      }
    } else {
      firing = false;
    }

    /*
    // no diagonals
    if(keys[37]) { tdx=-5; tdy=0; }
    if(keys[38]) { tdx=0; tdy=-5; }
    if(keys[39]) { tdx=5; tdy=0; }
    if(keys[40]) { tdx=0; tdy=5; }
    */

    // with diagonal
    if (keys[KEY_LEFT]) { player.dir = DIR_LEFT; }
    else if (keys[KEY_UP]) { player.dir = DIR_UP; }
    else if (keys[KEY_RIGHT]) { player.dir = DIR_RIGHT; }
    else if (keys[KEY_DOWN]) { player.dir = DIR_DOWN; }

    game.move(player);

    // if collide with monster, kill monster
    var monster = game.collideMonster(player);
    if (null !== monster) {
      player.health -= monster.attack;
    }

    if (player.x <= 0) {
      game.nextRoom(DIR_LEFT);
    }
    else if (player.x >= (cols - 1) * cellsize) {
      game.nextRoom(DIR_RIGHT);
    }
    else if (player.y <= 0) {
      game.nextRoom(DIR_UP);
    }
    else if (player.y >= (rows - 1) * cellsize) {

      game.nextRoom(DIR_DOWN);
    }

    // check collisions            
    if (game.collideTile(player, false)) {
      // player hit a non-walkable tile
      player.x = player.oldx;
      player.y = player.oldy;
    }

    game.update(player);

    if (player.dir != DIR_STILL) player.lastDir = player.dir;
    player.dir = DIR_STILL;
  },

  updateMonsters: function updateMonsters() {
    //log(monsters.length);
    for (var i = 0; i < monsters.length; ++i) {

      var monster = monsters[i];
      if (monster.state !== DEAD) {

        // check and change direction
        monster.dirTimer += 1;
        if (monster.dirTimer > monster.dirTimerThreshold) {

          monster.dirTimer = 0;

          // check and change ai state
          monster.aiTimer += 1;
          if (++monster.aiTimer > monster.aiTimerThreshold) {
            monster.aiTimer = 0;

            // TODO: Move the actual change of AI state to a method of monster class
            // monster.changeState()
            monster.aistate = rnd(1, n_aistates - 1);
          }

          // Move the actual change of direction selection to a method of monster class
          // monster.changeDirection()
          max = DIR_DOWN - DIR_UP + 1;
          min = DIR_UP;
          switch (monster.aistate) {
            case AI_RANDOM:
              //log('random');
              monster.dir = rnd(min, max);
              break;
            case AI_CHASE:
              // get dir based on player position -- 
              // closest delta (x/y) will give orthogonal monster direction (deltax < deltay == UP/DOWN)
              log('chase');
              monster.dir = rnd(min, max);
              break;
            default:
              log('default');
              monster.dir = rnd(min, max);
              break;
          }
          log('rnd(2,5)= ' + rnd(2, 5) + ' ,  monster.dir=' + monster.dir);
        }

        game.move(monster);

        if (rnd(0, 100) == 25) {
          game.fireWeapon(monster);
        }

        // check for collisions
        if (game.collideTile(monster, true)) {
          monster.x -= 2 * monster.dx;
          monster.y -= 2 * monster.dy;
          //log("[before]monster.dir = " + monster.dir);
          //monster.dir = dirRevers(monster.dir);
          switch (monster.dir) {
            case DIR_UP: monster.dir = DIR_DOWN;
              break;
            case DIR_RIGHT: monster.dir = DIR_LEFT;
              break;
            case DIR_DOWN: monster.dir = DIR_UP;
              break;
            case DIR_LEFT: monster.dir = DIR_RIGHT;
              break;
          }
          log("[after]monster.dir = " + monster.dir);
          //monster.dir = DIR_STILL;
        }

        game.update(monster, true);

        if (monster.dir != DIR_STILL) monster.lastDir = monster.dir;
      }
    }
  },


  updateWeapons: function updateWeapons() {
    //log(weapons.length);
    for (var i = 0; i < weapons.length; ++i) {
      var w = weapons[i];
      //log(w.id + ' [' + w.state + ']:: ' + w.x + ',' + w.y + ',' + w.dx + ',' + w.dy);
      if (w.state !== DEAD) {

        game.move(w);

        shouldKillWeapon = false;

        if (w.parent == player) {
          // if collide with monster, kill monster
          var monster = game.collideMonster(w);
          if (null !== monster) {
            monster.health -= player.attack;
            if (monster.health <= 0) {
              game.killMonster(monster);
            }
            monster.el.fadeTo("fast", monster.health / monster.healthMax);
            log('monster.health = ' + monster.health);
            shouldKillWeapon = true;
          }

          // TODO: consolidate these collision routines
          // check if collide with monster weapon
          var weapon = game.collideMonsterWeapon(w);
          if (null !== weapon) {
            game.killWeapon(weapon);
            shouldKillWeapon = true;
          }

        } else {
          // if collide with player, hurt player
          if (game.collidePlayer(w)) {
            player.health -= w.attack;
            player.el.animate({ opacity: 0.5 }, {
              duration: 100,
              complete: function () {
                player.el.animate({ opacity: 1.0 }, { duration: 100 });
              }
            });
            shouldKillWeapon = true;
          }
        }

        if (game.collideTile(w, true)) {
          shouldKillWeapon = true;
        }
        // if threshold, change dir            
        if (w.x < 0 || w.y < 0 || w.x > (cols - 1) * cellsize || w.y > (rows - 1) * cellsize) {
          shouldKillWeapon = true;
        }

        if (shouldKillWeapon) game.killWeapon(w);
        game.update(w);
      }
    }
  },

  updateHUD: function updateHUD() {
    $(idHealth).html(player.health);
    $(idRocks).html(player.rocks);
    $(idKeys).html(player.keys);
  },

  killWeapon: function killWeapon(w) {
    for (var i = 0; i < weapons.length; ++i) {
      if (w === weapons[i]) {
        w.state = DEAD;
        if (w.el) { w.el.remove(); }
        weapons.splice(i, 1);
        return;
      }
    }
  },

  killMonster: function killMonster(m) {
    for (var i = 0; i < monsters.length; ++i) {
      if (m === monsters[i]) {
        m.state = DEAD;
        if (m.el) { m.el.remove(); }
        monsters.splice(i, 1);
        return;
      }
    }
  },

  collideTile: function collideTile(e, collideWithDoor) {
    var x1 = M.floor((e.x + e.w / 2) / cellsize), y1 = M.floor((e.y + e.h / 2) / cellsize);

    if (x1 >= 0 && y1 >= 0 && x1 < cols && y1 < rows) {
      t1 = tiles[y1][x1].type;

      if (t1 == TILE_WALL) {
        return true;
      }

      if (collideWithDoor && t1 === TILE_DOOR) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  },

  collideMonsterWeapon: function collideMonsterWeapon(e) {
    for (var i = 0; i < weapons.length; ++i) {
      var w = weapons[i];
      if (e !== w) {
        if (w.state !== DEAD && w.parent !== player) {
          // TODO: refactor to method
          if (e.x < w.x + w.w && e.y < w.y + w.h && e.x + e.w > w.x && e.y + e.h > w.y) {
            return w;
          }
        }
      }
    }
    return null;
  },

  collideMonster: function collideMonster(e) {
    for (var i = 0; i < monsters.length; ++i) {
      var m = monsters[i];
      if (m.state !== DEAD) {
        if (e.x < m.x + m.w && e.y < m.y + m.h && e.x + e.w > m.x && e.y + e.h > m.y) {
          return m;
        }
      }
    }
    return null;
  },

  collidePlayer: function collidePlayer(e) {
    if (e.x < player.x + player.w && e.y < player.y + player.h && e.x + e.w > player.x && e.y + e.h > player.y) {
      return true;
    }
    return false;
  },

  togglePaused: function togglePaused() {
    log('toggling game state');
    if (game.state == RUNNING) {
      game.state = PAUSED;
      $(idPaused).show();
    } else {
      game.state = RUNNING;
      $(idPaused).hide();
    }
  },

  run: function run() {

    setInterval(function () {
      if (game.state == RUNNING) {
        game.updatePlayer();
        game.updateMonsters();
        game.updateWeapons();
        game.updateHUD(player);
      }
    }, 20);
  }
};

$(document).bind('keydown', function (e) {
  keys[e.keyCode] = true;
});

$(document).bind('keyup', function (e) {
  keys[e.keyCode] = false;
  if (e.keyCode == KEY_P) { game.togglePaused(); }
});

game.init();
game.run();

/*
/////////////////////
// LEVEL MAP IDEAS //
/////////////////////

Each room can have a door on each side

BYTE for each room
1,2-NorthDoor(00),EastDoor(01),SouthDoor(10),WestDoor(11)
3,4-NoDoor(00),OpenDoor(01),KeyDoor(10),BossDoor(11)

*/