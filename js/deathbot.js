/*jshint browser:true */
'use strict';

window.Deathbot = exports;
export {Game} from './game';
export {Player} from './player';
export {Monster} from './monster';
export {Bullet} from './bullet';

window.addEventListener('load', () => {
  // The Deathbot properties will be filled in by the other scripts. Even
  // though they don't look like they exist at this point, they will by the
  // time the window load event has fired.

  var canvas = document.querySelector('#deathbot');
  var canvasBG = document.querySelector('#background');
  var game = window.deathbotGame = new exports.Game(
    canvas, canvasBG, '#111');
  game.loadImages();

  window.addEventListener('keydown', (event) => {
    game.onKeyDown(event);
  });

  window.addEventListener('keyup', (event) => {
    game.onKeyUp(event);
  });

  window.addEventListener('mousemove', (event) => {
    game.onMouseMove(event);
  });

  var blurred = false;
  var setFocus = (event) => {
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
  window.onresize = (event) => {
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
  var tick = () => {
    var newFrameTime = (new Date().getTime() / 1000);
    var elapsedTime = newFrameTime - oldFrameTime;
    oldFrameTime = newFrameTime;
    game.tick(elapsedTime);
    setTimeout(tick, Math.floor(1000 / game.framesPerSecond));
  };
  tick();
});
