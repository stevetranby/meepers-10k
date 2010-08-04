//globals 
function log(msg) { if (console.log) { console.log(msg); } }
function jqdiv(id, cls, str, x, y, w, h) { return $("<div id='" + id + "' class='" + cls + "'>" + str + "</div>").css({ left: x, top: y, width: w, height: h }); }

function update_hud(health, rocks, keys, room) {
    $("#health").html(health);
    $("#health").html(rocks);
    $("#health").html(keys);
    $("#health").html(room);
}

var 
STILL = 0, UP = 1, LEFT = 2, RIGHT = 3, DOWN = 4,
ALIVE = 0, DEAD = 1, RANDOM = 2, CHASE = 3, EVADE = 4, STILL = 5, PATTERN = 6, EXPLODE = 7,
RUNNING = 0, PAUSED = 1,
KEY_SPACE = 32, KEY_LEFTARROW = 37, KEY_UPARROW = 38, KEY_RIGHTARROW = 39, KEY_DOWNARROW = 40, KEY_P = 80,
keys = [],
cellsize = 32,
rows = 9,
cols = 16,
numRooms = rows * cols,
numMonsters = 5,
divArea = $('#area'),
divGame = $('#game'),
divPaused = $('#paused'),
monsters = [],
weapons = [],
firing = false,
rooms = [],
floors = [],
level = 0,

dirX = function (dir) {
    if (dir == LEFT) { return -1; }
    if (dir === RIGHT) { return 1; }
    return 0;
},
dirY = function (dir) {
    if (dir == UP) { return -1; }
    if (dir === DOWN) { return 1; }
    return 0;
},

player = {
    id: 'p0',
    x: 10,
    y: 10,
    dx: 0,
    dy: 0,
    w: cellsize,
    h: cellsize,
    speed: 4,
    state: ALIVE,
    dir: RIGHT,
    health: 100,
    rocks: 10,
    keys: 1,
    el: jqdiv('p0', 'p', ':)', this.x, this.y, cellsize, cellsize)
},

