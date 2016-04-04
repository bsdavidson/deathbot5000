(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Actor = exports.Directions = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _physics = require('./physics');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Directions = exports.Directions = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  directions: [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }],
  names: ['up', 'down', 'left', 'right'],
  getIndex: function getIndex(dirX, dirY) {
    if (dirX > 0) {
      return this.RIGHT;
    } else if (dirX < 0) {
      return this.LEFT;
    } else if (dirY > 0) {
      return this.DOWN;
    } else if (dirY < 0) {
      return this.UP;
    } else {
      return this.RIGHT;
    }
  },
  getName: function getName(dirX, dirY) {
    return this.names[this.getIndex(dirX, dirY)];
  }
};

var Actor = exports.Actor = function () {
  function Actor(image, startX, startY, scale, speedX, speedY, dirX, dirY) {
    _classCallCheck(this, Actor);

    var unscaledWidth = void 0,
        unscaledHeight = void 0;
    if (image) {
      this.image = image;
      this.curImage = this.image;
      this.dirImages = {
        right: image,
        left: image.rev,
        up: image.up,
        down: image.down
      };
      // console.log(this.dirImages);
      unscaledWidth = image.w;
      unscaledHeight = image.h;
    } else {
      this.image = null;
      this.curImage = null;
      this.dirImages = {
        right: null,
        left: null,
        up: null,
        down: null
      };
      unscaledWidth = 1;
      unscaledHeight = 1;
    }

    this.previousDir = { x: this.dirX, y: this.dirY };
    this.startX = startX;
    this.startY = startY;

    this.facing = 'right';
    this.dirX = dirX;
    this.dirY = dirY;
    this.width = unscaledWidth * (scale / 100);
    this.height = unscaledHeight * (scale / 100);
    this.curX = startX;
    this.curY = startY;
    this.previousPos = { x: this.curX, y: this.curY };
    this.tilesInFOV = [];
    this.speedX = speedX;
    this.speedY = speedY;
    this.moving = true;
    this.active = true;
    this.alpha = 1;
    this.debugColor = 'red';
    this.eyeOffset = { x: 0, y: 0 };
    this.laserDelta = {};
    this.laserRange = 9400;
    this.laserStart = {};
  }

  _createClass(Actor, [{
    key: 'collidesWithWalls',
    value: function collidesWithWalls(game) {
      var result = { hit: false, dirX: 0, dirY: 0 };
      // Hit the Left Wall
      if (this.curX < 0) {
        this.curX = _physics.EPSILON;
        result = { hit: true, dirX: 1 };
      }
      // Hit right wall
      if (this.curX > game.canvas.width - this.width) {
        this.curX = game.canvas.width - this.width - _physics.EPSILON;
        result = { hit: true, dirX: -1 };
      }
      // Hit the Ceiling
      if (this.curY < 0) {
        this.curY = _physics.EPSILON;
        result = { hit: true, dirY: 1 };
      }
      // Hit the Floor
      if (this.curY > game.canvas.height - this.height) {
        this.curY = game.canvas.height - this.height - _physics.EPSILON;
        result = { hit: true, dirY: -1 };
      }
      return result;
    }
  }, {
    key: 'eachOverlappingActor',
    value: function eachOverlappingActor(game, actorConstructor, callback) {
      game.eachActor(function (actor) {
        if (!(actor instanceof actorConstructor) || !actor.active) {
          return;
        }
        var overlapping = !(this.curX > actor.curX + actor.width || this.curX + this.width < actor.curX || this.curY + this.height < actor.curY || this.curY > actor.curY + actor.height);
        if (overlapping) {
          callback.call(this, actor);
        }
      }, this);
    }
  }, {
    key: 'eachVisibleActor',
    value: function eachVisibleActor(game, actorConstructor, callback) {
      game.eachActor(function (actor) {
        if (!(actor instanceof actorConstructor)) {
          return;
        }
        if (game.gameState !== 'play') {
          return;
        }
        var visionStart = {
          x: this.curX + this.width / 2 + this.eyeOffset.x,
          y: this.curY + this.eyeOffset.y
        };
        var visionDelta = {
          x: actor.curX + actor.width / 2 + actor.eyeOffset.x - visionStart.x,
          y: actor.curY + actor.eyeOffset.y - visionStart.y
        };
        var actorDirLength = Math.sqrt(visionDelta.x * visionDelta.x + visionDelta.y * visionDelta.y);
        var actorDir = {
          x: visionDelta.x / actorDirLength,
          y: visionDelta.y / actorDirLength
        };
        var dotProduct = this.dirX * actorDir.x + this.dirY * actorDir.y;

        var visible = false;

        var inFOV = void 0;
        if (dotProduct > 0.70) {
          inFOV = true;
        } else {
          inFOV = false;
        }

        if (inFOV) {
          var actorArr = [];
          var actorObj = {
            x: actor.curX,
            y: actor.curY,
            w: actor.width,
            h: actor.height
          };
          actorArr.push(actorObj);
          var blockResult = game.physics.intersectSegmentIntoBoxes(visionStart, visionDelta, game.staticBlocks);
          var actorResult = game.physics.intersectSegmentIntoBoxes(visionStart, visionDelta, actorArr);

          if (game.debugMode) {
            var endPos = new _physics.Point(actor.curX + actor.width / 2 + actor.eyeOffset.x, actor.curY + actor.eyeOffset.y);
            game.context.beginPath();
            game.context.moveTo(visionStart.x, visionStart.y);
            game.context.lineTo(endPos.x, endPos.y);
            game.context.closePath();
            game.context.strokeStyle = 'white';
            game.context.stroke();
          }

          if (actorResult && actorResult.hit && blockResult && blockResult.hit) {
            var result = game.physics.checkNearestHit(this, blockResult, actorResult);
            visible = result.targetHit;
          } else if (actorResult && actorResult.hit) {
            visible = true;
          } else {
            visible = false;
          }
        }
        if (visible) {
          callback.call(this, actor);
        }
      }, this);
    }
  }, {
    key: 'headLamp',
    value: function headLamp(game, elapsedTime) {
      var angle = arguments.length <= 2 || arguments[2] === undefined ? 75 : arguments[2];
      var power = arguments.length <= 3 || arguments[3] === undefined ? 800 : arguments[3];

      var pointArray = [];
      var startingPoint = {};
      var degreeToCurEndPoint = void 0;
      var sweepAngle = angle;
      var gridSize = { w: 28, h: 28 };
      var cellSize = 32;
      var dir = { x: this.dirX, y: this.dirY };

      startingPoint.x = this.curX + this.width / 2;
      startingPoint.y = this.curY + 14;
      var initialEndpoint = {};
      // Get our initial point that is straight ahead
      if (this.dirX === -1 || this.dirX === 1) {
        initialEndpoint = { x: (startingPoint.x + this.laserRange) * -this.dirX,
          y: startingPoint.y };
      } else if (this.dirY === -1 || this.dirY === 1) {
        initialEndpoint = { x: startingPoint.x,
          y: (startingPoint.y + this.laserRange) * -this.dirY };
      }

      // Using the Mouse
      // initialEndpoint = {x: (this.curX - game.mouse.x) * this.laserRange,
      //                    y: (this.curY - game.mouse.y) * this.laserRange};
      pointArray = game.physics.sweepScan(game, initialEndpoint, startingPoint, game.canvas.width, sweepAngle, cellSize, this);
      var lightCtx = game.context;
      lightCtx.beginPath();
      lightCtx.moveTo(startingPoint.x, startingPoint.y);
      for (var i = 0, li = pointArray.length; i < li; i++) {
        lightCtx.lineTo(pointArray[i].x, pointArray[i].y);
      }
      lightCtx.closePath();
      var grd = lightCtx.createRadialGradient(this.curX, this.curY, power, this.curX, this.curY, 0);
      grd.addColorStop(0, 'transparent');
      grd.addColorStop(0.8, 'rgba(255,255,255,0.3)');
      grd.addColorStop(1, 'rgba(255,255,255,0.5)');
      lightCtx.fillStyle = grd;
      lightCtx.fill();
    }
  }, {
    key: 'update',
    value: function update(game, elapsedTime) {
      var hitWall = this.collidesWithWalls(game);
      if (hitWall.dirX) {
        this.dirX = hitWall.dirX;
      }
      if (hitWall.dirY) {
        this.dirY = hitWall.dirY;
      }

      if (this.moving) {
        var movingBox = new _physics.Box(this.curX, this.curY, this.width, this.height);
        var segmentDelta = {
          x: this.speedX * elapsedTime * this.dirX,
          y: this.speedY * elapsedTime * this.dirY
        };
        var result = game.physics.sweepBoxIntoBoxes(movingBox, segmentDelta, game.staticBlocks);
        this.previousPos = {
          x: this.curX,
          y: this.curY
        };
        if (result && result.hit) {
          this.dirX = result.hitNormal.x;
          this.dirY = result.hitNormal.y;
          this.curX = result.hitPos.x - this.width / 2;
          this.curY = result.hitPos.y - this.height / 2;
        } else {
          this.curX += segmentDelta.x;
          this.curY += segmentDelta.y;
        }
      }

      // Image Switcher
      this.facing = Directions.getName(this.dirX, this.dirY);
      this.curImage = this.dirImages[this.facing];
    }
  }, {
    key: 'preDraw',
    value: function preDraw(game, elapsedTime) {
      if (this.active && this.headLampActive === true) {
        this.headLamp(game, elapsedTime, this.headLampAngle, this.headLampPower);
      }
    }
  }, {
    key: 'drawFPS',
    value: function drawFPS(game, elapsedTime) {
      game.contextFX.clearRect(0, 0, game.canvasFPS.width, game.canvasFPS.height);
      var bgColor = '#FFFFFF';
      game.contextFPS.fillStyle = bgColor;
      game.contextFPS.fillRect(0, 0, game.canvasFPS.width, game.canvasFPS.height);

      game.contextFPS.fillStyle = "#000000";
      game.contextFPS.fillRect(0, game.canvasFPS.height / 2, game.canvasFPS.width, game.canvasFPS.height / 2);

      var pointArray = [];
      var startingPoint = {};
      var degreeToCurEndPoint = void 0;
      var sweepAngle = 60;
      var resolution = 320;
      var projectionDistance = game.canvasFPS.width / 2 * Math.tan(sweepAngle * _physics.DEG_TO_RAD);
      var gridSize = { w: 28, h: 28 };
      var cellSize = 32;
      var dir = { x: this.dirX, y: this.dirY };

      startingPoint.x = this.curX + this.width / 2;
      startingPoint.y = this.curY + 14;
      var initialEndpoint = {};
      // Get our initial point that is straight ahead
      if (this.dirX === -1 || this.dirX === 1) {
        initialEndpoint = { x: (startingPoint.x + this.laserRange) * -this.dirX,
          y: startingPoint.y };
      } else if (this.dirY === -1 || this.dirY === 1) {
        initialEndpoint = { x: startingPoint.x,
          y: (startingPoint.y + this.laserRange) * -this.dirY };
      }
      pointArray = game.physics.sweepScan(game, initialEndpoint, startingPoint, game.canvasFPS.width, sweepAngle, cellSize, this);
      for (var i = 0; i < pointArray.length; i++) {
        var z = pointArray[i].delta * Math.cos(pointArray[i].angle * _physics.DEG_TO_RAD);
        var distanceAlpha = pointArray[i].delta / 800;
        var wallHeight = game.canvasFPS.height * (64 / z);
        // let wallHeight = (32 / z) * projectionDistance;
        // if (wallHeight > game.canvasFPS.height) {
        // wallHeight = game.canvasFPS.height;
        // }
        var distanceColor = Math.floor(255 * (1.0 - distanceAlpha));
        // game.contextFPS.fillStyle = `rgba(0, 0, 0, ${distanceAlpha})`;
        game.contextFPS.fillStyle = 'rgb(' + distanceColor + ',' + distanceColor + ',' + distanceColor + ')';
        game.contextFPS.fillRect(i, (game.canvasFPS.height - wallHeight) / 2, 1, wallHeight);
      }
    }
  }, {
    key: 'draw',
    value: function draw(game, elapsedTime) {
      if (this.curImage) {
        // console.log(this.curImage);
        var imgSplitX = 0,
            imgSplitY = 0;
        if (this.curX + this.width > game.canvas.width) {
          imgSplitX = this.curX + this.width - game.canvas.width - this.width;
        }
        if (this.curX < 0) {
          imgSplitX = game.canvas.width + this.curX;
        }
        if (this.curY < 0) {
          imgSplitY = game.canvas.height - this.height + (this.height + this.curY);
        }
        if (this.curY + this.height > game.canvas.height) {
          imgSplitY = this.curY + this.height - game.canvas.height - this.height;
        }

        if (imgSplitX !== 0 || imgSplitY !== 0) {
          if (imgSplitX === 0) {
            imgSplitX = this.curX;
          }
          if (imgSplitY === 0) {
            imgSplitY = this.curY;
          }

          game.context.drawImage(this.curImage, imgSplitX, this.curY, this.width, this.height);

          game.context.drawImage(this.curImage, this.curX, imgSplitY, this.width, this.height);

          game.context.drawImage(this.curImage, imgSplitX, imgSplitY, this.width, this.height);
        }
        game.context.drawImage(this.curImage, this.curX, this.curY, this.width, this.height);
      }

      if (game.debugMode) {
        var x1 = this.curX;
        var y1 = this.curY;
        var x2 = this.curX + this.width;
        var y2 = this.curY + this.height;

        game.context.beginPath();
        game.context.moveTo(x1, y1);
        game.context.lineTo(x2, y1);
        game.context.lineTo(x2, y2);
        game.context.lineTo(x1, y2);
        game.context.closePath();
        game.context.strokeStyle = this.debugColor;
        game.context.stroke();
        game.context.font = '14px Verdana';
        game.context.fillStyle = 'blue';
        game.context.fillText('x' + Math.floor(this.curX) + ' ' + 'y' + Math.floor(this.curY) + ' ' + this.dirX + ' ' + this.dirY, this.curX + this.width / 4, this.curY + (this.height + 30));
      }
    }
  }]);

  return Actor;
}();

},{"./physics":5}],2:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Game = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _physics = require('./physics');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Game = exports.Game = function () {
  function Game(canvas) {
    _classCallCheck(this, Game);

    this.mouse = { x: 0, y: 0 };
    this.initialized = false;
    this.debugMode = true;
    this.images = {};
    this.imagesLoaded = false;
    this.actors = {};
    this.keyDown = {};
    this.keyNames = {};
    this.canvas = canvas;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.context = this.canvas.getContext('2d');
  }

  _createClass(Game, [{
    key: 'defineKey',
    value: function defineKey(keyName, keyCode) {
      this.keyDown[keyName] = false;
      this.keyNames[keyCode] = keyName;
    }
  }, {
    key: 'getRandom',
    value: function getRandom(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Loops through Actor array and creates callable images.

  }, {
    key: 'loadImages',
    value: function loadImages(characters, images) {
      var imagesToLoad = [];
      var self = this;
      var loadedImages = 0;
      var numImages = 0;

      var getReverseImage = function getReverseImage(src, w, h) {
        numImages++;
        var tempImage = new Image();
        var tempCanvas = document.createElement('canvas');
        var tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = w;
        tempCanvas.height = h;
        tempContext.translate(w, 0);
        tempContext.scale(-1, 1);
        tempContext.drawImage(src, 0, 0);
        tempImage.onload = onImageLoaded;
        tempImage.src = tempCanvas.toDataURL();
        return tempImage;
      };

      var onImageLoaded = function onImageLoaded() {
        loadedImages++;
        console.log('loaded image', loadedImages, 'of', numImages);
        if (loadedImages === numImages) {
          self.imagesLoaded = true;
        }
      };

      var loadImage = function loadImage(src, callback) {
        var image = new Image();
        image.onload = function () {
          if (callback) {
            callback.call(image);
          }
          onImageLoaded();
        };
        imagesToLoad.push({ image: image, src: src });
        return image;
      };

      var onMainImageLoaded = function onMainImageLoaded() {
        this.rev = getReverseImage(this, this.width, this.height);
      };

      for (var i = 0, il = characters.length; i < il; i++) {
        // get our main image
        var character = characters[i];
        var image = this.images[character.name] = loadImage(character.image, onMainImageLoaded);

        if (character.imageUp) {
          image.up = loadImage(character.imageUp);
        } else {
          image.up = image;
        }

        if (character.imageDown) {
          image.down = loadImage(character.imageDown);
        } else {
          image.down = image;
        }

        image.w = character.w;
        image.h = character.h;
      }

      for (var key in images) {
        if (images.hasOwnProperty(key)) {
          this[key] = loadImage(images[key]);
        }
      }

      numImages = imagesToLoad.length;
      for (var _i = 0, _il = imagesToLoad.length; _i < _il; _i++) {
        imagesToLoad[_i].image.src = imagesToLoad[_i].src;
      }
    }
  }, {
    key: 'eachActor',
    value: function eachActor(callback, context) {
      for (var c in this.actors) {
        if (this.actors.hasOwnProperty(c)) {
          callback.call(context, this.actors[c]);
        }
      }
    }
  }, {
    key: 'initialize',
    value: function initialize(elapsedTime) {
      this.physics = new _physics.Physics(this);
      this.initialized = true;
    }
  }, {
    key: 'draw',
    value: function draw(elapsedTime) {
      this.context.globalAlpha = 1;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // this.context.fillStyle = 'rgba(0,0,0,1.0)';
      // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

      this.eachActor(function (actor) {
        actor.preDraw(this, elapsedTime);
      }, this);
      this.context.globalCompositeOperation = 'source-atop';
      this.eachActor(function (actor) {
        actor.draw(this, elapsedTime);
      }, this);
      this.context.globalCompositeOperation = 'source-over';
    }
  }, {
    key: 'drawLoading',
    value: function drawLoading() {}
  }, {
    key: 'update',
    value: function update(elapsedTime) {
      this.iteration++;
      this.eachActor(function (actor) {
        if (actor.active) {
          actor.update(this, elapsedTime);
        }
      }, this);
    }
  }, {
    key: 'tick',
    value: function tick(elapsedTime) {
      if (this.imagesLoaded) {
        if (!this.initialized) {
          this.initialize(elapsedTime);
        }
        this.draw(elapsedTime);
        this.update(elapsedTime);
      } else {
        this.drawLoading();
      }
    }
  }, {
    key: 'onKeyDown',
    value: function onKeyDown(event) {
      event.preventDefault();
      var key = event.keyCode;
      if (this.keyNames.hasOwnProperty(key)) {
        this.keyDown[this.keyNames[key]] = true;
      }
    }
  }, {
    key: 'onKeyUp',
    value: function onKeyUp(event) {
      event.preventDefault();
      var key = event.keyCode;
      if (this.keyNames.hasOwnProperty(key)) {
        this.keyDown[this.keyNames[key]] = false;
      }
    }
  }, {
    key: 'onMouseMove',
    value: function onMouseMove(event) {
      this.mouse.x = event.pageX - this.canvas.offsetLeft;
      this.mouse.y = event.pageY - this.canvas.offsetTop;
    }
  }, {
    key: 'onResize',
    value: function onResize(event) {
      this.context = this.canvas.getContext('2d');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }, {
    key: 'setFocus',
    value: function setFocus(event, isBlurred) {
      if (this.debugMode && isBlurred) {
        this.framesPerSecond = 1;
      } else {
        this.framesPerSecond = 30;
      }
    }
  }]);

  return Game;
}();

},{"./physics":5}],3:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _physics = require('./physics');

Object.defineProperty(exports, 'Physics', {
  enumerable: true,
  get: function get() {
    return _physics.Physics;
  }
});
Object.defineProperty(exports, 'Box', {
  enumerable: true,
  get: function get() {
    return _physics.Box;
  }
});
Object.defineProperty(exports, 'Point', {
  enumerable: true,
  get: function get() {
    return _physics.Point;
  }
});
Object.defineProperty(exports, 'EPSILON', {
  enumerable: true,
  get: function get() {
    return _physics.EPSILON;
  }
});
Object.defineProperty(exports, 'DEG_TO_RAD', {
  enumerable: true,
  get: function get() {
    return _physics.DEG_TO_RAD;
  }
});

var _keys = require('./keys');

Object.defineProperty(exports, 'Keys', {
  enumerable: true,
  get: function get() {
    return _keys.Keys;
  }
});

var _game = require('./game');

Object.defineProperty(exports, 'Game', {
  enumerable: true,
  get: function get() {
    return _game.Game;
  }
});

var _actor = require('./actor');

