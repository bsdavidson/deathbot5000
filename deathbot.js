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
      var _this = this;

      var angle = arguments.length <= 2 || arguments[2] === undefined ? 45 : arguments[2];
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

      var initialDelta = game.physics.getDelta(initialEndpoint.x, initialEndpoint.y, startingPoint.x, startingPoint.y);
      var degToInitialEndpos = game.physics.getTargetDegree(initialDelta);
      var degreeToStartSweep = degToInitialEndpos - sweepAngle;
      var degreeToEndSweep = degToInitialEndpos + sweepAngle;
      initialDelta = game.physics.degToPos(degreeToStartSweep, this.laserRange);

      var endingEndPos = void 0;
      degreeToCurEndPoint = degreeToStartSweep;

      var _loop = function _loop() {
        var xxx = degreeToCurEndPoint == degreeToStartSweep;
        degreeToCurEndPoint += 0.2;
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
      this.context.globalAlpha = 1;
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // this.context.fillStyle = 'rgba(0,0,0,1.0)';
      // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

      this.eachActor(function (actor) {
        actor.preDraw(this, elapsedTime);
      }, this);
      this.context.globalCompositeOperation = "source-atop";
      this.eachActor(function (actor) {
        actor.draw(this, elapsedTime);
      }, this);
      this.context.globalCompositeOperation = "source-over";
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
  grid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
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
    _this.headLampActive = true;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9iZXJ6ZXJrL2FjdG9yLmpzIiwianMvYmVyemVyay9nYW1lLmpzIiwianMvYmVyemVyay9pbmRleC5qcyIsImpzL2Jlcnplcmsva2V5cy5qcyIsImpzL2JlcnplcmsvcGh5c2ljcy5qcyIsImpzL2J1bGxldC5qcyIsImpzL2RlYXRoYm90LmpzIiwianMvZ2FtZS5qcyIsImpzL21vbnN0ZXIuanMiLCJqcy9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ0E7Ozs7Ozs7OztBQUVBOzs7O0FBRU8sSUFBSSxrQ0FBYTtBQUN0QixNQUFJLENBQUo7QUFDQSxRQUFNLENBQU47QUFDQSxRQUFNLENBQU47QUFDQSxTQUFPLENBQVA7QUFDQSxjQUFZLENBQ1YsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUMsQ0FBRCxFQURBLEVBRVYsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFGRyxFQUdWLEVBQUMsR0FBRyxDQUFDLENBQUQsRUFBSSxHQUFHLENBQUgsRUFIRSxFQUlWLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBSkcsQ0FBWjtBQUtBLFNBQVEsQ0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLE1BQWYsRUFBdUIsT0FBdkIsQ0FBUjtBQUNBLDhCQUFTLE1BQU0sTUFBTTtBQUNuQixRQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ1osYUFBTyxLQUFLLEtBQUwsQ0FESztLQUFkLE1BRU8sSUFBSSxPQUFPLENBQVAsRUFBVTtBQUNuQixhQUFPLEtBQUssSUFBTCxDQURZO0tBQWQsTUFFQSxJQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ25CLGFBQU8sS0FBSyxJQUFMLENBRFk7S0FBZCxNQUVBLElBQUksT0FBTyxDQUFQLEVBQVU7QUFDbkIsYUFBTyxLQUFLLEVBQUwsQ0FEWTtLQUFkLE1BRUE7QUFDTCxhQUFPLEtBQUssS0FBTCxDQURGO0tBRkE7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O0FBQzNCLFdBQUssTUFBTCxHQUFjLG1CQUFXLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxHQUFZLEVBQVosRUFBZ0IsR0FBdEMsRUFBMkMsSUFBM0MsRUFBaUQsSUFBakQsQ0FBZCxDQUQyQjtBQUUzQixXQUFLLE1BQUwsQ0FBWSxZQUFaLEdBQTJCLEtBQUssTUFBTCxDQUZBOzs7O1NBbktsQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQaHlzaWNzLCBCb3gsIFBvaW50LCBFUFNJTE9OfSBmcm9tICcuL3BoeXNpY3MnO1xuXG5leHBvcnQgdmFyIERpcmVjdGlvbnMgPSB7XG4gIFVQOiAwLFxuICBET1dOOiAxLFxuICBMRUZUOiAyLFxuICBSSUdIVDogMyxcbiAgZGlyZWN0aW9uczogW1xuICAgIHt4OiAwLCB5OiAtMX0sXG4gICAge3g6IDAsIHk6IDF9LFxuICAgIHt4OiAtMSwgeTogMH0sXG4gICAge3g6IDEsIHk6IDB9XSxcbiAgbmFtZXM6ICBbJ3VwJywgJ2Rvd24nLCAnbGVmdCcsICdyaWdodCddLFxuICBnZXRJbmRleChkaXJYLCBkaXJZKSB7XG4gICAgaWYgKGRpclggPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5SSUdIVDtcbiAgICB9IGVsc2UgaWYgKGRpclggPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5MRUZUO1xuICAgIH0gZWxzZSBpZiAoZGlyWSA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLkRPV047XG4gICAgfSBlbHNlIGlmIChkaXJZIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuVVA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLlJJR0hUO1xuICAgIH1cbiAgfSxcbiAgZ2V0TmFtZShkaXJYLCBkaXJZKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXNbdGhpcy5nZXRJbmRleChkaXJYLCBkaXJZKV07XG4gIH1cbn07XG5cbmV4cG9ydCBjbGFzcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgbGV0IHVuc2NhbGVkV2lkdGgsIHVuc2NhbGVkSGVpZ2h0O1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgdGhpcy5pbWFnZSA9IGltYWdlO1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IHRoaXMuaW1hZ2U7XG4gICAgICB0aGlzLmRpckltYWdlcyA9IHtcbiAgICAgICAgcmlnaHQ6IGltYWdlLFxuICAgICAgICBsZWZ0OiBpbWFnZS5yZXYsXG4gICAgICAgIHVwOiBpbWFnZS51cCxcbiAgICAgICAgZG93bjogaW1hZ2UuZG93blxuICAgICAgfTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGlySW1hZ2VzKTtcbiAgICAgIHVuc2NhbGVkV2lkdGggPSBpbWFnZS53O1xuICAgICAgdW5zY2FsZWRIZWlnaHQgPSBpbWFnZS5oO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmltYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSBudWxsO1xuICAgICAgdGhpcy5kaXJJbWFnZXMgPSB7XG4gICAgICAgIHJpZ2h0OiBudWxsLFxuICAgICAgICBsZWZ0OiBudWxsLFxuICAgICAgICB1cDogbnVsbCxcbiAgICAgICAgZG93bjogbnVsbFxuICAgICAgfTtcbiAgICAgIHVuc2NhbGVkV2lkdGggPSAxO1xuICAgICAgdW5zY2FsZWRIZWlnaHQgPSAxO1xuICAgIH1cblxuICAgIHRoaXMucHJldmlvdXNEaXIgPSB7eDogdGhpcy5kaXJYLCB5OiB0aGlzLmRpcll9O1xuICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuXG4gICAgdGhpcy5mYWNpbmcgPSAncmlnaHQnO1xuICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgdGhpcy5kaXJZID0gZGlyWTtcbiAgICB0aGlzLndpZHRoID0gdW5zY2FsZWRXaWR0aCAqIChzY2FsZSAvIDEwMCk7XG4gICAgdGhpcy5oZWlnaHQgPSB1bnNjYWxlZEhlaWdodCAqIChzY2FsZSAvIDEwMCk7XG4gICAgdGhpcy5jdXJYID0gc3RhcnRYO1xuICAgIHRoaXMuY3VyWSA9IHN0YXJ0WTtcbiAgICB0aGlzLnByZXZpb3VzUG9zID0ge3g6IHRoaXMuY3VyWCwgeTogdGhpcy5jdXJZfTtcbiAgICB0aGlzLnRpbGVzSW5GT1YgPSBbXTtcbiAgICB0aGlzLnNwZWVkWCA9IHNwZWVkWDtcbiAgICB0aGlzLnNwZWVkWSA9IHNwZWVkWTtcbiAgICB0aGlzLm1vdmluZyA9IHRydWU7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdyZWQnO1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMubGFzZXJEZWx0YSA9IHt9O1xuICAgIHRoaXMubGFzZXJSYW5nZSA9IDk0MDA7XG4gICAgdGhpcy5sYXNlclN0YXJ0ID0ge307XG4gIH1cblxuICBjb2xsaWRlc1dpdGhXYWxscyhnYW1lKSB7XG4gICAgbGV0IHJlc3VsdCA9IHtoaXQ6IGZhbHNlLCBkaXJYOiAwLCBkaXJZOiAwfTtcbiAgICAvLyBIaXQgdGhlIExlZnQgV2FsbFxuICAgIGlmICh0aGlzLmN1clggPCAwKSB7XG4gICAgICB0aGlzLmN1clggPSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWDogMX07XG4gICAgfVxuICAgIC8vIEhpdCByaWdodCB3YWxsXG4gICAgaWYgKHRoaXMuY3VyWCA+IChnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGgpKSB7XG4gICAgICB0aGlzLmN1clggPSAoZ2FtZS5jYW52YXMud2lkdGggLSB0aGlzLndpZHRoKSAtIEVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJYOiAtMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgQ2VpbGluZ1xuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICB0aGlzLmN1clkgPSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWTogMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgRmxvb3JcbiAgICBpZiAodGhpcy5jdXJZID4gZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQpIHtcbiAgICAgIHRoaXMuY3VyWSA9IChnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodCkgLSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWTogLTF9O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgYWN0b3JDb25zdHJ1Y3RvciwgY2FsbGJhY2spIHtcbiAgICBnYW1lLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKCEoYWN0b3IgaW5zdGFuY2VvZiBhY3RvckNvbnN0cnVjdG9yKSB8fCAhYWN0b3IuYWN0aXZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCBvdmVybGFwcGluZyA9ICEoXG4gICAgICAgIHRoaXMuY3VyWCA+IGFjdG9yLmN1clggKyBhY3Rvci53aWR0aCB8fFxuICAgICAgICB0aGlzLmN1clggKyB0aGlzLndpZHRoIDwgYWN0b3IuY3VyWCB8fFxuICAgICAgICB0aGlzLmN1clkgKyB0aGlzLmhlaWdodCA8IGFjdG9yLmN1clkgfHxcbiAgICAgICAgdGhpcy5jdXJZID4gYWN0b3IuY3VyWSArIGFjdG9yLmhlaWdodFxuICAgICAgKTtcbiAgICAgIGlmIChvdmVybGFwcGluZykge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGFjdG9yKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIGVhY2hWaXNpYmxlQWN0b3IoZ2FtZSwgYWN0b3JDb25zdHJ1Y3RvciwgY2FsbGJhY2spIHtcbiAgICBnYW1lLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKCEoYWN0b3IgaW5zdGFuY2VvZiBhY3RvckNvbnN0cnVjdG9yKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZ2FtZS5nYW1lU3RhdGUgIT09ICdwbGF5Jykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgdmlzaW9uU3RhcnQgPSB7XG4gICAgICAgIHg6IHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gMikgKyB0aGlzLmV5ZU9mZnNldC54LFxuICAgICAgICB5OiB0aGlzLmN1clkgKyB0aGlzLmV5ZU9mZnNldC55XG4gICAgICB9O1xuICAgICAgbGV0IHZpc2lvbkRlbHRhID0ge1xuICAgICAgICB4OiAoYWN0b3IuY3VyWCArIChhY3Rvci53aWR0aCAvIDIpICsgYWN0b3IuZXllT2Zmc2V0LngpIC0gdmlzaW9uU3RhcnQueCxcbiAgICAgICAgeTogKGFjdG9yLmN1clkgKyBhY3Rvci5leWVPZmZzZXQueSkgLSB2aXNpb25TdGFydC55XG4gICAgICB9O1xuICAgICAgbGV0IGFjdG9yRGlyTGVuZ3RoID0gTWF0aC5zcXJ0KFxuICAgICAgICB2aXNpb25EZWx0YS54ICogdmlzaW9uRGVsdGEueCArIHZpc2lvbkRlbHRhLnkgKiB2aXNpb25EZWx0YS55KTtcbiAgICAgIGxldCBhY3RvckRpciA9IHtcbiAgICAgICAgeDogdmlzaW9uRGVsdGEueCAvIGFjdG9yRGlyTGVuZ3RoLFxuICAgICAgICB5OiB2aXNpb25EZWx0YS55IC8gYWN0b3JEaXJMZW5ndGhcbiAgICAgIH07XG4gICAgICBsZXQgZG90UHJvZHVjdCA9ICh0aGlzLmRpclggKiBhY3RvckRpci54KSArICh0aGlzLmRpclkgKiBhY3RvckRpci55KTtcblxuICAgICAgbGV0IHZpc2libGUgPSBmYWxzZTtcblxuICAgICAgbGV0IGluRk9WO1xuICAgICAgaWYgKGRvdFByb2R1Y3QgPiAwLjcwKSB7XG4gICAgICAgIGluRk9WID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluRk9WID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbkZPVikge1xuICAgICAgICBsZXQgYWN0b3JBcnIgPSBbXTtcbiAgICAgICAgbGV0IGFjdG9yT2JqID0ge1xuICAgICAgICAgIHg6IGFjdG9yLmN1clgsXG4gICAgICAgICAgeTogYWN0b3IuY3VyWSxcbiAgICAgICAgICB3OiBhY3Rvci53aWR0aCxcbiAgICAgICAgICBoOiBhY3Rvci5oZWlnaHRcbiAgICAgICAgfTtcbiAgICAgICAgYWN0b3JBcnIucHVzaChhY3Rvck9iaik7XG4gICAgICAgIGxldCBibG9ja1Jlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgICAgIHZpc2lvblN0YXJ0LCB2aXNpb25EZWx0YSwgZ2FtZS5zdGF0aWNCbG9ja3MpO1xuICAgICAgICBsZXQgYWN0b3JSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgICAgICB2aXNpb25TdGFydCwgdmlzaW9uRGVsdGEsIGFjdG9yQXJyKTtcblxuICAgICAgICBpZiAoZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICBsZXQgZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgICAgYWN0b3IuY3VyWCArIChhY3Rvci53aWR0aCAvIDIpICsgYWN0b3IuZXllT2Zmc2V0LngsXG4gICAgICAgICAgICBhY3Rvci5jdXJZICsgYWN0b3IuZXllT2Zmc2V0LnkpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQubW92ZVRvKHZpc2lvblN0YXJ0LngsIHZpc2lvblN0YXJ0LnkpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oZW5kUG9zLngsIGVuZFBvcy55KTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3doaXRlJztcbiAgICAgICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0b3JSZXN1bHQgJiYgYWN0b3JSZXN1bHQuaGl0ICYmIGJsb2NrUmVzdWx0ICYmIGJsb2NrUmVzdWx0LmhpdCkge1xuICAgICAgICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3MuY2hlY2tOZWFyZXN0SGl0KFxuICAgICAgICAgICAgdGhpcywgYmxvY2tSZXN1bHQsIGFjdG9yUmVzdWx0KTtcbiAgICAgICAgICB2aXNpYmxlID0gcmVzdWx0LnRhcmdldEhpdDtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RvclJlc3VsdCAmJiBhY3RvclJlc3VsdC5oaXQpIHtcbiAgICAgICAgICB2aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgYWN0b3IpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUsIGFuZ2xlID0gNDUsIHBvd2VyID0gODAwKSB7XG4gICAgbGV0IHBvaW50QXJyYXkgPSBbXTtcbiAgICBsZXQgc3RhcnRpbmdQb2ludCA9IHt9O1xuICAgIGxldCBkZWdyZWVUb0N1ckVuZFBvaW50O1xuICAgIGxldCBzd2VlcEFuZ2xlID0gYW5nbGU7XG4gICAgbGV0IGdyaWRTaXplID0ge3c6IDI4LCBoOiAyOH07XG4gICAgbGV0IGNlbGxTaXplID0gMzI7XG4gICAgbGV0IGRpciA9IHt4OiB0aGlzLmRpclgsIHk6IHRoaXMuZGlyWX07XG5cbiAgICBzdGFydGluZ1BvaW50LnggPSB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpO1xuICAgIHN0YXJ0aW5nUG9pbnQueSA9IHRoaXMuY3VyWSArIDE0O1xuICAgIGxldCBpbml0aWFsRW5kcG9pbnQgPSB7fTtcbiAgICAvLyBHZXQgb3VyIGluaXRpYWwgcG9pbnQgdGhhdCBpcyBzdHJhaWdodCBhaGVhZFxuICAgIGlmICh0aGlzLmRpclggPT09IC0xIHx8IHRoaXMuZGlyWCA9PT0gMSkge1xuICAgICAgaW5pdGlhbEVuZHBvaW50ID0ge3g6IChzdGFydGluZ1BvaW50LnggKyB0aGlzLmxhc2VyUmFuZ2UpICogLXRoaXMuZGlyWCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5OiBzdGFydGluZ1BvaW50Lnl9O1xuICAgIH0gZWxzZSBpZiAodGhpcy5kaXJZID09PSAtMSB8fCB0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgIGluaXRpYWxFbmRwb2ludCA9IHt4OiBzdGFydGluZ1BvaW50LngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAoc3RhcnRpbmdQb2ludC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcll9O1xuICAgIH1cblxuICAgIC8vIFVzaW5nIHRoZSBNb3VzZVxuICAgIC8vIGluaXRpYWxFbmRwb2ludCA9IHt4OiAodGhpcy5jdXJYIC0gZ2FtZS5tb3VzZS54KSAqIHRoaXMubGFzZXJSYW5nZSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgeTogKHRoaXMuY3VyWSAtIGdhbWUubW91c2UueSkgKiB0aGlzLmxhc2VyUmFuZ2V9O1xuXG4gICAgbGV0IGluaXRpYWxEZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShpbml0aWFsRW5kcG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbEVuZHBvaW50LnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdQb2ludC55KTtcbiAgICBsZXQgZGVnVG9Jbml0aWFsRW5kcG9zID0gZ2FtZS5waHlzaWNzLmdldFRhcmdldERlZ3JlZShpbml0aWFsRGVsdGEpO1xuICAgIGxldCBkZWdyZWVUb1N0YXJ0U3dlZXAgPSBkZWdUb0luaXRpYWxFbmRwb3MgLSBzd2VlcEFuZ2xlO1xuICAgIGxldCBkZWdyZWVUb0VuZFN3ZWVwID0gZGVnVG9Jbml0aWFsRW5kcG9zICsgc3dlZXBBbmdsZTtcbiAgICBpbml0aWFsRGVsdGEgPSBnYW1lLnBoeXNpY3MuZGVnVG9Qb3MoZGVncmVlVG9TdGFydFN3ZWVwLCB0aGlzLmxhc2VyUmFuZ2UpO1xuXG4gICAgbGV0IGVuZGluZ0VuZFBvcztcbiAgICBkZWdyZWVUb0N1ckVuZFBvaW50ID0gZGVncmVlVG9TdGFydFN3ZWVwO1xuXG4gICAgd2hpbGUgKGRlZ3JlZVRvQ3VyRW5kUG9pbnQgPCBkZWdyZWVUb0VuZFN3ZWVwKSB7XG4gICAgICBsZXQgeHh4ID0gZGVncmVlVG9DdXJFbmRQb2ludCA9PSBkZWdyZWVUb1N0YXJ0U3dlZXA7XG4gICAgICBkZWdyZWVUb0N1ckVuZFBvaW50ICs9IDAuMjtcbiAgICAgIGxldCBlbmRpbmdEZWx0YSA9IGdhbWUucGh5c2ljcy5kZWdUb1BvcyhkZWdyZWVUb0N1ckVuZFBvaW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGFzZXJSYW5nZSk7XG4gICAgICBnYW1lLnBoeXNpY3MuZ2V0Rmlyc3RDb2xsaXNpb24oc3RhcnRpbmdQb2ludCwgY2VsbFNpemUsIGVuZGluZ0RlbHRhLFxuICAgICAgICAoY2VsbHgsIGNlbGx5KSA9PiB7XG4gICAgICAgICAgbGV0IGdyaWRQb3MgPSAoY2VsbHkgKiBnYW1lLmNvbHMpICsgY2VsbHg7XG4gICAgICAgICAgbGV0IGJsb2NrID0gZ2FtZS5zdGF0aWNHcmlkW2dyaWRQb3NdO1xuICAgICAgICAgIGlmIChibG9jaykge1xuICAgICAgICAgICAgbGV0IGVuZGluZ1Jlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveChcbiAgICAgICAgICAgICAgc3RhcnRpbmdQb2ludCwgZW5kaW5nRGVsdGEsIGJsb2NrKTtcbiAgICAgICAgICAgIGlmIChlbmRpbmdSZXN1bHQgJiYgZW5kaW5nUmVzdWx0LmhpdCkge1xuICAgICAgICAgICAgICBlbmRpbmdFbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgICAgIGVuZGluZ1Jlc3VsdC5oaXRQb3MueCwgZW5kaW5nUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgICAgICAgcG9pbnRBcnJheS5wdXNoKGVuZGluZ0VuZFBvcyk7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH19XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGxldCBsaWdodEN0eCA9IGdhbWUuY29udGV4dDtcbiAgICBsaWdodEN0eC5iZWdpblBhdGgoKTtcbiAgICBsaWdodEN0eC5tb3ZlVG8oc3RhcnRpbmdQb2ludC54LCBzdGFydGluZ1BvaW50LnkpO1xuICAgIGZvciAobGV0IGkgPSAwLCBsaSA9IHBvaW50QXJyYXkubGVuZ3RoOyBpIDwgbGk7IGkrKykge1xuICAgICAgbGlnaHRDdHgubGluZVRvKHBvaW50QXJyYXlbaV0ueCwgcG9pbnRBcnJheVtpXS55KTtcbiAgICB9XG4gICAgbGlnaHRDdHguY2xvc2VQYXRoKCk7XG4gICAgbGV0IGdyZCA9IGxpZ2h0Q3R4LmNyZWF0ZVJhZGlhbEdyYWRpZW50KHRoaXMuY3VyWCx0aGlzLmN1clkscG93ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VyWCx0aGlzLmN1clksMCk7XG4gICAgZ3JkLmFkZENvbG9yU3RvcCgwLCAndHJhbnNwYXJlbnQnKTtcbiAgICBncmQuYWRkQ29sb3JTdG9wKDAuOCwgJ3JnYmEoMjU1LDI1NSwyNTUsMC4zKScpO1xuICAgIGdyZC5hZGRDb2xvclN0b3AoMSwgJ3JnYmEoMjU1LDI1NSwyNTUsMC41KScpO1xuICAgIGxpZ2h0Q3R4LmZpbGxTdHlsZSA9IGdyZDtcbiAgICBsaWdodEN0eC5maWxsKCk7XG4gIH1cblxuICB1cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBsZXQgaGl0V2FsbCA9IHRoaXMuY29sbGlkZXNXaXRoV2FsbHMoZ2FtZSk7XG4gICAgaWYgKGhpdFdhbGwuZGlyWCkge1xuICAgICAgdGhpcy5kaXJYID0gaGl0V2FsbC5kaXJYO1xuICAgIH1cbiAgICBpZiAoaGl0V2FsbC5kaXJZKSB7XG4gICAgICB0aGlzLmRpclkgPSBoaXRXYWxsLmRpclk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubW92aW5nKSB7XG4gICAgICBsZXQgbW92aW5nQm94ID0gbmV3IEJveCh0aGlzLmN1clgsIHRoaXMuY3VyWSwgdGhpcy53aWR0aCxcbiAgICAgICAgdGhpcy5oZWlnaHQpO1xuICAgICAgbGV0IHNlZ21lbnREZWx0YSA9IHtcbiAgICAgICAgeDogKHRoaXMuc3BlZWRYICogZWxhcHNlZFRpbWUpICogdGhpcy5kaXJYLFxuICAgICAgICB5OiAodGhpcy5zcGVlZFkgKiBlbGFwc2VkVGltZSkgKiB0aGlzLmRpcllcbiAgICAgIH07XG4gICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLnN3ZWVwQm94SW50b0JveGVzKG1vdmluZ0JveCwgc2VnbWVudERlbHRhLFxuICAgICAgICBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgICB0aGlzLnByZXZpb3VzUG9zID0ge1xuICAgICAgICB4OiB0aGlzLmN1clgsXG4gICAgICAgIHk6IHRoaXMuY3VyWVxuICAgICAgfTtcbiAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmhpdCkge1xuICAgICAgICB0aGlzLmRpclggPSByZXN1bHQuaGl0Tm9ybWFsLng7XG4gICAgICAgIHRoaXMuZGlyWSA9IHJlc3VsdC5oaXROb3JtYWwueTtcbiAgICAgICAgdGhpcy5jdXJYID0gcmVzdWx0LmhpdFBvcy54IC0gKHRoaXMud2lkdGggLyAyKTtcbiAgICAgICAgdGhpcy5jdXJZID0gcmVzdWx0LmhpdFBvcy55IC0gKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN1clggKz0gc2VnbWVudERlbHRhLng7XG4gICAgICAgIHRoaXMuY3VyWSArPSBzZWdtZW50RGVsdGEueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbWFnZSBTd2l0Y2hlclxuICAgIHRoaXMuZmFjaW5nID0gRGlyZWN0aW9ucy5nZXROYW1lKHRoaXMuZGlyWCwgdGhpcy5kaXJZKTtcbiAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5kaXJJbWFnZXNbdGhpcy5mYWNpbmddO1xuICB9XG5cbiAgcHJlRHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmFjdGl2ZSAmJiB0aGlzLmhlYWRMYW1wQWN0aXZlID09PSB0cnVlKSB7XG4gICAgICB0aGlzLmhlYWRMYW1wKGdhbWUsIGVsYXBzZWRUaW1lLCB0aGlzLmhlYWRMYW1wQW5nbGUsIHRoaXMuaGVhZExhbXBQb3dlcik7XG4gICAgfVxuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmN1ckltYWdlKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmN1ckltYWdlKTtcbiAgICAgIGxldCBpbWdTcGxpdFggPSAwLCBpbWdTcGxpdFkgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VyWCArIHRoaXMud2lkdGggPiBnYW1lLmNhbnZhcy53aWR0aCkge1xuICAgICAgICBpbWdTcGxpdFggPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgICBpbWdTcGxpdFggPSBnYW1lLmNhbnZhcy53aWR0aCArIHRoaXMuY3VyWDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICAgIGltZ1NwbGl0WSA9IGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0ICsgKHRoaXMuaGVpZ2h0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJZKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICAgIGltZ1NwbGl0WSA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLVxuICAgICAgICAgICAgICAgICAgICAgZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbWdTcGxpdFggIT09IDAgfHwgaW1nU3BsaXRZICE9PSAwKSB7XG4gICAgICAgIGlmIChpbWdTcGxpdFggPT09IDApIHtcbiAgICAgICAgICBpbWdTcGxpdFggPSB0aGlzLmN1clg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGltZ1NwbGl0WSA9PT0gMCkge1xuICAgICAgICAgIGltZ1NwbGl0WSA9IHRoaXMuY3VyWTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCB0aGlzLmN1clksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgdGhpcy5jdXJYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgfVxuICAgICAgZ2FtZS5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmN1ckltYWdlLCB0aGlzLmN1clgsIHRoaXMuY3VyWSxcbiAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGlmIChnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgbGV0IHgxID0gdGhpcy5jdXJYO1xuICAgICAgbGV0IHkxID0gdGhpcy5jdXJZO1xuICAgICAgbGV0IHgyID0gdGhpcy5jdXJYICsgdGhpcy53aWR0aDtcbiAgICAgIGxldCB5MiA9IHRoaXMuY3VyWSArIHRoaXMuaGVpZ2h0O1xuXG4gICAgICBnYW1lLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICBnYW1lLmNvbnRleHQubW92ZVRvKHgxLCB5MSk7XG4gICAgICBnYW1lLmNvbnRleHQubGluZVRvKHgyLCB5MSk7XG4gICAgICBnYW1lLmNvbnRleHQubGluZVRvKHgyLCB5Mik7XG4gICAgICBnYW1lLmNvbnRleHQubGluZVRvKHgxLCB5Mik7XG4gICAgICBnYW1lLmNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmRlYnVnQ29sb3I7XG4gICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICBnYW1lLmNvbnRleHQuZm9udCA9ICcxNHB4IFZlcmRhbmEnO1xuICAgICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICdibHVlJztcbiAgICAgIGdhbWUuY29udGV4dC5maWxsVGV4dChcbiAgICAgICAgJ3gnICsgTWF0aC5mbG9vcih0aGlzLmN1clgpICsgJyAnICtcbiAgICAgICAgJ3knICsgTWF0aC5mbG9vcih0aGlzLmN1clkpICsgJyAnICtcbiAgICAgICAgdGhpcy5kaXJYICsgJyAnICsgdGhpcy5kaXJZLFxuICAgICAgICB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDQpLFxuICAgICAgICB0aGlzLmN1clkgKyAodGhpcy5oZWlnaHQgKyAzMCkpO1xuICAgIH1cbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7UGh5c2ljc30gZnJvbSAnLi9waHlzaWNzJztcblxuZXhwb3J0IGNsYXNzIEdhbWUge1xuICBjb25zdHJ1Y3RvcihjYW52YXMpIHtcbiAgICB0aGlzLm1vdXNlID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmRlYnVnTW9kZSA9IGZhbHNlO1xuICAgIHRoaXMuaW1hZ2VzID0ge307XG4gICAgdGhpcy5pbWFnZXNMb2FkZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdG9ycyA9IHt9O1xuICAgIHRoaXMua2V5RG93biA9IHt9O1xuICAgIHRoaXMua2V5TmFtZXMgPSB7fTtcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICB9XG5cbiAgZGVmaW5lS2V5KGtleU5hbWUsIGtleUNvZGUpIHtcbiAgICB0aGlzLmtleURvd25ba2V5TmFtZV0gPSBmYWxzZTtcbiAgICB0aGlzLmtleU5hbWVzW2tleUNvZGVdID0ga2V5TmFtZTtcbiAgfVxuXG4gIGdldFJhbmRvbShtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xuICB9XG5cbiAgLy8gTG9vcHMgdGhyb3VnaCBBY3RvciBhcnJheSBhbmQgY3JlYXRlcyBjYWxsYWJsZSBpbWFnZXMuXG4gIGxvYWRJbWFnZXMoY2hhcmFjdGVycywgaW1hZ2VzKSB7XG4gICAgbGV0IGltYWdlc1RvTG9hZCA9IFtdO1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgbG9hZGVkSW1hZ2VzID0gMDtcbiAgICBsZXQgbnVtSW1hZ2VzID0gMDtcblxuICAgIGxldCBnZXRSZXZlcnNlSW1hZ2UgPSBmdW5jdGlvbihzcmMsIHcsIGgpIHtcbiAgICAgIG51bUltYWdlcysrO1xuICAgICAgbGV0IHRlbXBJbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgbGV0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGxldCB0ZW1wQ29udGV4dCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgIHRlbXBDYW52YXMud2lkdGggPSB3O1xuICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBoO1xuICAgICAgdGVtcENvbnRleHQudHJhbnNsYXRlKHcsIDApO1xuICAgICAgdGVtcENvbnRleHQuc2NhbGUoLTEsIDEpO1xuICAgICAgdGVtcENvbnRleHQuZHJhd0ltYWdlKHNyYywgMCwgMCk7XG4gICAgICB0ZW1wSW1hZ2Uub25sb2FkID0gb25JbWFnZUxvYWRlZDtcbiAgICAgIHRlbXBJbWFnZS5zcmMgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgpO1xuICAgICAgcmV0dXJuIHRlbXBJbWFnZTtcbiAgICB9O1xuXG4gICAgbGV0IG9uSW1hZ2VMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGxvYWRlZEltYWdlcysrO1xuICAgICAgY29uc29sZS5sb2coJ2xvYWRlZCBpbWFnZScsIGxvYWRlZEltYWdlcywgJ29mJywgbnVtSW1hZ2VzKTtcbiAgICAgIGlmIChsb2FkZWRJbWFnZXMgPT09IG51bUltYWdlcykge1xuICAgICAgICBzZWxmLmltYWdlc0xvYWRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCBsb2FkSW1hZ2UgPSBmdW5jdGlvbihzcmMsIGNhbGxiYWNrKSB7XG4gICAgICBsZXQgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjay5jYWxsKGltYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBvbkltYWdlTG9hZGVkKCk7XG4gICAgICB9O1xuICAgICAgaW1hZ2VzVG9Mb2FkLnB1c2goe2ltYWdlOiBpbWFnZSwgc3JjOiBzcmN9KTtcbiAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9O1xuXG4gICAgbGV0IG9uTWFpbkltYWdlTG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJldiA9IGdldFJldmVyc2VJbWFnZSh0aGlzLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGNoYXJhY3RlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgLy8gZ2V0IG91ciBtYWluIGltYWdlXG4gICAgICBsZXQgY2hhcmFjdGVyID0gY2hhcmFjdGVyc1tpXTtcbiAgICAgIGxldCBpbWFnZSA9IHRoaXMuaW1hZ2VzW2NoYXJhY3Rlci5uYW1lXSA9IGxvYWRJbWFnZShcbiAgICAgICAgY2hhcmFjdGVyLmltYWdlLFxuICAgICAgICBvbk1haW5JbWFnZUxvYWRlZCk7XG5cbiAgICAgIGlmIChjaGFyYWN0ZXIuaW1hZ2VVcCkge1xuICAgICAgICBpbWFnZS51cCA9IGxvYWRJbWFnZShjaGFyYWN0ZXIuaW1hZ2VVcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWFnZS51cCA9IGltYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2hhcmFjdGVyLmltYWdlRG93bikge1xuICAgICAgICBpbWFnZS5kb3duID0gbG9hZEltYWdlKGNoYXJhY3Rlci5pbWFnZURvd24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2UuZG93biA9IGltYWdlO1xuICAgICAgfVxuXG4gICAgICBpbWFnZS53ID0gY2hhcmFjdGVyLnc7XG4gICAgICBpbWFnZS5oID0gY2hhcmFjdGVyLmg7XG4gICAgfVxuXG4gICAgZm9yIChsZXQga2V5IGluIGltYWdlcykge1xuICAgICAgaWYgKGltYWdlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHRoaXNba2V5XSA9IGxvYWRJbWFnZShpbWFnZXNba2V5XSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbnVtSW1hZ2VzID0gaW1hZ2VzVG9Mb2FkLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBpbWFnZXNUb0xvYWQubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgaW1hZ2VzVG9Mb2FkW2ldLmltYWdlLnNyYyA9IGltYWdlc1RvTG9hZFtpXS5zcmM7XG4gICAgfVxuICB9XG5cbiAgZWFjaEFjdG9yKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgZm9yIChsZXQgYyBpbiB0aGlzLmFjdG9ycykge1xuICAgICAgaWYgKHRoaXMuYWN0b3JzLmhhc093blByb3BlcnR5KGMpKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgdGhpcy5hY3RvcnNbY10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGluaXRpYWxpemUoZWxhcHNlZFRpbWUpIHtcbiAgICB0aGlzLnBoeXNpY3MgPSBuZXcgUGh5c2ljcyh0aGlzKTtcbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIGRyYXcoZWxhcHNlZFRpbWUpIHtcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgLy8gdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEuMCknO1xuICAgIC8vIHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICB0aGlzLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgYWN0b3IucHJlRHJhdyh0aGlzLCBlbGFwc2VkVGltZSk7XG4gICAgfSwgdGhpcyk7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbj1cInNvdXJjZS1hdG9wXCI7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGFjdG9yLmRyYXcodGhpcywgZWxhcHNlZFRpbWUpO1xuICAgIH0sIHRoaXMpO1xuICAgIHRoaXMuY29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb249XCJzb3VyY2Utb3ZlclwiO1xuXG4gIH1cblxuICBkcmF3TG9hZGluZygpIHt9XG5cbiAgdXBkYXRlKGVsYXBzZWRUaW1lKSB7XG4gICAgdGhpcy5pdGVyYXRpb24rKztcbiAgICB0aGlzLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKGFjdG9yLmFjdGl2ZSkge1xuICAgICAgICBhY3Rvci51cGRhdGUodGhpcywgZWxhcHNlZFRpbWUpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgdGljayhlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmltYWdlc0xvYWRlZCkge1xuICAgICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZShlbGFwc2VkVGltZSk7XG4gICAgICB9XG4gICAgICB0aGlzLmRyYXcoZWxhcHNlZFRpbWUpO1xuICAgICAgdGhpcy51cGRhdGUoZWxhcHNlZFRpbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmRyYXdMb2FkaW5nKCk7XG4gICAgfVxuICB9XG5cbiAgb25LZXlEb3duKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQga2V5ID0gZXZlbnQua2V5Q29kZTtcbiAgICBpZiAodGhpcy5rZXlOYW1lcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB0aGlzLmtleURvd25bdGhpcy5rZXlOYW1lc1trZXldXSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgb25LZXlVcChldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGU7XG4gICAgaWYgKHRoaXMua2V5TmFtZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdGhpcy5rZXlEb3duW3RoaXMua2V5TmFtZXNba2V5XV0gPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBvbk1vdXNlTW92ZShldmVudCkge1xuICAgIHRoaXMubW91c2UueCA9IGV2ZW50LnBhZ2VYIC0gdGhpcy5jYW52YXMub2Zmc2V0TGVmdDtcbiAgICB0aGlzLm1vdXNlLnkgPSBldmVudC5wYWdlWSAtIHRoaXMuY2FudmFzLm9mZnNldFRvcDtcbiAgfVxuXG4gIG9uUmVzaXplKGV2ZW50KSB7XG4gICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgfVxuXG4gIHNldEZvY3VzKGV2ZW50LCBpc0JsdXJyZWQpIHtcbiAgICBpZiAodGhpcy5kZWJ1Z01vZGUgJiYgaXNCbHVycmVkKSB7XG4gICAgICB0aGlzLmZyYW1lc1BlclNlY29uZCA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZnJhbWVzUGVyU2Vjb25kID0gMzA7XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IHtQaHlzaWNzLCBCb3gsIFBvaW50LCBFUFNJTE9OfSBmcm9tICcuL3BoeXNpY3MnO1xuZXhwb3J0IHtLZXlzfSBmcm9tICcuL2tleXMnO1xuZXhwb3J0IHtHYW1lfSBmcm9tICcuL2dhbWUnO1xuZXhwb3J0IHtBY3RvciwgRGlyZWN0aW9uc30gZnJvbSAnLi9hY3Rvcic7XG4iLCIvKiBqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBjb25zdCBLZXlzID0ge1xuICBVUDogMzgsXG4gIERPV046IDQwLFxuICBMRUZUOiAzNyxcbiAgUklHSFQ6IDM5LFxuICBXOiA4NyxcbiAgQTogNjUsXG4gIFM6IDgzLFxuICBEOiA2OCxcbiAgU1BBQ0U6IDMyXG59O1xuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBjbGFzcyBCb3gge1xuICBjb25zdHJ1Y3Rvcih4LCB5LCB3LCBoKSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMudyA9IHc7XG4gICAgdGhpcy5oID0gaDtcbiAgfVxuXG4gIGluZmxhdGUocGFkZGluZ1gsIHBhZGRpbmdZKSB7XG4gICAgcmV0dXJuIG5ldyBCb3goXG4gICAgICB0aGlzLnggLSBwYWRkaW5nWCAvIDIsXG4gICAgICB0aGlzLnkgLSBwYWRkaW5nWSAvIDIsXG4gICAgICB0aGlzLncgKyBwYWRkaW5nWCxcbiAgICAgIHRoaXMuaCArIHBhZGRpbmdZKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUG9pbnQge1xuICBjb25zdHJ1Y3Rvcih4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBFUFNJTE9OID0gMSAvIDMyO1xuXG5leHBvcnQgY2xhc3MgUGh5c2ljcyB7XG4gIGNvbnN0cnVjdG9yKGdhbWUpIHtcbiAgICB0aGlzLmdhbWUgPSBnYW1lO1xuICB9XG5cbiAgZHJhd1BvaW50KHgsIHksIGNvbG9yLCBzaXplKSB7XG4gICAgc2l6ZSA9IHNpemUgfHwgNDtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5maWxsUmVjdCh4IC0gKHNpemUgLyAyKSwgeSAtIChzaXplIC8gMiksIHNpemUsIHNpemUpO1xuICB9XG5cbiAgZHJhd0xpbmUoeDEsIHkxLCB4MiwgeTIsIGNvbG9yKSB7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQubW92ZVRvKHgxLCB5MSk7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQubGluZVRvKHgyLCB5Mik7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBjb2xvcjtcbiAgICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2UoKTtcbiAgfVxuXG4gIGRyYXdUZXh0KHgsIHksIHRleHQsIGNvbG9yKSB7XG4gICAgY29sb3IgPSBjb2xvciB8fCAnd2hpdGUnO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZvbnQgPSAnMTRweCBBcmlhbCc7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFRleHQodGV4dCwgeCwgeSk7XG4gIH1cblxuICBkcmF3Qm94KHgsIHksIHcsIGgsIGNvbG9yKSB7XG4gICAgY29sb3IgPSBjb2xvciB8fCAnd2hpdGUnO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuc3Ryb2tlUmVjdCh4LCB5LCB3LCBoKTtcbiAgfVxuXG4gIGdldERlbHRhKHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgcmV0dXJuIHt4OiB4MiAtIHgxLCB5OiB5MiAtIHkxfTtcbiAgfVxuXG4gIGludGVyc2VjdFNlZ21lbnRJbnRvQm94KHNlZ21lbnRQb3MsIHNlZ21lbnREZWx0YSwgcGFkZGVkQm94LCBkZWJ1Zykge1xuICAgIC8vIGRyYXdCb3gocGFkZGVkQm94LngsIHBhZGRlZEJveC55LCBwYWRkZWRCb3gudywgcGFkZGVkQm94LmgsICdncmF5Jyk7XG4gICAgdmFyIG5lYXJYUGVyY2VudCwgZmFyWFBlcmNlbnQ7XG4gICAgaWYgKHNlZ21lbnREZWx0YS54ID49IDApIHtcbiAgICAgIC8vIGdvaW5nIGxlZnQgdG8gcmlnaHRcbiAgICAgIG5lYXJYUGVyY2VudCA9IChwYWRkZWRCb3gueCAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueDtcbiAgICAgIGZhclhQZXJjZW50ID0gKChwYWRkZWRCb3gueCArIHBhZGRlZEJveC53KSAtXG4gICAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGdvaW5nIHJpZ2h0IHRvIGxlZnRcbiAgICAgIG5lYXJYUGVyY2VudCA9IChcbiAgICAgICAgKChwYWRkZWRCb3gueCArIHBhZGRlZEJveC53KSAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueCk7XG4gICAgICBmYXJYUGVyY2VudCA9IChwYWRkZWRCb3gueCAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueDtcbiAgICB9XG5cbiAgICB2YXIgbmVhcllQZXJjZW50LCBmYXJZUGVyY2VudDtcbiAgICBpZiAoc2VnbWVudERlbHRhLnkgPj0gMCkge1xuICAgICAgLy8gZ29pbmcgdG9wIHRvIGJvdHRvbVxuICAgICAgbmVhcllQZXJjZW50ID0gKHBhZGRlZEJveC55IC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgICAgZmFyWVBlcmNlbnQgPSAoKHBhZGRlZEJveC55ICsgcGFkZGVkQm94LmgpIC1cbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBnb2luZyBib3R0b20gdG8gdG9wXG4gICAgICBuZWFyWVBlcmNlbnQgPSAoXG4gICAgICAgICgocGFkZGVkQm94LnkgKyBwYWRkZWRCb3guaCkgLSBzZWdtZW50UG9zLnkpIC8gc2VnbWVudERlbHRhLnkpO1xuICAgICAgZmFyWVBlcmNlbnQgPSAocGFkZGVkQm94LnkgLSBzZWdtZW50UG9zLnkpIC8gc2VnbWVudERlbHRhLnk7XG4gICAgfVxuXG4gICAgLy8gY2FsY3VsYXRlIHRoZSBmdXJ0aGVyIG9mIHRoZSB0d28gbmVhciBwZXJjZW50c1xuICAgIHZhciBuZWFyUGVyY2VudDtcbiAgICBpZiAobmVhclhQZXJjZW50ID4gbmVhcllQZXJjZW50KSB7XG4gICAgICBuZWFyUGVyY2VudCA9IG5lYXJYUGVyY2VudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmVhclBlcmNlbnQgPSBuZWFyWVBlcmNlbnQ7XG4gICAgfVxuXG4gICAgLy8gY2FsY3VsYXRlIHRoZSBuZWFyZXN0IG9mIHRoZSB0d28gZmFyIHBlcmNlbnRcbiAgICB2YXIgZmFyUGVyY2VudDtcbiAgICBpZiAoZmFyWFBlcmNlbnQgPCBmYXJZUGVyY2VudCkge1xuICAgICAgZmFyUGVyY2VudCA9IGZhclhQZXJjZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBmYXJQZXJjZW50ID0gZmFyWVBlcmNlbnQ7XG4gICAgfVxuXG4gICAgdmFyIGhpdDtcbiAgICBpZiAobmVhclhQZXJjZW50ID4gZmFyWVBlcmNlbnQgfHwgbmVhcllQZXJjZW50ID4gZmFyWFBlcmNlbnQpIHtcbiAgICAgIC8vIFdoZXJlIHRoZSBzZWdtZW50IGhpdHMgdGhlIGxlZnQgZWRnZSBvZiB0aGUgYm94LCBoYXMgdG8gYmUgYmV0d2VlblxuICAgICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIG9mIHRoZSBib3guIE90aGVyd2lzZSwgdGhlIHNlZ21lbnQgaXNcbiAgICAgIC8vIHBhc3NpbmcgdGhlIGJveCB2ZXJ0aWNhbGx5IGJlZm9yZSBpdCBoaXRzIHRoZSBsZWZ0IHNpZGUuXG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKG5lYXJQZXJjZW50ID4gMSkge1xuICAgICAgLy8gdGhlIGJveCBpcyBwYXN0IHRoZSBlbmQgb2YgdGhlIGxpbmVcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZmFyUGVyY2VudCA8IDApIHtcbiAgICAgIC8vIHRoZSBib3ggaXMgYmVmb3JlIHRoZSBzdGFydCBvZiB0aGUgbGluZVxuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpdCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGhpdFBlcmNlbnQgPSBuZWFyUGVyY2VudDtcbiAgICB2YXIgaGl0Tm9ybWFsID0ge307XG4gICAgaWYgKG5lYXJYUGVyY2VudCA+IG5lYXJZUGVyY2VudCkge1xuICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgbGVmdCBvciByaWdodCBlZGdlXG4gICAgICBpZiAoc2VnbWVudERlbHRhLnggPj0gMCkge1xuICAgICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSBsZWZ0IGVkZ2VcbiAgICAgICAgaGl0Tm9ybWFsLnggPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIHJpZ2h0IGVkZ2VcbiAgICAgICAgaGl0Tm9ybWFsLnggPSAxO1xuICAgICAgfVxuICAgICAgaGl0Tm9ybWFsLnkgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSB0byBvciBib3R0b20gZWRnZVxuICAgICAgaGl0Tm9ybWFsLnggPSAwO1xuICAgICAgaWYgKHNlZ21lbnREZWx0YS55ID49IDApIHtcbiAgICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgdG9wIGVkZ2VcbiAgICAgICAgaGl0Tm9ybWFsLnkgPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIGJvdHRvbSBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC55ID0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGhpdFBlcmNlbnQgPCAwKSB7XG4gICAgICBoaXRQZXJjZW50ID0gMDtcbiAgICB9XG5cbiAgICB2YXIgaGl0UG9zID0ge1xuICAgICAgeDogc2VnbWVudFBvcy54ICsgKHNlZ21lbnREZWx0YS54ICogaGl0UGVyY2VudCksXG4gICAgICB5OiBzZWdtZW50UG9zLnkgKyAoc2VnbWVudERlbHRhLnkgKiBoaXRQZXJjZW50KVxuICAgIH07XG5cbiAgICBoaXRQb3MueCArPSBoaXROb3JtYWwueCAqIEVQU0lMT047XG4gICAgaGl0UG9zLnkgKz0gaGl0Tm9ybWFsLnkgKiBFUFNJTE9OO1xuXG4gICAgbGV0IHJlc3VsdCA9ICB7XG4gICAgICBoaXQ6IGhpdCxcbiAgICAgIGhpdE5vcm1hbDogaGl0Tm9ybWFsLFxuICAgICAgaGl0UGVyY2VudDogaGl0UGVyY2VudCxcbiAgICAgIGhpdFBvczogaGl0UG9zLFxuICAgICAgbmVhclBlcmNlbnQ6IG5lYXJQZXJjZW50LFxuICAgICAgbmVhclhQZXJjZW50OiBuZWFyWFBlcmNlbnQsXG4gICAgICBuZWFyWVBlcmNlbnQ6IG5lYXJZUGVyY2VudCxcbiAgICAgIGZhclBlcmNlbnQ6IGZhclBlcmNlbnQsXG4gICAgICBmYXJYUGVyY2VudDogZmFyWFBlcmNlbnQsXG4gICAgICBmYXJZUGVyY2VudDogZmFyWVBlcmNlbnQsXG4gICAgICBoaXRCb3g6IHBhZGRlZEJveFxuICAgIH07XG4gICAgLy8gaWYgKGRlYnVnKSB7XG4gICAgLy8gICAgbGV0IGhpdENvdW50ZXIgPSAwO1xuICAgIC8vICAgIGxldCBoaXRDb2xvcnMgPSBbJyNmMDAnLCAnIzBmMCcsICcjZmYwJywgJyMwZmYnLCAnI2YwZicsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAnI2ZmZicsICcjZjkwJ107XG4gICAgLy8gICAgIHRoaXMuZHJhd1BvaW50KHJlc3VsdC5oaXRQb3MueCwgcmVzdWx0LmhpdFBvcy55LFxuICAgIC8vICAgICAgICAgICAgICAgICAgICBoaXRDb2xvcnNbaGl0Q291bnRlciAlIGhpdENvbG9ycy5sZW5ndGhdLCA0KTtcbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShzZWdtZW50UG9zLngsIHNlZ21lbnRQb3MueSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLnggKyBzZWdtZW50RGVsdGEueCxcbiAgICAvLyAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLnkgKyBzZWdtZW50RGVsdGEueSwgJyMwZmYnKTtcbiAgICAvLyAgICAgaGl0Q291bnRlciArPSAxO1xuICAgIC8vIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgc3dlZXBCb3hJbnRvQm94KG1vdmluZ0JveCwgc2VnbWVudERlbHRhLCBzdGF0aWNCb3gpIHtcbiAgICB2YXIgc2VnbWVudFBvcyA9IHtcbiAgICAgIHg6IG1vdmluZ0JveC54ICsgbW92aW5nQm94LncgLyAyLFxuICAgICAgeTogbW92aW5nQm94LnkgKyBtb3ZpbmdCb3guaCAvIDJcbiAgICB9O1xuXG4gICAgdmFyIHBhZGRlZEJveCA9IG5ldyBCb3goXG4gICAgICBzdGF0aWNCb3gueCAtIG1vdmluZ0JveC53IC8gMixcbiAgICAgIHN0YXRpY0JveC55IC0gbW92aW5nQm94LmggLyAyLFxuICAgICAgc3RhdGljQm94LncgKyBtb3ZpbmdCb3gudyxcbiAgICAgIHN0YXRpY0JveC5oICsgbW92aW5nQm94LmgpO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94KHNlZ21lbnRQb3MsIHNlZ21lbnREZWx0YSxcbiAgICAgIHBhZGRlZEJveCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoc2VnbWVudFBvcywgc2VnbWVudERlbHRhLCBzdGF0aWNCb3hlcywgZGVidWcpIHtcbiAgICBsZXQgaGl0Q291bnRlciA9IDA7XG4gICAgbGV0IGhpdENvbG9ycyA9IFsnI2YwMCcsICcjMGYwJywgJyNmZjAnLCAnIzBmZicsICcjZjBmJywgJyNmZmYnLCAnI2Y5MCddO1xuICAgIHZhciBuZWFyZXN0UmVzdWx0ID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMCwgaWwgPSBzdGF0aWNCb3hlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICB2YXIgc3RhdGljQm94ID0gc3RhdGljQm94ZXNbaV07XG4gICAgICB2YXIgcmVzdWx0ID0gdGhpcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveChzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsXG4gICAgICAgIHN0YXRpY0JveCk7XG4gICAgICBpZiAocmVzdWx0LmhpdCkge1xuICAgICAgICBpZiAoZGVidWcpIHtcbiAgICAgICAgICB0aGlzLmRyYXdQb2ludChyZXN1bHQuaGl0UG9zLngsIHJlc3VsdC5oaXRQb3MueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBoaXRDb2xvcnNbaGl0Q291bnRlciAlIGhpdENvbG9ycy5sZW5ndGhdLCA0KTtcbiAgICAgICAgICB0aGlzLmRyYXdMaW5lKHNlZ21lbnRQb3MueCwgc2VnbWVudFBvcy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy54ICsgc2VnbWVudERlbHRhLngsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLnkgKyBzZWdtZW50RGVsdGEueSwgJyMwZmYnKTtcbiAgICAgICAgICBoaXRDb3VudGVyICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFuZWFyZXN0UmVzdWx0IHx8IHJlc3VsdC5oaXRQZXJjZW50IDwgbmVhcmVzdFJlc3VsdC5oaXRQZXJjZW50KSB7XG4gICAgICAgICAgbmVhcmVzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmVhcmVzdFJlc3VsdDtcbiAgfVxuXG4gIC8vIFN3ZWVwIG1vdmluZ0JveCwgYWxvbmcgdGhlIG1vdmVtZW50IGRlc2NyaWJlZCBieSBzZWdtZW50RGVsdGEsIGludG8gZWFjaFxuICAvLyBib3ggaW4gdGhlIGxpc3Qgb2Ygc3RhdGljQm94ZXMuIFJldHVybiBhIHJlc3VsdCBvYmplY3QgZGVzY3JpYmluZyB0aGUgZmlyc3RcbiAgLy8gc3RhdGljIGJveCB0aGF0IG1vdmluZ0JveCBoaXRzLCBvciBudWxsLlxuICBzd2VlcEJveEludG9Cb3hlcyhtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94ZXMpIHtcbiAgICB2YXIgbmVhcmVzdFJlc3VsdCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gc3RhdGljQm94ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgdmFyIHN0YXRpY0JveCA9IHN0YXRpY0JveGVzW2ldO1xuICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuc3dlZXBCb3hJbnRvQm94KG1vdmluZ0JveCwgc2VnbWVudERlbHRhLCBzdGF0aWNCb3gpO1xuICAgICAgaWYgKHJlc3VsdC5oaXQpIHtcbiAgICAgICAgaWYgKCFuZWFyZXN0UmVzdWx0IHx8IHJlc3VsdC5oaXRQZXJjZW50IDwgbmVhcmVzdFJlc3VsdC5oaXRQZXJjZW50KSB7XG4gICAgICAgICAgbmVhcmVzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmVhcmVzdFJlc3VsdDtcbiAgfVxuXG4gIGdldEZpcnN0Q29sbGlzaW9uKHN0YXJ0UG9zLCBjZWxsU2l6ZSwgZGVsdGEsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGRpciA9IHt9LCBlbmRQb3MgPSB7fSwgY2VsbCA9IHt9LCB0aW1lU3RlcCA9IHt9LCB0aW1lID0ge307XG4gICAgbGV0IGRpcnMgPSBbJ3gnLCAneSddO1xuICAgIGxldCBmaXJzdEVkZ2UgPSB7fTtcblxuICAgIGZvcihsZXQgaSA9IDA7IGkgPCAyOyBpKyspe1xuICAgICAgbGV0IGsgPSBkaXJzW2ldO1xuICAgICAgZGlyW2tdID0gZGVsdGFba10gPCAwID8gLTEgOiAxO1xuICAgICAgZW5kUG9zW2tdID0gc3RhcnRQb3Nba10gKyBkZWx0YVtrXTtcbiAgICAgIGNlbGxba10gPSBNYXRoLmZsb29yKHN0YXJ0UG9zW2tdIC8gY2VsbFNpemUpO1xuICAgICAgdGltZVN0ZXBba10gPSAoY2VsbFNpemUgKiBkaXJba10pIC8gZGVsdGFba107XG4gICAgICBpZiAoZGlyW2tdID09PSAwKSB7XG4gICAgICAgIHRpbWVba10gPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmlyc3RFZGdlW2tdID0gY2VsbFtrXSAqIGNlbGxTaXplO1xuICAgICAgICBpZiAoZGlyW2tdID4gMCkge1xuICAgICAgICAgIGZpcnN0RWRnZVtrXSArPSBjZWxsU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICB0aW1lW2tdID0gKGZpcnN0RWRnZVtrXSAtIHN0YXJ0UG9zW2tdKSAvXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWx0YVtrXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3aGlsZSAodGltZS54IDwgMSB8fCB0aW1lLnkgPCAxKSB7XG4gICAgICBpZiAodGltZS54IDwgdGltZS55KSB7XG4gICAgICAgIHRpbWUueCArPSB0aW1lU3RlcC54O1xuICAgICAgICBjZWxsLnggKz0gZGlyLng7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjZWxsLnkgKz0gZGlyLnk7XG4gICAgICAgIHRpbWUueSArPSB0aW1lU3RlcC55O1xuICAgICAgfVxuICAgICAgaWYgKGNhbGxiYWNrKGNlbGwueCwgY2VsbC55KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2hlY2tOZWFyZXN0SGl0KHNvdXJjZUFjdG9yLCBzdGF0aWNSZXN1bHQsIHRhcmdldFJlc3VsdCkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIgc291cmNlWCA9IHNvdXJjZUFjdG9yLmN1clg7XG4gICAgdmFyIHN0YXRpY1ggPSBzdGF0aWNSZXN1bHQuaGl0UG9zLng7XG4gICAgdmFyIHRhcmdldFggPSB0YXJnZXRSZXN1bHQuaGl0UG9zLng7XG4gICAgdmFyIHNvdXJjZVkgPSBzb3VyY2VBY3Rvci5jdXJZO1xuICAgIHZhciBzdGF0aWNZID0gc3RhdGljUmVzdWx0LmhpdFBvcy55O1xuICAgIHZhciB0YXJnZXRZID0gdGFyZ2V0UmVzdWx0LmhpdFBvcy55O1xuXG4gICAgaWYgKHNvdXJjZUFjdG9yLmRpclggPT09IC0xIHx8IHNvdXJjZUFjdG9yLmRpclggPT09IDEpIHtcbiAgICAgIGlmIChNYXRoLmFicyhzb3VyY2VYIC0gc3RhdGljWCkgPCBNYXRoLmFicyhzb3VyY2VYIC0gdGFyZ2V0WCkpIHtcbiAgICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IGZhbHNlO1xuICAgICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgIHN0YXRpY1Jlc3VsdC5oaXRQb3MueCwgc3RhdGljUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy54LCB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICByZXN1bHQudGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNvdXJjZUFjdG9yLmRpclkgPT09IC0xIHx8IHNvdXJjZUFjdG9yLmRpclkgPT09IDEpIHtcbiAgICAgIGlmIChNYXRoLmFicyhzb3VyY2VZIC0gc3RhdGljWSkgPCBNYXRoLmFicyhzb3VyY2VZIC0gdGFyZ2V0WSkpIHtcbiAgICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IGZhbHNlO1xuICAgICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgIHN0YXRpY1Jlc3VsdC5oaXRQb3MueCwgc3RhdGljUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUG9pbnQoXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy54LCB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICByZXN1bHQudGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGdldFRhcmdldERlZ3JlZShkZWx0YSkge1xuICAgIHZhciB0aGV0YSA9IE1hdGguYXRhbjIoZGVsdGEueCwgZGVsdGEueSk7XG4gICAgdmFyIGRlZ3JlZSA9IHRoZXRhICogKDE4MCAvIE1hdGguUEkpO1xuICAgIGlmICh0aGV0YSA8IDApIHtcbiAgICAgIGRlZ3JlZSArPSAzNjA7XG4gICAgfVxuICAgIHJldHVybiBkZWdyZWU7XG4gIH1cblxuICBkZWdUb1BvcyhkZWdyZWUsIHJhZGl1cykge1xuICAgIHZhciByYWRpYW4gPSBkZWdyZWUgKiAoTWF0aC5QSSAvIDE4MCk7XG4gICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgIHg6IHJhZGl1cyAqIE1hdGguc2luKHJhZGlhbiksXG4gICAgICB5OiByYWRpdXMgKiBNYXRoLmNvcyhyYWRpYW4pXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtBY3Rvcn0gZnJvbSAnLi9iZXJ6ZXJrJztcblxuZXhwb3J0IGNsYXNzIEJ1bGxldCBleHRlbmRzIEFjdG9yIHtcbiAgY29uc3RydWN0b3Ioc3RhcnRYLCBzdGFydFksIHNwZWVkLCBkaXJYLCBkaXJZKSB7XG4gICAgdmFyIGltYWdlID0ge3c6IDUsIGg6IDV9O1xuICAgIHN1cGVyKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgMTAwLCBzcGVlZCwgc3BlZWQsIGRpclgsIGRpclkpO1xuICAgIHRoaXMuZGVhdGhUaW1lciA9IDA7XG4gICAgdGhpcy5oZWFkTGFtcEFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5oZWFkTGFtcEFuZ2xlID0gMTgwO1xuICAgIHRoaXMuaGVhZExhbXBQb3dlciA9IDI4MDtcbiAgfVxuXG4gIGRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBnYW1lLmNvbnRleHRGWC5maWxsU3R5bGUgPSAnI0ZGRic7XG4gICAgZ2FtZS5jb250ZXh0RlguZmlsbFJlY3QodGhpcy5jdXJYLCB0aGlzLmN1clksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5kZWF0aFRpbWVyICs9IGVsYXBzZWRUaW1lO1xuICAgIGlmICh0aGlzLmRlYXRoVGltZXIgPj0gMSkge1xuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuRGVhdGhib3QgPSBleHBvcnRzO1xuZXhwb3J0IHtHYW1lfSBmcm9tICcuL2dhbWUnO1xuZXhwb3J0IHtQbGF5ZXJ9IGZyb20gJy4vcGxheWVyJztcbmV4cG9ydCB7TW9uc3Rlcn0gZnJvbSAnLi9tb25zdGVyJztcbmV4cG9ydCB7QnVsbGV0fSBmcm9tICcuL2J1bGxldCc7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAvLyBUaGUgRGVhdGhib3QgcHJvcGVydGllcyB3aWxsIGJlIGZpbGxlZCBpbiBieSB0aGUgb3RoZXIgc2NyaXB0cy4gRXZlblxuICAvLyB0aG91Z2ggdGhleSBkb24ndCBsb29rIGxpa2UgdGhleSBleGlzdCBhdCB0aGlzIHBvaW50LCB0aGV5IHdpbGwgYnkgdGhlXG4gIC8vIHRpbWUgdGhlIHdpbmRvdyBsb2FkIGV2ZW50IGhhcyBmaXJlZC5cblxuICB2YXIgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlYXRoYm90Jyk7XG4gIHZhciBjYW52YXNCRyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNiYWNrZ3JvdW5kJyk7XG4gIHZhciBnYW1lID0gd2luZG93LmRlYXRoYm90R2FtZSA9IG5ldyBleHBvcnRzLkdhbWUoXG4gICAgY2FudmFzLCBjYW52YXNCRywgJyMxMTEnKTtcbiAgZ2FtZS5sb2FkSW1hZ2VzKCk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uS2V5RG93bihldmVudCk7XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIChldmVudCkgPT4ge1xuICAgIGdhbWUub25LZXlVcChldmVudCk7XG4gIH0pO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uTW91c2VNb3ZlKGV2ZW50KTtcbiAgfSk7XG5cbiAgdmFyIGJsdXJyZWQgPSBmYWxzZTtcbiAgdmFyIHNldEZvY3VzID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQudHlwZSA9PT0gJ2JsdXInKSB7XG4gICAgICAgIGJsdXJyZWQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChldmVudC50eXBlID09PSAnZm9jdXMnKSB7XG4gICAgICAgIGJsdXJyZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZ2FtZS5zZXRGb2N1cyhldmVudCwgZG9jdW1lbnQuaGlkZGVuIHx8IGJsdXJyZWQpO1xuICB9O1xuICBzZXRGb2N1cygpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmx1cicsIHNldEZvY3VzLCB0cnVlKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgc2V0Rm9jdXMsIHRydWUpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIHNldEZvY3VzLCB0cnVlKTtcblxuICB2YXIgcmVzaXplVGltZW91dDtcbiAgd2luZG93Lm9ucmVzaXplID0gKGV2ZW50KSA9PiB7XG4gICAgaWYgKHJlc2l6ZVRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgICAgIHJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHJlc2l6ZVRpbWVvdXQgPSBudWxsO1xuICAgICAgZ2FtZS5vblJlc2l6ZShldmVudCk7XG4gICAgfSwgMTAwMCk7XG4gIH07XG5cbiAgdmFyIG9sZEZyYW1lVGltZSA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDApO1xuICB2YXIgdGljayA9ICgpID0+IHtcbiAgICB2YXIgbmV3RnJhbWVUaW1lID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCk7XG4gICAgdmFyIGVsYXBzZWRUaW1lID0gbmV3RnJhbWVUaW1lIC0gb2xkRnJhbWVUaW1lO1xuICAgIG9sZEZyYW1lVGltZSA9IG5ld0ZyYW1lVGltZTtcbiAgICBnYW1lLnRpY2soZWxhcHNlZFRpbWUpO1xuICAgIHNldFRpbWVvdXQodGljaywgTWF0aC5mbG9vcigxMDAwIC8gZ2FtZS5mcmFtZXNQZXJTZWNvbmQpKTtcbiAgfTtcbiAgdGljaygpO1xufSk7XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbi8qZ2xvYmFscyBTUzpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge0dhbWUgYXMgQmVyemVya0dhbWUsIEtleXMsIFBoeXNpY3MsIEJveCwgRVBTSUxPTn0gZnJvbSAnLi9iZXJ6ZXJrJztcbmltcG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge01vbnN0ZXJ9IGZyb20gJy4vbW9uc3Rlcic7XG5cbmNvbnN0IERFQlVHX1RJTEUgPSA5O1xuZXhwb3J0IGNvbnN0IExFVkVMUyA9IFtcbiAge1xuICAgIGNvbHM6IDI4LFxuICAgIHJvd3M6IDI4LFxuICAgIGdyaWQ6IFtcbiAgICAgIDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsXG4gICAgICAxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMSwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDEsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDEsXG4gICAgICAxLDAsMSwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwxLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMSwxLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwwLDAsMCwwLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLFxuICAgIF1cbiAgfVxuXTtcblxuY29uc3QgQ0hBUkFDVEVSUyA9IFtcbiAge1xuICAgIG5hbWU6ICdkZWF0aGJvdCcsXG4gICAgaW1hZ2U6ICdpbWcvZGVhdGhib3QucG5nJyxcbiAgICBpbWFnZVVwOiAnaW1nL2RlYXRoYm90X3VwLnBuZycsXG4gICAgaW1hZ2VEb3duOiAnaW1nL2RlYXRoYm90X2Rvd24ucG5nJyxcbiAgICB3OiA0MCxcbiAgICBoOiA1MlxuICB9LFxuICB7XG4gICAgbmFtZTogJ3BsYXllcicsXG4gICAgaW1hZ2U6ICdpbWcvcGxheWVyLnBuZycsXG4gICAgdzogMjgsXG4gICAgaDogNTJcbiAgfVxuXTtcblxuZXhwb3J0IGNsYXNzIEdhbWUgZXh0ZW5kcyBCZXJ6ZXJrR2FtZSB7XG4gIGNvbnN0cnVjdG9yKGNhbnZhcywgY2FudmFzQkcsIGZpbGxTdHlsZSkge1xuICAgIHN1cGVyKGNhbnZhcyk7XG4gICAgdGhpcy5wbGF5ZXJEZWF0aE1ldGhvZCA9ICcnO1xuICAgIHRoaXMuZ2FtZVN0YXRlID0gJ2F0dHJhY3QnOyAvLyBhdHRyYWN0LCBwbGF5LCBkZWFkXG4gICAgdGhpcy5zY29yZSA9IDA7XG4gICAgdGhpcy5yb3VuZCA9IDI7XG4gICAgdGhpcy5udW1PZk1vbnN0ZXJzID0gMDtcbiAgICB0aGlzLmNlbGxXaWR0aCA9IDMyO1xuICAgIHRoaXMuY2VsbEhlaWdodCA9IDMyO1xuICAgIHRoaXMudGlsZXMgPSBudWxsO1xuICAgIHRoaXMuY29scyA9IExFVkVMU1swXS5jb2xzO1xuICAgIHRoaXMucm93cyA9IExFVkVMU1swXS5yb3dzO1xuICAgIHRoaXMuZ3JpZCA9IExFVkVMU1swXS5ncmlkO1xuICAgIHRoaXMuc3Bhd25HcmlkID0gW107XG4gICAgdGhpcy5zdGF0aWNCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnN0YXRpY0dyaWQgPSBbXTtcbiAgICB0aGlzLmZpbGxTdHlsZSA9IGZpbGxTdHlsZTtcbiAgICB0aGlzLmNhbnZhc0JHID0gY2FudmFzQkc7XG4gICAgdGhpcy5jYW52YXNCRy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzQkcuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGV4dEJHID0gdGhpcy5jYW52YXNCRy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIHRoaXMuY2FudmFzRlggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZngnKTtcbiAgICB0aGlzLmNhbnZhc0ZYLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXNGWC5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jb250ZXh0RlggPSB0aGlzLmNhbnZhc0ZYLmdldENvbnRleHQoJzJkJyk7XG4gICAgLy8gdGhpcy5jb250ZXh0RlguZmlsbFN0eWxlID0gJ3JnYmEoMCwgMCwgMCwgLjUwKSc7XG4gICAgLy8gdGhpcy5jb250ZXh0RlguZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNGWC53aWR0aCwgdGhpcy5jYW52YXNGWC5oZWlnaHQpO1xuICAgIHRoaXMubWVzc2FnZVRpbWUgPSAxMDtcblxuICAgIHRoaXMuZGVmaW5lS2V5KCdzdGFydCcsIEtleXMuU1BBQ0UpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCd1cCcsIEtleXMuVVApO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdkb3duJywgS2V5cy5ET1dOKTtcbiAgICB0aGlzLmRlZmluZUtleSgnbGVmdCcsIEtleXMuTEVGVCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3JpZ2h0JywgS2V5cy5SSUdIVCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3Nob290VXAnLCBLZXlzLlcpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdExlZnQnLCBLZXlzLkEpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdERvd24nLCBLZXlzLlMpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdFJpZ2h0JywgS2V5cy5EKTtcbiAgfVxuXG4gIGNyZWF0ZVNwYXduUG9pbnRzKGFjdG9yV2lkdGgsIGFjdG9ySGVpZ2h0KSB7XG4gICAgbGV0IHNwYXduTG9jYXRpb25zID0gW107XG4gICAgbGV0IHNwYXduR3JpZCA9IHRoaXMuZ3JpZC5zbGljZSgwKTtcblxuICAgIGxldCBhY3RvckJsb2NrID0ge1xuICAgICAgdzogTWF0aC5jZWlsKGFjdG9yV2lkdGggLyB0aGlzLmNlbGxXaWR0aCksXG4gICAgICBoOiBNYXRoLmNlaWwoYWN0b3JIZWlnaHQgLyB0aGlzLmNlbGxIZWlnaHQpXG4gICAgfTtcbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSB0aGlzLmdyaWQubGVuZ3RoOyBpIDwgbGk7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZ3JpZFtpXSA9PT0gMCkge1xuICAgICAgICBsZXQgbnVtT2ZTcGFjZXNOZWVkZWQgPSBhY3RvckJsb2NrLncgKiBhY3RvckJsb2NrLmg7XG4gICAgICAgIGxldCBudW1PZkVtcHR5U3BhY2VzID0gMDtcbiAgICAgICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgYWN0b3JCbG9jay53OyByb3crKykge1xuICAgICAgICAgIGZvciAobGV0IGNvbCA9IDA7IGNvbCA8IGFjdG9yQmxvY2suaDsgY29sKyspIHtcbiAgICAgICAgICAgIGxldCBjdXJDb2wgPSAoaSAlIHRoaXMuY29scykgKyByb3c7XG4gICAgICAgICAgICBsZXQgY3VyUm93ID0gTWF0aC5mbG9vcihpIC8gdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgICAgIGxldCBpbmRleCA9IChjdXJSb3cgKiB0aGlzLmNvbHMpICsgY3VyQ29sO1xuICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFtpbmRleF0gPT09IDApIHtcbiAgICAgICAgICAgICAgbnVtT2ZFbXB0eVNwYWNlcysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobnVtT2ZFbXB0eVNwYWNlcyA9PT0gbnVtT2ZTcGFjZXNOZWVkZWQpIHtcbiAgICAgICAgICBzcGF3bkxvY2F0aW9ucy5wdXNoKGkpO1xuICAgICAgICAgIHNwYXduR3JpZFtpXSA9IERFQlVHX1RJTEU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zcGF3bkdyaWQgPSBzcGF3bkdyaWQ7XG4gICAgcmV0dXJuIHNwYXduTG9jYXRpb25zO1xuICB9XG5cbiAgcmFuZG9taXplU3Bhd25zKCkge1xuICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoIShhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFjdG9yLnNwYXduUG9pbnRzID0gdGhpcy5jcmVhdGVTcGF3blBvaW50cyhhY3Rvci53aWR0aCwgYWN0b3IuaGVpZ2h0KTtcbiAgICAgIGxldCBzcGF3bkluZGV4ID0gYWN0b3Iuc3Bhd25Qb2ludHNbXG4gICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhY3Rvci5zcGF3blBvaW50cy5sZW5ndGgpXTtcbiAgICAgIGxldCBzcGF3blhZID0gdGhpcy5jYWxjR3JpZFhZKHNwYXduSW5kZXgpO1xuICAgICAgYWN0b3IuY3VyWCA9IHNwYXduWFkueDEgKyBFUFNJTE9OO1xuICAgICAgYWN0b3IuY3VyWSA9IHNwYXduWFkueTEgKyBFUFNJTE9OO1xuICAgIH0sdGhpcyk7XG4gIH1cblxuICBjYWxjR3JpZFhZKGdyaWRJbmRleCkge1xuICAgIGxldCBjdXJSb3csIGN1ckNvbCwgZ3JpZFgxLCBncmlkWDIsIGdyaWRZMSwgZ3JpZFkyO1xuICAgIGxldCByZXN1bHQgPSB7eDE6IDAsIHkxOiAwLCB4MjogMCwgeTI6IDB9O1xuICAgIGN1ckNvbCA9IGdyaWRJbmRleCAlIHRoaXMuY29scztcbiAgICBjdXJSb3cgPSBNYXRoLmZsb29yKGdyaWRJbmRleCAvIHRoaXMuY29scyk7XG4gICAgZ3JpZFgxID0gY3VyQ29sICogdGhpcy5jZWxsV2lkdGg7XG4gICAgZ3JpZFkxID0gY3VyUm93ICogdGhpcy5jZWxsSGVpZ2h0O1xuICAgIGdyaWRYMiA9IGdyaWRYMSArIHRoaXMuY2VsbFdpZHRoO1xuICAgIGdyaWRZMiA9IGdyaWRZMSArIHRoaXMuY2VsbEhlaWdodDtcbiAgICByZXN1bHQgPSB7eDE6IGdyaWRYMSwgeTE6IGdyaWRZMSwgeDI6IGdyaWRYMiwgeTI6IGdyaWRZMn07XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIExvb3BzIHRocm91Z2ggQWN0b3IgYXJyYXkgYW5kIGNyZWF0ZXMgY2FsbGFibGUgaW1hZ2VzLlxuICBsb2FkSW1hZ2VzKCkge1xuICAgIHN1cGVyLmxvYWRJbWFnZXMoQ0hBUkFDVEVSUyxcbiAgICAgIHt0aWxlczogJ2ltZy90aWxlcy5wbmcnfSk7XG4gIH1cblxuICBlYWNoQWN0b3IoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBmb3IgKGxldCBjIGluIHRoaXMuYWN0b3JzKSB7XG4gICAgICBpZiAodGhpcy5hY3RvcnMuaGFzT3duUHJvcGVydHkoYykpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmFjdG9yc1tjXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLmluaXRpYWxpemUoZWxhcHNlZFRpbWUpO1xuXG4gICAgdGhpcy5kcmF3QmFja2dyb3VuZChlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5zdGF0aWNCbG9ja3MgPSBbXTtcbiAgICB0aGlzLnN0YXRpY0dyaWQgPSBbXTtcbiAgICB0aGlzLnBoeXNpY3MgPSBuZXcgUGh5c2ljcyh0aGlzKTtcbiAgICB0aGlzLmFjdG9ycyA9IHtcbiAgICAgIC8vaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpcllcbiAgICAgIHBsYXllcjogbmV3IFBsYXllcihcbiAgICAgICAgdGhpcy5pbWFnZXMucGxheWVyLCA4NSwgNDU0LCAxMDAsIDE1MCwgMTUwLCAxLCAxKSxcbiAgICAgIGRlYXRoYm90MTogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCAyNTAsIDUwMCwgMTAwLCAxMDAsIDEwMCwgLTEsIDEpLFxuICAgICAgZGVhdGhib3QzOiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDEyMCwgMTEwLCAzMDAsIDExMCwgMTE1LCAxLCAxKSxcbiAgICAgIGRlYXRoYm90NDogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCAzMDAsIDIwMCwgMTAwLCAyMDAsIDIwMCwgLTEsIC0xKSxcbiAgICAgIGRlYXRoYm90NTogbmV3IE1vbnN0ZXIoXG4gICAgICAgIHRoaXMuaW1hZ2VzLmRlYXRoYm90LCA1MDAsIDQwMCwgMTAwLCAyMDAsIDIwMCwgMSwgMSlcbiAgICB9O1xuXG4gICAgdGhpcy5udW1PZk1vbnN0ZXJzID0gMDtcbiAgICB0aGlzLnBsYXllckRlYXRoTWV0aG9kID0gJyc7XG4gICAgdGhpcy5yb3VuZCA9IDI7XG4gICAgdGhpcy5zY29yZSA9IDA7XG5cbiAgICB0aGlzLmVhY2hBY3RvcigoYWN0b3IpID0+IHtcbiAgICAgIGlmIChhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpIHtcbiAgICAgICAgdGhpcy5udW1PZk1vbnN0ZXJzKys7XG4gICAgICB9XG4gICAgICBhY3Rvci5hY3RpdmUgPSB0cnVlO1xuICAgICAgYWN0b3IuaGVhbHRoID0gMTAwO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxpID0gdGhpcy5ncmlkLmxlbmd0aDsgbGkgPiBpOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmdyaWRbaV0pIHtcbiAgICAgICAgbGV0IGJsb2NrWFkgPSB0aGlzLmNhbGNHcmlkWFkoaSk7XG4gICAgICAgIGxldCBibG9jayA9IG5ldyBCb3goXG4gICAgICAgICAgYmxvY2tYWS54MSwgYmxvY2tYWS55MSwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCk7XG4gICAgICAgIHRoaXMuc3RhdGljQmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgICB0aGlzLnN0YXRpY0dyaWQucHVzaChibG9jayk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0YXRpY0dyaWQucHVzaChudWxsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJhbmRvbWl6ZVNwYXducygpO1xuICB9XG5cbiAgbGVhZGVyYm9hcmQoKSB7XG4gICAgbGV0IHlQb3MgPSA2MDtcbiAgICBsZXQgeFBvcyA9IDk0MDtcbiAgICAvLyBpZiAoU1MuY3VycmVudFNjb3Jlcykge1xuICAgIC8vICAgdGhpcy5kcmF3U2NvcmVzKCcqKioqKiBIaSBTY29yZXMgKioqKionLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICB5UG9zICs9IDMwO1xuICAgIC8vICAgbGV0IGxiID0gU1MuY3VycmVudFNjb3JlcztcbiAgICAvLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgICAgdGhpcy5kcmF3U2NvcmVzKGxiW2ldLm5hbWUgKyAnICAnICsgIGxiW2ldLnNjb3JlLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICAgIHlQb3MgKz0gMzA7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9XG5cbiAgZHJhdyhlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuY29udGV4dEZYLmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICBzdXBlci5kcmF3KGVsYXBzZWRUaW1lKTtcblxuICAgIHRoaXMuZHJhd1Njb3JlKCk7XG5cbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgdGhpcy5kcmF3TWVzc2FnZSgnRGVhdGhib3QgNTAwMCcsIDEyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdXQVNEIHRvIFNob290JywgMTgwKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ0Fycm93IEtleXMgdG8gTW92ZScsIDIyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBCZWdpbicsIDI2MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2RlYWQnKSB7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdUaG91IGFydCAnICsgdGhpcy5wbGF5ZXJEZWF0aE1ldGhvZCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBTdGFydCBhZ2FpbicsIDI0MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhd0JhY2tncm91bmQoZWxhcHNlZFRpbWUpIHtcbiAgICBsZXQgYmdDb2xvcjtcbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgYmdDb2xvciA9ICdQdXJwbGUnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdkZWFkJykge1xuICAgICAgYmdDb2xvciA9ICdyZWQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBiZ0NvbG9yID0gdGhpcy5maWxsU3R5bGU7XG4gICAgfVxuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9IGJnQ29sb3I7XG4gICAgdGhpcy5jb250ZXh0QkcuZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNCRy53aWR0aCwgdGhpcy5jYW52YXNCRy5oZWlnaHQpO1xuICAgIHRoaXMuZHJhd0dyaWQodGhpcy5ncmlkKTtcbiAgICBpZiAodGhpcy5kZWJ1Z01vZGUpIHtcbiAgICAgIHRoaXMuZHJhd0dyaWQodGhpcy5zcGF3bkdyaWQpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXdHcmlkKGdyaWQpIHtcbiAgICBsZXQgZ3JpZFBvc1ggPSAwLCBncmlkUG9zWSA9IDA7XG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5jb2xzOyBjb2wrKykge1xuICAgICAgICBsZXQgaW5kZXggPSAocm93ICogdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgZ3JpZFBvc1ggPSBjb2wgKiB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgZ3JpZFBvc1kgPSByb3cgKiB0aGlzLmNlbGxIZWlnaHQ7XG5cbiAgICAgICAgaWYgKGdyaWRbaW5kZXhdKSB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0QkcuZHJhd0ltYWdlKHRoaXMudGlsZXMsIGdyaWRbaW5kZXhdICpcbiAgICAgICAgICB0aGlzLmNlbGxXaWR0aCwgMCwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCxcbiAgICAgICAgICBncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkW2luZGV4XSA9PT0gREVCVUdfVElMRSkge1xuICAgICAgICAgIHRoaXMuY29udGV4dEJHLnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICAgICAgdGhpcy5jb250ZXh0Qkcuc3Ryb2tlUmVjdChncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLFxuICAgICAgICAgICAgdGhpcy5jZWxsSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRyYXdMb2FkaW5nKCkge1xuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9ICcjY2NjJztcbiAgICB0aGlzLmNvbnRleHRCRy5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc0JHLndpZHRoLCB0aGlzLmNhbnZhc0JHLmhlaWdodCk7XG4gIH1cblxuICBkcmF3TWVzc2FnZShtZXNzYWdlLCB5UG9zLCBzaXplKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB5UG9zID0geVBvcyB8fCAyMDA7XG4gICAgc2l6ZSA9IHNpemUgfHwgMjU7XG4gICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzaXplICsgJ3B4IFZlcmRhbmEnO1xuICAgIGxldCBtZXRyaWNzID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KG1lc3NhZ2UpO1xuICAgIGxldCB3aWR0aCA9IG1ldHJpY3Mud2lkdGg7XG4gICAgbGV0IG1lc3NhZ2VYID0gcG9zIC0gd2lkdGggLyAyO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChtZXNzYWdlLCBtZXNzYWdlWCwgeVBvcyk7XG4gIH1cblxuIGRyYXdTY29yZXMobWVzc2FnZSwgeVBvcywgeFBvcywgc2l6ZSkge1xuICAgIGxldCBwb3MgPSB0aGlzLmNhbnZhcy53aWR0aCAvIDI7XG4gICAgeVBvcyA9IHlQb3MgfHwgMjAwO1xuICAgIHNpemUgPSBzaXplIHx8IDI1O1xuICAgIHRoaXMuY29udGV4dC5mb250ID0gc2l6ZSArICdweCBWZXJkYW5hJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQobWVzc2FnZSwgeFBvcywgeVBvcyk7XG4gIH1cblxuICBkcmF3U2NvcmUoKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB0aGlzLmNvbnRleHQuZm9udCA9ICcyNXB4IFZlcmRhbmEnO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIGxldCBzY29yZVRleHQgPSAnR0FNRTogJyArIHRoaXMuc2NvcmU7XG4gICAgbGV0IG1ldHJpY3MgPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoc2NvcmVUZXh0KTtcbiAgICBsZXQgd2lkdGggPSBtZXRyaWNzLndpZHRoO1xuICAgIGxldCBzY29yZVggPSBwb3MgLSAod2lkdGggLyAyKTtcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQoc2NvcmVUZXh0LCBzY29yZVgsIDI1KTtcbiAgfVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShlbGFwc2VkVGltZSk7XG5cbiAgICBpZiAodGhpcy5rZXlEb3duLnN0YXJ0ICYmIHRoaXMuZ2FtZVN0YXRlICE9PSAncGxheScpIHtcbiAgICAgIHRoaXMuZ2FtZVN0YXRlID0gJ3BsYXknO1xuICAgICAgY29uc29sZS5sb2coJ0dhbWUgU3RhcnQnKTtcbiAgICAgIHRoaXMucmFuZG9taXplU3Bhd25zKCk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubnVtT2ZNb25zdGVycyA9PT0gMCAmJiB0aGlzLmluaXRpYWxpemVkKSB7IC8vIFlvdSBiZWF0IGFsbCBtb25zdGVyc1xuICAgICAgdGhpcy5yYW5kb21pemVTcGF3bnMoKTtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VUaW1lID4gMCkgeyAvLyBzaG93IG5leHQgcm91bmQgbWVzc2FnZVxuICAgICAgICB0aGlzLmRyYXdNZXNzYWdlKCdSb3VuZCAnICsgdGhpcy5yb3VuZCk7XG4gICAgICAgIHRoaXMubWVzc2FnZVRpbWUgLT0gZWxhcHNlZFRpbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VUaW1lID0gMTA7XG4gICAgICAgIHRoaXMucm91bmQrKztcbiAgICAgICAgLy8gUmV2aXZpbmcgbW9uc3RlcnMsIHRoaXMgd2lsbCBiZSByZWZhY3RvcmVkIGxhdGVyIHRvIHJhbmRvbWl6ZVxuICAgICAgICAvLyBwb3NpdGlvbnMgcmF0aGVyIHRoYW4ganVzdCByZWFjdGl2YXRpbmcgdGhlIGRlYWQgb25lcyB3aGVyZSB0aGV5XG4gICAgICAgIC8vIGZlbGwuXG4gICAgICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICAgICAgaWYgKGFjdG9yIGluc3RhbmNlb2YgTW9uc3Rlcikge1xuICAgICAgICAgICAgdGhpcy5udW1PZk1vbnN0ZXJzKys7XG4gICAgICAgICAgICBhY3Rvci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgYWN0b3IuYWxwaGEgPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtBY3RvciwgUGh5c2ljcywgUG9pbnQsIERpcmVjdGlvbnN9IGZyb20gJy4vYmVyemVyayc7XG5pbXBvcnQge1BsYXllcn0gZnJvbSAnLi9wbGF5ZXInO1xuaW1wb3J0IHtCdWxsZXR9IGZyb20gJy4vYnVsbGV0JztcblxuZXhwb3J0IGNsYXNzIE1vbnN0ZXIgZXh0ZW5kcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgLy8gc3VwZXIoaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgpO1xuICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgdGhpcy5kaXJUaW1lciA9IDA7XG4gICAgdGhpcy5pc0ZpcmluZyA9IGZhbHNlO1xuICAgIHRoaXMubGFzZXJEZWx0YSA9IHt9O1xuICAgIHRoaXMubGFzZXJSYW5nZSA9IDEyMDA7XG4gICAgdGhpcy5sYXNlclN0YXJ0ID0ge307XG4gICAgdGhpcy5leWVPZmZzZXQgPSB7eDogMCwgeTogMTR9O1xuICAgIHRoaXMuaGVhZExhbXBBY3RpdmUgPSB0cnVlO1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgICAgc3VwZXIuZHJhdyhnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgICBpZiAoZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZvbnQgPSAnMTZweCBWZXJkYW5hJztcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZWQnO1xuICAgICAgICBnYW1lLmNvbnRleHQuZmlsbFRleHQoJ01vbnN0ZXInLFxuICAgICAgICAgIHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gNCksXG4gICAgICAgICAgdGhpcy5jdXJZIC0gMTApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5hbHBoYSA+PSAwLjEpIHtcbiAgICAgIHRoaXMuYWxwaGEgLT0gMC4xO1xuICAgICAgZ2FtZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gdGhpcy5hbHBoYTtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgICAgZ2FtZS5jb250ZXh0Lmdsb2JhbEFscGhhID0gMTtcbiAgICB9XG4gIH1cblxuICBmaXJlTGFzZXIoZ2FtZSwgcGxheWVyKSB7XG4gICAgbGV0IGxhc2VyRW5kcG9pbnQgPSB7XG4gICAgICB4OiB0aGlzLmxhc2VyU3RhcnQueCArIHRoaXMubGFzZXJEZWx0YS54LFxuICAgICAgeTogdGhpcy5sYXNlclN0YXJ0LnkgKyB0aGlzLmxhc2VyRGVsdGEueVxuICAgIH07XG4gICAgbGV0IHRhcmdldCA9IFtdO1xuICAgIGxldCB0YXJnZXRPYmogPSB7fTtcbiAgICB0YXJnZXRPYmoueCA9IHBsYXllci5jdXJYICsgNTtcbiAgICB0YXJnZXRPYmoueSA9IHBsYXllci5jdXJZO1xuICAgIHRhcmdldE9iai53ID0gMTU7XG4gICAgdGFyZ2V0T2JqLmggPSAgMTU7XG4gICAgdGFyZ2V0LnB1c2godGFyZ2V0T2JqKTtcbiAgICBsZXQgdGFyZ2V0RGVsdGEgPSBnYW1lLnBoeXNpY3MuZ2V0RGVsdGEoXG4gICAgICB0aGlzLmxhc2VyU3RhcnQueCwgdGhpcy5sYXNlclN0YXJ0LnksIHRhcmdldE9iai54LCB0YXJnZXRPYmoueSk7XG4gICAgdGhpcy5maXJpbmcgPSB0cnVlO1xuICAgIHRoaXMubW92aW5nID0gZmFsc2U7XG5cbiAgICBsZXQgYmxvY2tSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgIHRoaXMubGFzZXJTdGFydCwgdGhpcy5sYXNlckRlbHRhLCBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgbGV0IHRhcmdldFJlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgdGhpcy5sYXNlclN0YXJ0LCB0aGlzLmxhc2VyRGVsdGEsIHRhcmdldCk7XG5cbiAgICBsZXQgZW5kUG9zOyBsZXQgdGFyZ2V0SGl0O1xuICAgIGlmICgoYmxvY2tSZXN1bHQgJiYgYmxvY2tSZXN1bHQuaGl0KSAmJlxuICAgICAgICAodGFyZ2V0UmVzdWx0ICYmIHRhcmdldFJlc3VsdC5oaXQpKSB7XG4gICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLmNoZWNrTmVhcmVzdEhpdCh0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxvY2tSZXN1bHQsIHRhcmdldFJlc3VsdCk7XG4gICAgICBlbmRQb3MgPSByZXN1bHQuZW5kUG9zO1xuICAgICAgdGFyZ2V0SGl0ID0gcmVzdWx0LnRhcmdldEhpdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGJsb2NrUmVzdWx0ICYmIGJsb2NrUmVzdWx0LmhpdCkge1xuICAgICAgICAvLyB1cGRhdGUgZW5kIHBvcyB3aXRoIGhpdCBwb3NcbiAgICAgICAgZW5kUG9zID0gbmV3IFBvaW50KGJsb2NrUmVzdWx0LmhpdFBvcy54LFxuICAgICAgICAgIGJsb2NrUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldFJlc3VsdCAmJiB0YXJnZXRSZXN1bHQuaGl0KSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQb2ludCh0YXJnZXRSZXN1bHQuaGl0UG9zLngsXG4gICAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgdGFyZ2V0SGl0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQb2ludChsYXNlckVuZHBvaW50LngsIGxhc2VyRW5kcG9pbnQueSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGRlZ1RvRW5kcG9zID0gZ2FtZS5waHlzaWNzLmdldFRhcmdldERlZ3JlZSh0aGlzLmxhc2VyRGVsdGEpO1xuICAgIGxldCBkZWdUb1RhcmdldCA9IGdhbWUucGh5c2ljcy5nZXRUYXJnZXREZWdyZWUodGFyZ2V0RGVsdGEpO1xuXG4gICAgZ2FtZS5jb250ZXh0RlguYmVnaW5QYXRoKCk7XG4gICAgZ2FtZS5jb250ZXh0RlgubW92ZVRvKHRoaXMubGFzZXJTdGFydC54LCB0aGlzLmxhc2VyU3RhcnQueSk7XG4gICAgZ2FtZS5jb250ZXh0RlgubGluZVRvKGVuZFBvcy54LCBlbmRQb3MueSk7XG4gICAgZ2FtZS5jb250ZXh0RlguY2xvc2VQYXRoKCk7XG4gICAgZ2FtZS5jb250ZXh0Rlguc3Ryb2tlU3R5bGUgPSB0YXJnZXRSZXN1bHQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0ID8gJ3JlZCcgOiAnYmx1ZSc7XG4gICAgZ2FtZS5jb250ZXh0Rlguc3Ryb2tlKCk7XG5cbiAgICBpZiAoIXRhcmdldEhpdCkge1xuICAgICAgbGV0IG5ld0RlZ3JlZTtcbiAgICAgIGlmICh0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgaWYgKGRlZ1RvRW5kcG9zIDwgMTgwKSB7XG4gICAgICAgICAgZGVnVG9FbmRwb3MgKz0gMzYwO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWdUb1RhcmdldCA8IDE4MCkge1xuICAgICAgICAgIGRlZ1RvVGFyZ2V0ICs9IDM2MDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGRlZ1RvRW5kcG9zID4gZGVnVG9UYXJnZXQpIHtcbiAgICAgICAgaWYgKGRlZ1RvRW5kcG9zIC0gZGVnVG9UYXJnZXQgPiA2KSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgLSAzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0RlZ3JlZSA9IGRlZ1RvRW5kcG9zIC0gMC41O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5kZWdUb1BvcyhuZXdEZWdyZWUsIHRoaXMubGFzZXJSYW5nZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZGVnVG9UYXJnZXQgLSBkZWdUb0VuZHBvcyA+IDYpIHtcbiAgICAgICAgICBuZXdEZWdyZWUgPSBkZWdUb0VuZHBvcyArIDM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgKyAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXNlckRlbHRhID0gZ2FtZS5waHlzaWNzLmRlZ1RvUG9zKG5ld0RlZ3JlZSwgdGhpcy5sYXNlclJhbmdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgICBwbGF5ZXIucmVjb3ZlcnlUaW1lciA9IDA7XG4gICAgICAgIHBsYXllci5oZWFsdGggLT0gMjtcbiAgICAgICAgZ2FtZS5wbGF5ZXJEZWF0aE1ldGhvZCA9ICdibGluZCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgc3VwZXIudXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICB0aGlzLmxhc2VyU3RhcnQgPSB7XG4gICAgICB4OiB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpLFxuICAgICAgeTogdGhpcy5jdXJZICsgMTRcbiAgICB9O1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdyZWQnO1xuICAgIHRoaXMuZGlyVGltZXIgLT0gZWxhcHNlZFRpbWU7XG4gICAgaWYgKHRoaXMuZGlyVGltZXIgPD0gMCAmJiAhdGhpcy5maXJpbmcpIHtcbiAgICAgIHRoaXMubW92aW5nID0gQm9vbGVhbihnYW1lLmdldFJhbmRvbSgwLCAxKSk7XG4gICAgICB0aGlzLmRpclRpbWVyID0gZ2FtZS5nZXRSYW5kb20oMiwgNCk7XG4gICAgICBsZXQgbmV4dERpcmVjdGlvbiA9IGdhbWUuZ2V0UmFuZG9tKDAsIDMpO1xuICAgICAgdGhpcy5kaXJYID0gRGlyZWN0aW9ucy5kaXJlY3Rpb25zW25leHREaXJlY3Rpb25dLng7XG4gICAgICB0aGlzLmRpclkgPSBEaXJlY3Rpb25zLmRpcmVjdGlvbnNbbmV4dERpcmVjdGlvbl0ueTtcbiAgICB9XG4gICAgdGhpcy52aXNpYmxlQWN0b3JzID0gMDtcbiAgICB0aGlzLmVhY2hWaXNpYmxlQWN0b3IoZ2FtZSwgUGxheWVyLCBmdW5jdGlvbihwbGF5ZXIpIHtcbiAgICAgIHRoaXMudmlzaWJsZUFjdG9ycyArPSAxO1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3doaXRlJztcblxuICAgICAgaWYgKCF0aGlzLmZpcmluZykgeyAvLyBzZXQgdGhlIGluaXRpYWwgc3RhcnRpbmcgcG9pbnQgZm9yIHRoZSBsYXNlclxuICAgICAgICBsZXQgbGFzZXJFbmRwb2ludDtcbiAgICAgICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICAgICAgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgICAgICAgIHg6ICh0aGlzLmxhc2VyU3RhcnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgeTogdGhpcy5sYXNlclN0YXJ0LnlcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGlyWSA9PT0gLTEgfHwgdGhpcy5kaXJZID09PSAxKSB7XG4gICAgICAgICAgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgICAgICAgIHg6IHRoaXMubGFzZXJTdGFydC54LFxuICAgICAgICAgICAgeTogKHRoaXMubGFzZXJTdGFydC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcllcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShcbiAgICAgICAgICBsYXNlckVuZHBvaW50LngsIGxhc2VyRW5kcG9pbnQueSwgdGhpcy5sYXNlclN0YXJ0LngsXG4gICAgICAgICAgdGhpcy5sYXNlclN0YXJ0LnkpO1xuICAgICAgfVxuICAgICAgdGhpcy5maXJlTGFzZXIoZ2FtZSwgcGxheWVyKTtcbiAgICB9KTtcblxuICAgIGlmICh0aGlzLnZpc2libGVBY3RvcnMgPT09IDApIHtcbiAgICAgIHRoaXMubGFzZXJFbmRwb2ludCA9IG51bGw7XG4gICAgICB0aGlzLmZpcmluZyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMuZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgQnVsbGV0LCBmdW5jdGlvbihidWxsZXQpIHtcbiAgICAgIGJ1bGxldC5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICdncmVlbic7XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgZ2FtZS5udW1PZk1vbnN0ZXJzLS07XG4gICAgICBnYW1lLnNjb3JlKys7XG4gICAgfSk7XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuLypnbG9iYWxzIFNTOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCAqIGFzIGRlYXRoYm90IGZyb20gJy4vZGVhdGhib3QnO1xuaW1wb3J0IHtBY3RvciwgUGh5c2ljcywgQm94LCBQb2ludCwgTEVWRUxTfSBmcm9tICcuL2JlcnplcmsnO1xuaW1wb3J0IHtCdWxsZXR9IGZyb20gJy4vYnVsbGV0JztcblxuZXhwb3J0IGNsYXNzIFBsYXllciBleHRlbmRzIEFjdG9ye1xuICBjb25zdHJ1Y3RvcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCwgZGlyWSkge1xuICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgdGhpcy5oZWFsdGggPSAxMDA7XG4gICAgdGhpcy5yZWNvdmVyeVRpbWVyID0gMjtcbiAgICB0aGlzLmV5ZU9mZnNldCA9IHt4OiAwLCB5OiAxMH07XG4gICAgdGhpcy5oZWFkTGFtcEFjdGl2ZSA9IHRydWU7XG4gIH1cblxuICBkcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKGdhbWUuZ2FtZVN0YXRlICE9PSAnYXR0cmFjdCcpIHtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWxsZXQpIHtcbiAgICAgIHRoaXMuYnVsbGV0LmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIH1cbiAgICAvLyBsZXQgaGVhbHRoVmlzID0gKCgxMDAgLSB0aGlzLmhlYWx0aCkgLyAxMDApO1xuICAgIC8vIGdhbWUuY29udGV4dC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwnICsgaGVhbHRoVmlzICsgJyknO1xuICAgIC8vIGdhbWUuY29udGV4dC5maWxsUmVjdCgwLCAwLCBnYW1lLmNhbnZhcy53aWR0aCwgZ2FtZS5jYW52YXMuaGVpZ2h0KTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgZ2FtZS5nYW1lU3RhdGUgPSAnZGVhZCc7XG4gICAgICBjb25zb2xlLmxvZygnREVBRCEnKTtcbiAgICAgIGlmICh0aGlzLmJ1bGxldCAmJiB0aGlzLmJ1bGxldC5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5idWxsZXQgPSBudWxsO1xuICAgICAgICBkZWxldGUgZ2FtZS5hY3RvcnMucGxheWVyQnVsbGV0O1xuICAgICAgfVxuICAgICAgLy8gbGV0IGxvd2VzdFNjb3JlID0gU1MuY3VycmVudFNjb3JlcyAmJiBTUy5jdXJyZW50U2NvcmVzLmxlbmd0aCA/XG4gICAgICAvLyAgIFNTLmN1cnJlbnRTY29yZXNbU1MuY3VycmVudFNjb3Jlcy5sZW5ndGggLSAxXS5zY29yZSA6IDA7XG4gICAgICAvLyBpZiAoZ2FtZS5zY29yZSA+IGxvd2VzdFNjb3JlKSB7XG4gICAgICAvLyAgIGxldCBwbGF5ZXJOYW1lID0gcHJvbXB0KCdQbGVhc2UgRW50ZXIgeW91ciBOYW1lLicpO1xuICAgICAgLy8gICBTUy5zdWJtaXRTY29yZShwbGF5ZXJOYW1lLCBnYW1lLnNjb3JlKTtcbiAgICAgIC8vICAgZGVhdGhib3Quc2NvcmVzID0gU1MuZ2V0U2NvcmVzKDgpO1xuICAgICAgLy8gfVxuICAgIH1cblxuICAgIGlmIChnYW1lLmdhbWVTdGF0ZSA9PT0gJ2F0dHJhY3QnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBkaXJYID0gMDtcbiAgICBsZXQgZGlyWSA9IDA7XG4gICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ2JsdWUnO1xuXG4gICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICdibGFjayc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhbHRoIDwgMTAwKSB7XG4gICAgICBpZiAodGhpcy5yZWNvdmVyeVRpbWVyID4gMSkge1xuICAgICAgICB0aGlzLmhlYWx0aCArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZWNvdmVyeVRpbWVyICs9IGVsYXBzZWRUaW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChnYW1lLmtleURvd24udXApIHtcbiAgICAgIGRpclkgPSAtMTtcbiAgICAgIHRoaXMuZGlyWCA9IDA7XG4gICAgICB0aGlzLmRpclkgPSBkaXJZO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5rZXlEb3duLmRvd24pIHtcbiAgICAgIGRpclkgPSAxO1xuICAgICAgdGhpcy5kaXJYID0gMDtcbiAgICAgIHRoaXMuZGlyWSA9IGRpclk7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24ubGVmdCkge1xuICAgICAgZGlyWCA9IC0xO1xuICAgICAgdGhpcy5kaXJZID0gMDtcbiAgICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24ucmlnaHQpIHtcbiAgICAgIGRpclggPSAxO1xuICAgICAgdGhpcy5kaXJZID0gMDtcbiAgICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgfVxuICAgIGlmICh0aGlzLmJ1bGxldCkge1xuICAgICAgLy8gY2hlY2sgd2hldGhlciBidWxsZXQgaXMgc3RpbGwgYWN0aXZlXG4gICAgICBpZiAoIXRoaXMuYnVsbGV0LmFjdGl2ZSkge1xuICAgICAgICB0aGlzLmJ1bGxldCA9IG51bGw7XG4gICAgICAgIGRlbGV0ZSBnYW1lLmFjdG9ycy5wbGF5ZXJCdWxsZXQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RVcCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMCwgLTEpO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdERvd24pIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIDAsIDEpO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdExlZnQpIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIC0xLCAwKTtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RSaWdodCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMSwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRpclggPT09IC0xICYmIHRoaXMuZmFjaW5nICE9PSAnbGVmdCcpIHtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSB0aGlzLmltYWdlLnJldjtcbiAgICAgIHRoaXMuZmFjaW5nID0gJ2xlZnQnO1xuICAgIH1cblxuICAgIGlmIChkaXJYID09PSAxICYmIHRoaXMuZmFjaW5nICE9PSAncmlnaHQnKSB7XG4gICAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5pbWFnZTtcbiAgICAgIHRoaXMuZmFjaW5nID0gJ3JpZ2h0JztcbiAgICB9XG5cbiAgICBsZXQgbW92aW5nQm94ID0gbmV3IEJveCh0aGlzLmN1clgsIHRoaXMuY3VyWSwgdGhpcy53aWR0aCxcbiAgICAgIHRoaXMuaGVpZ2h0KTtcbiAgICBsZXQgc2VnbWVudERlbHRhID0ge1xuICAgICAgeDogKHRoaXMuc3BlZWRYICogZWxhcHNlZFRpbWUpICogZGlyWCxcbiAgICAgIHk6ICh0aGlzLnNwZWVkWSAqIGVsYXBzZWRUaW1lKSAqIGRpcllcbiAgICB9O1xuICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3Muc3dlZXBCb3hJbnRvQm94ZXMobW92aW5nQm94LCBzZWdtZW50RGVsdGEsXG4gICAgICBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaGl0KSB7XG4gICAgICB0aGlzLmN1clggPSByZXN1bHQuaGl0UG9zLnggLSAodGhpcy53aWR0aCAvIDIpO1xuICAgICAgdGhpcy5jdXJZID0gcmVzdWx0LmhpdFBvcy55IC0gKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY3VyWCArPSBzZWdtZW50RGVsdGEueDtcbiAgICAgIHRoaXMuY3VyWSArPSBzZWdtZW50RGVsdGEueTtcbiAgICB9XG5cbiAgICBpZiAoKHRoaXMuY3VyWCArIHRoaXMud2lkdGgpID4gZ2FtZS5jYW52YXMud2lkdGgpIHtcbiAgICAgIGxldCB4Q2xpcCA9ICh0aGlzLmN1clggKyB0aGlzLndpZHRoKSAtIGdhbWUuY2FudmFzLndpZHRoIC0gdGhpcy53aWR0aDtcbiAgICAgIGlmICh0aGlzLmRpclggPT09IDEpIHtcbiAgICAgICAgdGhpcy5jdXJYID0geENsaXA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmN1clggPCAwKSB7XG4gICAgICBpZiAodGhpcy5kaXJYID09PSAtMSkge1xuICAgICAgICB0aGlzLmN1clggPSB0aGlzLmN1clggKyBnYW1lLmNhbnZhcy53aWR0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgPiBnYW1lLmNhbnZhcy5oZWlnaHQpIHtcbiAgICAgIGxldCB5Q2xpcCA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLSBnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodDtcbiAgICAgIGlmICh0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgdGhpcy5jdXJZID0geUNsaXA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICBpZiAodGhpcy5kaXJZID09PSAtMSkge1xuICAgICAgICB0aGlzLmN1clkgPSB0aGlzLmN1clkgKyBnYW1lLmNhbnZhcy5oZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5lYWNoT3ZlcmxhcHBpbmdBY3RvcihnYW1lLCBkZWF0aGJvdC5Nb25zdGVyLCBmdW5jdGlvbihhY3Rvcikge1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3doaXRlJztcbiAgICAgIGlmICghZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgdGhpcy5oZWFsdGggLT0gMjA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5oZWFsdGggPD0gMCkge1xuICAgICAgICBnYW1lLnBsYXllckRlYXRoTWV0aG9kID0gJ2RlYWQnO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5jdXJYLCB0aGlzLmN1clkpO1xuICAgIC8vIHRoaXMuaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICB9XG5cbiAgLy8gc3RhcnRYLCBzdGFydFksIHNwZWVkLCBkaXJYLCBkaXJZXG4gIGZpcmVCdWxsZXQoZ2FtZSwgZGlyWCwgZGlyWSkge1xuICAgIHRoaXMuYnVsbGV0ID0gbmV3IEJ1bGxldCh0aGlzLmN1clgsIHRoaXMuY3VyWSArIDIwLCA2MDAsIGRpclgsIGRpclkpO1xuICAgIGdhbWUuYWN0b3JzLnBsYXllckJ1bGxldCA9IHRoaXMuYnVsbGV0O1xuICB9XG59XG4iXX0=