game = {
    state: RUNNING,
    cur_room: 0,
    init: function () {

        log('init');

        // init	      
        divArea.css({ width: cols * cellsize + 'px', height: rows * cellsize + 'px' });
        divPaused.css({ width: cols * cellsize + 'px', height: rows * cellsize + 'px' });
        divGame.css({ width: cols * cellsize + 'px', height: rows * cellsize + 'px' });

        for (y = 0; y < rows; y++) {
            for (x = 0; x < cols; x++) {
                // create div cell          
                var cls = 'c c';
                if (0 === y || 0 === x || rows - 1 === y || cols - 1 === x) { cls += '2'; }
                else { cls += '1'; }
                divGame.append(jqdiv('c' + (y * x), cls, '.', x * cellsize, y * cellsize, cellsize, cellsize));
            }
        }

        // init player
        divGame.append(player.el);

        // init monsters      
        for (var i = 0; i < numMonsters; ++i) {
            monsters[i] = {
                id: 'm' + i,
                x: 50 * i + 50,
                y: 20,
                dx: Math.random() * 5,
                dy: Math.random() * 5,
                w: cellsize,
                h: cellsize,
                attackPower: 5,
                state: ALIVE,
                el: jqdiv('m' + i, 'm', 'M', 0, 0, cellsize, cellsize),
                dir: DOWN
            };
            //log(monsters[i]);
            divGame.append(monsters[i].el);
        }
    },

    nextLevel: function () {
        dlog('next level');
        ++level;
    },

    move: function (e) {
        e.oldx = e.x;
        e.oldy = e.y;
        e.x += e.dx;
        e.y += e.dy;
        if (e.id.indexOf('w') > 0) { log("moving " + e.id + " to " + e.x + "," + e.y); }
    },

    update: function (e) {
        if (e.el) {
            e.el.css({ left: e.x + 'px', top: e.y + 'px' });
        }
    },

    updatePlayer: function () {

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

        var tdx = 0, tdy = 0;

        /*
        // no diagonals
        if(keys[37]) { tdx=-5; tdy=0; }
        if(keys[38]) { tdx=0; tdy=-5; }
        if(keys[39]) { tdx=5; tdy=0; }
        if(keys[40]) { tdx=0; tdy=5; }
        */

        // with diagonal
        if (keys[KEY_LEFTARROW]) { tdx = -player.speed; player.dir = LEFT; }
        if (keys[KEY_UPARROW]) { tdy = -player.speed; player.dir = UP; }
        if (keys[KEY_RIGHTARROW]) { tdx = player.speed; player.dir = RIGHT; }
        if (keys[KEY_DOWNARROW]) { tdy = player.speed; player.dir = DOWN; }

        player.dx = tdx; player.dy = tdy;

        game.move(player);

        // if collide with monster, kill monster
        var monster = game.collideMonster(player);
        if (null !== monster) {
            player.health -= monster.attackPower;
        }

        // check collisions                
        if (player.x < 0 || player.x > (cols - 1) * cellsize) {
            player.x = player.oldx;
        }
        if (player.y < 0 || player.y > (rows - 1) * cellsize) {
            player.y = player.oldy;
        }

        game.update(player);
    },

    updateMonsters: function () {
        //log(monsters.length);
        for (var i = 0; i < monsters.length; ++i) {

            var monster = monsters[i];
            if (monster.state !== DEAD) {
                game.move(monster);

                // if threshold, change dir
                if (monster.x > (cols - 1) * cellsize) { monster.dir = LEFT; monster.dx = -monster.dx; }
                if (monster.x < 0) { monster.dir = RIGHT; monster.dx = -monster.dx; }
                if (monster.y > (rows - 1) * cellsize) { monster.dir = UP; monster.dy = -monster.dy; }
                if (monster.y < 0) { monster.dir = DOWN; monster.dy = -monster.dy; }

                game.update(monster);
            }
        }
    },

    fireWeapon: function (e) {

        //log('firing weapon with x,y,dir = ' + e.x + ',' + e.y + ',' + e.dir);
        var _id = 'w' + weapons.length;
        weapons.push({
            id: _id,
            x: e.x,
            y: e.y,
            dx: 6 * dirX(e.dir),
            dy: 6 * dirY(e.dir),
            w: cellsize / 2,
            h: cellsize / 2,
            parent: e,
            state: ALIVE,
            el: jqdiv(_id, 'w', 'o', e.x + cellsize / 2, e.y + cellsize / 2, cellsize / 2, cellsize / 2)
        });

        var w = weapons[weapons.length - 1];
        divGame.append(w.el);

        //log('firing weapon(of ' + weapons.length + ') with id, x,y,dx,dy = ' + w.id + ',' + w.x + ',' + w.y + ',' + w.dx + ',' + w.dy);

        game.move(w);
        game.update(w);
    },

    updateWeapons: function () {
        //log(weapons.length);
        for (var i = 0; i < weapons.length; ++i) {
            var w = weapons[i];
            //log(w.id + ' [' + w.state + ']:: ' + w.x + ',' + w.y + ',' + w.dx + ',' + w.dy);
            if (w.state !== DEAD) {
                game.move(w);

                // if collide with monster, kill monster
                var monster = game.collideMonster(w);
                if (null !== monster) {
                    game.killMonster(monster);
                    game.killWeapon(w);
                }

                // TODO: DRY collision stuff
                // if threshold, change dir            
                if (w.x < 0 || w.y < 0 || w.x > (cols - 1) * cellsize || w.y > (rows - 1) * cellsize) {
                    game.killWeapon(w);
                }

                game.update(w);
            }
        }
    },

    updateHUD: function () {
        $("#health").html(player.health);
        $("#rocks").html(player.rocks);
        $("#keys").html(player.keys);
    },

    killWeapon: function (w) {
        for (var i = 0; i < weapons.length; ++i) {
            if (w === weapons[i]) {
                w.state = DEAD;
                if (w.el) { w.el.hide(); }
                //                if (weapons.length > 0) {
                //                    weapons.splice(i, 1);
                //                } else {
                //                    weapons = [];
                //                }
                log('killed weapon: ' + w.id);
                return;
            }
        }
    },

    killMonster: function (m) {
        for (var i = 0; i < monsters.length; ++i) {
            if (m === monsters[i]) {
                m.state = DEAD;
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

    collideMonster: function (e) {
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

    togglePaused: function () {
        log('toggling game state');
        if (game.state == RUNNING) {
            game.state = PAUSED;
            $('#paused').show();
        } else {
            game.state = RUNNING;
            $('#paused').hide();
        }
    },

    run: function () {

        setInterval(function () {
            if (game.state == RUNNING) {
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