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
    key: 'getTilesInFOV',
    value: function getTilesInFOV(game) {
      var tilesInFOV = [];
      var blocks = game.staticBlocks;
      for (var i = 0, li = blocks.length; i < li; i++) {
        var visionDelta = {
          x: blocks[i].x - this.curX,
          y: blocks[i].y - this.curY
        };
        var blockDirLength = Math.sqrt(visionDelta.x * visionDelta.x + visionDelta.y * visionDelta.y);
        var blockDir = {};
        blockDir.x = visionDelta.x / blockDirLength;
        blockDir.y = visionDelta.y / blockDirLength;
        var dotProduct = this.dirX * blockDir.x + this.dirY * blockDir.y;
        if (dotProduct > 0.70) {
          tilesInFOV.push(game.staticBlocks[i]);
        }
      }
      return tilesInFOV;
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
      var _this = this;

      var pointArray = [];
      var startingPoint = {};
      var degreeToCurEndPoint = void 0;
      var sweepAngle = 40;
      var gridSize = { w: 28, h: 28 };
      var cellSize = 32;
      var dir = { x: this.dirX, y: this.dirY };

      startingPoint.x = this.curX + this.width / 2;
      startingPoint.y = this.curY + 14;

      var tilesInFOV = this.getTilesInFOV(game);
      // console.log(tilesInFOV);
      var initialEndpoint = {};
      // Get our initial point that is straight ahead
      if (this.dirX === -1 || this.dirX === 1) {
        initialEndpoint = { x: (startingPoint.x + this.laserRange) * -this.dirX,
          y: startingPoint.y };
      } else if (this.dirY === -1 || this.dirY === 1) {
        initialEndpoint = { x: startingPoint.x,
          y: (startingPoint.y + this.laserRange) * -this.dirY };
      }

      var initalDelta = game.physics.getDelta(initialEndpoint.x, initialEndpoint.y, startingPoint.x, startingPoint.y);

      var degToInitialEndpos = game.physics.getTargetDegree(initalDelta);
      var degreeToStartSweep = degToInitialEndpos - sweepAngle;
      var degreeToEndSweep = degToInitialEndpos + sweepAngle;
      initalDelta = game.physics.degToPos(degreeToStartSweep, this.laserRange);

      var initialResult = game.physics.intersectSegmentIntoBoxes(startingPoint, initalDelta, tilesInFOV);
      var intialEndPos = void 0;
      if (initialResult && initialResult.hit) {
        // update end pos with hit pos
        intialEndPos = new _physics.Point(initialResult.hitPos.x, initialResult.hitPos.y);
      } else {
        intialEndPos = new _physics.Point(initialEndpoint.x, initialEndpoint.y);
      }

      pointArray.push(intialEndPos);

      var endingEndPos = void 0;
      degreeToCurEndPoint = degreeToStartSweep;

      var _loop = function _loop() {
        var xxx = degreeToCurEndPoint == degreeToStartSweep;
        degreeToCurEndPoint += 0.5;
        var endingDelta = game.physics.degToPos(degreeToCurEndPoint, _this.laserRange);
        game.physics.getFirstCollision(startingPoint, cellSize, endingDelta, function (cellx, celly) {
          var gridPos = celly * game.cols + cellx;
          var block = game.staticGrid[gridPos];
          if (block) {
            var endingResult = game.physics.intersectSegmentIntoBox(startingPoint, endingDelta, block);
            if (endingResult && endingResult.hit) {
              endingEndPos = new _physics.Point(endingResult.hitPos.x, endingResult.hitPos.y);
              pointArray.push(endingEndPos);
              return false;
            }
          }
        });
      };

      while (degreeToCurEndPoint < degreeToEndSweep) {
        _loop();
      }

      game.contextFX.beginPath();
      game.contextFX.moveTo(startingPoint.x, startingPoint.y);
      for (var i = 0, li = pointArray.length; i < li; i++) {
        game.contextFX.lineTo(pointArray[i].x, pointArray[i].y);
      }
      game.contextFX.closePath();
      game.contextFX.fillStyle = 'rgba(255, 255, 255, .30)';
      game.contextFX.fill();
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

      // this.headLamp(game, elapsedTime);

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
    this.debugMode = false;
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
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.eachActor(function (actor) {
        actor.draw(this, elapsedTime);
      }, this);
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

var EPSILON = exports.EPSILON = 1 / 32;

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
      var dirX = delta.x < 0 ? -1 : 1;
      var dirY = delta.y < 0 ? -1 : 1;
      var endPosX = startPos.x + delta.x;
      var endPosY = startPos.y + delta.y;

      var cellX = Math.floor(startPos.x / cellSize);
      var cellY = Math.floor(startPos.y / cellSize);

      var timeStepX = cellSize * dirX / delta.x;
      var timeStepY = cellSize * dirY / delta.y;

      var timeX = void 0,
          timeY = void 0;
      if (dirX === 0) {
        timeX = 1;
      } else {
        var firstEdgeX = cellX * cellSize;
        if (dirX > 0) {
          firstEdgeX += cellSize;
        }
        timeX = (firstEdgeX - startPos.x) / delta.x;
      }

      if (dirY === 0) {
        timeY = 1;
      } else {
        var firstEdgeY = cellY * cellSize;
        if (dirY > 0) {
          firstEdgeY += cellSize;
        }
        timeY = (firstEdgeY - startPos.y) / delta.y;
      }

      while (timeX < 1 || timeY < 1) {
        if (timeX < timeY) {
          timeX += timeStepX;
          cellX += dirX;
        } else {
          cellY += dirY;
          timeY += timeStepY;
        }
        if (callback(cellX, cellY) === false) {
          break;
        }
      }
      // console.log(timeX, timeY);
      // return {tsX: timeStepX, tsY: timeStepY};
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
      var degree = theta * (180 / Math.PI);
      if (theta < 0) {
        degree += 360;
      }
      return degree;
    }
  }, {
    key: 'degToPos',
    value: function degToPos(degree, radius) {
      var radian = degree * (Math.PI / 180);
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
    return _this;
  }

  _createClass(Bullet, [{
    key: 'draw',
    value: function draw(game, elapsedTime) {
      game.context.fillStyle = '#FFF';
      game.context.fillRect(this.curX, this.curY, this.width, this.height);
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
  var game = window.deathbotGame = new exports.Game(canvas, canvasBG, '#111');
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
  grid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
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

  function Game(canvas, canvasBG, fillStyle) {
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
          // Reviving monsters, this will be refactored later to randomize
          // positions rather than just reactivating the dead ones where they
          // fell.
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

      game.context.beginPath();
      game.context.moveTo(this.laserStart.x, this.laserStart.y);
      game.context.lineTo(endPos.x, endPos.y);
      game.context.closePath();
      game.context.strokeStyle = targetResult && targetResult.hit ? 'red' : 'blue';
      game.context.stroke();

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
      var healthVis = (100 - this.health) / 100;
      game.context.fillStyle = 'rgba(0,0,0,' + healthVis + ')';
      game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);
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
      this.headLamp(game, elapsedTime);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9iZXJ6ZXJrL2FjdG9yLmpzIiwianMvYmVyemVyay9nYW1lLmpzIiwianMvYmVyemVyay9pbmRleC5qcyIsImpzL2Jlcnplcmsva2V5cy5qcyIsImpzL2JlcnplcmsvcGh5c2ljcy5qcyIsImpzL2J1bGxldC5qcyIsImpzL2RlYXRoYm90LmpzIiwianMvZ2FtZS5qcyIsImpzL21vbnN0ZXIuanMiLCJqcy9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ0E7Ozs7Ozs7OztBQUVBOzs7O0FBRU8sSUFBSSxrQ0FBYTtBQUN0QixNQUFJLENBQUo7QUFDQSxRQUFNLENBQU47QUFDQSxRQUFNLENBQU47QUFDQSxTQUFPLENBQVA7QUFDQSxjQUFZLENBQ1YsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUMsQ0FBRCxFQURBLEVBRVYsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFGRyxFQUdWLEVBQUMsR0FBRyxDQUFDLENBQUQsRUFBSSxHQUFHLENBQUgsRUFIRSxFQUlWLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBSkcsQ0FBWjtBQUtBLFNBQVEsQ0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLE1BQWYsRUFBdUIsT0FBdkIsQ0FBUjtBQUNBLDhCQUFTLE1BQU0sTUFBTTtBQUNuQixRQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ1osYUFBTyxLQUFLLEtBQUwsQ0FESztLQUFkLE1BRU8sSUFBSSxPQUFPLENBQVAsRUFBVTtBQUNuQixhQUFPLEtBQUssSUFBTCxDQURZO0tBQWQsTUFFQSxJQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ25CLGFBQU8sS0FBSyxJQUFMLENBRFk7S0FBZCxNQUVBLElBQUksT0FBTyxDQUFQLEVBQVU7QUFDbkIsYUFBTyxLQUFLLEVBQUwsQ0FEWTtLQUFkLE1BRUE7QUFDTCxhQUFPLEtBQUssS0FBTCxDQURGO0tBRkE7R0FsQmE7QUF3QnRCLDRCQUFRLE1BQU0sTUFBTTtBQUNsQixXQUFPLEtBQUssS0FBTCxDQUFXLEtBQUssUUFBTCxDQUFjLElBQWQsRUFBb0IsSUFBcEIsQ0FBWCxDQUFQLENBRGtCO0dBeEJFO0NBQWI7O0lBNkJFO0FBQ1gsV0FEVyxLQUNYLENBQVksS0FBWixFQUFtQixNQUFuQixFQUEyQixNQUEzQixFQUFtQyxLQUFuQyxFQUEwQyxNQUExQyxFQUFrRCxNQUFsRCxFQUEwRCxJQUExRCxFQUFnRSxJQUFoRSxFQUFzRTswQkFEM0QsT0FDMkQ7O0FBQ3BFLFFBQUksc0JBQUo7UUFBbUIsdUJBQW5CLENBRG9FO0FBRXBFLFFBQUksS0FBSixFQUFXO0FBQ1QsV0FBSyxLQUFMLEdBQWEsS0FBYixDQURTO0FBRVQsV0FBSyxRQUFMLEdBQWdCLEtBQUssS0FBTCxDQUZQO0FBR1QsV0FBSyxTQUFMLEdBQWlCO0FBQ2YsZUFBTyxLQUFQO0FBQ0EsY0FBTSxNQUFNLEdBQU47QUFDTixZQUFJLE1BQU0sRUFBTjtBQUNKLGNBQU0sTUFBTSxJQUFOO09BSlI7O0FBSFMsbUJBVVQsR0FBZ0IsTUFBTSxDQUFOLENBVlA7QUFXVCx1QkFBaUIsTUFBTSxDQUFOLENBWFI7S0FBWCxNQVlPO0FBQ0wsV0FBSyxLQUFMLEdBQWEsSUFBYixDQURLO0FBRUwsV0FBSyxRQUFMLEdBQWdCLElBQWhCLENBRks7QUFHTCxXQUFLLFNBQUwsR0FBaUI7QUFDZixlQUFPLElBQVA7QUFDQSxjQUFNLElBQU47QUFDQSxZQUFJLElBQUo7QUFDQSxjQUFNLElBQU47T0FKRixDQUhLO0FBU0wsc0JBQWdCLENBQWhCLENBVEs7QUFVTCx1QkFBaUIsQ0FBakIsQ0FWSztLQVpQOztBQXlCQSxTQUFLLFdBQUwsR0FBbUIsRUFBQyxHQUFHLEtBQUssSUFBTCxFQUFXLEdBQUcsS0FBSyxJQUFMLEVBQXJDLENBM0JvRTtBQTRCcEUsU0FBSyxNQUFMLEdBQWMsTUFBZCxDQTVCb0U7QUE2QnBFLFNBQUssTUFBTCxHQUFjLE1BQWQsQ0E3Qm9FOztBQStCcEUsU0FBSyxNQUFMLEdBQWMsT0FBZCxDQS9Cb0U7QUFnQ3BFLFNBQUssSUFBTCxHQUFZLElBQVosQ0FoQ29FO0FBaUNwRSxTQUFLLElBQUwsR0FBWSxJQUFaLENBakNvRTtBQWtDcEUsU0FBSyxLQUFMLEdBQWEsaUJBQWlCLFFBQVEsR0FBUixDQUFqQixDQWxDdUQ7QUFtQ3BFLFNBQUssTUFBTCxHQUFjLGtCQUFrQixRQUFRLEdBQVIsQ0FBbEIsQ0FuQ3NEO0FBb0NwRSxTQUFLLElBQUwsR0FBWSxNQUFaLENBcENvRTtBQXFDcEUsU0FBSyxJQUFMLEdBQVksTUFBWixDQXJDb0U7QUFzQ3BFLFNBQUssV0FBTCxHQUFtQixFQUFDLEdBQUcsS0FBSyxJQUFMLEVBQVcsR0FBRyxLQUFLLElBQUwsRUFBckMsQ0F0Q29FO0FBdUNwRSxTQUFLLFVBQUwsR0FBa0IsRUFBbEIsQ0F2Q29FO0FBd0NwRSxTQUFLLE1BQUwsR0FBYyxNQUFkLENBeENvRTtBQXlDcEUsU0FBSyxNQUFMLEdBQWMsTUFBZCxDQXpDb0U7QUEwQ3BFLFNBQUssTUFBTCxHQUFjLElBQWQsQ0ExQ29FO0FBMkNwRSxTQUFLLE1BQUwsR0FBYyxJQUFkLENBM0NvRTtBQTRDcEUsU0FBSyxLQUFMLEdBQWEsQ0FBYixDQTVDb0U7QUE2Q3BFLFNBQUssVUFBTCxHQUFrQixLQUFsQixDQTdDb0U7QUE4Q3BFLFNBQUssU0FBTCxHQUFpQixFQUFDLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUF4QixDQTlDb0U7QUErQ3BFLFNBQUssVUFBTCxHQUFrQixFQUFsQixDQS9Db0U7QUFnRHBFLFNBQUssVUFBTCxHQUFrQixJQUFsQixDQWhEb0U7QUFpRHBFLFNBQUssVUFBTCxHQUFrQixFQUFsQixDQWpEb0U7R0FBdEU7O2VBRFc7O3NDQXFETyxNQUFNO0FBQ3RCLFVBQUksU0FBUyxFQUFDLEtBQUssS0FBTCxFQUFZLE1BQU0sQ0FBTixFQUFTLE1BQU0sQ0FBTixFQUEvQjs7QUFEa0IsVUFHbEIsS0FBSyxJQUFMLEdBQVksQ0FBWixFQUFlO0FBQ2pCLGFBQUssSUFBTCxvQkFEaUI7QUFFakIsaUJBQVMsRUFBQyxLQUFLLElBQUwsRUFBVyxNQUFNLENBQU4sRUFBckIsQ0FGaUI7T0FBbkI7O0FBSHNCLFVBUWxCLEtBQUssSUFBTCxHQUFhLEtBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsS0FBSyxLQUFMLEVBQWE7QUFDaEQsYUFBSyxJQUFMLEdBQVksSUFBQyxDQUFLLE1BQUwsQ0FBWSxLQUFaLEdBQW9CLEtBQUssS0FBTCxtQkFBckIsQ0FEb0M7QUFFaEQsaUJBQVMsRUFBQyxLQUFLLElBQUwsRUFBVyxNQUFNLENBQUMsQ0FBRCxFQUEzQixDQUZnRDtPQUFsRDs7QUFSc0IsVUFhbEIsS0FBSyxJQUFMLEdBQVksQ0FBWixFQUFlO0FBQ2pCLGFBQUssSUFBTCxvQkFEaUI7QUFFakIsaUJBQVMsRUFBQyxLQUFLLElBQUwsRUFBVyxNQUFNLENBQU4sRUFBckIsQ0FGaUI7T0FBbkI7O0FBYnNCLFVBa0JsQixLQUFLLElBQUwsR0FBWSxLQUFLLE1BQUwsQ0FBWSxNQUFaLEdBQXFCLEtBQUssTUFBTCxFQUFhO0FBQ2hELGFBQUssSUFBTCxHQUFZLElBQUMsQ0FBSyxNQUFMLENBQVksTUFBWixHQUFxQixLQUFLLE1BQUwsbUJBQXRCLENBRG9DO0FBRWhELGlCQUFTLEVBQUMsS0FBSyxJQUFMLEVBQVcsTUFBTSxDQUFDLENBQUQsRUFBM0IsQ0FGZ0Q7T0FBbEQ7QUFJQSxhQUFPLE1BQVAsQ0F0QnNCOzs7O3lDQXlCSCxNQUFNLGtCQUFrQixVQUFVO0FBQ3JELFdBQUssU0FBTCxDQUFlLFVBQVMsS0FBVCxFQUFnQjtBQUM3QixZQUFJLEVBQUUsaUJBQWlCLGdCQUFqQixDQUFGLElBQXdDLENBQUMsTUFBTSxNQUFOLEVBQWM7QUFDekQsaUJBRHlEO1NBQTNEO0FBR0EsWUFBSSxjQUFjLEVBQ2hCLEtBQUssSUFBTCxHQUFZLE1BQU0sSUFBTixHQUFhLE1BQU0sS0FBTixJQUN6QixLQUFLLElBQUwsR0FBWSxLQUFLLEtBQUwsR0FBYSxNQUFNLElBQU4sSUFDekIsS0FBSyxJQUFMLEdBQVksS0FBSyxNQUFMLEdBQWMsTUFBTSxJQUFOLElBQzFCLEtBQUssSUFBTCxHQUFZLE1BQU0sSUFBTixHQUFhLE1BQU0sTUFBTixDQUpULENBSlc7QUFVN0IsWUFBSSxXQUFKLEVBQWlCO0FBQ2YsbUJBQVMsSUFBVCxDQUFjLElBQWQsRUFBb0IsS0FBcEIsRUFEZTtTQUFqQjtPQVZhLEVBYVosSUFiSCxFQURxRDs7OztrQ0FpQnpDLE1BQU07QUFDbEIsVUFBSSxhQUFhLEVBQWIsQ0FEYztBQUVsQixVQUFJLFNBQVMsS0FBSyxZQUFMLENBRks7QUFHbEIsV0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLEtBQUssT0FBTyxNQUFQLEVBQWUsSUFBSSxFQUFKLEVBQVEsR0FBNUMsRUFBaUQ7QUFDL0MsWUFBSSxjQUFjO0FBQ2hCLGFBQUcsTUFBQyxDQUFPLENBQVAsRUFBVSxDQUFWLEdBQWUsS0FBSyxJQUFMO0FBQ25CLGFBQUcsTUFBQyxDQUFPLENBQVAsRUFBVSxDQUFWLEdBQWUsS0FBSyxJQUFMO1NBRmpCLENBRDJDO0FBSy9DLFlBQUksaUJBQWlCLEtBQUssSUFBTCxDQUFVLFlBQVksQ0FBWixHQUFnQixZQUFZLENBQVosR0FDN0MsWUFBWSxDQUFaLEdBQWdCLFlBQVksQ0FBWixDQURkLENBTDJDO0FBTy9DLFlBQUksV0FBVyxFQUFYLENBUDJDO0FBUS9DLGlCQUFTLENBQVQsR0FBYSxZQUFZLENBQVosR0FBZ0IsY0FBaEIsQ0FSa0M7QUFTL0MsaUJBQVMsQ0FBVCxHQUFhLFlBQVksQ0FBWixHQUFnQixjQUFoQixDQVRrQztBQVUvQyxZQUFJLGFBQWEsSUFBQyxDQUFLLElBQUwsR0FBWSxTQUFTLENBQVQsR0FBZSxLQUFLLElBQUwsR0FBWSxTQUFTLENBQVQsQ0FWVjtBQVcvQyxZQUFJLGFBQWEsSUFBYixFQUFtQjtBQUNyQixxQkFBVyxJQUFYLENBQWdCLEtBQUssWUFBTCxDQUFrQixDQUFsQixDQUFoQixFQURxQjtTQUF2QjtPQVhGO0FBZUEsYUFBTyxVQUFQLENBbEJrQjs7OztxQ0FxQkgsTUFBTSxrQkFBa0IsVUFBVTtBQUNqRCxXQUFLLFNBQUwsQ0FBZSxVQUFTLEtBQVQsRUFBZ0I7QUFDN0IsWUFBSSxFQUFFLGlCQUFpQixnQkFBakIsQ0FBRixFQUFzQztBQUN4QyxpQkFEd0M7U0FBMUM7QUFHQSxZQUFJLEtBQUssU0FBTCxLQUFtQixNQUFuQixFQUEyQjtBQUM3QixpQkFENkI7U0FBL0I7QUFHQSxZQUFJLGNBQWM7QUFDaEIsYUFBRyxLQUFLLElBQUwsR0FBYSxLQUFLLEtBQUwsR0FBYSxDQUFiLEdBQWtCLEtBQUssU0FBTCxDQUFlLENBQWY7QUFDbEMsYUFBRyxLQUFLLElBQUwsR0FBWSxLQUFLLFNBQUwsQ0FBZSxDQUFmO1NBRmIsQ0FQeUI7QUFXN0IsWUFBSSxjQUFjO0FBQ2hCLGFBQUcsS0FBQyxDQUFNLElBQU4sR0FBYyxNQUFNLEtBQU4sR0FBYyxDQUFkLEdBQW1CLE1BQU0sU0FBTixDQUFnQixDQUFoQixHQUFxQixZQUFZLENBQVo7QUFDMUQsYUFBRyxLQUFDLENBQU0sSUFBTixHQUFhLE1BQU0sU0FBTixDQUFnQixDQUFoQixHQUFxQixZQUFZLENBQVo7U0FGcEMsQ0FYeUI7QUFlN0IsWUFBSSxpQkFBaUIsS0FBSyxJQUFMLENBQ25CLFlBQVksQ0FBWixHQUFnQixZQUFZLENBQVosR0FBZ0IsWUFBWSxDQUFaLEdBQWdCLFlBQVksQ0FBWixDQUQ5QyxDQWZ5QjtBQWlCN0IsWUFBSSxXQUFXO0FBQ2IsYUFBRyxZQUFZLENBQVosR0FBZ0IsY0FBaEI7QUFDSCxhQUFHLFlBQVksQ0FBWixHQUFnQixjQUFoQjtTQUZELENBakJ5QjtBQXFCN0IsWUFBSSxhQUFhLElBQUMsQ0FBSyxJQUFMLEdBQVksU0FBUyxDQUFULEdBQWUsS0FBSyxJQUFMLEdBQVksU0FBUyxDQUFULENBckI1Qjs7QUF1QjdCLFlBQUksVUFBVSxLQUFWLENBdkJ5Qjs7QUF5QjdCLFlBQUksY0FBSixDQXpCNkI7QUEwQjdCLFlBQUksYUFBYSxJQUFiLEVBQW1CO0FBQ3JCLGtCQUFRLElBQVIsQ0FEcUI7U0FBdkIsTUFFTztBQUNMLGtCQUFRLEtBQVIsQ0FESztTQUZQOztBQU1BLFlBQUksS0FBSixFQUFXO0FBQ1QsY0FBSSxXQUFXLEVBQVgsQ0FESztBQUVULGNBQUksV0FBVztBQUNiLGVBQUcsTUFBTSxJQUFOO0FBQ0gsZUFBRyxNQUFNLElBQU47QUFDSCxlQUFHLE1BQU0sS0FBTjtBQUNILGVBQUcsTUFBTSxNQUFOO1dBSkQsQ0FGSztBQVFULG1CQUFTLElBQVQsQ0FBYyxRQUFkLEVBUlM7QUFTVCxjQUFJLGNBQWMsS0FBSyxPQUFMLENBQWEseUJBQWIsQ0FDaEIsV0FEZ0IsRUFDSCxXQURHLEVBQ1UsS0FBSyxZQUFMLENBRHhCLENBVEs7QUFXVCxjQUFJLGNBQWMsS0FBSyxPQUFMLENBQWEseUJBQWIsQ0FDaEIsV0FEZ0IsRUFDSCxXQURHLEVBQ1UsUUFEVixDQUFkLENBWEs7O0FBY1QsY0FBSSxLQUFLLFNBQUwsRUFBZ0I7QUFDbEIsZ0JBQUksU0FBUyxtQkFDWCxNQUFNLElBQU4sR0FBYyxNQUFNLEtBQU4sR0FBYyxDQUFkLEdBQW1CLE1BQU0sU0FBTixDQUFnQixDQUFoQixFQUNqQyxNQUFNLElBQU4sR0FBYSxNQUFNLFNBQU4sQ0FBZ0IsQ0FBaEIsQ0FGWCxDQURjO0FBSWxCLGlCQUFLLE9BQUwsQ0FBYSxTQUFiLEdBSmtCO0FBS2xCLGlCQUFLLE9BQUwsQ0FBYSxNQUFiLENBQW9CLFlBQVksQ0FBWixFQUFlLFlBQVksQ0FBWixDQUFuQyxDQUxrQjtBQU1sQixpQkFBSyxPQUFMLENBQWEsTUFBYixDQUFvQixPQUFPLENBQVAsRUFBVSxPQUFPLENBQVAsQ0FBOUIsQ0FOa0I7QUFPbEIsaUJBQUssT0FBTCxDQUFhLFNBQWIsR0FQa0I7QUFRbEIsaUJBQUssT0FBTCxDQUFhLFdBQWIsR0FBMkIsT0FBM0IsQ0FSa0I7QUFTbEIsaUJBQUssT0FBTCxDQUFhLE1BQWIsR0FUa0I7V0FBcEI7O0FBWUEsY0FBSSxlQUFlLFlBQVksR0FBWixJQUFtQixXQUFsQyxJQUFpRCxZQUFZLEdBQVosRUFBaUI7QUFDcEUsZ0JBQUksU0FBUyxLQUFLLE9BQUwsQ0FBYSxlQUFiLENBQ1gsSUFEVyxFQUNMLFdBREssRUFDUSxXQURSLENBQVQsQ0FEZ0U7QUFHcEUsc0JBQVUsT0FBTyxTQUFQLENBSDBEO1dBQXRFLE1BSU8sSUFBSSxlQUFlLFlBQVksR0FBWixFQUFpQjtBQUN6QyxzQkFBVSxJQUFWLENBRHlDO1dBQXBDLE1BRUE7QUFDTCxzQkFBVSxLQUFWLENBREs7V0FGQTtTQTlCVDtBQW9DQSxZQUFJLE9BQUosRUFBYTtBQUNYLG1CQUFTLElBQVQsQ0FBYyxJQUFkLEVBQW9CLEtBQXBCLEVBRFc7U0FBYjtPQXBFYSxFQXVFWixJQXZFSCxFQURpRDs7Ozs2QkEyRTFDLE1BQU0sYUFBYTs7O0FBQzFCLFVBQUksYUFBYSxFQUFiLENBRHNCO0FBRTFCLFVBQUksZ0JBQWdCLEVBQWhCLENBRnNCO0FBRzFCLFVBQUksNEJBQUosQ0FIMEI7QUFJMUIsVUFBSSxhQUFhLEVBQWIsQ0FKc0I7QUFLMUIsVUFBSSxXQUFXLEVBQUMsR0FBRyxFQUFILEVBQU8sR0FBRyxFQUFILEVBQW5CLENBTHNCO0FBTTFCLFVBQUksV0FBVyxFQUFYLENBTnNCO0FBTzFCLFVBQUksTUFBTSxFQUFDLEdBQUcsS0FBSyxJQUFMLEVBQVcsR0FBRyxLQUFLLElBQUwsRUFBeEIsQ0FQc0I7O0FBUzFCLG9CQUFjLENBQWQsR0FBa0IsS0FBSyxJQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsQ0FBYixDQVRMO0FBVTFCLG9CQUFjLENBQWQsR0FBa0IsS0FBSyxJQUFMLEdBQVksRUFBWixDQVZROztBQVkxQixVQUFJLGFBQWEsS0FBSyxhQUFMLENBQW1CLElBQW5CLENBQWI7O0FBWnNCLFVBY3RCLGtCQUFrQixFQUFsQjs7QUFkc0IsVUFnQnRCLEtBQUssSUFBTCxLQUFjLENBQUMsQ0FBRCxJQUFNLEtBQUssSUFBTCxLQUFjLENBQWQsRUFBaUI7QUFDdkMsMEJBQWtCLEVBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBZCxHQUFrQixLQUFLLFVBQUwsQ0FBbkIsR0FBc0MsQ0FBQyxLQUFLLElBQUw7QUFDMUMsYUFBRyxjQUFjLENBQWQsRUFEdEIsQ0FEdUM7T0FBekMsTUFHTyxJQUFJLEtBQUssSUFBTCxLQUFjLENBQUMsQ0FBRCxJQUFNLEtBQUssSUFBTCxLQUFjLENBQWQsRUFBaUI7QUFDOUMsMEJBQWtCLEVBQUMsR0FBRyxjQUFjLENBQWQ7QUFDSCxhQUFHLENBQUMsY0FBYyxDQUFkLEdBQWtCLEtBQUssVUFBTCxDQUFuQixHQUFzQyxDQUFDLEtBQUssSUFBTCxFQUQ3RCxDQUQ4QztPQUF6Qzs7QUFLUCxVQUFJLGNBQWMsS0FBSyxPQUFMLENBQWEsUUFBYixDQUFzQixnQkFBZ0IsQ0FBaEIsRUFDQSxnQkFBZ0IsQ0FBaEIsRUFDQSxjQUFjLENBQWQsRUFDQSxjQUFjLENBQWQsQ0FIcEMsQ0F4QnNCOztBQTZCMUIsVUFBSSxxQkFBcUIsS0FBSyxPQUFMLENBQWEsZUFBYixDQUE2QixXQUE3QixDQUFyQixDQTdCc0I7QUE4QjFCLFVBQUkscUJBQXFCLHFCQUFxQixVQUFyQixDQTlCQztBQStCMUIsVUFBSSxtQkFBbUIscUJBQXFCLFVBQXJCLENBL0JHO0FBZ0MxQixvQkFBYyxLQUFLLE9BQUwsQ0FBYSxRQUFiLENBQXNCLGtCQUF0QixFQUEwQyxLQUFLLFVBQUwsQ0FBeEQsQ0FoQzBCOztBQWtDMUIsVUFBSSxnQkFBZ0IsS0FBSyxPQUFMLENBQWEseUJBQWIsQ0FBdUMsYUFBdkMsRUFDbEIsV0FEa0IsRUFDTCxVQURLLENBQWhCLENBbENzQjtBQW9DMUIsVUFBSSxxQkFBSixDQXBDMEI7QUFxQzFCLFVBQUksaUJBQWlCLGNBQWMsR0FBZCxFQUFtQjs7QUFFdEMsdUJBQWUsbUJBQ2IsY0FBYyxNQUFkLENBQXFCLENBQXJCLEVBQXdCLGNBQWMsTUFBZCxDQUFxQixDQUFyQixDQUQxQixDQUZzQztPQUF4QyxNQUlPO0FBQ0wsdUJBQWUsbUJBQ2IsZ0JBQWdCLENBQWhCLEVBQW1CLGdCQUFnQixDQUFoQixDQURyQixDQURLO09BSlA7O0FBU0EsaUJBQVcsSUFBWCxDQUFnQixZQUFoQixFQTlDMEI7O0FBZ0QxQixVQUFJLHFCQUFKLENBaEQwQjtBQWlEMUIsNEJBQXNCLGtCQUF0QixDQWpEMEI7OztBQW9EeEIsWUFBSSxNQUFNLHVCQUF1QixrQkFBdkI7QUFDViwrQkFBdUIsR0FBdkI7QUFDQSxZQUFJLGNBQWMsS0FBSyxPQUFMLENBQWEsUUFBYixDQUFzQixtQkFBdEIsRUFDc0IsTUFBSyxVQUFMLENBRHBDO0FBRUosYUFBSyxPQUFMLENBQWEsaUJBQWIsQ0FBK0IsYUFBL0IsRUFBOEMsUUFBOUMsRUFBd0QsV0FBeEQsRUFDRSxVQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWtCO0FBQ2hCLGNBQUksVUFBVSxLQUFDLEdBQVEsS0FBSyxJQUFMLEdBQWEsS0FBdEIsQ0FERTtBQUVoQixjQUFJLFFBQVEsS0FBSyxVQUFMLENBQWdCLE9BQWhCLENBQVIsQ0FGWTtBQUdoQixjQUFJLEtBQUosRUFBVztBQUNULGdCQUFJLGVBQWUsS0FBSyxPQUFMLENBQWEsdUJBQWIsQ0FDakIsYUFEaUIsRUFDRixXQURFLEVBQ1csS0FEWCxDQUFmLENBREs7QUFHVCxnQkFBSSxnQkFBZ0IsYUFBYSxHQUFiLEVBQWtCO0FBQ3BDLDZCQUFlLG1CQUNmLGFBQWEsTUFBYixDQUFvQixDQUFwQixFQUF1QixhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsQ0FEdkIsQ0FEb0M7QUFHcEMseUJBQVcsSUFBWCxDQUFnQixZQUFoQixFQUhvQztBQUlwQyxxQkFBTyxLQUFQLENBSm9DO2FBQXRDO1dBSEY7U0FIRixDQURGO1FBeER3Qjs7QUFtRDFCLGFBQU8sc0JBQXNCLGdCQUF0QixFQUF3Qzs7T0FBL0M7O0FBcUJBLFdBQUssU0FBTCxDQUFlLFNBQWYsR0F4RTBCO0FBeUUxQixXQUFLLFNBQUwsQ0FBZSxNQUFmLENBQXNCLGNBQWMsQ0FBZCxFQUFpQixjQUFjLENBQWQsQ0FBdkMsQ0F6RTBCO0FBMEUxQixXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxXQUFXLE1BQVgsRUFBbUIsSUFBSSxFQUFKLEVBQVEsR0FBaEQsRUFBcUQ7QUFDbkQsYUFBSyxTQUFMLENBQWUsTUFBZixDQUFzQixXQUFXLENBQVgsRUFBYyxDQUFkLEVBQWlCLFdBQVcsQ0FBWCxFQUFjLENBQWQsQ0FBdkMsQ0FEbUQ7T0FBckQ7QUFHQSxXQUFLLFNBQUwsQ0FBZSxTQUFmLEdBN0UwQjtBQThFMUIsV0FBSyxTQUFMLENBQWUsU0FBZixHQUEyQiwwQkFBM0IsQ0E5RTBCO0FBK0UxQixXQUFLLFNBQUwsQ0FBZSxJQUFmLEdBL0UwQjs7OzsyQkFrRnJCLE1BQU0sYUFBYTtBQUN4QixVQUFJLFVBQVUsS0FBSyxpQkFBTCxDQUF1QixJQUF2QixDQUFWLENBRG9CO0FBRXhCLFVBQUksUUFBUSxJQUFSLEVBQWM7QUFDaEIsYUFBSyxJQUFMLEdBQVksUUFBUSxJQUFSLENBREk7T0FBbEI7QUFHQSxVQUFJLFFBQVEsSUFBUixFQUFjO0FBQ2hCLGFBQUssSUFBTCxHQUFZLFFBQVEsSUFBUixDQURJO09BQWxCOztBQUlBLFVBQUksS0FBSyxNQUFMLEVBQWE7QUFDZixZQUFJLFlBQVksaUJBQVEsS0FBSyxJQUFMLEVBQVcsS0FBSyxJQUFMLEVBQVcsS0FBSyxLQUFMLEVBQzVDLEtBQUssTUFBTCxDQURFLENBRFc7QUFHZixZQUFJLGVBQWU7QUFDakIsYUFBRyxJQUFDLENBQUssTUFBTCxHQUFjLFdBQWQsR0FBNkIsS0FBSyxJQUFMO0FBQ2pDLGFBQUcsSUFBQyxDQUFLLE1BQUwsR0FBYyxXQUFkLEdBQTZCLEtBQUssSUFBTDtTQUYvQixDQUhXO0FBT2YsWUFBSSxTQUFTLEtBQUssT0FBTCxDQUFhLGlCQUFiLENBQStCLFNBQS9CLEVBQTBDLFlBQTFDLEVBQ1gsS0FBSyxZQUFMLENBREUsQ0FQVztBQVNmLGFBQUssV0FBTCxHQUFtQjtBQUNqQixhQUFHLEtBQUssSUFBTDtBQUNILGFBQUcsS0FBSyxJQUFMO1NBRkwsQ0FUZTtBQWFmLFlBQUksVUFBVSxPQUFPLEdBQVAsRUFBWTtBQUN4QixlQUFLLElBQUwsR0FBWSxPQUFPLFNBQVAsQ0FBaUIsQ0FBakIsQ0FEWTtBQUV4QixlQUFLLElBQUwsR0FBWSxPQUFPLFNBQVAsQ0FBaUIsQ0FBakIsQ0FGWTtBQUd4QixlQUFLLElBQUwsR0FBWSxPQUFPLE1BQVAsQ0FBYyxDQUFkLEdBQW1CLEtBQUssS0FBTCxHQUFhLENBQWIsQ0FIUDtBQUl4QixlQUFLLElBQUwsR0FBWSxPQUFPLE1BQVAsQ0FBYyxDQUFkLEdBQW1CLEtBQUssTUFBTCxHQUFjLENBQWQsQ0FKUDtTQUExQixNQUtPO0FBQ0wsZUFBSyxJQUFMLElBQWEsYUFBYSxDQUFiLENBRFI7QUFFTCxlQUFLLElBQUwsSUFBYSxhQUFhLENBQWIsQ0FGUjtTQUxQO09BYkY7OztBQVR3QixVQWtDeEIsQ0FBSyxNQUFMLEdBQWMsV0FBVyxPQUFYLENBQW1CLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxDQUE1QyxDQWxDd0I7QUFtQ3hCLFdBQUssUUFBTCxHQUFnQixLQUFLLFNBQUwsQ0FBZSxLQUFLLE1BQUwsQ0FBL0IsQ0FuQ3dCOzs7O3lCQXNDckIsTUFBTSxhQUFhO0FBQ3RCLFVBQUksS0FBSyxRQUFMLEVBQWU7O0FBRWpCLFlBQUksWUFBWSxDQUFaO1lBQWUsWUFBWSxDQUFaLENBRkY7QUFHakIsWUFBSSxLQUFLLElBQUwsR0FBWSxLQUFLLEtBQUwsR0FBYSxLQUFLLE1BQUwsQ0FBWSxLQUFaLEVBQW1CO0FBQzlDLHNCQUFZLElBQUMsQ0FBSyxJQUFMLEdBQVksS0FBSyxLQUFMLEdBQWMsS0FBSyxNQUFMLENBQVksS0FBWixHQUFvQixLQUFLLEtBQUwsQ0FEYjtTQUFoRDtBQUdBLFlBQUksS0FBSyxJQUFMLEdBQVksQ0FBWixFQUFlO0FBQ2pCLHNCQUFZLEtBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsS0FBSyxJQUFMLENBRGY7U0FBbkI7QUFHQSxZQUFJLEtBQUssSUFBTCxHQUFZLENBQVosRUFBZTtBQUNqQixzQkFBWSxLQUFLLE1BQUwsQ0FBWSxNQUFaLEdBQXFCLEtBQUssTUFBTCxJQUFlLEtBQUssTUFBTCxHQUNBLEtBQUssSUFBTCxDQURwQyxDQURLO1NBQW5CO0FBSUEsWUFBSSxJQUFDLENBQUssSUFBTCxHQUFZLEtBQUssTUFBTCxHQUFlLEtBQUssTUFBTCxDQUFZLE1BQVosRUFBb0I7QUFDbEQsc0JBQVksSUFBQyxDQUFLLElBQUwsR0FBWSxLQUFLLE1BQUwsR0FDWixLQUFLLE1BQUwsQ0FBWSxNQUFaLEdBQXFCLEtBQUssTUFBTCxDQUZnQjtTQUFwRDs7QUFLQSxZQUFJLGNBQWMsQ0FBZCxJQUFtQixjQUFjLENBQWQsRUFBaUI7QUFDdEMsY0FBSSxjQUFjLENBQWQsRUFBaUI7QUFDbkIsd0JBQVksS0FBSyxJQUFMLENBRE87V0FBckI7QUFHQSxjQUFJLGNBQWMsQ0FBZCxFQUFpQjtBQUNuQix3QkFBWSxLQUFLLElBQUwsQ0FETztXQUFyQjs7QUFJQSxlQUFLLE9BQUwsQ0FBYSxTQUFiLENBQXVCLEtBQUssUUFBTCxFQUFlLFNBQXRDLEVBQWlELEtBQUssSUFBTCxFQUMvQyxLQUFLLEtBQUwsRUFBWSxLQUFLLE1BQUwsQ0FEZCxDQVJzQzs7QUFXdEMsZUFBSyxPQUFMLENBQWEsU0FBYixDQUF1QixLQUFLLFFBQUwsRUFBZSxLQUFLLElBQUwsRUFBVyxTQUFqRCxFQUNFLEtBQUssS0FBTCxFQUFZLEtBQUssTUFBTCxDQURkLENBWHNDOztBQWN0QyxlQUFLLE9BQUwsQ0FBYSxTQUFiLENBQXVCLEtBQUssUUFBTCxFQUFlLFNBQXRDLEVBQWlELFNBQWpELEVBQ0UsS0FBSyxLQUFMLEVBQVksS0FBSyxNQUFMLENBRGQsQ0Fkc0M7U0FBeEM7QUFpQkEsYUFBSyxPQUFMLENBQWEsU0FBYixDQUF1QixLQUFLLFFBQUwsRUFBZSxLQUFLLElBQUwsRUFBVyxLQUFLLElBQUwsRUFDL0MsS0FBSyxLQUFMLEVBQVksS0FBSyxNQUFMLENBRGQsQ0FuQ2lCO09BQW5COzs7O0FBRHNCLFVBMENsQixLQUFLLFNBQUwsRUFBZ0I7QUFDbEIsWUFBSSxLQUFLLEtBQUssSUFBTCxDQURTO0FBRWxCLFlBQUksS0FBSyxLQUFLLElBQUwsQ0FGUztBQUdsQixZQUFJLEtBQUssS0FBSyxJQUFMLEdBQVksS0FBSyxLQUFMLENBSEg7QUFJbEIsWUFBSSxLQUFLLEtBQUssSUFBTCxHQUFZLEtBQUssTUFBTCxDQUpIOztBQU1sQixhQUFLLE9BQUwsQ0FBYSxTQUFiLEdBTmtCO0FBT2xCLGFBQUssT0FBTCxDQUFhLE1BQWIsQ0FBb0IsRUFBcEIsRUFBd0IsRUFBeEIsRUFQa0I7QUFRbEIsYUFBSyxPQUFMLENBQWEsTUFBYixDQUFvQixFQUFwQixFQUF3QixFQUF4QixFQVJrQjtBQVNsQixhQUFLLE9BQUwsQ0FBYSxNQUFiLENBQW9CLEVBQXBCLEVBQXdCLEVBQXhCLEVBVGtCO0FBVWxCLGFBQUssT0FBTCxDQUFhLE1BQWIsQ0FBb0IsRUFBcEIsRUFBd0IsRUFBeEIsRUFWa0I7QUFXbEIsYUFBSyxPQUFMLENBQWEsU0FBYixHQVhrQjtBQVlsQixhQUFLLE9BQUwsQ0FBYSxXQUFiLEdBQTJCLEtBQUssVUFBTCxDQVpUO0FBYWxCLGFBQUssT0FBTCxDQUFhLE1BQWIsR0Fia0I7QUFjbEIsYUFBSyxPQUFMLENBQWEsSUFBYixHQUFvQixjQUFwQixDQWRrQjtBQWVsQixhQUFLLE9BQUwsQ0FBYSxTQUFiLEdBQXlCLE1BQXpCLENBZmtCO0FBZ0JsQixhQUFLLE9BQUwsQ0FBYSxRQUFiLENBQ0UsTUFBTSxLQUFLLEtBQUwsQ0FBVyxLQUFLLElBQUwsQ0FBakIsR0FBOEIsR0FBOUIsR0FDQSxHQURBLEdBQ00sS0FBSyxLQUFMLENBQVcsS0FBSyxJQUFMLENBRGpCLEdBQzhCLEdBRDlCLEdBRUEsS0FBSyxJQUFMLEdBQVksR0FGWixHQUVrQixLQUFLLElBQUwsRUFDbEIsS0FBSyxJQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsQ0FBYixFQUNiLEtBQUssSUFBTCxJQUFhLEtBQUssTUFBTCxHQUFjLEVBQWQsQ0FBYixDQUxGLENBaEJrQjtPQUFwQjs7OztTQWpXUzs7Ozs7QUNqQ2I7Ozs7Ozs7OztBQUVBOzs7O0lBRWE7QUFDWCxXQURXLElBQ1gsQ0FBWSxNQUFaLEVBQW9COzBCQURULE1BQ1M7O0FBQ2xCLFNBQUssS0FBTCxHQUFhLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQXBCLENBRGtCO0FBRWxCLFNBQUssV0FBTCxHQUFtQixLQUFuQixDQUZrQjtBQUdsQixTQUFLLFNBQUwsR0FBaUIsS0FBakIsQ0FIa0I7QUFJbEIsU0FBSyxNQUFMLEdBQWMsRUFBZCxDQUprQjtBQUtsQixTQUFLLFlBQUwsR0FBb0IsS0FBcEIsQ0FMa0I7QUFNbEIsU0FBSyxNQUFMLEdBQWMsRUFBZCxDQU5rQjtBQU9sQixTQUFLLE9BQUwsR0FBZSxFQUFmLENBUGtCO0FBUWxCLFNBQUssUUFBTCxHQUFnQixFQUFoQixDQVJrQjtBQVNsQixTQUFLLE1BQUwsR0FBYyxNQUFkLENBVGtCO0FBVWxCLFNBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsT0FBTyxVQUFQLENBVkY7QUFXbEIsU0FBSyxNQUFMLENBQVksTUFBWixHQUFxQixPQUFPLFdBQVAsQ0FYSDtBQVlsQixTQUFLLE9BQUwsR0FBZSxLQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLElBQXZCLENBQWYsQ0Faa0I7R0FBcEI7O2VBRFc7OzhCQWdCRCxTQUFTLFNBQVM7QUFDMUIsV0FBSyxPQUFMLENBQWEsT0FBYixJQUF3QixLQUF4QixDQUQwQjtBQUUxQixXQUFLLFFBQUwsQ0FBYyxPQUFkLElBQXlCLE9BQXpCLENBRjBCOzs7OzhCQUtsQixLQUFLLEtBQUs7QUFDbEIsYUFBTyxLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsTUFBaUIsTUFBTSxHQUFOLEdBQVksQ0FBWixDQUFqQixHQUFrQyxHQUFsQyxDQUFsQixDQURrQjs7Ozs7OzsrQkFLVCxZQUFZLFFBQVE7QUFDN0IsVUFBSSxlQUFlLEVBQWYsQ0FEeUI7QUFFN0IsVUFBSSxPQUFPLElBQVAsQ0FGeUI7QUFHN0IsVUFBSSxlQUFlLENBQWYsQ0FIeUI7QUFJN0IsVUFBSSxZQUFZLENBQVosQ0FKeUI7O0FBTTdCLFVBQUksa0JBQWtCLFNBQWxCLGVBQWtCLENBQVMsR0FBVCxFQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0I7QUFDeEMsb0JBRHdDO0FBRXhDLFlBQUksWUFBWSxJQUFJLEtBQUosRUFBWixDQUZvQztBQUd4QyxZQUFJLGFBQWEsU0FBUyxhQUFULENBQXVCLFFBQXZCLENBQWIsQ0FIb0M7QUFJeEMsWUFBSSxjQUFjLFdBQVcsVUFBWCxDQUFzQixJQUF0QixDQUFkLENBSm9DO0FBS3hDLG1CQUFXLEtBQVgsR0FBbUIsQ0FBbkIsQ0FMd0M7QUFNeEMsbUJBQVcsTUFBWCxHQUFvQixDQUFwQixDQU53QztBQU94QyxvQkFBWSxTQUFaLENBQXNCLENBQXRCLEVBQXlCLENBQXpCLEVBUHdDO0FBUXhDLG9CQUFZLEtBQVosQ0FBa0IsQ0FBQyxDQUFELEVBQUksQ0FBdEIsRUFSd0M7QUFTeEMsb0JBQVksU0FBWixDQUFzQixHQUF0QixFQUEyQixDQUEzQixFQUE4QixDQUE5QixFQVR3QztBQVV4QyxrQkFBVSxNQUFWLEdBQW1CLGFBQW5CLENBVndDO0FBV3hDLGtCQUFVLEdBQVYsR0FBZ0IsV0FBVyxTQUFYLEVBQWhCLENBWHdDO0FBWXhDLGVBQU8sU0FBUCxDQVp3QztPQUFwQixDQU5POztBQXFCN0IsVUFBSSxnQkFBZ0IsU0FBaEIsYUFBZ0IsR0FBVztBQUM3Qix1QkFENkI7QUFFN0IsZ0JBQVEsR0FBUixDQUFZLGNBQVosRUFBNEIsWUFBNUIsRUFBMEMsSUFBMUMsRUFBZ0QsU0FBaEQsRUFGNkI7QUFHN0IsWUFBSSxpQkFBaUIsU0FBakIsRUFBNEI7QUFDOUIsZUFBSyxZQUFMLEdBQW9CLElBQXBCLENBRDhCO1NBQWhDO09BSGtCLENBckJTOztBQTZCN0IsVUFBSSxZQUFZLFNBQVosU0FBWSxDQUFTLEdBQVQsRUFBYyxRQUFkLEVBQXdCO0FBQ3RDLFlBQUksUUFBUSxJQUFJLEtBQUosRUFBUixDQURrQztBQUV0QyxjQUFNLE1BQU4sR0FBZSxZQUFXO0FBQ3hCLGNBQUksUUFBSixFQUFjO0FBQ1oscUJBQVMsSUFBVCxDQUFjLEtBQWQsRUFEWTtXQUFkO0FBR0EsMEJBSndCO1NBQVgsQ0FGdUI7QUFRdEMscUJBQWEsSUFBYixDQUFrQixFQUFDLE9BQU8sS0FBUCxFQUFjLEtBQUssR0FBTCxFQUFqQyxFQVJzQztBQVN0QyxlQUFPLEtBQVAsQ0FUc0M7T0FBeEIsQ0E3QmE7O0FBeUM3QixVQUFJLG9CQUFvQixTQUFwQixpQkFBb0IsR0FBVztBQUNqQyxhQUFLLEdBQUwsR0FBVyxnQkFBZ0IsSUFBaEIsRUFBc0IsS0FBSyxLQUFMLEVBQVksS0FBSyxNQUFMLENBQTdDLENBRGlDO09BQVgsQ0F6Q0s7O0FBNkM3QixXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxXQUFXLE1BQVgsRUFBbUIsSUFBSSxFQUFKLEVBQVEsR0FBaEQsRUFBcUQ7O0FBRW5ELFlBQUksWUFBWSxXQUFXLENBQVgsQ0FBWixDQUYrQztBQUduRCxZQUFJLFFBQVEsS0FBSyxNQUFMLENBQVksVUFBVSxJQUFWLENBQVosR0FBOEIsVUFDeEMsVUFBVSxLQUFWLEVBQ0EsaUJBRndDLENBQTlCLENBSHVDOztBQU9uRCxZQUFJLFVBQVUsT0FBVixFQUFtQjtBQUNyQixnQkFBTSxFQUFOLEdBQVcsVUFBVSxVQUFVLE9BQVYsQ0FBckIsQ0FEcUI7U0FBdkIsTUFFTztBQUNMLGdCQUFNLEVBQU4sR0FBVyxLQUFYLENBREs7U0FGUDs7QUFNQSxZQUFJLFVBQVUsU0FBVixFQUFxQjtBQUN2QixnQkFBTSxJQUFOLEdBQWEsVUFBVSxVQUFVLFNBQVYsQ0FBdkIsQ0FEdUI7U0FBekIsTUFFTztBQUNMLGdCQUFNLElBQU4sR0FBYSxLQUFiLENBREs7U0FGUDs7QUFNQSxjQUFNLENBQU4sR0FBVSxVQUFVLENBQVYsQ0FuQnlDO0FBb0JuRCxjQUFNLENBQU4sR0FBVSxVQUFVLENBQVYsQ0FwQnlDO09BQXJEOztBQXVCQSxXQUFLLElBQUksR0FBSixJQUFXLE1BQWhCLEVBQXdCO0FBQ3RCLFlBQUksT0FBTyxjQUFQLENBQXNCLEdBQXRCLENBQUosRUFBZ0M7QUFDOUIsZUFBSyxHQUFMLElBQVksVUFBVSxPQUFPLEdBQVAsQ0FBVixDQUFaLENBRDhCO1NBQWhDO09BREY7O0FBTUEsa0JBQVksYUFBYSxNQUFiLENBMUVpQjtBQTJFN0IsV0FBSyxJQUFJLEtBQUksQ0FBSixFQUFPLE1BQUssYUFBYSxNQUFiLEVBQXFCLEtBQUksR0FBSixFQUFRLElBQWxELEVBQXVEO0FBQ3JELHFCQUFhLEVBQWIsRUFBZ0IsS0FBaEIsQ0FBc0IsR0FBdEIsR0FBNEIsYUFBYSxFQUFiLEVBQWdCLEdBQWhCLENBRHlCO09BQXZEOzs7OzhCQUtRLFVBQVUsU0FBUztBQUMzQixXQUFLLElBQUksQ0FBSixJQUFTLEtBQUssTUFBTCxFQUFhO0FBQ3pCLFlBQUksS0FBSyxNQUFMLENBQVksY0FBWixDQUEyQixDQUEzQixDQUFKLEVBQW1DO0FBQ2pDLG1CQUFTLElBQVQsQ0FBYyxPQUFkLEVBQXVCLEtBQUssTUFBTCxDQUFZLENBQVosQ0FBdkIsRUFEaUM7U0FBbkM7T0FERjs7OzsrQkFPUyxhQUFhO0FBQ3RCLFdBQUssT0FBTCxHQUFlLHFCQUFZLElBQVosQ0FBZixDQURzQjtBQUV0QixXQUFLLFdBQUwsR0FBbUIsSUFBbkIsQ0FGc0I7Ozs7eUJBS25CLGFBQWE7QUFDaEIsV0FBSyxPQUFMLENBQWEsU0FBYixDQUF1QixDQUF2QixFQUEwQixDQUExQixFQUE2QixLQUFLLE1BQUwsQ0FBWSxLQUFaLEVBQW1CLEtBQUssTUFBTCxDQUFZLE1BQVosQ0FBaEQsQ0FEZ0I7QUFFaEIsV0FBSyxTQUFMLENBQWUsVUFBUyxLQUFULEVBQWdCO0FBQzdCLGNBQU0sSUFBTixDQUFXLElBQVgsRUFBaUIsV0FBakIsRUFENkI7T0FBaEIsRUFFWixJQUZILEVBRmdCOzs7O2tDQU9KOzs7MkJBRVAsYUFBYTtBQUNsQixXQUFLLFNBQUwsR0FEa0I7QUFFbEIsV0FBSyxTQUFMLENBQWUsVUFBUyxLQUFULEVBQWdCO0FBQzdCLFlBQUksTUFBTSxNQUFOLEVBQWM7QUFDaEIsZ0JBQU0sTUFBTixDQUFhLElBQWIsRUFBbUIsV0FBbkIsRUFEZ0I7U0FBbEI7T0FEYSxFQUlaLElBSkgsRUFGa0I7Ozs7eUJBU2YsYUFBYTtBQUNoQixVQUFJLEtBQUssWUFBTCxFQUFtQjtBQUNyQixZQUFJLENBQUMsS0FBSyxXQUFMLEVBQWtCO0FBQ3JCLGVBQUssVUFBTCxDQUFnQixXQUFoQixFQURxQjtTQUF2QjtBQUdBLGFBQUssSUFBTCxDQUFVLFdBQVYsRUFKcUI7QUFLckIsYUFBSyxNQUFMLENBQVksV0FBWixFQUxxQjtPQUF2QixNQU1PO0FBQ0wsYUFBSyxXQUFMLEdBREs7T0FOUDs7Ozs4QkFXUSxPQUFPO0FBQ2YsWUFBTSxjQUFOLEdBRGU7QUFFZixVQUFJLE1BQU0sTUFBTSxPQUFOLENBRks7QUFHZixVQUFJLEtBQUssUUFBTCxDQUFjLGNBQWQsQ0FBNkIsR0FBN0IsQ0FBSixFQUF1QztBQUNyQyxhQUFLLE9BQUwsQ0FBYSxLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWIsSUFBbUMsSUFBbkMsQ0FEcUM7T0FBdkM7Ozs7NEJBS00sT0FBTztBQUNiLFlBQU0sY0FBTixHQURhO0FBRWIsVUFBSSxNQUFNLE1BQU0sT0FBTixDQUZHO0FBR2IsVUFBSSxLQUFLLFFBQUwsQ0FBYyxjQUFkLENBQTZCLEdBQTdCLENBQUosRUFBdUM7QUFDckMsYUFBSyxPQUFMLENBQWEsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFiLElBQW1DLEtBQW5DLENBRHFDO09BQXZDOzs7O2dDQUtVLE9BQU87QUFDakIsV0FBSyxLQUFMLENBQVcsQ0FBWCxHQUFlLE1BQU0sS0FBTixHQUFjLEtBQUssTUFBTCxDQUFZLFVBQVosQ0FEWjtBQUVqQixXQUFLLEtBQUwsQ0FBVyxDQUFYLEdBQWUsTUFBTSxLQUFOLEdBQWMsS0FBSyxNQUFMLENBQVksU0FBWixDQUZaOzs7OzZCQUtWLE9BQU87QUFDZCxXQUFLLE9BQUwsR0FBZSxLQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLElBQXZCLENBQWYsQ0FEYztBQUVkLFdBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsT0FBTyxVQUFQLENBRk47QUFHZCxXQUFLLE1BQUwsQ0FBWSxNQUFaLEdBQXFCLE9BQU8sV0FBUCxDQUhQOzs7OzZCQU1QLE9BQU8sV0FBVztBQUN6QixVQUFJLEtBQUssU0FBTCxJQUFrQixTQUFsQixFQUE2QjtBQUMvQixhQUFLLGVBQUwsR0FBdUIsQ0FBdkIsQ0FEK0I7T0FBakMsTUFFTztBQUNMLGFBQUssZUFBTCxHQUF1QixFQUF2QixDQURLO09BRlA7Ozs7U0FqTFM7Ozs7O0FDSmI7Ozs7Ozs7Ozs7O29CQUVROzs7Ozs7b0JBQVM7Ozs7OztvQkFBSzs7Ozs7O29CQUFPOzs7Ozs7Ozs7aUJBQ3JCOzs7Ozs7Ozs7aUJBQ0E7Ozs7Ozs7OztrQkFDQTs7Ozs7O2tCQUFPOzs7Ozs7QUNMZjs7Ozs7QUFFTyxJQUFNLHNCQUFPO0FBQ2xCLE1BQUksRUFBSjtBQUNBLFFBQU0sRUFBTjtBQUNBLFFBQU0sRUFBTjtBQUNBLFNBQU8sRUFBUDtBQUNBLEtBQUcsRUFBSDtBQUNBLEtBQUcsRUFBSDtBQUNBLEtBQUcsRUFBSDtBQUNBLEtBQUcsRUFBSDtBQUNBLFNBQU8sRUFBUDtDQVRXOzs7O0FDRmI7Ozs7Ozs7Ozs7SUFFYTtBQUNYLFdBRFcsR0FDWCxDQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLENBQWxCLEVBQXFCLENBQXJCLEVBQXdCOzBCQURiLEtBQ2E7O0FBQ3RCLFNBQUssQ0FBTCxHQUFTLENBQVQsQ0FEc0I7QUFFdEIsU0FBSyxDQUFMLEdBQVMsQ0FBVCxDQUZzQjtBQUd0QixTQUFLLENBQUwsR0FBUyxDQUFULENBSHNCO0FBSXRCLFNBQUssQ0FBTCxHQUFTLENBQVQsQ0FKc0I7R0FBeEI7O2VBRFc7OzRCQVFILFVBQVUsVUFBVTtBQUMxQixhQUFPLElBQUksR0FBSixDQUNMLEtBQUssQ0FBTCxHQUFTLFdBQVcsQ0FBWCxFQUNULEtBQUssQ0FBTCxHQUFTLFdBQVcsQ0FBWCxFQUNULEtBQUssQ0FBTCxHQUFTLFFBQVQsRUFDQSxLQUFLLENBQUwsR0FBUyxRQUFULENBSkYsQ0FEMEI7Ozs7U0FSakI7OztJQWlCQSx3QkFDWCxTQURXLEtBQ1gsQ0FBWSxDQUFaLEVBQWUsQ0FBZixFQUFrQjt3QkFEUCxPQUNPOztBQUNoQixPQUFLLENBQUwsR0FBUyxDQUFULENBRGdCO0FBRWhCLE9BQUssQ0FBTCxHQUFTLENBQVQsQ0FGZ0I7Q0FBbEI7O0FBTUssSUFBTSw0QkFBVSxJQUFJLEVBQUo7O0lBRVY7QUFDWCxXQURXLE9BQ1gsQ0FBWSxJQUFaLEVBQWtCOzBCQURQLFNBQ087O0FBQ2hCLFNBQUssSUFBTCxHQUFZLElBQVosQ0FEZ0I7R0FBbEI7O2VBRFc7OzhCQUtELEdBQUcsR0FBRyxPQUFPLE1BQU07QUFDM0IsYUFBTyxRQUFRLENBQVIsQ0FEb0I7QUFFM0IsV0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixTQUFsQixHQUE4QixLQUE5QixDQUYyQjtBQUczQixXQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLFFBQWxCLENBQTJCLElBQUssT0FBTyxDQUFQLEVBQVcsSUFBSyxPQUFPLENBQVAsRUFBVyxJQUEzRCxFQUFpRSxJQUFqRSxFQUgyQjs7Ozs2QkFNcEIsSUFBSSxJQUFJLElBQUksSUFBSSxPQUFPO0FBQzlCLFdBQUssSUFBTCxDQUFVLE9BQVYsQ0FBa0IsU0FBbEIsR0FEOEI7QUFFOUIsV0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixNQUFsQixDQUF5QixFQUF6QixFQUE2QixFQUE3QixFQUY4QjtBQUc5QixXQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLE1BQWxCLENBQXlCLEVBQXpCLEVBQTZCLEVBQTdCLEVBSDhCO0FBSTlCLFdBQUssSUFBTCxDQUFVLE9BQVYsQ0FBa0IsU0FBbEIsR0FKOEI7QUFLOUIsV0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixXQUFsQixHQUFnQyxLQUFoQyxDQUw4QjtBQU05QixXQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLE1BQWxCLEdBTjhCOzs7OzZCQVN2QixHQUFHLEdBQUcsTUFBTSxPQUFPO0FBQzFCLGNBQVEsU0FBUyxPQUFULENBRGtCO0FBRTFCLFdBQUssSUFBTCxDQUFVLE9BQVYsQ0FBa0IsSUFBbEIsR0FBeUIsWUFBekIsQ0FGMEI7QUFHMUIsV0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixTQUFsQixHQUE4QixLQUE5QixDQUgwQjtBQUkxQixXQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLFFBQWxCLENBQTJCLElBQTNCLEVBQWlDLENBQWpDLEVBQW9DLENBQXBDLEVBSjBCOzs7OzRCQU9wQixHQUFHLEdBQUcsR0FBRyxHQUFHLE9BQU87QUFDekIsY0FBUSxTQUFTLE9BQVQsQ0FEaUI7QUFFekIsV0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixXQUFsQixHQUFnQyxLQUFoQyxDQUZ5QjtBQUd6QixXQUFLLElBQUwsQ0FBVSxPQUFWLENBQWtCLFVBQWxCLENBQTZCLENBQTdCLEVBQWdDLENBQWhDLEVBQW1DLENBQW5DLEVBQXNDLENBQXRDLEVBSHlCOzs7OzZCQU1sQixJQUFJLElBQUksSUFBSSxJQUFJO0FBQ3ZCLGFBQU8sRUFBQyxHQUFHLEtBQUssRUFBTCxFQUFTLEdBQUcsS0FBSyxFQUFMLEVBQXZCLENBRHVCOzs7OzRDQUlELFlBQVksY0FBYyxXQUFXLE9BQU87O0FBRWxFLFVBQUksWUFBSixFQUFrQixXQUFsQixDQUZrRTtBQUdsRSxVQUFJLGFBQWEsQ0FBYixJQUFrQixDQUFsQixFQUFxQjs7QUFFdkIsdUJBQWUsQ0FBQyxVQUFVLENBQVYsR0FBYyxXQUFXLENBQVgsQ0FBZixHQUErQixhQUFhLENBQWIsQ0FGdkI7QUFHdkIsc0JBQWMsQ0FBQyxTQUFDLENBQVUsQ0FBVixHQUFjLFVBQVUsQ0FBVixHQUNmLFdBQVcsQ0FBWCxDQURELEdBQ2lCLGFBQWEsQ0FBYixDQUpSO09BQXpCLE1BS087O0FBRUwsdUJBQ0UsQ0FBQyxTQUFDLENBQVUsQ0FBVixHQUFjLFVBQVUsQ0FBVixHQUFlLFdBQVcsQ0FBWCxDQUEvQixHQUErQyxhQUFhLENBQWIsQ0FINUM7QUFJTCxzQkFBYyxDQUFDLFVBQVUsQ0FBVixHQUFjLFdBQVcsQ0FBWCxDQUFmLEdBQStCLGFBQWEsQ0FBYixDQUp4QztPQUxQOztBQVlBLFVBQUksWUFBSixFQUFrQixXQUFsQixDQWZrRTtBQWdCbEUsVUFBSSxhQUFhLENBQWIsSUFBa0IsQ0FBbEIsRUFBcUI7O0FBRXZCLHVCQUFlLENBQUMsVUFBVSxDQUFWLEdBQWMsV0FBVyxDQUFYLENBQWYsR0FBK0IsYUFBYSxDQUFiLENBRnZCO0FBR3ZCLHNCQUFjLENBQUMsU0FBQyxDQUFVLENBQVYsR0FBYyxVQUFVLENBQVYsR0FDaEIsV0FBVyxDQUFYLENBREEsR0FDZ0IsYUFBYSxDQUFiLENBSlA7T0FBekIsTUFLTzs7QUFFTCx1QkFDRSxDQUFDLFNBQUMsQ0FBVSxDQUFWLEdBQWMsVUFBVSxDQUFWLEdBQWUsV0FBVyxDQUFYLENBQS9CLEdBQStDLGFBQWEsQ0FBYixDQUg1QztBQUlMLHNCQUFjLENBQUMsVUFBVSxDQUFWLEdBQWMsV0FBVyxDQUFYLENBQWYsR0FBK0IsYUFBYSxDQUFiLENBSnhDO09BTFA7OztBQWhCa0UsVUE2QjlELFdBQUosQ0E3QmtFO0FBOEJsRSxVQUFJLGVBQWUsWUFBZixFQUE2QjtBQUMvQixzQkFBYyxZQUFkLENBRCtCO09BQWpDLE1BRU87QUFDTCxzQkFBYyxZQUFkLENBREs7T0FGUDs7O0FBOUJrRSxVQXFDOUQsVUFBSixDQXJDa0U7QUFzQ2xFLFVBQUksY0FBYyxXQUFkLEVBQTJCO0FBQzdCLHFCQUFhLFdBQWIsQ0FENkI7T0FBL0IsTUFFTztBQUNMLHFCQUFhLFdBQWIsQ0FESztPQUZQOztBQU1BLFVBQUksR0FBSixDQTVDa0U7QUE2Q2xFLFVBQUksZUFBZSxXQUFmLElBQThCLGVBQWUsV0FBZixFQUE0Qjs7OztBQUk1RCxjQUFNLEtBQU4sQ0FKNEQ7T0FBOUQsTUFLTyxJQUFJLGNBQWMsQ0FBZCxFQUFpQjs7QUFFMUIsY0FBTSxLQUFOLENBRjBCO09BQXJCLE1BR0EsSUFBSSxhQUFhLENBQWIsRUFBZ0I7O0FBRXpCLGNBQU0sS0FBTixDQUZ5QjtPQUFwQixNQUdBO0FBQ0wsY0FBTSxJQUFOLENBREs7T0FIQTs7QUFPUCxVQUFJLGFBQWEsV0FBYixDQTVEOEQ7QUE2RGxFLFVBQUksWUFBWSxFQUFaLENBN0Q4RDtBQThEbEUsVUFBSSxlQUFlLFlBQWYsRUFBNkI7O0FBRS9CLFlBQUksYUFBYSxDQUFiLElBQWtCLENBQWxCLEVBQXFCOztBQUV2QixvQkFBVSxDQUFWLEdBQWMsQ0FBQyxDQUFELENBRlM7U0FBekIsTUFHTzs7QUFFTCxvQkFBVSxDQUFWLEdBQWMsQ0FBZCxDQUZLO1NBSFA7QUFPQSxrQkFBVSxDQUFWLEdBQWMsQ0FBZCxDQVQrQjtPQUFqQyxNQVVPOztBQUVMLGtCQUFVLENBQVYsR0FBYyxDQUFkLENBRks7QUFHTCxZQUFJLGFBQWEsQ0FBYixJQUFrQixDQUFsQixFQUFxQjs7QUFFdkIsb0JBQVUsQ0FBVixHQUFjLENBQUMsQ0FBRCxDQUZTO1NBQXpCLE1BR087O0FBRUwsb0JBQVUsQ0FBVixHQUFjLENBQWQsQ0FGSztTQUhQO09BYkY7QUFxQkEsVUFBSSxhQUFhLENBQWIsRUFBZ0I7QUFDbEIscUJBQWEsQ0FBYixDQURrQjtPQUFwQjs7QUFJQSxVQUFJLFNBQVM7QUFDWCxXQUFHLFdBQVcsQ0FBWCxHQUFnQixhQUFhLENBQWIsR0FBaUIsVUFBakI7QUFDbkIsV0FBRyxXQUFXLENBQVgsR0FBZ0IsYUFBYSxDQUFiLEdBQWlCLFVBQWpCO09BRmpCLENBdkY4RDs7QUE0RmxFLGFBQU8sQ0FBUCxJQUFZLFVBQVUsQ0FBVixHQUFjLE9BQWQsQ0E1RnNEO0FBNkZsRSxhQUFPLENBQVAsSUFBWSxVQUFVLENBQVYsR0FBYyxPQUFkLENBN0ZzRDs7QUErRmxFLFVBQUksU0FBVTtBQUNaLGFBQUssR0FBTDtBQUNBLG1CQUFXLFNBQVg7QUFDQSxvQkFBWSxVQUFaO0FBQ0EsZ0JBQVEsTUFBUjtBQUNBLHFCQUFhLFdBQWI7QUFDQSxzQkFBYyxZQUFkO0FBQ0Esc0JBQWMsWUFBZDtBQUNBLG9CQUFZLFVBQVo7QUFDQSxxQkFBYSxXQUFiO0FBQ0EscUJBQWEsV0FBYjtBQUNBLGdCQUFRLFNBQVI7T0FYRTs7Ozs7Ozs7Ozs7O0FBL0Y4RCxhQXVIM0QsTUFBUCxDQXZIa0U7Ozs7b0NBMEhwRCxXQUFXLGNBQWMsV0FBVztBQUNsRCxVQUFJLGFBQWE7QUFDZixXQUFHLFVBQVUsQ0FBVixHQUFjLFVBQVUsQ0FBVixHQUFjLENBQWQ7QUFDakIsV0FBRyxVQUFVLENBQVYsR0FBYyxVQUFVLENBQVYsR0FBYyxDQUFkO09BRmYsQ0FEOEM7O0FBTWxELFVBQUksWUFBWSxJQUFJLEdBQUosQ0FDZCxVQUFVLENBQVYsR0FBYyxVQUFVLENBQVYsR0FBYyxDQUFkLEVBQ2QsVUFBVSxDQUFWLEdBQWMsVUFBVSxDQUFWLEdBQWMsQ0FBZCxFQUNkLFVBQVUsQ0FBVixHQUFjLFVBQVUsQ0FBVixFQUNkLFVBQVUsQ0FBVixHQUFjLFVBQVUsQ0FBVixDQUpaLENBTjhDO0FBV2xELFVBQUksU0FBUyxLQUFLLHVCQUFMLENBQTZCLFVBQTdCLEVBQXlDLFlBQXpDLEVBQ1gsU0FEVyxDQUFULENBWDhDO0FBYWxELGFBQU8sTUFBUCxDQWJrRDs7Ozs4Q0FnQjFCLFlBQVksY0FBYyxhQUFhLE9BQU87QUFDdEUsVUFBSSxhQUFhLENBQWIsQ0FEa0U7QUFFdEUsVUFBSSxZQUFZLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsTUFBakIsRUFBeUIsTUFBekIsRUFBaUMsTUFBakMsRUFBeUMsTUFBekMsRUFBaUQsTUFBakQsQ0FBWixDQUZrRTtBQUd0RSxVQUFJLGdCQUFnQixJQUFoQixDQUhrRTtBQUl0RSxXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxZQUFZLE1BQVosRUFBb0IsSUFBSSxFQUFKLEVBQVEsR0FBakQsRUFBc0Q7QUFDcEQsWUFBSSxZQUFZLFlBQVksQ0FBWixDQUFaLENBRGdEO0FBRXBELFlBQUksU0FBUyxLQUFLLHVCQUFMLENBQTZCLFVBQTdCLEVBQXlDLFlBQXpDLEVBQ1gsU0FEVyxDQUFULENBRmdEO0FBSXBELFlBQUksT0FBTyxHQUFQLEVBQVk7QUFDZCxjQUFJLEtBQUosRUFBVztBQUNULGlCQUFLLFNBQUwsQ0FBZSxPQUFPLE1BQVAsQ0FBYyxDQUFkLEVBQWlCLE9BQU8sTUFBUCxDQUFjLENBQWQsRUFDakIsVUFBVSxhQUFhLFVBQVUsTUFBVixDQUR0QyxFQUN5RCxDQUR6RCxFQURTO0FBR1QsaUJBQUssUUFBTCxDQUFjLFdBQVcsQ0FBWCxFQUFjLFdBQVcsQ0FBWCxFQUNkLFdBQVcsQ0FBWCxHQUFlLGFBQWEsQ0FBYixFQUNmLFdBQVcsQ0FBWCxHQUFlLGFBQWEsQ0FBYixFQUFnQixNQUY3QyxFQUhTO0FBTVQsMEJBQWMsQ0FBZCxDQU5TO1dBQVg7QUFRQSxjQUFJLENBQUMsYUFBRCxJQUFrQixPQUFPLFVBQVAsR0FBb0IsY0FBYyxVQUFkLEVBQTBCO0FBQ2xFLDRCQUFnQixNQUFoQixDQURrRTtXQUFwRTtTQVRGO09BSkY7QUFrQkEsYUFBTyxhQUFQLENBdEJzRTs7Ozs7Ozs7O3NDQTRCdEQsV0FBVyxjQUFjLGFBQWE7QUFDdEQsVUFBSSxnQkFBZ0IsSUFBaEIsQ0FEa0Q7QUFFdEQsV0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLEtBQUssWUFBWSxNQUFaLEVBQW9CLElBQUksRUFBSixFQUFRLEdBQWpELEVBQXNEO0FBQ3BELFlBQUksWUFBWSxZQUFZLENBQVosQ0FBWixDQURnRDtBQUVwRCxZQUFJLFNBQVMsS0FBSyxlQUFMLENBQXFCLFNBQXJCLEVBQWdDLFlBQWhDLEVBQThDLFNBQTlDLENBQVQsQ0FGZ0Q7QUFHcEQsWUFBSSxPQUFPLEdBQVAsRUFBWTtBQUNkLGNBQUksQ0FBQyxhQUFELElBQWtCLE9BQU8sVUFBUCxHQUFvQixjQUFjLFVBQWQsRUFBMEI7QUFDbEUsNEJBQWdCLE1BQWhCLENBRGtFO1dBQXBFO1NBREY7T0FIRjtBQVNBLGFBQU8sYUFBUCxDQVhzRDs7OztzQ0FjdEMsVUFBVSxVQUFVLE9BQU8sVUFBVTtBQUNyRCxVQUFJLE9BQU8sTUFBTSxDQUFOLEdBQVUsQ0FBVixHQUFjLENBQUMsQ0FBRCxHQUFLLENBQW5CLENBRDBDO0FBRXJELFVBQUksT0FBTyxNQUFNLENBQU4sR0FBVSxDQUFWLEdBQWMsQ0FBQyxDQUFELEdBQUssQ0FBbkIsQ0FGMEM7QUFHckQsVUFBSSxVQUFVLFNBQVMsQ0FBVCxHQUFhLE1BQU0sQ0FBTixDQUgwQjtBQUlyRCxVQUFJLFVBQVUsU0FBUyxDQUFULEdBQWEsTUFBTSxDQUFOLENBSjBCOztBQU1yRCxVQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsU0FBUyxDQUFULEdBQWEsUUFBYixDQUFuQixDQU5pRDtBQU9yRCxVQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsU0FBUyxDQUFULEdBQWEsUUFBYixDQUFuQixDQVBpRDs7QUFTckQsVUFBSSxZQUFZLFFBQUMsR0FBVyxJQUFYLEdBQW1CLE1BQU0sQ0FBTixDQVRpQjtBQVVyRCxVQUFJLFlBQVksUUFBQyxHQUFXLElBQVgsR0FBbUIsTUFBTSxDQUFOLENBVmlCOztBQVlyRCxVQUFJLGNBQUo7VUFBVyxjQUFYLENBWnFEO0FBYXJELFVBQUksU0FBUyxDQUFULEVBQVk7QUFDZCxnQkFBUSxDQUFSLENBRGM7T0FBaEIsTUFFTztBQUNMLFlBQUksYUFBYSxRQUFRLFFBQVIsQ0FEWjtBQUVMLFlBQUksT0FBTyxDQUFQLEVBQVU7QUFDWix3QkFBYyxRQUFkLENBRFk7U0FBZDtBQUdBLGdCQUFRLENBQUMsYUFBYSxTQUFTLENBQVQsQ0FBZCxHQUE0QixNQUFNLENBQU4sQ0FML0I7T0FGUDs7QUFVQSxVQUFJLFNBQVMsQ0FBVCxFQUFZO0FBQ2QsZ0JBQVEsQ0FBUixDQURjO09BQWhCLE1BRU87QUFDTCxZQUFJLGFBQWEsUUFBUSxRQUFSLENBRFo7QUFFTCxZQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ1osd0JBQWMsUUFBZCxDQURZO1NBQWQ7QUFHQSxnQkFBUSxDQUFDLGFBQWEsU0FBUyxDQUFULENBQWQsR0FBNEIsTUFBTSxDQUFOLENBTC9CO09BRlA7O0FBVUEsYUFBTyxRQUFRLENBQVIsSUFBYSxRQUFRLENBQVIsRUFBVztBQUM3QixZQUFJLFFBQVEsS0FBUixFQUFlO0FBQ2pCLG1CQUFTLFNBQVQsQ0FEaUI7QUFFakIsbUJBQVMsSUFBVCxDQUZpQjtTQUFuQixNQUdPO0FBQ0wsbUJBQVMsSUFBVCxDQURLO0FBRUwsbUJBQVMsU0FBVCxDQUZLO1NBSFA7QUFPQSxZQUFJLFNBQVMsS0FBVCxFQUFnQixLQUFoQixNQUEyQixLQUEzQixFQUFrQztBQUNwQyxnQkFEb0M7U0FBdEM7T0FSRjs7O0FBakNxRDs7O29DQWlEdkMsYUFBYSxjQUFjLGNBQWM7QUFDdkQsVUFBSSxTQUFTLEVBQVQsQ0FEbUQ7QUFFdkQsVUFBSSxVQUFVLFlBQVksSUFBWixDQUZ5QztBQUd2RCxVQUFJLFVBQVUsYUFBYSxNQUFiLENBQW9CLENBQXBCLENBSHlDO0FBSXZELFVBQUksVUFBVSxhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsQ0FKeUM7QUFLdkQsVUFBSSxVQUFVLFlBQVksSUFBWixDQUx5QztBQU12RCxVQUFJLFVBQVUsYUFBYSxNQUFiLENBQW9CLENBQXBCLENBTnlDO0FBT3ZELFVBQUksVUFBVSxhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsQ0FQeUM7O0FBU3ZELFVBQUksWUFBWSxJQUFaLEtBQXFCLENBQUMsQ0FBRCxJQUFNLFlBQVksSUFBWixLQUFxQixDQUFyQixFQUF3QjtBQUNyRCxZQUFJLEtBQUssR0FBTCxDQUFTLFVBQVUsT0FBVixDQUFULEdBQThCLEtBQUssR0FBTCxDQUFTLFVBQVUsT0FBVixDQUF2QyxFQUEyRDtBQUM3RCxpQkFBTyxTQUFQLEdBQW1CLEtBQW5CLENBRDZEO0FBRTdELGlCQUFPLE1BQVAsR0FBZ0IsSUFBSSxLQUFKLENBQ2QsYUFBYSxNQUFiLENBQW9CLENBQXBCLEVBQXVCLGFBQWEsTUFBYixDQUFvQixDQUFwQixDQUR6QixDQUY2RDtTQUEvRCxNQUlPO0FBQ0wsaUJBQU8sTUFBUCxHQUFnQixJQUFJLEtBQUosQ0FDZCxhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsRUFBdUIsYUFBYSxNQUFiLENBQW9CLENBQXBCLENBRHpCLENBREs7QUFHTCxpQkFBTyxTQUFQLEdBQW1CLElBQW5CLENBSEs7U0FKUDtPQURGLE1BVU8sSUFBSSxZQUFZLElBQVosS0FBcUIsQ0FBQyxDQUFELElBQU0sWUFBWSxJQUFaLEtBQXFCLENBQXJCLEVBQXdCO0FBQzVELFlBQUksS0FBSyxHQUFMLENBQVMsVUFBVSxPQUFWLENBQVQsR0FBOEIsS0FBSyxHQUFMLENBQVMsVUFBVSxPQUFWLENBQXZDLEVBQTJEO0FBQzdELGlCQUFPLFNBQVAsR0FBbUIsS0FBbkIsQ0FENkQ7QUFFN0QsaUJBQU8sTUFBUCxHQUFnQixJQUFJLEtBQUosQ0FDZCxhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsRUFBdUIsYUFBYSxNQUFiLENBQW9CLENBQXBCLENBRHpCLENBRjZEO1NBQS9ELE1BSU87QUFDTCxpQkFBTyxNQUFQLEdBQWdCLElBQUksS0FBSixDQUNkLGFBQWEsTUFBYixDQUFvQixDQUFwQixFQUF1QixhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsQ0FEekIsQ0FESztBQUdMLGlCQUFPLFNBQVAsR0FBbUIsSUFBbkIsQ0FISztTQUpQO09BREs7QUFXUCxhQUFPLE1BQVAsQ0E5QnVEOzs7O29DQWlDekMsT0FBTztBQUNyQixVQUFJLFFBQVEsS0FBSyxLQUFMLENBQVcsTUFBTSxDQUFOLEVBQVMsTUFBTSxDQUFOLENBQTVCLENBRGlCO0FBRXJCLFVBQUksU0FBUyxTQUFTLE1BQU0sS0FBSyxFQUFMLENBQWYsQ0FGUTtBQUdyQixVQUFJLFFBQVEsQ0FBUixFQUFXO0FBQ2Isa0JBQVUsR0FBVixDQURhO09BQWY7QUFHQSxhQUFPLE1BQVAsQ0FOcUI7Ozs7NkJBU2QsUUFBUSxRQUFRO0FBQ3ZCLFVBQUksU0FBUyxVQUFVLEtBQUssRUFBTCxHQUFVLEdBQVYsQ0FBVixDQURVO0FBRXZCLFVBQUksU0FBUztBQUNYLFdBQUcsU0FBUyxLQUFLLEdBQUwsQ0FBUyxNQUFULENBQVQ7QUFDSCxXQUFHLFNBQVMsS0FBSyxHQUFMLENBQVMsTUFBVCxDQUFUO09BRkQsQ0FGbUI7QUFNdkIsYUFBTyxNQUFQLENBTnVCOzs7O1NBcFRkOzs7OztBQzVCYjs7Ozs7Ozs7Ozs7QUFFQTs7Ozs7Ozs7SUFFYTs7O0FBQ1gsV0FEVyxNQUNYLENBQVksTUFBWixFQUFvQixNQUFwQixFQUE0QixLQUE1QixFQUFtQyxJQUFuQyxFQUF5QyxJQUF6QyxFQUErQzswQkFEcEMsUUFDb0M7O0FBQzdDLFFBQUksUUFBUSxFQUFDLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFmLENBRHlDOzt1RUFEcEMsbUJBR0gsT0FBTyxRQUFRLFFBQVEsS0FBSyxPQUFPLE9BQU8sTUFBTSxPQUZUOztBQUc3QyxVQUFLLFVBQUwsR0FBa0IsQ0FBbEIsQ0FINkM7O0dBQS9DOztlQURXOzt5QkFPTixNQUFNLGFBQWE7QUFDdEIsV0FBSyxPQUFMLENBQWEsU0FBYixHQUF5QixNQUF6QixDQURzQjtBQUV0QixXQUFLLE9BQUwsQ0FBYSxRQUFiLENBQXNCLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxFQUFXLEtBQUssS0FBTCxFQUFZLEtBQUssTUFBTCxDQUF4RCxDQUZzQjs7OzsyQkFLakIsTUFBTSxhQUFhO0FBQ3hCLGlDQWJTLDhDQWFJLE1BQU0sWUFBbkIsQ0FEd0I7QUFFeEIsV0FBSyxVQUFMLElBQW1CLFdBQW5CLENBRndCO0FBR3hCLFVBQUksS0FBSyxVQUFMLElBQW1CLENBQW5CLEVBQXNCO0FBQ3hCLGFBQUssTUFBTCxHQUFjLEtBQWQsQ0FEd0I7T0FBMUI7Ozs7U0FmUzs7Ozs7QUNKYjs7Ozs7Ozs7Ozs7aUJBR1E7Ozs7Ozs7OzttQkFDQTs7Ozs7Ozs7O29CQUNBOzs7Ozs7Ozs7bUJBQ0E7OztBQUpSLE9BQU8sUUFBUCxHQUFrQixPQUFsQjs7O0FBTUEsT0FBTyxnQkFBUCxDQUF3QixNQUF4QixFQUFnQyxZQUFNOzs7OztBQUtwQyxNQUFJLFNBQVMsU0FBUyxhQUFULENBQXVCLFdBQXZCLENBQVQsQ0FMZ0M7QUFNcEMsTUFBSSxXQUFXLFNBQVMsYUFBVCxDQUF1QixhQUF2QixDQUFYLENBTmdDO0FBT3BDLE1BQUksT0FBTyxPQUFPLFlBQVAsR0FBc0IsSUFBSSxRQUFRLElBQVIsQ0FDbkMsTUFEK0IsRUFDdkIsUUFEdUIsRUFDYixNQURhLENBQXRCLENBUHlCO0FBU3BDLE9BQUssVUFBTCxHQVRvQzs7QUFXcEMsU0FBTyxnQkFBUCxDQUF3QixTQUF4QixFQUFtQyxVQUFDLEtBQUQsRUFBVztBQUM1QyxTQUFLLFNBQUwsQ0FBZSxLQUFmLEVBRDRDO0dBQVgsQ0FBbkMsQ0FYb0M7O0FBZXBDLFNBQU8sZ0JBQVAsQ0FBd0IsT0FBeEIsRUFBaUMsVUFBQyxLQUFELEVBQVc7QUFDMUMsU0FBSyxPQUFMLENBQWEsS0FBYixFQUQwQztHQUFYLENBQWpDLENBZm9DOztBQW1CcEMsU0FBTyxnQkFBUCxDQUF3QixXQUF4QixFQUFxQyxVQUFDLEtBQUQsRUFBVztBQUM5QyxTQUFLLFdBQUwsQ0FBaUIsS0FBakIsRUFEOEM7R0FBWCxDQUFyQyxDQW5Cb0M7O0FBdUJwQyxNQUFJLFVBQVUsS0FBVixDQXZCZ0M7QUF3QnBDLE1BQUksV0FBVyxTQUFYLFFBQVcsQ0FBQyxLQUFELEVBQVc7QUFDeEIsUUFBSSxLQUFKLEVBQVc7QUFDVCxVQUFJLE1BQU0sSUFBTixLQUFlLE1BQWYsRUFBdUI7QUFDekIsa0JBQVUsSUFBVixDQUR5QjtPQUEzQixNQUVPLElBQUksTUFBTSxJQUFOLEtBQWUsT0FBZixFQUF3QjtBQUNqQyxrQkFBVSxLQUFWLENBRGlDO09BQTVCO0tBSFQ7QUFPQSxTQUFLLFFBQUwsQ0FBYyxLQUFkLEVBQXFCLFNBQVMsTUFBVCxJQUFtQixPQUFuQixDQUFyQixDQVJ3QjtHQUFYLENBeEJxQjtBQWtDcEMsYUFsQ29DO0FBbUNwQyxTQUFPLGdCQUFQLENBQXdCLE1BQXhCLEVBQWdDLFFBQWhDLEVBQTBDLElBQTFDLEVBbkNvQztBQW9DcEMsU0FBTyxnQkFBUCxDQUF3QixPQUF4QixFQUFpQyxRQUFqQyxFQUEyQyxJQUEzQyxFQXBDb0M7QUFxQ3BDLFNBQU8sZ0JBQVAsQ0FBd0Isa0JBQXhCLEVBQTRDLFFBQTVDLEVBQXNELElBQXRELEVBckNvQzs7QUF1Q3BDLE1BQUksYUFBSixDQXZDb0M7QUF3Q3BDLFNBQU8sUUFBUCxHQUFrQixVQUFDLEtBQUQsRUFBVztBQUMzQixRQUFJLGFBQUosRUFBbUI7QUFDakIsbUJBQWEsYUFBYixFQURpQjtBQUVqQixzQkFBZ0IsSUFBaEIsQ0FGaUI7S0FBbkI7QUFJQSxvQkFBZ0IsV0FBVyxZQUFXO0FBQ3BDLHNCQUFnQixJQUFoQixDQURvQztBQUVwQyxXQUFLLFFBQUwsQ0FBYyxLQUFkLEVBRm9DO0tBQVgsRUFHeEIsSUFIYSxDQUFoQixDQUwyQjtHQUFYLENBeENrQjs7QUFtRHBDLE1BQUksZUFBZ0IsSUFBSSxJQUFKLEdBQVcsT0FBWCxLQUF1QixJQUF2QixDQW5EZ0I7QUFvRHBDLE1BQUksT0FBTyxTQUFQLElBQU8sR0FBTTtBQUNmLFFBQUksZUFBZ0IsSUFBSSxJQUFKLEdBQVcsT0FBWCxLQUF1QixJQUF2QixDQURMO0FBRWYsUUFBSSxjQUFjLGVBQWUsWUFBZixDQUZIO0FBR2YsbUJBQWUsWUFBZixDQUhlO0FBSWYsU0FBSyxJQUFMLENBQVUsV0FBVixFQUplO0FBS2YsZUFBVyxJQUFYLEVBQWlCLEtBQUssS0FBTCxDQUFXLE9BQU8sS0FBSyxlQUFMLENBQW5DLEVBTGU7R0FBTixDQXBEeUI7QUEyRHBDLFNBM0RvQztDQUFOLENBQWhDOzs7OztBQ1BBOzs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBLElBQU0sYUFBYSxDQUFiO0FBQ0MsSUFBTSwwQkFBUyxDQUNwQjtBQUNFLFFBQU0sRUFBTjtBQUNBLFFBQU0sRUFBTjtBQUNBLFFBQU0sQ0FDSixDQURJLEVBQ0YsQ0FERSxFQUNBLENBREEsRUFDRSxDQURGLEVBQ0ksQ0FESixFQUNNLENBRE4sRUFDUSxDQURSLEVBQ1UsQ0FEVixFQUNZLENBRFosRUFDYyxDQURkLEVBQ2dCLENBRGhCLEVBQ2tCLENBRGxCLEVBQ29CLENBRHBCLEVBQ3NCLENBRHRCLEVBQ3dCLENBRHhCLEVBQzBCLENBRDFCLEVBQzRCLENBRDVCLEVBQzhCLENBRDlCLEVBQ2dDLENBRGhDLEVBQ2tDLENBRGxDLEVBQ29DLENBRHBDLEVBQ3NDLENBRHRDLEVBQ3dDLENBRHhDLEVBQzBDLENBRDFDLEVBQzRDLENBRDVDLEVBQzhDLENBRDlDLEVBQ2dELENBRGhELEVBQ2tELENBRGxELEVBRUosQ0FGSSxFQUVGLENBRkUsRUFFQSxDQUZBLEVBRUUsQ0FGRixFQUVJLENBRkosRUFFTSxDQUZOLEVBRVEsQ0FGUixFQUVVLENBRlYsRUFFWSxDQUZaLEVBRWMsQ0FGZCxFQUVnQixDQUZoQixFQUVrQixDQUZsQixFQUVvQixDQUZwQixFQUVzQixDQUZ0QixFQUV3QixDQUZ4QixFQUUwQixDQUYxQixFQUU0QixDQUY1QixFQUU4QixDQUY5QixFQUVnQyxDQUZoQyxFQUVrQyxDQUZsQyxFQUVvQyxDQUZwQyxFQUVzQyxDQUZ0QyxFQUV3QyxDQUZ4QyxFQUUwQyxDQUYxQyxFQUU0QyxDQUY1QyxFQUU4QyxDQUY5QyxFQUVnRCxDQUZoRCxFQUVrRCxDQUZsRCxFQUdKLENBSEksRUFHRixDQUhFLEVBR0EsQ0FIQSxFQUdFLENBSEYsRUFHSSxDQUhKLEVBR00sQ0FITixFQUdRLENBSFIsRUFHVSxDQUhWLEVBR1ksQ0FIWixFQUdjLENBSGQsRUFHZ0IsQ0FIaEIsRUFHa0IsQ0FIbEIsRUFHb0IsQ0FIcEIsRUFHc0IsQ0FIdEIsRUFHd0IsQ0FIeEIsRUFHMEIsQ0FIMUIsRUFHNEIsQ0FINUIsRUFHOEIsQ0FIOUIsRUFHZ0MsQ0FIaEMsRUFHa0MsQ0FIbEMsRUFHb0MsQ0FIcEMsRUFHc0MsQ0FIdEMsRUFHd0MsQ0FIeEMsRUFHMEMsQ0FIMUMsRUFHNEMsQ0FINUMsRUFHOEMsQ0FIOUMsRUFHZ0QsQ0FIaEQsRUFHa0QsQ0FIbEQsRUFJSixDQUpJLEVBSUYsQ0FKRSxFQUlBLENBSkEsRUFJRSxDQUpGLEVBSUksQ0FKSixFQUlNLENBSk4sRUFJUSxDQUpSLEVBSVUsQ0FKVixFQUlZLENBSlosRUFJYyxDQUpkLEVBSWdCLENBSmhCLEVBSWtCLENBSmxCLEVBSW9CLENBSnBCLEVBSXNCLENBSnRCLEVBSXdCLENBSnhCLEVBSTBCLENBSjFCLEVBSTRCLENBSjVCLEVBSThCLENBSjlCLEVBSWdDLENBSmhDLEVBSWtDLENBSmxDLEVBSW9DLENBSnBDLEVBSXNDLENBSnRDLEVBSXdDLENBSnhDLEVBSTBDLENBSjFDLEVBSTRDLENBSjVDLEVBSThDLENBSjlDLEVBSWdELENBSmhELEVBSWtELENBSmxELEVBS0osQ0FMSSxFQUtGLENBTEUsRUFLQSxDQUxBLEVBS0UsQ0FMRixFQUtJLENBTEosRUFLTSxDQUxOLEVBS1EsQ0FMUixFQUtVLENBTFYsRUFLWSxDQUxaLEVBS2MsQ0FMZCxFQUtnQixDQUxoQixFQUtrQixDQUxsQixFQUtvQixDQUxwQixFQUtzQixDQUx0QixFQUt3QixDQUx4QixFQUswQixDQUwxQixFQUs0QixDQUw1QixFQUs4QixDQUw5QixFQUtnQyxDQUxoQyxFQUtrQyxDQUxsQyxFQUtvQyxDQUxwQyxFQUtzQyxDQUx0QyxFQUt3QyxDQUx4QyxFQUswQyxDQUwxQyxFQUs0QyxDQUw1QyxFQUs4QyxDQUw5QyxFQUtnRCxDQUxoRCxFQUtrRCxDQUxsRCxFQU1KLENBTkksRUFNRixDQU5FLEVBTUEsQ0FOQSxFQU1FLENBTkYsRUFNSSxDQU5KLEVBTU0sQ0FOTixFQU1RLENBTlIsRUFNVSxDQU5WLEVBTVksQ0FOWixFQU1jLENBTmQsRUFNZ0IsQ0FOaEIsRUFNa0IsQ0FObEIsRUFNb0IsQ0FOcEIsRUFNc0IsQ0FOdEIsRUFNd0IsQ0FOeEIsRUFNMEIsQ0FOMUIsRUFNNEIsQ0FONUIsRUFNOEIsQ0FOOUIsRUFNZ0MsQ0FOaEMsRUFNa0MsQ0FObEMsRUFNb0MsQ0FOcEMsRUFNc0MsQ0FOdEMsRUFNd0MsQ0FOeEMsRUFNMEMsQ0FOMUMsRUFNNEMsQ0FONUMsRUFNOEMsQ0FOOUMsRUFNZ0QsQ0FOaEQsRUFNa0QsQ0FObEQsRUFPSixDQVBJLEVBT0YsQ0FQRSxFQU9BLENBUEEsRUFPRSxDQVBGLEVBT0ksQ0FQSixFQU9NLENBUE4sRUFPUSxDQVBSLEVBT1UsQ0FQVixFQU9ZLENBUFosRUFPYyxDQVBkLEVBT2dCLENBUGhCLEVBT2tCLENBUGxCLEVBT29CLENBUHBCLEVBT3NCLENBUHRCLEVBT3dCLENBUHhCLEVBTzBCLENBUDFCLEVBTzRCLENBUDVCLEVBTzhCLENBUDlCLEVBT2dDLENBUGhDLEVBT2tDLENBUGxDLEVBT29DLENBUHBDLEVBT3NDLENBUHRDLEVBT3dDLENBUHhDLEVBTzBDLENBUDFDLEVBTzRDLENBUDVDLEVBTzhDLENBUDlDLEVBT2dELENBUGhELEVBT2tELENBUGxELEVBUUosQ0FSSSxFQVFGLENBUkUsRUFRQSxDQVJBLEVBUUUsQ0FSRixFQVFJLENBUkosRUFRTSxDQVJOLEVBUVEsQ0FSUixFQVFVLENBUlYsRUFRWSxDQVJaLEVBUWMsQ0FSZCxFQVFnQixDQVJoQixFQVFrQixDQVJsQixFQVFvQixDQVJwQixFQVFzQixDQVJ0QixFQVF3QixDQVJ4QixFQVEwQixDQVIxQixFQVE0QixDQVI1QixFQVE4QixDQVI5QixFQVFnQyxDQVJoQyxFQVFrQyxDQVJsQyxFQVFvQyxDQVJwQyxFQVFzQyxDQVJ0QyxFQVF3QyxDQVJ4QyxFQVEwQyxDQVIxQyxFQVE0QyxDQVI1QyxFQVE4QyxDQVI5QyxFQVFnRCxDQVJoRCxFQVFrRCxDQVJsRCxFQVNKLENBVEksRUFTRixDQVRFLEVBU0EsQ0FUQSxFQVNFLENBVEYsRUFTSSxDQVRKLEVBU00sQ0FUTixFQVNRLENBVFIsRUFTVSxDQVRWLEVBU1ksQ0FUWixFQVNjLENBVGQsRUFTZ0IsQ0FUaEIsRUFTa0IsQ0FUbEIsRUFTb0IsQ0FUcEIsRUFTc0IsQ0FUdEIsRUFTd0IsQ0FUeEIsRUFTMEIsQ0FUMUIsRUFTNEIsQ0FUNUIsRUFTOEIsQ0FUOUIsRUFTZ0MsQ0FUaEMsRUFTa0MsQ0FUbEMsRUFTb0MsQ0FUcEMsRUFTc0MsQ0FUdEMsRUFTd0MsQ0FUeEMsRUFTMEMsQ0FUMUMsRUFTNEMsQ0FUNUMsRUFTOEMsQ0FUOUMsRUFTZ0QsQ0FUaEQsRUFTa0QsQ0FUbEQsRUFVSixDQVZJLEVBVUYsQ0FWRSxFQVVBLENBVkEsRUFVRSxDQVZGLEVBVUksQ0FWSixFQVVNLENBVk4sRUFVUSxDQVZSLEVBVVUsQ0FWVixFQVVZLENBVlosRUFVYyxDQVZkLEVBVWdCLENBVmhCLEVBVWtCLENBVmxCLEVBVW9CLENBVnBCLEVBVXNCLENBVnRCLEVBVXdCLENBVnhCLEVBVTBCLENBVjFCLEVBVTRCLENBVjVCLEVBVThCLENBVjlCLEVBVWdDLENBVmhDLEVBVWtDLENBVmxDLEVBVW9DLENBVnBDLEVBVXNDLENBVnRDLEVBVXdDLENBVnhDLEVBVTBDLENBVjFDLEVBVTRDLENBVjVDLEVBVThDLENBVjlDLEVBVWdELENBVmhELEVBVWtELENBVmxELEVBV0osQ0FYSSxFQVdGLENBWEUsRUFXQSxDQVhBLEVBV0UsQ0FYRixFQVdJLENBWEosRUFXTSxDQVhOLEVBV1EsQ0FYUixFQVdVLENBWFYsRUFXWSxDQVhaLEVBV2MsQ0FYZCxFQVdnQixDQVhoQixFQVdrQixDQVhsQixFQVdvQixDQVhwQixFQVdzQixDQVh0QixFQVd3QixDQVh4QixFQVcwQixDQVgxQixFQVc0QixDQVg1QixFQVc4QixDQVg5QixFQVdnQyxDQVhoQyxFQVdrQyxDQVhsQyxFQVdvQyxDQVhwQyxFQVdzQyxDQVh0QyxFQVd3QyxDQVh4QyxFQVcwQyxDQVgxQyxFQVc0QyxDQVg1QyxFQVc4QyxDQVg5QyxFQVdnRCxDQVhoRCxFQVdrRCxDQVhsRCxFQVlKLENBWkksRUFZRixDQVpFLEVBWUEsQ0FaQSxFQVlFLENBWkYsRUFZSSxDQVpKLEVBWU0sQ0FaTixFQVlRLENBWlIsRUFZVSxDQVpWLEVBWVksQ0FaWixFQVljLENBWmQsRUFZZ0IsQ0FaaEIsRUFZa0IsQ0FabEIsRUFZb0IsQ0FacEIsRUFZc0IsQ0FadEIsRUFZd0IsQ0FaeEIsRUFZMEIsQ0FaMUIsRUFZNEIsQ0FaNUIsRUFZOEIsQ0FaOUIsRUFZZ0MsQ0FaaEMsRUFZa0MsQ0FabEMsRUFZb0MsQ0FacEMsRUFZc0MsQ0FadEMsRUFZd0MsQ0FaeEMsRUFZMEMsQ0FaMUMsRUFZNEMsQ0FaNUMsRUFZOEMsQ0FaOUMsRUFZZ0QsQ0FaaEQsRUFZa0QsQ0FabEQsRUFhSixDQWJJLEVBYUYsQ0FiRSxFQWFBLENBYkEsRUFhRSxDQWJGLEVBYUksQ0FiSixFQWFNLENBYk4sRUFhUSxDQWJSLEVBYVUsQ0FiVixFQWFZLENBYlosRUFhYyxDQWJkLEVBYWdCLENBYmhCLEVBYWtCLENBYmxCLEVBYW9CLENBYnBCLEVBYXNCLENBYnRCLEVBYXdCLENBYnhCLEVBYTBCLENBYjFCLEVBYTRCLENBYjVCLEVBYThCLENBYjlCLEVBYWdDLENBYmhDLEVBYWtDLENBYmxDLEVBYW9DLENBYnBDLEVBYXNDLENBYnRDLEVBYXdDLENBYnhDLEVBYTBDLENBYjFDLEVBYTRDLENBYjVDLEVBYThDLENBYjlDLEVBYWdELENBYmhELEVBYWtELENBYmxELEVBY0osQ0FkSSxFQWNGLENBZEUsRUFjQSxDQWRBLEVBY0UsQ0FkRixFQWNJLENBZEosRUFjTSxDQWROLEVBY1EsQ0FkUixFQWNVLENBZFYsRUFjWSxDQWRaLEVBY2MsQ0FkZCxFQWNnQixDQWRoQixFQWNrQixDQWRsQixFQWNvQixDQWRwQixFQWNzQixDQWR0QixFQWN3QixDQWR4QixFQWMwQixDQWQxQixFQWM0QixDQWQ1QixFQWM4QixDQWQ5QixFQWNnQyxDQWRoQyxFQWNrQyxDQWRsQyxFQWNvQyxDQWRwQyxFQWNzQyxDQWR0QyxFQWN3QyxDQWR4QyxFQWMwQyxDQWQxQyxFQWM0QyxDQWQ1QyxFQWM4QyxDQWQ5QyxFQWNnRCxDQWRoRCxFQWNrRCxDQWRsRCxFQWVKLENBZkksRUFlRixDQWZFLEVBZUEsQ0FmQSxFQWVFLENBZkYsRUFlSSxDQWZKLEVBZU0sQ0FmTixFQWVRLENBZlIsRUFlVSxDQWZWLEVBZVksQ0FmWixFQWVjLENBZmQsRUFlZ0IsQ0FmaEIsRUFla0IsQ0FmbEIsRUFlb0IsQ0FmcEIsRUFlc0IsQ0FmdEIsRUFld0IsQ0FmeEIsRUFlMEIsQ0FmMUIsRUFlNEIsQ0FmNUIsRUFlOEIsQ0FmOUIsRUFlZ0MsQ0FmaEMsRUFla0MsQ0FmbEMsRUFlb0MsQ0FmcEMsRUFlc0MsQ0FmdEMsRUFld0MsQ0FmeEMsRUFlMEMsQ0FmMUMsRUFlNEMsQ0FmNUMsRUFlOEMsQ0FmOUMsRUFlZ0QsQ0FmaEQsRUFla0QsQ0FmbEQsRUFnQkosQ0FoQkksRUFnQkYsQ0FoQkUsRUFnQkEsQ0FoQkEsRUFnQkUsQ0FoQkYsRUFnQkksQ0FoQkosRUFnQk0sQ0FoQk4sRUFnQlEsQ0FoQlIsRUFnQlUsQ0FoQlYsRUFnQlksQ0FoQlosRUFnQmMsQ0FoQmQsRUFnQmdCLENBaEJoQixFQWdCa0IsQ0FoQmxCLEVBZ0JvQixDQWhCcEIsRUFnQnNCLENBaEJ0QixFQWdCd0IsQ0FoQnhCLEVBZ0IwQixDQWhCMUIsRUFnQjRCLENBaEI1QixFQWdCOEIsQ0FoQjlCLEVBZ0JnQyxDQWhCaEMsRUFnQmtDLENBaEJsQyxFQWdCb0MsQ0FoQnBDLEVBZ0JzQyxDQWhCdEMsRUFnQndDLENBaEJ4QyxFQWdCMEMsQ0FoQjFDLEVBZ0I0QyxDQWhCNUMsRUFnQjhDLENBaEI5QyxFQWdCZ0QsQ0FoQmhELEVBZ0JrRCxDQWhCbEQsRUFpQkosQ0FqQkksRUFpQkYsQ0FqQkUsRUFpQkEsQ0FqQkEsRUFpQkUsQ0FqQkYsRUFpQkksQ0FqQkosRUFpQk0sQ0FqQk4sRUFpQlEsQ0FqQlIsRUFpQlUsQ0FqQlYsRUFpQlksQ0FqQlosRUFpQmMsQ0FqQmQsRUFpQmdCLENBakJoQixFQWlCa0IsQ0FqQmxCLEVBaUJvQixDQWpCcEIsRUFpQnNCLENBakJ0QixFQWlCd0IsQ0FqQnhCLEVBaUIwQixDQWpCMUIsRUFpQjRCLENBakI1QixFQWlCOEIsQ0FqQjlCLEVBaUJnQyxDQWpCaEMsRUFpQmtDLENBakJsQyxFQWlCb0MsQ0FqQnBDLEVBaUJzQyxDQWpCdEMsRUFpQndDLENBakJ4QyxFQWlCMEMsQ0FqQjFDLEVBaUI0QyxDQWpCNUMsRUFpQjhDLENBakI5QyxFQWlCZ0QsQ0FqQmhELEVBaUJrRCxDQWpCbEQsRUFrQkosQ0FsQkksRUFrQkYsQ0FsQkUsRUFrQkEsQ0FsQkEsRUFrQkUsQ0FsQkYsRUFrQkksQ0FsQkosRUFrQk0sQ0FsQk4sRUFrQlEsQ0FsQlIsRUFrQlUsQ0FsQlYsRUFrQlksQ0FsQlosRUFrQmMsQ0FsQmQsRUFrQmdCLENBbEJoQixFQWtCa0IsQ0FsQmxCLEVBa0JvQixDQWxCcEIsRUFrQnNCLENBbEJ0QixFQWtCd0IsQ0FsQnhCLEVBa0IwQixDQWxCMUIsRUFrQjRCLENBbEI1QixFQWtCOEIsQ0FsQjlCLEVBa0JnQyxDQWxCaEMsRUFrQmtDLENBbEJsQyxFQWtCb0MsQ0FsQnBDLEVBa0JzQyxDQWxCdEMsRUFrQndDLENBbEJ4QyxFQWtCMEMsQ0FsQjFDLEVBa0I0QyxDQWxCNUMsRUFrQjhDLENBbEI5QyxFQWtCZ0QsQ0FsQmhELEVBa0JrRCxDQWxCbEQsRUFtQkosQ0FuQkksRUFtQkYsQ0FuQkUsRUFtQkEsQ0FuQkEsRUFtQkUsQ0FuQkYsRUFtQkksQ0FuQkosRUFtQk0sQ0FuQk4sRUFtQlEsQ0FuQlIsRUFtQlUsQ0FuQlYsRUFtQlksQ0FuQlosRUFtQmMsQ0FuQmQsRUFtQmdCLENBbkJoQixFQW1Ca0IsQ0FuQmxCLEVBbUJvQixDQW5CcEIsRUFtQnNCLENBbkJ0QixFQW1Cd0IsQ0FuQnhCLEVBbUIwQixDQW5CMUIsRUFtQjRCLENBbkI1QixFQW1COEIsQ0FuQjlCLEVBbUJnQyxDQW5CaEMsRUFtQmtDLENBbkJsQyxFQW1Cb0MsQ0FuQnBDLEVBbUJzQyxDQW5CdEMsRUFtQndDLENBbkJ4QyxFQW1CMEMsQ0FuQjFDLEVBbUI0QyxDQW5CNUMsRUFtQjhDLENBbkI5QyxFQW1CZ0QsQ0FuQmhELEVBbUJrRCxDQW5CbEQsRUFvQkosQ0FwQkksRUFvQkYsQ0FwQkUsRUFvQkEsQ0FwQkEsRUFvQkUsQ0FwQkYsRUFvQkksQ0FwQkosRUFvQk0sQ0FwQk4sRUFvQlEsQ0FwQlIsRUFvQlUsQ0FwQlYsRUFvQlksQ0FwQlosRUFvQmMsQ0FwQmQsRUFvQmdCLENBcEJoQixFQW9Ca0IsQ0FwQmxCLEVBb0JvQixDQXBCcEIsRUFvQnNCLENBcEJ0QixFQW9Cd0IsQ0FwQnhCLEVBb0IwQixDQXBCMUIsRUFvQjRCLENBcEI1QixFQW9COEIsQ0FwQjlCLEVBb0JnQyxDQXBCaEMsRUFvQmtDLENBcEJsQyxFQW9Cb0MsQ0FwQnBDLEVBb0JzQyxDQXBCdEMsRUFvQndDLENBcEJ4QyxFQW9CMEMsQ0FwQjFDLEVBb0I0QyxDQXBCNUMsRUFvQjhDLENBcEI5QyxFQW9CZ0QsQ0FwQmhELEVBb0JrRCxDQXBCbEQsQ0FBTjtDQUprQixDQUFUOztBQTZCYixJQUFNLGFBQWEsQ0FDakI7QUFDRSxRQUFNLFVBQU47QUFDQSxTQUFPLGtCQUFQO0FBQ0EsV0FBUyxxQkFBVDtBQUNBLGFBQVcsdUJBQVg7QUFDQSxLQUFHLEVBQUg7QUFDQSxLQUFHLEVBQUg7Q0FQZSxFQVNqQjtBQUNFLFFBQU0sUUFBTjtBQUNBLFNBQU8sZ0JBQVA7QUFDQSxLQUFHLEVBQUg7QUFDQSxLQUFHLEVBQUg7Q0FiZSxDQUFiOztJQWlCTzs7O0FBQ1gsV0FEVyxJQUNYLENBQVksTUFBWixFQUFvQixRQUFwQixFQUE4QixTQUE5QixFQUF5QzswQkFEOUIsTUFDOEI7O3VFQUQ5QixpQkFFSCxTQURpQzs7QUFFdkMsVUFBSyxpQkFBTCxHQUF5QixFQUF6QixDQUZ1QztBQUd2QyxVQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFIdUMsU0FJdkMsQ0FBSyxLQUFMLEdBQWEsQ0FBYixDQUp1QztBQUt2QyxVQUFLLEtBQUwsR0FBYSxDQUFiLENBTHVDO0FBTXZDLFVBQUssYUFBTCxHQUFxQixDQUFyQixDQU51QztBQU92QyxVQUFLLFNBQUwsR0FBaUIsRUFBakIsQ0FQdUM7QUFRdkMsVUFBSyxVQUFMLEdBQWtCLEVBQWxCLENBUnVDO0FBU3ZDLFVBQUssS0FBTCxHQUFhLElBQWIsQ0FUdUM7QUFVdkMsVUFBSyxJQUFMLEdBQVksT0FBTyxDQUFQLEVBQVUsSUFBVixDQVYyQjtBQVd2QyxVQUFLLElBQUwsR0FBWSxPQUFPLENBQVAsRUFBVSxJQUFWLENBWDJCO0FBWXZDLFVBQUssSUFBTCxHQUFZLE9BQU8sQ0FBUCxFQUFVLElBQVYsQ0FaMkI7QUFhdkMsVUFBSyxTQUFMLEdBQWlCLEVBQWpCLENBYnVDO0FBY3ZDLFVBQUssWUFBTCxHQUFvQixFQUFwQixDQWR1QztBQWV2QyxVQUFLLFVBQUwsR0FBa0IsRUFBbEIsQ0FmdUM7QUFnQnZDLFVBQUssU0FBTCxHQUFpQixTQUFqQixDQWhCdUM7QUFpQnZDLFVBQUssUUFBTCxHQUFnQixRQUFoQixDQWpCdUM7QUFrQnZDLFVBQUssUUFBTCxDQUFjLEtBQWQsR0FBc0IsT0FBTyxVQUFQLENBbEJpQjtBQW1CdkMsVUFBSyxRQUFMLENBQWMsTUFBZCxHQUF1QixPQUFPLFdBQVAsQ0FuQmdCO0FBb0J2QyxVQUFLLFNBQUwsR0FBaUIsTUFBSyxRQUFMLENBQWMsVUFBZCxDQUF5QixJQUF6QixDQUFqQixDQXBCdUM7QUFxQnZDLFVBQUssUUFBTCxHQUFnQixTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBaEIsQ0FyQnVDO0FBc0J2QyxVQUFLLFFBQUwsQ0FBYyxLQUFkLEdBQXNCLE9BQU8sVUFBUCxDQXRCaUI7QUF1QnZDLFVBQUssUUFBTCxDQUFjLE1BQWQsR0FBdUIsT0FBTyxXQUFQLENBdkJnQjtBQXdCdkMsVUFBSyxTQUFMLEdBQWlCLE1BQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsSUFBekIsQ0FBakI7OztBQXhCdUMsU0EyQnZDLENBQUssV0FBTCxHQUFtQixFQUFuQixDQTNCdUM7O0FBNkJ2QyxVQUFLLFNBQUwsQ0FBZSxPQUFmLEVBQXdCLGNBQUssS0FBTCxDQUF4QixDQTdCdUM7QUE4QnZDLFVBQUssU0FBTCxDQUFlLElBQWYsRUFBcUIsY0FBSyxFQUFMLENBQXJCLENBOUJ1QztBQStCdkMsVUFBSyxTQUFMLENBQWUsTUFBZixFQUF1QixjQUFLLElBQUwsQ0FBdkIsQ0EvQnVDO0FBZ0N2QyxVQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLGNBQUssSUFBTCxDQUF2QixDQWhDdUM7QUFpQ3ZDLFVBQUssU0FBTCxDQUFlLE9BQWYsRUFBd0IsY0FBSyxLQUFMLENBQXhCLENBakN1QztBQWtDdkMsVUFBSyxTQUFMLENBQWUsU0FBZixFQUEwQixjQUFLLENBQUwsQ0FBMUIsQ0FsQ3VDO0FBbUN2QyxVQUFLLFNBQUwsQ0FBZSxXQUFmLEVBQTRCLGNBQUssQ0FBTCxDQUE1QixDQW5DdUM7QUFvQ3ZDLFVBQUssU0FBTCxDQUFlLFdBQWYsRUFBNEIsY0FBSyxDQUFMLENBQTVCLENBcEN1QztBQXFDdkMsVUFBSyxTQUFMLENBQWUsWUFBZixFQUE2QixjQUFLLENBQUwsQ0FBN0IsQ0FyQ3VDOztHQUF6Qzs7ZUFEVzs7c0NBeUNPLFlBQVksYUFBYTtBQUN6QyxVQUFJLGlCQUFpQixFQUFqQixDQURxQztBQUV6QyxVQUFJLFlBQVksS0FBSyxJQUFMLENBQVUsS0FBVixDQUFnQixDQUFoQixDQUFaLENBRnFDOztBQUl6QyxVQUFJLGFBQWE7QUFDZixXQUFHLEtBQUssSUFBTCxDQUFVLGFBQWEsS0FBSyxTQUFMLENBQTFCO0FBQ0EsV0FBRyxLQUFLLElBQUwsQ0FBVSxjQUFjLEtBQUssVUFBTCxDQUEzQjtPQUZFLENBSnFDO0FBUXpDLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxLQUFLLEtBQUssSUFBTCxDQUFVLE1BQVYsRUFBa0IsSUFBSSxFQUFKLEVBQVEsR0FBL0MsRUFBb0Q7QUFDbEQsWUFBSSxLQUFLLElBQUwsQ0FBVSxDQUFWLE1BQWlCLENBQWpCLEVBQW9CO0FBQ3RCLGNBQUksb0JBQW9CLFdBQVcsQ0FBWCxHQUFlLFdBQVcsQ0FBWCxDQURqQjtBQUV0QixjQUFJLG1CQUFtQixDQUFuQixDQUZrQjtBQUd0QixlQUFLLElBQUksTUFBTSxDQUFOLEVBQVMsTUFBTSxXQUFXLENBQVgsRUFBYyxLQUF0QyxFQUE2QztBQUMzQyxpQkFBSyxJQUFJLE1BQU0sQ0FBTixFQUFTLE1BQU0sV0FBVyxDQUFYLEVBQWMsS0FBdEMsRUFBNkM7QUFDM0Msa0JBQUksU0FBUyxDQUFDLEdBQUksS0FBSyxJQUFMLEdBQWEsR0FBbEIsQ0FEOEI7QUFFM0Msa0JBQUksU0FBUyxLQUFLLEtBQUwsQ0FBVyxJQUFJLEtBQUssSUFBTCxDQUFmLEdBQTRCLEdBQTVCLENBRjhCO0FBRzNDLGtCQUFJLFFBQVEsTUFBQyxHQUFTLEtBQUssSUFBTCxHQUFhLE1BQXZCLENBSCtCO0FBSTNDLGtCQUFJLEtBQUssSUFBTCxDQUFVLEtBQVYsTUFBcUIsQ0FBckIsRUFBd0I7QUFDMUIsbUNBRDBCO2VBQTVCO2FBSkY7V0FERjtBQVVBLGNBQUkscUJBQXFCLGlCQUFyQixFQUF3QztBQUMxQywyQkFBZSxJQUFmLENBQW9CLENBQXBCLEVBRDBDO0FBRTFDLHNCQUFVLENBQVYsSUFBZSxVQUFmLENBRjBDO1dBQTVDO1NBYkY7T0FERjtBQW9CQSxXQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0E1QnlDO0FBNkJ6QyxhQUFPLGNBQVAsQ0E3QnlDOzs7O3NDQWdDekI7QUFDaEIsV0FBSyxTQUFMLENBQWUsVUFBUyxLQUFULEVBQWdCO0FBQzdCLFlBQUksRUFBRSxrQ0FBRixFQUE2QjtBQUMvQixpQkFEK0I7U0FBakM7QUFHQSxjQUFNLFdBQU4sR0FBb0IsS0FBSyxpQkFBTCxDQUF1QixNQUFNLEtBQU4sRUFBYSxNQUFNLE1BQU4sQ0FBeEQsQ0FKNkI7QUFLN0IsWUFBSSxhQUFhLE1BQU0sV0FBTixDQUNqQixLQUFLLEtBQUwsQ0FBVyxLQUFLLE1BQUwsS0FBZ0IsTUFBTSxXQUFOLENBQWtCLE1BQWxCLENBRFYsQ0FBYixDQUx5QjtBQU83QixZQUFJLFVBQVUsS0FBSyxVQUFMLENBQWdCLFVBQWhCLENBQVYsQ0FQeUI7QUFRN0IsY0FBTSxJQUFOLEdBQWEsUUFBUSxFQUFSLG1CQUFiLENBUjZCO0FBUzdCLGNBQU0sSUFBTixHQUFhLFFBQVEsRUFBUixtQkFBYixDQVQ2QjtPQUFoQixFQVViLElBVkYsRUFEZ0I7Ozs7K0JBY1AsV0FBVztBQUNwQixVQUFJLGVBQUo7VUFBWSxlQUFaO1VBQW9CLGVBQXBCO1VBQTRCLGVBQTVCO1VBQW9DLGVBQXBDO1VBQTRDLGVBQTVDLENBRG9CO0FBRXBCLFVBQUksU0FBUyxFQUFDLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixFQUEvQixDQUZnQjtBQUdwQixlQUFTLFlBQVksS0FBSyxJQUFMLENBSEQ7QUFJcEIsZUFBUyxLQUFLLEtBQUwsQ0FBVyxZQUFZLEtBQUssSUFBTCxDQUFoQyxDQUpvQjtBQUtwQixlQUFTLFNBQVMsS0FBSyxTQUFMLENBTEU7QUFNcEIsZUFBUyxTQUFTLEtBQUssVUFBTCxDQU5FO0FBT3BCLGVBQVMsU0FBUyxLQUFLLFNBQUwsQ0FQRTtBQVFwQixlQUFTLFNBQVMsS0FBSyxVQUFMLENBUkU7QUFTcEIsZUFBUyxFQUFDLElBQUksTUFBSixFQUFZLElBQUksTUFBSixFQUFZLElBQUksTUFBSixFQUFZLElBQUksTUFBSixFQUE5QyxDQVRvQjtBQVVwQixhQUFPLE1BQVAsQ0FWb0I7Ozs7Ozs7aUNBY1Q7QUFDWCxpQ0F0R1MsZ0RBc0dRLFlBQ2YsRUFBQyxPQUFPLGVBQVAsR0FESCxDQURXOzs7OzhCQUtILFVBQVUsU0FBUztBQUMzQixXQUFLLElBQUksQ0FBSixJQUFTLEtBQUssTUFBTCxFQUFhO0FBQ3pCLFlBQUksS0FBSyxNQUFMLENBQVksY0FBWixDQUEyQixDQUEzQixDQUFKLEVBQW1DO0FBQ2pDLG1CQUFTLElBQVQsQ0FBYyxPQUFkLEVBQXVCLEtBQUssTUFBTCxDQUFZLENBQVosQ0FBdkIsRUFEaUM7U0FBbkM7T0FERjs7OzsrQkFPUyxhQUFhOzs7QUFDdEIsaUNBbkhTLGdEQW1IUSxZQUFqQixDQURzQjs7QUFHdEIsV0FBSyxjQUFMLENBQW9CLFdBQXBCLEVBSHNCO0FBSXRCLFdBQUssWUFBTCxHQUFvQixFQUFwQixDQUpzQjtBQUt0QixXQUFLLFVBQUwsR0FBa0IsRUFBbEIsQ0FMc0I7QUFNdEIsV0FBSyxPQUFMLEdBQWUscUJBQVksSUFBWixDQUFmLENBTnNCO0FBT3RCLFdBQUssTUFBTCxHQUFjOztBQUVaLGdCQUFRLG1CQUNOLEtBQUssTUFBTCxDQUFZLE1BQVosRUFBb0IsRUFEZCxFQUNrQixHQURsQixFQUN1QixHQUR2QixFQUM0QixHQUQ1QixFQUNpQyxHQURqQyxFQUNzQyxDQUR0QyxFQUN5QyxDQUR6QyxDQUFSO0FBRUEsbUJBQVcscUJBQ1QsS0FBSyxNQUFMLENBQVksUUFBWixFQUFzQixHQURiLEVBQ2tCLEdBRGxCLEVBQ3VCLEdBRHZCLEVBQzRCLEdBRDVCLEVBQ2lDLEdBRGpDLEVBQ3NDLENBQUMsQ0FBRCxFQUFJLENBRDFDLENBQVg7QUFFQSxtQkFBVyxxQkFDVCxLQUFLLE1BQUwsQ0FBWSxRQUFaLEVBQXNCLEdBRGIsRUFDa0IsR0FEbEIsRUFDdUIsR0FEdkIsRUFDNEIsR0FENUIsRUFDaUMsR0FEakMsRUFDc0MsQ0FEdEMsRUFDeUMsQ0FEekMsQ0FBWDtBQUVBLG1CQUFXLHFCQUNULEtBQUssTUFBTCxDQUFZLFFBQVosRUFBc0IsR0FEYixFQUNrQixHQURsQixFQUN1QixHQUR2QixFQUM0QixHQUQ1QixFQUNpQyxHQURqQyxFQUNzQyxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUQsQ0FEckQ7QUFFQSxtQkFBVyxxQkFDVCxLQUFLLE1BQUwsQ0FBWSxRQUFaLEVBQXNCLEdBRGIsRUFDa0IsR0FEbEIsRUFDdUIsR0FEdkIsRUFDNEIsR0FENUIsRUFDaUMsR0FEakMsRUFDc0MsQ0FEdEMsRUFDeUMsQ0FEekMsQ0FBWDtPQVZGLENBUHNCOztBQXFCdEIsV0FBSyxhQUFMLEdBQXFCLENBQXJCLENBckJzQjtBQXNCdEIsV0FBSyxpQkFBTCxHQUF5QixFQUF6QixDQXRCc0I7QUF1QnRCLFdBQUssS0FBTCxHQUFhLENBQWIsQ0F2QnNCO0FBd0J0QixXQUFLLEtBQUwsR0FBYSxDQUFiLENBeEJzQjs7QUEwQnRCLFdBQUssU0FBTCxDQUFlLFVBQUMsS0FBRCxFQUFXO0FBQ3hCLFlBQUksaUNBQUosRUFBOEI7QUFDNUIsaUJBQUssYUFBTCxHQUQ0QjtTQUE5QjtBQUdBLGNBQU0sTUFBTixHQUFlLElBQWYsQ0FKd0I7QUFLeEIsY0FBTSxNQUFOLEdBQWUsR0FBZixDQUx3QjtPQUFYLEVBTVosSUFOSCxFQTFCc0I7O0FBa0N0QixXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxLQUFLLElBQUwsQ0FBVSxNQUFWLEVBQWtCLEtBQUssQ0FBTCxFQUFRLEdBQS9DLEVBQW9EO0FBQ2xELFlBQUksS0FBSyxJQUFMLENBQVUsQ0FBVixDQUFKLEVBQWtCO0FBQ2hCLGNBQUksVUFBVSxLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBVixDQURZO0FBRWhCLGNBQUksUUFBUSxpQkFDVixRQUFRLEVBQVIsRUFBWSxRQUFRLEVBQVIsRUFBWSxLQUFLLFNBQUwsRUFBZ0IsS0FBSyxVQUFMLENBRHRDLENBRlk7QUFJaEIsZUFBSyxZQUFMLENBQWtCLElBQWxCLENBQXVCLEtBQXZCLEVBSmdCO0FBS2hCLGVBQUssVUFBTCxDQUFnQixJQUFoQixDQUFxQixLQUFyQixFQUxnQjtTQUFsQixNQU1PO0FBQ0wsZUFBSyxVQUFMLENBQWdCLElBQWhCLENBQXFCLElBQXJCLEVBREs7U0FOUDtPQURGOztBQVlBLFdBQUssZUFBTCxHQTlDc0I7Ozs7a0NBaURWO0FBQ1osVUFBSSxPQUFPLEVBQVAsQ0FEUTtBQUVaLFVBQUksT0FBTyxHQUFQOzs7Ozs7Ozs7O0FBRlE7Ozt5QkFjVCxhQUFhO0FBQ2hCLFdBQUssU0FBTCxDQUFlLFNBQWYsQ0FBeUIsQ0FBekIsRUFBNEIsQ0FBNUIsRUFBK0IsS0FBSyxNQUFMLENBQVksS0FBWixFQUFtQixLQUFLLE1BQUwsQ0FBWSxNQUFaLENBQWxELENBRGdCO0FBRWhCLGlDQW5MUywwQ0FtTEUsWUFBWCxDQUZnQjs7QUFJaEIsV0FBSyxTQUFMLEdBSmdCOztBQU1oQixVQUFJLEtBQUssU0FBTCxLQUFtQixTQUFuQixFQUE4QjtBQUNoQyxhQUFLLFdBQUwsQ0FBaUIsZUFBakIsRUFBa0MsR0FBbEMsRUFEZ0M7QUFFaEMsYUFBSyxXQUFMLENBQWlCLGVBQWpCLEVBQWtDLEdBQWxDLEVBRmdDO0FBR2hDLGFBQUssV0FBTCxDQUFpQixvQkFBakIsRUFBdUMsR0FBdkMsRUFIZ0M7QUFJaEMsYUFBSyxXQUFMLENBQWlCLHNCQUFqQixFQUF5QyxHQUF6QyxFQUpnQztBQUtoQyxhQUFLLFdBQUwsR0FMZ0M7T0FBbEM7QUFPQSxVQUFJLEtBQUssU0FBTCxLQUFtQixNQUFuQixFQUEyQjtBQUM3QixhQUFLLFdBQUwsQ0FBaUIsY0FBYyxLQUFLLGlCQUFMLENBQS9CLENBRDZCO0FBRTdCLGFBQUssV0FBTCxDQUFpQiw0QkFBakIsRUFBK0MsR0FBL0MsRUFGNkI7QUFHN0IsYUFBSyxXQUFMLEdBSDZCO09BQS9COzs7O21DQU9hLGFBQWE7QUFDMUIsVUFBSSxnQkFBSixDQUQwQjtBQUUxQixVQUFJLEtBQUssU0FBTCxLQUFtQixTQUFuQixFQUE4QjtBQUNoQyxrQkFBVSxRQUFWLENBRGdDO09BQWxDLE1BRU8sSUFBSSxLQUFLLFNBQUwsS0FBbUIsTUFBbkIsRUFBMkI7QUFDcEMsa0JBQVUsS0FBVixDQURvQztPQUEvQixNQUVBO0FBQ0wsa0JBQVUsS0FBSyxTQUFMLENBREw7T0FGQTtBQUtQLFdBQUssU0FBTCxDQUFlLFNBQWYsR0FBMkIsT0FBM0IsQ0FUMEI7QUFVMUIsV0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE4QixLQUFLLFFBQUwsQ0FBYyxLQUFkLEVBQXFCLEtBQUssUUFBTCxDQUFjLE1BQWQsQ0FBbkQsQ0FWMEI7QUFXMUIsV0FBSyxRQUFMLENBQWMsS0FBSyxJQUFMLENBQWQsQ0FYMEI7QUFZMUIsVUFBSSxLQUFLLFNBQUwsRUFBZ0I7QUFDbEIsYUFBSyxRQUFMLENBQWMsS0FBSyxTQUFMLENBQWQsQ0FEa0I7T0FBcEI7Ozs7NkJBS08sTUFBTTtBQUNiLFVBQUksV0FBVyxDQUFYO1VBQWMsV0FBVyxDQUFYLENBREw7QUFFYixXQUFLLElBQUksTUFBTSxDQUFOLEVBQVMsTUFBTSxLQUFLLElBQUwsRUFBVyxLQUFuQyxFQUEwQztBQUN4QyxhQUFLLElBQUksTUFBTSxDQUFOLEVBQVMsTUFBTSxLQUFLLElBQUwsRUFBVyxLQUFuQyxFQUEwQztBQUN4QyxjQUFJLFFBQVEsR0FBQyxHQUFNLEtBQUssSUFBTCxHQUFhLEdBQXBCLENBRDRCO0FBRXhDLHFCQUFXLE1BQU0sS0FBSyxTQUFMLENBRnVCO0FBR3hDLHFCQUFXLE1BQU0sS0FBSyxVQUFMLENBSHVCOztBQUt4QyxjQUFJLEtBQUssS0FBTCxDQUFKLEVBQWlCO0FBQ2YsaUJBQUssU0FBTCxDQUFlLFNBQWYsQ0FBeUIsS0FBSyxLQUFMLEVBQVksS0FBSyxLQUFMLElBQ3JDLEtBQUssU0FBTCxFQUFnQixDQURoQixFQUNtQixLQUFLLFNBQUwsRUFBZ0IsS0FBSyxVQUFMLEVBQ25DLFFBRkEsRUFFVSxRQUZWLEVBRW9CLEtBQUssU0FBTCxFQUFnQixLQUFLLFVBQUwsQ0FGcEMsQ0FEZTtXQUFqQjtBQUtBLGNBQUksS0FBSyxLQUFMLE1BQWdCLFVBQWhCLEVBQTRCO0FBQzlCLGlCQUFLLFNBQUwsQ0FBZSxXQUFmLEdBQTZCLEtBQTdCLENBRDhCO0FBRTlCLGlCQUFLLFNBQUwsQ0FBZSxVQUFmLENBQTBCLFFBQTFCLEVBQW9DLFFBQXBDLEVBQThDLEtBQUssU0FBTCxFQUM1QyxLQUFLLFVBQUwsQ0FERixDQUY4QjtXQUFoQztTQVZGO09BREY7Ozs7a0NBb0JZO0FBQ1osV0FBSyxTQUFMLENBQWUsU0FBZixHQUEyQixNQUEzQixDQURZO0FBRVosV0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixDQUF4QixFQUEyQixDQUEzQixFQUE4QixLQUFLLFFBQUwsQ0FBYyxLQUFkLEVBQXFCLEtBQUssUUFBTCxDQUFjLE1BQWQsQ0FBbkQsQ0FGWTs7OztnQ0FLRixTQUFTLE1BQU0sTUFBTTtBQUMvQixVQUFJLE1BQU0sS0FBSyxNQUFMLENBQVksS0FBWixHQUFvQixDQUFwQixDQURxQjtBQUUvQixhQUFPLFFBQVEsR0FBUixDQUZ3QjtBQUcvQixhQUFPLFFBQVEsRUFBUixDQUh3QjtBQUkvQixXQUFLLE9BQUwsQ0FBYSxJQUFiLEdBQW9CLE9BQU8sWUFBUCxDQUpXO0FBSy9CLFVBQUksVUFBVSxLQUFLLE9BQUwsQ0FBYSxXQUFiLENBQXlCLE9BQXpCLENBQVYsQ0FMMkI7QUFNL0IsVUFBSSxRQUFRLFFBQVEsS0FBUixDQU5tQjtBQU8vQixVQUFJLFdBQVcsTUFBTSxRQUFRLENBQVIsQ0FQVTtBQVEvQixXQUFLLE9BQUwsQ0FBYSxTQUFiLEdBQXlCLE9BQXpCLENBUitCO0FBUy9CLFdBQUssT0FBTCxDQUFhLFFBQWIsQ0FBc0IsT0FBdEIsRUFBK0IsUUFBL0IsRUFBeUMsSUFBekMsRUFUK0I7Ozs7K0JBWXZCLFNBQVMsTUFBTSxNQUFNLE1BQU07QUFDbkMsVUFBSSxNQUFNLEtBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsQ0FBcEIsQ0FEeUI7QUFFbkMsYUFBTyxRQUFRLEdBQVIsQ0FGNEI7QUFHbkMsYUFBTyxRQUFRLEVBQVIsQ0FINEI7QUFJbkMsV0FBSyxPQUFMLENBQWEsSUFBYixHQUFvQixPQUFPLFlBQVAsQ0FKZTtBQUtuQyxXQUFLLE9BQUwsQ0FBYSxTQUFiLEdBQXlCLE9BQXpCLENBTG1DO0FBTW5DLFdBQUssT0FBTCxDQUFhLFFBQWIsQ0FBc0IsT0FBdEIsRUFBK0IsSUFBL0IsRUFBcUMsSUFBckMsRUFObUM7Ozs7Z0NBU3pCO0FBQ1YsVUFBSSxNQUFNLEtBQUssTUFBTCxDQUFZLEtBQVosR0FBb0IsQ0FBcEIsQ0FEQTtBQUVWLFdBQUssT0FBTCxDQUFhLElBQWIsR0FBb0IsY0FBcEIsQ0FGVTtBQUdWLFdBQUssT0FBTCxDQUFhLFNBQWIsR0FBeUIsT0FBekIsQ0FIVTtBQUlWLFVBQUksWUFBWSxXQUFXLEtBQUssS0FBTCxDQUpqQjtBQUtWLFVBQUksVUFBVSxLQUFLLE9BQUwsQ0FBYSxXQUFiLENBQXlCLFNBQXpCLENBQVYsQ0FMTTtBQU1WLFVBQUksUUFBUSxRQUFRLEtBQVIsQ0FORjtBQU9WLFVBQUksU0FBUyxNQUFPLFFBQVEsQ0FBUixDQVBWO0FBUVYsV0FBSyxPQUFMLENBQWEsUUFBYixDQUFzQixTQUF0QixFQUFpQyxNQUFqQyxFQUF5QyxFQUF6QyxFQVJVOzs7OzJCQVdMLGFBQWE7QUFDbEIsaUNBbFJTLDRDQWtSSSxZQUFiLENBRGtCOztBQUdsQixVQUFJLEtBQUssT0FBTCxDQUFhLEtBQWIsSUFBc0IsS0FBSyxTQUFMLEtBQW1CLE1BQW5CLEVBQTJCO0FBQ25ELGFBQUssU0FBTCxHQUFpQixNQUFqQixDQURtRDtBQUVuRCxnQkFBUSxHQUFSLENBQVksWUFBWixFQUZtRDtBQUduRCxhQUFLLGVBQUwsR0FIbUQ7QUFJbkQsYUFBSyxXQUFMLEdBQW1CLEtBQW5CLENBSm1EO09BQXJEOztBQU9BLFVBQUksS0FBSyxhQUFMLEtBQXVCLENBQXZCLElBQTRCLEtBQUssV0FBTCxFQUFrQjs7QUFDaEQsYUFBSyxlQUFMLEdBRGdEO0FBRWhELFlBQUksS0FBSyxXQUFMLEdBQW1CLENBQW5CLEVBQXNCOztBQUN4QixlQUFLLFdBQUwsQ0FBaUIsV0FBVyxLQUFLLEtBQUwsQ0FBNUIsQ0FEd0I7QUFFeEIsZUFBSyxXQUFMLElBQW9CLFdBQXBCLENBRndCO1NBQTFCLE1BR087QUFDTCxlQUFLLFdBQUwsR0FBbUIsRUFBbkIsQ0FESztBQUVMLGVBQUssS0FBTDs7OztBQUZLLGNBTUwsQ0FBSyxTQUFMLENBQWUsVUFBUyxLQUFULEVBQWdCO0FBQzdCLGdCQUFJLGlDQUFKLEVBQThCO0FBQzVCLG1CQUFLLGFBQUwsR0FENEI7QUFFNUIsb0JBQU0sTUFBTixHQUFlLElBQWYsQ0FGNEI7QUFHNUIsb0JBQU0sS0FBTixHQUFjLENBQWQsQ0FINEI7YUFBOUI7V0FEYSxFQU1aLElBTkgsRUFOSztTQUhQO09BRkY7Ozs7U0EzUlM7Ozs7O0FDdERiOzs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUNBOzs7Ozs7OztJQUVhOzs7QUFDWCxXQURXLE9BQ1gsQ0FBWSxLQUFaLEVBQW1CLE1BQW5CLEVBQTJCLE1BQTNCLEVBQW1DLEtBQW5DLEVBQTBDLE1BQTFDLEVBQWtELE1BQWxELEVBQTBELElBQTFELEVBQWdFLElBQWhFLEVBQXNFOzBCQUQzRCxTQUMyRDs7dUVBRDNELHFCQUdBOztBQUYyRDs7QUFHcEUsVUFBSyxRQUFMLEdBQWdCLENBQWhCLENBSG9FO0FBSXBFLFVBQUssUUFBTCxHQUFnQixLQUFoQixDQUpvRTtBQUtwRSxVQUFLLFVBQUwsR0FBa0IsRUFBbEIsQ0FMb0U7QUFNcEUsVUFBSyxVQUFMLEdBQWtCLElBQWxCLENBTm9FO0FBT3BFLFVBQUssVUFBTCxHQUFrQixFQUFsQixDQVBvRTtBQVFwRSxVQUFLLFNBQUwsR0FBaUIsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLEVBQUgsRUFBeEIsQ0FSb0U7O0dBQXRFOztlQURXOzt5QkFZTixNQUFNLGFBQWE7QUFDdEIsVUFBSSxLQUFLLE1BQUwsRUFBYTtBQUNmLG1DQWRPLDZDQWNJLE1BQU0sWUFBakIsQ0FEZTtBQUVmLFlBQUksS0FBSyxTQUFMLEVBQWdCO0FBQ2xCLGVBQUssT0FBTCxDQUFhLElBQWIsR0FBb0IsY0FBcEIsQ0FEa0I7QUFFbEIsZUFBSyxPQUFMLENBQWEsU0FBYixHQUF5QixLQUF6QixDQUZrQjtBQUdsQixlQUFLLE9BQUwsQ0FBYSxRQUFiLENBQXNCLFNBQXRCLEVBQ0UsS0FBSyxJQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsQ0FBYixFQUNiLEtBQUssSUFBTCxHQUFZLEVBQVosQ0FGRixDQUhrQjtTQUFwQjtPQUZGLE1BU08sSUFBSSxLQUFLLEtBQUwsSUFBYyxHQUFkLEVBQW1CO0FBQzVCLGFBQUssS0FBTCxJQUFjLEdBQWQsQ0FENEI7QUFFNUIsYUFBSyxPQUFMLENBQWEsV0FBYixHQUEyQixLQUFLLEtBQUwsQ0FGQztBQUc1QixtQ0F6Qk8sNkNBeUJJLE1BQU0sWUFBakIsQ0FINEI7QUFJNUIsYUFBSyxPQUFMLENBQWEsV0FBYixHQUEyQixDQUEzQixDQUo0QjtPQUF2Qjs7Ozs4QkFRQyxNQUFNLFFBQVE7QUFDdEIsVUFBSSxnQkFBZ0I7QUFDbEIsV0FBRyxLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsR0FBb0IsS0FBSyxVQUFMLENBQWdCLENBQWhCO0FBQ3ZCLFdBQUcsS0FBSyxVQUFMLENBQWdCLENBQWhCLEdBQW9CLEtBQUssVUFBTCxDQUFnQixDQUFoQjtPQUZyQixDQURrQjtBQUt0QixVQUFJLFNBQVMsRUFBVCxDQUxrQjtBQU10QixVQUFJLFlBQVksRUFBWixDQU5rQjtBQU90QixnQkFBVSxDQUFWLEdBQWMsT0FBTyxJQUFQLEdBQWMsQ0FBZCxDQVBRO0FBUXRCLGdCQUFVLENBQVYsR0FBYyxPQUFPLElBQVAsQ0FSUTtBQVN0QixnQkFBVSxDQUFWLEdBQWMsRUFBZCxDQVRzQjtBQVV0QixnQkFBVSxDQUFWLEdBQWUsRUFBZixDQVZzQjtBQVd0QixhQUFPLElBQVAsQ0FBWSxTQUFaLEVBWHNCO0FBWXRCLFVBQUksY0FBYyxLQUFLLE9BQUwsQ0FBYSxRQUFiLENBQ2hCLEtBQUssVUFBTCxDQUFnQixDQUFoQixFQUFtQixLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsRUFBbUIsVUFBVSxDQUFWLEVBQWEsVUFBVSxDQUFWLENBRGpELENBWmtCO0FBY3RCLFdBQUssTUFBTCxHQUFjLElBQWQsQ0Fkc0I7QUFldEIsV0FBSyxNQUFMLEdBQWMsS0FBZCxDQWZzQjs7QUFpQnRCLFVBQUksY0FBYyxLQUFLLE9BQUwsQ0FBYSx5QkFBYixDQUNoQixLQUFLLFVBQUwsRUFBaUIsS0FBSyxVQUFMLEVBQWlCLEtBQUssWUFBTCxDQURoQyxDQWpCa0I7QUFtQnRCLFVBQUksZUFBZSxLQUFLLE9BQUwsQ0FBYSx5QkFBYixDQUNqQixLQUFLLFVBQUwsRUFBaUIsS0FBSyxVQUFMLEVBQWlCLE1BRGpCLENBQWYsQ0FuQmtCOztBQXNCdEIsVUFBSSxlQUFKLENBdEJzQixJQXNCTixrQkFBSixDQXRCVTtBQXVCdEIsVUFBSSxXQUFDLElBQWUsWUFBWSxHQUFaLElBQ2YsZ0JBQWdCLGFBQWEsR0FBYixFQUFtQjtBQUN0QyxZQUFJLFNBQVMsS0FBSyxPQUFMLENBQWEsZUFBYixDQUE2QixJQUE3QixFQUM2QixXQUQ3QixFQUMwQyxZQUQxQyxDQUFULENBRGtDO0FBR3RDLGlCQUFTLE9BQU8sTUFBUCxDQUg2QjtBQUl0QyxvQkFBWSxPQUFPLFNBQVAsQ0FKMEI7T0FEeEMsTUFNTztBQUNMLFlBQUksZUFBZSxZQUFZLEdBQVosRUFBaUI7O0FBRWxDLG1CQUFTLG1CQUFVLFlBQVksTUFBWixDQUFtQixDQUFuQixFQUNqQixZQUFZLE1BQVosQ0FBbUIsQ0FBbkIsQ0FERixDQUZrQztBQUlsQyxlQUFLLE9BQUwsQ0FBYSxXQUFiLEdBQTJCLEtBQTNCLENBSmtDO1NBQXBDLE1BS08sSUFBSSxnQkFBZ0IsYUFBYSxHQUFiLEVBQWtCO0FBQzNDLG1CQUFTLG1CQUFVLGFBQWEsTUFBYixDQUFvQixDQUFwQixFQUNqQixhQUFhLE1BQWIsQ0FBb0IsQ0FBcEIsQ0FERixDQUQyQztBQUczQyxzQkFBWSxJQUFaLENBSDJDO1NBQXRDLE1BSUE7QUFDTCxtQkFBUyxtQkFBVSxjQUFjLENBQWQsRUFBaUIsY0FBYyxDQUFkLENBQXBDLENBREs7U0FKQTtPQVpUOztBQXFCQSxVQUFJLGNBQWMsS0FBSyxPQUFMLENBQWEsZUFBYixDQUE2QixLQUFLLFVBQUwsQ0FBM0MsQ0E1Q2tCO0FBNkN0QixVQUFJLGNBQWMsS0FBSyxPQUFMLENBQWEsZUFBYixDQUE2QixXQUE3QixDQUFkLENBN0NrQjs7QUErQ3RCLFdBQUssT0FBTCxDQUFhLFNBQWIsR0EvQ3NCO0FBZ0R0QixXQUFLLE9BQUwsQ0FBYSxNQUFiLENBQW9CLEtBQUssVUFBTCxDQUFnQixDQUFoQixFQUFtQixLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsQ0FBdkMsQ0FoRHNCO0FBaUR0QixXQUFLLE9BQUwsQ0FBYSxNQUFiLENBQW9CLE9BQU8sQ0FBUCxFQUFVLE9BQU8sQ0FBUCxDQUE5QixDQWpEc0I7QUFrRHRCLFdBQUssT0FBTCxDQUFhLFNBQWIsR0FsRHNCO0FBbUR0QixXQUFLLE9BQUwsQ0FBYSxXQUFiLEdBQTJCLGdCQUNBLGFBQWEsR0FBYixHQUFtQixLQURuQixHQUMyQixNQUQzQixDQW5ETDtBQXFEdEIsV0FBSyxPQUFMLENBQWEsTUFBYixHQXJEc0I7O0FBdUR0QixVQUFJLENBQUMsU0FBRCxFQUFZO0FBQ2QsWUFBSSxrQkFBSixDQURjO0FBRWQsWUFBSSxLQUFLLElBQUwsS0FBYyxDQUFkLEVBQWlCO0FBQ25CLGNBQUksY0FBYyxHQUFkLEVBQW1CO0FBQ3JCLDJCQUFlLEdBQWYsQ0FEcUI7V0FBdkI7QUFHQSxjQUFJLGNBQWMsR0FBZCxFQUFtQjtBQUNyQiwyQkFBZSxHQUFmLENBRHFCO1dBQXZCO1NBSkY7QUFRQSxZQUFJLGNBQWMsV0FBZCxFQUEyQjtBQUM3QixjQUFJLGNBQWMsV0FBZCxHQUE0QixDQUE1QixFQUErQjtBQUNqQyx3QkFBWSxjQUFjLENBQWQsQ0FEcUI7V0FBbkMsTUFFTztBQUNMLHdCQUFZLGNBQWMsR0FBZCxDQURQO1dBRlA7QUFLQSxlQUFLLFVBQUwsR0FBa0IsS0FBSyxPQUFMLENBQWEsUUFBYixDQUFzQixTQUF0QixFQUFpQyxLQUFLLFVBQUwsQ0FBbkQsQ0FONkI7U0FBL0IsTUFPTztBQUNMLGNBQUksY0FBYyxXQUFkLEdBQTRCLENBQTVCLEVBQStCO0FBQ2pDLHdCQUFZLGNBQWMsQ0FBZCxDQURxQjtXQUFuQyxNQUVPO0FBQ0wsd0JBQVksY0FBYyxHQUFkLENBRFA7V0FGUDtBQUtBLGVBQUssVUFBTCxHQUFrQixLQUFLLE9BQUwsQ0FBYSxRQUFiLENBQXNCLFNBQXRCLEVBQWlDLEtBQUssVUFBTCxDQUFuRCxDQU5LO1NBUFA7T0FWRixNQXlCTztBQUNMLFlBQUksQ0FBQyxLQUFLLFNBQUwsRUFBZ0I7QUFDbkIsaUJBQU8sYUFBUCxHQUF1QixDQUF2QixDQURtQjtBQUVuQixpQkFBTyxNQUFQLElBQWlCLENBQWpCLENBRm1CO0FBR25CLGVBQUssaUJBQUwsR0FBeUIsT0FBekIsQ0FIbUI7U0FBckI7T0ExQkY7Ozs7MkJBa0NLLE1BQU0sYUFBYTtBQUN4QixpQ0F4SFMsK0NBd0hJLE1BQU0sWUFBbkIsQ0FEd0I7QUFFeEIsV0FBSyxVQUFMLEdBQWtCO0FBQ2hCLFdBQUcsS0FBSyxJQUFMLEdBQWEsS0FBSyxLQUFMLEdBQWEsQ0FBYjtBQUNoQixXQUFHLEtBQUssSUFBTCxHQUFZLEVBQVo7T0FGTCxDQUZ3QjtBQU14QixXQUFLLFVBQUwsR0FBa0IsS0FBbEIsQ0FOd0I7QUFPeEIsV0FBSyxRQUFMLElBQWlCLFdBQWpCLENBUHdCO0FBUXhCLFVBQUksS0FBSyxRQUFMLElBQWlCLENBQWpCLElBQXNCLENBQUMsS0FBSyxNQUFMLEVBQWE7QUFDdEMsYUFBSyxNQUFMLEdBQWMsUUFBUSxLQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLENBQWxCLENBQVIsQ0FBZCxDQURzQztBQUV0QyxhQUFLLFFBQUwsR0FBZ0IsS0FBSyxTQUFMLENBQWUsQ0FBZixFQUFrQixDQUFsQixDQUFoQixDQUZzQztBQUd0QyxZQUFJLGdCQUFnQixLQUFLLFNBQUwsQ0FBZSxDQUFmLEVBQWtCLENBQWxCLENBQWhCLENBSGtDO0FBSXRDLGFBQUssSUFBTCxHQUFZLG9CQUFXLFVBQVgsQ0FBc0IsYUFBdEIsRUFBcUMsQ0FBckMsQ0FKMEI7QUFLdEMsYUFBSyxJQUFMLEdBQVksb0JBQVcsVUFBWCxDQUFzQixhQUF0QixFQUFxQyxDQUFyQyxDQUwwQjtPQUF4QztBQU9BLFdBQUssYUFBTCxHQUFxQixDQUFyQixDQWZ3QjtBQWdCeEIsV0FBSyxnQkFBTCxDQUFzQixJQUF0QixrQkFBb0MsVUFBUyxNQUFULEVBQWlCO0FBQ25ELGFBQUssYUFBTCxJQUFzQixDQUF0QixDQURtRDtBQUVuRCxhQUFLLFVBQUwsR0FBa0IsT0FBbEIsQ0FGbUQ7O0FBSW5ELFlBQUksQ0FBQyxLQUFLLE1BQUwsRUFBYTs7QUFDaEIsY0FBSSxzQkFBSixDQURnQjtBQUVoQixjQUFJLEtBQUssSUFBTCxLQUFjLENBQUMsQ0FBRCxJQUFNLEtBQUssSUFBTCxLQUFjLENBQWQsRUFBaUI7QUFDdkMsNEJBQWdCO0FBQ2QsaUJBQUcsQ0FBQyxLQUFLLFVBQUwsQ0FBZ0IsQ0FBaEIsR0FBb0IsS0FBSyxVQUFMLENBQXJCLEdBQXdDLENBQUMsS0FBSyxJQUFMO0FBQzVDLGlCQUFHLEtBQUssVUFBTCxDQUFnQixDQUFoQjthQUZMLENBRHVDO1dBQXpDLE1BS08sSUFBSSxLQUFLLElBQUwsS0FBYyxDQUFDLENBQUQsSUFBTSxLQUFLLElBQUwsS0FBYyxDQUFkLEVBQWlCO0FBQzlDLDRCQUFnQjtBQUNkLGlCQUFHLEtBQUssVUFBTCxDQUFnQixDQUFoQjtBQUNILGlCQUFHLENBQUMsS0FBSyxVQUFMLENBQWdCLENBQWhCLEdBQW9CLEtBQUssVUFBTCxDQUFyQixHQUF3QyxDQUFDLEtBQUssSUFBTDthQUY5QyxDQUQ4QztXQUF6QztBQU1QLGVBQUssVUFBTCxHQUFrQixLQUFLLE9BQUwsQ0FBYSxRQUFiLENBQ2hCLGNBQWMsQ0FBZCxFQUFpQixjQUFjLENBQWQsRUFBaUIsS0FBSyxVQUFMLENBQWdCLENBQWhCLEVBQ2xDLEtBQUssVUFBTCxDQUFnQixDQUFoQixDQUZGLENBYmdCO1NBQWxCO0FBaUJBLGFBQUssU0FBTCxDQUFlLElBQWYsRUFBcUIsTUFBckIsRUFyQm1EO09BQWpCLENBQXBDLENBaEJ3Qjs7QUF3Q3hCLFVBQUksS0FBSyxhQUFMLEtBQXVCLENBQXZCLEVBQTBCO0FBQzVCLGFBQUssYUFBTCxHQUFxQixJQUFyQixDQUQ0QjtBQUU1QixhQUFLLE1BQUwsR0FBYyxLQUFkLENBRjRCO09BQTlCOztBQUtBLFdBQUssb0JBQUwsQ0FBMEIsSUFBMUIsa0JBQXdDLFVBQVMsTUFBVCxFQUFpQjtBQUN2RCxlQUFPLE1BQVAsR0FBZ0IsS0FBaEIsQ0FEdUQ7QUFFdkQsYUFBSyxVQUFMLEdBQWtCLE9BQWxCLENBRnVEO0FBR3ZELGFBQUssTUFBTCxHQUFjLEtBQWQsQ0FIdUQ7QUFJdkQsYUFBSyxhQUFMLEdBSnVEO0FBS3ZELGFBQUssS0FBTCxHQUx1RDtPQUFqQixDQUF4QyxDQTdDd0I7Ozs7U0F2SGY7Ozs7OztBQ0xiOzs7Ozs7Ozs7OztBQUVBOztJQUFZOztBQUNaOztBQUNBOzs7Ozs7Ozs7O0lBRWE7OztBQUNYLFdBRFcsTUFDWCxDQUFZLEtBQVosRUFBbUIsTUFBbkIsRUFBMkIsTUFBM0IsRUFBbUMsS0FBbkMsRUFBMEMsTUFBMUMsRUFBa0QsTUFBbEQsRUFBMEQsSUFBMUQsRUFBZ0UsSUFBaEUsRUFBc0U7MEJBRDNELFFBQzJEOzt1RUFEM0Qsb0JBRUEsWUFEMkQ7O0FBRXBFLFVBQUssTUFBTCxHQUFjLEdBQWQsQ0FGb0U7QUFHcEUsVUFBSyxhQUFMLEdBQXFCLENBQXJCLENBSG9FO0FBSXBFLFVBQUssU0FBTCxHQUFpQixFQUFDLEdBQUcsQ0FBSCxFQUFNLEdBQUcsRUFBSCxFQUF4QixDQUpvRTs7R0FBdEU7O2VBRFc7O3lCQVFOLE1BQU0sYUFBYTtBQUN0QixVQUFJLEtBQUssU0FBTCxLQUFtQixTQUFuQixFQUE4QjtBQUNoQyxtQ0FWTyw0Q0FVSSxNQUFNLFlBQWpCLENBRGdDO09BQWxDO0FBR0EsVUFBSSxLQUFLLE1BQUwsRUFBYTtBQUNmLGFBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsSUFBakIsRUFBdUIsV0FBdkIsRUFEZTtPQUFqQjtBQUdBLFVBQUksWUFBYSxDQUFDLE1BQU0sS0FBSyxNQUFMLENBQVAsR0FBc0IsR0FBdEIsQ0FQSztBQVF0QixXQUFLLE9BQUwsQ0FBYSxTQUFiLEdBQXlCLGdCQUFnQixTQUFoQixHQUE0QixHQUE1QixDQVJIO0FBU3RCLFdBQUssT0FBTCxDQUFhLFFBQWIsQ0FBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFBNEIsS0FBSyxNQUFMLENBQVksS0FBWixFQUFtQixLQUFLLE1BQUwsQ0FBWSxNQUFaLENBQS9DLENBVHNCOzs7OzJCQVlqQixNQUFNLGFBQWE7QUFDeEIsVUFBSSxLQUFLLE1BQUwsSUFBZSxDQUFmLEVBQWtCO0FBQ3BCLGFBQUssTUFBTCxHQUFjLEtBQWQsQ0FEb0I7QUFFcEIsYUFBSyxTQUFMLEdBQWlCLE1BQWpCLENBRm9CO0FBR3BCLGdCQUFRLEdBQVIsQ0FBWSxPQUFaLEVBSG9CO0FBSXBCLFlBQUksS0FBSyxNQUFMLElBQWUsS0FBSyxNQUFMLENBQVksTUFBWixFQUFvQjtBQUNyQyxlQUFLLE1BQUwsR0FBYyxJQUFkLENBRHFDO0FBRXJDLGlCQUFPLEtBQUssTUFBTCxDQUFZLFlBQVosQ0FGOEI7U0FBdkM7Ozs7Ozs7O0FBSm9CLE9BQXRCOztBQWlCQSxVQUFJLEtBQUssU0FBTCxLQUFtQixTQUFuQixFQUE4QjtBQUNoQyxlQURnQztPQUFsQztBQUdBLFVBQUksT0FBTyxDQUFQLENBckJvQjtBQXNCeEIsVUFBSSxPQUFPLENBQVAsQ0F0Qm9CO0FBdUJ4QixXQUFLLFVBQUwsR0FBa0IsTUFBbEIsQ0F2QndCOztBQXlCeEIsVUFBSSxLQUFLLE1BQUwsSUFBZSxDQUFmLEVBQWtCO0FBQ3BCLGFBQUssVUFBTCxHQUFrQixPQUFsQixDQURvQjtPQUF0Qjs7QUFJQSxVQUFJLEtBQUssTUFBTCxHQUFjLEdBQWQsRUFBbUI7QUFDckIsWUFBSSxLQUFLLGFBQUwsR0FBcUIsQ0FBckIsRUFBd0I7QUFDMUIsZUFBSyxNQUFMLElBQWUsQ0FBZixDQUQwQjtTQUE1QixNQUVPO0FBQ0wsZUFBSyxhQUFMLElBQXNCLFdBQXRCLENBREs7U0FGUDtPQURGOztBQVFBLFVBQUksS0FBSyxPQUFMLENBQWEsRUFBYixFQUFpQjtBQUNuQixlQUFPLENBQUMsQ0FBRCxDQURZO0FBRW5CLGFBQUssSUFBTCxHQUFZLENBQVosQ0FGbUI7QUFHbkIsYUFBSyxJQUFMLEdBQVksSUFBWixDQUhtQjtPQUFyQjtBQUtBLFVBQUksS0FBSyxPQUFMLENBQWEsSUFBYixFQUFtQjtBQUNyQixlQUFPLENBQVAsQ0FEcUI7QUFFckIsYUFBSyxJQUFMLEdBQVksQ0FBWixDQUZxQjtBQUdyQixhQUFLLElBQUwsR0FBWSxJQUFaLENBSHFCO09BQXZCO0FBS0EsVUFBSSxLQUFLLE9BQUwsQ0FBYSxJQUFiLEVBQW1CO0FBQ3JCLGVBQU8sQ0FBQyxDQUFELENBRGM7QUFFckIsYUFBSyxJQUFMLEdBQVksQ0FBWixDQUZxQjtBQUdyQixhQUFLLElBQUwsR0FBWSxJQUFaLENBSHFCO09BQXZCO0FBS0EsVUFBSSxLQUFLLE9BQUwsQ0FBYSxLQUFiLEVBQW9CO0FBQ3RCLGVBQU8sQ0FBUCxDQURzQjtBQUV0QixhQUFLLElBQUwsR0FBWSxDQUFaLENBRnNCO0FBR3RCLGFBQUssSUFBTCxHQUFZLElBQVosQ0FIc0I7T0FBeEI7QUFLQSxVQUFJLEtBQUssTUFBTCxFQUFhOztBQUVmLFlBQUksQ0FBQyxLQUFLLE1BQUwsQ0FBWSxNQUFaLEVBQW9CO0FBQ3ZCLGVBQUssTUFBTCxHQUFjLElBQWQsQ0FEdUI7QUFFdkIsaUJBQU8sS0FBSyxNQUFMLENBQVksWUFBWixDQUZnQjtTQUF6QjtPQUZGLE1BTU87QUFDTCxZQUFJLEtBQUssT0FBTCxDQUFhLE9BQWIsRUFBc0I7QUFDeEIsZUFBSyxVQUFMLENBQWdCLElBQWhCLEVBQXNCLENBQXRCLEVBQXlCLENBQUMsQ0FBRCxDQUF6QixDQUR3QjtTQUExQjtBQUdBLFlBQUksS0FBSyxPQUFMLENBQWEsU0FBYixFQUF3QjtBQUMxQixlQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsRUFBc0IsQ0FBdEIsRUFBeUIsQ0FBekIsRUFEMEI7U0FBNUI7QUFHQSxZQUFJLEtBQUssT0FBTCxDQUFhLFNBQWIsRUFBd0I7QUFDMUIsZUFBSyxVQUFMLENBQWdCLElBQWhCLEVBQXNCLENBQUMsQ0FBRCxFQUFJLENBQTFCLEVBRDBCO1NBQTVCO0FBR0EsWUFBSSxLQUFLLE9BQUwsQ0FBYSxVQUFiLEVBQXlCO0FBQzNCLGVBQUssVUFBTCxDQUFnQixJQUFoQixFQUFzQixDQUF0QixFQUF5QixDQUF6QixFQUQyQjtTQUE3QjtPQWhCRjs7QUFxQkEsVUFBSSxTQUFTLENBQUMsQ0FBRCxJQUFNLEtBQUssTUFBTCxLQUFnQixNQUFoQixFQUF3QjtBQUN6QyxhQUFLLFFBQUwsR0FBZ0IsS0FBSyxLQUFMLENBQVcsR0FBWCxDQUR5QjtBQUV6QyxhQUFLLE1BQUwsR0FBYyxNQUFkLENBRnlDO09BQTNDOztBQUtBLFVBQUksU0FBUyxDQUFULElBQWMsS0FBSyxNQUFMLEtBQWdCLE9BQWhCLEVBQXlCO0FBQ3pDLGFBQUssUUFBTCxHQUFnQixLQUFLLEtBQUwsQ0FEeUI7QUFFekMsYUFBSyxNQUFMLEdBQWMsT0FBZCxDQUZ5QztPQUEzQzs7QUFLQSxVQUFJLFlBQVksaUJBQVEsS0FBSyxJQUFMLEVBQVcsS0FBSyxJQUFMLEVBQVcsS0FBSyxLQUFMLEVBQzVDLEtBQUssTUFBTCxDQURFLENBeEZvQjtBQTBGeEIsVUFBSSxlQUFlO0FBQ2pCLFdBQUcsSUFBQyxDQUFLLE1BQUwsR0FBYyxXQUFkLEdBQTZCLElBQTlCO0FBQ0gsV0FBRyxJQUFDLENBQUssTUFBTCxHQUFjLFdBQWQsR0FBNkIsSUFBOUI7T0FGRCxDQTFGb0I7QUE4RnhCLFVBQUksU0FBUyxLQUFLLE9BQUwsQ0FBYSxpQkFBYixDQUErQixTQUEvQixFQUEwQyxZQUExQyxFQUNYLEtBQUssWUFBTCxDQURFLENBOUZvQjtBQWdHeEIsVUFBSSxVQUFVLE9BQU8sR0FBUCxFQUFZO0FBQ3hCLGFBQUssSUFBTCxHQUFZLE9BQU8sTUFBUCxDQUFjLENBQWQsR0FBbUIsS0FBSyxLQUFMLEdBQWEsQ0FBYixDQURQO0FBRXhCLGFBQUssSUFBTCxHQUFZLE9BQU8sTUFBUCxDQUFjLENBQWQsR0FBbUIsS0FBSyxNQUFMLEdBQWMsQ0FBZCxDQUZQO09BQTFCLE1BR087QUFDTCxhQUFLLElBQUwsSUFBYSxhQUFhLENBQWIsQ0FEUjtBQUVMLGFBQUssSUFBTCxJQUFhLGFBQWEsQ0FBYixDQUZSO09BSFA7O0FBUUEsVUFBSSxJQUFDLENBQUssSUFBTCxHQUFZLEtBQUssS0FBTCxHQUFjLEtBQUssTUFBTCxDQUFZLEtBQVosRUFBbUI7QUFDaEQsWUFBSSxRQUFRLElBQUMsQ0FBSyxJQUFMLEdBQVksS0FBSyxLQUFMLEdBQWMsS0FBSyxNQUFMLENBQVksS0FBWixHQUFvQixLQUFLLEtBQUwsQ0FEWDtBQUVoRCxZQUFJLEtBQUssSUFBTCxLQUFjLENBQWQsRUFBaUI7QUFDbkIsZUFBSyxJQUFMLEdBQVksS0FBWixDQURtQjtTQUFyQjtPQUZGO0FBTUEsVUFBSSxLQUFLLElBQUwsR0FBWSxDQUFaLEVBQWU7QUFDakIsWUFBSSxLQUFLLElBQUwsS0FBYyxDQUFDLENBQUQsRUFBSTtBQUNwQixlQUFLLElBQUwsR0FBWSxLQUFLLElBQUwsR0FBWSxLQUFLLE1BQUwsQ0FBWSxLQUFaLENBREo7U0FBdEI7T0FERjtBQUtBLFVBQUksSUFBQyxDQUFLLElBQUwsR0FBWSxLQUFLLE1BQUwsR0FBZSxLQUFLLE1BQUwsQ0FBWSxNQUFaLEVBQW9CO0FBQ2xELFlBQUksUUFBUSxJQUFDLENBQUssSUFBTCxHQUFZLEtBQUssTUFBTCxHQUFlLEtBQUssTUFBTCxDQUFZLE1BQVosR0FBcUIsS0FBSyxNQUFMLENBRFg7QUFFbEQsWUFBSSxLQUFLLElBQUwsS0FBYyxDQUFkLEVBQWlCO0FBQ25CLGVBQUssSUFBTCxHQUFZLEtBQVosQ0FEbUI7U0FBckI7T0FGRjtBQU1BLFVBQUksS0FBSyxJQUFMLEdBQVksQ0FBWixFQUFlO0FBQ2pCLFlBQUksS0FBSyxJQUFMLEtBQWMsQ0FBQyxDQUFELEVBQUk7QUFDcEIsZUFBSyxJQUFMLEdBQVksS0FBSyxJQUFMLEdBQVksS0FBSyxNQUFMLENBQVksTUFBWixDQURKO1NBQXRCO09BREY7O0FBTUEsV0FBSyxvQkFBTCxDQUEwQixJQUExQixFQUFnQyxTQUFTLE9BQVQsRUFBa0IsVUFBUyxLQUFULEVBQWdCO0FBQ2hFLGFBQUssVUFBTCxHQUFrQixPQUFsQixDQURnRTtBQUVoRSxZQUFJLENBQUMsS0FBSyxTQUFMLEVBQWdCO0FBQ25CLGVBQUssTUFBTCxJQUFlLEVBQWYsQ0FEbUI7U0FBckI7QUFHQSxZQUFJLEtBQUssTUFBTCxJQUFlLENBQWYsRUFBa0I7QUFDcEIsZUFBSyxpQkFBTCxHQUF5QixNQUF6QixDQURvQjtTQUF0QjtPQUxnRCxDQUFsRDs7O0FBL0h3QixVQTBJeEIsQ0FBSyxRQUFMLENBQWMsSUFBZCxFQUFvQixXQUFwQixFQTFJd0I7Ozs7Ozs7K0JBOElmLE1BQU0sTUFBTSxNQUFNO0FBQzNCLFdBQUssTUFBTCxHQUFjLG1CQUFXLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxHQUFZLEVBQVosRUFBZ0IsR0FBdEMsRUFBMkMsSUFBM0MsRUFBaUQsSUFBakQsQ0FBZCxDQUQyQjtBQUUzQixXQUFLLE1BQUwsQ0FBWSxZQUFaLEdBQTJCLEtBQUssTUFBTCxDQUZBOzs7O1NBbEtsQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQaHlzaWNzLCBCb3gsIFBvaW50LCBFUFNJTE9OfSBmcm9tICcuL3BoeXNpY3MnO1xuXG5leHBvcnQgdmFyIERpcmVjdGlvbnMgPSB7XG4gIFVQOiAwLFxuICBET1dOOiAxLFxuICBMRUZUOiAyLFxuICBSSUdIVDogMyxcbiAgZGlyZWN0aW9uczogW1xuICAgIHt4OiAwLCB5OiAtMX0sXG4gICAge3g6IDAsIHk6IDF9LFxuICAgIHt4OiAtMSwgeTogMH0sXG4gICAge3g6IDEsIHk6IDB9XSxcbiAgbmFtZXM6ICBbJ3VwJywgJ2Rvd24nLCAnbGVmdCcsICdyaWdodCddLFxuICBnZXRJbmRleChkaXJYLCBkaXJZKSB7XG4gICAgaWYgKGRpclggPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5SSUdIVDtcbiAgICB9IGVsc2UgaWYgKGRpclggPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5MRUZUO1xuICAgIH0gZWxzZSBpZiAoZGlyWSA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLkRPV047XG4gICAgfSBlbHNlIGlmIChkaXJZIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuVVA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLlJJR0hUO1xuICAgIH1cbiAgfSxcbiAgZ2V0TmFtZShkaXJYLCBkaXJZKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXNbdGhpcy5nZXRJbmRleChkaXJYLCBkaXJZKV07XG4gIH1cbn07XG5cbmV4cG9ydCBjbGFzcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgbGV0IHVuc2NhbGVkV2lkdGgsIHVuc2NhbGVkSGVpZ2h0O1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgdGhpcy5pbWFnZSA9IGltYWdlO1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IHRoaXMuaW1hZ2U7XG4gICAgICB0aGlzLmRpckltYWdlcyA9IHtcbiAgICAgICAgcmlnaHQ6IGltYWdlLFxuICAgICAgICBsZWZ0OiBpbWFnZS5yZXYsXG4gICAgICAgIHVwOiBpbWFnZS51cCxcbiAgICAgICAgZG93bjogaW1hZ2UuZG93blxuICAgICAgfTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGlySW1hZ2VzKTtcbiAgICAgIHVuc2NhbGVkV2lkdGggPSBpbWFnZS53O1xuICAgICAgdW5zY2FsZWRIZWlnaHQgPSBpbWFnZS5oO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmltYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSBudWxsO1xuICAgICAgdGhpcy5kaXJJbWFnZXMgPSB7XG4gICAgICAgIHJpZ2h0OiBudWxsLFxuICAgICAgICBsZWZ0OiBudWxsLFxuICAgICAgICB1cDogbnVsbCxcbiAgICAgICAgZG93bjogbnVsbFxuICAgICAgfTtcbiAgICAgIHVuc2NhbGVkV2lkdGggPSAxO1xuICAgICAgdW5zY2FsZWRIZWlnaHQgPSAxO1xuICAgIH1cblxuICAgIHRoaXMucHJldmlvdXNEaXIgPSB7eDogdGhpcy5kaXJYLCB5OiB0aGlzLmRpcll9O1xuICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuXG4gICAgdGhpcy5mYWNpbmcgPSAncmlnaHQnO1xuICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgdGhpcy5kaXJZID0gZGlyWTtcbiAgICB0aGlzLndpZHRoID0gdW5zY2FsZWRXaWR0aCAqIChzY2FsZSAvIDEwMCk7XG4gICAgdGhpcy5oZWlnaHQgPSB1bnNjYWxlZEhlaWdodCAqIChzY2FsZSAvIDEwMCk7XG4gICAgdGhpcy5jdXJYID0gc3RhcnRYO1xuICAgIHRoaXMuY3VyWSA9IHN0YXJ0WTtcbiAgICB0aGlzLnByZXZpb3VzUG9zID0ge3g6IHRoaXMuY3VyWCwgeTogdGhpcy5jdXJZfTtcbiAgICB0aGlzLnRpbGVzSW5GT1YgPSBbXTtcbiAgICB0aGlzLnNwZWVkWCA9IHNwZWVkWDtcbiAgICB0aGlzLnNwZWVkWSA9IHNwZWVkWTtcbiAgICB0aGlzLm1vdmluZyA9IHRydWU7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdyZWQnO1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMubGFzZXJEZWx0YSA9IHt9O1xuICAgIHRoaXMubGFzZXJSYW5nZSA9IDk0MDA7XG4gICAgdGhpcy5sYXNlclN0YXJ0ID0ge307XG4gIH1cblxuICBjb2xsaWRlc1dpdGhXYWxscyhnYW1lKSB7XG4gICAgbGV0IHJlc3VsdCA9IHtoaXQ6IGZhbHNlLCBkaXJYOiAwLCBkaXJZOiAwfTtcbiAgICAvLyBIaXQgdGhlIExlZnQgV2FsbFxuICAgIGlmICh0aGlzLmN1clggPCAwKSB7XG4gICAgICB0aGlzLmN1clggPSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWDogMX07XG4gICAgfVxuICAgIC8vIEhpdCByaWdodCB3YWxsXG4gICAgaWYgKHRoaXMuY3VyWCA+IChnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGgpKSB7XG4gICAgICB0aGlzLmN1clggPSAoZ2FtZS5jYW52YXMud2lkdGggLSB0aGlzLndpZHRoKSAtIEVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJYOiAtMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgQ2VpbGluZ1xuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICB0aGlzLmN1clkgPSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWTogMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgRmxvb3JcbiAgICBpZiAodGhpcy5jdXJZID4gZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQpIHtcbiAgICAgIHRoaXMuY3VyWSA9IChnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodCkgLSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWTogLTF9O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgYWN0b3JDb25zdHJ1Y3RvciwgY2FsbGJhY2spIHtcbiAgICBnYW1lLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKCEoYWN0b3IgaW5zdGFuY2VvZiBhY3RvckNvbnN0cnVjdG9yKSB8fCAhYWN0b3IuYWN0aXZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCBvdmVybGFwcGluZyA9ICEoXG4gICAgICAgIHRoaXMuY3VyWCA+IGFjdG9yLmN1clggKyBhY3Rvci53aWR0aCB8fFxuICAgICAgICB0aGlzLmN1clggKyB0aGlzLndpZHRoIDwgYWN0b3IuY3VyWCB8fFxuICAgICAgICB0aGlzLmN1clkgKyB0aGlzLmhlaWdodCA8IGFjdG9yLmN1clkgfHxcbiAgICAgICAgdGhpcy5jdXJZID4gYWN0b3IuY3VyWSArIGFjdG9yLmhlaWdodFxuICAgICAgKTtcbiAgICAgIGlmIChvdmVybGFwcGluZykge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGFjdG9yKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIGdldFRpbGVzSW5GT1YoZ2FtZSkge1xuICAgIGxldCB0aWxlc0luRk9WID0gW107XG4gICAgbGV0IGJsb2NrcyA9IGdhbWUuc3RhdGljQmxvY2tzO1xuICAgIGZvciAobGV0IGkgPSAwLCBsaSA9IGJsb2Nrcy5sZW5ndGg7IGkgPCBsaTsgaSsrKSB7XG4gICAgICBsZXQgdmlzaW9uRGVsdGEgPSB7XG4gICAgICAgIHg6IChibG9ja3NbaV0ueCkgLSB0aGlzLmN1clgsXG4gICAgICAgIHk6IChibG9ja3NbaV0ueSkgLSB0aGlzLmN1cllcbiAgICAgIH07XG4gICAgICBsZXQgYmxvY2tEaXJMZW5ndGggPSBNYXRoLnNxcnQodmlzaW9uRGVsdGEueCAqIHZpc2lvbkRlbHRhLnggK1xuICAgICAgICB2aXNpb25EZWx0YS55ICogdmlzaW9uRGVsdGEueSk7XG4gICAgICBsZXQgYmxvY2tEaXIgPSB7fTtcbiAgICAgIGJsb2NrRGlyLnggPSB2aXNpb25EZWx0YS54IC8gYmxvY2tEaXJMZW5ndGg7XG4gICAgICBibG9ja0Rpci55ID0gdmlzaW9uRGVsdGEueSAvIGJsb2NrRGlyTGVuZ3RoO1xuICAgICAgbGV0IGRvdFByb2R1Y3QgPSAodGhpcy5kaXJYICogYmxvY2tEaXIueCkgKyAodGhpcy5kaXJZICogYmxvY2tEaXIueSk7XG4gICAgICBpZiAoZG90UHJvZHVjdCA+IDAuNzApIHtcbiAgICAgICAgdGlsZXNJbkZPVi5wdXNoKGdhbWUuc3RhdGljQmxvY2tzW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRpbGVzSW5GT1Y7XG4gIH1cblxuICBlYWNoVmlzaWJsZUFjdG9yKGdhbWUsIGFjdG9yQ29uc3RydWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgZ2FtZS5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGlmICghKGFjdG9yIGluc3RhbmNlb2YgYWN0b3JDb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUuZ2FtZVN0YXRlICE9PSAncGxheScpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbGV0IHZpc2lvblN0YXJ0ID0ge1xuICAgICAgICB4OiB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpICsgdGhpcy5leWVPZmZzZXQueCxcbiAgICAgICAgeTogdGhpcy5jdXJZICsgdGhpcy5leWVPZmZzZXQueVxuICAgICAgfTtcbiAgICAgIGxldCB2aXNpb25EZWx0YSA9IHtcbiAgICAgICAgeDogKGFjdG9yLmN1clggKyAoYWN0b3Iud2lkdGggLyAyKSArIGFjdG9yLmV5ZU9mZnNldC54KSAtIHZpc2lvblN0YXJ0LngsXG4gICAgICAgIHk6IChhY3Rvci5jdXJZICsgYWN0b3IuZXllT2Zmc2V0LnkpIC0gdmlzaW9uU3RhcnQueVxuICAgICAgfTtcbiAgICAgIGxldCBhY3RvckRpckxlbmd0aCA9IE1hdGguc3FydChcbiAgICAgICAgdmlzaW9uRGVsdGEueCAqIHZpc2lvbkRlbHRhLnggKyB2aXNpb25EZWx0YS55ICogdmlzaW9uRGVsdGEueSk7XG4gICAgICBsZXQgYWN0b3JEaXIgPSB7XG4gICAgICAgIHg6IHZpc2lvbkRlbHRhLnggLyBhY3RvckRpckxlbmd0aCxcbiAgICAgICAgeTogdmlzaW9uRGVsdGEueSAvIGFjdG9yRGlyTGVuZ3RoXG4gICAgICB9O1xuICAgICAgbGV0IGRvdFByb2R1Y3QgPSAodGhpcy5kaXJYICogYWN0b3JEaXIueCkgKyAodGhpcy5kaXJZICogYWN0b3JEaXIueSk7XG5cbiAgICAgIGxldCB2aXNpYmxlID0gZmFsc2U7XG5cbiAgICAgIGxldCBpbkZPVjtcbiAgICAgIGlmIChkb3RQcm9kdWN0ID4gMC43MCkge1xuICAgICAgICBpbkZPViA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbkZPViA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaW5GT1YpIHtcbiAgICAgICAgbGV0IGFjdG9yQXJyID0gW107XG4gICAgICAgIGxldCBhY3Rvck9iaiA9IHtcbiAgICAgICAgICB4OiBhY3Rvci5jdXJYLFxuICAgICAgICAgIHk6IGFjdG9yLmN1clksXG4gICAgICAgICAgdzogYWN0b3Iud2lkdGgsXG4gICAgICAgICAgaDogYWN0b3IuaGVpZ2h0XG4gICAgICAgIH07XG4gICAgICAgIGFjdG9yQXJyLnB1c2goYWN0b3JPYmopO1xuICAgICAgICBsZXQgYmxvY2tSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgICAgICB2aXNpb25TdGFydCwgdmlzaW9uRGVsdGEsIGdhbWUuc3RhdGljQmxvY2tzKTtcbiAgICAgICAgbGV0IGFjdG9yUmVzdWx0ID0gZ2FtZS5waHlzaWNzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoXG4gICAgICAgICAgdmlzaW9uU3RhcnQsIHZpc2lvbkRlbHRhLCBhY3RvckFycik7XG5cbiAgICAgICAgaWYgKGdhbWUuZGVidWdNb2RlKSB7XG4gICAgICAgICAgbGV0IGVuZFBvcyA9IG5ldyBQb2ludChcbiAgICAgICAgICAgIGFjdG9yLmN1clggKyAoYWN0b3Iud2lkdGggLyAyKSArIGFjdG9yLmV5ZU9mZnNldC54LFxuICAgICAgICAgICAgYWN0b3IuY3VyWSArIGFjdG9yLmV5ZU9mZnNldC55KTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0Lm1vdmVUbyh2aXNpb25TdGFydC54LCB2aXNpb25TdGFydC55KTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQubGluZVRvKGVuZFBvcy54LCBlbmRQb3MueSk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFjdG9yUmVzdWx0ICYmIGFjdG9yUmVzdWx0LmhpdCAmJiBibG9ja1Jlc3VsdCAmJiBibG9ja1Jlc3VsdC5oaXQpIHtcbiAgICAgICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLmNoZWNrTmVhcmVzdEhpdChcbiAgICAgICAgICAgIHRoaXMsIGJsb2NrUmVzdWx0LCBhY3RvclJlc3VsdCk7XG4gICAgICAgICAgdmlzaWJsZSA9IHJlc3VsdC50YXJnZXRIaXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0b3JSZXN1bHQgJiYgYWN0b3JSZXN1bHQuaGl0KSB7XG4gICAgICAgICAgdmlzaWJsZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGFjdG9yKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIGhlYWRMYW1wKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgbGV0IHBvaW50QXJyYXkgPSBbXTtcbiAgICBsZXQgc3RhcnRpbmdQb2ludCA9IHt9O1xuICAgIGxldCBkZWdyZWVUb0N1ckVuZFBvaW50O1xuICAgIGxldCBzd2VlcEFuZ2xlID0gNDA7XG4gICAgbGV0IGdyaWRTaXplID0ge3c6IDI4LCBoOiAyOH07XG4gICAgbGV0IGNlbGxTaXplID0gMzI7XG4gICAgbGV0IGRpciA9IHt4OiB0aGlzLmRpclgsIHk6IHRoaXMuZGlyWX07XG5cbiAgICBzdGFydGluZ1BvaW50LnggPSB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpO1xuICAgIHN0YXJ0aW5nUG9pbnQueSA9IHRoaXMuY3VyWSArIDE0O1xuXG4gICAgbGV0IHRpbGVzSW5GT1YgPSB0aGlzLmdldFRpbGVzSW5GT1YoZ2FtZSk7XG4gICAgLy8gY29uc29sZS5sb2codGlsZXNJbkZPVik7XG4gICAgbGV0IGluaXRpYWxFbmRwb2ludCA9IHt9O1xuICAgIC8vIEdldCBvdXIgaW5pdGlhbCBwb2ludCB0aGF0IGlzIHN0cmFpZ2h0IGFoZWFkXG4gICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICBpbml0aWFsRW5kcG9pbnQgPSB7eDogKHN0YXJ0aW5nUG9pbnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHN0YXJ0aW5nUG9pbnQueX07XG4gICAgfSBlbHNlIGlmICh0aGlzLmRpclkgPT09IC0xIHx8IHRoaXMuZGlyWSA9PT0gMSkge1xuICAgICAgaW5pdGlhbEVuZHBvaW50ID0ge3g6IHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5OiAoc3RhcnRpbmdQb2ludC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcll9O1xuICAgIH1cblxuICAgIGxldCBpbml0YWxEZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShpbml0aWFsRW5kcG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbEVuZHBvaW50LnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdQb2ludC55KTtcblxuICAgIGxldCBkZWdUb0luaXRpYWxFbmRwb3MgPSBnYW1lLnBoeXNpY3MuZ2V0VGFyZ2V0RGVncmVlKGluaXRhbERlbHRhKTtcbiAgICBsZXQgZGVncmVlVG9TdGFydFN3ZWVwID0gZGVnVG9Jbml0aWFsRW5kcG9zIC0gc3dlZXBBbmdsZTtcbiAgICBsZXQgZGVncmVlVG9FbmRTd2VlcCA9IGRlZ1RvSW5pdGlhbEVuZHBvcyArIHN3ZWVwQW5nbGU7XG4gICAgaW5pdGFsRGVsdGEgPSBnYW1lLnBoeXNpY3MuZGVnVG9Qb3MoZGVncmVlVG9TdGFydFN3ZWVwLCB0aGlzLmxhc2VyUmFuZ2UpO1xuXG4gICAgbGV0IGluaXRpYWxSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhzdGFydGluZ1BvaW50LFxuICAgICAgaW5pdGFsRGVsdGEsIHRpbGVzSW5GT1YpO1xuICAgIGxldCBpbnRpYWxFbmRQb3M7XG4gICAgaWYgKGluaXRpYWxSZXN1bHQgJiYgaW5pdGlhbFJlc3VsdC5oaXQpIHtcbiAgICAgIC8vIHVwZGF0ZSBlbmQgcG9zIHdpdGggaGl0IHBvc1xuICAgICAgaW50aWFsRW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICBpbml0aWFsUmVzdWx0LmhpdFBvcy54LCBpbml0aWFsUmVzdWx0LmhpdFBvcy55KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW50aWFsRW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICBpbml0aWFsRW5kcG9pbnQueCwgaW5pdGlhbEVuZHBvaW50LnkpO1xuICAgIH1cblxuICAgIHBvaW50QXJyYXkucHVzaChpbnRpYWxFbmRQb3MpO1xuXG4gICAgbGV0IGVuZGluZ0VuZFBvcztcbiAgICBkZWdyZWVUb0N1ckVuZFBvaW50ID0gZGVncmVlVG9TdGFydFN3ZWVwO1xuXG4gICAgd2hpbGUgKGRlZ3JlZVRvQ3VyRW5kUG9pbnQgPCBkZWdyZWVUb0VuZFN3ZWVwKSB7XG4gICAgICBsZXQgeHh4ID0gZGVncmVlVG9DdXJFbmRQb2ludCA9PSBkZWdyZWVUb1N0YXJ0U3dlZXA7XG4gICAgICBkZWdyZWVUb0N1ckVuZFBvaW50ICs9IDAuNTtcbiAgICAgIGxldCBlbmRpbmdEZWx0YSA9IGdhbWUucGh5c2ljcy5kZWdUb1BvcyhkZWdyZWVUb0N1ckVuZFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzZXJSYW5nZSk7XG4gICAgICBnYW1lLnBoeXNpY3MuZ2V0Rmlyc3RDb2xsaXNpb24oc3RhcnRpbmdQb2ludCwgY2VsbFNpemUsIGVuZGluZ0RlbHRhLFxuICAgICAgICAoY2VsbHgsIGNlbGx5KSA9PiB7XG4gICAgICAgICAgbGV0IGdyaWRQb3MgPSAoY2VsbHkgKiBnYW1lLmNvbHMpICsgY2VsbHg7XG4gICAgICAgICAgbGV0IGJsb2NrID0gZ2FtZS5zdGF0aWNHcmlkW2dyaWRQb3NdO1xuICAgICAgICAgIGlmIChibG9jaykge1xuICAgICAgICAgICAgbGV0IGVuZGluZ1Jlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveChcbiAgICAgICAgICAgICAgc3RhcnRpbmdQb2ludCwgZW5kaW5nRGVsdGEsIGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChlbmRpbmdSZXN1bHQgJiYgZW5kaW5nUmVzdWx0LmhpdCkge1xuICAgICAgICAgICAgICBlbmRpbmdFbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgICAgIGVuZGluZ1Jlc3VsdC5oaXRQb3MueCwgZW5kaW5nUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgICAgICAgcG9pbnRBcnJheS5wdXNoKGVuZGluZ0VuZFBvcyk7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH19XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGdhbWUuY29udGV4dEZYLmJlZ2luUGF0aCgpO1xuICAgIGdhbWUuY29udGV4dEZYLm1vdmVUbyhzdGFydGluZ1BvaW50LngsIHN0YXJ0aW5nUG9pbnQueSk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxpID0gcG9pbnRBcnJheS5sZW5ndGg7IGkgPCBsaTsgaSsrKSB7XG4gICAgICBnYW1lLmNvbnRleHRGWC5saW5lVG8ocG9pbnRBcnJheVtpXS54LCBwb2ludEFycmF5W2ldLnkpO1xuICAgIH1cbiAgICBnYW1lLmNvbnRleHRGWC5jbG9zZVBhdGgoKTtcbiAgICBnYW1lLmNvbnRleHRGWC5maWxsU3R5bGUgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAuMzApJztcbiAgICBnYW1lLmNvbnRleHRGWC5maWxsKCk7XG4gIH1cblxuICB1cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBsZXQgaGl0V2FsbCA9IHRoaXMuY29sbGlkZXNXaXRoV2FsbHMoZ2FtZSk7XG4gICAgaWYgKGhpdFdhbGwuZGlyWCkge1xuICAgICAgdGhpcy5kaXJYID0gaGl0V2FsbC5kaXJYO1xuICAgIH1cbiAgICBpZiAoaGl0V2FsbC5kaXJZKSB7XG4gICAgICB0aGlzLmRpclkgPSBoaXRXYWxsLmRpclk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW92aW5nKSB7XG4gICAgICBsZXQgbW92aW5nQm94ID0gbmV3IEJveCh0aGlzLmN1clgsIHRoaXMuY3VyWSwgdGhpcy53aWR0aCxcbiAgICAgICAgdGhpcy5oZWlnaHQpO1xuICAgICAgbGV0IHNlZ21lbnREZWx0YSA9IHtcbiAgICAgICAgeDogKHRoaXMuc3BlZWRYICogZWxhcHNlZFRpbWUpICogdGhpcy5kaXJYLFxuICAgICAgICB5OiAodGhpcy5zcGVlZFkgKiBlbGFwc2VkVGltZSkgKiB0aGlzLmRpcllcbiAgICAgIH07XG4gICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLnN3ZWVwQm94SW50b0JveGVzKG1vdmluZ0JveCwgc2VnbWVudERlbHRhLFxuICAgICAgICBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgICB0aGlzLnByZXZpb3VzUG9zID0ge1xuICAgICAgICB4OiB0aGlzLmN1clgsXG4gICAgICAgIHk6IHRoaXMuY3VyWVxuICAgICAgfTtcbiAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmhpdCkge1xuICAgICAgICB0aGlzLmRpclggPSByZXN1bHQuaGl0Tm9ybWFsLng7XG4gICAgICAgIHRoaXMuZGlyWSA9IHJlc3VsdC5oaXROb3JtYWwueTtcbiAgICAgICAgdGhpcy5jdXJYID0gcmVzdWx0LmhpdFBvcy54IC0gKHRoaXMud2lkdGggLyAyKTtcbiAgICAgICAgdGhpcy5jdXJZID0gcmVzdWx0LmhpdFBvcy55IC0gKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN1clggKz0gc2VnbWVudERlbHRhLng7XG4gICAgICAgIHRoaXMuY3VyWSArPSBzZWdtZW50RGVsdGEueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbWFnZSBTd2l0Y2hlclxuICAgIHRoaXMuZmFjaW5nID0gRGlyZWN0aW9ucy5nZXROYW1lKHRoaXMuZGlyWCwgdGhpcy5kaXJZKTtcbiAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5kaXJJbWFnZXNbdGhpcy5mYWNpbmddO1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmN1ckltYWdlKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmN1ckltYWdlKTtcbiAgICAgIGxldCBpbWdTcGxpdFggPSAwLCBpbWdTcGxpdFkgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VyWCArIHRoaXMud2lkdGggPiBnYW1lLmNhbnZhcy53aWR0aCkge1xuICAgICAgICBpbWdTcGxpdFggPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgICBpbWdTcGxpdFggPSBnYW1lLmNhbnZhcy53aWR0aCArIHRoaXMuY3VyWDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICAgIGltZ1NwbGl0WSA9IGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0ICsgKHRoaXMuaGVpZ2h0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJZKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICAgIGltZ1NwbGl0WSA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLVxuICAgICAgICAgICAgICAgICAgICAgZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbWdTcGxpdFggIT09IDAgfHwgaW1nU3BsaXRZICE9PSAwKSB7XG4gICAgICAgIGlmIChpbWdTcGxpdFggPT09IDApIHtcbiAgICAgICAgICBpbWdTcGxpdFggPSB0aGlzLmN1clg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGltZ1NwbGl0WSA9PT0gMCkge1xuICAgICAgICAgIGltZ1NwbGl0WSA9IHRoaXMuY3VyWTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCB0aGlzLmN1clksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgdGhpcy5jdXJYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgfVxuICAgICAgZ2FtZS5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmN1ckltYWdlLCB0aGlzLmN1clgsIHRoaXMuY3VyWSxcbiAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8vIHRoaXMuaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuXG4gICAgaWYgKGdhbWUuZGVidWdNb2RlKSB7XG4gICAgICBsZXQgeDEgPSB0aGlzLmN1clg7XG4gICAgICBsZXQgeTEgPSB0aGlzLmN1clk7XG4gICAgICBsZXQgeDIgPSB0aGlzLmN1clggKyB0aGlzLndpZHRoO1xuICAgICAgbGV0IHkyID0gdGhpcy5jdXJZICsgdGhpcy5oZWlnaHQ7XG5cbiAgICAgIGdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgIGdhbWUuY29udGV4dC5tb3ZlVG8oeDEsIHkxKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkxKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkyKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDEsIHkyKTtcbiAgICAgIGdhbWUuY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgIGdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuZGVidWdDb2xvcjtcbiAgICAgIGdhbWUuY29udGV4dC5zdHJva2UoKTtcbiAgICAgIGdhbWUuY29udGV4dC5mb250ID0gJzE0cHggVmVyZGFuYSc7XG4gICAgICBnYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gJ2JsdWUnO1xuICAgICAgZ2FtZS5jb250ZXh0LmZpbGxUZXh0KFxuICAgICAgICAneCcgKyBNYXRoLmZsb29yKHRoaXMuY3VyWCkgKyAnICcgK1xuICAgICAgICAneScgKyBNYXRoLmZsb29yKHRoaXMuY3VyWSkgKyAnICcgK1xuICAgICAgICB0aGlzLmRpclggKyAnICcgKyB0aGlzLmRpclksXG4gICAgICAgIHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gNCksXG4gICAgICAgIHRoaXMuY3VyWSArICh0aGlzLmhlaWdodCArIDMwKSk7XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQaHlzaWNzfSBmcm9tICcuL3BoeXNpY3MnO1xuXG5leHBvcnQgY2xhc3MgR2FtZSB7XG4gIGNvbnN0cnVjdG9yKGNhbnZhcykge1xuICAgIHRoaXMubW91c2UgPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVidWdNb2RlID0gZmFsc2U7XG4gICAgdGhpcy5pbWFnZXMgPSB7fTtcbiAgICB0aGlzLmltYWdlc0xvYWRlZCA9IGZhbHNlO1xuICAgIHRoaXMuYWN0b3JzID0ge307XG4gICAgdGhpcy5rZXlEb3duID0ge307XG4gICAgdGhpcy5rZXlOYW1lcyA9IHt9O1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIH1cblxuICBkZWZpbmVLZXkoa2V5TmFtZSwga2V5Q29kZSkge1xuICAgIHRoaXMua2V5RG93bltrZXlOYW1lXSA9IGZhbHNlO1xuICAgIHRoaXMua2V5TmFtZXNba2V5Q29kZV0gPSBrZXlOYW1lO1xuICB9XG5cbiAgZ2V0UmFuZG9tKG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7XG4gIH1cblxuICAvLyBMb29wcyB0aHJvdWdoIEFjdG9yIGFycmF5IGFuZCBjcmVhdGVzIGNhbGxhYmxlIGltYWdlcy5cbiAgbG9hZEltYWdlcyhjaGFyYWN0ZXJzLCBpbWFnZXMpIHtcbiAgICBsZXQgaW1hZ2VzVG9Mb2FkID0gW107XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBsb2FkZWRJbWFnZXMgPSAwO1xuICAgIGxldCBudW1JbWFnZXMgPSAwO1xuXG4gICAgbGV0IGdldFJldmVyc2VJbWFnZSA9IGZ1bmN0aW9uKHNyYywgdywgaCkge1xuICAgICAgbnVtSW1hZ2VzKys7XG4gICAgICBsZXQgdGVtcEltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBsZXQgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgbGV0IHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgdGVtcENhbnZhcy53aWR0aCA9IHc7XG4gICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGg7XG4gICAgICB0ZW1wQ29udGV4dC50cmFuc2xhdGUodywgMCk7XG4gICAgICB0ZW1wQ29udGV4dC5zY2FsZSgtMSwgMSk7XG4gICAgICB0ZW1wQ29udGV4dC5kcmF3SW1hZ2Uoc3JjLCAwLCAwKTtcbiAgICAgIHRlbXBJbWFnZS5vbmxvYWQgPSBvbkltYWdlTG9hZGVkO1xuICAgICAgdGVtcEltYWdlLnNyYyA9IHRlbXBDYW52YXMudG9EYXRhVVJMKCk7XG4gICAgICByZXR1cm4gdGVtcEltYWdlO1xuICAgIH07XG5cbiAgICBsZXQgb25JbWFnZUxvYWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgbG9hZGVkSW1hZ2VzKys7XG4gICAgICBjb25zb2xlLmxvZygnbG9hZGVkIGltYWdlJywgbG9hZGVkSW1hZ2VzLCAnb2YnLCBudW1JbWFnZXMpO1xuICAgICAgaWYgKGxvYWRlZEltYWdlcyA9PT0gbnVtSW1hZ2VzKSB7XG4gICAgICAgIHNlbGYuaW1hZ2VzTG9hZGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IGxvYWRJbWFnZSA9IGZ1bmN0aW9uKHNyYywgY2FsbGJhY2spIHtcbiAgICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrLmNhbGwoaW1hZ2UpO1xuICAgICAgICB9XG4gICAgICAgIG9uSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH07XG4gICAgICBpbWFnZXNUb0xvYWQucHVzaCh7aW1hZ2U6IGltYWdlLCBzcmM6IHNyY30pO1xuICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH07XG5cbiAgICBsZXQgb25NYWluSW1hZ2VMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmV2ID0gZ2V0UmV2ZXJzZUltYWdlKHRoaXMsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gY2hhcmFjdGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAvLyBnZXQgb3VyIG1haW4gaW1hZ2VcbiAgICAgIGxldCBjaGFyYWN0ZXIgPSBjaGFyYWN0ZXJzW2ldO1xuICAgICAgbGV0IGltYWdlID0gdGhpcy5pbWFnZXNbY2hhcmFjdGVyLm5hbWVdID0gbG9hZEltYWdlKFxuICAgICAgICBjaGFyYWN0ZXIuaW1hZ2UsXG4gICAgICAgIG9uTWFpbkltYWdlTG9hZGVkKTtcblxuICAgICAgaWYgKGNoYXJhY3Rlci5pbWFnZVVwKSB7XG4gICAgICAgIGltYWdlLnVwID0gbG9hZEltYWdlKGNoYXJhY3Rlci5pbWFnZVVwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltYWdlLnVwID0gaW1hZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFyYWN0ZXIuaW1hZ2VEb3duKSB7XG4gICAgICAgIGltYWdlLmRvd24gPSBsb2FkSW1hZ2UoY2hhcmFjdGVyLmltYWdlRG93bik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWFnZS5kb3duID0gaW1hZ2U7XG4gICAgICB9XG5cbiAgICAgIGltYWdlLncgPSBjaGFyYWN0ZXIudztcbiAgICAgIGltYWdlLmggPSBjaGFyYWN0ZXIuaDtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gaW1hZ2VzKSB7XG4gICAgICBpZiAoaW1hZ2VzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdGhpc1trZXldID0gbG9hZEltYWdlKGltYWdlc1trZXldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBudW1JbWFnZXMgPSBpbWFnZXNUb0xvYWQubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGltYWdlc1RvTG9hZC5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBpbWFnZXNUb0xvYWRbaV0uaW1hZ2Uuc3JjID0gaW1hZ2VzVG9Mb2FkW2ldLnNyYztcbiAgICB9XG4gIH1cblxuICBlYWNoQWN0b3IoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBmb3IgKGxldCBjIGluIHRoaXMuYWN0b3JzKSB7XG4gICAgICBpZiAodGhpcy5hY3RvcnMuaGFzT3duUHJvcGVydHkoYykpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmFjdG9yc1tjXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZShlbGFwc2VkVGltZSkge1xuICAgIHRoaXMucGh5c2ljcyA9IG5ldyBQaHlzaWNzKHRoaXMpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgZHJhdyhlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGFjdG9yLmRyYXcodGhpcywgZWxhcHNlZFRpbWUpO1xuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgZHJhd0xvYWRpbmcoKSB7fVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuaXRlcmF0aW9uKys7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGlmIChhY3Rvci5hY3RpdmUpIHtcbiAgICAgICAgYWN0b3IudXBkYXRlKHRoaXMsIGVsYXBzZWRUaW1lKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIHRpY2soZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAodGhpcy5pbWFnZXNMb2FkZWQpIHtcbiAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUoZWxhcHNlZFRpbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5kcmF3KGVsYXBzZWRUaW1lKTtcbiAgICAgIHRoaXMudXBkYXRlKGVsYXBzZWRUaW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3TG9hZGluZygpO1xuICAgIH1cbiAgfVxuXG4gIG9uS2V5RG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGU7XG4gICAgaWYgKHRoaXMua2V5TmFtZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdGhpcy5rZXlEb3duW3RoaXMua2V5TmFtZXNba2V5XV0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIG9uS2V5VXAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBrZXkgPSBldmVudC5rZXlDb2RlO1xuICAgIGlmICh0aGlzLmtleU5hbWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHRoaXMua2V5RG93blt0aGlzLmtleU5hbWVzW2tleV1dID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgb25Nb3VzZU1vdmUoZXZlbnQpIHtcbiAgICB0aGlzLm1vdXNlLnggPSBldmVudC5wYWdlWCAtIHRoaXMuY2FudmFzLm9mZnNldExlZnQ7XG4gICAgdGhpcy5tb3VzZS55ID0gZXZlbnQucGFnZVkgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3A7XG4gIH1cblxuICBvblJlc2l6ZShldmVudCkge1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIH1cblxuICBzZXRGb2N1cyhldmVudCwgaXNCbHVycmVkKSB7XG4gICAgaWYgKHRoaXMuZGVidWdNb2RlICYmIGlzQmx1cnJlZCkge1xuICAgICAgdGhpcy5mcmFtZXNQZXJTZWNvbmQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZyYW1lc1BlclNlY29uZCA9IDMwO1xuICAgIH1cbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydCB7UGh5c2ljcywgQm94LCBQb2ludCwgRVBTSUxPTn0gZnJvbSAnLi9waHlzaWNzJztcbmV4cG9ydCB7S2V5c30gZnJvbSAnLi9rZXlzJztcbmV4cG9ydCB7R2FtZX0gZnJvbSAnLi9nYW1lJztcbmV4cG9ydCB7QWN0b3IsIERpcmVjdGlvbnN9IGZyb20gJy4vYWN0b3InO1xuIiwiLyoganNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgY29uc3QgS2V5cyA9IHtcbiAgVVA6IDM4LFxuICBET1dOOiA0MCxcbiAgTEVGVDogMzcsXG4gIFJJR0hUOiAzOSxcbiAgVzogODcsXG4gIEE6IDY1LFxuICBTOiA4MyxcbiAgRDogNjgsXG4gIFNQQUNFOiAzMlxufTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgY2xhc3MgQm94IHtcbiAgY29uc3RydWN0b3IoeCwgeSwgdywgaCkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLncgPSB3O1xuICAgIHRoaXMuaCA9IGg7XG4gIH1cblxuICBpbmZsYXRlKHBhZGRpbmdYLCBwYWRkaW5nWSkge1xuICAgIHJldHVybiBuZXcgQm94KFxuICAgICAgdGhpcy54IC0gcGFkZGluZ1ggLyAyLFxuICAgICAgdGhpcy55IC0gcGFkZGluZ1kgLyAyLFxuICAgICAgdGhpcy53ICsgcGFkZGluZ1gsXG4gICAgICB0aGlzLmggKyBwYWRkaW5nWSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBvaW50IHtcbiAgY29uc3RydWN0b3IoeCwgeSkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgRVBTSUxPTiA9IDEgLyAzMjtcblxuZXhwb3J0IGNsYXNzIFBoeXNpY3Mge1xuICBjb25zdHJ1Y3RvcihnYW1lKSB7XG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgfVxuXG4gIGRyYXdQb2ludCh4LCB5LCBjb2xvciwgc2l6ZSkge1xuICAgIHNpemUgPSBzaXplIHx8IDQ7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFJlY3QoeCAtIChzaXplIC8gMiksIHkgLSAoc2l6ZSAvIDIpLCBzaXplLCBzaXplKTtcbiAgfVxuXG4gIGRyYXdMaW5lKHgxLCB5MSwgeDIsIHkyLCBjb2xvcikge1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0Lm1vdmVUbyh4MSwgeTEpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmxpbmVUbyh4MiwgeTIpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG4gIH1cblxuICBkcmF3VGV4dCh4LCB5LCB0ZXh0LCBjb2xvcikge1xuICAgIGNvbG9yID0gY29sb3IgfHwgJ3doaXRlJztcbiAgICB0aGlzLmdhbWUuY29udGV4dC5mb250ID0gJzE0cHggQXJpYWwnO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZpbGxUZXh0KHRleHQsIHgsIHkpO1xuICB9XG5cbiAgZHJhd0JveCh4LCB5LCB3LCBoLCBjb2xvcikge1xuICAgIGNvbG9yID0gY29sb3IgfHwgJ3doaXRlJztcbiAgICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LnN0cm9rZVJlY3QoeCwgeSwgdywgaCk7XG4gIH1cblxuICBnZXREZWx0YSh4MSwgeTEsIHgyLCB5Mikge1xuICAgIHJldHVybiB7eDogeDIgLSB4MSwgeTogeTIgLSB5MX07XG4gIH1cblxuICBpbnRlcnNlY3RTZWdtZW50SW50b0JveChzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsIHBhZGRlZEJveCwgZGVidWcpIHtcbiAgICAvLyBkcmF3Qm94KHBhZGRlZEJveC54LCBwYWRkZWRCb3gueSwgcGFkZGVkQm94LncsIHBhZGRlZEJveC5oLCAnZ3JheScpO1xuICAgIHZhciBuZWFyWFBlcmNlbnQsIGZhclhQZXJjZW50O1xuICAgIGlmIChzZWdtZW50RGVsdGEueCA+PSAwKSB7XG4gICAgICAvLyBnb2luZyBsZWZ0IHRvIHJpZ2h0XG4gICAgICBuZWFyWFBlcmNlbnQgPSAocGFkZGVkQm94LnggLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gICAgICBmYXJYUGVyY2VudCA9ICgocGFkZGVkQm94LnggKyBwYWRkZWRCb3gudykgLVxuICAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy54KSAvIHNlZ21lbnREZWx0YS54O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBnb2luZyByaWdodCB0byBsZWZ0XG4gICAgICBuZWFyWFBlcmNlbnQgPSAoXG4gICAgICAgICgocGFkZGVkQm94LnggKyBwYWRkZWRCb3gudykgLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLngpO1xuICAgICAgZmFyWFBlcmNlbnQgPSAocGFkZGVkQm94LnggLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gICAgfVxuXG4gICAgdmFyIG5lYXJZUGVyY2VudCwgZmFyWVBlcmNlbnQ7XG4gICAgaWYgKHNlZ21lbnREZWx0YS55ID49IDApIHtcbiAgICAgIC8vIGdvaW5nIHRvcCB0byBib3R0b21cbiAgICAgIG5lYXJZUGVyY2VudCA9IChwYWRkZWRCb3gueSAtIHNlZ21lbnRQb3MueSkgLyBzZWdtZW50RGVsdGEueTtcbiAgICAgIGZhcllQZXJjZW50ID0gKChwYWRkZWRCb3gueSArIHBhZGRlZEJveC5oKSAtXG4gICAgICAgICAgICAgICAgICAgIHNlZ21lbnRQb3MueSkgLyBzZWdtZW50RGVsdGEueTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZ29pbmcgYm90dG9tIHRvIHRvcFxuICAgICAgbmVhcllQZXJjZW50ID0gKFxuICAgICAgICAoKHBhZGRlZEJveC55ICsgcGFkZGVkQm94LmgpIC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55KTtcbiAgICAgIGZhcllQZXJjZW50ID0gKHBhZGRlZEJveC55IC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgIH1cblxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgZnVydGhlciBvZiB0aGUgdHdvIG5lYXIgcGVyY2VudHNcbiAgICB2YXIgbmVhclBlcmNlbnQ7XG4gICAgaWYgKG5lYXJYUGVyY2VudCA+IG5lYXJZUGVyY2VudCkge1xuICAgICAgbmVhclBlcmNlbnQgPSBuZWFyWFBlcmNlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5lYXJQZXJjZW50ID0gbmVhcllQZXJjZW50O1xuICAgIH1cblxuICAgIC8vIGNhbGN1bGF0ZSB0aGUgbmVhcmVzdCBvZiB0aGUgdHdvIGZhciBwZXJjZW50XG4gICAgdmFyIGZhclBlcmNlbnQ7XG4gICAgaWYgKGZhclhQZXJjZW50IDwgZmFyWVBlcmNlbnQpIHtcbiAgICAgIGZhclBlcmNlbnQgPSBmYXJYUGVyY2VudDtcbiAgICB9IGVsc2Uge1xuICAgICAgZmFyUGVyY2VudCA9IGZhcllQZXJjZW50O1xuICAgIH1cblxuICAgIHZhciBoaXQ7XG4gICAgaWYgKG5lYXJYUGVyY2VudCA+IGZhcllQZXJjZW50IHx8IG5lYXJZUGVyY2VudCA+IGZhclhQZXJjZW50KSB7XG4gICAgICAvLyBXaGVyZSB0aGUgc2VnbWVudCBoaXRzIHRoZSBsZWZ0IGVkZ2Ugb2YgdGhlIGJveCwgaGFzIHRvIGJlIGJldHdlZW5cbiAgICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBvZiB0aGUgYm94LiBPdGhlcndpc2UsIHRoZSBzZWdtZW50IGlzXG4gICAgICAvLyBwYXNzaW5nIHRoZSBib3ggdmVydGljYWxseSBiZWZvcmUgaXQgaGl0cyB0aGUgbGVmdCBzaWRlLlxuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChuZWFyUGVyY2VudCA+IDEpIHtcbiAgICAgIC8vIHRoZSBib3ggaXMgcGFzdCB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGZhclBlcmNlbnQgPCAwKSB7XG4gICAgICAvLyB0aGUgYm94IGlzIGJlZm9yZSB0aGUgc3RhcnQgb2YgdGhlIGxpbmVcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaXQgPSB0cnVlO1xuICAgIH1cblxuICAgIHZhciBoaXRQZXJjZW50ID0gbmVhclBlcmNlbnQ7XG4gICAgdmFyIGhpdE5vcm1hbCA9IHt9O1xuICAgIGlmIChuZWFyWFBlcmNlbnQgPiBuZWFyWVBlcmNlbnQpIHtcbiAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIGxlZnQgb3IgcmlnaHQgZWRnZVxuICAgICAgaWYgKHNlZ21lbnREZWx0YS54ID49IDApIHtcbiAgICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgbGVmdCBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC54ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSByaWdodCBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC54ID0gMTtcbiAgICAgIH1cbiAgICAgIGhpdE5vcm1hbC55ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgdG8gb3IgYm90dG9tIGVkZ2VcbiAgICAgIGhpdE5vcm1hbC54ID0gMDtcbiAgICAgIGlmIChzZWdtZW50RGVsdGEueSA+PSAwKSB7XG4gICAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIHRvcCBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC55ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSBib3R0b20gZWRnZVxuICAgICAgICBoaXROb3JtYWwueSA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChoaXRQZXJjZW50IDwgMCkge1xuICAgICAgaGl0UGVyY2VudCA9IDA7XG4gICAgfVxuXG4gICAgdmFyIGhpdFBvcyA9IHtcbiAgICAgIHg6IHNlZ21lbnRQb3MueCArIChzZWdtZW50RGVsdGEueCAqIGhpdFBlcmNlbnQpLFxuICAgICAgeTogc2VnbWVudFBvcy55ICsgKHNlZ21lbnREZWx0YS55ICogaGl0UGVyY2VudClcbiAgICB9O1xuXG4gICAgaGl0UG9zLnggKz0gaGl0Tm9ybWFsLnggKiBFUFNJTE9OO1xuICAgIGhpdFBvcy55ICs9IGhpdE5vcm1hbC55ICogRVBTSUxPTjtcblxuICAgIGxldCByZXN1bHQgPSAge1xuICAgICAgaGl0OiBoaXQsXG4gICAgICBoaXROb3JtYWw6IGhpdE5vcm1hbCxcbiAgICAgIGhpdFBlcmNlbnQ6IGhpdFBlcmNlbnQsXG4gICAgICBoaXRQb3M6IGhpdFBvcyxcbiAgICAgIG5lYXJQZXJjZW50OiBuZWFyUGVyY2VudCxcbiAgICAgIG5lYXJYUGVyY2VudDogbmVhclhQZXJjZW50LFxuICAgICAgbmVhcllQZXJjZW50OiBuZWFyWVBlcmNlbnQsXG4gICAgICBmYXJQZXJjZW50OiBmYXJQZXJjZW50LFxuICAgICAgZmFyWFBlcmNlbnQ6IGZhclhQZXJjZW50LFxuICAgICAgZmFyWVBlcmNlbnQ6IGZhcllQZXJjZW50LFxuICAgICAgaGl0Qm94OiBwYWRkZWRCb3hcbiAgICB9O1xuICAgIC8vIGlmIChkZWJ1Zykge1xuICAgIC8vICAgIGxldCBoaXRDb3VudGVyID0gMDtcbiAgICAvLyAgICBsZXQgaGl0Q29sb3JzID0gWycjZjAwJywgJyMwZjAnLCAnI2ZmMCcsICcjMGZmJywgJyNmMGYnLFxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgJyNmZmYnLCAnI2Y5MCddO1xuICAgIC8vICAgICB0aGlzLmRyYXdQb2ludChyZXN1bHQuaGl0UG9zLngsIHJlc3VsdC5oaXRQb3MueSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgaGl0Q29sb3JzW2hpdENvdW50ZXIgJSBoaXRDb2xvcnMubGVuZ3RoXSwgNCk7XG4gICAgLy8gICAgIHRoaXMuZHJhd0xpbmUoc2VnbWVudFBvcy54LCBzZWdtZW50UG9zLnksXG4gICAgLy8gICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy54ICsgc2VnbWVudERlbHRhLngsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy55ICsgc2VnbWVudERlbHRhLnksICcjMGZmJyk7XG4gICAgLy8gICAgIGhpdENvdW50ZXIgKz0gMTtcbiAgICAvLyB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHN3ZWVwQm94SW50b0JveChtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94KSB7XG4gICAgdmFyIHNlZ21lbnRQb3MgPSB7XG4gICAgICB4OiBtb3ZpbmdCb3gueCArIG1vdmluZ0JveC53IC8gMixcbiAgICAgIHk6IG1vdmluZ0JveC55ICsgbW92aW5nQm94LmggLyAyXG4gICAgfTtcblxuICAgIHZhciBwYWRkZWRCb3ggPSBuZXcgQm94KFxuICAgICAgc3RhdGljQm94LnggLSBtb3ZpbmdCb3gudyAvIDIsXG4gICAgICBzdGF0aWNCb3gueSAtIG1vdmluZ0JveC5oIC8gMixcbiAgICAgIHN0YXRpY0JveC53ICsgbW92aW5nQm94LncsXG4gICAgICBzdGF0aWNCb3guaCArIG1vdmluZ0JveC5oKTtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveChzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsXG4gICAgICBwYWRkZWRCb3gpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBpbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKHNlZ21lbnRQb3MsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94ZXMsIGRlYnVnKSB7XG4gICAgbGV0IGhpdENvdW50ZXIgPSAwO1xuICAgIGxldCBoaXRDb2xvcnMgPSBbJyNmMDAnLCAnIzBmMCcsICcjZmYwJywgJyMwZmYnLCAnI2YwZicsICcjZmZmJywgJyNmOTAnXTtcbiAgICB2YXIgbmVhcmVzdFJlc3VsdCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gc3RhdGljQm94ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgdmFyIHN0YXRpY0JveCA9IHN0YXRpY0JveGVzW2ldO1xuICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuaW50ZXJzZWN0U2VnbWVudEludG9Cb3goc2VnbWVudFBvcywgc2VnbWVudERlbHRhLFxuICAgICAgICBzdGF0aWNCb3gpO1xuICAgICAgaWYgKHJlc3VsdC5oaXQpIHtcbiAgICAgICAgaWYgKGRlYnVnKSB7XG4gICAgICAgICAgdGhpcy5kcmF3UG9pbnQocmVzdWx0LmhpdFBvcy54LCByZXN1bHQuaGl0UG9zLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgaGl0Q29sb3JzW2hpdENvdW50ZXIgJSBoaXRDb2xvcnMubGVuZ3RoXSwgNCk7XG4gICAgICAgICAgdGhpcy5kcmF3TGluZShzZWdtZW50UG9zLngsIHNlZ21lbnRQb3MueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlZ21lbnRQb3MueCArIHNlZ21lbnREZWx0YS54LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy55ICsgc2VnbWVudERlbHRhLnksICcjMGZmJyk7XG4gICAgICAgICAgaGl0Q291bnRlciArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmVhcmVzdFJlc3VsdCB8fCByZXN1bHQuaGl0UGVyY2VudCA8IG5lYXJlc3RSZXN1bHQuaGl0UGVyY2VudCkge1xuICAgICAgICAgIG5lYXJlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5lYXJlc3RSZXN1bHQ7XG4gIH1cblxuICAvLyBTd2VlcCBtb3ZpbmdCb3gsIGFsb25nIHRoZSBtb3ZlbWVudCBkZXNjcmliZWQgYnkgc2VnbWVudERlbHRhLCBpbnRvIGVhY2hcbiAgLy8gYm94IGluIHRoZSBsaXN0IG9mIHN0YXRpY0JveGVzLiBSZXR1cm4gYSByZXN1bHQgb2JqZWN0IGRlc2NyaWJpbmcgdGhlIGZpcnN0XG4gIC8vIHN0YXRpYyBib3ggdGhhdCBtb3ZpbmdCb3ggaGl0cywgb3IgbnVsbC5cbiAgc3dlZXBCb3hJbnRvQm94ZXMobW92aW5nQm94LCBzZWdtZW50RGVsdGEsIHN0YXRpY0JveGVzKSB7XG4gICAgdmFyIG5lYXJlc3RSZXN1bHQgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IHN0YXRpY0JveGVzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICAgIHZhciBzdGF0aWNCb3ggPSBzdGF0aWNCb3hlc1tpXTtcbiAgICAgIHZhciByZXN1bHQgPSB0aGlzLnN3ZWVwQm94SW50b0JveChtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94KTtcbiAgICAgIGlmIChyZXN1bHQuaGl0KSB7XG4gICAgICAgIGlmICghbmVhcmVzdFJlc3VsdCB8fCByZXN1bHQuaGl0UGVyY2VudCA8IG5lYXJlc3RSZXN1bHQuaGl0UGVyY2VudCkge1xuICAgICAgICAgIG5lYXJlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5lYXJlc3RSZXN1bHQ7XG4gIH1cblxuICBnZXRGaXJzdENvbGxpc2lvbihzdGFydFBvcywgY2VsbFNpemUsIGRlbHRhLCBjYWxsYmFjaykge1xuICAgIGxldCBkaXJYID0gZGVsdGEueCA8IDAgPyAtMSA6IDE7XG4gICAgbGV0IGRpclkgPSBkZWx0YS55IDwgMCA/IC0xIDogMTtcbiAgICBsZXQgZW5kUG9zWCA9IHN0YXJ0UG9zLnggKyBkZWx0YS54O1xuICAgIGxldCBlbmRQb3NZID0gc3RhcnRQb3MueSArIGRlbHRhLnk7XG5cbiAgICBsZXQgY2VsbFggPSBNYXRoLmZsb29yKHN0YXJ0UG9zLnggLyBjZWxsU2l6ZSk7XG4gICAgbGV0IGNlbGxZID0gTWF0aC5mbG9vcihzdGFydFBvcy55IC8gY2VsbFNpemUpO1xuXG4gICAgbGV0IHRpbWVTdGVwWCA9IChjZWxsU2l6ZSAqIGRpclgpIC8gZGVsdGEueDtcbiAgICBsZXQgdGltZVN0ZXBZID0gKGNlbGxTaXplICogZGlyWSkgLyBkZWx0YS55O1xuXG4gICAgbGV0IHRpbWVYLCB0aW1lWTtcbiAgICBpZiAoZGlyWCA9PT0gMCkge1xuICAgICAgdGltZVggPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZmlyc3RFZGdlWCA9IGNlbGxYICogY2VsbFNpemU7XG4gICAgICBpZiAoZGlyWCA+IDApIHtcbiAgICAgICAgZmlyc3RFZGdlWCArPSBjZWxsU2l6ZTtcbiAgICAgIH1cbiAgICAgIHRpbWVYID0gKGZpcnN0RWRnZVggLSBzdGFydFBvcy54KSAvIGRlbHRhLng7XG4gICAgfVxuXG4gICAgaWYgKGRpclkgPT09IDApIHtcbiAgICAgIHRpbWVZID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGZpcnN0RWRnZVkgPSBjZWxsWSAqIGNlbGxTaXplO1xuICAgICAgaWYgKGRpclkgPiAwKSB7XG4gICAgICAgIGZpcnN0RWRnZVkgKz0gY2VsbFNpemU7XG4gICAgICB9XG4gICAgICB0aW1lWSA9IChmaXJzdEVkZ2VZIC0gc3RhcnRQb3MueSkgLyBkZWx0YS55O1xuICAgIH1cblxuICAgIHdoaWxlICh0aW1lWCA8IDEgfHwgdGltZVkgPCAxKSB7XG4gICAgICBpZiAodGltZVggPCB0aW1lWSkge1xuICAgICAgICB0aW1lWCArPSB0aW1lU3RlcFg7XG4gICAgICAgIGNlbGxYICs9IGRpclg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjZWxsWSArPSBkaXJZO1xuICAgICAgICB0aW1lWSArPSB0aW1lU3RlcFk7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbGJhY2soY2VsbFgsIGNlbGxZKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGNvbnNvbGUubG9nKHRpbWVYLCB0aW1lWSk7XG4gICAgLy8gcmV0dXJuIHt0c1g6IHRpbWVTdGVwWCwgdHNZOiB0aW1lU3RlcFl9O1xuICB9XG5cbiAgY2hlY2tOZWFyZXN0SGl0KHNvdXJjZUFjdG9yLCBzdGF0aWNSZXN1bHQsIHRhcmdldFJlc3VsdCkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIgc291cmNlWCA9IHNvdXJjZUFjdG9yLmN1clg7XG4gICAgdmFyIHN0YXRpY1ggPSBzdGF0aWNSZXN1bHQuaGl0UG9zLng7XG4gICAgdmFyIHRhcmdldFggPSB0YXJnZXRSZXN1bHQuaGl0UG9zLng7XG4gICAgdmFyIHNvdXJjZVkgPSBzb3VyY2VBY3Rvci5jdXJZO1xuICAgIHZhciBzdGF0aWNZID0gc3RhdGljUmVzdWx0LmhpdFBvcy55O1xuICAgIHZhciB0YXJnZXRZID0gdGFyZ2V0UmVzdWx0LmhpdFBvcy55O1xuXG4gICAgaWYgKHNvdXJjZUFjdG9yLmRpclggPT09IC0xIHx8IHNvdXJjZUFjdG9yLmRpclggPT09IDEpIHtcbiAgICAgIGlmIChNYXRoLmFicyhzb3VyY2VYIC0gc3RhdGljWCkgPCBNYXRoLmFicyhzb3VyY2VYIC0gdGFyZ2V0WCkpIHtcbiAgICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IGZhbHNlO1xuICAgICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgIHN0YXRpY1Jlc3VsdC5oaXRQb3MueCwgc3RhdGljUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy54LCB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICByZXN1bHQudGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNvdXJjZUFjdG9yLmRpclkgPT09IC0xIHx8IHNvdXJjZUFjdG9yLmRpclkgPT09IDEpIHtcbiAgICAgIGlmIChNYXRoLmFicyhzb3VyY2VZIC0gc3RhdGljWSkgPCBNYXRoLmFicyhzb3VyY2VZIC0gdGFyZ2V0WSkpIHtcbiAgICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IGZhbHNlO1xuICAgICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgIHN0YXRpY1Jlc3VsdC5oaXRQb3MueCwgc3RhdGljUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy54LCB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICByZXN1bHQudGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGdldFRhcmdldERlZ3JlZShkZWx0YSkge1xuICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIoZGVsdGEueCwgZGVsdGEueSk7XG4gICAgdmFyIGRlZ3JlZSA9IHRoZXRhICogKDE4MCAvIE1hdGguUEkpO1xuICAgIGlmICh0aGV0YSA8IDApIHtcbiAgICAgIGRlZ3JlZSArPSAzNjA7XG4gICAgfVxuICAgIHJldHVybiBkZWdyZWU7XG4gIH1cblxuICBkZWdUb1BvcyhkZWdyZWUsIHJhZGl1cykge1xuICAgIHZhciByYWRpYW4gPSBkZWdyZWUgKiAoTWF0aC5QSSAvIDE4MCk7XG4gICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgIHg6IHJhZGl1cyAqIE1hdGguc2luKHJhZGlhbiksXG4gICAgICB5OiByYWRpdXMgKiBNYXRoLmNvcyhyYWRpYW4pXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtBY3Rvcn0gZnJvbSAnLi9iZXJ6ZXJrJztcblxuZXhwb3J0IGNsYXNzIEJ1bGxldCBleHRlbmRzIEFjdG9yIHtcbiAgY29uc3RydWN0b3Ioc3RhcnRYLCBzdGFydFksIHNwZWVkLCBkaXJYLCBkaXJZKSB7XG4gICAgdmFyIGltYWdlID0ge3c6IDUsIGg6IDV9O1xuICAgIHN1cGVyKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgMTAwLCBzcGVlZCwgc3BlZWQsIGRpclgsIGRpclkpO1xuICAgIHRoaXMuZGVhdGhUaW1lciA9IDA7XG4gIH1cblxuICBkcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICcjRkZGJztcbiAgICBnYW1lLmNvbnRleHQuZmlsbFJlY3QodGhpcy5jdXJYLCB0aGlzLmN1clksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5kZWF0aFRpbWVyICs9IGVsYXBzZWRUaW1lO1xuICAgIGlmICh0aGlzLmRlYXRoVGltZXIgPj0gMSkge1xuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuRGVhdGhib3QgPSBleHBvcnRzO1xuZXhwb3J0IHtHYW1lfSBmcm9tICcuL2dhbWUnO1xuZXhwb3J0IHtQbGF5ZXJ9IGZyb20gJy4vcGxheWVyJztcbmV4cG9ydCB7TW9uc3Rlcn0gZnJvbSAnLi9tb25zdGVyJztcbmV4cG9ydCB7QnVsbGV0fSBmcm9tICcuL2J1bGxldCc7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAvLyBUaGUgRGVhdGhib3QgcHJvcGVydGllcyB3aWxsIGJlIGZpbGxlZCBpbiBieSB0aGUgb3RoZXIgc2NyaXB0cy4gRXZlblxuICAvLyB0aG91Z2ggdGhleSBkb24ndCBsb29rIGxpa2UgdGhleSBleGlzdCBhdCB0aGlzIHBvaW50LCB0aGV5IHdpbGwgYnkgdGhlXG4gIC8vIHRpbWUgdGhlIHdpbmRvdyBsb2FkIGV2ZW50IGhhcyBmaXJlZC5cblxuICB2YXIgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlYXRoYm90Jyk7XG4gIHZhciBjYW52YXNCRyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNiYWNrZ3JvdW5kJyk7XG4gIHZhciBnYW1lID0gd2luZG93LmRlYXRoYm90R2FtZSA9IG5ldyBleHBvcnRzLkdhbWUoXG4gICAgY2FudmFzLCBjYW52YXNCRywgJyMxMTEnKTtcbiAgZ2FtZS5sb2FkSW1hZ2VzKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uS2V5RG93bihldmVudCk7XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChldmVudCkgPT4ge1xuICAgIGdhbWUub25LZXlVcChldmVudCk7XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uTW91c2VNb3ZlKGV2ZW50KTtcbiAgfSk7XG5cbiAgdmFyIGJsdXJyZWQgPSBmYWxzZTtcbiAgdmFyIHNldEZvY3VzID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ2JsdXInKSB7XG4gICAgICAgIGJsdXJyZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChldmVudC50eXBlID09PSAnZm9jdXMnKSB7XG4gICAgICAgIGJsdXJyZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZ2FtZS5zZXRGb2N1cyhldmVudCwgZG9jdW1lbnQuaGlkZGVuIHx8IGJsdXJyZWQpO1xuICB9O1xuICBzZXRGb2N1cygpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHNldEZvY3VzLCB0cnVlKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgc2V0Rm9jdXMsIHRydWUpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHNldEZvY3VzLCB0cnVlKTtcblxuICB2YXIgcmVzaXplVGltZW91dDtcbiAgd2luZG93Lm9ucmVzaXplID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKHJlc2l6ZVRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgIHJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgICAgZ2FtZS5vblJlc2l6ZShldmVudCk7XG4gICAgfSwgMTAwMCk7XG4gIH07XG5cbiAgdmFyIG9sZEZyYW1lVGltZSA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDApO1xuICB2YXIgdGljayA9ICgpID0+IHtcbiAgICB2YXIgbmV3RnJhbWVUaW1lID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCk7XG4gICAgdmFyIGVsYXBzZWRUaW1lID0gbmV3RnJhbWVUaW1lIC0gb2xkRnJhbWVUaW1lO1xuICAgIG9sZEZyYW1lVGltZSA9IG5ld0ZyYW1lVGltZTtcbiAgICBnYW1lLnRpY2soZWxhcHNlZFRpbWUpO1xuICAgIHNldFRpbWVvdXQodGljaywgTWF0aC5mbG9vcigxMDAwIC8gZ2FtZS5mcmFtZXNQZXJTZWNvbmQpKTtcbiAgfTtcbiAgdGljaygpO1xufSk7XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbi8qZ2xvYmFscyBTUzpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge0dhbWUgYXMgQmVyemVya0dhbWUsIEtleXMsIFBoeXNpY3MsIEJveCwgRVBTSUxPTn0gZnJvbSAnLi9iZXJ6ZXJrJztcbmltcG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge01vbnN0ZXJ9IGZyb20gJy4vbW9uc3Rlcic7XG5cbmNvbnN0IERFQlVHX1RJTEUgPSA5O1xuZXhwb3J0IGNvbnN0IExFVkVMUyA9IFtcbiAge1xuICAgIGNvbHM6IDI4LFxuICAgIHJvd3M6IDI4LFxuICAgIGdyaWQ6IFtcbiAgICAgIDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsXG4gICAgICAxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMSwxLDAsMCwwLDAsMCwwLDIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDEsMSwwLDAsMCwwLDAsMCwyLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDIsMCwyLDIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMSwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMSwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLFxuICAgIF1cbiAgfVxuXTtcblxuY29uc3QgQ0hBUkFDVEVSUyA9IFtcbiAge1xuICAgIG5hbWU6ICdkZWF0aGJvdCcsXG4gICAgaW1hZ2U6ICdpbWcvZGVhdGhib3QucG5nJyxcbiAgICBpbWFnZVVwOiAnaW1nL2RlYXRoYm90X3VwLnBuZycsXG4gICAgaW1hZ2VEb3duOiAnaW1nL2RlYXRoYm90X2Rvd24ucG5nJyxcbiAgICB3OiA0MCxcbiAgICBoOiA1MlxuICB9LFxuICB7XG4gICAgbmFtZTogJ3BsYXllcicsXG4gICAgaW1hZ2U6ICdpbWcvcGxheWVyLnBuZycsXG4gICAgdzogMjgsXG4gICAgaDogNTJcbiAgfVxuXTtcblxuZXhwb3J0IGNsYXNzIEdhbWUgZXh0ZW5kcyBCZXJ6ZXJrR2FtZSB7XG4gIGNvbnN0cnVjdG9yKGNhbnZhcywgY2FudmFzQkcsIGZpbGxTdHlsZSkge1xuICAgIHN1cGVyKGNhbnZhcyk7XG4gICAgdGhpcy5wbGF5ZXJEZWF0aE1ldGhvZCA9ICcnO1xuICAgIHRoaXMuZ2FtZVN0YXRlID0gJ2F0dHJhY3QnOyAvLyBhdHRyYWN0LCBwbGF5LCBkZWFkXG4gICAgdGhpcy5zY29yZSA9IDA7XG4gICAgdGhpcy5yb3VuZCA9IDI7XG4gICAgdGhpcy5udW1PZk1vbnN0ZXJzID0gMDtcbiAgICB0aGlzLmNlbGxXaWR0aCA9IDMyO1xuICAgIHRoaXMuY2VsbEhlaWdodCA9IDMyO1xuICAgIHRoaXMudGlsZXMgPSBudWxsO1xuICAgIHRoaXMuY29scyA9IExFVkVMU1swXS5jb2xzO1xuICAgIHRoaXMucm93cyA9IExFVkVMU1swXS5yb3dzO1xuICAgIHRoaXMuZ3JpZCA9IExFVkVMU1swXS5ncmlkO1xuICAgIHRoaXMuc3Bhd25HcmlkID0gW107XG4gICAgdGhpcy5zdGF0aWNCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnN0YXRpY0dyaWQgPSBbXTtcbiAgICB0aGlzLmZpbGxTdHlsZSA9IGZpbGxTdHlsZTtcbiAgICB0aGlzLmNhbnZhc0JHID0gY2FudmFzQkc7XG4gICAgdGhpcy5jYW52YXNCRy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzQkcuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGV4dEJHID0gdGhpcy5jYW52YXNCRy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY2FudmFzRlggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZngnKTtcbiAgICB0aGlzLmNhbnZhc0ZYLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXNGWC5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jb250ZXh0RlggPSB0aGlzLmNhbnZhc0ZYLmdldENvbnRleHQoJzJkJyk7XG4gICAgLy8gdGhpcy5jb250ZXh0RlguZmlsbFN0eWxlID0gJ3JnYmEoMCwgMCwgMCwgLjUwKSc7XG4gICAgLy8gdGhpcy5jb250ZXh0RlguZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNGWC53aWR0aCwgdGhpcy5jYW52YXNGWC5oZWlnaHQpO1xuICAgIHRoaXMubWVzc2FnZVRpbWUgPSAxMDtcblxuICAgIHRoaXMuZGVmaW5lS2V5KCdzdGFydCcsIEtleXMuU1BBQ0UpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCd1cCcsIEtleXMuVVApO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdkb3duJywgS2V5cy5ET1dOKTtcbiAgICB0aGlzLmRlZmluZUtleSgnbGVmdCcsIEtleXMuTEVGVCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3JpZ2h0JywgS2V5cy5SSUdIVCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3Nob290VXAnLCBLZXlzLlcpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdExlZnQnLCBLZXlzLkEpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdERvd24nLCBLZXlzLlMpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdFJpZ2h0JywgS2V5cy5EKTtcbiAgfVxuXG4gIGNyZWF0ZVNwYXduUG9pbnRzKGFjdG9yV2lkdGgsIGFjdG9ySGVpZ2h0KSB7XG4gICAgbGV0IHNwYXduTG9jYXRpb25zID0gW107XG4gICAgbGV0IHNwYXduR3JpZCA9IHRoaXMuZ3JpZC5zbGljZSgwKTtcblxuICAgIGxldCBhY3RvckJsb2NrID0ge1xuICAgICAgdzogTWF0aC5jZWlsKGFjdG9yV2lkdGggLyB0aGlzLmNlbGxXaWR0aCksXG4gICAgICBoOiBNYXRoLmNlaWwoYWN0b3JIZWlnaHQgLyB0aGlzLmNlbGxIZWlnaHQpXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSB0aGlzLmdyaWQubGVuZ3RoOyBpIDwgbGk7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZ3JpZFtpXSA9PT0gMCkge1xuICAgICAgICBsZXQgbnVtT2ZTcGFjZXNOZWVkZWQgPSBhY3RvckJsb2NrLncgKiBhY3RvckJsb2NrLmg7XG4gICAgICAgIGxldCBudW1PZkVtcHR5U3BhY2VzID0gMDtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgYWN0b3JCbG9jay53OyByb3crKykge1xuICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IGFjdG9yQmxvY2suaDsgY29sKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJDb2wgPSAoaSAlIHRoaXMuY29scykgKyByb3c7XG4gICAgICAgICAgICBsZXQgY3VyUm93ID0gTWF0aC5mbG9vcihpIC8gdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IChjdXJSb3cgKiB0aGlzLmNvbHMpICsgY3VyQ29sO1xuICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFtpbmRleF0gPT09IDApIHtcbiAgICAgICAgICAgICAgbnVtT2ZFbXB0eVNwYWNlcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobnVtT2ZFbXB0eVNwYWNlcyA9PT0gbnVtT2ZTcGFjZXNOZWVkZWQpIHtcbiAgICAgICAgICBzcGF3bkxvY2F0aW9ucy5wdXNoKGkpO1xuICAgICAgICAgIHNwYXduR3JpZFtpXSA9IERFQlVHX1RJTEU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zcGF3bkdyaWQgPSBzcGF3bkdyaWQ7XG4gICAgcmV0dXJuIHNwYXduTG9jYXRpb25zO1xuICB9XG5cbiAgcmFuZG9taXplU3Bhd25zKCkge1xuICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoIShhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFjdG9yLnNwYXduUG9pbnRzID0gdGhpcy5jcmVhdGVTcGF3blBvaW50cyhhY3Rvci53aWR0aCwgYWN0b3IuaGVpZ2h0KTtcbiAgICAgIGxldCBzcGF3bkluZGV4ID0gYWN0b3Iuc3Bhd25Qb2ludHNbXG4gICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhY3Rvci5zcGF3blBvaW50cy5sZW5ndGgpXTtcbiAgICAgIGxldCBzcGF3blhZID0gdGhpcy5jYWxjR3JpZFhZKHNwYXduSW5kZXgpO1xuICAgICAgYWN0b3IuY3VyWCA9IHNwYXduWFkueDEgKyBFUFNJTE9OO1xuICAgICAgYWN0b3IuY3VyWSA9IHNwYXduWFkueTEgKyBFUFNJTE9OO1xuICAgIH0sdGhpcyk7XG4gIH1cblxuICBjYWxjR3JpZFhZKGdyaWRJbmRleCkge1xuICAgIGxldCBjdXJSb3csIGN1ckNvbCwgZ3JpZFgxLCBncmlkWDIsIGdyaWRZMSwgZ3JpZFkyO1xuICAgIGxldCByZXN1bHQgPSB7eDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDB9O1xuICAgIGN1ckNvbCA9IGdyaWRJbmRleCAlIHRoaXMuY29scztcbiAgICBjdXJSb3cgPSBNYXRoLmZsb29yKGdyaWRJbmRleCAvIHRoaXMuY29scyk7XG4gICAgZ3JpZFgxID0gY3VyQ29sICogdGhpcy5jZWxsV2lkdGg7XG4gICAgZ3JpZFkxID0gY3VyUm93ICogdGhpcy5jZWxsSGVpZ2h0O1xuICAgIGdyaWRYMiA9IGdyaWRYMSArIHRoaXMuY2VsbFdpZHRoO1xuICAgIGdyaWRZMiA9IGdyaWRZMSArIHRoaXMuY2VsbEhlaWdodDtcbiAgICByZXN1bHQgPSB7eDE6IGdyaWRYMSwgeTE6IGdyaWRZMSwgeDI6IGdyaWRYMiwgeTI6IGdyaWRZMn07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIExvb3BzIHRocm91Z2ggQWN0b3IgYXJyYXkgYW5kIGNyZWF0ZXMgY2FsbGFibGUgaW1hZ2VzLlxuICBsb2FkSW1hZ2VzKCkge1xuICAgIHN1cGVyLmxvYWRJbWFnZXMoQ0hBUkFDVEVSUyxcbiAgICAgIHt0aWxlczogJ2ltZy90aWxlcy5wbmcnfSk7XG4gIH1cblxuICBlYWNoQWN0b3IoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBmb3IgKGxldCBjIGluIHRoaXMuYWN0b3JzKSB7XG4gICAgICBpZiAodGhpcy5hY3RvcnMuaGFzT3duUHJvcGVydHkoYykpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmFjdG9yc1tjXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLmluaXRpYWxpemUoZWxhcHNlZFRpbWUpO1xuXG4gICAgdGhpcy5kcmF3QmFja2dyb3VuZChlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5zdGF0aWNCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnN0YXRpY0dyaWQgPSBbXTtcbiAgICB0aGlzLnBoeXNpY3MgPSBuZXcgUGh5c2ljcyh0aGlzKTtcbiAgICB0aGlzLmFjdG9ycyA9IHtcbiAgICAgIC8vaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpcllcbiAgICAgIHBsYXllcjogbmV3IFBsYXllcihcbiAgICAgICAgdGhpcy5pbWFnZXMucGxheWVyLCA4NSwgNDU0LCAxMDAsIDE1MCwgMTUwLCAxLCAxKSxcbiAgICAgIGRlYXRoYm90MTogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCAyNTAsIDUwMCwgMTAwLCAxMDAsIDEwMCwgLTEsIDEpLFxuICAgICAgZGVhdGhib3QzOiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDEyMCwgMTEwLCAzMDAsIDExMCwgMTE1LCAxLCAxKSxcbiAgICAgIGRlYXRoYm90NDogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCAzMDAsIDIwMCwgMTAwLCAyMDAsIDIwMCwgLTEsIC0xKSxcbiAgICAgIGRlYXRoYm90NTogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCA1MDAsIDQwMCwgMTAwLCAyMDAsIDIwMCwgMSwgMSlcbiAgICB9O1xuXG4gICAgdGhpcy5udW1PZk1vbnN0ZXJzID0gMDtcbiAgICB0aGlzLnBsYXllckRlYXRoTWV0aG9kID0gJyc7XG4gICAgdGhpcy5yb3VuZCA9IDI7XG4gICAgdGhpcy5zY29yZSA9IDA7XG5cbiAgICB0aGlzLmVhY2hBY3RvcigoYWN0b3IpID0+IHtcbiAgICAgIGlmIChhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpIHtcbiAgICAgICAgdGhpcy5udW1PZk1vbnN0ZXJzKys7XG4gICAgICB9XG4gICAgICBhY3Rvci5hY3RpdmUgPSB0cnVlO1xuICAgICAgYWN0b3IuaGVhbHRoID0gMTAwO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxpID0gdGhpcy5ncmlkLmxlbmd0aDsgbGkgPiBpOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmdyaWRbaV0pIHtcbiAgICAgICAgbGV0IGJsb2NrWFkgPSB0aGlzLmNhbGNHcmlkWFkoaSk7XG4gICAgICAgIGxldCBibG9jayA9IG5ldyBCb3goXG4gICAgICAgICAgYmxvY2tYWS54MSwgYmxvY2tYWS55MSwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCk7XG4gICAgICAgIHRoaXMuc3RhdGljQmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgICB0aGlzLnN0YXRpY0dyaWQucHVzaChibG9jayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0YXRpY0dyaWQucHVzaChudWxsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJhbmRvbWl6ZVNwYXducygpO1xuICB9XG5cbiAgbGVhZGVyYm9hcmQoKSB7XG4gICAgbGV0IHlQb3MgPSA2MDtcbiAgICBsZXQgeFBvcyA9IDk0MDtcbiAgICAvLyBpZiAoU1MuY3VycmVudFNjb3Jlcykge1xuICAgIC8vICAgdGhpcy5kcmF3U2NvcmVzKCcqKioqKiBIaSBTY29yZXMgKioqKionLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICB5UG9zICs9IDMwO1xuICAgIC8vICAgbGV0IGxiID0gU1MuY3VycmVudFNjb3JlcztcbiAgICAvLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgICAgdGhpcy5kcmF3U2NvcmVzKGxiW2ldLm5hbWUgKyAnICAnICsgIGxiW2ldLnNjb3JlLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICAgIHlQb3MgKz0gMzA7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9XG5cbiAgZHJhdyhlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuY29udGV4dEZYLmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICBzdXBlci5kcmF3KGVsYXBzZWRUaW1lKTtcblxuICAgIHRoaXMuZHJhd1Njb3JlKCk7XG5cbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgdGhpcy5kcmF3TWVzc2FnZSgnRGVhdGhib3QgNTAwMCcsIDEyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdXQVNEIHRvIFNob290JywgMTgwKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ0Fycm93IEtleXMgdG8gTW92ZScsIDIyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBCZWdpbicsIDI2MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2RlYWQnKSB7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdUaG91IGFydCAnICsgdGhpcy5wbGF5ZXJEZWF0aE1ldGhvZCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBTdGFydCBhZ2FpbicsIDI0MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhd0JhY2tncm91bmQoZWxhcHNlZFRpbWUpIHtcbiAgICBsZXQgYmdDb2xvcjtcbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgYmdDb2xvciA9ICdQdXJwbGUnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdkZWFkJykge1xuICAgICAgYmdDb2xvciA9ICdyZWQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBiZ0NvbG9yID0gdGhpcy5maWxsU3R5bGU7XG4gICAgfVxuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9IGJnQ29sb3I7XG4gICAgdGhpcy5jb250ZXh0QkcuZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNCRy53aWR0aCwgdGhpcy5jYW52YXNCRy5oZWlnaHQpO1xuICAgIHRoaXMuZHJhd0dyaWQodGhpcy5ncmlkKTtcbiAgICBpZiAodGhpcy5kZWJ1Z01vZGUpIHtcbiAgICAgIHRoaXMuZHJhd0dyaWQodGhpcy5zcGF3bkdyaWQpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXdHcmlkKGdyaWQpIHtcbiAgICBsZXQgZ3JpZFBvc1ggPSAwLCBncmlkUG9zWSA9IDA7XG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5jb2xzOyBjb2wrKykge1xuICAgICAgICBsZXQgaW5kZXggPSAocm93ICogdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgZ3JpZFBvc1ggPSBjb2wgKiB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgZ3JpZFBvc1kgPSByb3cgKiB0aGlzLmNlbGxIZWlnaHQ7XG5cbiAgICAgICAgaWYgKGdyaWRbaW5kZXhdKSB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0QkcuZHJhd0ltYWdlKHRoaXMudGlsZXMsIGdyaWRbaW5kZXhdICpcbiAgICAgICAgICB0aGlzLmNlbGxXaWR0aCwgMCwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCxcbiAgICAgICAgICBncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkW2luZGV4XSA9PT0gREVCVUdfVElMRSkge1xuICAgICAgICAgIHRoaXMuY29udGV4dEJHLnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICAgICAgdGhpcy5jb250ZXh0Qkcuc3Ryb2tlUmVjdChncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLFxuICAgICAgICAgICAgdGhpcy5jZWxsSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRyYXdMb2FkaW5nKCkge1xuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9ICcjY2NjJztcbiAgICB0aGlzLmNvbnRleHRCRy5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc0JHLndpZHRoLCB0aGlzLmNhbnZhc0JHLmhlaWdodCk7XG4gIH1cblxuICBkcmF3TWVzc2FnZShtZXNzYWdlLCB5UG9zLCBzaXplKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB5UG9zID0geVBvcyB8fCAyMDA7XG4gICAgc2l6ZSA9IHNpemUgfHwgMjU7XG4gICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzaXplICsgJ3B4IFZlcmRhbmEnO1xuICAgIGxldCBtZXRyaWNzID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KG1lc3NhZ2UpO1xuICAgIGxldCB3aWR0aCA9IG1ldHJpY3Mud2lkdGg7XG4gICAgbGV0IG1lc3NhZ2VYID0gcG9zIC0gd2lkdGggLyAyO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChtZXNzYWdlLCBtZXNzYWdlWCwgeVBvcyk7XG4gIH1cblxuIGRyYXdTY29yZXMobWVzc2FnZSwgeVBvcywgeFBvcywgc2l6ZSkge1xuICAgIGxldCBwb3MgPSB0aGlzLmNhbnZhcy53aWR0aCAvIDI7XG4gICAgeVBvcyA9IHlQb3MgfHwgMjAwO1xuICAgIHNpemUgPSBzaXplIHx8IDI1O1xuICAgIHRoaXMuY29udGV4dC5mb250ID0gc2l6ZSArICdweCBWZXJkYW5hJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQobWVzc2FnZSwgeFBvcywgeVBvcyk7XG4gIH1cblxuICBkcmF3U2NvcmUoKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB0aGlzLmNvbnRleHQuZm9udCA9ICcyNXB4IFZlcmRhbmEnO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIGxldCBzY29yZVRleHQgPSAnR0FNRTogJyArIHRoaXMuc2NvcmU7XG4gICAgbGV0IG1ldHJpY3MgPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoc2NvcmVUZXh0KTtcbiAgICBsZXQgd2lkdGggPSBtZXRyaWNzLndpZHRoO1xuICAgIGxldCBzY29yZVggPSBwb3MgLSAod2lkdGggLyAyKTtcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQoc2NvcmVUZXh0LCBzY29yZVgsIDI1KTtcbiAgfVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShlbGFwc2VkVGltZSk7XG5cbiAgICBpZiAodGhpcy5rZXlEb3duLnN0YXJ0ICYmIHRoaXMuZ2FtZVN0YXRlICE9PSAncGxheScpIHtcbiAgICAgIHRoaXMuZ2FtZVN0YXRlID0gJ3BsYXknO1xuICAgICAgY29uc29sZS5sb2coJ0dhbWUgU3RhcnQnKTtcbiAgICAgIHRoaXMucmFuZG9taXplU3Bhd25zKCk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubnVtT2ZNb25zdGVycyA9PT0gMCAmJiB0aGlzLmluaXRpYWxpemVkKSB7IC8vIFlvdSBiZWF0IGFsbCBtb25zdGVyc1xuICAgICAgdGhpcy5yYW5kb21pemVTcGF3bnMoKTtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VUaW1lID4gMCkgeyAvLyBzaG93IG5leHQgcm91bmQgbWVzc2FnZVxuICAgICAgICB0aGlzLmRyYXdNZXNzYWdlKCdSb3VuZCAnICsgdGhpcy5yb3VuZCk7XG4gICAgICAgIHRoaXMubWVzc2FnZVRpbWUgLT0gZWxhcHNlZFRpbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VUaW1lID0gMTA7XG4gICAgICAgIHRoaXMucm91bmQrKztcbiAgICAgICAgLy8gUmV2aXZpbmcgbW9uc3RlcnMsIHRoaXMgd2lsbCBiZSByZWZhY3RvcmVkIGxhdGVyIHRvIHJhbmRvbWl6ZVxuICAgICAgICAvLyBwb3NpdGlvbnMgcmF0aGVyIHRoYW4ganVzdCByZWFjdGl2YXRpbmcgdGhlIGRlYWQgb25lcyB3aGVyZSB0aGV5XG4gICAgICAgIC8vIGZlbGwuXG4gICAgICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICAgICAgaWYgKGFjdG9yIGluc3RhbmNlb2YgTW9uc3Rlcikge1xuICAgICAgICAgICAgdGhpcy5udW1PZk1vbnN0ZXJzKys7XG4gICAgICAgICAgICBhY3Rvci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgYWN0b3IuYWxwaGEgPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtBY3RvciwgUGh5c2ljcywgUG9pbnQsIERpcmVjdGlvbnN9IGZyb20gJy4vYmVyemVyayc7XG5pbXBvcnQge1BsYXllcn0gZnJvbSAnLi9wbGF5ZXInO1xuaW1wb3J0IHtCdWxsZXR9IGZyb20gJy4vYnVsbGV0JztcblxuZXhwb3J0IGNsYXNzIE1vbnN0ZXIgZXh0ZW5kcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgLy8gc3VwZXIoaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgpO1xuICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgdGhpcy5kaXJUaW1lciA9IDA7XG4gICAgdGhpcy5pc0ZpcmluZyA9IGZhbHNlO1xuICAgIHRoaXMubGFzZXJEZWx0YSA9IHt9O1xuICAgIHRoaXMubGFzZXJSYW5nZSA9IDEyMDA7XG4gICAgdGhpcy5sYXNlclN0YXJ0ID0ge307XG4gICAgdGhpcy5leWVPZmZzZXQgPSB7eDogMCwgeTogMTR9O1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgICAgc3VwZXIuZHJhdyhnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgICBpZiAoZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZvbnQgPSAnMTZweCBWZXJkYW5hJztcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZWQnO1xuICAgICAgICBnYW1lLmNvbnRleHQuZmlsbFRleHQoJ01vbnN0ZXInLFxuICAgICAgICAgIHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gNCksXG4gICAgICAgICAgdGhpcy5jdXJZIC0gMTApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5hbHBoYSA+PSAwLjEpIHtcbiAgICAgIHRoaXMuYWxwaGEgLT0gMC4xO1xuICAgICAgZ2FtZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gdGhpcy5hbHBoYTtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgICAgZ2FtZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcbiAgICB9XG4gIH1cblxuICBmaXJlTGFzZXIoZ2FtZSwgcGxheWVyKSB7XG4gICAgbGV0IGxhc2VyRW5kcG9pbnQgPSB7XG4gICAgICB4OiB0aGlzLmxhc2VyU3RhcnQueCArIHRoaXMubGFzZXJEZWx0YS54LFxuICAgICAgeTogdGhpcy5sYXNlclN0YXJ0LnkgKyB0aGlzLmxhc2VyRGVsdGEueVxuICAgIH07XG4gICAgbGV0IHRhcmdldCA9IFtdO1xuICAgIGxldCB0YXJnZXRPYmogPSB7fTtcbiAgICB0YXJnZXRPYmoueCA9IHBsYXllci5jdXJYICsgNTtcbiAgICB0YXJnZXRPYmoueSA9IHBsYXllci5jdXJZO1xuICAgIHRhcmdldE9iai53ID0gMTU7XG4gICAgdGFyZ2V0T2JqLmggPSAgMTU7XG4gICAgdGFyZ2V0LnB1c2godGFyZ2V0T2JqKTtcbiAgICBsZXQgdGFyZ2V0RGVsdGEgPSBnYW1lLnBoeXNpY3MuZ2V0RGVsdGEoXG4gICAgICB0aGlzLmxhc2VyU3RhcnQueCwgdGhpcy5sYXNlclN0YXJ0LnksIHRhcmdldE9iai54LCB0YXJnZXRPYmoueSk7XG4gICAgdGhpcy5maXJpbmcgPSB0cnVlO1xuICAgIHRoaXMubW92aW5nID0gZmFsc2U7XG5cbiAgICBsZXQgYmxvY2tSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgIHRoaXMubGFzZXJTdGFydCwgdGhpcy5sYXNlckRlbHRhLCBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgbGV0IHRhcmdldFJlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgdGhpcy5sYXNlclN0YXJ0LCB0aGlzLmxhc2VyRGVsdGEsIHRhcmdldCk7XG5cbiAgICBsZXQgZW5kUG9zOyBsZXQgdGFyZ2V0SGl0O1xuICAgIGlmICgoYmxvY2tSZXN1bHQgJiYgYmxvY2tSZXN1bHQuaGl0KSAmJlxuICAgICAgICAodGFyZ2V0UmVzdWx0ICYmIHRhcmdldFJlc3VsdC5oaXQpKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLmNoZWNrTmVhcmVzdEhpdCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tSZXN1bHQsIHRhcmdldFJlc3VsdCk7XG4gICAgICBlbmRQb3MgPSByZXN1bHQuZW5kUG9zO1xuICAgICAgdGFyZ2V0SGl0ID0gcmVzdWx0LnRhcmdldEhpdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJsb2NrUmVzdWx0ICYmIGJsb2NrUmVzdWx0LmhpdCkge1xuICAgICAgICAvLyB1cGRhdGUgZW5kIHBvcyB3aXRoIGhpdCBwb3NcbiAgICAgICAgZW5kUG9zID0gbmV3IFBvaW50KGJsb2NrUmVzdWx0LmhpdFBvcy54LFxuICAgICAgICAgIGJsb2NrUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldFJlc3VsdCAmJiB0YXJnZXRSZXN1bHQuaGl0KSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQb2ludCh0YXJnZXRSZXN1bHQuaGl0UG9zLngsXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgdGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQb2ludChsYXNlckVuZHBvaW50LngsIGxhc2VyRW5kcG9pbnQueSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGRlZ1RvRW5kcG9zID0gZ2FtZS5waHlzaWNzLmdldFRhcmdldERlZ3JlZSh0aGlzLmxhc2VyRGVsdGEpO1xuICAgIGxldCBkZWdUb1RhcmdldCA9IGdhbWUucGh5c2ljcy5nZXRUYXJnZXREZWdyZWUodGFyZ2V0RGVsdGEpO1xuXG4gICAgZ2FtZS5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIGdhbWUuY29udGV4dC5tb3ZlVG8odGhpcy5sYXNlclN0YXJ0LngsIHRoaXMubGFzZXJTdGFydC55KTtcbiAgICBnYW1lLmNvbnRleHQubGluZVRvKGVuZFBvcy54LCBlbmRQb3MueSk7XG4gICAgZ2FtZS5jb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgIGdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IHRhcmdldFJlc3VsdCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFJlc3VsdC5oaXQgPyAncmVkJyA6ICdibHVlJztcbiAgICBnYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG5cbiAgICBpZiAoIXRhcmdldEhpdCkge1xuICAgICAgbGV0IG5ld0RlZ3JlZTtcbiAgICAgIGlmICh0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgaWYgKGRlZ1RvRW5kcG9zIDwgMTgwKSB7XG4gICAgICAgICAgZGVnVG9FbmRwb3MgKz0gMzYwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWdUb1RhcmdldCA8IDE4MCkge1xuICAgICAgICAgIGRlZ1RvVGFyZ2V0ICs9IDM2MDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGRlZ1RvRW5kcG9zID4gZGVnVG9UYXJnZXQpIHtcbiAgICAgICAgaWYgKGRlZ1RvRW5kcG9zIC0gZGVnVG9UYXJnZXQgPiA2KSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgLSAzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0RlZ3JlZSA9IGRlZ1RvRW5kcG9zIC0gMC41O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5kZWdUb1BvcyhuZXdEZWdyZWUsIHRoaXMubGFzZXJSYW5nZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZGVnVG9UYXJnZXQgLSBkZWdUb0VuZHBvcyA+IDYpIHtcbiAgICAgICAgICBuZXdEZWdyZWUgPSBkZWdUb0VuZHBvcyArIDM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgKyAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXNlckRlbHRhID0gZ2FtZS5waHlzaWNzLmRlZ1RvUG9zKG5ld0RlZ3JlZSwgdGhpcy5sYXNlclJhbmdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgICBwbGF5ZXIucmVjb3ZlcnlUaW1lciA9IDA7XG4gICAgICAgIHBsYXllci5oZWFsdGggLT0gMjtcbiAgICAgICAgZ2FtZS5wbGF5ZXJEZWF0aE1ldGhvZCA9ICdibGluZCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgc3VwZXIudXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICB0aGlzLmxhc2VyU3RhcnQgPSB7XG4gICAgICB4OiB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpLFxuICAgICAgeTogdGhpcy5jdXJZICsgMTRcbiAgICB9O1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdyZWQnO1xuICAgIHRoaXMuZGlyVGltZXIgLT0gZWxhcHNlZFRpbWU7XG4gICAgaWYgKHRoaXMuZGlyVGltZXIgPD0gMCAmJiAhdGhpcy5maXJpbmcpIHtcbiAgICAgIHRoaXMubW92aW5nID0gQm9vbGVhbihnYW1lLmdldFJhbmRvbSgwLCAxKSk7XG4gICAgICB0aGlzLmRpclRpbWVyID0gZ2FtZS5nZXRSYW5kb20oMiwgNCk7XG4gICAgICBsZXQgbmV4dERpcmVjdGlvbiA9IGdhbWUuZ2V0UmFuZG9tKDAsIDMpO1xuICAgICAgdGhpcy5kaXJYID0gRGlyZWN0aW9ucy5kaXJlY3Rpb25zW25leHREaXJlY3Rpb25dLng7XG4gICAgICB0aGlzLmRpclkgPSBEaXJlY3Rpb25zLmRpcmVjdGlvbnNbbmV4dERpcmVjdGlvbl0ueTtcbiAgICB9XG4gICAgdGhpcy52aXNpYmxlQWN0b3JzID0gMDtcbiAgICB0aGlzLmVhY2hWaXNpYmxlQWN0b3IoZ2FtZSwgUGxheWVyLCBmdW5jdGlvbihwbGF5ZXIpIHtcbiAgICAgIHRoaXMudmlzaWJsZUFjdG9ycyArPSAxO1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3doaXRlJztcblxuICAgICAgaWYgKCF0aGlzLmZpcmluZykgeyAvLyBzZXQgdGhlIGluaXRpYWwgc3RhcnRpbmcgcG9pbnQgZm9yIHRoZSBsYXNlclxuICAgICAgICBsZXQgbGFzZXJFbmRwb2ludDtcbiAgICAgICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICAgICAgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgICAgICAgIHg6ICh0aGlzLmxhc2VyU3RhcnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgeTogdGhpcy5sYXNlclN0YXJ0LnlcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGlyWSA9PT0gLTEgfHwgdGhpcy5kaXJZID09PSAxKSB7XG4gICAgICAgICAgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgICAgICAgIHg6IHRoaXMubGFzZXJTdGFydC54LFxuICAgICAgICAgICAgeTogKHRoaXMubGFzZXJTdGFydC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcllcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShcbiAgICAgICAgICBsYXNlckVuZHBvaW50LngsIGxhc2VyRW5kcG9pbnQueSwgdGhpcy5sYXNlclN0YXJ0LngsXG4gICAgICAgICAgdGhpcy5sYXNlclN0YXJ0LnkpO1xuICAgICAgfVxuICAgICAgdGhpcy5maXJlTGFzZXIoZ2FtZSwgcGxheWVyKTtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLnZpc2libGVBY3RvcnMgPT09IDApIHtcbiAgICAgIHRoaXMubGFzZXJFbmRwb2ludCA9IG51bGw7XG4gICAgICB0aGlzLmZpcmluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgQnVsbGV0LCBmdW5jdGlvbihidWxsZXQpIHtcbiAgICAgIGJ1bGxldC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICdncmVlbic7XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgZ2FtZS5udW1PZk1vbnN0ZXJzLS07XG4gICAgICBnYW1lLnNjb3JlKys7XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuLypnbG9iYWxzIFNTOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCAqIGFzIGRlYXRoYm90IGZyb20gJy4vZGVhdGhib3QnO1xuaW1wb3J0IHtBY3RvciwgUGh5c2ljcywgQm94LCBQb2ludCwgTEVWRUxTfSBmcm9tICcuL2JlcnplcmsnO1xuaW1wb3J0IHtCdWxsZXR9IGZyb20gJy4vYnVsbGV0JztcblxuZXhwb3J0IGNsYXNzIFBsYXllciBleHRlbmRzIEFjdG9ye1xuICBjb25zdHJ1Y3RvcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCwgZGlyWSkge1xuICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgdGhpcy5oZWFsdGggPSAxMDA7XG4gICAgdGhpcy5yZWNvdmVyeVRpbWVyID0gMjtcbiAgICB0aGlzLmV5ZU9mZnNldCA9IHt4OiAwLCB5OiAxMH07XG4gIH1cblxuICBkcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKGdhbWUuZ2FtZVN0YXRlICE9PSAnYXR0cmFjdCcpIHtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWxsZXQpIHtcbiAgICAgIHRoaXMuYnVsbGV0LmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIH1cbiAgICBsZXQgaGVhbHRoVmlzID0gKCgxMDAgLSB0aGlzLmhlYWx0aCkgLyAxMDApO1xuICAgIGdhbWUuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwnICsgaGVhbHRoVmlzICsgJyknO1xuICAgIGdhbWUuY29udGV4dC5maWxsUmVjdCgwLCAwLCBnYW1lLmNhbnZhcy53aWR0aCwgZ2FtZS5jYW52YXMuaGVpZ2h0KTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgZ2FtZS5nYW1lU3RhdGUgPSAnZGVhZCc7XG4gICAgICBjb25zb2xlLmxvZygnREVBRCEnKTtcbiAgICAgIGlmICh0aGlzLmJ1bGxldCAmJiB0aGlzLmJ1bGxldC5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5idWxsZXQgPSBudWxsO1xuICAgICAgICBkZWxldGUgZ2FtZS5hY3RvcnMucGxheWVyQnVsbGV0O1xuICAgICAgfVxuICAgICAgLy8gbGV0IGxvd2VzdFNjb3JlID0gU1MuY3VycmVudFNjb3JlcyAmJiBTUy5jdXJyZW50U2NvcmVzLmxlbmd0aCA/XG4gICAgICAvLyAgIFNTLmN1cnJlbnRTY29yZXNbU1MuY3VycmVudFNjb3Jlcy5sZW5ndGggLSAxXS5zY29yZSA6IDA7XG4gICAgICAvLyBpZiAoZ2FtZS5zY29yZSA+IGxvd2VzdFNjb3JlKSB7XG4gICAgICAvLyAgIGxldCBwbGF5ZXJOYW1lID0gcHJvbXB0KCdQbGVhc2UgRW50ZXIgeW91ciBOYW1lLicpO1xuICAgICAgLy8gICBTUy5zdWJtaXRTY29yZShwbGF5ZXJOYW1lLCBnYW1lLnNjb3JlKTtcbiAgICAgIC8vICAgZGVhdGhib3Quc2NvcmVzID0gU1MuZ2V0U2NvcmVzKDgpO1xuICAgICAgLy8gfVxuICAgIH1cblxuICAgIGlmIChnYW1lLmdhbWVTdGF0ZSA9PT0gJ2F0dHJhY3QnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBkaXJYID0gMDtcbiAgICBsZXQgZGlyWSA9IDA7XG4gICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ2JsdWUnO1xuXG4gICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICdibGFjayc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhbHRoIDwgMTAwKSB7XG4gICAgICBpZiAodGhpcy5yZWNvdmVyeVRpbWVyID4gMSkge1xuICAgICAgICB0aGlzLmhlYWx0aCArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZWNvdmVyeVRpbWVyICs9IGVsYXBzZWRUaW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChnYW1lLmtleURvd24udXApIHtcbiAgICAgIGRpclkgPSAtMTtcbiAgICAgIHRoaXMuZGlyWCA9IDA7XG4gICAgICB0aGlzLmRpclkgPSBkaXJZO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5rZXlEb3duLmRvd24pIHtcbiAgICAgIGRpclkgPSAxO1xuICAgICAgdGhpcy5kaXJYID0gMDtcbiAgICAgIHRoaXMuZGlyWSA9IGRpclk7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24ubGVmdCkge1xuICAgICAgZGlyWCA9IC0xO1xuICAgICAgdGhpcy5kaXJZID0gMDtcbiAgICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24ucmlnaHQpIHtcbiAgICAgIGRpclggPSAxO1xuICAgICAgdGhpcy5kaXJZID0gMDtcbiAgICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgfVxuICAgIGlmICh0aGlzLmJ1bGxldCkge1xuICAgICAgLy8gY2hlY2sgd2hldGhlciBidWxsZXQgaXMgc3RpbGwgYWN0aXZlXG4gICAgICBpZiAoIXRoaXMuYnVsbGV0LmFjdGl2ZSkge1xuICAgICAgICB0aGlzLmJ1bGxldCA9IG51bGw7XG4gICAgICAgIGRlbGV0ZSBnYW1lLmFjdG9ycy5wbGF5ZXJCdWxsZXQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RVcCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMCwgLTEpO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdERvd24pIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIDAsIDEpO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdExlZnQpIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIC0xLCAwKTtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RSaWdodCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMSwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRpclggPT09IC0xICYmIHRoaXMuZmFjaW5nICE9PSAnbGVmdCcpIHtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSB0aGlzLmltYWdlLnJldjtcbiAgICAgIHRoaXMuZmFjaW5nID0gJ2xlZnQnO1xuICAgIH1cblxuICAgIGlmIChkaXJYID09PSAxICYmIHRoaXMuZmFjaW5nICE9PSAncmlnaHQnKSB7XG4gICAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5pbWFnZTtcbiAgICAgIHRoaXMuZmFjaW5nID0gJ3JpZ2h0JztcbiAgICB9XG5cbiAgICBsZXQgbW92aW5nQm94ID0gbmV3IEJveCh0aGlzLmN1clgsIHRoaXMuY3VyWSwgdGhpcy53aWR0aCxcbiAgICAgIHRoaXMuaGVpZ2h0KTtcbiAgICBsZXQgc2VnbWVudERlbHRhID0ge1xuICAgICAgeDogKHRoaXMuc3BlZWRYICogZWxhcHNlZFRpbWUpICogZGlyWCxcbiAgICAgIHk6ICh0aGlzLnNwZWVkWSAqIGVsYXBzZWRUaW1lKSAqIGRpcllcbiAgICB9O1xuICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3Muc3dlZXBCb3hJbnRvQm94ZXMobW92aW5nQm94LCBzZWdtZW50RGVsdGEsXG4gICAgICBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaGl0KSB7XG4gICAgICB0aGlzLmN1clggPSByZXN1bHQuaGl0UG9zLnggLSAodGhpcy53aWR0aCAvIDIpO1xuICAgICAgdGhpcy5jdXJZID0gcmVzdWx0LmhpdFBvcy55IC0gKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY3VyWCArPSBzZWdtZW50RGVsdGEueDtcbiAgICAgIHRoaXMuY3VyWSArPSBzZWdtZW50RGVsdGEueTtcbiAgICB9XG5cbiAgICBpZiAoKHRoaXMuY3VyWCArIHRoaXMud2lkdGgpID4gZ2FtZS5jYW52YXMud2lkdGgpIHtcbiAgICAgIGxldCB4Q2xpcCA9ICh0aGlzLmN1clggKyB0aGlzLndpZHRoKSAtIGdhbWUuY2FudmFzLndpZHRoIC0gdGhpcy53aWR0aDtcbiAgICAgIGlmICh0aGlzLmRpclggPT09IDEpIHtcbiAgICAgICAgdGhpcy5jdXJYID0geENsaXA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmN1clggPCAwKSB7XG4gICAgICBpZiAodGhpcy5kaXJYID09PSAtMSkge1xuICAgICAgICB0aGlzLmN1clggPSB0aGlzLmN1clggKyBnYW1lLmNhbnZhcy53aWR0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgPiBnYW1lLmNhbnZhcy5oZWlnaHQpIHtcbiAgICAgIGxldCB5Q2xpcCA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLSBnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodDtcbiAgICAgIGlmICh0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgdGhpcy5jdXJZID0geUNsaXA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICBpZiAodGhpcy5kaXJZID09PSAtMSkge1xuICAgICAgICB0aGlzLmN1clkgPSB0aGlzLmN1clkgKyBnYW1lLmNhbnZhcy5oZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5lYWNoT3ZlcmxhcHBpbmdBY3RvcihnYW1lLCBkZWF0aGJvdC5Nb25zdGVyLCBmdW5jdGlvbihhY3Rvcikge1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3doaXRlJztcbiAgICAgIGlmICghZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgdGhpcy5oZWFsdGggLT0gMjA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5oZWFsdGggPD0gMCkge1xuICAgICAgICBnYW1lLnBsYXllckRlYXRoTWV0aG9kID0gJ2RlYWQnO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5jdXJYLCB0aGlzLmN1clkpO1xuICAgIHRoaXMuaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICB9XG5cbiAgLy8gc3RhcnRYLCBzdGFydFksIHNwZWVkLCBkaXJYLCBkaXJZXG4gIGZpcmVCdWxsZXQoZ2FtZSwgZGlyWCwgZGlyWSkge1xuICAgIHRoaXMuYnVsbGV0ID0gbmV3IEJ1bGxldCh0aGlzLmN1clgsIHRoaXMuY3VyWSArIDIwLCA2MDAsIGRpclgsIGRpclkpO1xuICAgIGdhbWUuYWN0b3JzLnBsYXllckJ1bGxldCA9IHRoaXMuYnVsbGV0O1xuICB9XG59XG4iXX0=
