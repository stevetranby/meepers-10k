////////////////////////////////////////
// Author: Steve Tranby
// TODOs:
// - Fix wall collision to allow moving (or restrict movement to one direction at a time, might be the better way for now?)
// - Fix off by one calculation of position
////////////////////////////////////////

//globals
function log(msg) {
    if (console.log) {
        console.log(msg);
    }
}

function rnd(min, max) {    
    return min + Math.floor(Math.random() * (max - min)); 
}

function jqdiv(id, cls, str, x, y, w, h) {
    return $("<div/>", { 'id': id, 'class': cls, 'html': str }).css({ left: x, top: y, width: w, height: h }); 
}

function update_hud(health, rocks, keys, room) { 
    $("#health").html(health);
    $("#rocks").html(rocks);
    $("#keys").html(keys);
    $("#rooms").html(room);
}

var 
M = Math,
currentTime = new Date(),
directions = { STILL: 0, LEFT: 1, UP: 2, RIGHT: 3, DOWN: 4 }, 
n_directions = 5,
spritestates = { ALIVE: 0, DEAD: 1 }, 
n_spritestates = 2,
aistates = { RANDOM: 0, CHASE: 1, EVADE: 2, STILL: 3, PATTERN: 4, EXPLODE: 5 },
n_aistates = 6,
gamestates = { RUNNING: 0, PAUSED: 1 },
n_gamestates = 2,
tiletypes = { WALL: 0, DOOR: 1, FLOOR: 2, KEY: 3, ROCKBAG: 4 },
keycodes = { SPACE: 32, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, P: 80, A: 65, W: 87, D: 68, S: 83 },
keys = [],
cellsize = 32,
rows = 15,
cols = 15,
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
rooms = [],
floors = [],
level = 0,

dirX = function (dir) {
    if (dir == directions.LEFT) { return -1; }
    if (dir === directions.RIGHT) { return 1; }
    return 0;
},
dirY = function (dir) {
    if (dir == directions.UP) { return -1; }
    if (dir === directions.DOWN) { return 1; }
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
    state: spritestates.ALIVE,
    dir: directions.RIGHT,
    lastDir: directions.RIGHT,
    health: 100,
    rocks: 10,
    keys: 1,
    boundingBox: { x: 0, y: cellsize / 2, w: cellsize, h: cellsize / 2 },
    el: jqdiv('p0', 'p', ':)', this.x, this.y, cellsize, cellsize)
},

