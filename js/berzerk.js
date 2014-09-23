/*jshint browser:true */

(function() {
'use strict';

var Berzerk = window.Berzerk = {};

Berzerk.DIR_UP = 0;
Berzerk.DIR_DOWN = 1;
Berzerk.DIR_LEFT = 2;
Berzerk.DIR_RIGHT = 3;
Berzerk.EPSILON = 1 / 32;
Berzerk.INF = 2600;
Berzerk.DEBUG_TILE = 9;

Berzerk.directions = [
    {x: 0, y: -1},
    {x: 0, y: 1},
    {x: -1, y: 0},
    {x: 1, y: 0}
];

Berzerk.directionNames = ['up', 'down', 'left', 'right'];

Berzerk.getDirectionIndex = function(dirX, dirY) {
    if (dirX > 0) {
        return Berzerk.DIR_RIGHT;
    } else if (dirX < 0) {
        return Berzerk.DIR_LEFT;
    } else if (dirY > 0) {
        return Berzerk.DIR_DOWN;
    } else if (dirY < 0) {
        return Berzerk.DIR_UP;
    } else {
        return Berzerk.DIR_RIGHT;
    }
};

window.addEventListener('load', function() {
    // The Berzerk properties will be filled in by the other scripts. Even
    // though they don't look like they exist at this point, they will by the
    // time the window load event has fired.

    var game = new Berzerk.Game('#berzerk', 'orange');
    window.berzerkGame = game;

    window.addEventListener('keydown', function(event) {
        game.onKeyDown(event);
    });

    window.addEventListener('keyup', function(event) {
        game.onKeyUp(event);
    });

    window.addEventListener('mousemove', function(event) {
        game.onMouseMove(event);
    });

    game.loadImages();

    var blurred = false;
    var framesPerSecond;
    var updateFramesPerSecond = function(event) {
        if (event) {
            if (event.type === 'blur') {
                blurred = true;
            } else if (event.type === 'focus') {
                blurred = false;
            }
        }
        if (game.debugMode && (document.hidden || blurred)) {
            framesPerSecond = 1;
        } else {
            framesPerSecond = 30;
        }
    };

    updateFramesPerSecond();
    window.addEventListener('blur', updateFramesPerSecond, true);
    window.addEventListener('focus', updateFramesPerSecond, true);
    window.addEventListener('visibilitychange', updateFramesPerSecond, true);

    window.onresize = function(){
        window.setTimeout(game.resize(), 1000);
    };

    var oldFrameTime = (new Date().getTime() / 1000);

    var tick = function() {
        var newFrameTime = (new Date().getTime() / 1000);
        var elapsedTime = newFrameTime - oldFrameTime;
        oldFrameTime = newFrameTime;
        game.cumulativeTime += elapsedTime;
        if (game.imagesLoaded) {
            if(!game.initialized) {
                game.drawBackground(elapsedTime);
                game.initialize(elapsedTime);
            }
            game.draw(elapsedTime);
            game.update(elapsedTime);
        } else {
            game.gameLoading();
        }
        setTimeout(tick, Math.floor(1000 / framesPerSecond));
    };
    tick();
});

}());