Object.defineProperty(exports, 'Actor', {
  enumerable: true,
  get: function get() {
    return _actor.Actor;
  }
});
Object.defineProperty(exports, 'Directions', {
  enumerable: true,
  get: function get() {
    return _actor.Directions;
  }
});

},{"./actor":1,"./game":2,"./keys":4,"./physics":5}],4:[function(require,module,exports){
/* jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Keys = exports.Keys = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  W: 87,
  A: 65,
  S: 83,
  D: 68,
  SPACE: 32
};

},{}],5:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Box = exports.Box = function () {
  function Box(x, y, w, h) {
    _classCallCheck(this, Box);

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  _createClass(Box, [{
    key: 'inflate',
    value: function inflate(paddingX, paddingY) {
      return new Box(this.x - paddingX / 2, this.y - paddingY / 2, this.w + paddingX, this.h + paddingY);
    }
  }]);

  return Box;
}();

var Point = exports.Point = function Point(x, y) {
  _classCallCheck(this, Point);

  this.x = x;
  this.y = y;
};

var FPSPoint = exports.FPSPoint = function FPSPoint(x, y, delta, angle) {
  _classCallCheck(this, FPSPoint);

  this.x = x;
  this.y = y;
  this.delta = delta;
  this.angle = angle;
};

var EPSILON = exports.EPSILON = 1 / 32;
var DEG_TO_RAD = exports.DEG_TO_RAD = Math.PI / 180;
var RAD_TO_DEG = exports.RAD_TO_DEG = 180 / Math.PI;

var Physics = exports.Physics = function () {
  function Physics(game) {
    _classCallCheck(this, Physics);

    this.game = game;
  }

  _createClass(Physics, [{
    key: 'drawPoint',
    value: function drawPoint(x, y, color, size) {
      size = size || 4;
      this.game.context.fillStyle = color;
      this.game.context.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }, {
    key: 'drawLine',
    value: function drawLine(x1, y1, x2, y2, color) {
      this.game.context.beginPath();
      this.game.context.moveTo(x1, y1);
      this.game.context.lineTo(x2, y2);
      this.game.context.closePath();
      this.game.context.strokeStyle = color;
      this.game.context.stroke();
    }
  }, {
    key: 'drawText',
    value: function drawText(x, y, text, color) {
      color = color || 'white';
      this.game.context.font = '14px Arial';
      this.game.context.fillStyle = color;
      this.game.context.fillText(text, x, y);
    }
  }, {
    key: 'drawBox',
    value: function drawBox(x, y, w, h, color) {
      color = color || 'white';
      this.game.context.strokeStyle = color;
      this.game.context.strokeRect(x, y, w, h);
    }
  }, {
    key: 'getDelta',
    value: function getDelta(x1, y1, x2, y2) {
      return { x: x2 - x1, y: y2 - y1 };
    }

    // distance = sqr((x1-x2)^2 + (y1-y2)^2)

  }, {
    key: 'getDistance',
    value: function getDistance(startPoint, endPoint) {
      var deltaX = startPoint.x - endPoint.x;
      var deltaY = startPoint.y - endPoint.y;
      var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (!isNaN(distance)) {
        return distance;
      } else {
        debugger;
        return 0;
      }
    }
  }, {
    key: 'intersectSegmentIntoBox',
    value: function intersectSegmentIntoBox(segmentPos, segmentDelta, paddedBox, debug) {
      // drawBox(paddedBox.x, paddedBox.y, paddedBox.w, paddedBox.h, 'gray');
      var nearXPercent, farXPercent;
      if (segmentDelta.x >= 0) {
        // going left to right
        nearXPercent = (paddedBox.x - segmentPos.x) / segmentDelta.x;
        farXPercent = (paddedBox.x + paddedBox.w - segmentPos.x) / segmentDelta.x;
      } else {
        // going right to left
        nearXPercent = (paddedBox.x + paddedBox.w - segmentPos.x) / segmentDelta.x;
        farXPercent = (paddedBox.x - segmentPos.x) / segmentDelta.x;
      }

      var nearYPercent, farYPercent;
      if (segmentDelta.y >= 0) {
        // going top to bottom
        nearYPercent = (paddedBox.y - segmentPos.y) / segmentDelta.y;
        farYPercent = (paddedBox.y + paddedBox.h - segmentPos.y) / segmentDelta.y;
      } else {
        // going bottom to top
        nearYPercent = (paddedBox.y + paddedBox.h - segmentPos.y) / segmentDelta.y;
        farYPercent = (paddedBox.y - segmentPos.y) / segmentDelta.y;
      }

      // calculate the further of the two near percents
      var nearPercent;
      if (nearXPercent > nearYPercent) {
        nearPercent = nearXPercent;
      } else {
        nearPercent = nearYPercent;
      }

      // calculate the nearest of the two far percent
      var farPercent;
      if (farXPercent < farYPercent) {
        farPercent = farXPercent;
      } else {
        farPercent = farYPercent;
      }

      var hit;
      if (nearXPercent > farYPercent || nearYPercent > farXPercent) {
        // Where the segment hits the left edge of the box, has to be between
        // the top and bottom edges of the box. Otherwise, the segment is
        // passing the box vertically before it hits the left side.
        hit = false;
      } else if (nearPercent > 1) {
        // the box is past the end of the line
        hit = false;
      } else if (farPercent < 0) {
        // the box is before the start of the line
        hit = false;
      } else {
        hit = true;
      }

      var hitPercent = nearPercent;
      var hitNormal = {};
      if (nearXPercent > nearYPercent) {
        // collided with the left or right edge
        if (segmentDelta.x >= 0) {
          // collided with the left edge
          hitNormal.x = -1;
        } else {
          // collided with the right edge
          hitNormal.x = 1;
        }
        hitNormal.y = 0;
      } else {
        // collided with the to or bottom edge
        hitNormal.x = 0;
        if (segmentDelta.y >= 0) {
          // collided with the top edge
          hitNormal.y = -1;
        } else {
          // collided with the bottom edge
          hitNormal.y = 1;
        }
      }
      if (hitPercent < 0) {
        hitPercent = 0;
      }

      var hitPos = {
        x: segmentPos.x + segmentDelta.x * hitPercent,
        y: segmentPos.y + segmentDelta.y * hitPercent
      };

      hitPos.x += hitNormal.x * EPSILON;
      hitPos.y += hitNormal.y * EPSILON;

      var result = {
        hit: hit,
        hitNormal: hitNormal,
        hitPercent: hitPercent,
        hitPos: hitPos,
        nearPercent: nearPercent,
        nearXPercent: nearXPercent,
        nearYPercent: nearYPercent,
        farPercent: farPercent,
        farXPercent: farXPercent,
        farYPercent: farYPercent,
        hitBox: paddedBox
      };
      // if (debug) {
      //    let hitCounter = 0;
      //    let hitColors = ['#f00', '#0f0', '#ff0', '#0ff', '#f0f',
      //                     '#fff', '#f90'];
      //     this.drawPoint(result.hitPos.x, result.hitPos.y,
      //                    hitColors[hitCounter % hitColors.length], 4);
      //     this.drawLine(segmentPos.x, segmentPos.y,
      //                   segmentPos.x + segmentDelta.x,
      //                   segmentPos.y + segmentDelta.y, '#0ff');
      //     hitCounter += 1;
      // }
      return result;
    }
  }, {
    key: 'sweepBoxIntoBox',
    value: function sweepBoxIntoBox(movingBox, segmentDelta, staticBox) {
      var segmentPos = {
        x: movingBox.x + movingBox.w / 2,
        y: movingBox.y + movingBox.h / 2
      };

      var paddedBox = new Box(staticBox.x - movingBox.w / 2, staticBox.y - movingBox.h / 2, staticBox.w + movingBox.w, staticBox.h + movingBox.h);
      var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta, paddedBox);
      return result;
    }
  }, {
    key: 'intersectSegmentIntoBoxes',
    value: function intersectSegmentIntoBoxes(segmentPos, segmentDelta, staticBoxes, debug) {
      var hitCounter = 0;
      var hitColors = ['#f00', '#0f0', '#ff0', '#0ff', '#f0f', '#fff', '#f90'];
      var nearestResult = null;
      for (var i = 0, il = staticBoxes.length; i < il; i++) {
        var staticBox = staticBoxes[i];
        var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta, staticBox);
        if (result.hit) {
          if (debug) {
            this.drawPoint(result.hitPos.x, result.hitPos.y, hitColors[hitCounter % hitColors.length], 4);
            this.drawLine(segmentPos.x, segmentPos.y, segmentPos.x + segmentDelta.x, segmentPos.y + segmentDelta.y, '#0ff');
            hitCounter += 1;
          }
          if (!nearestResult || result.hitPercent < nearestResult.hitPercent) {
            nearestResult = result;
          }
        }
      }
      return nearestResult;
    }

    // Sweep movingBox, along the movement described by segmentDelta, into each
    // box in the list of staticBoxes. Return a result object describing the first
    // static box that movingBox hits, or null.

  }, {
    key: 'sweepBoxIntoBoxes',
    value: function sweepBoxIntoBoxes(movingBox, segmentDelta, staticBoxes) {
      var nearestResult = null;
      for (var i = 0, il = staticBoxes.length; i < il; i++) {
        var staticBox = staticBoxes[i];
        var result = this.sweepBoxIntoBox(movingBox, segmentDelta, staticBox);
        if (result.hit) {
          if (!nearestResult || result.hitPercent < nearestResult.hitPercent) {
            nearestResult = result;
          }
        }
      }
      return nearestResult;
    }
  }, {
    key: 'getFirstCollision',
    value: function getFirstCollision(startPos, cellSize, delta, callback) {
      var dir = {},
          endPos = {},
          cell = {},
          timeStep = {},
          time = {};
      var dirs = ['x', 'y'];
      var firstEdge = {};

      for (var i = 0; i < 2; i++) {
        var k = dirs[i];
        dir[k] = delta[k] < 0 ? -1 : 1;
        endPos[k] = startPos[k] + delta[k];
        cell[k] = Math.floor(startPos[k] / cellSize);
        timeStep[k] = cellSize * dir[k] / delta[k];
        if (dir[k] === 0) {
          time[k] = 1;
        } else {
          firstEdge[k] = cell[k] * cellSize;
          if (dir[k] > 0) {
            firstEdge[k] += cellSize;
          }
          time[k] = (firstEdge[k] - startPos[k]) / delta[k];
        }
      }

      while (time.x < 1 || time.y < 1) {
        if (time.x < time.y) {
          time.x += timeStep.x;
          cell.x += dir.x;
        } else {
          cell.y += dir.y;
          time.y += timeStep.y;
        }
        if (callback(cell.x, cell.y) === false) {
          break;
        }
      }
    }
  }, {
    key: 'sweepScan',
    value: function sweepScan(game, initialEndpoint, startPoint, sweepCount, sweepAngle, cellSize, context) {
      var _this = this;

      // let degreeToCurEndPoint;
      var pointArray = [];
      var initialDelta = this.getDelta(initialEndpoint.x, initialEndpoint.y, startPoint.x, startPoint.y);
      var degToInitialEndpos = this.getTargetDegree(initialDelta);
      var degreeToStartSweep = degToInitialEndpos + sweepAngle / 2;
      // let degreeToEndSweep = degToInitialEndpos - sweepAngle;
      // initialDelta = this.degToPos(degreeToStartSweep, context.laserRange);

      // let endingEndPos;
      var rayAngleStep = sweepAngle / sweepCount;
      // degreeToCurEndPoint = degreeToStartSweep;

      var _loop = function _loop(i) {
        var rayAngle = degreeToStartSweep - rayAngleStep * i;
        // let xxx = degreeToCurEndPoint == degreeToStartSweep;
        var endingDelta = _this.degToPos(rayAngle, context.laserRange);
        _this.getFirstCollision(startPoint, cellSize, endingDelta, function (cellx, celly) {
          var gridPos = celly * game.cols + cellx;
          var block = game.staticGrid[gridPos];
          if (block) {
            var endingResult = _this.intersectSegmentIntoBox(startPoint, endingDelta, block);
            if (endingResult && endingResult.hit) {
              var endingEndPos = new FPSPoint(endingResult.hitPos.x, endingResult.hitPos.y, _this.getDistance(startPoint, endingResult.hitPos), -sweepAngle / 2 + rayAngleStep * i);
              pointArray.push(endingEndPos);
              return false;
            }
          }
        });
      };

      for (var i = 0; i < sweepCount; i++) {
        _loop(i);
      }
      return pointArray;
    }
  }, {
    key: 'checkNearestHit',
    value: function checkNearestHit(sourceActor, staticResult, targetResult) {
      var result = {};
      var sourceX = sourceActor.curX;
      var staticX = staticResult.hitPos.x;
      var targetX = targetResult.hitPos.x;
      var sourceY = sourceActor.curY;
      var staticY = staticResult.hitPos.y;
      var targetY = targetResult.hitPos.y;

      if (sourceActor.dirX === -1 || sourceActor.dirX === 1) {
        if (Math.abs(sourceX - staticX) < Math.abs(sourceX - targetX)) {
          result.targetHit = false;
          result.endPos = new Point(staticResult.hitPos.x, staticResult.hitPos.y);
        } else {
          result.endPos = new Point(targetResult.hitPos.x, targetResult.hitPos.y);
          result.targetHit = true;
        }
      } else if (sourceActor.dirY === -1 || sourceActor.dirY === 1) {
        if (Math.abs(sourceY - staticY) < Math.abs(sourceY - targetY)) {
          result.targetHit = false;
          result.endPos = new Point(staticResult.hitPos.x, staticResult.hitPos.y);
        } else {
          result.endPos = new Point(targetResult.hitPos.x, targetResult.hitPos.y);
          result.targetHit = true;
        }
      }
      return result;
    }
  }, {
    key: 'getTargetDegree',
    value: function getTargetDegree(delta) {
      var theta = Math.atan2(delta.x, delta.y);
      var degree = theta * RAD_TO_DEG;
      if (theta < 0) {
        degree += 360;
      }
      return degree;
    }
  }, {
    key: 'degToPos',
    value: function degToPos(degree, radius) {
      var radian = degree * DEG_TO_RAD;
      var result = {
        x: radius * Math.sin(radian),
        y: radius * Math.cos(radian)
      };
      return result;
    }
  }]);

  return Physics;
}();

},{}],6:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Bullet = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _berzerk = require('./berzerk');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Bullet = exports.Bullet = function (_Actor) {
  _inherits(Bullet, _Actor);

  function Bullet(startX, startY, speed, dirX, dirY) {
    _classCallCheck(this, Bullet);

    var image = { w: 5, h: 5 };

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Bullet).call(this, image, startX, startY, 100, speed, speed, dirX, dirY));

    _this.deathTimer = 0;
    _this.headLampActive = true;
    _this.headLampAngle = 180;
    _this.headLampPower = 280;
    return _this;
  }

  _createClass(Bullet, [{
    key: 'draw',
    value: function draw(game, elapsedTime) {
      game.contextFX.fillStyle = '#FFF';
      game.contextFX.fillRect(this.curX, this.curY, this.width, this.height);
    }
  }, {
    key: 'update',
    value: function update(game, elapsedTime) {
      _get(Object.getPrototypeOf(Bullet.prototype), 'update', this).call(this, game, elapsedTime);
      this.deathTimer += elapsedTime;
      if (this.deathTimer >= 1) {
        this.active = false;
      }
    }
  }]);

  return Bullet;
}(_berzerk.Actor);

},{"./berzerk":3}],7:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _game = require('./game');

Object.defineProperty(exports, 'Game', {
  enumerable: true,
  get: function get() {
    return _game.Game;
  }
});

var _player = require('./player');

Object.defineProperty(exports, 'Player', {
  enumerable: true,
  get: function get() {
    return _player.Player;
  }
});

var _monster = require('./monster');

Object.defineProperty(exports, 'Monster', {
  enumerable: true,
  get: function get() {
    return _monster.Monster;
  }
});

var _bullet = require('./bullet');

Object.defineProperty(exports, 'Bullet', {
  enumerable: true,
  get: function get() {
    return _bullet.Bullet;
  }
});
window.Deathbot = exports;


window.addEventListener('load', function () {
  // The Deathbot properties will be filled in by the other scripts. Even
  // though they don't look like they exist at this point, they will by the
  // time the window load event has fired.

  var canvas = document.querySelector('#deathbot');
  var canvasBG = document.querySelector('#background');
  var canvasFPS = document.querySelector('#fps');
  var game = window.deathbotGame = new exports.Game(canvas, canvasBG, canvasFPS, '#111');
  game.loadImages();

  window.addEventListener('keydown', function (event) {
    game.onKeyDown(event);
  });

  window.addEventListener('keyup', function (event) {
    game.onKeyUp(event);
  });

  window.addEventListener('mousemove', function (event) {
    game.onMouseMove(event);
  });

  var blurred = false;
  var setFocus = function setFocus(event) {
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
  window.onresize = function (event) {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }
    resizeTimeout = setTimeout(function () {
      resizeTimeout = null;
      game.onResize(event);
    }, 1000);
  };

  var oldFrameTime = new Date().getTime() / 1000;
  var tick = function tick() {
    var newFrameTime = new Date().getTime() / 1000;
    var elapsedTime = newFrameTime - oldFrameTime;
    oldFrameTime = newFrameTime;
    game.tick(elapsedTime);
    setTimeout(tick, Math.floor(1000 / game.framesPerSecond));
  };
  tick();
});

},{"./bullet":6,"./game":8,"./monster":9,"./player":10}],8:[function(require,module,exports){
/*jshint browser:true */
/*globals SS:false */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Game = exports.LEVELS = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _berzerk = require('./berzerk');

var _player = require('./player');

var _monster = require('./monster');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEBUG_TILE = 9;
var LEVELS = exports.LEVELS = [{
  cols: 28,
  rows: 28,
  grid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
}];

var CHARACTERS = [{
  name: 'deathbot',
  image: 'img/deathbot.png',
  imageUp: 'img/deathbot_up.png',
  imageDown: 'img/deathbot_down.png',
  w: 40,
  h: 52
}, {
  name: 'player',
  image: 'img/player.png',
  w: 28,
  h: 52
}];

var Game = exports.Game = function (_BerzerkGame) {
  _inherits(Game, _BerzerkGame);

  function Game(canvas, canvasBG, canvasFPS, fillStyle) {
    _classCallCheck(this, Game);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Game).call(this, canvas));

    _this.playerDeathMethod = '';
    _this.gameState = 'attract'; // attract, play, dead
    _this.score = 0;
    _this.round = 2;
    _this.numOfMonsters = 0;
    _this.cellWidth = 32;
    _this.cellHeight = 32;
    _this.tiles = null;
    _this.cols = LEVELS[0].cols;
    _this.rows = LEVELS[0].rows;
    _this.grid = LEVELS[0].grid;
    _this.spawnGrid = [];
    _this.staticBlocks = [];
    _this.staticGrid = [];
    _this.fillStyle = fillStyle;
    _this.canvasBG = canvasBG;
    _this.canvasBG.width = window.innerWidth;
    _this.canvasBG.height = window.innerHeight;
    _this.contextBG = _this.canvasBG.getContext('2d');

    _this.canvasFX = document.querySelector('#fx');
    _this.canvasFX.width = window.innerWidth;
    _this.canvasFX.height = window.innerHeight;
    _this.contextFX = _this.canvasFX.getContext('2d');

    _this.canvasFPS = canvasFPS;
    _this.canvasFPS.width = 480;
    _this.canvasFPS.height = 240;
    _this.contextFPS = _this.canvasFPS.getContext('2d');
    // this.contextFX.fillStyle = 'rgba(0, 0, 0, .50)';
    // this.contextFX.fillRect(0, 0, this.canvasFX.width, this.canvasFX.height);
    _this.messageTime = 10;

    _this.defineKey('start', _berzerk.Keys.SPACE);
    _this.defineKey('up', _berzerk.Keys.UP);
    _this.defineKey('down', _berzerk.Keys.DOWN);
    _this.defineKey('left', _berzerk.Keys.LEFT);
    _this.defineKey('right', _berzerk.Keys.RIGHT);
    _this.defineKey('shootUp', _berzerk.Keys.W);
    _this.defineKey('shootLeft', _berzerk.Keys.A);
    _this.defineKey('shootDown', _berzerk.Keys.S);
    _this.defineKey('shootRight', _berzerk.Keys.D);
    return _this;
  }

  _createClass(Game, [{
    key: 'createSpawnPoints',
    value: function createSpawnPoints(actorWidth, actorHeight) {
      var spawnLocations = [];
      var spawnGrid = this.grid.slice(0);

      var actorBlock = {
        w: Math.ceil(actorWidth / this.cellWidth),
        h: Math.ceil(actorHeight / this.cellHeight)
      };
      for (var i = 0, li = this.grid.length; i < li; i++) {
        if (this.grid[i] === 0) {
          var numOfSpacesNeeded = actorBlock.w * actorBlock.h;
          var numOfEmptySpaces = 0;
          for (var row = 0; row < actorBlock.w; row++) {
            for (var col = 0; col < actorBlock.h; col++) {
              var curCol = i % this.cols + row;
              var curRow = Math.floor(i / this.cols) + col;
              var index = curRow * this.cols + curCol;
              if (this.grid[index] === 0) {
                numOfEmptySpaces++;
              }
            }
          }
          if (numOfEmptySpaces === numOfSpacesNeeded) {
            spawnLocations.push(i);
            spawnGrid[i] = DEBUG_TILE;
          }
        }
      }
      this.spawnGrid = spawnGrid;
      return spawnLocations;
    }
  }, {
    key: 'randomizeSpawns',
    value: function randomizeSpawns() {
      this.eachActor(function (actor) {
        if (!(actor instanceof _monster.Monster)) {
          return;
        }
        actor.spawnPoints = this.createSpawnPoints(actor.width, actor.height);
        var spawnIndex = actor.spawnPoints[Math.floor(Math.random() * actor.spawnPoints.length)];
        var spawnXY = this.calcGridXY(spawnIndex);
        actor.curX = spawnXY.x1 + _berzerk.EPSILON;
        actor.curY = spawnXY.y1 + _berzerk.EPSILON;
      }, this);
    }
  }, {
    key: 'calcGridXY',
    value: function calcGridXY(gridIndex) {
      var curRow = void 0,
          curCol = void 0,
          gridX1 = void 0,
          gridX2 = void 0,
          gridY1 = void 0,
          gridY2 = void 0;
      var result = { x1: 0, y1: 0, x2: 0, y2: 0 };
      curCol = gridIndex % this.cols;
      curRow = Math.floor(gridIndex / this.cols);
      gridX1 = curCol * this.cellWidth;
      gridY1 = curRow * this.cellHeight;
      gridX2 = gridX1 + this.cellWidth;
      gridY2 = gridY1 + this.cellHeight;
      result = { x1: gridX1, y1: gridY1, x2: gridX2, y2: gridY2 };
      return result;
    }

    // Loops through Actor array and creates callable images.

  }, {
    key: 'loadImages',
    value: function loadImages() {
      _get(Object.getPrototypeOf(Game.prototype), 'loadImages', this).call(this, CHARACTERS, { tiles: 'img/tiles.png' });
    }
  }, {
    key: 'eachActor',
    value: function eachActor(callback, context) {
      for (var c in this.actors) {
        if (this.actors.hasOwnProperty(c)) {
          callback.call(context, this.actors[c]);
        }
      }
    }
  }, {
    key: 'initialize',
    value: function initialize(elapsedTime) {
      var _this2 = this;

      _get(Object.getPrototypeOf(Game.prototype), 'initialize', this).call(this, elapsedTime);

      this.drawBackground(elapsedTime);
      this.staticBlocks = [];
      this.staticGrid = [];
      this.physics = new _berzerk.Physics(this);
      this.actors = {
        //image, startX, startY, scale, speedX, speedY, dirX, dirY
        player: new _player.Player(this.images.player, 85, 454, 100, 150, 150, 1, 1),
        deathbot1: new _monster.Monster(this.images.deathbot, 250, 500, 100, 100, 100, -1, 1),
        deathbot3: new _monster.Monster(this.images.deathbot, 120, 110, 300, 110, 115, 1, 1),
        deathbot4: new _monster.Monster(this.images.deathbot, 300, 200, 100, 200, 200, -1, -1),
        deathbot5: new _monster.Monster(this.images.deathbot, 500, 400, 100, 200, 200, 1, 1)
      };

      this.numOfMonsters = 0;
      this.playerDeathMethod = '';
      this.round = 2;
      this.score = 0;

      this.eachActor(function (actor) {
        if (actor instanceof _monster.Monster) {
          _this2.numOfMonsters++;
        }
        actor.active = true;
        actor.health = 100;
      }, this);

      for (var i = 0, li = this.grid.length; li > i; i++) {
        if (this.grid[i]) {
          var blockXY = this.calcGridXY(i);
          var block = new _berzerk.Box(blockXY.x1, blockXY.y1, this.cellWidth, this.cellHeight);
          this.staticBlocks.push(block);
          this.staticGrid.push(block);
        } else {
          this.staticGrid.push(null);
        }
      }

      this.randomizeSpawns();
    }
  }, {
    key: 'leaderboard',
    value: function leaderboard() {
      var yPos = 60;
      var xPos = 940;
      // if (SS.currentScores) {
      //   this.drawScores('***** Hi Scores *****', yPos, xPos, 20);
      //   yPos += 30;
      //   let lb = SS.currentScores;
      //   for (let i = 0; i < lb.length; i++) {
      //     this.drawScores(lb[i].name + '  ' +  lb[i].score, yPos, xPos, 20);
      //     yPos += 30;
      //   }
      // }
    }
  }, {
    key: 'draw',
    value: function draw(elapsedTime) {
      this.contextFX.clearRect(0, 0, this.canvas.width, this.canvas.height);
      _get(Object.getPrototypeOf(Game.prototype), 'draw', this).call(this, elapsedTime);

      this.drawScore();

      if (this.gameState === 'attract') {
        this.drawMessage('Deathbot 5000', 120);
        this.drawMessage('WASD to Shoot', 180);
        this.drawMessage('Arrow Keys to Move', 220);
        this.drawMessage('Press Space to Begin', 260);
        this.leaderboard();
      }
      if (this.gameState === 'dead') {
        this.drawMessage('Thou art ' + this.playerDeathMethod);
        this.drawMessage('Press Space to Start again', 240);
        this.leaderboard();
      }
    }
  }, {
    key: 'drawBackground',
    value: function drawBackground(elapsedTime) {
      var bgColor = void 0;
      if (this.gameState === 'attract') {
        bgColor = 'Purple';
      } else if (this.gameState === 'dead') {
        bgColor = 'red';
      } else {
        bgColor = this.fillStyle;
      }
      this.contextBG.fillStyle = bgColor;
      this.contextBG.fillRect(0, 0, this.canvasBG.width, this.canvasBG.height);
      this.drawGrid(this.grid);
      if (this.debugMode) {
        this.drawGrid(this.spawnGrid);
      }
    }
  }, {
    key: 'drawGrid',
    value: function drawGrid(grid) {
      var gridPosX = 0,
          gridPosY = 0;
      for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.cols; col++) {
          var index = row * this.cols + col;
          gridPosX = col * this.cellWidth;
          gridPosY = row * this.cellHeight;

          if (grid[index]) {
            this.contextBG.drawImage(this.tiles, grid[index] * this.cellWidth, 0, this.cellWidth, this.cellHeight, gridPosX, gridPosY, this.cellWidth, this.cellHeight);
          }
          if (grid[index] === DEBUG_TILE) {
            this.contextBG.strokeStyle = 'red';
            this.contextBG.strokeRect(gridPosX, gridPosY, this.cellWidth, this.cellHeight);
          }
        }
      }
    }
  }, {
    key: 'drawLoading',
    value: function drawLoading() {
      this.contextBG.fillStyle = '#ccc';
      this.contextBG.fillRect(0, 0, this.canvasBG.width, this.canvasBG.height);
    }
  }, {
    key: 'drawMessage',
    value: function drawMessage(message, yPos, size) {
      var pos = this.canvas.width / 2;
      yPos = yPos || 200;
      size = size || 25;
      this.context.font = size + 'px Verdana';
      var metrics = this.context.measureText(message);
      var width = metrics.width;
      var messageX = pos - width / 2;
      this.context.fillStyle = 'white';
      this.context.fillText(message, messageX, yPos);
    }
  }, {
    key: 'drawScores',
    value: function drawScores(message, yPos, xPos, size) {
      var pos = this.canvas.width / 2;
      yPos = yPos || 200;
      size = size || 25;
      this.context.font = size + 'px Verdana';
      this.context.fillStyle = 'white';
      this.context.fillText(message, xPos, yPos);
    }
  }, {
    key: 'drawScore',
    value: function drawScore() {
      var pos = this.canvas.width / 2;
      this.context.font = '25px Verdana';
      this.context.fillStyle = 'white';
      var scoreText = 'GAME: ' + this.score;
      var metrics = this.context.measureText(scoreText);
      var width = metrics.width;
      var scoreX = pos - width / 2;
      this.context.fillText(scoreText, scoreX, 25);
    }
  }, {
    key: 'update',
    value: function update(elapsedTime) {
      _get(Object.getPrototypeOf(Game.prototype), 'update', this).call(this, elapsedTime);

      if (this.keyDown.start && this.gameState !== 'play') {
        this.gameState = 'play';
        console.log('Game Start');
        this.randomizeSpawns();
        this.initialized = false;
      }

      if (this.numOfMonsters === 0 && this.initialized) {
        // You beat all monsters
        this.randomizeSpawns();
        if (this.messageTime > 0) {
          // show next round message
          this.drawMessage('Round ' + this.round);
          this.messageTime -= elapsedTime;
        } else {
          this.messageTime = 10;
          this.round++;
          this.eachActor(function (actor) {
            if (actor instanceof _monster.Monster) {
              this.numOfMonsters++;
              actor.active = true;
              actor.alpha = 1;
            }
          }, this);
        }
      }
    }
  }]);

  return Game;
}(_berzerk.Game);

},{"./berzerk":3,"./monster":9,"./player":10}],9:[function(require,module,exports){
/*jshint browser:true */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Monster = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _berzerk = require('./berzerk');

var _player = require('./player');

var _bullet = require('./bullet');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Monster = exports.Monster = function (_Actor) {
  _inherits(Monster, _Actor);

  function Monster(image, startX, startY, scale, speedX, speedY, dirX, dirY) {
    _classCallCheck(this, Monster);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Monster).apply(this, arguments));
    // super(image, startX, startY, scale, speedX, speedY, dirX);


    _this.dirTimer = 0;
    _this.isFiring = false;
    _this.laserDelta = {};
    _this.laserRange = 1200;
    _this.laserStart = {};
    _this.eyeOffset = { x: 0, y: 14 };
    _this.headLampActive = false;
    return _this;
  }

  _createClass(Monster, [{
    key: 'draw',
    value: function draw(game, elapsedTime) {
      if (this.active) {
        _get(Object.getPrototypeOf(Monster.prototype), 'draw', this).call(this, game, elapsedTime);
        if (game.debugMode) {
          game.context.font = '16px Verdana';
          game.context.fillStyle = 'red';
          game.context.fillText('Monster', this.curX + this.width / 4, this.curY - 10);
        }
      } else if (this.alpha >= 0.1) {
        this.alpha -= 0.1;
        game.context.globalAlpha = this.alpha;
        _get(Object.getPrototypeOf(Monster.prototype), 'draw', this).call(this, game, elapsedTime);
        game.context.globalAlpha = 1;
      }
    }
  }, {
    key: 'fireLaser',
    value: function fireLaser(game, player) {
      var laserEndpoint = {
        x: this.laserStart.x + this.laserDelta.x,
        y: this.laserStart.y + this.laserDelta.y
      };
      var target = [];
      var targetObj = {};
      targetObj.x = player.curX + 5;
      targetObj.y = player.curY;
      targetObj.w = 15;
      targetObj.h = 15;
      target.push(targetObj);
      var targetDelta = game.physics.getDelta(this.laserStart.x, this.laserStart.y, targetObj.x, targetObj.y);
      this.firing = true;
      this.moving = false;

      var blockResult = game.physics.intersectSegmentIntoBoxes(this.laserStart, this.laserDelta, game.staticBlocks);
      var targetResult = game.physics.intersectSegmentIntoBoxes(this.laserStart, this.laserDelta, target);

      var endPos = void 0;var targetHit = void 0;
      if (blockResult && blockResult.hit && targetResult && targetResult.hit) {
        var result = game.physics.checkNearestHit(this, blockResult, targetResult);
        endPos = result.endPos;
        targetHit = result.targetHit;
      } else {
        if (blockResult && blockResult.hit) {
          // update end pos with hit pos
          endPos = new _berzerk.Point(blockResult.hitPos.x, blockResult.hitPos.y);
          game.context.strokeStyle = 'red';
        } else if (targetResult && targetResult.hit) {
          endPos = new _berzerk.Point(targetResult.hitPos.x, targetResult.hitPos.y);
          targetHit = true;
        } else {
          endPos = new _berzerk.Point(laserEndpoint.x, laserEndpoint.y);
        }
      }

      var degToEndpos = game.physics.getTargetDegree(this.laserDelta);
      var degToTarget = game.physics.getTargetDegree(targetDelta);

      game.contextFX.beginPath();
      game.contextFX.moveTo(this.laserStart.x, this.laserStart.y);
      game.contextFX.lineTo(endPos.x, endPos.y);
      game.contextFX.closePath();
      game.contextFX.strokeStyle = targetResult && targetResult.hit ? 'red' : 'blue';
      game.contextFX.stroke();

      if (!targetHit) {
        var newDegree = void 0;
        if (this.dirY === 1) {
          if (degToEndpos < 180) {
            degToEndpos += 360;
          }
          if (degToTarget < 180) {
            degToTarget += 360;
          }
        }
        if (degToEndpos > degToTarget) {
          if (degToEndpos - degToTarget > 6) {
            newDegree = degToEndpos - 3;
          } else {
            newDegree = degToEndpos - 0.5;
          }
          this.laserDelta = game.physics.degToPos(newDegree, this.laserRange);
        } else {
          if (degToTarget - degToEndpos > 6) {
            newDegree = degToEndpos + 3;
          } else {
            newDegree = degToEndpos + 0.5;
          }
          this.laserDelta = game.physics.degToPos(newDegree, this.laserRange);
        }
      } else {
        if (!game.debugMode) {
          player.recoveryTimer = 0;
          player.health -= 2;
          game.playerDeathMethod = 'blind';
        }
      }
    }
  }, {
    key: 'update',
    value: function update(game, elapsedTime) {
      _get(Object.getPrototypeOf(Monster.prototype), 'update', this).call(this, game, elapsedTime);
      this.laserStart = {
        x: this.curX + this.width / 2,
        y: this.curY + 14
      };
      this.debugColor = 'red';
      this.dirTimer -= elapsedTime;
      if (this.dirTimer <= 0 && !this.firing) {
        this.moving = Boolean(game.getRandom(0, 1));
        this.dirTimer = game.getRandom(2, 4);
        var nextDirection = game.getRandom(0, 3);
        this.dirX = _berzerk.Directions.directions[nextDirection].x;
        this.dirY = _berzerk.Directions.directions[nextDirection].y;
      }
      this.visibleActors = 0;
      this.eachVisibleActor(game, _player.Player, function (player) {
        this.visibleActors += 1;
        this.debugColor = 'white';

        if (!this.firing) {
          // set the initial starting point for the laser
          var laserEndpoint = void 0;
          if (this.dirX === -1 || this.dirX === 1) {
            laserEndpoint = {
              x: (this.laserStart.x + this.laserRange) * -this.dirX,
              y: this.laserStart.y
            };
          } else if (this.dirY === -1 || this.dirY === 1) {
            laserEndpoint = {
              x: this.laserStart.x,
              y: (this.laserStart.y + this.laserRange) * -this.dirY
            };
          }
          this.laserDelta = game.physics.getDelta(laserEndpoint.x, laserEndpoint.y, this.laserStart.x, this.laserStart.y);
        }
        this.fireLaser(game, player);
      });

      if (this.visibleActors === 0) {
        this.laserEndpoint = null;
        this.firing = false;
      }

      this.eachOverlappingActor(game, _bullet.Bullet, function (bullet) {
        bullet.active = false;
        this.debugColor = 'green';
        this.active = false;
        game.numOfMonsters--;
        game.score++;
      });
    }
  }]);

  return Monster;
}(_berzerk.Actor);

},{"./berzerk":3,"./bullet":6,"./player":10}],10:[function(require,module,exports){
/*jshint browser:true */
/*globals SS:false */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Player = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _deathbot = require('./deathbot');

var deathbot = _interopRequireWildcard(_deathbot);

var _berzerk = require('./berzerk');

var _bullet = require('./bullet');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Player = exports.Player = function (_Actor) {
  _inherits(Player, _Actor);

  function Player(image, startX, startY, scale, speedX, speedY, dirX, dirY) {
    _classCallCheck(this, Player);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Player).apply(this, arguments));

    _this.health = 100;
    _this.recoveryTimer = 2;
    _this.eyeOffset = { x: 0, y: 10 };
    _this.headLampActive = true;
    return _this;
  }

  _createClass(Player, [{
    key: 'draw',
    value: function draw(game, elapsedTime) {
      if (game.gameState !== 'attract') {
        _get(Object.getPrototypeOf(Player.prototype), 'draw', this).call(this, game, elapsedTime);
      }
      if (this.bullet) {
        this.bullet.draw(game, elapsedTime);
      }
      // let healthVis = ((100 - this.health) / 100);
      // game.context.fillStyle = 'rgba(0,0,0,' + healthVis + ')';
      // game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);
      this.drawFPS(game, elapsedTime);
    }
  }, {
    key: 'update',
    value: function update(game, elapsedTime) {
      if (this.health <= 0) {
        this.active = false;
        game.gameState = 'dead';
        console.log('DEAD!');
        if (this.bullet && this.bullet.active) {
          this.bullet = null;
          delete game.actors.playerBullet;
        }
        // let lowestScore = SS.currentScores && SS.currentScores.length ?
        //   SS.currentScores[SS.currentScores.length - 1].score : 0;
        // if (game.score > lowestScore) {
        //   let playerName = prompt('Please Enter your Name.');
        //   SS.submitScore(playerName, game.score);
        //   deathbot.scores = SS.getScores(8);
        // }
      }

      if (game.gameState === 'attract') {
        return;
      }
      var dirX = 0;
      var dirY = 0;
      this.debugColor = 'blue';

      if (this.health <= 0) {
        this.debugColor = 'black';
      }

      if (this.health < 100) {
        if (this.recoveryTimer > 1) {
          this.health += 2;
        } else {
          this.recoveryTimer += elapsedTime;
        }
      }

      if (game.keyDown.up) {
        dirY = -1;
        this.dirX = 0;
        this.dirY = dirY;
      }
      if (game.keyDown.down) {
        dirY = 1;
        this.dirX = 0;
        this.dirY = dirY;
      }
      if (game.keyDown.left) {
        dirX = -1;
        this.dirY = 0;
        this.dirX = dirX;
      }
      if (game.keyDown.right) {
        dirX = 1;
        this.dirY = 0;
        this.dirX = dirX;
      }
      if (this.bullet) {
        // check whether bullet is still active
        if (!this.bullet.active) {
          this.bullet = null;
          delete game.actors.playerBullet;
        }
      } else {
        if (game.keyDown.shootUp) {
          this.fireBullet(game, 0, -1);
        }
        if (game.keyDown.shootDown) {
          this.fireBullet(game, 0, 1);
        }
        if (game.keyDown.shootLeft) {
          this.fireBullet(game, -1, 0);
        }
        if (game.keyDown.shootRight) {
          this.fireBullet(game, 1, 0);
        }
      }

      if (dirX === -1 && this.facing !== 'left') {
        this.curImage = this.image.rev;
        this.facing = 'left';
      }

      if (dirX === 1 && this.facing !== 'right') {
        this.curImage = this.image;
        this.facing = 'right';
      }

      var movingBox = new _berzerk.Box(this.curX, this.curY, this.width, this.height);
      var segmentDelta = {
        x: this.speedX * elapsedTime * dirX,
        y: this.speedY * elapsedTime * dirY
      };
      var result = game.physics.sweepBoxIntoBoxes(movingBox, segmentDelta, game.staticBlocks);
      if (result && result.hit) {
        this.curX = result.hitPos.x - this.width / 2;
        this.curY = result.hitPos.y - this.height / 2;
      } else {
        this.curX += segmentDelta.x;
        this.curY += segmentDelta.y;
      }

      if (this.curX + this.width > game.canvas.width) {
        var xClip = this.curX + this.width - game.canvas.width - this.width;
        if (this.dirX === 1) {
          this.curX = xClip;
        }
      }
      if (this.curX < 0) {
        if (this.dirX === -1) {
          this.curX = this.curX + game.canvas.width;
        }
      }
      if (this.curY + this.height > game.canvas.height) {
        var yClip = this.curY + this.height - game.canvas.height - this.height;
        if (this.dirY === 1) {
          this.curY = yClip;
        }
      }
      if (this.curY < 0) {
        if (this.dirY === -1) {
          this.curY = this.curY + game.canvas.height;
        }
      }

      this.eachOverlappingActor(game, deathbot.Monster, function (actor) {
        this.debugColor = 'white';
        if (!game.debugMode) {
          this.health -= 20;
        }
        if (this.health <= 0) {
          game.playerDeathMethod = 'dead';
        }
      });

      // console.log(this.curX, this.curY);
      // this.headLamp(game, elapsedTime);
    }

    // startX, startY, speed, dirX, dirY

  }, {
    key: 'fireBullet',
    value: function fireBullet(game, dirX, dirY) {
      this.bullet = new _bullet.Bullet(this.curX, this.curY + 20, 600, dirX, dirY);
      game.actors.playerBullet = this.bullet;
    }
  }]);

  return Player;
}(_berzerk.Actor);

},{"./berzerk":3,"./bullet":6,"./deathbot":7}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9iZXJ6ZXJrL2FjdG9yLmpzIiwianMvYmVyemVyay9nYW1lLmpzIiwianMvYmVyemVyay9pbmRleC5qcyIsImpzL2Jlcnplcmsva2V5cy5qcyIsImpzL2JlcnplcmsvcGh5c2ljcy5qcyIsImpzL2J1bGxldC5qcyIsImpzL2RlYXRoYm90LmpzIiwianMvZ2FtZS5qcyIsImpzL21vbnN0ZXIuanMiLCJqcy9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ0E7Ozs7Ozs7OztBQUVBOzs7O0FBRU8sSUFBSSxrQ0FBYTtBQUN0QixNQUFJLENBQUo7QUFDQSxRQUFNLENBQU47QUFDQSxRQUFNLENBQU47QUFDQSxTQUFPLENBQVA7QUFDQSxjQUFZLENBQ1YsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUMsQ0FBRCxFQURBLEVBRVYsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFGRyxFQUdWLEVBQUMsR0FBRyxDQUFDLENBQUQsRUFBSSxHQUFHLENBQUgsRUFIRSxFQUlWLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBSkcsQ0FBWjtBQUtBLFNBQVEsQ0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLE1BQWYsRUFBdUIsT0FBdkIsQ0FBUjtBQUNBLDhCQUFTLE1BQU0sTUFBTTtBQUNuQixRQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ1osYUFBTyxLQUFLLEtBQUwsQ0FESztLQUFkLE1BRU8sSUFBSSxPQUFPLENBQVAsRUFBVTtBQUNuQixhQUFPLEtBQUssSUFBTCxDQURZO0tBQWQsTUFFQSxJQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ25CLGFBQU8sS0FBSyxJQUFMLENBRFk7S0FBZCxNQUVBLElBQUksT0FBTyxDQUFQLEVBQVU7QUFDbkIsYUFBTyxLQUFLLEVBQUwsQ0FEWTtLQUFkLE1BRUE7QUFDTCxhQUFPLEtBQUssS0FBTCxDQURGO0tBRkE7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LEtBQVosQ0FEbUI7U0FBckI7T0FGRjtBQU1BLFVBQUksS0FBSyxJQUFMLEdBQVksQ0FBWixFQUFlO0FBQ2pCLFlBQUksS0FBSyxJQUFMLEtBQWMsQ0FBQyxDQUFELEVBQUk7QUFDcEIsZUFBSyxJQUFMLEdBQVksS0FBSyxJQUFMLEdBQVksS0FBSyxNQUFMLENBQVksTUFBWixDQURKO1NBQXRCO09BREY7O0FBTUEsV0FBSyxvQkFBTCxDQUEwQixJQUExQixFQUFnQyxTQUFTLE9BQVQsRUFBa0IsVUFBUyxLQUFULEVBQWdCO0FBQ2hFLGFBQUssVUFBTCxHQUFrQixPQUFsQixDQURnRTtBQUVoRSxZQUFJLENBQUMsS0FBSyxTQUFMLEVBQWdCO0FBQ25CLGVBQUssTUFBTCxJQUFlLEVBQWYsQ0FEbUI7U0FBckI7QUFHQSxZQUFJLEtBQUssTUFBTCxJQUFlLENBQWYsRUFBa0I7QUFDcEIsZUFBSyxpQkFBTCxHQUF5QixNQUF6QixDQURvQjtTQUF0QjtPQUxnRCxDQUFsRDs7OztBQS9Id0I7Ozs7OzsrQkE4SWYsTUFBTSxNQUFNLE1BQU07QUFDM0IsV0FBSyxNQUFMLEdBQWMsbUJBQVcsS0FBSyxJQUFMLEVBQVcsS0FBSyxJQUFMLEdBQVksRUFBWixFQUFnQixHQUF0QyxFQUEyQyxJQUEzQyxFQUFpRCxJQUFqRCxDQUFkLENBRDJCO0FBRTNCLFdBQUssTUFBTCxDQUFZLFlBQVosR0FBMkIsS0FBSyxNQUFMLENBRkE7Ozs7U0FyS2xCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1BoeXNpY3MsIEJveCwgUG9pbnQsIEVQU0lMT04sIERFR19UT19SQUR9IGZyb20gJy4vcGh5c2ljcyc7XG5cbmV4cG9ydCB2YXIgRGlyZWN0aW9ucyA9IHtcbiAgVVA6IDAsXG4gIERPV046IDEsXG4gIExFRlQ6IDIsXG4gIFJJR0hUOiAzLFxuICBkaXJlY3Rpb25zOiBbXG4gICAge3g6IDAsIHk6IC0xfSxcbiAgICB7eDogMCwgeTogMX0sXG4gICAge3g6IC0xLCB5OiAwfSxcbiAgICB7eDogMSwgeTogMH1dLFxuICBuYW1lczogIFsndXAnLCAnZG93bicsICdsZWZ0JywgJ3JpZ2h0J10sXG4gIGdldEluZGV4KGRpclgsIGRpclkpIHtcbiAgICBpZiAoZGlyWCA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLlJJR0hUO1xuICAgIH0gZWxzZSBpZiAoZGlyWCA8IDApIHtcbiAgICAgIHJldHVybiB0aGlzLkxFRlQ7XG4gICAgfSBlbHNlIGlmIChkaXJZID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuRE9XTjtcbiAgICB9IGVsc2UgaWYgKGRpclkgPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5VUDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuUklHSFQ7XG4gICAgfVxuICB9LFxuICBnZXROYW1lKGRpclgsIGRpclkpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lc1t0aGlzLmdldEluZGV4KGRpclgsIGRpclkpXTtcbiAgfVxufTtcblxuZXhwb3J0IGNsYXNzIEFjdG9yIHtcbiAgY29uc3RydWN0b3IoaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpclkpIHtcbiAgICBsZXQgdW5zY2FsZWRXaWR0aCwgdW5zY2FsZWRIZWlnaHQ7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICB0aGlzLmltYWdlID0gaW1hZ2U7XG4gICAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5pbWFnZTtcbiAgICAgIHRoaXMuZGlySW1hZ2VzID0ge1xuICAgICAgICByaWdodDogaW1hZ2UsXG4gICAgICAgIGxlZnQ6IGltYWdlLnJldixcbiAgICAgICAgdXA6IGltYWdlLnVwLFxuICAgICAgICBkb3duOiBpbWFnZS5kb3duXG4gICAgICB9O1xuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kaXJJbWFnZXMpO1xuICAgICAgdW5zY2FsZWRXaWR0aCA9IGltYWdlLnc7XG4gICAgICB1bnNjYWxlZEhlaWdodCA9IGltYWdlLmg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaW1hZ2UgPSBudWxsO1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IG51bGw7XG4gICAgICB0aGlzLmRpckltYWdlcyA9IHtcbiAgICAgICAgcmlnaHQ6IG51bGwsXG4gICAgICAgIGxlZnQ6IG51bGwsXG4gICAgICAgIHVwOiBudWxsLFxuICAgICAgICBkb3duOiBudWxsXG4gICAgICB9O1xuICAgICAgdW5zY2FsZWRXaWR0aCA9IDE7XG4gICAgICB1bnNjYWxlZEhlaWdodCA9IDE7XG4gICAgfVxuXG4gICAgdGhpcy5wcmV2aW91c0RpciA9IHt4OiB0aGlzLmRpclgsIHk6IHRoaXMuZGlyWX07XG4gICAgdGhpcy5zdGFydFggPSBzdGFydFg7XG4gICAgdGhpcy5zdGFydFkgPSBzdGFydFk7XG5cbiAgICB0aGlzLmZhY2luZyA9ICdyaWdodCc7XG4gICAgdGhpcy5kaXJYID0gZGlyWDtcbiAgICB0aGlzLmRpclkgPSBkaXJZO1xuICAgIHRoaXMud2lkdGggPSB1bnNjYWxlZFdpZHRoICogKHNjYWxlIC8gMTAwKTtcbiAgICB0aGlzLmhlaWdodCA9IHVuc2NhbGVkSGVpZ2h0ICogKHNjYWxlIC8gMTAwKTtcbiAgICB0aGlzLmN1clggPSBzdGFydFg7XG4gICAgdGhpcy5jdXJZID0gc3RhcnRZO1xuICAgIHRoaXMucHJldmlvdXNQb3MgPSB7eDogdGhpcy5jdXJYLCB5OiB0aGlzLmN1cll9O1xuICAgIHRoaXMudGlsZXNJbkZPViA9IFtdO1xuICAgIHRoaXMuc3BlZWRYID0gc3BlZWRYO1xuICAgIHRoaXMuc3BlZWRZID0gc3BlZWRZO1xuICAgIHRoaXMubW92aW5nID0gdHJ1ZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5hbHBoYSA9IDE7XG4gICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3JlZCc7XG4gICAgdGhpcy5leWVPZmZzZXQgPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5sYXNlckRlbHRhID0ge307XG4gICAgdGhpcy5sYXNlclJhbmdlID0gOTQwMDtcbiAgICB0aGlzLmxhc2VyU3RhcnQgPSB7fTtcbiAgfVxuXG4gIGNvbGxpZGVzV2l0aFdhbGxzKGdhbWUpIHtcbiAgICBsZXQgcmVzdWx0ID0ge2hpdDogZmFsc2UsIGRpclg6IDAsIGRpclk6IDB9O1xuICAgIC8vIEhpdCB0aGUgTGVmdCBXYWxsXG4gICAgaWYgKHRoaXMuY3VyWCA8IDApIHtcbiAgICAgIHRoaXMuY3VyWCA9IEVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJYOiAxfTtcbiAgICB9XG4gICAgLy8gSGl0IHJpZ2h0IHdhbGxcbiAgICBpZiAodGhpcy5jdXJYID4gKGdhbWUuY2FudmFzLndpZHRoIC0gdGhpcy53aWR0aCkpIHtcbiAgICAgIHRoaXMuY3VyWCA9IChnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGgpIC0gRVBTSUxPTjtcbiAgICAgIHJlc3VsdCA9IHtoaXQ6IHRydWUsIGRpclg6IC0xfTtcbiAgICB9XG4gICAgLy8gSGl0IHRoZSBDZWlsaW5nXG4gICAgaWYgKHRoaXMuY3VyWSA8IDApIHtcbiAgICAgIHRoaXMuY3VyWSA9IEVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJZOiAxfTtcbiAgICB9XG4gICAgLy8gSGl0IHRoZSBGbG9vclxuICAgIGlmICh0aGlzLmN1clkgPiBnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodCkge1xuICAgICAgdGhpcy5jdXJZID0gKGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0KSAtIEVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJZOiAtMX07XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBlYWNoT3ZlcmxhcHBpbmdBY3RvcihnYW1lLCBhY3RvckNvbnN0cnVjdG9yLCBjYWxsYmFjaykge1xuICAgIGdhbWUuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoIShhY3RvciBpbnN0YW5jZW9mIGFjdG9yQ29uc3RydWN0b3IpIHx8ICFhY3Rvci5hY3RpdmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IG92ZXJsYXBwaW5nID0gIShcbiAgICAgICAgdGhpcy5jdXJYID4gYWN0b3IuY3VyWCArIGFjdG9yLndpZHRoIHx8XG4gICAgICAgIHRoaXMuY3VyWCArIHRoaXMud2lkdGggPCBhY3Rvci5jdXJYIHx8XG4gICAgICAgIHRoaXMuY3VyWSArIHRoaXMuaGVpZ2h0IDwgYWN0b3IuY3VyWSB8fFxuICAgICAgICB0aGlzLmN1clkgPiBhY3Rvci5jdXJZICsgYWN0b3IuaGVpZ2h0XG4gICAgICApO1xuICAgICAgaWYgKG92ZXJsYXBwaW5nKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgYWN0b3IpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgZWFjaFZpc2libGVBY3RvcihnYW1lLCBhY3RvckNvbnN0cnVjdG9yLCBjYWxsYmFjaykge1xuICAgIGdhbWUuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoIShhY3RvciBpbnN0YW5jZW9mIGFjdG9yQ29uc3RydWN0b3IpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmdhbWVTdGF0ZSAhPT0gJ3BsYXknKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCB2aXNpb25TdGFydCA9IHtcbiAgICAgICAgeDogdGhpcy5jdXJYICsgKHRoaXMud2lkdGggLyAyKSArIHRoaXMuZXllT2Zmc2V0LngsXG4gICAgICAgIHk6IHRoaXMuY3VyWSArIHRoaXMuZXllT2Zmc2V0LnlcbiAgICAgIH07XG4gICAgICBsZXQgdmlzaW9uRGVsdGEgPSB7XG4gICAgICAgIHg6IChhY3Rvci5jdXJYICsgKGFjdG9yLndpZHRoIC8gMikgKyBhY3Rvci5leWVPZmZzZXQueCkgLSB2aXNpb25TdGFydC54LFxuICAgICAgICB5OiAoYWN0b3IuY3VyWSArIGFjdG9yLmV5ZU9mZnNldC55KSAtIHZpc2lvblN0YXJ0LnlcbiAgICAgIH07XG4gICAgICBsZXQgYWN0b3JEaXJMZW5ndGggPSBNYXRoLnNxcnQoXG4gICAgICAgIHZpc2lvbkRlbHRhLnggKiB2aXNpb25EZWx0YS54ICsgdmlzaW9uRGVsdGEueSAqIHZpc2lvbkRlbHRhLnkpO1xuICAgICAgbGV0IGFjdG9yRGlyID0ge1xuICAgICAgICB4OiB2aXNpb25EZWx0YS54IC8gYWN0b3JEaXJMZW5ndGgsXG4gICAgICAgIHk6IHZpc2lvbkRlbHRhLnkgLyBhY3RvckRpckxlbmd0aFxuICAgICAgfTtcbiAgICAgIGxldCBkb3RQcm9kdWN0ID0gKHRoaXMuZGlyWCAqIGFjdG9yRGlyLngpICsgKHRoaXMuZGlyWSAqIGFjdG9yRGlyLnkpO1xuXG4gICAgICBsZXQgdmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICBsZXQgaW5GT1Y7XG4gICAgICBpZiAoZG90UHJvZHVjdCA+IDAuNzApIHtcbiAgICAgICAgaW5GT1YgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5GT1YgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGluRk9WKSB7XG4gICAgICAgIGxldCBhY3RvckFyciA9IFtdO1xuICAgICAgICBsZXQgYWN0b3JPYmogPSB7XG4gICAgICAgICAgeDogYWN0b3IuY3VyWCxcbiAgICAgICAgICB5OiBhY3Rvci5jdXJZLFxuICAgICAgICAgIHc6IGFjdG9yLndpZHRoLFxuICAgICAgICAgIGg6IGFjdG9yLmhlaWdodFxuICAgICAgICB9O1xuICAgICAgICBhY3RvckFyci5wdXNoKGFjdG9yT2JqKTtcbiAgICAgICAgbGV0IGJsb2NrUmVzdWx0ID0gZ2FtZS5waHlzaWNzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoXG4gICAgICAgICAgdmlzaW9uU3RhcnQsIHZpc2lvbkRlbHRhLCBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgICAgIGxldCBhY3RvclJlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgICAgIHZpc2lvblN0YXJ0LCB2aXNpb25EZWx0YSwgYWN0b3JBcnIpO1xuXG4gICAgICAgIGlmIChnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgICAgIGxldCBlbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgICBhY3Rvci5jdXJYICsgKGFjdG9yLndpZHRoIC8gMikgKyBhY3Rvci5leWVPZmZzZXQueCxcbiAgICAgICAgICAgIGFjdG9yLmN1clkgKyBhY3Rvci5leWVPZmZzZXQueSk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5tb3ZlVG8odmlzaW9uU3RhcnQueCwgdmlzaW9uU3RhcnQueSk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LmxpbmVUbyhlbmRQb3MueCwgZW5kUG9zLnkpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAnd2hpdGUnO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY3RvclJlc3VsdCAmJiBhY3RvclJlc3VsdC5oaXQgJiYgYmxvY2tSZXN1bHQgJiYgYmxvY2tSZXN1bHQuaGl0KSB7XG4gICAgICAgICAgbGV0IHJlc3VsdCA9IGdhbWUucGh5c2ljcy5jaGVja05lYXJlc3RIaXQoXG4gICAgICAgICAgICB0aGlzLCBibG9ja1Jlc3VsdCwgYWN0b3JSZXN1bHQpO1xuICAgICAgICAgIHZpc2libGUgPSByZXN1bHQudGFyZ2V0SGl0O1xuICAgICAgICB9IGVsc2UgaWYgKGFjdG9yUmVzdWx0ICYmIGFjdG9yUmVzdWx0LmhpdCkge1xuICAgICAgICAgIHZpc2libGUgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZpc2libGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHZpc2libGUpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBhY3Rvcik7XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG4gIH1cblxuICBoZWFkTGFtcChnYW1lLCBlbGFwc2VkVGltZSwgYW5nbGUgPSA3NSwgcG93ZXIgPSA4MDApIHtcbiAgICBsZXQgcG9pbnRBcnJheSA9IFtdO1xuICAgIGxldCBzdGFydGluZ1BvaW50ID0ge307XG4gICAgbGV0IGRlZ3JlZVRvQ3VyRW5kUG9pbnQ7XG4gICAgbGV0IHN3ZWVwQW5nbGUgPSBhbmdsZTtcbiAgICBsZXQgZ3JpZFNpemUgPSB7dzogMjgsIGg6IDI4fTtcbiAgICBsZXQgY2VsbFNpemUgPSAzMjtcbiAgICBsZXQgZGlyID0ge3g6IHRoaXMuZGlyWCwgeTogdGhpcy5kaXJZfTtcblxuICAgIHN0YXJ0aW5nUG9pbnQueCA9IHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gMik7XG4gICAgc3RhcnRpbmdQb2ludC55ID0gdGhpcy5jdXJZICsgMTQ7XG4gICAgbGV0IGluaXRpYWxFbmRwb2ludCA9IHt9O1xuICAgIC8vIEdldCBvdXIgaW5pdGlhbCBwb2ludCB0aGF0IGlzIHN0cmFpZ2h0IGFoZWFkXG4gICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICBpbml0aWFsRW5kcG9pbnQgPSB7eDogKHN0YXJ0aW5nUG9pbnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHN0YXJ0aW5nUG9pbnQueX07XG4gICAgfSBlbHNlIGlmICh0aGlzLmRpclkgPT09IC0xIHx8IHRoaXMuZGlyWSA9PT0gMSkge1xuICAgICAgaW5pdGlhbEVuZHBvaW50ID0ge3g6IHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IChzdGFydGluZ1BvaW50LnkgKyB0aGlzLmxhc2VyUmFuZ2UpICogLXRoaXMuZGlyWX07XG4gICAgfVxuXG4gICAgLy8gVXNpbmcgdGhlIE1vdXNlXG4gICAgLy8gaW5pdGlhbEVuZHBvaW50ID0ge3g6ICh0aGlzLmN1clggLSBnYW1lLm1vdXNlLngpICogdGhpcy5sYXNlclJhbmdlLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICB5OiAodGhpcy5jdXJZIC0gZ2FtZS5tb3VzZS55KSAqIHRoaXMubGFzZXJSYW5nZX07XG4gICAgcG9pbnRBcnJheSA9IGdhbWUucGh5c2ljcy5zd2VlcFNjYW4oZ2FtZSwgaW5pdGlhbEVuZHBvaW50LCBzdGFydGluZ1BvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWUuY2FudmFzLndpZHRoLCBzd2VlcEFuZ2xlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbGxTaXplLCB0aGlzKTtcbiAgICBsZXQgbGlnaHRDdHggPSBnYW1lLmNvbnRleHQ7XG4gICAgbGlnaHRDdHguYmVnaW5QYXRoKCk7XG4gICAgbGlnaHRDdHgubW92ZVRvKHN0YXJ0aW5nUG9pbnQueCwgc3RhcnRpbmdQb2ludC55KTtcbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSBwb2ludEFycmF5Lmxlbmd0aDsgaSA8IGxpOyBpKyspIHtcbiAgICAgIGxpZ2h0Q3R4LmxpbmVUbyhwb2ludEFycmF5W2ldLngsIHBvaW50QXJyYXlbaV0ueSk7XG4gICAgfVxuICAgIGxpZ2h0Q3R4LmNsb3NlUGF0aCgpO1xuICAgIGxldCBncmQgPSBsaWdodEN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudCh0aGlzLmN1clgsdGhpcy5jdXJZLHBvd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1clgsdGhpcy5jdXJZLDApO1xuICAgIGdyZC5hZGRDb2xvclN0b3AoMCwgJ3RyYW5zcGFyZW50Jyk7XG4gICAgZ3JkLmFkZENvbG9yU3RvcCgwLjgsICdyZ2JhKDI1NSwyNTUsMjU1LDAuMyknKTtcbiAgICBncmQuYWRkQ29sb3JTdG9wKDEsICdyZ2JhKDI1NSwyNTUsMjU1LDAuNSknKTtcbiAgICBsaWdodEN0eC5maWxsU3R5bGUgPSBncmQ7XG4gICAgbGlnaHRDdHguZmlsbCgpO1xuICB9XG5cbiAgdXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgbGV0IGhpdFdhbGwgPSB0aGlzLmNvbGxpZGVzV2l0aFdhbGxzKGdhbWUpO1xuICAgIGlmIChoaXRXYWxsLmRpclgpIHtcbiAgICAgIHRoaXMuZGlyWCA9IGhpdFdhbGwuZGlyWDtcbiAgICB9XG4gICAgaWYgKGhpdFdhbGwuZGlyWSkge1xuICAgICAgdGhpcy5kaXJZID0gaGl0V2FsbC5kaXJZO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1vdmluZykge1xuICAgICAgbGV0IG1vdmluZ0JveCA9IG5ldyBCb3godGhpcy5jdXJYLCB0aGlzLmN1clksIHRoaXMud2lkdGgsXG4gICAgICAgIHRoaXMuaGVpZ2h0KTtcbiAgICAgIGxldCBzZWdtZW50RGVsdGEgPSB7XG4gICAgICAgIHg6ICh0aGlzLnNwZWVkWCAqIGVsYXBzZWRUaW1lKSAqIHRoaXMuZGlyWCxcbiAgICAgICAgeTogKHRoaXMuc3BlZWRZICogZWxhcHNlZFRpbWUpICogdGhpcy5kaXJZXG4gICAgICB9O1xuICAgICAgbGV0IHJlc3VsdCA9IGdhbWUucGh5c2ljcy5zd2VlcEJveEludG9Cb3hlcyhtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSxcbiAgICAgICAgZ2FtZS5zdGF0aWNCbG9ja3MpO1xuICAgICAgdGhpcy5wcmV2aW91c1BvcyA9IHtcbiAgICAgICAgeDogdGhpcy5jdXJYLFxuICAgICAgICB5OiB0aGlzLmN1cllcbiAgICAgIH07XG4gICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5oaXQpIHtcbiAgICAgICAgdGhpcy5kaXJYID0gcmVzdWx0LmhpdE5vcm1hbC54O1xuICAgICAgICB0aGlzLmRpclkgPSByZXN1bHQuaGl0Tm9ybWFsLnk7XG4gICAgICAgIHRoaXMuY3VyWCA9IHJlc3VsdC5oaXRQb3MueCAtICh0aGlzLndpZHRoIC8gMik7XG4gICAgICAgIHRoaXMuY3VyWSA9IHJlc3VsdC5oaXRQb3MueSAtICh0aGlzLmhlaWdodCAvIDIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jdXJYICs9IHNlZ21lbnREZWx0YS54O1xuICAgICAgICB0aGlzLmN1clkgKz0gc2VnbWVudERlbHRhLnk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSW1hZ2UgU3dpdGNoZXJcbiAgICB0aGlzLmZhY2luZyA9IERpcmVjdGlvbnMuZ2V0TmFtZSh0aGlzLmRpclgsIHRoaXMuZGlyWSk7XG4gICAgdGhpcy5jdXJJbWFnZSA9IHRoaXMuZGlySW1hZ2VzW3RoaXMuZmFjaW5nXTtcbiAgfVxuXG4gIHByZURyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUgJiYgdGhpcy5oZWFkTGFtcEFjdGl2ZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5oZWFkTGFtcChnYW1lLCBlbGFwc2VkVGltZSwgdGhpcy5oZWFkTGFtcEFuZ2xlLCB0aGlzLmhlYWRMYW1wUG93ZXIpO1xuICAgIH1cbiAgfVxuXG5cblxuICBkcmF3RlBTKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgZ2FtZS5jb250ZXh0RlguY2xlYXJSZWN0KDAsIDAsIGdhbWUuY2FudmFzRlBTLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lLmNhbnZhc0ZQUy5oZWlnaHQpO1xuICAgIGxldCBiZ0NvbG9yID0gJyNGRkZGRkYnO1xuICAgIGdhbWUuY29udGV4dEZQUy5maWxsU3R5bGUgPSBiZ0NvbG9yO1xuICAgIGdhbWUuY29udGV4dEZQUy5maWxsUmVjdCgwLCAwLCBnYW1lLmNhbnZhc0ZQUy53aWR0aCwgZ2FtZS5jYW52YXNGUFMuaGVpZ2h0KTtcblxuICAgIGdhbWUuY29udGV4dEZQUy5maWxsU3R5bGUgPSBcIiMwMDAwMDBcIjtcbiAgICBnYW1lLmNvbnRleHRGUFMuZmlsbFJlY3QoMCwgZ2FtZS5jYW52YXNGUFMuaGVpZ2h0IC8gMiwgZ2FtZS5jYW52YXNGUFMud2lkdGgsIGdhbWUuY2FudmFzRlBTLmhlaWdodCAvIDIpO1xuXG4gICAgbGV0IHBvaW50QXJyYXkgPSBbXTtcbiAgICBsZXQgc3RhcnRpbmdQb2ludCA9IHt9O1xuICAgIGxldCBkZWdyZWVUb0N1ckVuZFBvaW50O1xuICAgIGxldCBzd2VlcEFuZ2xlID0gNjA7XG4gICAgbGV0IHJlc29sdXRpb24gPSAzMjA7XG4gICAgbGV0IHByb2plY3Rpb25EaXN0YW5jZSA9IChnYW1lLmNhbnZhc0ZQUy53aWR0aCAvIDIpICpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC50YW4oc3dlZXBBbmdsZSAqIERFR19UT19SQUQpO1xuICAgIGxldCBncmlkU2l6ZSA9IHt3OiAyOCwgaDogMjh9O1xuICAgIGxldCBjZWxsU2l6ZSA9IDMyO1xuICAgIGxldCBkaXIgPSB7eDogdGhpcy5kaXJYLCB5OiB0aGlzLmRpcll9O1xuXG4gICAgc3RhcnRpbmdQb2ludC54ID0gdGhpcy5jdXJYICsgKHRoaXMud2lkdGggLyAyKTtcbiAgICBzdGFydGluZ1BvaW50LnkgPSB0aGlzLmN1clkgKyAxNDtcbiAgICBsZXQgaW5pdGlhbEVuZHBvaW50ID0ge307XG4gICAgLy8gR2V0IG91ciBpbml0aWFsIHBvaW50IHRoYXQgaXMgc3RyYWlnaHQgYWhlYWRcbiAgICBpZiAodGhpcy5kaXJYID09PSAtMSB8fCB0aGlzLmRpclggPT09IDEpIHtcbiAgICAgIGluaXRpYWxFbmRwb2ludCA9IHt4OiAoc3RhcnRpbmdQb2ludC54ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpclgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgeTogc3RhcnRpbmdQb2ludC55fTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGlyWSA9PT0gLTEgfHwgdGhpcy5kaXJZID09PSAxKSB7XG4gICAgICBpbml0aWFsRW5kcG9pbnQgPSB7eDogc3RhcnRpbmdQb2ludC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogKHN0YXJ0aW5nUG9pbnQueSArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJZfTtcbiAgICB9XG4gICAgcG9pbnRBcnJheSA9IGdhbWUucGh5c2ljcy5zd2VlcFNjYW4oZ2FtZSwgaW5pdGlhbEVuZHBvaW50LCBzdGFydGluZ1BvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWUuY2FudmFzRlBTLndpZHRoLCBzd2VlcEFuZ2xlLCBjZWxsU2l6ZSwgdGhpcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgeiA9IHBvaW50QXJyYXlbaV0uZGVsdGEgKiBNYXRoLmNvcyhwb2ludEFycmF5W2ldLmFuZ2xlICogREVHX1RPX1JBRCk7XG4gICAgICBsZXQgZGlzdGFuY2VBbHBoYSA9IHBvaW50QXJyYXlbaV0uZGVsdGEgLyA4MDA7XG4gICAgICBsZXQgd2FsbEhlaWdodCA9IGdhbWUuY2FudmFzRlBTLmhlaWdodCAqICg2NCAvIHopO1xuICAgICAgLy8gbGV0IHdhbGxIZWlnaHQgPSAoMzIgLyB6KSAqIHByb2plY3Rpb25EaXN0YW5jZTtcbiAgICAgIC8vIGlmICh3YWxsSGVpZ2h0ID4gZ2FtZS5jYW52YXNGUFMuaGVpZ2h0KSB7XG4gICAgICAgIC8vIHdhbGxIZWlnaHQgPSBnYW1lLmNhbnZhc0ZQUy5oZWlnaHQ7XG4gICAgICAvLyB9XG4gICAgICBsZXQgZGlzdGFuY2VDb2xvciA9IE1hdGguZmxvb3IoMjU1ICogKDEuMCAtIGRpc3RhbmNlQWxwaGEpKTtcbiAgICAgIC8vIGdhbWUuY29udGV4dEZQUy5maWxsU3R5bGUgPSBgcmdiYSgwLCAwLCAwLCAke2Rpc3RhbmNlQWxwaGF9KWA7XG4gICAgICBnYW1lLmNvbnRleHRGUFMuZmlsbFN0eWxlID0gYHJnYigke2Rpc3RhbmNlQ29sb3J9LCR7ZGlzdGFuY2VDb2xvcn0sJHtkaXN0YW5jZUNvbG9yfSlgO1xuICAgICAgZ2FtZS5jb250ZXh0RlBTLmZpbGxSZWN0KFxuICAgICAgICBpLFxuICAgICAgICAoZ2FtZS5jYW52YXNGUFMuaGVpZ2h0IC0gd2FsbEhlaWdodCkgLyAyLFxuICAgICAgICAxLFxuICAgICAgICB3YWxsSGVpZ2h0XG4gICAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmN1ckltYWdlKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmN1ckltYWdlKTtcbiAgICAgIGxldCBpbWdTcGxpdFggPSAwLCBpbWdTcGxpdFkgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VyWCArIHRoaXMud2lkdGggPiBnYW1lLmNhbnZhcy53aWR0aCkge1xuICAgICAgICBpbWdTcGxpdFggPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgICBpbWdTcGxpdFggPSBnYW1lLmNhbnZhcy53aWR0aCArIHRoaXMuY3VyWDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICAgIGltZ1NwbGl0WSA9IGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0ICsgKHRoaXMuaGVpZ2h0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJZKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICAgIGltZ1NwbGl0WSA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLVxuICAgICAgICAgICAgICAgICAgICAgZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbWdTcGxpdFggIT09IDAgfHwgaW1nU3BsaXRZICE9PSAwKSB7XG4gICAgICAgIGlmIChpbWdTcGxpdFggPT09IDApIHtcbiAgICAgICAgICBpbWdTcGxpdFggPSB0aGlzLmN1clg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGltZ1NwbGl0WSA9PT0gMCkge1xuICAgICAgICAgIGltZ1NwbGl0WSA9IHRoaXMuY3VyWTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCB0aGlzLmN1clksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgdGhpcy5jdXJYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgfVxuICAgICAgZ2FtZS5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmN1ckltYWdlLCB0aGlzLmN1clgsIHRoaXMuY3VyWSxcbiAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgfVxuXG4gICAgaWYgKGdhbWUuZGVidWdNb2RlKSB7XG4gICAgICBsZXQgeDEgPSB0aGlzLmN1clg7XG4gICAgICBsZXQgeTEgPSB0aGlzLmN1clk7XG4gICAgICBsZXQgeDIgPSB0aGlzLmN1clggKyB0aGlzLndpZHRoO1xuICAgICAgbGV0IHkyID0gdGhpcy5jdXJZICsgdGhpcy5oZWlnaHQ7XG5cbiAgICAgIGdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgIGdhbWUuY29udGV4dC5tb3ZlVG8oeDEsIHkxKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkxKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkyKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDEsIHkyKTtcbiAgICAgIGdhbWUuY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgIGdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuZGVidWdDb2xvcjtcbiAgICAgIGdhbWUuY29udGV4dC5zdHJva2UoKTtcbiAgICAgIGdhbWUuY29udGV4dC5mb250ID0gJzE0cHggVmVyZGFuYSc7XG4gICAgICBnYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gJ2JsdWUnO1xuICAgICAgZ2FtZS5jb250ZXh0LmZpbGxUZXh0KFxuICAgICAgICAneCcgKyBNYXRoLmZsb29yKHRoaXMuY3VyWCkgKyAnICcgK1xuICAgICAgICAneScgKyBNYXRoLmZsb29yKHRoaXMuY3VyWSkgKyAnICcgK1xuICAgICAgICB0aGlzLmRpclggKyAnICcgKyB0aGlzLmRpclksXG4gICAgICAgIHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gNCksXG4gICAgICAgIHRoaXMuY3VyWSArICh0aGlzLmhlaWdodCArIDMwKSk7XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQaHlzaWNzfSBmcm9tICcuL3BoeXNpY3MnO1xuXG5leHBvcnQgY2xhc3MgR2FtZSB7XG4gIGNvbnN0cnVjdG9yKGNhbnZhcykge1xuICAgIHRoaXMubW91c2UgPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVidWdNb2RlID0gdHJ1ZTtcbiAgICB0aGlzLmltYWdlcyA9IHt9O1xuICAgIHRoaXMuaW1hZ2VzTG9hZGVkID0gZmFsc2U7XG4gICAgdGhpcy5hY3RvcnMgPSB7fTtcbiAgICB0aGlzLmtleURvd24gPSB7fTtcbiAgICB0aGlzLmtleU5hbWVzID0ge307XG4gICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgfVxuXG4gIGRlZmluZUtleShrZXlOYW1lLCBrZXlDb2RlKSB7XG4gICAgdGhpcy5rZXlEb3duW2tleU5hbWVdID0gZmFsc2U7XG4gICAgdGhpcy5rZXlOYW1lc1trZXlDb2RlXSA9IGtleU5hbWU7XG4gIH1cblxuICBnZXRSYW5kb20obWluLCBtYXgpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpICsgbWluKTtcbiAgfVxuXG4gIC8vIExvb3BzIHRocm91Z2ggQWN0b3IgYXJyYXkgYW5kIGNyZWF0ZXMgY2FsbGFibGUgaW1hZ2VzLlxuICBsb2FkSW1hZ2VzKGNoYXJhY3RlcnMsIGltYWdlcykge1xuICAgIGxldCBpbWFnZXNUb0xvYWQgPSBbXTtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGxvYWRlZEltYWdlcyA9IDA7XG4gICAgbGV0IG51bUltYWdlcyA9IDA7XG5cbiAgICBsZXQgZ2V0UmV2ZXJzZUltYWdlID0gZnVuY3Rpb24oc3JjLCB3LCBoKSB7XG4gICAgICBudW1JbWFnZXMrKztcbiAgICAgIGxldCB0ZW1wSW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGxldCB0ZW1wQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICBsZXQgdGVtcENvbnRleHQgPSB0ZW1wQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICB0ZW1wQ2FudmFzLndpZHRoID0gdztcbiAgICAgIHRlbXBDYW52YXMuaGVpZ2h0ID0gaDtcbiAgICAgIHRlbXBDb250ZXh0LnRyYW5zbGF0ZSh3LCAwKTtcbiAgICAgIHRlbXBDb250ZXh0LnNjYWxlKC0xLCAxKTtcbiAgICAgIHRlbXBDb250ZXh0LmRyYXdJbWFnZShzcmMsIDAsIDApO1xuICAgICAgdGVtcEltYWdlLm9ubG9hZCA9IG9uSW1hZ2VMb2FkZWQ7XG4gICAgICB0ZW1wSW1hZ2Uuc3JjID0gdGVtcENhbnZhcy50b0RhdGFVUkwoKTtcbiAgICAgIHJldHVybiB0ZW1wSW1hZ2U7XG4gICAgfTtcblxuICAgIGxldCBvbkltYWdlTG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICBsb2FkZWRJbWFnZXMrKztcbiAgICAgIGNvbnNvbGUubG9nKCdsb2FkZWQgaW1hZ2UnLCBsb2FkZWRJbWFnZXMsICdvZicsIG51bUltYWdlcyk7XG4gICAgICBpZiAobG9hZGVkSW1hZ2VzID09PSBudW1JbWFnZXMpIHtcbiAgICAgICAgc2VsZi5pbWFnZXNMb2FkZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgbG9hZEltYWdlID0gZnVuY3Rpb24oc3JjLCBjYWxsYmFjaykge1xuICAgICAgbGV0IGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgY2FsbGJhY2suY2FsbChpbWFnZSk7XG4gICAgICAgIH1cbiAgICAgICAgb25JbWFnZUxvYWRlZCgpO1xuICAgICAgfTtcbiAgICAgIGltYWdlc1RvTG9hZC5wdXNoKHtpbWFnZTogaW1hZ2UsIHNyYzogc3JjfSk7XG4gICAgICByZXR1cm4gaW1hZ2U7XG4gICAgfTtcblxuICAgIGxldCBvbk1haW5JbWFnZUxvYWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5yZXYgPSBnZXRSZXZlcnNlSW1hZ2UodGhpcywgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBjaGFyYWN0ZXJzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIC8vIGdldCBvdXIgbWFpbiBpbWFnZVxuICAgICAgbGV0IGNoYXJhY3RlciA9IGNoYXJhY3RlcnNbaV07XG4gICAgICBsZXQgaW1hZ2UgPSB0aGlzLmltYWdlc1tjaGFyYWN0ZXIubmFtZV0gPSBsb2FkSW1hZ2UoXG4gICAgICAgIGNoYXJhY3Rlci5pbWFnZSxcbiAgICAgICAgb25NYWluSW1hZ2VMb2FkZWQpO1xuXG4gICAgICBpZiAoY2hhcmFjdGVyLmltYWdlVXApIHtcbiAgICAgICAgaW1hZ2UudXAgPSBsb2FkSW1hZ2UoY2hhcmFjdGVyLmltYWdlVXApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2UudXAgPSBpbWFnZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNoYXJhY3Rlci5pbWFnZURvd24pIHtcbiAgICAgICAgaW1hZ2UuZG93biA9IGxvYWRJbWFnZShjaGFyYWN0ZXIuaW1hZ2VEb3duKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltYWdlLmRvd24gPSBpbWFnZTtcbiAgICAgIH1cblxuICAgICAgaW1hZ2UudyA9IGNoYXJhY3Rlci53O1xuICAgICAgaW1hZ2UuaCA9IGNoYXJhY3Rlci5oO1xuICAgIH1cblxuICAgIGZvciAobGV0IGtleSBpbiBpbWFnZXMpIHtcbiAgICAgIGlmIChpbWFnZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICB0aGlzW2tleV0gPSBsb2FkSW1hZ2UoaW1hZ2VzW2tleV0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIG51bUltYWdlcyA9IGltYWdlc1RvTG9hZC5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gaW1hZ2VzVG9Mb2FkLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIGltYWdlc1RvTG9hZFtpXS5pbWFnZS5zcmMgPSBpbWFnZXNUb0xvYWRbaV0uc3JjO1xuICAgIH1cbiAgfVxuXG4gIGVhY2hBY3RvcihjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGZvciAobGV0IGMgaW4gdGhpcy5hY3RvcnMpIHtcbiAgICAgIGlmICh0aGlzLmFjdG9ycy5oYXNPd25Qcm9wZXJ0eShjKSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuYWN0b3JzW2NdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplKGVsYXBzZWRUaW1lKSB7XG4gICAgdGhpcy5waHlzaWNzID0gbmV3IFBoeXNpY3ModGhpcyk7XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICBkcmF3KGVsYXBzZWRUaW1lKSB7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcbiAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIC8vIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwxLjApJztcbiAgICAvLyB0aGlzLmNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCAvIDIpO1xuXG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGFjdG9yLnByZURyYXcodGhpcywgZWxhcHNlZFRpbWUpO1xuICAgIH0sIHRoaXMpO1xuICAgIHRoaXMuY29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLWF0b3AnO1xuICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBhY3Rvci5kcmF3KHRoaXMsIGVsYXBzZWRUaW1lKTtcbiAgICB9LCB0aGlzKTtcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ3NvdXJjZS1vdmVyJztcbiAgfVxuXG4gIGRyYXdMb2FkaW5nKCkge31cblxuICB1cGRhdGUoZWxhcHNlZFRpbWUpIHtcbiAgICB0aGlzLml0ZXJhdGlvbisrO1xuICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoYWN0b3IuYWN0aXZlKSB7XG4gICAgICAgIGFjdG9yLnVwZGF0ZSh0aGlzLCBlbGFwc2VkVGltZSk7XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG4gIH1cblxuICB0aWNrKGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKHRoaXMuaW1hZ2VzTG9hZGVkKSB7XG4gICAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgdGhpcy5pbml0aWFsaXplKGVsYXBzZWRUaW1lKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZHJhdyhlbGFwc2VkVGltZSk7XG4gICAgICB0aGlzLnVwZGF0ZShlbGFwc2VkVGltZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZHJhd0xvYWRpbmcoKTtcbiAgICB9XG4gIH1cblxuICBvbktleURvd24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBrZXkgPSBldmVudC5rZXlDb2RlO1xuICAgIGlmICh0aGlzLmtleU5hbWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHRoaXMua2V5RG93blt0aGlzLmtleU5hbWVzW2tleV1dID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBvbktleVVwKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZTtcbiAgICBpZiAodGhpcy5rZXlOYW1lcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB0aGlzLmtleURvd25bdGhpcy5rZXlOYW1lc1trZXldXSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIG9uTW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgdGhpcy5tb3VzZS54ID0gZXZlbnQucGFnZVggLSB0aGlzLmNhbnZhcy5vZmZzZXRMZWZ0O1xuICAgIHRoaXMubW91c2UueSA9IGV2ZW50LnBhZ2VZIC0gdGhpcy5jYW52YXMub2Zmc2V0VG9wO1xuICB9XG5cbiAgb25SZXNpemUoZXZlbnQpIHtcbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB9XG5cbiAgc2V0Rm9jdXMoZXZlbnQsIGlzQmx1cnJlZCkge1xuICAgIGlmICh0aGlzLmRlYnVnTW9kZSAmJiBpc0JsdXJyZWQpIHtcbiAgICAgIHRoaXMuZnJhbWVzUGVyU2Vjb25kID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mcmFtZXNQZXJTZWNvbmQgPSAzMDtcbiAgICB9XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQge1BoeXNpY3MsIEJveCwgUG9pbnQsIEVQU0lMT04sIERFR19UT19SQUR9IGZyb20gJy4vcGh5c2ljcyc7XG5leHBvcnQge0tleXN9IGZyb20gJy4va2V5cyc7XG5leHBvcnQge0dhbWV9IGZyb20gJy4vZ2FtZSc7XG5leHBvcnQge0FjdG9yLCBEaXJlY3Rpb25zfSBmcm9tICcuL2FjdG9yJztcbiIsIi8qIGpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNvbnN0IEtleXMgPSB7XG4gIFVQOiAzOCxcbiAgRE9XTjogNDAsXG4gIExFRlQ6IDM3LFxuICBSSUdIVDogMzksXG4gIFc6IDg3LFxuICBBOiA2NSxcbiAgUzogODMsXG4gIEQ6IDY4LFxuICBTUEFDRTogMzJcbn07XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNsYXNzIEJveCB7XG4gIGNvbnN0cnVjdG9yKHgsIHksIHcsIGgpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy53ID0gdztcbiAgICB0aGlzLmggPSBoO1xuICB9XG5cbiAgaW5mbGF0ZShwYWRkaW5nWCwgcGFkZGluZ1kpIHtcbiAgICByZXR1cm4gbmV3IEJveChcbiAgICAgIHRoaXMueCAtIHBhZGRpbmdYIC8gMixcbiAgICAgIHRoaXMueSAtIHBhZGRpbmdZIC8gMixcbiAgICAgIHRoaXMudyArIHBhZGRpbmdYLFxuICAgICAgdGhpcy5oICsgcGFkZGluZ1kpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQb2ludCB7XG4gIGNvbnN0cnVjdG9yKHgsIHkpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZQU1BvaW50IHtcbiAgY29uc3RydWN0b3IoeCwgeSwgZGVsdGEsIGFuZ2xlKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMuZGVsdGEgPSBkZWx0YTtcbiAgICB0aGlzLmFuZ2xlID0gYW5nbGU7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IEVQU0lMT04gPSAxIC8gMzI7XG5leHBvcnQgY29uc3QgREVHX1RPX1JBRCA9IE1hdGguUEkgLyAxODA7XG5leHBvcnQgY29uc3QgUkFEX1RPX0RFRyA9IDE4MCAvIE1hdGguUEk7XG5cbmV4cG9ydCBjbGFzcyBQaHlzaWNzIHtcbiAgY29uc3RydWN0b3IoZ2FtZSkge1xuICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gIH1cblxuICBkcmF3UG9pbnQoeCwgeSwgY29sb3IsIHNpemUpIHtcbiAgICBzaXplID0gc2l6ZSB8fCA0O1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZpbGxSZWN0KHggLSAoc2l6ZSAvIDIpLCB5IC0gKHNpemUgLyAyKSwgc2l6ZSwgc2l6ZSk7XG4gIH1cblxuICBkcmF3TGluZSh4MSwgeTEsIHgyLCB5MiwgY29sb3IpIHtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5tb3ZlVG8oeDEsIHkxKTtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkyKTtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LnN0cm9rZSgpO1xuICB9XG5cbiAgZHJhd1RleHQoeCwgeSwgdGV4dCwgY29sb3IpIHtcbiAgICBjb2xvciA9IGNvbG9yIHx8ICd3aGl0ZSc7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZm9udCA9ICcxNHB4IEFyaWFsJztcbiAgICB0aGlzLmdhbWUuY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5maWxsVGV4dCh0ZXh0LCB4LCB5KTtcbiAgfVxuXG4gIGRyYXdCb3goeCwgeSwgdywgaCwgY29sb3IpIHtcbiAgICBjb2xvciA9IGNvbG9yIHx8ICd3aGl0ZSc7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VSZWN0KHgsIHksIHcsIGgpO1xuICB9XG5cbiAgZ2V0RGVsdGEoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICByZXR1cm4ge3g6IHgyIC0geDEsIHk6IHkyIC0geTF9O1xuICB9XG5cbi8vIGRpc3RhbmNlID0gc3FyKCh4MS14MileMiArICh5MS15MileMilcbiAgZ2V0RGlzdGFuY2Uoc3RhcnRQb2ludCwgZW5kUG9pbnQpIHtcbiAgICBsZXQgZGVsdGFYID0gc3RhcnRQb2ludC54IC0gZW5kUG9pbnQueDtcbiAgICBsZXQgZGVsdGFZID0gc3RhcnRQb2ludC55IC0gZW5kUG9pbnQueTtcbiAgICBsZXQgZGlzdGFuY2UgPSBNYXRoLnNxcnQoKGRlbHRhWCAqIGRlbHRhWCkgKyAoZGVsdGFZICogZGVsdGFZKSk7XG4gICAgaWYgKCFpc05hTihkaXN0YW5jZSkpIHtcbiAgICAgIHJldHVybiBkaXN0YW5jZTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdnZXI7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cblxuICBpbnRlcnNlY3RTZWdtZW50SW50b0JveChzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsIHBhZGRlZEJveCwgZGVidWcpIHtcbiAgICAvLyBkcmF3Qm94KHBhZGRlZEJveC54LCBwYWRkZWRCb3gueSwgcGFkZGVkQm94LncsIHBhZGRlZEJveC5oLCAnZ3JheScpO1xuICAgIHZhciBuZWFyWFBlcmNlbnQsIGZhclhQZXJjZW50O1xuICAgIGlmIChzZWdtZW50RGVsdGEueCA+PSAwKSB7XG4gICAgICAvLyBnb2luZyBsZWZ0IHRvIHJpZ2h0XG4gICAgICBuZWFyWFBlcmNlbnQgPSAocGFkZGVkQm94LnggLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gICAgICBmYXJYUGVyY2VudCA9ICgocGFkZGVkQm94LnggKyBwYWRkZWRCb3gudykgLVxuICAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy54KSAvIHNlZ21lbnREZWx0YS54O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBnb2luZyByaWdodCB0byBsZWZ0XG4gICAgICBuZWFyWFBlcmNlbnQgPSAoXG4gICAgICAgICgocGFkZGVkQm94LnggKyBwYWRkZWRCb3gudykgLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLngpO1xuICAgICAgZmFyWFBlcmNlbnQgPSAocGFkZGVkQm94LnggLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gICAgfVxuXG4gICAgdmFyIG5lYXJZUGVyY2VudCwgZmFyWVBlcmNlbnQ7XG4gICAgaWYgKHNlZ21lbnREZWx0YS55ID49IDApIHtcbiAgICAgIC8vIGdvaW5nIHRvcCB0byBib3R0b21cbiAgICAgIG5lYXJZUGVyY2VudCA9IChwYWRkZWRCb3gueSAtIHNlZ21lbnRQb3MueSkgLyBzZWdtZW50RGVsdGEueTtcbiAgICAgIGZhcllQZXJjZW50ID0gKChwYWRkZWRCb3gueSArIHBhZGRlZEJveC5oKSAtXG4gICAgICAgICAgICAgICAgICAgIHNlZ21lbnRQb3MueSkgLyBzZWdtZW50RGVsdGEueTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZ29pbmcgYm90dG9tIHRvIHRvcFxuICAgICAgbmVhcllQZXJjZW50ID0gKFxuICAgICAgICAoKHBhZGRlZEJveC55ICsgcGFkZGVkQm94LmgpIC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55KTtcbiAgICAgIGZhcllQZXJjZW50ID0gKHBhZGRlZEJveC55IC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgIH1cblxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgZnVydGhlciBvZiB0aGUgdHdvIG5lYXIgcGVyY2VudHNcbiAgICB2YXIgbmVhclBlcmNlbnQ7XG4gICAgaWYgKG5lYXJYUGVyY2VudCA+IG5lYXJZUGVyY2VudCkge1xuICAgICAgbmVhclBlcmNlbnQgPSBuZWFyWFBlcmNlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5lYXJQZXJjZW50ID0gbmVhcllQZXJjZW50O1xuICAgIH1cblxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmVhcmVzdCBvZiB0aGUgdHdvIGZhciBwZXJjZW50XG4gICAgdmFyIGZhclBlcmNlbnQ7XG4gICAgaWYgKGZhclhQZXJjZW50IDwgZmFyWVBlcmNlbnQpIHtcbiAgICAgIGZhclBlcmNlbnQgPSBmYXJYUGVyY2VudDtcbiAgICB9IGVsc2Uge1xuICAgICAgZmFyUGVyY2VudCA9IGZhcllQZXJjZW50O1xuICAgIH1cblxuICAgIHZhciBoaXQ7XG4gICAgaWYgKG5lYXJYUGVyY2VudCA+IGZhcllQZXJjZW50IHx8IG5lYXJZUGVyY2VudCA+IGZhclhQZXJjZW50KSB7XG4gICAgICAvLyBXaGVyZSB0aGUgc2VnbWVudCBoaXRzIHRoZSBsZWZ0IGVkZ2Ugb2YgdGhlIGJveCwgaGFzIHRvIGJlIGJldHdlZW5cbiAgICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBvZiB0aGUgYm94LiBPdGhlcndpc2UsIHRoZSBzZWdtZW50IGlzXG4gICAgICAvLyBwYXNzaW5nIHRoZSBib3ggdmVydGljYWxseSBiZWZvcmUgaXQgaGl0cyB0aGUgbGVmdCBzaWRlLlxuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChuZWFyUGVyY2VudCA+IDEpIHtcbiAgICAgIC8vIHRoZSBib3ggaXMgcGFzdCB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGZhclBlcmNlbnQgPCAwKSB7XG4gICAgICAvLyB0aGUgYm94IGlzIGJlZm9yZSB0aGUgc3RhcnQgb2YgdGhlIGxpbmVcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaXQgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciBoaXRQZXJjZW50ID0gbmVhclBlcmNlbnQ7XG4gICAgdmFyIGhpdE5vcm1hbCA9IHt9O1xuICAgIGlmIChuZWFyWFBlcmNlbnQgPiBuZWFyWVBlcmNlbnQpIHtcbiAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIGxlZnQgb3IgcmlnaHQgZWRnZVxuICAgICAgaWYgKHNlZ21lbnREZWx0YS54ID49IDApIHtcbiAgICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgbGVmdCBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC54ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSByaWdodCBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC54ID0gMTtcbiAgICAgIH1cbiAgICAgIGhpdE5vcm1hbC55ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgdG8gb3IgYm90dG9tIGVkZ2VcbiAgICAgIGhpdE5vcm1hbC54ID0gMDtcbiAgICAgIGlmIChzZWdtZW50RGVsdGEueSA+PSAwKSB7XG4gICAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIHRvcCBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC55ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSBib3R0b20gZWRnZVxuICAgICAgICBoaXROb3JtYWwueSA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChoaXRQZXJjZW50IDwgMCkge1xuICAgICAgaGl0UGVyY2VudCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGhpdFBvcyA9IHtcbiAgICAgIHg6IHNlZ21lbnRQb3MueCArIChzZWdtZW50RGVsdGEueCAqIGhpdFBlcmNlbnQpLFxuICAgICAgeTogc2VnbWVudFBvcy55ICsgKHNlZ21lbnREZWx0YS55ICogaGl0UGVyY2VudClcbiAgICB9O1xuXG4gICAgaGl0UG9zLnggKz0gaGl0Tm9ybWFsLnggKiBFUFNJTE9OO1xuICAgIGhpdFBvcy55ICs9IGhpdE5vcm1hbC55ICogRVBTSUxPTjtcblxuICAgIGxldCByZXN1bHQgPSAge1xuICAgICAgaGl0OiBoaXQsXG4gICAgICBoaXROb3JtYWw6IGhpdE5vcm1hbCxcbiAgICAgIGhpdFBlcmNlbnQ6IGhpdFBlcmNlbnQsXG4gICAgICBoaXRQb3M6IGhpdFBvcyxcbiAgICAgIG5lYXJQZXJjZW50OiBuZWFyUGVyY2VudCxcbiAgICAgIG5lYXJYUGVyY2VudDogbmVhclhQZXJjZW50LFxuICAgICAgbmVhcllQZXJjZW50OiBuZWFyWVBlcmNlbnQsXG4gICAgICBmYXJQZXJjZW50OiBmYXJQZXJjZW50LFxuICAgICAgZmFyWFBlcmNlbnQ6IGZhclhQZXJjZW50LFxuICAgICAgZmFyWVBlcmNlbnQ6IGZhcllQZXJjZW50LFxuICAgICAgaGl0Qm94OiBwYWRkZWRCb3hcbiAgICB9O1xuICAgIC8vIGlmIChkZWJ1Zykge1xuICAgIC8vICAgIGxldCBoaXRDb3VudGVyID0gMDtcbiAgICAvLyAgICBsZXQgaGl0Q29sb3JzID0gWycjZjAwJywgJyMwZjAnLCAnI2ZmMCcsICcjMGZmJywgJyNmMGYnLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgJyNmZmYnLCAnI2Y5MCddO1xuICAgIC8vICAgICB0aGlzLmRyYXdQb2ludChyZXN1bHQuaGl0UG9zLngsIHJlc3VsdC5oaXRQb3MueSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgaGl0Q29sb3JzW2hpdENvdW50ZXIgJSBoaXRDb2xvcnMubGVuZ3RoXSwgNCk7XG4gICAgLy8gICAgIHRoaXMuZHJhd0xpbmUoc2VnbWVudFBvcy54LCBzZWdtZW50UG9zLnksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy54ICsgc2VnbWVudERlbHRhLngsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy55ICsgc2VnbWVudERlbHRhLnksICcjMGZmJyk7XG4gICAgLy8gICAgIGhpdENvdW50ZXIgKz0gMTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHN3ZWVwQm94SW50b0JveChtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94KSB7XG4gICAgdmFyIHNlZ21lbnRQb3MgPSB7XG4gICAgICB4OiBtb3ZpbmdCb3gueCArIG1vdmluZ0JveC53IC8gMixcbiAgICAgIHk6IG1vdmluZ0JveC55ICsgbW92aW5nQm94LmggLyAyXG4gICAgfTtcblxuICAgIHZhciBwYWRkZWRCb3ggPSBuZXcgQm94KFxuICAgICAgc3RhdGljQm94LnggLSBtb3ZpbmdCb3gudyAvIDIsXG4gICAgICBzdGF0aWNCb3gueSAtIG1vdmluZ0JveC5oIC8gMixcbiAgICAgIHN0YXRpY0JveC53ICsgbW92aW5nQm94LncsXG4gICAgICBzdGF0aWNCb3guaCArIG1vdmluZ0JveC5oKTtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveChzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsXG4gICAgICBwYWRkZWRCb3gpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKHNlZ21lbnRQb3MsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94ZXMsIGRlYnVnKSB7XG4gICAgbGV0IGhpdENvdW50ZXIgPSAwO1xuICAgIGxldCBoaXRDb2xvcnMgPSBbJyNmMDAnLCAnIzBmMCcsICcjZmYwJywgJyMwZmYnLCAnI2YwZicsICcjZmZmJywgJyNmOTAnXTtcbiAgICB2YXIgbmVhcmVzdFJlc3VsdCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gc3RhdGljQm94ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgdmFyIHN0YXRpY0JveCA9IHN0YXRpY0JveGVzW2ldO1xuICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuaW50ZXJzZWN0U2VnbWVudEludG9Cb3goc2VnbWVudFBvcywgc2VnbWVudERlbHRhLFxuICAgICAgICBzdGF0aWNCb3gpO1xuICAgICAgaWYgKHJlc3VsdC5oaXQpIHtcbiAgICAgICAgaWYgKGRlYnVnKSB7XG4gICAgICAgICAgdGhpcy5kcmF3UG9pbnQocmVzdWx0LmhpdFBvcy54LCByZXN1bHQuaGl0UG9zLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgaGl0Q29sb3JzW2hpdENvdW50ZXIgJSBoaXRDb2xvcnMubGVuZ3RoXSwgNCk7XG4gICAgICAgICAgdGhpcy5kcmF3TGluZShzZWdtZW50UG9zLngsIHNlZ21lbnRQb3MueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnRQb3MueCArIHNlZ21lbnREZWx0YS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy55ICsgc2VnbWVudERlbHRhLnksICcjMGZmJyk7XG4gICAgICAgICAgaGl0Q291bnRlciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmVhcmVzdFJlc3VsdCB8fCByZXN1bHQuaGl0UGVyY2VudCA8IG5lYXJlc3RSZXN1bHQuaGl0UGVyY2VudCkge1xuICAgICAgICAgIG5lYXJlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5lYXJlc3RSZXN1bHQ7XG4gIH1cblxuICAvLyBTd2VlcCBtb3ZpbmdCb3gsIGFsb25nIHRoZSBtb3ZlbWVudCBkZXNjcmliZWQgYnkgc2VnbWVudERlbHRhLCBpbnRvIGVhY2hcbiAgLy8gYm94IGluIHRoZSBsaXN0IG9mIHN0YXRpY0JveGVzLiBSZXR1cm4gYSByZXN1bHQgb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGZpcnN0XG4gIC8vIHN0YXRpYyBib3ggdGhhdCBtb3ZpbmdCb3ggaGl0cywgb3IgbnVsbC5cbiAgc3dlZXBCb3hJbnRvQm94ZXMobW92aW5nQm94LCBzZWdtZW50RGVsdGEsIHN0YXRpY0JveGVzKSB7XG4gICAgdmFyIG5lYXJlc3RSZXN1bHQgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IHN0YXRpY0JveGVzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIHZhciBzdGF0aWNCb3ggPSBzdGF0aWNCb3hlc1tpXTtcbiAgICAgIHZhciByZXN1bHQgPSB0aGlzLnN3ZWVwQm94SW50b0JveChtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94KTtcbiAgICAgIGlmIChyZXN1bHQuaGl0KSB7XG4gICAgICAgIGlmICghbmVhcmVzdFJlc3VsdCB8fCByZXN1bHQuaGl0UGVyY2VudCA8IG5lYXJlc3RSZXN1bHQuaGl0UGVyY2VudCkge1xuICAgICAgICAgIG5lYXJlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5lYXJlc3RSZXN1bHQ7XG4gIH1cblxuICBnZXRGaXJzdENvbGxpc2lvbihzdGFydFBvcywgY2VsbFNpemUsIGRlbHRhLCBjYWxsYmFjaykge1xuICAgIGxldCBkaXIgPSB7fSwgZW5kUG9zID0ge30sIGNlbGwgPSB7fSwgdGltZVN0ZXAgPSB7fSwgdGltZSA9IHt9O1xuICAgIGxldCBkaXJzID0gWyd4JywgJ3knXTtcbiAgICBsZXQgZmlyc3RFZGdlID0ge307XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgbGV0IGsgPSBkaXJzW2ldO1xuICAgICAgZGlyW2tdID0gZGVsdGFba10gPCAwID8gLTEgOiAxO1xuICAgICAgZW5kUG9zW2tdID0gc3RhcnRQb3Nba10gKyBkZWx0YVtrXTtcbiAgICAgIGNlbGxba10gPSBNYXRoLmZsb29yKHN0YXJ0UG9zW2tdIC8gY2VsbFNpemUpO1xuICAgICAgdGltZVN0ZXBba10gPSAoY2VsbFNpemUgKiBkaXJba10pIC8gZGVsdGFba107XG4gICAgICBpZiAoZGlyW2tdID09PSAwKSB7XG4gICAgICAgIHRpbWVba10gPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmlyc3RFZGdlW2tdID0gY2VsbFtrXSAqIGNlbGxTaXplO1xuICAgICAgICBpZiAoZGlyW2tdID4gMCkge1xuICAgICAgICAgIGZpcnN0RWRnZVtrXSArPSBjZWxsU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICB0aW1lW2tdID0gKGZpcnN0RWRnZVtrXSAtIHN0YXJ0UG9zW2tdKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVtrXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3aGlsZSAodGltZS54IDwgMSB8fCB0aW1lLnkgPCAxKSB7XG4gICAgICBpZiAodGltZS54IDwgdGltZS55KSB7XG4gICAgICAgIHRpbWUueCArPSB0aW1lU3RlcC54O1xuICAgICAgICBjZWxsLnggKz0gZGlyLng7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjZWxsLnkgKz0gZGlyLnk7XG4gICAgICAgIHRpbWUueSArPSB0aW1lU3RlcC55O1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxiYWNrKGNlbGwueCwgY2VsbC55KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3dlZXBTY2FuKGdhbWUsIGluaXRpYWxFbmRwb2ludCwgc3RhcnRQb2ludCwgc3dlZXBDb3VudCwgc3dlZXBBbmdsZSwgY2VsbFNpemUsIGNvbnRleHQpIHtcbiAgICAvLyBsZXQgZGVncmVlVG9DdXJFbmRQb2ludDtcbiAgICBsZXQgcG9pbnRBcnJheSA9IFtdO1xuICAgIGxldCBpbml0aWFsRGVsdGEgPSB0aGlzLmdldERlbHRhKGluaXRpYWxFbmRwb2ludC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxFbmRwb2ludC55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0UG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFBvaW50LnkpO1xuICAgIGxldCBkZWdUb0luaXRpYWxFbmRwb3MgPSB0aGlzLmdldFRhcmdldERlZ3JlZShpbml0aWFsRGVsdGEpO1xuICAgIGxldCBkZWdyZWVUb1N0YXJ0U3dlZXAgPSBkZWdUb0luaXRpYWxFbmRwb3MgKyAoc3dlZXBBbmdsZSAvIDIpO1xuICAgIC8vIGxldCBkZWdyZWVUb0VuZFN3ZWVwID0gZGVnVG9Jbml0aWFsRW5kcG9zIC0gc3dlZXBBbmdsZTtcbiAgICAvLyBpbml0aWFsRGVsdGEgPSB0aGlzLmRlZ1RvUG9zKGRlZ3JlZVRvU3RhcnRTd2VlcCwgY29udGV4dC5sYXNlclJhbmdlKTtcblxuICAgIC8vIGxldCBlbmRpbmdFbmRQb3M7XG4gICAgbGV0IHJheUFuZ2xlU3RlcCA9IHN3ZWVwQW5nbGUgLyBzd2VlcENvdW50O1xuICAgIC8vIGRlZ3JlZVRvQ3VyRW5kUG9pbnQgPSBkZWdyZWVUb1N0YXJ0U3dlZXA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN3ZWVwQ291bnQ7IGkrKykge1xuICAgICAgbGV0IHJheUFuZ2xlID0gZGVncmVlVG9TdGFydFN3ZWVwIC0gcmF5QW5nbGVTdGVwICogaTtcbiAgICAgIC8vIGxldCB4eHggPSBkZWdyZWVUb0N1ckVuZFBvaW50ID09IGRlZ3JlZVRvU3RhcnRTd2VlcDtcbiAgICAgIGxldCBlbmRpbmdEZWx0YSA9IHRoaXMuZGVnVG9Qb3MocmF5QW5nbGUsIGNvbnRleHQubGFzZXJSYW5nZSk7XG4gICAgICB0aGlzLmdldEZpcnN0Q29sbGlzaW9uKHN0YXJ0UG9pbnQsIGNlbGxTaXplLCBlbmRpbmdEZWx0YSxcbiAgICAgICAgKGNlbGx4LCBjZWxseSkgPT4ge1xuICAgICAgICAgIGxldCBncmlkUG9zID0gKGNlbGx5ICogZ2FtZS5jb2xzKSArIGNlbGx4O1xuICAgICAgICAgIGxldCBibG9jayA9IGdhbWUuc3RhdGljR3JpZFtncmlkUG9zXTtcbiAgICAgICAgICBpZiAoYmxvY2spIHtcbiAgICAgICAgICAgIGxldCBlbmRpbmdSZXN1bHQgPSB0aGlzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94KFxuICAgICAgICAgICAgICBzdGFydFBvaW50LCBlbmRpbmdEZWx0YSwgYmxvY2spO1xuICAgICAgICAgICAgaWYgKGVuZGluZ1Jlc3VsdCAmJiBlbmRpbmdSZXN1bHQuaGl0KSB7XG4gICAgICAgICAgICAgIGxldCBlbmRpbmdFbmRQb3MgPSBuZXcgRlBTUG9pbnQoXG4gICAgICAgICAgICAgICAgZW5kaW5nUmVzdWx0LmhpdFBvcy54LCBlbmRpbmdSZXN1bHQuaGl0UG9zLnksXG4gICAgICAgICAgICAgICAgdGhpcy5nZXREaXN0YW5jZShzdGFydFBvaW50LCBlbmRpbmdSZXN1bHQuaGl0UG9zKSxcbiAgICAgICAgICAgICAgICAoLXN3ZWVwQW5nbGUgLyAyKSArIChyYXlBbmdsZVN0ZXAgKiBpKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHBvaW50QXJyYXkucHVzaChlbmRpbmdFbmRQb3MpO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9fVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHBvaW50QXJyYXk7XG4gIH1cblxuICBjaGVja05lYXJlc3RIaXQoc291cmNlQWN0b3IsIHN0YXRpY1Jlc3VsdCwgdGFyZ2V0UmVzdWx0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBzb3VyY2VYID0gc291cmNlQWN0b3IuY3VyWDtcbiAgICB2YXIgc3RhdGljWCA9IHN0YXRpY1Jlc3VsdC5oaXRQb3MueDtcbiAgICB2YXIgdGFyZ2V0WCA9IHRhcmdldFJlc3VsdC5oaXRQb3MueDtcbiAgICB2YXIgc291cmNlWSA9IHNvdXJjZUFjdG9yLmN1clk7XG4gICAgdmFyIHN0YXRpY1kgPSBzdGF0aWNSZXN1bHQuaGl0UG9zLnk7XG4gICAgdmFyIHRhcmdldFkgPSB0YXJnZXRSZXN1bHQuaGl0UG9zLnk7XG5cbiAgICBpZiAoc291cmNlQWN0b3IuZGlyWCA9PT0gLTEgfHwgc291cmNlQWN0b3IuZGlyWCA9PT0gMSkge1xuICAgICAgaWYgKE1hdGguYWJzKHNvdXJjZVggLSBzdGF0aWNYKSA8IE1hdGguYWJzKHNvdXJjZVggLSB0YXJnZXRYKSkge1xuICAgICAgICByZXN1bHQudGFyZ2V0SGl0ID0gZmFsc2U7XG4gICAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgc3RhdGljUmVzdWx0LmhpdFBvcy54LCBzdGF0aWNSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LmVuZFBvcyA9IG5ldyBQb2ludChcbiAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0UG9zLngsIHRhcmdldFJlc3VsdC5oaXRQb3MueSk7XG4gICAgICAgIHJlc3VsdC50YXJnZXRIaXQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc291cmNlQWN0b3IuZGlyWSA9PT0gLTEgfHwgc291cmNlQWN0b3IuZGlyWSA9PT0gMSkge1xuICAgICAgaWYgKE1hdGguYWJzKHNvdXJjZVkgLSBzdGF0aWNZKSA8IE1hdGguYWJzKHNvdXJjZVkgLSB0YXJnZXRZKSkge1xuICAgICAgICByZXN1bHQudGFyZ2V0SGl0ID0gZmFsc2U7XG4gICAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgc3RhdGljUmVzdWx0LmhpdFBvcy54LCBzdGF0aWNSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LmVuZFBvcyA9IG5ldyBQb2ludChcbiAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0UG9zLngsIHRhcmdldFJlc3VsdC5oaXRQb3MueSk7XG4gICAgICAgIHJlc3VsdC50YXJnZXRIaXQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0VGFyZ2V0RGVncmVlKGRlbHRhKSB7XG4gICAgdmFyIHRoZXRhID0gTWF0aC5hdGFuMihkZWx0YS54LCBkZWx0YS55KTtcbiAgICB2YXIgZGVncmVlID0gdGhldGEgKiBSQURfVE9fREVHO1xuICAgIGlmICh0aGV0YSA8IDApIHtcbiAgICAgIGRlZ3JlZSArPSAzNjA7XG4gICAgfVxuICAgIHJldHVybiBkZWdyZWU7XG4gIH1cblxuICBkZWdUb1BvcyhkZWdyZWUsIHJhZGl1cykge1xuICAgIHZhciByYWRpYW4gPSBkZWdyZWUgKiBERUdfVE9fUkFEO1xuICAgIHZhciByZXN1bHQgPSB7XG4gICAgICB4OiByYWRpdXMgKiBNYXRoLnNpbihyYWRpYW4pLFxuICAgICAgeTogcmFkaXVzICogTWF0aC5jb3MocmFkaWFuKVxuICAgIH07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7QWN0b3J9IGZyb20gJy4vYmVyemVyayc7XG5cbmV4cG9ydCBjbGFzcyBCdWxsZXQgZXh0ZW5kcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKHN0YXJ0WCwgc3RhcnRZLCBzcGVlZCwgZGlyWCwgZGlyWSkge1xuICAgIHZhciBpbWFnZSA9IHt3OiA1LCBoOiA1fTtcbiAgICBzdXBlcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIDEwMCwgc3BlZWQsIHNwZWVkLCBkaXJYLCBkaXJZKTtcbiAgICB0aGlzLmRlYXRoVGltZXIgPSAwO1xuICAgIHRoaXMuaGVhZExhbXBBY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuaGVhZExhbXBBbmdsZSA9IDE4MDtcbiAgICB0aGlzLmhlYWRMYW1wUG93ZXIgPSAyODA7XG4gIH1cblxuICBkcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgZ2FtZS5jb250ZXh0RlguZmlsbFN0eWxlID0gJyNGRkYnO1xuICAgIGdhbWUuY29udGV4dEZYLmZpbGxSZWN0KHRoaXMuY3VyWCwgdGhpcy5jdXJZLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gIH1cblxuICB1cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBzdXBlci51cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIHRoaXMuZGVhdGhUaW1lciArPSBlbGFwc2VkVGltZTtcbiAgICBpZiAodGhpcy5kZWF0aFRpbWVyID49IDEpIHtcbiAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0Jztcblxud2luZG93LkRlYXRoYm90ID0gZXhwb3J0cztcbmV4cG9ydCB7R2FtZX0gZnJvbSAnLi9nYW1lJztcbmV4cG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5leHBvcnQge01vbnN0ZXJ9IGZyb20gJy4vbW9uc3Rlcic7XG5leHBvcnQge0J1bGxldH0gZnJvbSAnLi9idWxsZXQnO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgLy8gVGhlIERlYXRoYm90IHByb3BlcnRpZXMgd2lsbCBiZSBmaWxsZWQgaW4gYnkgdGhlIG90aGVyIHNjcmlwdHMuIEV2ZW5cbiAgLy8gdGhvdWdoIHRoZXkgZG9uJ3QgbG9vayBsaWtlIHRoZXkgZXhpc3QgYXQgdGhpcyBwb2ludCwgdGhleSB3aWxsIGJ5IHRoZVxuICAvLyB0aW1lIHRoZSB3aW5kb3cgbG9hZCBldmVudCBoYXMgZmlyZWQuXG5cbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWF0aGJvdCcpO1xuICB2YXIgY2FudmFzQkcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYmFja2dyb3VuZCcpO1xuICB2YXIgY2FudmFzRlBTID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2ZwcycpO1xuICB2YXIgZ2FtZSA9IHdpbmRvdy5kZWF0aGJvdEdhbWUgPSBuZXcgZXhwb3J0cy5HYW1lKFxuICAgIGNhbnZhcywgY2FudmFzQkcsIGNhbnZhc0ZQUywgJyMxMTEnKTtcbiAgZ2FtZS5sb2FkSW1hZ2VzKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uS2V5RG93bihldmVudCk7XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChldmVudCkgPT4ge1xuICAgIGdhbWUub25LZXlVcChldmVudCk7XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uTW91c2VNb3ZlKGV2ZW50KTtcbiAgfSk7XG5cbiAgdmFyIGJsdXJyZWQgPSBmYWxzZTtcbiAgdmFyIHNldEZvY3VzID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ2JsdXInKSB7XG4gICAgICAgIGJsdXJyZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChldmVudC50eXBlID09PSAnZm9jdXMnKSB7XG4gICAgICAgIGJsdXJyZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZ2FtZS5zZXRGb2N1cyhldmVudCwgZG9jdW1lbnQuaGlkZGVuIHx8IGJsdXJyZWQpO1xuICB9O1xuICBzZXRGb2N1cygpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHNldEZvY3VzLCB0cnVlKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgc2V0Rm9jdXMsIHRydWUpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHNldEZvY3VzLCB0cnVlKTtcblxuICB2YXIgcmVzaXplVGltZW91dDtcbiAgd2luZG93Lm9ucmVzaXplID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKHJlc2l6ZVRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgIHJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgICAgZ2FtZS5vblJlc2l6ZShldmVudCk7XG4gICAgfSwgMTAwMCk7XG4gIH07XG5cbiAgdmFyIG9sZEZyYW1lVGltZSA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDApO1xuICB2YXIgdGljayA9ICgpID0+IHtcbiAgICB2YXIgbmV3RnJhbWVUaW1lID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCk7XG4gICAgdmFyIGVsYXBzZWRUaW1lID0gbmV3RnJhbWVUaW1lIC0gb2xkRnJhbWVUaW1lO1xuICAgIG9sZEZyYW1lVGltZSA9IG5ld0ZyYW1lVGltZTtcbiAgICBnYW1lLnRpY2soZWxhcHNlZFRpbWUpO1xuICAgIHNldFRpbWVvdXQodGljaywgTWF0aC5mbG9vcigxMDAwIC8gZ2FtZS5mcmFtZXNQZXJTZWNvbmQpKTtcbiAgfTtcbiAgdGljaygpO1xufSk7XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbi8qZ2xvYmFscyBTUzpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge0dhbWUgYXMgQmVyemVya0dhbWUsIEtleXMsIFBoeXNpY3MsIEJveCwgRVBTSUxPTn0gZnJvbSAnLi9iZXJ6ZXJrJztcbmltcG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge01vbnN0ZXJ9IGZyb20gJy4vbW9uc3Rlcic7XG5cbmNvbnN0IERFQlVHX1RJTEUgPSA5O1xuZXhwb3J0IGNvbnN0IExFVkVMUyA9IFtcbiAge1xuICAgIGNvbHM6IDI4LFxuICAgIHJvd3M6IDI4LFxuICAgIGdyaWQ6IFtcbiAgICAgIDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsXG4gICAgICAxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMSwxLDEsXG4gICAgICAxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwxLFxuICAgICAgMSwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDEsMSwxLDEsMSwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLFxuICAgIF1cbiAgfVxuXTtcblxuY29uc3QgQ0hBUkFDVEVSUyA9IFtcbiAge1xuICAgIG5hbWU6ICdkZWF0aGJvdCcsXG4gICAgaW1hZ2U6ICdpbWcvZGVhdGhib3QucG5nJyxcbiAgICBpbWFnZVVwOiAnaW1nL2RlYXRoYm90X3VwLnBuZycsXG4gICAgaW1hZ2VEb3duOiAnaW1nL2RlYXRoYm90X2Rvd24ucG5nJyxcbiAgICB3OiA0MCxcbiAgICBoOiA1MlxuICB9LFxuICB7XG4gICAgbmFtZTogJ3BsYXllcicsXG4gICAgaW1hZ2U6ICdpbWcvcGxheWVyLnBuZycsXG4gICAgdzogMjgsXG4gICAgaDogNTJcbiAgfVxuXTtcblxuZXhwb3J0IGNsYXNzIEdhbWUgZXh0ZW5kcyBCZXJ6ZXJrR2FtZSB7XG4gIGNvbnN0cnVjdG9yKGNhbnZhcywgY2FudmFzQkcsIGNhbnZhc0ZQUywgZmlsbFN0eWxlKSB7XG4gICAgc3VwZXIoY2FudmFzKTtcbiAgICB0aGlzLnBsYXllckRlYXRoTWV0aG9kID0gJyc7XG4gICAgdGhpcy5nYW1lU3RhdGUgPSAnYXR0cmFjdCc7IC8vIGF0dHJhY3QsIHBsYXksIGRlYWRcbiAgICB0aGlzLnNjb3JlID0gMDtcbiAgICB0aGlzLnJvdW5kID0gMjtcbiAgICB0aGlzLm51bU9mTW9uc3RlcnMgPSAwO1xuICAgIHRoaXMuY2VsbFdpZHRoID0gMzI7XG4gICAgdGhpcy5jZWxsSGVpZ2h0ID0gMzI7XG4gICAgdGhpcy50aWxlcyA9IG51bGw7XG4gICAgdGhpcy5jb2xzID0gTEVWRUxTWzBdLmNvbHM7XG4gICAgdGhpcy5yb3dzID0gTEVWRUxTWzBdLnJvd3M7XG4gICAgdGhpcy5ncmlkID0gTEVWRUxTWzBdLmdyaWQ7XG4gICAgdGhpcy5zcGF3bkdyaWQgPSBbXTtcbiAgICB0aGlzLnN0YXRpY0Jsb2NrcyA9IFtdO1xuICAgIHRoaXMuc3RhdGljR3JpZCA9IFtdO1xuICAgIHRoaXMuZmlsbFN0eWxlID0gZmlsbFN0eWxlO1xuICAgIHRoaXMuY2FudmFzQkcgPSBjYW52YXNCRztcbiAgICB0aGlzLmNhbnZhc0JHLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXNCRy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jb250ZXh0QkcgPSB0aGlzLmNhbnZhc0JHLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB0aGlzLmNhbnZhc0ZYID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Z4Jyk7XG4gICAgdGhpcy5jYW52YXNGWC53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzRlguaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGV4dEZYID0gdGhpcy5jYW52YXNGWC5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdGhpcy5jYW52YXNGUFMgPSBjYW52YXNGUFM7XG4gICAgdGhpcy5jYW52YXNGUFMud2lkdGggPSA0ODA7XG4gICAgdGhpcy5jYW52YXNGUFMuaGVpZ2h0ID0gMjQwO1xuICAgIHRoaXMuY29udGV4dEZQUyA9IHRoaXMuY2FudmFzRlBTLmdldENvbnRleHQoJzJkJyk7XG4gICAgLy8gdGhpcy5jb250ZXh0RlguZmlsbFN0eWxlID0gJ3JnYmEoMCwgMCwgMCwgLjUwKSc7XG4gICAgLy8gdGhpcy5jb250ZXh0RlguZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNGWC53aWR0aCwgdGhpcy5jYW52YXNGWC5oZWlnaHQpO1xuICAgIHRoaXMubWVzc2FnZVRpbWUgPSAxMDtcblxuICAgIHRoaXMuZGVmaW5lS2V5KCdzdGFydCcsIEtleXMuU1BBQ0UpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCd1cCcsIEtleXMuVVApO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdkb3duJywgS2V5cy5ET1dOKTtcbiAgICB0aGlzLmRlZmluZUtleSgnbGVmdCcsIEtleXMuTEVGVCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3JpZ2h0JywgS2V5cy5SSUdIVCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3Nob290VXAnLCBLZXlzLlcpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdExlZnQnLCBLZXlzLkEpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdERvd24nLCBLZXlzLlMpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdFJpZ2h0JywgS2V5cy5EKTtcbiAgfVxuXG4gIGNyZWF0ZVNwYXduUG9pbnRzKGFjdG9yV2lkdGgsIGFjdG9ySGVpZ2h0KSB7XG4gICAgbGV0IHNwYXduTG9jYXRpb25zID0gW107XG4gICAgbGV0IHNwYXduR3JpZCA9IHRoaXMuZ3JpZC5zbGljZSgwKTtcblxuICAgIGxldCBhY3RvckJsb2NrID0ge1xuICAgICAgdzogTWF0aC5jZWlsKGFjdG9yV2lkdGggLyB0aGlzLmNlbGxXaWR0aCksXG4gICAgICBoOiBNYXRoLmNlaWwoYWN0b3JIZWlnaHQgLyB0aGlzLmNlbGxIZWlnaHQpXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSB0aGlzLmdyaWQubGVuZ3RoOyBpIDwgbGk7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZ3JpZFtpXSA9PT0gMCkge1xuICAgICAgICBsZXQgbnVtT2ZTcGFjZXNOZWVkZWQgPSBhY3RvckJsb2NrLncgKiBhY3RvckJsb2NrLmg7XG4gICAgICAgIGxldCBudW1PZkVtcHR5U3BhY2VzID0gMDtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgYWN0b3JCbG9jay53OyByb3crKykge1xuICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IGFjdG9yQmxvY2suaDsgY29sKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJDb2wgPSAoaSAlIHRoaXMuY29scykgKyByb3c7XG4gICAgICAgICAgICBsZXQgY3VyUm93ID0gTWF0aC5mbG9vcihpIC8gdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IChjdXJSb3cgKiB0aGlzLmNvbHMpICsgY3VyQ29sO1xuICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFtpbmRleF0gPT09IDApIHtcbiAgICAgICAgICAgICAgbnVtT2ZFbXB0eVNwYWNlcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobnVtT2ZFbXB0eVNwYWNlcyA9PT0gbnVtT2ZTcGFjZXNOZWVkZWQpIHtcbiAgICAgICAgICBzcGF3bkxvY2F0aW9ucy5wdXNoKGkpO1xuICAgICAgICAgIHNwYXduR3JpZFtpXSA9IERFQlVHX1RJTEU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zcGF3bkdyaWQgPSBzcGF3bkdyaWQ7XG4gICAgcmV0dXJuIHNwYXduTG9jYXRpb25zO1xuICB9XG5cbiAgcmFuZG9taXplU3Bhd25zKCkge1xuICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoIShhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFjdG9yLnNwYXduUG9pbnRzID0gdGhpcy5jcmVhdGVTcGF3blBvaW50cyhhY3Rvci53aWR0aCwgYWN0b3IuaGVpZ2h0KTtcbiAgICAgIGxldCBzcGF3bkluZGV4ID0gYWN0b3Iuc3Bhd25Qb2ludHNbXG4gICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhY3Rvci5zcGF3blBvaW50cy5sZW5ndGgpXTtcbiAgICAgIGxldCBzcGF3blhZID0gdGhpcy5jYWxjR3JpZFhZKHNwYXduSW5kZXgpO1xuICAgICAgYWN0b3IuY3VyWCA9IHNwYXduWFkueDEgKyBFUFNJTE9OO1xuICAgICAgYWN0b3IuY3VyWSA9IHNwYXduWFkueTEgKyBFUFNJTE9OO1xuICAgIH0sdGhpcyk7XG4gIH1cblxuICBjYWxjR3JpZFhZKGdyaWRJbmRleCkge1xuICAgIGxldCBjdXJSb3csIGN1ckNvbCwgZ3JpZFgxLCBncmlkWDIsIGdyaWRZMSwgZ3JpZFkyO1xuICAgIGxldCByZXN1bHQgPSB7eDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDB9O1xuICAgIGN1ckNvbCA9IGdyaWRJbmRleCAlIHRoaXMuY29scztcbiAgICBjdXJSb3cgPSBNYXRoLmZsb29yKGdyaWRJbmRleCAvIHRoaXMuY29scyk7XG4gICAgZ3JpZFgxID0gY3VyQ29sICogdGhpcy5jZWxsV2lkdGg7XG4gICAgZ3JpZFkxID0gY3VyUm93ICogdGhpcy5jZWxsSGVpZ2h0O1xuICAgIGdyaWRYMiA9IGdyaWRYMSArIHRoaXMuY2VsbFdpZHRoO1xuICAgIGdyaWRZMiA9IGdyaWRZMSArIHRoaXMuY2VsbEhlaWdodDtcbiAgICByZXN1bHQgPSB7eDE6IGdyaWRYMSwgeTE6IGdyaWRZMSwgeDI6IGdyaWRYMiwgeTI6IGdyaWRZMn07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIExvb3BzIHRocm91Z2ggQWN0b3IgYXJyYXkgYW5kIGNyZWF0ZXMgY2FsbGFibGUgaW1hZ2VzLlxuICBsb2FkSW1hZ2VzKCkge1xuICAgIHN1cGVyLmxvYWRJbWFnZXMoQ0hBUkFDVEVSUyxcbiAgICAgIHt0aWxlczogJ2ltZy90aWxlcy5wbmcnfSk7XG4gIH1cblxuICBlYWNoQWN0b3IoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBmb3IgKGxldCBjIGluIHRoaXMuYWN0b3JzKSB7XG4gICAgICBpZiAodGhpcy5hY3RvcnMuaGFzT3duUHJvcGVydHkoYykpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmFjdG9yc1tjXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLmluaXRpYWxpemUoZWxhcHNlZFRpbWUpO1xuXG4gICAgdGhpcy5kcmF3QmFja2dyb3VuZChlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5zdGF0aWNCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnN0YXRpY0dyaWQgPSBbXTtcbiAgICB0aGlzLnBoeXNpY3MgPSBuZXcgUGh5c2ljcyh0aGlzKTtcbiAgICB0aGlzLmFjdG9ycyA9IHtcbiAgICAgIC8vaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpcllcbiAgICAgIHBsYXllcjogbmV3IFBsYXllcihcbiAgICAgICAgdGhpcy5pbWFnZXMucGxheWVyLCA4NSwgNDU0LCAxMDAsIDE1MCwgMTUwLCAxLCAxKSxcbiAgICAgIGRlYXRoYm90MTogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCAyNTAsIDUwMCwgMTAwLCAxMDAsIDEwMCwgLTEsIDEpLFxuICAgICAgZGVhdGhib3QzOiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDEyMCwgMTEwLCAzMDAsIDExMCwgMTE1LCAxLCAxKSxcbiAgICAgIGRlYXRoYm90NDogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCAzMDAsIDIwMCwgMTAwLCAyMDAsIDIwMCwgLTEsIC0xKSxcbiAgICAgIGRlYXRoYm90NTogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCA1MDAsIDQwMCwgMTAwLCAyMDAsIDIwMCwgMSwgMSlcbiAgICB9O1xuXG4gICAgdGhpcy5udW1PZk1vbnN0ZXJzID0gMDtcbiAgICB0aGlzLnBsYXllckRlYXRoTWV0aG9kID0gJyc7XG4gICAgdGhpcy5yb3VuZCA9IDI7XG4gICAgdGhpcy5zY29yZSA9IDA7XG5cbiAgICB0aGlzLmVhY2hBY3RvcigoYWN0b3IpID0+IHtcbiAgICAgIGlmIChhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpIHtcbiAgICAgICAgdGhpcy5udW1PZk1vbnN0ZXJzKys7XG4gICAgICB9XG4gICAgICBhY3Rvci5hY3RpdmUgPSB0cnVlO1xuICAgICAgYWN0b3IuaGVhbHRoID0gMTAwO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxpID0gdGhpcy5ncmlkLmxlbmd0aDsgbGkgPiBpOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmdyaWRbaV0pIHtcbiAgICAgICAgbGV0IGJsb2NrWFkgPSB0aGlzLmNhbGNHcmlkWFkoaSk7XG4gICAgICAgIGxldCBibG9jayA9IG5ldyBCb3goXG4gICAgICAgICAgYmxvY2tYWS54MSwgYmxvY2tYWS55MSwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCk7XG4gICAgICAgIHRoaXMuc3RhdGljQmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgICB0aGlzLnN0YXRpY0dyaWQucHVzaChibG9jayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0YXRpY0dyaWQucHVzaChudWxsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJhbmRvbWl6ZVNwYXducygpO1xuICB9XG5cbiAgbGVhZGVyYm9hcmQoKSB7XG4gICAgbGV0IHlQb3MgPSA2MDtcbiAgICBsZXQgeFBvcyA9IDk0MDtcbiAgICAvLyBpZiAoU1MuY3VycmVudFNjb3Jlcykge1xuICAgIC8vICAgdGhpcy5kcmF3U2NvcmVzKCcqKioqKiBIaSBTY29yZXMgKioqKionLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICB5UG9zICs9IDMwO1xuICAgIC8vICAgbGV0IGxiID0gU1MuY3VycmVudFNjb3JlcztcbiAgICAvLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgICAgdGhpcy5kcmF3U2NvcmVzKGxiW2ldLm5hbWUgKyAnICAnICsgIGxiW2ldLnNjb3JlLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICAgIHlQb3MgKz0gMzA7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9XG5cbiAgZHJhdyhlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuY29udGV4dEZYLmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICBzdXBlci5kcmF3KGVsYXBzZWRUaW1lKTtcblxuICAgIHRoaXMuZHJhd1Njb3JlKCk7XG5cbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgdGhpcy5kcmF3TWVzc2FnZSgnRGVhdGhib3QgNTAwMCcsIDEyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdXQVNEIHRvIFNob290JywgMTgwKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ0Fycm93IEtleXMgdG8gTW92ZScsIDIyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBCZWdpbicsIDI2MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2RlYWQnKSB7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdUaG91IGFydCAnICsgdGhpcy5wbGF5ZXJEZWF0aE1ldGhvZCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBTdGFydCBhZ2FpbicsIDI0MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhd0JhY2tncm91bmQoZWxhcHNlZFRpbWUpIHtcbiAgICBsZXQgYmdDb2xvcjtcbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgYmdDb2xvciA9ICdQdXJwbGUnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdkZWFkJykge1xuICAgICAgYmdDb2xvciA9ICdyZWQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBiZ0NvbG9yID0gdGhpcy5maWxsU3R5bGU7XG4gICAgfVxuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9IGJnQ29sb3I7XG4gICAgdGhpcy5jb250ZXh0QkcuZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNCRy53aWR0aCwgdGhpcy5jYW52YXNCRy5oZWlnaHQpO1xuICAgIHRoaXMuZHJhd0dyaWQodGhpcy5ncmlkKTtcbiAgICBpZiAodGhpcy5kZWJ1Z01vZGUpIHtcbiAgICAgIHRoaXMuZHJhd0dyaWQodGhpcy5zcGF3bkdyaWQpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXdHcmlkKGdyaWQpIHtcbiAgICBsZXQgZ3JpZFBvc1ggPSAwLCBncmlkUG9zWSA9IDA7XG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5jb2xzOyBjb2wrKykge1xuICAgICAgICBsZXQgaW5kZXggPSAocm93ICogdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgZ3JpZFBvc1ggPSBjb2wgKiB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgZ3JpZFBvc1kgPSByb3cgKiB0aGlzLmNlbGxIZWlnaHQ7XG5cbiAgICAgICAgaWYgKGdyaWRbaW5kZXhdKSB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0QkcuZHJhd0ltYWdlKHRoaXMudGlsZXMsIGdyaWRbaW5kZXhdICpcbiAgICAgICAgICB0aGlzLmNlbGxXaWR0aCwgMCwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCxcbiAgICAgICAgICBncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkW2luZGV4XSA9PT0gREVCVUdfVElMRSkge1xuICAgICAgICAgIHRoaXMuY29udGV4dEJHLnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICAgICAgdGhpcy5jb250ZXh0Qkcuc3Ryb2tlUmVjdChncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLFxuICAgICAgICAgICAgdGhpcy5jZWxsSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRyYXdMb2FkaW5nKCkge1xuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9ICcjY2NjJztcbiAgICB0aGlzLmNvbnRleHRCRy5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc0JHLndpZHRoLCB0aGlzLmNhbnZhc0JHLmhlaWdodCk7XG4gIH1cblxuICBkcmF3TWVzc2FnZShtZXNzYWdlLCB5UG9zLCBzaXplKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB5UG9zID0geVBvcyB8fCAyMDA7XG4gICAgc2l6ZSA9IHNpemUgfHwgMjU7XG4gICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzaXplICsgJ3B4IFZlcmRhbmEnO1xuICAgIGxldCBtZXRyaWNzID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KG1lc3NhZ2UpO1xuICAgIGxldCB3aWR0aCA9IG1ldHJpY3Mud2lkdGg7XG4gICAgbGV0IG1lc3NhZ2VYID0gcG9zIC0gd2lkdGggLyAyO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChtZXNzYWdlLCBtZXNzYWdlWCwgeVBvcyk7XG4gIH1cblxuIGRyYXdTY29yZXMobWVzc2FnZSwgeVBvcywgeFBvcywgc2l6ZSkge1xuICAgIGxldCBwb3MgPSB0aGlzLmNhbnZhcy53aWR0aCAvIDI7XG4gICAgeVBvcyA9IHlQb3MgfHwgMjAwO1xuICAgIHNpemUgPSBzaXplIHx8IDI1O1xuICAgIHRoaXMuY29udGV4dC5mb250ID0gc2l6ZSArICdweCBWZXJkYW5hJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQobWVzc2FnZSwgeFBvcywgeVBvcyk7XG4gIH1cblxuICBkcmF3U2NvcmUoKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB0aGlzLmNvbnRleHQuZm9udCA9ICcyNXB4IFZlcmRhbmEnO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIGxldCBzY29yZVRleHQgPSAnR0FNRTogJyArIHRoaXMuc2NvcmU7XG4gICAgbGV0IG1ldHJpY3MgPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoc2NvcmVUZXh0KTtcbiAgICBsZXQgd2lkdGggPSBtZXRyaWNzLndpZHRoO1xuICAgIGxldCBzY29yZVggPSBwb3MgLSAod2lkdGggLyAyKTtcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQoc2NvcmVUZXh0LCBzY29yZVgsIDI1KTtcbiAgfVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShlbGFwc2VkVGltZSk7XG5cbiAgICBpZiAodGhpcy5rZXlEb3duLnN0YXJ0ICYmIHRoaXMuZ2FtZVN0YXRlICE9PSAncGxheScpIHtcbiAgICAgIHRoaXMuZ2FtZVN0YXRlID0gJ3BsYXknO1xuICAgICAgY29uc29sZS5sb2coJ0dhbWUgU3RhcnQnKTtcbiAgICAgIHRoaXMucmFuZG9taXplU3Bhd25zKCk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubnVtT2ZNb25zdGVycyA9PT0gMCAmJiB0aGlzLmluaXRpYWxpemVkKSB7IC8vIFlvdSBiZWF0IGFsbCBtb25zdGVyc1xuICAgICAgdGhpcy5yYW5kb21pemVTcGF3bnMoKTtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VUaW1lID4gMCkgeyAvLyBzaG93IG5leHQgcm91bmQgbWVzc2FnZVxuICAgICAgICB0aGlzLmRyYXdNZXNzYWdlKCdSb3VuZCAnICsgdGhpcy5yb3VuZCk7XG4gICAgICAgIHRoaXMubWVzc2FnZVRpbWUgLT0gZWxhcHNlZFRpbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VUaW1lID0gMTA7XG4gICAgICAgIHRoaXMucm91bmQrKztcbiAgICAgICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgICAgICBpZiAoYWN0b3IgaW5zdGFuY2VvZiBNb25zdGVyKSB7XG4gICAgICAgICAgICB0aGlzLm51bU9mTW9uc3RlcnMrKztcbiAgICAgICAgICAgIGFjdG9yLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICBhY3Rvci5hbHBoYSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge0FjdG9yLCBQaHlzaWNzLCBQb2ludCwgRGlyZWN0aW9uc30gZnJvbSAnLi9iZXJ6ZXJrJztcbmltcG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge0J1bGxldH0gZnJvbSAnLi9idWxsZXQnO1xuXG5leHBvcnQgY2xhc3MgTW9uc3RlciBleHRlbmRzIEFjdG9yIHtcbiAgY29uc3RydWN0b3IoaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpclkpIHtcbiAgICAvLyBzdXBlcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCk7XG4gICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICB0aGlzLmRpclRpbWVyID0gMDtcbiAgICB0aGlzLmlzRmlyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5sYXNlckRlbHRhID0ge307XG4gICAgdGhpcy5sYXNlclJhbmdlID0gMTIwMDtcbiAgICB0aGlzLmxhc2VyU3RhcnQgPSB7fTtcbiAgICB0aGlzLmV5ZU9mZnNldCA9IHt4OiAwLCB5OiAxNH07XG4gICAgdGhpcy5oZWFkTGFtcEFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgICAgc3VwZXIuZHJhdyhnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgICBpZiAoZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZvbnQgPSAnMTZweCBWZXJkYW5hJztcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZWQnO1xuICAgICAgICBnYW1lLmNvbnRleHQuZmlsbFRleHQoJ01vbnN0ZXInLFxuICAgICAgICAgIHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gNCksXG4gICAgICAgICAgdGhpcy5jdXJZIC0gMTApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5hbHBoYSA+PSAwLjEpIHtcbiAgICAgIHRoaXMuYWxwaGEgLT0gMC4xO1xuICAgICAgZ2FtZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gdGhpcy5hbHBoYTtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgICAgZ2FtZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcbiAgICB9XG4gIH1cblxuICBmaXJlTGFzZXIoZ2FtZSwgcGxheWVyKSB7XG4gICAgbGV0IGxhc2VyRW5kcG9pbnQgPSB7XG4gICAgICB4OiB0aGlzLmxhc2VyU3RhcnQueCArIHRoaXMubGFzZXJEZWx0YS54LFxuICAgICAgeTogdGhpcy5sYXNlclN0YXJ0LnkgKyB0aGlzLmxhc2VyRGVsdGEueVxuICAgIH07XG4gICAgbGV0IHRhcmdldCA9IFtdO1xuICAgIGxldCB0YXJnZXRPYmogPSB7fTtcbiAgICB0YXJnZXRPYmoueCA9IHBsYXllci5jdXJYICsgNTtcbiAgICB0YXJnZXRPYmoueSA9IHBsYXllci5jdXJZO1xuICAgIHRhcmdldE9iai53ID0gMTU7XG4gICAgdGFyZ2V0T2JqLmggPSAgMTU7XG4gICAgdGFyZ2V0LnB1c2godGFyZ2V0T2JqKTtcbiAgICBsZXQgdGFyZ2V0RGVsdGEgPSBnYW1lLnBoeXNpY3MuZ2V0RGVsdGEoXG4gICAgICB0aGlzLmxhc2VyU3RhcnQueCwgdGhpcy5sYXNlclN0YXJ0LnksIHRhcmdldE9iai54LCB0YXJnZXRPYmoueSk7XG4gICAgdGhpcy5maXJpbmcgPSB0cnVlO1xuICAgIHRoaXMubW92aW5nID0gZmFsc2U7XG5cbiAgICBsZXQgYmxvY2tSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgIHRoaXMubGFzZXJTdGFydCwgdGhpcy5sYXNlckRlbHRhLCBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgbGV0IHRhcmdldFJlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgdGhpcy5sYXNlclN0YXJ0LCB0aGlzLmxhc2VyRGVsdGEsIHRhcmdldCk7XG5cbiAgICBsZXQgZW5kUG9zOyBsZXQgdGFyZ2V0SGl0O1xuICAgIGlmICgoYmxvY2tSZXN1bHQgJiYgYmxvY2tSZXN1bHQuaGl0KSAmJlxuICAgICAgICAodGFyZ2V0UmVzdWx0ICYmIHRhcmdldFJlc3VsdC5oaXQpKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLmNoZWNrTmVhcmVzdEhpdCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tSZXN1bHQsIHRhcmdldFJlc3VsdCk7XG4gICAgICBlbmRQb3MgPSByZXN1bHQuZW5kUG9zO1xuICAgICAgdGFyZ2V0SGl0ID0gcmVzdWx0LnRhcmdldEhpdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJsb2NrUmVzdWx0ICYmIGJsb2NrUmVzdWx0LmhpdCkge1xuICAgICAgICAvLyB1cGRhdGUgZW5kIHBvcyB3aXRoIGhpdCBwb3NcbiAgICAgICAgZW5kUG9zID0gbmV3IFBvaW50KGJsb2NrUmVzdWx0LmhpdFBvcy54LFxuICAgICAgICAgIGJsb2NrUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldFJlc3VsdCAmJiB0YXJnZXRSZXN1bHQuaGl0KSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQb2ludCh0YXJnZXRSZXN1bHQuaGl0UG9zLngsXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgdGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQb2ludChsYXNlckVuZHBvaW50LngsIGxhc2VyRW5kcG9pbnQueSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGRlZ1RvRW5kcG9zID0gZ2FtZS5waHlzaWNzLmdldFRhcmdldERlZ3JlZSh0aGlzLmxhc2VyRGVsdGEpO1xuICAgIGxldCBkZWdUb1RhcmdldCA9IGdhbWUucGh5c2ljcy5nZXRUYXJnZXREZWdyZWUodGFyZ2V0RGVsdGEpO1xuXG4gICAgZ2FtZS5jb250ZXh0RlguYmVnaW5QYXRoKCk7XG4gICAgZ2FtZS5jb250ZXh0RlgubW92ZVRvKHRoaXMubGFzZXJTdGFydC54LCB0aGlzLmxhc2VyU3RhcnQueSk7XG4gICAgZ2FtZS5jb250ZXh0RlgubGluZVRvKGVuZFBvcy54LCBlbmRQb3MueSk7XG4gICAgZ2FtZS5jb250ZXh0RlguY2xvc2VQYXRoKCk7XG4gICAgZ2FtZS5jb250ZXh0Rlguc3Ryb2tlU3R5bGUgPSB0YXJnZXRSZXN1bHQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0ID8gJ3JlZCcgOiAnYmx1ZSc7XG4gICAgZ2FtZS5jb250ZXh0Rlguc3Ryb2tlKCk7XG5cbiAgICBpZiAoIXRhcmdldEhpdCkge1xuICAgICAgbGV0IG5ld0RlZ3JlZTtcbiAgICAgIGlmICh0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgaWYgKGRlZ1RvRW5kcG9zIDwgMTgwKSB7XG4gICAgICAgICAgZGVnVG9FbmRwb3MgKz0gMzYwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWdUb1RhcmdldCA8IDE4MCkge1xuICAgICAgICAgIGRlZ1RvVGFyZ2V0ICs9IDM2MDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGRlZ1RvRW5kcG9zID4gZGVnVG9UYXJnZXQpIHtcbiAgICAgICAgaWYgKGRlZ1RvRW5kcG9zIC0gZGVnVG9UYXJnZXQgPiA2KSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgLSAzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0RlZ3JlZSA9IGRlZ1RvRW5kcG9zIC0gMC41O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5kZWdUb1BvcyhuZXdEZWdyZWUsIHRoaXMubGFzZXJSYW5nZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZGVnVG9UYXJnZXQgLSBkZWdUb0VuZHBvcyA+IDYpIHtcbiAgICAgICAgICBuZXdEZWdyZWUgPSBkZWdUb0VuZHBvcyArIDM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgKyAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXNlckRlbHRhID0gZ2FtZS5waHlzaWNzLmRlZ1RvUG9zKG5ld0RlZ3JlZSwgdGhpcy5sYXNlclJhbmdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgICBwbGF5ZXIucmVjb3ZlcnlUaW1lciA9IDA7XG4gICAgICAgIHBsYXllci5oZWFsdGggLT0gMjtcbiAgICAgICAgZ2FtZS5wbGF5ZXJEZWF0aE1ldGhvZCA9ICdibGluZCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgc3VwZXIudXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICB0aGlzLmxhc2VyU3RhcnQgPSB7XG4gICAgICB4OiB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpLFxuICAgICAgeTogdGhpcy5jdXJZICsgMTRcbiAgICB9O1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdyZWQnO1xuICAgIHRoaXMuZGlyVGltZXIgLT0gZWxhcHNlZFRpbWU7XG4gICAgaWYgKHRoaXMuZGlyVGltZXIgPD0gMCAmJiAhdGhpcy5maXJpbmcpIHtcbiAgICAgIHRoaXMubW92aW5nID0gQm9vbGVhbihnYW1lLmdldFJhbmRvbSgwLCAxKSk7XG4gICAgICB0aGlzLmRpclRpbWVyID0gZ2FtZS5nZXRSYW5kb20oMiwgNCk7XG4gICAgICBsZXQgbmV4dERpcmVjdGlvbiA9IGdhbWUuZ2V0UmFuZG9tKDAsIDMpO1xuICAgICAgdGhpcy5kaXJYID0gRGlyZWN0aW9ucy5kaXJlY3Rpb25zW25leHREaXJlY3Rpb25dLng7XG4gICAgICB0aGlzLmRpclkgPSBEaXJlY3Rpb25zLmRpcmVjdGlvbnNbbmV4dERpcmVjdGlvbl0ueTtcbiAgICB9XG4gICAgdGhpcy52aXNpYmxlQWN0b3JzID0gMDtcbiAgICB0aGlzLmVhY2hWaXNpYmxlQWN0b3IoZ2FtZSwgUGxheWVyLCBmdW5jdGlvbihwbGF5ZXIpIHtcbiAgICAgIHRoaXMudmlzaWJsZUFjdG9ycyArPSAxO1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3doaXRlJztcblxuICAgICAgaWYgKCF0aGlzLmZpcmluZykgeyAvLyBzZXQgdGhlIGluaXRpYWwgc3RhcnRpbmcgcG9pbnQgZm9yIHRoZSBsYXNlclxuICAgICAgICBsZXQgbGFzZXJFbmRwb2ludDtcbiAgICAgICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICAgICAgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgICAgICAgIHg6ICh0aGlzLmxhc2VyU3RhcnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgeTogdGhpcy5sYXNlclN0YXJ0LnlcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGlyWSA9PT0gLTEgfHwgdGhpcy5kaXJZID09PSAxKSB7XG4gICAgICAgICAgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgICAgICAgIHg6IHRoaXMubGFzZXJTdGFydC54LFxuICAgICAgICAgICAgeTogKHRoaXMubGFzZXJTdGFydC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcllcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShcbiAgICAgICAgICBsYXNlckVuZHBvaW50LngsIGxhc2VyRW5kcG9pbnQueSwgdGhpcy5sYXNlclN0YXJ0LngsXG4gICAgICAgICAgdGhpcy5sYXNlclN0YXJ0LnkpO1xuICAgICAgfVxuICAgICAgdGhpcy5maXJlTGFzZXIoZ2FtZSwgcGxheWVyKTtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLnZpc2libGVBY3RvcnMgPT09IDApIHtcbiAgICAgIHRoaXMubGFzZXJFbmRwb2ludCA9IG51bGw7XG4gICAgICB0aGlzLmZpcmluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgQnVsbGV0LCBmdW5jdGlvbihidWxsZXQpIHtcbiAgICAgIGJ1bGxldC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICdncmVlbic7XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgZ2FtZS5udW1PZk1vbnN0ZXJzLS07XG4gICAgICBnYW1lLnNjb3JlKys7XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuLypnbG9iYWxzIFNTOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCAqIGFzIGRlYXRoYm90IGZyb20gJy4vZGVhdGhib3QnO1xuaW1wb3J0IHtBY3RvciwgUGh5c2ljcywgQm94LCBQb2ludCwgTEVWRUxTfSBmcm9tICcuL2JlcnplcmsnO1xuaW1wb3J0IHtCdWxsZXR9IGZyb20gJy4vYnVsbGV0JztcblxuZXhwb3J0IGNsYXNzIFBsYXllciBleHRlbmRzIEFjdG9ye1xuICBjb25zdHJ1Y3RvcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCwgZGlyWSkge1xuICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgdGhpcy5oZWFsdGggPSAxMDA7XG4gICAgdGhpcy5yZWNvdmVyeVRpbWVyID0gMjtcbiAgICB0aGlzLmV5ZU9mZnNldCA9IHt4OiAwLCB5OiAxMH07XG4gICAgdGhpcy5oZWFkTGFtcEFjdGl2ZSA9IHRydWU7XG4gIH1cblxuICBkcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKGdhbWUuZ2FtZVN0YXRlICE9PSAnYXR0cmFjdCcpIHtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWxsZXQpIHtcbiAgICAgIHRoaXMuYnVsbGV0LmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIH1cbiAgICAvLyBsZXQgaGVhbHRoVmlzID0gKCgxMDAgLSB0aGlzLmhlYWx0aCkgLyAxMDApO1xuICAgIC8vIGdhbWUuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwnICsgaGVhbHRoVmlzICsgJyknO1xuICAgIC8vIGdhbWUuY29udGV4dC5maWxsUmVjdCgwLCAwLCBnYW1lLmNhbnZhcy53aWR0aCwgZ2FtZS5jYW52YXMuaGVpZ2h0KTtcbiAgICB0aGlzLmRyYXdGUFMoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuXG4gIH1cblxuICB1cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAodGhpcy5oZWFsdGggPD0gMCkge1xuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIGdhbWUuZ2FtZVN0YXRlID0gJ2RlYWQnO1xuICAgICAgY29uc29sZS5sb2coJ0RFQUQhJyk7XG4gICAgICBpZiAodGhpcy5idWxsZXQgJiYgdGhpcy5idWxsZXQuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuYnVsbGV0ID0gbnVsbDtcbiAgICAgICAgZGVsZXRlIGdhbWUuYWN0b3JzLnBsYXllckJ1bGxldDtcbiAgICAgIH1cbiAgICAgIC8vIGxldCBsb3dlc3RTY29yZSA9IFNTLmN1cnJlbnRTY29yZXMgJiYgU1MuY3VycmVudFNjb3Jlcy5sZW5ndGggP1xuICAgICAgLy8gICBTUy5jdXJyZW50U2NvcmVzW1NTLmN1cnJlbnRTY29yZXMubGVuZ3RoIC0gMV0uc2NvcmUgOiAwO1xuICAgICAgLy8gaWYgKGdhbWUuc2NvcmUgPiBsb3dlc3RTY29yZSkge1xuICAgICAgLy8gICBsZXQgcGxheWVyTmFtZSA9IHByb21wdCgnUGxlYXNlIEVudGVyIHlvdXIgTmFtZS4nKTtcbiAgICAgIC8vICAgU1Muc3VibWl0U2NvcmUocGxheWVyTmFtZSwgZ2FtZS5zY29yZSk7XG4gICAgICAvLyAgIGRlYXRoYm90LnNjb3JlcyA9IFNTLmdldFNjb3Jlcyg4KTtcbiAgICAgIC8vIH1cbiAgICB9XG5cbiAgICBpZiAoZ2FtZS5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgZGlyWCA9IDA7XG4gICAgbGV0IGRpclkgPSAwO1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdibHVlJztcblxuICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XG4gICAgICB0aGlzLmRlYnVnQ29sb3IgPSAnYmxhY2snO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhlYWx0aCA8IDEwMCkge1xuICAgICAgaWYgKHRoaXMucmVjb3ZlcnlUaW1lciA+IDEpIHtcbiAgICAgICAgdGhpcy5oZWFsdGggKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVjb3ZlcnlUaW1lciArPSBlbGFwc2VkVGltZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZ2FtZS5rZXlEb3duLnVwKSB7XG4gICAgICBkaXJZID0gLTE7XG4gICAgICB0aGlzLmRpclggPSAwO1xuICAgICAgdGhpcy5kaXJZID0gZGlyWTtcbiAgICB9XG4gICAgaWYgKGdhbWUua2V5RG93bi5kb3duKSB7XG4gICAgICBkaXJZID0gMTtcbiAgICAgIHRoaXMuZGlyWCA9IDA7XG4gICAgICB0aGlzLmRpclkgPSBkaXJZO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5rZXlEb3duLmxlZnQpIHtcbiAgICAgIGRpclggPSAtMTtcbiAgICAgIHRoaXMuZGlyWSA9IDA7XG4gICAgICB0aGlzLmRpclggPSBkaXJYO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5rZXlEb3duLnJpZ2h0KSB7XG4gICAgICBkaXJYID0gMTtcbiAgICAgIHRoaXMuZGlyWSA9IDA7XG4gICAgICB0aGlzLmRpclggPSBkaXJYO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWxsZXQpIHtcbiAgICAgIC8vIGNoZWNrIHdoZXRoZXIgYnVsbGV0IGlzIHN0aWxsIGFjdGl2ZVxuICAgICAgaWYgKCF0aGlzLmJ1bGxldC5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5idWxsZXQgPSBudWxsO1xuICAgICAgICBkZWxldGUgZ2FtZS5hY3RvcnMucGxheWVyQnVsbGV0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZ2FtZS5rZXlEb3duLnNob290VXApIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIDAsIC0xKTtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3REb3duKSB7XG4gICAgICAgIHRoaXMuZmlyZUJ1bGxldChnYW1lLCAwLCAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RMZWZ0KSB7XG4gICAgICAgIHRoaXMuZmlyZUJ1bGxldChnYW1lLCAtMSwgMCk7XG4gICAgICB9XG4gICAgICBpZiAoZ2FtZS5rZXlEb3duLnNob290UmlnaHQpIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIDEsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChkaXJYID09PSAtMSAmJiB0aGlzLmZhY2luZyAhPT0gJ2xlZnQnKSB7XG4gICAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5pbWFnZS5yZXY7XG4gICAgICB0aGlzLmZhY2luZyA9ICdsZWZ0JztcbiAgICB9XG5cbiAgICBpZiAoZGlyWCA9PT0gMSAmJiB0aGlzLmZhY2luZyAhPT0gJ3JpZ2h0Jykge1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IHRoaXMuaW1hZ2U7XG4gICAgICB0aGlzLmZhY2luZyA9ICdyaWdodCc7XG4gICAgfVxuXG4gICAgbGV0IG1vdmluZ0JveCA9IG5ldyBCb3godGhpcy5jdXJYLCB0aGlzLmN1clksIHRoaXMud2lkdGgsXG4gICAgICB0aGlzLmhlaWdodCk7XG4gICAgbGV0IHNlZ21lbnREZWx0YSA9IHtcbiAgICAgIHg6ICh0aGlzLnNwZWVkWCAqIGVsYXBzZWRUaW1lKSAqIGRpclgsXG4gICAgICB5OiAodGhpcy5zcGVlZFkgKiBlbGFwc2VkVGltZSkgKiBkaXJZXG4gICAgfTtcbiAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLnN3ZWVwQm94SW50b0JveGVzKG1vdmluZ0JveCwgc2VnbWVudERlbHRhLFxuICAgICAgZ2FtZS5zdGF0aWNCbG9ja3MpO1xuICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmhpdCkge1xuICAgICAgdGhpcy5jdXJYID0gcmVzdWx0LmhpdFBvcy54IC0gKHRoaXMud2lkdGggLyAyKTtcbiAgICAgIHRoaXMuY3VyWSA9IHJlc3VsdC5oaXRQb3MueSAtICh0aGlzLmhlaWdodCAvIDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmN1clggKz0gc2VnbWVudERlbHRhLng7XG4gICAgICB0aGlzLmN1clkgKz0gc2VnbWVudERlbHRhLnk7XG4gICAgfVxuXG4gICAgaWYgKCh0aGlzLmN1clggKyB0aGlzLndpZHRoKSA+IGdhbWUuY2FudmFzLndpZHRoKSB7XG4gICAgICBsZXQgeENsaXAgPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICBpZiAodGhpcy5kaXJYID09PSAxKSB7XG4gICAgICAgIHRoaXMuY3VyWCA9IHhDbGlwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5jdXJYID0gdGhpcy5jdXJYICsgZ2FtZS5jYW52YXMud2lkdGg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICBsZXQgeUNsaXAgPSAodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpIC0gZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICBpZiAodGhpcy5kaXJZID09PSAxKSB7XG4gICAgICAgIHRoaXMuY3VyWSA9IHlDbGlwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJZIDwgMCkge1xuICAgICAgaWYgKHRoaXMuZGlyWSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5jdXJZID0gdGhpcy5jdXJZICsgZ2FtZS5jYW52YXMuaGVpZ2h0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgZGVhdGhib3QuTW9uc3RlciwgZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICd3aGl0ZSc7XG4gICAgICBpZiAoIWdhbWUuZGVidWdNb2RlKSB7XG4gICAgICAgIHRoaXMuaGVhbHRoIC09IDIwO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgICAgZ2FtZS5wbGF5ZXJEZWF0aE1ldGhvZCA9ICdkZWFkJztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuY3VyWCwgdGhpcy5jdXJZKTtcbiAgICAvLyB0aGlzLmhlYWRMYW1wKGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgfVxuXG4gIC8vIHN0YXJ0WCwgc3RhcnRZLCBzcGVlZCwgZGlyWCwgZGlyWVxuICBmaXJlQnVsbGV0KGdhbWUsIGRpclgsIGRpclkpIHtcbiAgICB0aGlzLmJ1bGxldCA9IG5ldyBCdWxsZXQodGhpcy5jdXJYLCB0aGlzLmN1clkgKyAyMCwgNjAwLCBkaXJYLCBkaXJZKTtcbiAgICBnYW1lLmFjdG9ycy5wbGF5ZXJCdWxsZXQgPSB0aGlzLmJ1bGxldDtcbiAgfVxufVxuIl19
