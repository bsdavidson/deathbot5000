/*jshint browser:true */

(function() {
'use strict';

SS.scoreServer = 'http://simplescore.herokuapp.com';
SS.gameId = 'DB5K';
SS.serverId = '320B';
SS.getScores(8);

var Berzerk = window.Berzerk = {};

Berzerk.DIR_UP = 0;
Berzerk.DIR_DOWN = 1;
Berzerk.DIR_LEFT = 2;
Berzerk.DIR_RIGHT = 3;
Berzerk.EPSILON = 1 / 32;

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

    var canvas = document.querySelector('#berzerk');
    var canvasBG = document.querySelector('#background');
    var game = window.berzerkGame = new Berzerk.Game(canvas, canvasBG, 'orange');
    game.loadImages();

    window.addEventListener('keydown', function(event) {
        game.onKeyDown(event);
    });

    window.addEventListener('keyup', function(event) {
        game.onKeyUp(event);
    });

    window.addEventListener('mousemove', function(event) {
        game.onMouseMove(event);
    });

    var blurred = false;
    var setFocus = function(event) {
        if (event) {
            if (event.type === 'blur') {
                blurred = true;
            } else if (event.type === 'focus') {
                blurred = false;
            }
        }
        game.setFocus(event, document.hidden || blurred);
    };
    setFocus();
    window.addEventListener('blur', setFocus, true);
    window.addEventListener('focus', setFocus, true);
    window.addEventListener('visibilitychange', setFocus, true);

    var resizeTimeout;
    window.onresize = function(event) {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
            resizeTimeout = null;
        }
        resizeTimeout = setTimeout(function() {
            resizeTimeout = null;
            game.onResize(event);
        }, 1000);
    };



    var oldFrameTime = (new Date().getTime() / 1000);
    var tick = function() {
        var newFrameTime = (new Date().getTime() / 1000);
        var elapsedTime = newFrameTime - oldFrameTime;
        oldFrameTime = newFrameTime;
        game.tick(elapsedTime);
        setTimeout(tick, Math.floor(1000 / game.framesPerSecond));
    };
    tick();
});

}());