game = {
    state: gamestates.RUNNING,
    cur_room: 0,
    init: function () {

        log('init');

        // init	            
        $(idArea + ',' + idPaused + ',' + idGame).css({ width: cols * cellsize + PX, height: rows * cellsize + PX });

        // TODO: create a tile object, and populate from a file or direct in variable
        for (y = 0; y < rows; y++) {
            tiles[y] = [];
            for (x = 0; x < cols; x++) {
                // create div cell          
                var cls = 'c c', t = tiletypes.WALL;

                // Demo Setup
                if (0 === y || 0 === x || rows - 1 === y || cols - 1 === x || (x > 1 && x < cols - 2 && y % 6 === 3) || (x > 1 && x < cols - 2 && y % 6 == 5)) {
                    if ((x === 0 || cols - 1 === x) && Math.floor(rows / 2) === y) {
                        cls += '3';
                        t = tiletypes.DOOR;
                    } else {
                        cls += '2';
                    }
                }
                else {
                    cls += '1';
                    t = tiletypes.FLOOR;
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

        // init player
        $(idGame).append(player.el);

        // init monsters      
        for (var i = 0; i < numMonsters; ++i) {
            monsters[i] = {
                id: 'm' + i,
                x: cols / 2 * cellsize + (i - numMonsters / 2) * cellsize,
                y: rows / 2 * cellsize,
                oldx: 50 * i + 100,
                oldy: 100,
                dx: 0,
                dy: 0,
                w: cellsize,
                h: cellsize,
                attackPower: 2,
                dir: 1 + M.floor(M.random() * directions.DOWN),
                speed: 2,
                health: rnd(1, 3),
                state: spritestates.ALIVE,
                aistate: aistates.RANDOM,
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

    nextRoom: function () {
        // TODO: find the next room, and initialize it
    },

    nextLevel: function () {
        dlog('next level');
        ++level;
    },

    move: function (e) {
        e.oldx = e.x;
        e.oldy = e.y;
        e.dx = 0; e.dy = 0;
        switch (e.dir) {
            case directions.LEFT:
                e.dx = -e.speed;
                break;
            case directions.UP:
                e.dy = -e.speed;
                break;
            case directions.RIGHT:
                e.dx = e.speed;
                break;
            case directions.DOWN:
                e.dy = e.speed;
                break;
        }
        e.x += e.dx;
        e.y += e.dy;
        if (e.id.indexOf('w') > 0) { log("moving " + e.id + " to " + e.x + "," + e.y); }
    },

    update: function (e) {
        if (e.el) {
            e.el.css({ left: e.x + PX, top: e.y + PX });
        }
    },

    updatePlayer: function () {

        if (keys[keycodes.SPACE]) {
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
        if (keys[keycodes.LEFT]) { player.dir = directions.LEFT; }
        else if (keys[keycodes.UP]) { player.dir = directions.UP; }
        else if (keys[keycodes.RIGHT]) { player.dir = directions.RIGHT; }
        else if (keys[keycodes.DOWN]) { player.dir = directions.DOWN; }

        game.move(player);

        // if collide with monster, kill monster
        var monster = game.collideMonster(player);
        if (null !== monster) {
            player.health -= monster.attackPower;
        }

        if (player.x <= 0) { player.x = (cols - 1) * cellsize - 1 }
        if (player.x >= (cols - 1) * cellsize) { player.x = 1 }
        if (player.y <= 0) { player.y = (rows - 1) * cellsize - 1 }
        if (player.y >= (rows - 1) * cellsize) { player.y = 1 }

        // check collisions            
        if (game.collideTile(player, false)) {
            // player hit a non-walkable tile
            player.x = player.oldx;
            player.y = player.oldy;
        }

        game.update(player);

        if (player.dir != directions.STILL) player.lastDir = player.dir;
        player.dir = directions.STILL;
    },

    updateMonsters: function () {
        //log(monsters.length);
        for (var i = 0; i < monsters.length; ++i) {

            var monster = monsters[i];
            if (monster.state !== spritestates.DEAD) {

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
                    switch (monster.aistate) {
                        case aistates.RANDOM:
                            log('random');
                            monster.dir = rnd(1, n_directions - 1);
                            log('monster.dir=' + monster.dir);
                            break;
                        case aistates.CHASE:
                            // get dir based on player position -- 
                            // closest delta (x/y) will give orthogonal monster direction (deltax < deltay == UP/DOWN)
                            log('chase');
                            monster.dir = rnd(1, n_directions - 1);
                            break;
                        default:
                            log('default');
                            monster.dir = rnd(1, n_directions - 1);
                            break;
                    }
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
                    monster.dir = (monster.dir < directions.DOWN) ? monster.dir + 1 : directions.LEFT;
                    //log("[after]monster.dir = " + monster.dir);
                }

                game.update(monster, true);

                if (monster.dir != directions.STILL) monster.lastDir = monster.dir;
            }
        }
    },

    fireWeapon: function (e) {

        //log('firing weapon with x,y,dir = ' + e.x + ',' + e.y + ',' + e.dir);
        var _id = 'w' + weapons.length;

        log("firing weapon with dir = " + e.dir);

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
            state: spritestates.ALIVE,
            attackPower: 1,
            el: jqdiv(_id, 'w' + ((e == player) ? 'P' : 'M'), 'o', e.x + cellsize / 2, e.y + cellsize / 2, cellsize / 2, cellsize / 2)
        });

        var w = weapons[weapons.length - 1];
        $(idGame).append(w.el);

        //log('firing weapon(of ' + weapons.length + ') with id, x,y,dx,dy = ' + w.id + ',' + w.x + ',' + w.y + ',' + w.dx + ',' + w.dy);

        game.move(w);
        game.update(w);
    },

    updateWeapons: function () {
        //log(weapons.length);
        for (var i = 0; i < weapons.length; ++i) {
            var w = weapons[i];
            //log(w.id + ' [' + w.state + ']:: ' + w.x + ',' + w.y + ',' + w.dx + ',' + w.dy);
            if (w.state !== spritestates.DEAD) {

                game.move(w);

                if (w.parent == player) {
                    // if collide with monster, kill monster
                    var monster = game.collideMonster(w);
                    if (null !== monster) {
                        monster.health -= player.attack;
                        if (monster.health < 0) {
                            game.killMonster(monster);
                            game.killWeapon(w);
                        }
                    }
                } else {
                    // if collide with player, hurt player
                    if (game.collidePlayer(w)) {
                        player.health -= w.attackPower;
                        player.el.animate({ opacity: 0.5 }, {
                            duration: 100,
                            complete: function () {
                                player.el.animate({ opacity: 1.0 }, { duration: 100 });
                            }
                        });
                        game.killWeapon(w);
                    }
                }

                if (game.collideTile(w, true)) {
                    game.killWeapon(w);
                }
                // if threshold, change dir            
                if (w.x < 0 || w.y < 0 || w.x > (cols - 1) * cellsize || w.y > (rows - 1) * cellsize) {
                    game.killWeapon(w);
                }

                game.update(w);
            }
        }
    },

    updateHUD: function () {
        $(idHealth).html(player.health);
        $(idRocks).html(player.rocks);
        $(idKeys).html(player.keys);
    },

    killWeapon: function (w) {
        for (var i = 0; i < weapons.length; ++i) {
            if (w === weapons[i]) {
                w.state = spritestates.DEAD;
                if (w.el) { w.el.hide(); }
                //                if (weapons.length > 0) {
                //                    weapons.splice(i, 1);
                //                } else {
                //                    weapons = [];
                //                }
                //log('killed weapon: ' + w.id);
                return;
            }
        }
    },

    killMonster: function (m) {
        for (var i = 0; i < monsters.length; ++i) {
            if (m === monsters[i]) {
                m.state = spritestates.DEAD;
                if (m.el) { m.el.hide(); }
                //                if (monsters.length > 0) {
                //                    monsters.splice(i, 1);
                //                } else {
                //                    monsters = [];
                //                }
                return;
            }
        }
    },

    collideTile: function (e, collideWithDoor) {
        var x1 = Math.floor((e.x + e.w / 2) / cellsize), y1 = Math.floor((e.y + e.h / 2) / cellsize);

        if (x1 >= 0 && y1 >= 0 && x1 < cols && y1 < rows) {
            t1 = tiles[y1][x1].type;

            if (t1 == tiletypes.WALL) {
                return true;
            }

            if (collideWithDoor && t1 === tiletypes.DOOR) {
                return true;
            }
            return false;
        } else {
            return true;
        }
    },

    collideMonster: function (e) {
        for (var i = 0; i < monsters.length; ++i) {
            var m = monsters[i];
            if (m.state !== spritestates.DEAD) {
                if (e.x < m.x + m.w && e.y < m.y + m.h && e.x + e.w > m.x && e.y + e.h > m.y) {
                    return m;
                }
            }
        }
        return null;
    },

    collidePlayer: function (e) {
        if (e.x < player.x + player.w && e.y < player.y + player.h && e.x + e.w > player.x && e.y + e.h > player.y) {
            return true;
        }
        return false;
    },

    togglePaused: function () {
        log('toggling game state');
        if (game.state == gamestates.RUNNING) {
            game.state = gamestates.PAUSED;
            $(idPaused).show();
        } else {
            game.state = gamestates.RUNNING;
            $(idPaused).hide();
        }
    },

    run: function () {

        setInterval(function () {
            if (game.state == gamestates.RUNNING) {
                game.updatePlayer();
                game.updateMonsters();
                game.updateWeapons();
                game.updateHUD();
            }
        }, 20);
    }
};

$(document).bind('keydown', function (e) {
    keys[e.keyCode] = true;
});

$(document).bind('keyup', function (e) {
    keys[e.keyCode] = false;
    if (e.keyCode == keycodes.P) { game.togglePaused(); }
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