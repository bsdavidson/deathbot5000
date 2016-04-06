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
      var cellSize = game.cellWidth;
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

      game.contextFPS.fillStyle = '#000000';
      game.contextFPS.fillRect(0, game.canvasFPS.height / 2, game.canvasFPS.width, game.canvasFPS.height / 2);

      var pointArray = [];
      var startingPoint = {};
      var degreeToCurEndPoint = void 0;
      var sweepAngle = 60;
      var resolution = 320;
      var projectionDistance = game.canvasFPS.width / 2 * Math.tan(sweepAngle * _physics.DEG_TO_RAD);
      var gridSize = { w: 28, h: 28 };
      var cellSize = game.cellWidth;
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
        var distanceColor = Math.floor(200 * (1.0 - distanceAlpha));
        // game.contextFPS.fillStyle = `rgba(0, 0, 0, ${distanceAlpha})`;
        game.contextFPS.fillStyle = 'rgb(' + distanceColor + ',\n                                   ' + distanceColor + ',\n                                   ' + distanceColor + ')';
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
    _this.headLampAngle = 362;
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
  h: 28
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
    _this.headLampAngle = 362;
    _this.headLampPower = 280;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9iZXJ6ZXJrL2FjdG9yLmpzIiwianMvYmVyemVyay9nYW1lLmpzIiwianMvYmVyemVyay9pbmRleC5qcyIsImpzL2Jlcnplcmsva2V5cy5qcyIsImpzL2JlcnplcmsvcGh5c2ljcy5qcyIsImpzL2J1bGxldC5qcyIsImpzL2RlYXRoYm90LmpzIiwianMvZ2FtZS5qcyIsImpzL21vbnN0ZXIuanMiLCJqcy9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ0E7Ozs7Ozs7OztBQUVBOzs7O0FBRU8sSUFBSSxrQ0FBYTtBQUN0QixNQUFJLENBQUo7QUFDQSxRQUFNLENBQU47QUFDQSxRQUFNLENBQU47QUFDQSxTQUFPLENBQVA7QUFDQSxjQUFZLENBQ1YsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUMsQ0FBRCxFQURBLEVBRVYsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFGRyxFQUdWLEVBQUMsR0FBRyxDQUFDLENBQUQsRUFBSSxHQUFHLENBQUgsRUFIRSxFQUlWLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBSkcsQ0FBWjtBQUtBLFNBQVEsQ0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLE1BQWYsRUFBdUIsT0FBdkIsQ0FBUjtBQUNBLDhCQUFTLE1BQU0sTUFBTTtBQUNuQixRQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ1osYUFBTyxLQUFLLEtBQUwsQ0FESztLQUFkLE1BRU8sSUFBSSxPQUFPLENBQVAsRUFBVTtBQUNuQixhQUFPLEtBQUssSUFBTCxDQURZO0tBQWQsTUFFQSxJQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ25CLGFBQU8sS0FBSyxJQUFMLENBRFk7S0FBZCxNQUVBLElBQUksT0FBTyxDQUFQLEVBQVU7QUFDbkIsYUFBTyxLQUFLLEVBQUwsQ0FEWTtLQUFkLE1BRUE7QUFDTCxhQUFPLEtBQUssS0FBTCxDQURGO0tBRkE7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QUFxQixLQUFLLE1BQUwsQ0FEWDtBQUVsRCxZQUFJLEtBQUssSUFBTCxLQUFjLENBQWQsRUFBaUI7QUFDbkIsZUFBSyxJQUFMLEdBQVksS0FBWixDQURtQjtTQUFyQjtPQUZGO0FBTUEsVUFBSSxLQUFLLElBQUwsR0FBWSxDQUFaLEVBQWU7QUFDakIsWUFBSSxLQUFLLElBQUwsS0FBYyxDQUFDLENBQUQsRUFBSTtBQUNwQixlQUFLLElBQUwsR0FBWSxLQUFLLElBQUwsR0FBWSxLQUFLLE1BQUwsQ0FBWSxNQUFaLENBREo7U0FBdEI7T0FERjs7QUFNQSxXQUFLLG9CQUFMLENBQTBCLElBQTFCLEVBQWdDLFNBQVMsT0FBVCxFQUFrQixVQUFTLEtBQVQsRUFBZ0I7QUFDaEUsYUFBSyxVQUFMLEdBQWtCLE9BQWxCLENBRGdFO0FBRWhFLFlBQUksQ0FBQyxLQUFLLFNBQUwsRUFBZ0I7QUFDbkIsZUFBSyxNQUFMLElBQWUsRUFBZixDQURtQjtTQUFyQjtBQUdBLFlBQUksS0FBSyxNQUFMLElBQWUsQ0FBZixFQUFrQjtBQUNwQixlQUFLLGlCQUFMLEdBQXlCLE1BQXpCLENBRG9CO1NBQXRCO09BTGdELENBQWxEOzs7O0FBL0h3Qjs7Ozs7K0JBNklmLE1BQU0sTUFBTSxNQUFNO0FBQzNCLFdBQUssTUFBTCxHQUFjLG1CQUFXLEtBQUssSUFBTCxFQUFXLEtBQUssSUFBTCxHQUFZLEVBQVosRUFBZ0IsR0FBdEMsRUFBMkMsSUFBM0MsRUFBaUQsSUFBakQsQ0FBZCxDQUQyQjtBQUUzQixXQUFLLE1BQUwsQ0FBWSxZQUFaLEdBQTJCLEtBQUssTUFBTCxDQUZBOzs7O1NBcktsQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQaHlzaWNzLCBCb3gsIFBvaW50LCBFUFNJTE9OLCBERUdfVE9fUkFEfSBmcm9tICcuL3BoeXNpY3MnO1xuXG5leHBvcnQgdmFyIERpcmVjdGlvbnMgPSB7XG4gIFVQOiAwLFxuICBET1dOOiAxLFxuICBMRUZUOiAyLFxuICBSSUdIVDogMyxcbiAgZGlyZWN0aW9uczogW1xuICAgIHt4OiAwLCB5OiAtMX0sXG4gICAge3g6IDAsIHk6IDF9LFxuICAgIHt4OiAtMSwgeTogMH0sXG4gICAge3g6IDEsIHk6IDB9XSxcbiAgbmFtZXM6ICBbJ3VwJywgJ2Rvd24nLCAnbGVmdCcsICdyaWdodCddLFxuICBnZXRJbmRleChkaXJYLCBkaXJZKSB7XG4gICAgaWYgKGRpclggPiAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5SSUdIVDtcbiAgICB9IGVsc2UgaWYgKGRpclggPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5MRUZUO1xuICAgIH0gZWxzZSBpZiAoZGlyWSA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLkRPV047XG4gICAgfSBlbHNlIGlmIChkaXJZIDwgMCkge1xuICAgICAgcmV0dXJuIHRoaXMuVVA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLlJJR0hUO1xuICAgIH1cbiAgfSxcbiAgZ2V0TmFtZShkaXJYLCBkaXJZKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZXNbdGhpcy5nZXRJbmRleChkaXJYLCBkaXJZKV07XG4gIH1cbn07XG5cbmV4cG9ydCBjbGFzcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgbGV0IHVuc2NhbGVkV2lkdGgsIHVuc2NhbGVkSGVpZ2h0O1xuICAgIGlmIChpbWFnZSkge1xuICAgICAgdGhpcy5pbWFnZSA9IGltYWdlO1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IHRoaXMuaW1hZ2U7XG4gICAgICB0aGlzLmRpckltYWdlcyA9IHtcbiAgICAgICAgcmlnaHQ6IGltYWdlLFxuICAgICAgICBsZWZ0OiBpbWFnZS5yZXYsXG4gICAgICAgIHVwOiBpbWFnZS51cCxcbiAgICAgICAgZG93bjogaW1hZ2UuZG93blxuICAgICAgfTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGlySW1hZ2VzKTtcbiAgICAgIHVuc2NhbGVkV2lkdGggPSBpbWFnZS53O1xuICAgICAgdW5zY2FsZWRIZWlnaHQgPSBpbWFnZS5oO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmltYWdlID0gbnVsbDtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSBudWxsO1xuICAgICAgdGhpcy5kaXJJbWFnZXMgPSB7XG4gICAgICAgIHJpZ2h0OiBudWxsLFxuICAgICAgICBsZWZ0OiBudWxsLFxuICAgICAgICB1cDogbnVsbCxcbiAgICAgICAgZG93bjogbnVsbFxuICAgICAgfTtcbiAgICAgIHVuc2NhbGVkV2lkdGggPSAxO1xuICAgICAgdW5zY2FsZWRIZWlnaHQgPSAxO1xuICAgIH1cblxuICAgIHRoaXMucHJldmlvdXNEaXIgPSB7eDogdGhpcy5kaXJYLCB5OiB0aGlzLmRpcll9O1xuICAgIHRoaXMuc3RhcnRYID0gc3RhcnRYO1xuICAgIHRoaXMuc3RhcnRZID0gc3RhcnRZO1xuXG4gICAgdGhpcy5mYWNpbmcgPSAncmlnaHQnO1xuICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgdGhpcy5kaXJZID0gZGlyWTtcbiAgICB0aGlzLndpZHRoID0gdW5zY2FsZWRXaWR0aCAqIChzY2FsZSAvIDEwMCk7XG4gICAgdGhpcy5oZWlnaHQgPSB1bnNjYWxlZEhlaWdodCAqIChzY2FsZSAvIDEwMCk7XG4gICAgdGhpcy5jdXJYID0gc3RhcnRYO1xuICAgIHRoaXMuY3VyWSA9IHN0YXJ0WTtcbiAgICB0aGlzLnByZXZpb3VzUG9zID0ge3g6IHRoaXMuY3VyWCwgeTogdGhpcy5jdXJZfTtcbiAgICB0aGlzLnRpbGVzSW5GT1YgPSBbXTtcbiAgICB0aGlzLnNwZWVkWCA9IHNwZWVkWDtcbiAgICB0aGlzLnNwZWVkWSA9IHNwZWVkWTtcbiAgICB0aGlzLm1vdmluZyA9IHRydWU7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuYWxwaGEgPSAxO1xuICAgIHRoaXMuZGVidWdDb2xvciA9ICdyZWQnO1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMubGFzZXJEZWx0YSA9IHt9O1xuICAgIHRoaXMubGFzZXJSYW5nZSA9IDk0MDA7XG4gICAgdGhpcy5sYXNlclN0YXJ0ID0ge307XG4gIH1cblxuICBjb2xsaWRlc1dpdGhXYWxscyhnYW1lKSB7XG4gICAgbGV0IHJlc3VsdCA9IHtoaXQ6IGZhbHNlLCBkaXJYOiAwLCBkaXJZOiAwfTtcbiAgICAvLyBIaXQgdGhlIExlZnQgV2FsbFxuICAgIGlmICh0aGlzLmN1clggPCAwKSB7XG4gICAgICB0aGlzLmN1clggPSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWDogMX07XG4gICAgfVxuICAgIC8vIEhpdCByaWdodCB3YWxsXG4gICAgaWYgKHRoaXMuY3VyWCA+IChnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGgpKSB7XG4gICAgICB0aGlzLmN1clggPSAoZ2FtZS5jYW52YXMud2lkdGggLSB0aGlzLndpZHRoKSAtIEVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJYOiAtMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgQ2VpbGluZ1xuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICB0aGlzLmN1clkgPSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWTogMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgRmxvb3JcbiAgICBpZiAodGhpcy5jdXJZID4gZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQpIHtcbiAgICAgIHRoaXMuY3VyWSA9IChnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodCkgLSBFUFNJTE9OO1xuICAgICAgcmVzdWx0ID0ge2hpdDogdHJ1ZSwgZGlyWTogLTF9O1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgYWN0b3JDb25zdHJ1Y3RvciwgY2FsbGJhY2spIHtcbiAgICBnYW1lLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKCEoYWN0b3IgaW5zdGFuY2VvZiBhY3RvckNvbnN0cnVjdG9yKSB8fCAhYWN0b3IuYWN0aXZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCBvdmVybGFwcGluZyA9ICEoXG4gICAgICAgIHRoaXMuY3VyWCA+IGFjdG9yLmN1clggKyBhY3Rvci53aWR0aCB8fFxuICAgICAgICB0aGlzLmN1clggKyB0aGlzLndpZHRoIDwgYWN0b3IuY3VyWCB8fFxuICAgICAgICB0aGlzLmN1clkgKyB0aGlzLmhlaWdodCA8IGFjdG9yLmN1clkgfHxcbiAgICAgICAgdGhpcy5jdXJZID4gYWN0b3IuY3VyWSArIGFjdG9yLmhlaWdodFxuICAgICAgKTtcbiAgICAgIGlmIChvdmVybGFwcGluZykge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGFjdG9yKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIGVhY2hWaXNpYmxlQWN0b3IoZ2FtZSwgYWN0b3JDb25zdHJ1Y3RvciwgY2FsbGJhY2spIHtcbiAgICBnYW1lLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKCEoYWN0b3IgaW5zdGFuY2VvZiBhY3RvckNvbnN0cnVjdG9yKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZ2FtZS5nYW1lU3RhdGUgIT09ICdwbGF5Jykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgdmlzaW9uU3RhcnQgPSB7XG4gICAgICAgIHg6IHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gMikgKyB0aGlzLmV5ZU9mZnNldC54LFxuICAgICAgICB5OiB0aGlzLmN1clkgKyB0aGlzLmV5ZU9mZnNldC55XG4gICAgICB9O1xuICAgICAgbGV0IHZpc2lvbkRlbHRhID0ge1xuICAgICAgICB4OiAoYWN0b3IuY3VyWCArIChhY3Rvci53aWR0aCAvIDIpICsgYWN0b3IuZXllT2Zmc2V0LngpIC0gdmlzaW9uU3RhcnQueCxcbiAgICAgICAgeTogKGFjdG9yLmN1clkgKyBhY3Rvci5leWVPZmZzZXQueSkgLSB2aXNpb25TdGFydC55XG4gICAgICB9O1xuICAgICAgbGV0IGFjdG9yRGlyTGVuZ3RoID0gTWF0aC5zcXJ0KFxuICAgICAgICB2aXNpb25EZWx0YS54ICogdmlzaW9uRGVsdGEueCArIHZpc2lvbkRlbHRhLnkgKiB2aXNpb25EZWx0YS55KTtcbiAgICAgIGxldCBhY3RvckRpciA9IHtcbiAgICAgICAgeDogdmlzaW9uRGVsdGEueCAvIGFjdG9yRGlyTGVuZ3RoLFxuICAgICAgICB5OiB2aXNpb25EZWx0YS55IC8gYWN0b3JEaXJMZW5ndGhcbiAgICAgIH07XG4gICAgICBsZXQgZG90UHJvZHVjdCA9ICh0aGlzLmRpclggKiBhY3RvckRpci54KSArICh0aGlzLmRpclkgKiBhY3RvckRpci55KTtcblxuICAgICAgbGV0IHZpc2libGUgPSBmYWxzZTtcblxuICAgICAgbGV0IGluRk9WO1xuICAgICAgaWYgKGRvdFByb2R1Y3QgPiAwLjcwKSB7XG4gICAgICAgIGluRk9WID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluRk9WID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbkZPVikge1xuICAgICAgICBsZXQgYWN0b3JBcnIgPSBbXTtcbiAgICAgICAgbGV0IGFjdG9yT2JqID0ge1xuICAgICAgICAgIHg6IGFjdG9yLmN1clgsXG4gICAgICAgICAgeTogYWN0b3IuY3VyWSxcbiAgICAgICAgICB3OiBhY3Rvci53aWR0aCxcbiAgICAgICAgICBoOiBhY3Rvci5oZWlnaHRcbiAgICAgICAgfTtcbiAgICAgICAgYWN0b3JBcnIucHVzaChhY3Rvck9iaik7XG4gICAgICAgIGxldCBibG9ja1Jlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgICAgIHZpc2lvblN0YXJ0LCB2aXNpb25EZWx0YSwgZ2FtZS5zdGF0aWNCbG9ja3MpO1xuICAgICAgICBsZXQgYWN0b3JSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgICAgICB2aXNpb25TdGFydCwgdmlzaW9uRGVsdGEsIGFjdG9yQXJyKTtcblxuICAgICAgICBpZiAoZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICBsZXQgZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgICAgYWN0b3IuY3VyWCArIChhY3Rvci53aWR0aCAvIDIpICsgYWN0b3IuZXllT2Zmc2V0LngsXG4gICAgICAgICAgICBhY3Rvci5jdXJZICsgYWN0b3IuZXllT2Zmc2V0LnkpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQubW92ZVRvKHZpc2lvblN0YXJ0LngsIHZpc2lvblN0YXJ0LnkpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oZW5kUG9zLngsIGVuZFBvcy55KTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3doaXRlJztcbiAgICAgICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0b3JSZXN1bHQgJiYgYWN0b3JSZXN1bHQuaGl0ICYmIGJsb2NrUmVzdWx0ICYmIGJsb2NrUmVzdWx0LmhpdCkge1xuICAgICAgICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3MuY2hlY2tOZWFyZXN0SGl0KFxuICAgICAgICAgICAgdGhpcywgYmxvY2tSZXN1bHQsIGFjdG9yUmVzdWx0KTtcbiAgICAgICAgICB2aXNpYmxlID0gcmVzdWx0LnRhcmdldEhpdDtcbiAgICAgICAgfSBlbHNlIGlmIChhY3RvclJlc3VsdCAmJiBhY3RvclJlc3VsdC5oaXQpIHtcbiAgICAgICAgICB2aXNpYmxlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2aXNpYmxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh2aXNpYmxlKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpcywgYWN0b3IpO1xuICAgICAgfVxuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUsIGFuZ2xlID0gNzUsIHBvd2VyID0gODAwKSB7XG4gICAgbGV0IHBvaW50QXJyYXkgPSBbXTtcbiAgICBsZXQgc3RhcnRpbmdQb2ludCA9IHt9O1xuICAgIGxldCBkZWdyZWVUb0N1ckVuZFBvaW50O1xuICAgIGxldCBzd2VlcEFuZ2xlID0gYW5nbGU7XG4gICAgbGV0IGdyaWRTaXplID0ge3c6IDI4LCBoOiAyOH07XG4gICAgbGV0IGNlbGxTaXplID0gZ2FtZS5jZWxsV2lkdGg7XG4gICAgbGV0IGRpciA9IHt4OiB0aGlzLmRpclgsIHk6IHRoaXMuZGlyWX07XG5cbiAgICBzdGFydGluZ1BvaW50LnggPSB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpO1xuICAgIHN0YXJ0aW5nUG9pbnQueSA9IHRoaXMuY3VyWSArIDE0O1xuICAgIGxldCBpbml0aWFsRW5kcG9pbnQgPSB7fTtcbiAgICAvLyBHZXQgb3VyIGluaXRpYWwgcG9pbnQgdGhhdCBpcyBzdHJhaWdodCBhaGVhZFxuICAgIGlmICh0aGlzLmRpclggPT09IC0xIHx8IHRoaXMuZGlyWCA9PT0gMSkge1xuICAgICAgaW5pdGlhbEVuZHBvaW50ID0ge3g6IChzdGFydGluZ1BvaW50LnggKyB0aGlzLmxhc2VyUmFuZ2UpICogLXRoaXMuZGlyWCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5OiBzdGFydGluZ1BvaW50Lnl9O1xuICAgIH0gZWxzZSBpZiAodGhpcy5kaXJZID09PSAtMSB8fCB0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgIGluaXRpYWxFbmRwb2ludCA9IHt4OiBzdGFydGluZ1BvaW50LngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAoc3RhcnRpbmdQb2ludC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcll9O1xuICAgIH1cblxuICAgIC8vIFVzaW5nIHRoZSBNb3VzZVxuICAgIC8vIGluaXRpYWxFbmRwb2ludCA9IHt4OiAodGhpcy5jdXJYIC0gZ2FtZS5tb3VzZS54KSAqIHRoaXMubGFzZXJSYW5nZSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgeTogKHRoaXMuY3VyWSAtIGdhbWUubW91c2UueSkgKiB0aGlzLmxhc2VyUmFuZ2V9O1xuICAgIHBvaW50QXJyYXkgPSBnYW1lLnBoeXNpY3Muc3dlZXBTY2FuKGdhbWUsIGluaXRpYWxFbmRwb2ludCwgc3RhcnRpbmdQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lLmNhbnZhcy53aWR0aCwgc3dlZXBBbmdsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZWxsU2l6ZSwgdGhpcyk7XG4gICAgbGV0IGxpZ2h0Q3R4ID0gZ2FtZS5jb250ZXh0O1xuICAgIGxpZ2h0Q3R4LmJlZ2luUGF0aCgpO1xuICAgIGxpZ2h0Q3R4Lm1vdmVUbyhzdGFydGluZ1BvaW50LngsIHN0YXJ0aW5nUG9pbnQueSk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGxpID0gcG9pbnRBcnJheS5sZW5ndGg7IGkgPCBsaTsgaSsrKSB7XG4gICAgICBsaWdodEN0eC5saW5lVG8ocG9pbnRBcnJheVtpXS54LCBwb2ludEFycmF5W2ldLnkpO1xuICAgIH1cbiAgICBsaWdodEN0eC5jbG9zZVBhdGgoKTtcbiAgICBsZXQgZ3JkID0gbGlnaHRDdHguY3JlYXRlUmFkaWFsR3JhZGllbnQodGhpcy5jdXJYLHRoaXMuY3VyWSxwb3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJYLHRoaXMuY3VyWSwwKTtcbiAgICBncmQuYWRkQ29sb3JTdG9wKDAsICd0cmFuc3BhcmVudCcpO1xuICAgIGdyZC5hZGRDb2xvclN0b3AoMC44LCAncmdiYSgyNTUsMjU1LDI1NSwwLjMpJyk7XG4gICAgZ3JkLmFkZENvbG9yU3RvcCgxLCAncmdiYSgyNTUsMjU1LDI1NSwwLjUpJyk7XG4gICAgbGlnaHRDdHguZmlsbFN0eWxlID0gZ3JkO1xuICAgIGxpZ2h0Q3R4LmZpbGwoKTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGxldCBoaXRXYWxsID0gdGhpcy5jb2xsaWRlc1dpdGhXYWxscyhnYW1lKTtcbiAgICBpZiAoaGl0V2FsbC5kaXJYKSB7XG4gICAgICB0aGlzLmRpclggPSBoaXRXYWxsLmRpclg7XG4gICAgfVxuICAgIGlmIChoaXRXYWxsLmRpclkpIHtcbiAgICAgIHRoaXMuZGlyWSA9IGhpdFdhbGwuZGlyWTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tb3ZpbmcpIHtcbiAgICAgIGxldCBtb3ZpbmdCb3ggPSBuZXcgQm94KHRoaXMuY3VyWCwgdGhpcy5jdXJZLCB0aGlzLndpZHRoLFxuICAgICAgICB0aGlzLmhlaWdodCk7XG4gICAgICBsZXQgc2VnbWVudERlbHRhID0ge1xuICAgICAgICB4OiAodGhpcy5zcGVlZFggKiBlbGFwc2VkVGltZSkgKiB0aGlzLmRpclgsXG4gICAgICAgIHk6ICh0aGlzLnNwZWVkWSAqIGVsYXBzZWRUaW1lKSAqIHRoaXMuZGlyWVxuICAgICAgfTtcbiAgICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3Muc3dlZXBCb3hJbnRvQm94ZXMobW92aW5nQm94LCBzZWdtZW50RGVsdGEsXG4gICAgICAgIGdhbWUuc3RhdGljQmxvY2tzKTtcbiAgICAgIHRoaXMucHJldmlvdXNQb3MgPSB7XG4gICAgICAgIHg6IHRoaXMuY3VyWCxcbiAgICAgICAgeTogdGhpcy5jdXJZXG4gICAgICB9O1xuICAgICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaGl0KSB7XG4gICAgICAgIHRoaXMuZGlyWCA9IHJlc3VsdC5oaXROb3JtYWwueDtcbiAgICAgICAgdGhpcy5kaXJZID0gcmVzdWx0LmhpdE5vcm1hbC55O1xuICAgICAgICB0aGlzLmN1clggPSByZXN1bHQuaGl0UG9zLnggLSAodGhpcy53aWR0aCAvIDIpO1xuICAgICAgICB0aGlzLmN1clkgPSByZXN1bHQuaGl0UG9zLnkgLSAodGhpcy5oZWlnaHQgLyAyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY3VyWCArPSBzZWdtZW50RGVsdGEueDtcbiAgICAgICAgdGhpcy5jdXJZICs9IHNlZ21lbnREZWx0YS55O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEltYWdlIFN3aXRjaGVyXG4gICAgdGhpcy5mYWNpbmcgPSBEaXJlY3Rpb25zLmdldE5hbWUodGhpcy5kaXJYLCB0aGlzLmRpclkpO1xuICAgIHRoaXMuY3VySW1hZ2UgPSB0aGlzLmRpckltYWdlc1t0aGlzLmZhY2luZ107XG4gIH1cblxuICBwcmVEcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlICYmIHRoaXMuaGVhZExhbXBBY3RpdmUgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUsIHRoaXMuaGVhZExhbXBBbmdsZSwgdGhpcy5oZWFkTGFtcFBvd2VyKTtcbiAgICB9XG4gIH1cblxuICBkcmF3RlBTKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgZ2FtZS5jb250ZXh0RlguY2xlYXJSZWN0KDAsIDAsIGdhbWUuY2FudmFzRlBTLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lLmNhbnZhc0ZQUy5oZWlnaHQpO1xuICAgIGxldCBiZ0NvbG9yID0gJyNGRkZGRkYnO1xuICAgIGdhbWUuY29udGV4dEZQUy5maWxsU3R5bGUgPSBiZ0NvbG9yO1xuICAgIGdhbWUuY29udGV4dEZQUy5maWxsUmVjdCgwLCAwLCBnYW1lLmNhbnZhc0ZQUy53aWR0aCwgZ2FtZS5jYW52YXNGUFMuaGVpZ2h0KTtcblxuICAgIGdhbWUuY29udGV4dEZQUy5maWxsU3R5bGUgPSAnIzAwMDAwMCc7XG4gICAgZ2FtZS5jb250ZXh0RlBTLmZpbGxSZWN0KDAsIGdhbWUuY2FudmFzRlBTLmhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWUuY2FudmFzRlBTLndpZHRoLCBnYW1lLmNhbnZhc0ZQUy5oZWlnaHQgLyAyKTtcblxuICAgIGxldCBwb2ludEFycmF5ID0gW107XG4gICAgbGV0IHN0YXJ0aW5nUG9pbnQgPSB7fTtcbiAgICBsZXQgZGVncmVlVG9DdXJFbmRQb2ludDtcbiAgICBsZXQgc3dlZXBBbmdsZSA9IDYwO1xuICAgIGxldCByZXNvbHV0aW9uID0gMzIwO1xuICAgIGxldCBwcm9qZWN0aW9uRGlzdGFuY2UgPSAoZ2FtZS5jYW52YXNGUFMud2lkdGggLyAyKSAqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgudGFuKHN3ZWVwQW5nbGUgKiBERUdfVE9fUkFEKTtcbiAgICBsZXQgZ3JpZFNpemUgPSB7dzogMjgsIGg6IDI4fTtcbiAgICBsZXQgY2VsbFNpemUgPSBnYW1lLmNlbGxXaWR0aDtcbiAgICBsZXQgZGlyID0ge3g6IHRoaXMuZGlyWCwgeTogdGhpcy5kaXJZfTtcblxuICAgIHN0YXJ0aW5nUG9pbnQueCA9IHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gMik7XG4gICAgc3RhcnRpbmdQb2ludC55ID0gdGhpcy5jdXJZICsgMTQ7XG4gICAgbGV0IGluaXRpYWxFbmRwb2ludCA9IHt9O1xuICAgIC8vIEdldCBvdXIgaW5pdGlhbCBwb2ludCB0aGF0IGlzIHN0cmFpZ2h0IGFoZWFkXG4gICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICBpbml0aWFsRW5kcG9pbnQgPSB7eDogKHN0YXJ0aW5nUG9pbnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHN0YXJ0aW5nUG9pbnQueX07XG4gICAgfSBlbHNlIGlmICh0aGlzLmRpclkgPT09IC0xIHx8IHRoaXMuZGlyWSA9PT0gMSkge1xuICAgICAgaW5pdGlhbEVuZHBvaW50ID0ge3g6IHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IChzdGFydGluZ1BvaW50LnkgKyB0aGlzLmxhc2VyUmFuZ2UpICogLXRoaXMuZGlyWX07XG4gICAgfVxuICAgIHBvaW50QXJyYXkgPSBnYW1lLnBoeXNpY3Muc3dlZXBTY2FuKGdhbWUsIGluaXRpYWxFbmRwb2ludCwgc3RhcnRpbmdQb2ludCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lLmNhbnZhc0ZQUy53aWR0aCwgc3dlZXBBbmdsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZWxsU2l6ZSwgdGhpcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludEFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgeiA9IHBvaW50QXJyYXlbaV0uZGVsdGEgKiBNYXRoLmNvcyhwb2ludEFycmF5W2ldLmFuZ2xlICogREVHX1RPX1JBRCk7XG4gICAgICBsZXQgZGlzdGFuY2VBbHBoYSA9IHBvaW50QXJyYXlbaV0uZGVsdGEgLyA4MDA7XG4gICAgICBsZXQgd2FsbEhlaWdodCA9IGdhbWUuY2FudmFzRlBTLmhlaWdodCAqICg2NCAvIHopO1xuICAgICAgbGV0IGRpc3RhbmNlQ29sb3IgPSBNYXRoLmZsb29yKDIwMCAqICgxLjAgLSBkaXN0YW5jZUFscGhhKSk7XG4gICAgICAvLyBnYW1lLmNvbnRleHRGUFMuZmlsbFN0eWxlID0gYHJnYmEoMCwgMCwgMCwgJHtkaXN0YW5jZUFscGhhfSlgO1xuICAgICAgZ2FtZS5jb250ZXh0RlBTLmZpbGxTdHlsZSA9IGByZ2IoJHtkaXN0YW5jZUNvbG9yfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkaXN0YW5jZUNvbG9yfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHtkaXN0YW5jZUNvbG9yfSlgO1xuICAgICAgZ2FtZS5jb250ZXh0RlBTLmZpbGxSZWN0KFxuICAgICAgICBpLFxuICAgICAgICAoZ2FtZS5jYW52YXNGUFMuaGVpZ2h0IC0gd2FsbEhlaWdodCkgLyAyLFxuICAgICAgICAxLFxuICAgICAgICB3YWxsSGVpZ2h0XG4gICAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmN1ckltYWdlKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmN1ckltYWdlKTtcbiAgICAgIGxldCBpbWdTcGxpdFggPSAwLCBpbWdTcGxpdFkgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VyWCArIHRoaXMud2lkdGggPiBnYW1lLmNhbnZhcy53aWR0aCkge1xuICAgICAgICBpbWdTcGxpdFggPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgICBpbWdTcGxpdFggPSBnYW1lLmNhbnZhcy53aWR0aCArIHRoaXMuY3VyWDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICAgIGltZ1NwbGl0WSA9IGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0ICsgKHRoaXMuaGVpZ2h0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJZKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICAgIGltZ1NwbGl0WSA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLVxuICAgICAgICAgICAgICAgICAgICAgZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbWdTcGxpdFggIT09IDAgfHwgaW1nU3BsaXRZICE9PSAwKSB7XG4gICAgICAgIGlmIChpbWdTcGxpdFggPT09IDApIHtcbiAgICAgICAgICBpbWdTcGxpdFggPSB0aGlzLmN1clg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGltZ1NwbGl0WSA9PT0gMCkge1xuICAgICAgICAgIGltZ1NwbGl0WSA9IHRoaXMuY3VyWTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCB0aGlzLmN1clksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgdGhpcy5jdXJYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgfVxuICAgICAgZ2FtZS5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmN1ckltYWdlLCB0aGlzLmN1clgsIHRoaXMuY3VyWSxcbiAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIGlmIChnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgbGV0IHgxID0gdGhpcy5jdXJYO1xuICAgICAgbGV0IHkxID0gdGhpcy5jdXJZO1xuICAgICAgbGV0IHgyID0gdGhpcy5jdXJYICsgdGhpcy53aWR0aDtcbiAgICAgIGxldCB5MiA9IHRoaXMuY3VyWSArIHRoaXMuaGVpZ2h0O1xuXG4gICAgICBnYW1lLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICBnYW1lLmNvbnRleHQubW92ZVRvKHgxLCB5MSk7XG4gICAgICBnYW1lLmNvbnRleHQubGluZVRvKHgyLCB5MSk7XG4gICAgICBnYW1lLmNvbnRleHQubGluZVRvKHgyLCB5Mik7XG4gICAgICBnYW1lLmNvbnRleHQubGluZVRvKHgxLCB5Mik7XG4gICAgICBnYW1lLmNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmRlYnVnQ29sb3I7XG4gICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgICBnYW1lLmNvbnRleHQuZm9udCA9ICcxNHB4IFZlcmRhbmEnO1xuICAgICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICdibHVlJztcbiAgICAgIGdhbWUuY29udGV4dC5maWxsVGV4dChcbiAgICAgICAgJ3gnICsgTWF0aC5mbG9vcih0aGlzLmN1clgpICsgJyAnICtcbiAgICAgICAgJ3knICsgTWF0aC5mbG9vcih0aGlzLmN1clkpICsgJyAnICtcbiAgICAgICAgdGhpcy5kaXJYICsgJyAnICsgdGhpcy5kaXJZLFxuICAgICAgICB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDQpLFxuICAgICAgICB0aGlzLmN1clkgKyAodGhpcy5oZWlnaHQgKyAzMCkpO1xuICAgIH1cbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7UGh5c2ljc30gZnJvbSAnLi9waHlzaWNzJztcblxuZXhwb3J0IGNsYXNzIEdhbWUge1xuICBjb25zdHJ1Y3RvcihjYW52YXMpIHtcbiAgICB0aGlzLm1vdXNlID0ge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmRlYnVnTW9kZSA9IGZhbHNlO1xuICAgIHRoaXMuaW1hZ2VzID0ge307XG4gICAgdGhpcy5pbWFnZXNMb2FkZWQgPSBmYWxzZTtcbiAgICB0aGlzLmFjdG9ycyA9IHt9O1xuICAgIHRoaXMua2V5RG93biA9IHt9O1xuICAgIHRoaXMua2V5TmFtZXMgPSB7fTtcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcbiAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICB9XG5cbiAgZGVmaW5lS2V5KGtleU5hbWUsIGtleUNvZGUpIHtcbiAgICB0aGlzLmtleURvd25ba2V5TmFtZV0gPSBmYWxzZTtcbiAgICB0aGlzLmtleU5hbWVzW2tleUNvZGVdID0ga2V5TmFtZTtcbiAgfVxuXG4gIGdldFJhbmRvbShtaW4sIG1heCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkgKyBtaW4pO1xuICB9XG5cbiAgLy8gTG9vcHMgdGhyb3VnaCBBY3RvciBhcnJheSBhbmQgY3JlYXRlcyBjYWxsYWJsZSBpbWFnZXMuXG4gIGxvYWRJbWFnZXMoY2hhcmFjdGVycywgaW1hZ2VzKSB7XG4gICAgbGV0IGltYWdlc1RvTG9hZCA9IFtdO1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgbG9hZGVkSW1hZ2VzID0gMDtcbiAgICBsZXQgbnVtSW1hZ2VzID0gMDtcblxuICAgIGxldCBnZXRSZXZlcnNlSW1hZ2UgPSBmdW5jdGlvbihzcmMsIHcsIGgpIHtcbiAgICAgIG51bUltYWdlcysrO1xuICAgICAgbGV0IHRlbXBJbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgbGV0IHRlbXBDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgIGxldCB0ZW1wQ29udGV4dCA9IHRlbXBDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgIHRlbXBDYW52YXMud2lkdGggPSB3O1xuICAgICAgdGVtcENhbnZhcy5oZWlnaHQgPSBoO1xuICAgICAgdGVtcENvbnRleHQudHJhbnNsYXRlKHcsIDApO1xuICAgICAgdGVtcENvbnRleHQuc2NhbGUoLTEsIDEpO1xuICAgICAgdGVtcENvbnRleHQuZHJhd0ltYWdlKHNyYywgMCwgMCk7XG4gICAgICB0ZW1wSW1hZ2Uub25sb2FkID0gb25JbWFnZUxvYWRlZDtcbiAgICAgIHRlbXBJbWFnZS5zcmMgPSB0ZW1wQ2FudmFzLnRvRGF0YVVSTCgpO1xuICAgICAgcmV0dXJuIHRlbXBJbWFnZTtcbiAgICB9O1xuXG4gICAgbGV0IG9uSW1hZ2VMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIGxvYWRlZEltYWdlcysrO1xuICAgICAgY29uc29sZS5sb2coJ2xvYWRlZCBpbWFnZScsIGxvYWRlZEltYWdlcywgJ29mJywgbnVtSW1hZ2VzKTtcbiAgICAgIGlmIChsb2FkZWRJbWFnZXMgPT09IG51bUltYWdlcykge1xuICAgICAgICBzZWxmLmltYWdlc0xvYWRlZCA9IHRydWU7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxldCBsb2FkSW1hZ2UgPSBmdW5jdGlvbihzcmMsIGNhbGxiYWNrKSB7XG4gICAgICBsZXQgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICBjYWxsYmFjay5jYWxsKGltYWdlKTtcbiAgICAgICAgfVxuICAgICAgICBvbkltYWdlTG9hZGVkKCk7XG4gICAgICB9O1xuICAgICAgaW1hZ2VzVG9Mb2FkLnB1c2goe2ltYWdlOiBpbWFnZSwgc3JjOiBzcmN9KTtcbiAgICAgIHJldHVybiBpbWFnZTtcbiAgICB9O1xuXG4gICAgbGV0IG9uTWFpbkltYWdlTG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLnJldiA9IGdldFJldmVyc2VJbWFnZSh0aGlzLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gICAgfTtcblxuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGNoYXJhY3RlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgLy8gZ2V0IG91ciBtYWluIGltYWdlXG4gICAgICBsZXQgY2hhcmFjdGVyID0gY2hhcmFjdGVyc1tpXTtcbiAgICAgIGxldCBpbWFnZSA9IHRoaXMuaW1hZ2VzW2NoYXJhY3Rlci5uYW1lXSA9IGxvYWRJbWFnZShcbiAgICAgICAgY2hhcmFjdGVyLmltYWdlLFxuICAgICAgICBvbk1haW5JbWFnZUxvYWRlZCk7XG5cbiAgICAgIGlmIChjaGFyYWN0ZXIuaW1hZ2VVcCkge1xuICAgICAgICBpbWFnZS51cCA9IGxvYWRJbWFnZShjaGFyYWN0ZXIuaW1hZ2VVcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWFnZS51cCA9IGltYWdlO1xuICAgICAgfVxuXG4gICAgICBpZiAoY2hhcmFjdGVyLmltYWdlRG93bikge1xuICAgICAgICBpbWFnZS5kb3duID0gbG9hZEltYWdlKGNoYXJhY3Rlci5pbWFnZURvd24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2UuZG93biA9IGltYWdlO1xuICAgICAgfVxuXG4gICAgICBpbWFnZS53ID0gY2hhcmFjdGVyLnc7XG4gICAgICBpbWFnZS5oID0gY2hhcmFjdGVyLmg7XG4gICAgfVxuXG4gICAgZm9yIChsZXQga2V5IGluIGltYWdlcykge1xuICAgICAgaWYgKGltYWdlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHRoaXNba2V5XSA9IGxvYWRJbWFnZShpbWFnZXNba2V5XSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbnVtSW1hZ2VzID0gaW1hZ2VzVG9Mb2FkLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMCwgaWwgPSBpbWFnZXNUb0xvYWQubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgaW1hZ2VzVG9Mb2FkW2ldLmltYWdlLnNyYyA9IGltYWdlc1RvTG9hZFtpXS5zcmM7XG4gICAgfVxuICB9XG5cbiAgZWFjaEFjdG9yKGNhbGxiYWNrLCBjb250ZXh0KSB7XG4gICAgZm9yIChsZXQgYyBpbiB0aGlzLmFjdG9ycykge1xuICAgICAgaWYgKHRoaXMuYWN0b3JzLmhhc093blByb3BlcnR5KGMpKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwoY29udGV4dCwgdGhpcy5hY3RvcnNbY10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGluaXRpYWxpemUoZWxhcHNlZFRpbWUpIHtcbiAgICB0aGlzLnBoeXNpY3MgPSBuZXcgUGh5c2ljcyh0aGlzKTtcbiAgICB0aGlzLmluaXRpYWxpemVkID0gdHJ1ZTtcbiAgfVxuXG4gIGRyYXcoZWxhcHNlZFRpbWUpIHtcbiAgICB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgLy8gdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDEuMCknO1xuICAgIC8vIHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0IC8gMik7XG5cbiAgICB0aGlzLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgYWN0b3IucHJlRHJhdyh0aGlzLCBlbGFwc2VkVGltZSk7XG4gICAgfSwgdGhpcyk7XG4gICAgdGhpcy5jb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2UtYXRvcCc7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGFjdG9yLmRyYXcodGhpcywgZWxhcHNlZFRpbWUpO1xuICAgIH0sIHRoaXMpO1xuICAgIHRoaXMuY29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xuICB9XG5cbiAgZHJhd0xvYWRpbmcoKSB7fVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuaXRlcmF0aW9uKys7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGlmIChhY3Rvci5hY3RpdmUpIHtcbiAgICAgICAgYWN0b3IudXBkYXRlKHRoaXMsIGVsYXBzZWRUaW1lKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIHRpY2soZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAodGhpcy5pbWFnZXNMb2FkZWQpIHtcbiAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUoZWxhcHNlZFRpbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5kcmF3KGVsYXBzZWRUaW1lKTtcbiAgICAgIHRoaXMudXBkYXRlKGVsYXBzZWRUaW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3TG9hZGluZygpO1xuICAgIH1cbiAgfVxuXG4gIG9uS2V5RG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGU7XG4gICAgaWYgKHRoaXMua2V5TmFtZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdGhpcy5rZXlEb3duW3RoaXMua2V5TmFtZXNba2V5XV0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIG9uS2V5VXAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBrZXkgPSBldmVudC5rZXlDb2RlO1xuICAgIGlmICh0aGlzLmtleU5hbWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHRoaXMua2V5RG93blt0aGlzLmtleU5hbWVzW2tleV1dID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgb25Nb3VzZU1vdmUoZXZlbnQpIHtcbiAgICB0aGlzLm1vdXNlLnggPSBldmVudC5wYWdlWCAtIHRoaXMuY2FudmFzLm9mZnNldExlZnQ7XG4gICAgdGhpcy5tb3VzZS55ID0gZXZlbnQucGFnZVkgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3A7XG4gIH1cblxuICBvblJlc2l6ZShldmVudCkge1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIH1cblxuICBzZXRGb2N1cyhldmVudCwgaXNCbHVycmVkKSB7XG4gICAgaWYgKHRoaXMuZGVidWdNb2RlICYmIGlzQmx1cnJlZCkge1xuICAgICAgdGhpcy5mcmFtZXNQZXJTZWNvbmQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZyYW1lc1BlclNlY29uZCA9IDMwO1xuICAgIH1cbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydCB7UGh5c2ljcywgQm94LCBQb2ludCwgRVBTSUxPTiwgREVHX1RPX1JBRH0gZnJvbSAnLi9waHlzaWNzJztcbmV4cG9ydCB7S2V5c30gZnJvbSAnLi9rZXlzJztcbmV4cG9ydCB7R2FtZX0gZnJvbSAnLi9nYW1lJztcbmV4cG9ydCB7QWN0b3IsIERpcmVjdGlvbnN9IGZyb20gJy4vYWN0b3InO1xuIiwiLyoganNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgY29uc3QgS2V5cyA9IHtcbiAgVVA6IDM4LFxuICBET1dOOiA0MCxcbiAgTEVGVDogMzcsXG4gIFJJR0hUOiAzOSxcbiAgVzogODcsXG4gIEE6IDY1LFxuICBTOiA4MyxcbiAgRDogNjgsXG4gIFNQQUNFOiAzMlxufTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgY2xhc3MgQm94IHtcbiAgY29uc3RydWN0b3IoeCwgeSwgdywgaCkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLncgPSB3O1xuICAgIHRoaXMuaCA9IGg7XG4gIH1cblxuICBpbmZsYXRlKHBhZGRpbmdYLCBwYWRkaW5nWSkge1xuICAgIHJldHVybiBuZXcgQm94KFxuICAgICAgdGhpcy54IC0gcGFkZGluZ1ggLyAyLFxuICAgICAgdGhpcy55IC0gcGFkZGluZ1kgLyAyLFxuICAgICAgdGhpcy53ICsgcGFkZGluZ1gsXG4gICAgICB0aGlzLmggKyBwYWRkaW5nWSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBvaW50IHtcbiAgY29uc3RydWN0b3IoeCwgeSkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRlBTUG9pbnQge1xuICBjb25zdHJ1Y3Rvcih4LCB5LCBkZWx0YSwgYW5nbGUpIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy5kZWx0YSA9IGRlbHRhO1xuICAgIHRoaXMuYW5nbGUgPSBhbmdsZTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgRVBTSUxPTiA9IDEgLyAzMjtcbmV4cG9ydCBjb25zdCBERUdfVE9fUkFEID0gTWF0aC5QSSAvIDE4MDtcbmV4cG9ydCBjb25zdCBSQURfVE9fREVHID0gMTgwIC8gTWF0aC5QSTtcblxuZXhwb3J0IGNsYXNzIFBoeXNpY3Mge1xuICBjb25zdHJ1Y3RvcihnYW1lKSB7XG4gICAgdGhpcy5nYW1lID0gZ2FtZTtcbiAgfVxuXG4gIGRyYXdQb2ludCh4LCB5LCBjb2xvciwgc2l6ZSkge1xuICAgIHNpemUgPSBzaXplIHx8IDQ7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gY29sb3I7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFJlY3QoeCAtIChzaXplIC8gMiksIHkgLSAoc2l6ZSAvIDIpLCBzaXplLCBzaXplKTtcbiAgfVxuXG4gIGRyYXdMaW5lKHgxLCB5MSwgeDIsIHkyLCBjb2xvcikge1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0Lm1vdmVUbyh4MSwgeTEpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmxpbmVUbyh4MiwgeTIpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gY29sb3I7XG4gICAgdGhpcy5nYW1lLmNvbnRleHQuc3Ryb2tlKCk7XG4gIH1cblxuICBkcmF3VGV4dCh4LCB5LCB0ZXh0LCBjb2xvcikge1xuICAgIGNvbG9yID0gY29sb3IgfHwgJ3doaXRlJztcbiAgICB0aGlzLmdhbWUuY29udGV4dC5mb250ID0gJzE0cHggQXJpYWwnO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9IGNvbG9yO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LmZpbGxUZXh0KHRleHQsIHgsIHkpO1xuICB9XG5cbiAgZHJhd0JveCh4LCB5LCB3LCBoLCBjb2xvcikge1xuICAgIGNvbG9yID0gY29sb3IgfHwgJ3doaXRlJztcbiAgICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICAgIHRoaXMuZ2FtZS5jb250ZXh0LnN0cm9rZVJlY3QoeCwgeSwgdywgaCk7XG4gIH1cblxuICBnZXREZWx0YSh4MSwgeTEsIHgyLCB5Mikge1xuICAgIHJldHVybiB7eDogeDIgLSB4MSwgeTogeTIgLSB5MX07XG4gIH1cblxuLy8gZGlzdGFuY2UgPSBzcXIoKHgxLXgyKV4yICsgKHkxLXkyKV4yKVxuICBnZXREaXN0YW5jZShzdGFydFBvaW50LCBlbmRQb2ludCkge1xuICAgIGxldCBkZWx0YVggPSBzdGFydFBvaW50LnggLSBlbmRQb2ludC54O1xuICAgIGxldCBkZWx0YVkgPSBzdGFydFBvaW50LnkgLSBlbmRQb2ludC55O1xuICAgIGxldCBkaXN0YW5jZSA9IE1hdGguc3FydCgoZGVsdGFYICogZGVsdGFYKSArIChkZWx0YVkgKiBkZWx0YVkpKTtcbiAgICBpZiAoIWlzTmFOKGRpc3RhbmNlKSkge1xuICAgICAgcmV0dXJuIGRpc3RhbmNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgfVxuXG4gIGludGVyc2VjdFNlZ21lbnRJbnRvQm94KHNlZ21lbnRQb3MsIHNlZ21lbnREZWx0YSwgcGFkZGVkQm94LCBkZWJ1Zykge1xuICAgIC8vIGRyYXdCb3gocGFkZGVkQm94LngsIHBhZGRlZEJveC55LCBwYWRkZWRCb3gudywgcGFkZGVkQm94LmgsICdncmF5Jyk7XG4gICAgdmFyIG5lYXJYUGVyY2VudCwgZmFyWFBlcmNlbnQ7XG4gICAgaWYgKHNlZ21lbnREZWx0YS54ID49IDApIHtcbiAgICAgIC8vIGdvaW5nIGxlZnQgdG8gcmlnaHRcbiAgICAgIG5lYXJYUGVyY2VudCA9IChwYWRkZWRCb3gueCAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueDtcbiAgICAgIGZhclhQZXJjZW50ID0gKChwYWRkZWRCb3gueCArIHBhZGRlZEJveC53KSAtXG4gICAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGdvaW5nIHJpZ2h0IHRvIGxlZnRcbiAgICAgIG5lYXJYUGVyY2VudCA9IChcbiAgICAgICAgKChwYWRkZWRCb3gueCArIHBhZGRlZEJveC53KSAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueCk7XG4gICAgICBmYXJYUGVyY2VudCA9IChwYWRkZWRCb3gueCAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueDtcbiAgICB9XG5cbiAgICB2YXIgbmVhcllQZXJjZW50LCBmYXJZUGVyY2VudDtcbiAgICBpZiAoc2VnbWVudERlbHRhLnkgPj0gMCkge1xuICAgICAgLy8gZ29pbmcgdG9wIHRvIGJvdHRvbVxuICAgICAgbmVhcllQZXJjZW50ID0gKHBhZGRlZEJveC55IC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgICAgZmFyWVBlcmNlbnQgPSAoKHBhZGRlZEJveC55ICsgcGFkZGVkQm94LmgpIC1cbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBnb2luZyBib3R0b20gdG8gdG9wXG4gICAgICBuZWFyWVBlcmNlbnQgPSAoXG4gICAgICAgICgocGFkZGVkQm94LnkgKyBwYWRkZWRCb3guaCkgLSBzZWdtZW50UG9zLnkpIC8gc2VnbWVudERlbHRhLnkpO1xuICAgICAgZmFyWVBlcmNlbnQgPSAocGFkZGVkQm94LnkgLSBzZWdtZW50UG9zLnkpIC8gc2VnbWVudERlbHRhLnk7XG4gICAgfVxuXG4gICAgLy8gY2FsY3VsYXRlIHRoZSBmdXJ0aGVyIG9mIHRoZSB0d28gbmVhciBwZXJjZW50c1xuICAgIHZhciBuZWFyUGVyY2VudDtcbiAgICBpZiAobmVhclhQZXJjZW50ID4gbmVhcllQZXJjZW50KSB7XG4gICAgICBuZWFyUGVyY2VudCA9IG5lYXJYUGVyY2VudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbmVhclBlcmNlbnQgPSBuZWFyWVBlcmNlbnQ7XG4gICAgfVxuXG4gICAgLy8gY2FsY3VsYXRlIHRoZSBuZWFyZXN0IG9mIHRoZSB0d28gZmFyIHBlcmNlbnRcbiAgICB2YXIgZmFyUGVyY2VudDtcbiAgICBpZiAoZmFyWFBlcmNlbnQgPCBmYXJZUGVyY2VudCkge1xuICAgICAgZmFyUGVyY2VudCA9IGZhclhQZXJjZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBmYXJQZXJjZW50ID0gZmFyWVBlcmNlbnQ7XG4gICAgfVxuXG4gICAgdmFyIGhpdDtcbiAgICBpZiAobmVhclhQZXJjZW50ID4gZmFyWVBlcmNlbnQgfHwgbmVhcllQZXJjZW50ID4gZmFyWFBlcmNlbnQpIHtcbiAgICAgIC8vIFdoZXJlIHRoZSBzZWdtZW50IGhpdHMgdGhlIGxlZnQgZWRnZSBvZiB0aGUgYm94LCBoYXMgdG8gYmUgYmV0d2VlblxuICAgICAgLy8gdGhlIHRvcCBhbmQgYm90dG9tIGVkZ2VzIG9mIHRoZSBib3guIE90aGVyd2lzZSwgdGhlIHNlZ21lbnQgaXNcbiAgICAgIC8vIHBhc3NpbmcgdGhlIGJveCB2ZXJ0aWNhbGx5IGJlZm9yZSBpdCBoaXRzIHRoZSBsZWZ0IHNpZGUuXG4gICAgICBoaXQgPSBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKG5lYXJQZXJjZW50ID4gMSkge1xuICAgICAgLy8gdGhlIGJveCBpcyBwYXN0IHRoZSBlbmQgb2YgdGhlIGxpbmVcbiAgICAgIGhpdCA9IGZhbHNlO1xuICAgIH0gZWxzZSBpZiAoZmFyUGVyY2VudCA8IDApIHtcbiAgICAgIC8vIHRoZSBib3ggaXMgYmVmb3JlIHRoZSBzdGFydCBvZiB0aGUgbGluZVxuICAgICAgaGl0ID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpdCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGhpdFBlcmNlbnQgPSBuZWFyUGVyY2VudDtcbiAgICB2YXIgaGl0Tm9ybWFsID0ge307XG4gICAgaWYgKG5lYXJYUGVyY2VudCA+IG5lYXJZUGVyY2VudCkge1xuICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgbGVmdCBvciByaWdodCBlZGdlXG4gICAgICBpZiAoc2VnbWVudERlbHRhLnggPj0gMCkge1xuICAgICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSBsZWZ0IGVkZ2VcbiAgICAgICAgaGl0Tm9ybWFsLnggPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIHJpZ2h0IGVkZ2VcbiAgICAgICAgaGl0Tm9ybWFsLnggPSAxO1xuICAgICAgfVxuICAgICAgaGl0Tm9ybWFsLnkgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSB0byBvciBib3R0b20gZWRnZVxuICAgICAgaGl0Tm9ybWFsLnggPSAwO1xuICAgICAgaWYgKHNlZ21lbnREZWx0YS55ID49IDApIHtcbiAgICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgdG9wIGVkZ2VcbiAgICAgICAgaGl0Tm9ybWFsLnkgPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIGJvdHRvbSBlZGdlXG4gICAgICAgIGhpdE5vcm1hbC55ID0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGhpdFBlcmNlbnQgPCAwKSB7XG4gICAgICBoaXRQZXJjZW50ID0gMDtcbiAgICB9XG5cbiAgICB2YXIgaGl0UG9zID0ge1xuICAgICAgeDogc2VnbWVudFBvcy54ICsgKHNlZ21lbnREZWx0YS54ICogaGl0UGVyY2VudCksXG4gICAgICB5OiBzZWdtZW50UG9zLnkgKyAoc2VnbWVudERlbHRhLnkgKiBoaXRQZXJjZW50KVxuICAgIH07XG5cbiAgICBoaXRQb3MueCArPSBoaXROb3JtYWwueCAqIEVQU0lMT047XG4gICAgaGl0UG9zLnkgKz0gaGl0Tm9ybWFsLnkgKiBFUFNJTE9OO1xuXG4gICAgbGV0IHJlc3VsdCA9ICB7XG4gICAgICBoaXQ6IGhpdCxcbiAgICAgIGhpdE5vcm1hbDogaGl0Tm9ybWFsLFxuICAgICAgaGl0UGVyY2VudDogaGl0UGVyY2VudCxcbiAgICAgIGhpdFBvczogaGl0UG9zLFxuICAgICAgbmVhclBlcmNlbnQ6IG5lYXJQZXJjZW50LFxuICAgICAgbmVhclhQZXJjZW50OiBuZWFyWFBlcmNlbnQsXG4gICAgICBuZWFyWVBlcmNlbnQ6IG5lYXJZUGVyY2VudCxcbiAgICAgIGZhclBlcmNlbnQ6IGZhclBlcmNlbnQsXG4gICAgICBmYXJYUGVyY2VudDogZmFyWFBlcmNlbnQsXG4gICAgICBmYXJZUGVyY2VudDogZmFyWVBlcmNlbnQsXG4gICAgICBoaXRCb3g6IHBhZGRlZEJveFxuICAgIH07XG4gICAgLy8gaWYgKGRlYnVnKSB7XG4gICAgLy8gICAgbGV0IGhpdENvdW50ZXIgPSAwO1xuICAgIC8vICAgIGxldCBoaXRDb2xvcnMgPSBbJyNmMDAnLCAnIzBmMCcsICcjZmYwJywgJyMwZmYnLCAnI2YwZicsXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAnI2ZmZicsICcjZjkwJ107XG4gICAgLy8gICAgIHRoaXMuZHJhd1BvaW50KHJlc3VsdC5oaXRQb3MueCwgcmVzdWx0LmhpdFBvcy55LFxuICAgIC8vICAgICAgICAgICAgICAgICAgICBoaXRDb2xvcnNbaGl0Q291bnRlciAlIGhpdENvbG9ycy5sZW5ndGhdLCA0KTtcbiAgICAvLyAgICAgdGhpcy5kcmF3TGluZShzZWdtZW50UG9zLngsIHNlZ21lbnRQb3MueSxcbiAgICAvLyAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLnggKyBzZWdtZW50RGVsdGEueCxcbiAgICAvLyAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLnkgKyBzZWdtZW50RGVsdGEueSwgJyMwZmYnKTtcbiAgICAvLyAgICAgaGl0Q291bnRlciArPSAxO1xuICAgIC8vIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgc3dlZXBCb3hJbnRvQm94KG1vdmluZ0JveCwgc2VnbWVudERlbHRhLCBzdGF0aWNCb3gpIHtcbiAgICB2YXIgc2VnbWVudFBvcyA9IHtcbiAgICAgIHg6IG1vdmluZ0JveC54ICsgbW92aW5nQm94LncgLyAyLFxuICAgICAgeTogbW92aW5nQm94LnkgKyBtb3ZpbmdCb3guaCAvIDJcbiAgICB9O1xuXG4gICAgdmFyIHBhZGRlZEJveCA9IG5ldyBCb3goXG4gICAgICBzdGF0aWNCb3gueCAtIG1vdmluZ0JveC53IC8gMixcbiAgICAgIHN0YXRpY0JveC55IC0gbW92aW5nQm94LmggLyAyLFxuICAgICAgc3RhdGljQm94LncgKyBtb3ZpbmdCb3gudyxcbiAgICAgIHN0YXRpY0JveC5oICsgbW92aW5nQm94LmgpO1xuICAgIHZhciByZXN1bHQgPSB0aGlzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94KHNlZ21lbnRQb3MsIHNlZ21lbnREZWx0YSxcbiAgICAgIHBhZGRlZEJveCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoc2VnbWVudFBvcywgc2VnbWVudERlbHRhLCBzdGF0aWNCb3hlcywgZGVidWcpIHtcbiAgICBsZXQgaGl0Q291bnRlciA9IDA7XG4gICAgbGV0IGhpdENvbG9ycyA9IFsnI2YwMCcsICcjMGYwJywgJyNmZjAnLCAnIzBmZicsICcjZjBmJywgJyNmZmYnLCAnI2Y5MCddO1xuICAgIHZhciBuZWFyZXN0UmVzdWx0ID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMCwgaWwgPSBzdGF0aWNCb3hlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICB2YXIgc3RhdGljQm94ID0gc3RhdGljQm94ZXNbaV07XG4gICAgICB2YXIgcmVzdWx0ID0gdGhpcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveChzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsXG4gICAgICAgIHN0YXRpY0JveCk7XG4gICAgICBpZiAocmVzdWx0LmhpdCkge1xuICAgICAgICBpZiAoZGVidWcpIHtcbiAgICAgICAgICB0aGlzLmRyYXdQb2ludChyZXN1bHQuaGl0UG9zLngsIHJlc3VsdC5oaXRQb3MueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICBoaXRDb2xvcnNbaGl0Q291bnRlciAlIGhpdENvbG9ycy5sZW5ndGhdLCA0KTtcbiAgICAgICAgICB0aGlzLmRyYXdMaW5lKHNlZ21lbnRQb3MueCwgc2VnbWVudFBvcy55LFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VnbWVudFBvcy54ICsgc2VnbWVudERlbHRhLngsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWdtZW50UG9zLnkgKyBzZWdtZW50RGVsdGEueSwgJyMwZmYnKTtcbiAgICAgICAgICBoaXRDb3VudGVyICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFuZWFyZXN0UmVzdWx0IHx8IHJlc3VsdC5oaXRQZXJjZW50IDwgbmVhcmVzdFJlc3VsdC5oaXRQZXJjZW50KSB7XG4gICAgICAgICAgbmVhcmVzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmVhcmVzdFJlc3VsdDtcbiAgfVxuXG4gIC8vIFN3ZWVwIG1vdmluZ0JveCwgYWxvbmcgdGhlIG1vdmVtZW50IGRlc2NyaWJlZCBieSBzZWdtZW50RGVsdGEsIGludG8gZWFjaFxuICAvLyBib3ggaW4gdGhlIGxpc3Qgb2Ygc3RhdGljQm94ZXMuIFJldHVybiBhIHJlc3VsdCBvYmplY3QgZGVzY3JpYmluZyB0aGUgZmlyc3RcbiAgLy8gc3RhdGljIGJveCB0aGF0IG1vdmluZ0JveCBoaXRzLCBvciBudWxsLlxuICBzd2VlcEJveEludG9Cb3hlcyhtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94ZXMpIHtcbiAgICB2YXIgbmVhcmVzdFJlc3VsdCA9IG51bGw7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gc3RhdGljQm94ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgICAgdmFyIHN0YXRpY0JveCA9IHN0YXRpY0JveGVzW2ldO1xuICAgICAgdmFyIHJlc3VsdCA9IHRoaXMuc3dlZXBCb3hJbnRvQm94KG1vdmluZ0JveCwgc2VnbWVudERlbHRhLCBzdGF0aWNCb3gpO1xuICAgICAgaWYgKHJlc3VsdC5oaXQpIHtcbiAgICAgICAgaWYgKCFuZWFyZXN0UmVzdWx0IHx8IHJlc3VsdC5oaXRQZXJjZW50IDwgbmVhcmVzdFJlc3VsdC5oaXRQZXJjZW50KSB7XG4gICAgICAgICAgbmVhcmVzdFJlc3VsdCA9IHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmVhcmVzdFJlc3VsdDtcbiAgfVxuXG4gIGdldEZpcnN0Q29sbGlzaW9uKHN0YXJ0UG9zLCBjZWxsU2l6ZSwgZGVsdGEsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGRpciA9IHt9LCBlbmRQb3MgPSB7fSwgY2VsbCA9IHt9LCB0aW1lU3RlcCA9IHt9LCB0aW1lID0ge307XG4gICAgbGV0IGRpcnMgPSBbJ3gnLCAneSddO1xuICAgIGxldCBmaXJzdEVkZ2UgPSB7fTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICBsZXQgayA9IGRpcnNbaV07XG4gICAgICBkaXJba10gPSBkZWx0YVtrXSA8IDAgPyAtMSA6IDE7XG4gICAgICBlbmRQb3Nba10gPSBzdGFydFBvc1trXSArIGRlbHRhW2tdO1xuICAgICAgY2VsbFtrXSA9IE1hdGguZmxvb3Ioc3RhcnRQb3Nba10gLyBjZWxsU2l6ZSk7XG4gICAgICB0aW1lU3RlcFtrXSA9IChjZWxsU2l6ZSAqIGRpcltrXSkgLyBkZWx0YVtrXTtcbiAgICAgIGlmIChkaXJba10gPT09IDApIHtcbiAgICAgICAgdGltZVtrXSA9IDE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmaXJzdEVkZ2Vba10gPSBjZWxsW2tdICogY2VsbFNpemU7XG4gICAgICAgIGlmIChkaXJba10gPiAwKSB7XG4gICAgICAgICAgZmlyc3RFZGdlW2tdICs9IGNlbGxTaXplO1xuICAgICAgICB9XG4gICAgICAgIHRpbWVba10gPSAoZmlyc3RFZGdlW2tdIC0gc3RhcnRQb3Nba10pIC9cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbHRhW2tdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHdoaWxlICh0aW1lLnggPCAxIHx8IHRpbWUueSA8IDEpIHtcbiAgICAgIGlmICh0aW1lLnggPCB0aW1lLnkpIHtcbiAgICAgICAgdGltZS54ICs9IHRpbWVTdGVwLng7XG4gICAgICAgIGNlbGwueCArPSBkaXIueDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNlbGwueSArPSBkaXIueTtcbiAgICAgICAgdGltZS55ICs9IHRpbWVTdGVwLnk7XG4gICAgICB9XG4gICAgICBpZiAoY2FsbGJhY2soY2VsbC54LCBjZWxsLnkpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzd2VlcFNjYW4oZ2FtZSwgaW5pdGlhbEVuZHBvaW50LCBzdGFydFBvaW50LCBzd2VlcENvdW50LCBzd2VlcEFuZ2xlLCBjZWxsU2l6ZSwgY29udGV4dCkge1xuICAgIC8vIGxldCBkZWdyZWVUb0N1ckVuZFBvaW50O1xuICAgIGxldCBwb2ludEFycmF5ID0gW107XG4gICAgbGV0IGluaXRpYWxEZWx0YSA9IHRoaXMuZ2V0RGVsdGEoaW5pdGlhbEVuZHBvaW50LngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbEVuZHBvaW50LnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRQb2ludC54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0UG9pbnQueSk7XG4gICAgbGV0IGRlZ1RvSW5pdGlhbEVuZHBvcyA9IHRoaXMuZ2V0VGFyZ2V0RGVncmVlKGluaXRpYWxEZWx0YSk7XG4gICAgbGV0IGRlZ3JlZVRvU3RhcnRTd2VlcCA9IGRlZ1RvSW5pdGlhbEVuZHBvcyArIChzd2VlcEFuZ2xlIC8gMik7XG4gICAgLy8gbGV0IGRlZ3JlZVRvRW5kU3dlZXAgPSBkZWdUb0luaXRpYWxFbmRwb3MgLSBzd2VlcEFuZ2xlO1xuICAgIC8vIGluaXRpYWxEZWx0YSA9IHRoaXMuZGVnVG9Qb3MoZGVncmVlVG9TdGFydFN3ZWVwLCBjb250ZXh0Lmxhc2VyUmFuZ2UpO1xuXG4gICAgLy8gbGV0IGVuZGluZ0VuZFBvcztcbiAgICBsZXQgcmF5QW5nbGVTdGVwID0gc3dlZXBBbmdsZSAvIHN3ZWVwQ291bnQ7XG4gICAgLy8gZGVncmVlVG9DdXJFbmRQb2ludCA9IGRlZ3JlZVRvU3RhcnRTd2VlcDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3dlZXBDb3VudDsgaSsrKSB7XG4gICAgICBsZXQgcmF5QW5nbGUgPSBkZWdyZWVUb1N0YXJ0U3dlZXAgLSByYXlBbmdsZVN0ZXAgKiBpO1xuICAgICAgLy8gbGV0IHh4eCA9IGRlZ3JlZVRvQ3VyRW5kUG9pbnQgPT0gZGVncmVlVG9TdGFydFN3ZWVwO1xuICAgICAgbGV0IGVuZGluZ0RlbHRhID0gdGhpcy5kZWdUb1BvcyhyYXlBbmdsZSwgY29udGV4dC5sYXNlclJhbmdlKTtcbiAgICAgIHRoaXMuZ2V0Rmlyc3RDb2xsaXNpb24oc3RhcnRQb2ludCwgY2VsbFNpemUsIGVuZGluZ0RlbHRhLFxuICAgICAgICAoY2VsbHgsIGNlbGx5KSA9PiB7XG4gICAgICAgICAgbGV0IGdyaWRQb3MgPSAoY2VsbHkgKiBnYW1lLmNvbHMpICsgY2VsbHg7XG4gICAgICAgICAgbGV0IGJsb2NrID0gZ2FtZS5zdGF0aWNHcmlkW2dyaWRQb3NdO1xuICAgICAgICAgIGlmIChibG9jaykge1xuICAgICAgICAgICAgbGV0IGVuZGluZ1Jlc3VsdCA9IHRoaXMuaW50ZXJzZWN0U2VnbWVudEludG9Cb3goXG4gICAgICAgICAgICAgIHN0YXJ0UG9pbnQsIGVuZGluZ0RlbHRhLCBibG9jayk7XG4gICAgICAgICAgICBpZiAoZW5kaW5nUmVzdWx0ICYmIGVuZGluZ1Jlc3VsdC5oaXQpIHtcbiAgICAgICAgICAgICAgbGV0IGVuZGluZ0VuZFBvcyA9IG5ldyBGUFNQb2ludChcbiAgICAgICAgICAgICAgICBlbmRpbmdSZXN1bHQuaGl0UG9zLngsIGVuZGluZ1Jlc3VsdC5oaXRQb3MueSxcbiAgICAgICAgICAgICAgICB0aGlzLmdldERpc3RhbmNlKHN0YXJ0UG9pbnQsIGVuZGluZ1Jlc3VsdC5oaXRQb3MpLFxuICAgICAgICAgICAgICAgICgtc3dlZXBBbmdsZSAvIDIpICsgKHJheUFuZ2xlU3RlcCAqIGkpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgcG9pbnRBcnJheS5wdXNoKGVuZGluZ0VuZFBvcyk7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH19XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcG9pbnRBcnJheTtcbiAgfVxuXG4gIGNoZWNrTmVhcmVzdEhpdChzb3VyY2VBY3Rvciwgc3RhdGljUmVzdWx0LCB0YXJnZXRSZXN1bHQpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIHNvdXJjZVggPSBzb3VyY2VBY3Rvci5jdXJYO1xuICAgIHZhciBzdGF0aWNYID0gc3RhdGljUmVzdWx0LmhpdFBvcy54O1xuICAgIHZhciB0YXJnZXRYID0gdGFyZ2V0UmVzdWx0LmhpdFBvcy54O1xuICAgIHZhciBzb3VyY2VZID0gc291cmNlQWN0b3IuY3VyWTtcbiAgICB2YXIgc3RhdGljWSA9IHN0YXRpY1Jlc3VsdC5oaXRQb3MueTtcbiAgICB2YXIgdGFyZ2V0WSA9IHRhcmdldFJlc3VsdC5oaXRQb3MueTtcblxuICAgIGlmIChzb3VyY2VBY3Rvci5kaXJYID09PSAtMSB8fCBzb3VyY2VBY3Rvci5kaXJYID09PSAxKSB7XG4gICAgICBpZiAoTWF0aC5hYnMoc291cmNlWCAtIHN0YXRpY1gpIDwgTWF0aC5hYnMoc291cmNlWCAtIHRhcmdldFgpKSB7XG4gICAgICAgIHJlc3VsdC50YXJnZXRIaXQgPSBmYWxzZTtcbiAgICAgICAgcmVzdWx0LmVuZFBvcyA9IG5ldyBQb2ludChcbiAgICAgICAgICBzdGF0aWNSZXN1bHQuaGl0UG9zLngsIHN0YXRpY1Jlc3VsdC5oaXRQb3MueSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgIHRhcmdldFJlc3VsdC5oaXRQb3MueCwgdGFyZ2V0UmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzb3VyY2VBY3Rvci5kaXJZID09PSAtMSB8fCBzb3VyY2VBY3Rvci5kaXJZID09PSAxKSB7XG4gICAgICBpZiAoTWF0aC5hYnMoc291cmNlWSAtIHN0YXRpY1kpIDwgTWF0aC5hYnMoc291cmNlWSAtIHRhcmdldFkpKSB7XG4gICAgICAgIHJlc3VsdC50YXJnZXRIaXQgPSBmYWxzZTtcbiAgICAgICAgcmVzdWx0LmVuZFBvcyA9IG5ldyBQb2ludChcbiAgICAgICAgICBzdGF0aWNSZXN1bHQuaGl0UG9zLngsIHN0YXRpY1Jlc3VsdC5oaXRQb3MueSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBvaW50KFxuICAgICAgICAgIHRhcmdldFJlc3VsdC5oaXRQb3MueCwgdGFyZ2V0UmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBnZXRUYXJnZXREZWdyZWUoZGVsdGEpIHtcbiAgICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKGRlbHRhLngsIGRlbHRhLnkpO1xuICAgIHZhciBkZWdyZWUgPSB0aGV0YSAqIFJBRF9UT19ERUc7XG4gICAgaWYgKHRoZXRhIDwgMCkge1xuICAgICAgZGVncmVlICs9IDM2MDtcbiAgICB9XG4gICAgcmV0dXJuIGRlZ3JlZTtcbiAgfVxuXG4gIGRlZ1RvUG9zKGRlZ3JlZSwgcmFkaXVzKSB7XG4gICAgdmFyIHJhZGlhbiA9IGRlZ3JlZSAqIERFR19UT19SQUQ7XG4gICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgIHg6IHJhZGl1cyAqIE1hdGguc2luKHJhZGlhbiksXG4gICAgICB5OiByYWRpdXMgKiBNYXRoLmNvcyhyYWRpYW4pXG4gICAgfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtBY3Rvcn0gZnJvbSAnLi9iZXJ6ZXJrJztcblxuZXhwb3J0IGNsYXNzIEJ1bGxldCBleHRlbmRzIEFjdG9yIHtcbiAgY29uc3RydWN0b3Ioc3RhcnRYLCBzdGFydFksIHNwZWVkLCBkaXJYLCBkaXJZKSB7XG4gICAgdmFyIGltYWdlID0ge3c6IDUsIGg6IDV9O1xuICAgIHN1cGVyKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgMTAwLCBzcGVlZCwgc3BlZWQsIGRpclgsIGRpclkpO1xuICAgIHRoaXMuZGVhdGhUaW1lciA9IDA7XG4gICAgdGhpcy5oZWFkTGFtcEFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5oZWFkTGFtcEFuZ2xlID0gMzYyO1xuICAgIHRoaXMuaGVhZExhbXBQb3dlciA9IDI4MDtcbiAgfVxuXG4gIGRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBnYW1lLmNvbnRleHRGWC5maWxsU3R5bGUgPSAnI0ZGRic7XG4gICAgZ2FtZS5jb250ZXh0RlguZmlsbFJlY3QodGhpcy5jdXJYLCB0aGlzLmN1clksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5kZWF0aFRpbWVyICs9IGVsYXBzZWRUaW1lO1xuICAgIGlmICh0aGlzLmRlYXRoVGltZXIgPj0gMSkge1xuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG53aW5kb3cuRGVhdGhib3QgPSBleHBvcnRzO1xuZXhwb3J0IHtHYW1lfSBmcm9tICcuL2dhbWUnO1xuZXhwb3J0IHtQbGF5ZXJ9IGZyb20gJy4vcGxheWVyJztcbmV4cG9ydCB7TW9uc3Rlcn0gZnJvbSAnLi9tb25zdGVyJztcbmV4cG9ydCB7QnVsbGV0fSBmcm9tICcuL2J1bGxldCc7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgKCkgPT4ge1xuICAvLyBUaGUgRGVhdGhib3QgcHJvcGVydGllcyB3aWxsIGJlIGZpbGxlZCBpbiBieSB0aGUgb3RoZXIgc2NyaXB0cy4gRXZlblxuICAvLyB0aG91Z2ggdGhleSBkb24ndCBsb29rIGxpa2UgdGhleSBleGlzdCBhdCB0aGlzIHBvaW50LCB0aGV5IHdpbGwgYnkgdGhlXG4gIC8vIHRpbWUgdGhlIHdpbmRvdyBsb2FkIGV2ZW50IGhhcyBmaXJlZC5cblxuICB2YXIgY2FudmFzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2RlYXRoYm90Jyk7XG4gIHZhciBjYW52YXNCRyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNiYWNrZ3JvdW5kJyk7XG4gIHZhciBjYW52YXNGUFMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZnBzJyk7XG4gIHZhciBnYW1lID0gd2luZG93LmRlYXRoYm90R2FtZSA9IG5ldyBleHBvcnRzLkdhbWUoXG4gICAgY2FudmFzLCBjYW52YXNCRywgY2FudmFzRlBTLCAnIzExMScpO1xuICBnYW1lLmxvYWRJbWFnZXMoKTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgIGdhbWUub25LZXlEb3duKGV2ZW50KTtcbiAgfSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGV2ZW50KSA9PiB7XG4gICAgZ2FtZS5vbktleVVwKGV2ZW50KTtcbiAgfSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIChldmVudCkgPT4ge1xuICAgIGdhbWUub25Nb3VzZU1vdmUoZXZlbnQpO1xuICB9KTtcblxuICB2YXIgYmx1cnJlZCA9IGZhbHNlO1xuICB2YXIgc2V0Rm9jdXMgPSAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC50eXBlID09PSAnYmx1cicpIHtcbiAgICAgICAgYmx1cnJlZCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LnR5cGUgPT09ICdmb2N1cycpIHtcbiAgICAgICAgYmx1cnJlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBnYW1lLnNldEZvY3VzKGV2ZW50LCBkb2N1bWVudC5oaWRkZW4gfHwgYmx1cnJlZCk7XG4gIH07XG4gIHNldEZvY3VzKCk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgc2V0Rm9jdXMsIHRydWUpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBzZXRGb2N1cywgdHJ1ZSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgc2V0Rm9jdXMsIHRydWUpO1xuXG4gIHZhciByZXNpemVUaW1lb3V0O1xuICB3aW5kb3cub25yZXNpemUgPSAoZXZlbnQpID0+IHtcbiAgICBpZiAocmVzaXplVGltZW91dCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVvdXQpO1xuICAgICAgcmVzaXplVGltZW91dCA9IG51bGw7XG4gICAgfVxuICAgIHJlc2l6ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgcmVzaXplVGltZW91dCA9IG51bGw7XG4gICAgICBnYW1lLm9uUmVzaXplKGV2ZW50KTtcbiAgICB9LCAxMDAwKTtcbiAgfTtcblxuICB2YXIgb2xkRnJhbWVUaW1lID0gKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gMTAwMCk7XG4gIHZhciB0aWNrID0gKCkgPT4ge1xuICAgIHZhciBuZXdGcmFtZVRpbWUgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwKTtcbiAgICB2YXIgZWxhcHNlZFRpbWUgPSBuZXdGcmFtZVRpbWUgLSBvbGRGcmFtZVRpbWU7XG4gICAgb2xkRnJhbWVUaW1lID0gbmV3RnJhbWVUaW1lO1xuICAgIGdhbWUudGljayhlbGFwc2VkVGltZSk7XG4gICAgc2V0VGltZW91dCh0aWNrLCBNYXRoLmZsb29yKDEwMDAgLyBnYW1lLmZyYW1lc1BlclNlY29uZCkpO1xuICB9O1xuICB0aWNrKCk7XG59KTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuLypnbG9iYWxzIFNTOmZhbHNlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7R2FtZSBhcyBCZXJ6ZXJrR2FtZSwgS2V5cywgUGh5c2ljcywgQm94LCBFUFNJTE9OfSBmcm9tICcuL2JlcnplcmsnO1xuaW1wb3J0IHtQbGF5ZXJ9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7TW9uc3Rlcn0gZnJvbSAnLi9tb25zdGVyJztcblxuY29uc3QgREVCVUdfVElMRSA9IDk7XG5leHBvcnQgY29uc3QgTEVWRUxTID0gW1xuICB7XG4gICAgY29sczogMjgsXG4gICAgcm93czogMjgsXG4gICAgZ3JpZDogW1xuICAgICAgMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCxcbiAgICAgIDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwxLDEsMSwxLDEsMSxcbiAgICAgIDEsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDEsXG4gICAgICAxLDAsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMSwxLDEsMSwxLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDEsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDEsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDEsMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsXG4gICAgXVxuICB9XG5dO1xuXG5jb25zdCBDSEFSQUNURVJTID0gW1xuICB7XG4gICAgbmFtZTogJ2RlYXRoYm90JyxcbiAgICBpbWFnZTogJ2ltZy9kZWF0aGJvdC5wbmcnLFxuICAgIGltYWdlVXA6ICdpbWcvZGVhdGhib3RfdXAucG5nJyxcbiAgICBpbWFnZURvd246ICdpbWcvZGVhdGhib3RfZG93bi5wbmcnLFxuICAgIHc6IDQwLFxuICAgIGg6IDUyXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAncGxheWVyJyxcbiAgICBpbWFnZTogJ2ltZy9wbGF5ZXIucG5nJyxcbiAgICB3OiAyOCxcbiAgICBoOiAyOFxuICB9XG5dO1xuXG5leHBvcnQgY2xhc3MgR2FtZSBleHRlbmRzIEJlcnplcmtHYW1lIHtcbiAgY29uc3RydWN0b3IoY2FudmFzLCBjYW52YXNCRywgY2FudmFzRlBTLCBmaWxsU3R5bGUpIHtcbiAgICBzdXBlcihjYW52YXMpO1xuICAgIHRoaXMucGxheWVyRGVhdGhNZXRob2QgPSAnJztcbiAgICB0aGlzLmdhbWVTdGF0ZSA9ICdhdHRyYWN0JzsgLy8gYXR0cmFjdCwgcGxheSwgZGVhZFxuICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgIHRoaXMucm91bmQgPSAyO1xuICAgIHRoaXMubnVtT2ZNb25zdGVycyA9IDA7XG4gICAgdGhpcy5jZWxsV2lkdGggPSAzMjtcbiAgICB0aGlzLmNlbGxIZWlnaHQgPSAzMjtcbiAgICB0aGlzLnRpbGVzID0gbnVsbDtcbiAgICB0aGlzLmNvbHMgPSBMRVZFTFNbMF0uY29scztcbiAgICB0aGlzLnJvd3MgPSBMRVZFTFNbMF0ucm93cztcbiAgICB0aGlzLmdyaWQgPSBMRVZFTFNbMF0uZ3JpZDtcbiAgICB0aGlzLnNwYXduR3JpZCA9IFtdO1xuICAgIHRoaXMuc3RhdGljQmxvY2tzID0gW107XG4gICAgdGhpcy5zdGF0aWNHcmlkID0gW107XG4gICAgdGhpcy5maWxsU3R5bGUgPSBmaWxsU3R5bGU7XG4gICAgdGhpcy5jYW52YXNCRyA9IGNhbnZhc0JHO1xuICAgIHRoaXMuY2FudmFzQkcud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLmNhbnZhc0JHLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNvbnRleHRCRyA9IHRoaXMuY2FudmFzQkcuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIHRoaXMuY2FudmFzRlggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZngnKTtcbiAgICB0aGlzLmNhbnZhc0ZYLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXNGWC5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgdGhpcy5jb250ZXh0RlggPSB0aGlzLmNhbnZhc0ZYLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB0aGlzLmNhbnZhc0ZQUyA9IGNhbnZhc0ZQUztcbiAgICB0aGlzLmNhbnZhc0ZQUy53aWR0aCA9IDQ4MDtcbiAgICB0aGlzLmNhbnZhc0ZQUy5oZWlnaHQgPSAyNDA7XG4gICAgdGhpcy5jb250ZXh0RlBTID0gdGhpcy5jYW52YXNGUFMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAvLyB0aGlzLmNvbnRleHRGWC5maWxsU3R5bGUgPSAncmdiYSgwLCAwLCAwLCAuNTApJztcbiAgICAvLyB0aGlzLmNvbnRleHRGWC5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc0ZYLndpZHRoLCB0aGlzLmNhbnZhc0ZYLmhlaWdodCk7XG4gICAgdGhpcy5tZXNzYWdlVGltZSA9IDEwO1xuXG4gICAgdGhpcy5kZWZpbmVLZXkoJ3N0YXJ0JywgS2V5cy5TUEFDRSk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3VwJywgS2V5cy5VUCk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ2Rvd24nLCBLZXlzLkRPV04pO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdsZWZ0JywgS2V5cy5MRUZUKTtcbiAgICB0aGlzLmRlZmluZUtleSgncmlnaHQnLCBLZXlzLlJJR0hUKTtcbiAgICB0aGlzLmRlZmluZUtleSgnc2hvb3RVcCcsIEtleXMuVyk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3Nob290TGVmdCcsIEtleXMuQSk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3Nob290RG93bicsIEtleXMuUyk7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ3Nob290UmlnaHQnLCBLZXlzLkQpO1xuICB9XG5cbiAgY3JlYXRlU3Bhd25Qb2ludHMoYWN0b3JXaWR0aCwgYWN0b3JIZWlnaHQpIHtcbiAgICBsZXQgc3Bhd25Mb2NhdGlvbnMgPSBbXTtcbiAgICBsZXQgc3Bhd25HcmlkID0gdGhpcy5ncmlkLnNsaWNlKDApO1xuXG4gICAgbGV0IGFjdG9yQmxvY2sgPSB7XG4gICAgICB3OiBNYXRoLmNlaWwoYWN0b3JXaWR0aCAvIHRoaXMuY2VsbFdpZHRoKSxcbiAgICAgIGg6IE1hdGguY2VpbChhY3RvckhlaWdodCAvIHRoaXMuY2VsbEhlaWdodClcbiAgICB9O1xuICAgIGZvciAobGV0IGkgPSAwLCBsaSA9IHRoaXMuZ3JpZC5sZW5ndGg7IGkgPCBsaTsgaSsrKSB7XG4gICAgICBpZiAodGhpcy5ncmlkW2ldID09PSAwKSB7XG4gICAgICAgIGxldCBudW1PZlNwYWNlc05lZWRlZCA9IGFjdG9yQmxvY2sudyAqIGFjdG9yQmxvY2suaDtcbiAgICAgICAgbGV0IG51bU9mRW1wdHlTcGFjZXMgPSAwO1xuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCBhY3RvckJsb2NrLnc7IHJvdysrKSB7XG4gICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgYWN0b3JCbG9jay5oOyBjb2wrKykge1xuICAgICAgICAgICAgbGV0IGN1ckNvbCA9IChpICUgdGhpcy5jb2xzKSArIHJvdztcbiAgICAgICAgICAgIGxldCBjdXJSb3cgPSBNYXRoLmZsb29yKGkgLyB0aGlzLmNvbHMpICsgY29sO1xuICAgICAgICAgICAgbGV0IGluZGV4ID0gKGN1clJvdyAqIHRoaXMuY29scykgKyBjdXJDb2w7XG4gICAgICAgICAgICBpZiAodGhpcy5ncmlkW2luZGV4XSA9PT0gMCkge1xuICAgICAgICAgICAgICBudW1PZkVtcHR5U3BhY2VzKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChudW1PZkVtcHR5U3BhY2VzID09PSBudW1PZlNwYWNlc05lZWRlZCkge1xuICAgICAgICAgIHNwYXduTG9jYXRpb25zLnB1c2goaSk7XG4gICAgICAgICAgc3Bhd25HcmlkW2ldID0gREVCVUdfVElMRTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNwYXduR3JpZCA9IHNwYXduR3JpZDtcbiAgICByZXR1cm4gc3Bhd25Mb2NhdGlvbnM7XG4gIH1cblxuICByYW5kb21pemVTcGF3bnMoKSB7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGlmICghKGFjdG9yIGluc3RhbmNlb2YgTW9uc3RlcikpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYWN0b3Iuc3Bhd25Qb2ludHMgPSB0aGlzLmNyZWF0ZVNwYXduUG9pbnRzKGFjdG9yLndpZHRoLCBhY3Rvci5oZWlnaHQpO1xuICAgICAgbGV0IHNwYXduSW5kZXggPSBhY3Rvci5zcGF3blBvaW50c1tcbiAgICAgIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFjdG9yLnNwYXduUG9pbnRzLmxlbmd0aCldO1xuICAgICAgbGV0IHNwYXduWFkgPSB0aGlzLmNhbGNHcmlkWFkoc3Bhd25JbmRleCk7XG4gICAgICBhY3Rvci5jdXJYID0gc3Bhd25YWS54MSArIEVQU0lMT047XG4gICAgICBhY3Rvci5jdXJZID0gc3Bhd25YWS55MSArIEVQU0lMT047XG4gICAgfSx0aGlzKTtcbiAgfVxuXG4gIGNhbGNHcmlkWFkoZ3JpZEluZGV4KSB7XG4gICAgbGV0IGN1clJvdywgY3VyQ29sLCBncmlkWDEsIGdyaWRYMiwgZ3JpZFkxLCBncmlkWTI7XG4gICAgbGV0IHJlc3VsdCA9IHt4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMH07XG4gICAgY3VyQ29sID0gZ3JpZEluZGV4ICUgdGhpcy5jb2xzO1xuICAgIGN1clJvdyA9IE1hdGguZmxvb3IoZ3JpZEluZGV4IC8gdGhpcy5jb2xzKTtcbiAgICBncmlkWDEgPSBjdXJDb2wgKiB0aGlzLmNlbGxXaWR0aDtcbiAgICBncmlkWTEgPSBjdXJSb3cgKiB0aGlzLmNlbGxIZWlnaHQ7XG4gICAgZ3JpZFgyID0gZ3JpZFgxICsgdGhpcy5jZWxsV2lkdGg7XG4gICAgZ3JpZFkyID0gZ3JpZFkxICsgdGhpcy5jZWxsSGVpZ2h0O1xuICAgIHJlc3VsdCA9IHt4MTogZ3JpZFgxLCB5MTogZ3JpZFkxLCB4MjogZ3JpZFgyLCB5MjogZ3JpZFkyfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gTG9vcHMgdGhyb3VnaCBBY3RvciBhcnJheSBhbmQgY3JlYXRlcyBjYWxsYWJsZSBpbWFnZXMuXG4gIGxvYWRJbWFnZXMoKSB7XG4gICAgc3VwZXIubG9hZEltYWdlcyhDSEFSQUNURVJTLFxuICAgICAge3RpbGVzOiAnaW1nL3RpbGVzLnBuZyd9KTtcbiAgfVxuXG4gIGVhY2hBY3RvcihjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGZvciAobGV0IGMgaW4gdGhpcy5hY3RvcnMpIHtcbiAgICAgIGlmICh0aGlzLmFjdG9ycy5oYXNPd25Qcm9wZXJ0eShjKSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuYWN0b3JzW2NdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplKGVsYXBzZWRUaW1lKSB7XG4gICAgc3VwZXIuaW5pdGlhbGl6ZShlbGFwc2VkVGltZSk7XG5cbiAgICB0aGlzLmRyYXdCYWNrZ3JvdW5kKGVsYXBzZWRUaW1lKTtcbiAgICB0aGlzLnN0YXRpY0Jsb2NrcyA9IFtdO1xuICAgIHRoaXMuc3RhdGljR3JpZCA9IFtdO1xuICAgIHRoaXMucGh5c2ljcyA9IG5ldyBQaHlzaWNzKHRoaXMpO1xuICAgIHRoaXMuYWN0b3JzID0ge1xuICAgICAgLy9pbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCwgZGlyWVxuICAgICAgcGxheWVyOiBuZXcgUGxheWVyKFxuICAgICAgICB0aGlzLmltYWdlcy5wbGF5ZXIsIDg1LCA0NTQsIDEwMCwgMTUwLCAxNTAsIDEsIDEpLFxuICAgICAgZGVhdGhib3QxOiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDI1MCwgNTAwLCAxMDAsIDEwMCwgMTAwLCAtMSwgMSksXG4gICAgICBkZWF0aGJvdDM6IG5ldyBNb25zdGVyKFxuICAgICAgICB0aGlzLmltYWdlcy5kZWF0aGJvdCwgMTIwLCAxMTAsIDMwMCwgMTEwLCAxMTUsIDEsIDEpLFxuICAgICAgZGVhdGhib3Q0OiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDMwMCwgMjAwLCAxMDAsIDIwMCwgMjAwLCAtMSwgLTEpLFxuICAgICAgZGVhdGhib3Q1OiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDUwMCwgNDAwLCAxMDAsIDIwMCwgMjAwLCAxLCAxKVxuICAgIH07XG5cbiAgICB0aGlzLm51bU9mTW9uc3RlcnMgPSAwO1xuICAgIHRoaXMucGxheWVyRGVhdGhNZXRob2QgPSAnJztcbiAgICB0aGlzLnJvdW5kID0gMjtcbiAgICB0aGlzLnNjb3JlID0gMDtcblxuICAgIHRoaXMuZWFjaEFjdG9yKChhY3RvcikgPT4ge1xuICAgICAgaWYgKGFjdG9yIGluc3RhbmNlb2YgTW9uc3Rlcikge1xuICAgICAgICB0aGlzLm51bU9mTW9uc3RlcnMrKztcbiAgICAgIH1cbiAgICAgIGFjdG9yLmFjdGl2ZSA9IHRydWU7XG4gICAgICBhY3Rvci5oZWFsdGggPSAxMDA7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSB0aGlzLmdyaWQubGVuZ3RoOyBsaSA+IGk7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZ3JpZFtpXSkge1xuICAgICAgICBsZXQgYmxvY2tYWSA9IHRoaXMuY2FsY0dyaWRYWShpKTtcbiAgICAgICAgbGV0IGJsb2NrID0gbmV3IEJveChcbiAgICAgICAgICBibG9ja1hZLngxLCBibG9ja1hZLnkxLCB0aGlzLmNlbGxXaWR0aCwgdGhpcy5jZWxsSGVpZ2h0KTtcbiAgICAgICAgdGhpcy5zdGF0aWNCbG9ja3MucHVzaChibG9jayk7XG4gICAgICAgIHRoaXMuc3RhdGljR3JpZC5wdXNoKGJsb2NrKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc3RhdGljR3JpZC5wdXNoKG51bGwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmFuZG9taXplU3Bhd25zKCk7XG4gIH1cblxuICBsZWFkZXJib2FyZCgpIHtcbiAgICBsZXQgeVBvcyA9IDYwO1xuICAgIGxldCB4UG9zID0gOTQwO1xuICAgIC8vIGlmIChTUy5jdXJyZW50U2NvcmVzKSB7XG4gICAgLy8gICB0aGlzLmRyYXdTY29yZXMoJyoqKioqIEhpIFNjb3JlcyAqKioqKicsIHlQb3MsIHhQb3MsIDIwKTtcbiAgICAvLyAgIHlQb3MgKz0gMzA7XG4gICAgLy8gICBsZXQgbGIgPSBTUy5jdXJyZW50U2NvcmVzO1xuICAgIC8vICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYi5sZW5ndGg7IGkrKykge1xuICAgIC8vICAgICB0aGlzLmRyYXdTY29yZXMobGJbaV0ubmFtZSArICcgICcgKyAgbGJbaV0uc2NvcmUsIHlQb3MsIHhQb3MsIDIwKTtcbiAgICAvLyAgICAgeVBvcyArPSAzMDtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG4gIH1cblxuICBkcmF3KGVsYXBzZWRUaW1lKSB7XG4gICAgdGhpcy5jb250ZXh0RlguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgIHN1cGVyLmRyYXcoZWxhcHNlZFRpbWUpO1xuXG4gICAgdGhpcy5kcmF3U2NvcmUoKTtcblxuICAgIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2F0dHJhY3QnKSB7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdEZWF0aGJvdCA1MDAwJywgMTIwKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ1dBU0QgdG8gU2hvb3QnLCAxODApO1xuICAgICAgdGhpcy5kcmF3TWVzc2FnZSgnQXJyb3cgS2V5cyB0byBNb3ZlJywgMjIwKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ1ByZXNzIFNwYWNlIHRvIEJlZ2luJywgMjYwKTtcbiAgICAgIHRoaXMubGVhZGVyYm9hcmQoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuZ2FtZVN0YXRlID09PSAnZGVhZCcpIHtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ1Rob3UgYXJ0ICcgKyB0aGlzLnBsYXllckRlYXRoTWV0aG9kKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ1ByZXNzIFNwYWNlIHRvIFN0YXJ0IGFnYWluJywgMjQwKTtcbiAgICAgIHRoaXMubGVhZGVyYm9hcmQoKTtcbiAgICB9XG4gIH1cblxuICBkcmF3QmFja2dyb3VuZChlbGFwc2VkVGltZSkge1xuICAgIGxldCBiZ0NvbG9yO1xuICAgIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2F0dHJhY3QnKSB7XG4gICAgICBiZ0NvbG9yID0gJ1B1cnBsZSc7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2RlYWQnKSB7XG4gICAgICBiZ0NvbG9yID0gJ3JlZCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJnQ29sb3IgPSB0aGlzLmZpbGxTdHlsZTtcbiAgICB9XG4gICAgdGhpcy5jb250ZXh0QkcuZmlsbFN0eWxlID0gYmdDb2xvcjtcbiAgICB0aGlzLmNvbnRleHRCRy5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc0JHLndpZHRoLCB0aGlzLmNhbnZhc0JHLmhlaWdodCk7XG4gICAgdGhpcy5kcmF3R3JpZCh0aGlzLmdyaWQpO1xuICAgIGlmICh0aGlzLmRlYnVnTW9kZSkge1xuICAgICAgdGhpcy5kcmF3R3JpZCh0aGlzLnNwYXduR3JpZCk7XG4gICAgfVxuICB9XG5cbiAgZHJhd0dyaWQoZ3JpZCkge1xuICAgIGxldCBncmlkUG9zWCA9IDAsIGdyaWRQb3NZID0gMDtcbiAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCB0aGlzLnJvd3M7IHJvdysrKSB7XG4gICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCB0aGlzLmNvbHM7IGNvbCsrKSB7XG4gICAgICAgIGxldCBpbmRleCA9IChyb3cgKiB0aGlzLmNvbHMpICsgY29sO1xuICAgICAgICBncmlkUG9zWCA9IGNvbCAqIHRoaXMuY2VsbFdpZHRoO1xuICAgICAgICBncmlkUG9zWSA9IHJvdyAqIHRoaXMuY2VsbEhlaWdodDtcblxuICAgICAgICBpZiAoZ3JpZFtpbmRleF0pIHtcbiAgICAgICAgICB0aGlzLmNvbnRleHRCRy5kcmF3SW1hZ2UodGhpcy50aWxlcywgZ3JpZFtpbmRleF0gKlxuICAgICAgICAgIHRoaXMuY2VsbFdpZHRoLCAwLCB0aGlzLmNlbGxXaWR0aCwgdGhpcy5jZWxsSGVpZ2h0LFxuICAgICAgICAgIGdyaWRQb3NYLCBncmlkUG9zWSwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyaWRbaW5kZXhdID09PSBERUJVR19USUxFKSB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0Qkcuc3Ryb2tlU3R5bGUgPSAncmVkJztcbiAgICAgICAgICB0aGlzLmNvbnRleHRCRy5zdHJva2VSZWN0KGdyaWRQb3NYLCBncmlkUG9zWSwgdGhpcy5jZWxsV2lkdGgsXG4gICAgICAgICAgICB0aGlzLmNlbGxIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZHJhd0xvYWRpbmcoKSB7XG4gICAgdGhpcy5jb250ZXh0QkcuZmlsbFN0eWxlID0gJyNjY2MnO1xuICAgIHRoaXMuY29udGV4dEJHLmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzQkcud2lkdGgsIHRoaXMuY2FudmFzQkcuaGVpZ2h0KTtcbiAgfVxuXG4gIGRyYXdNZXNzYWdlKG1lc3NhZ2UsIHlQb3MsIHNpemUpIHtcbiAgICBsZXQgcG9zID0gdGhpcy5jYW52YXMud2lkdGggLyAyO1xuICAgIHlQb3MgPSB5UG9zIHx8IDIwMDtcbiAgICBzaXplID0gc2l6ZSB8fCAyNTtcbiAgICB0aGlzLmNvbnRleHQuZm9udCA9IHNpemUgKyAncHggVmVyZGFuYSc7XG4gICAgbGV0IG1ldHJpY3MgPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQobWVzc2FnZSk7XG4gICAgbGV0IHdpZHRoID0gbWV0cmljcy53aWR0aDtcbiAgICBsZXQgbWVzc2FnZVggPSBwb3MgLSB3aWR0aCAvIDI7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxUZXh0KG1lc3NhZ2UsIG1lc3NhZ2VYLCB5UG9zKTtcbiAgfVxuXG4gZHJhd1Njb3JlcyhtZXNzYWdlLCB5UG9zLCB4UG9zLCBzaXplKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB5UG9zID0geVBvcyB8fCAyMDA7XG4gICAgc2l6ZSA9IHNpemUgfHwgMjU7XG4gICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzaXplICsgJ3B4IFZlcmRhbmEnO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChtZXNzYWdlLCB4UG9zLCB5UG9zKTtcbiAgfVxuXG4gIGRyYXdTY29yZSgpIHtcbiAgICBsZXQgcG9zID0gdGhpcy5jYW52YXMud2lkdGggLyAyO1xuICAgIHRoaXMuY29udGV4dC5mb250ID0gJzI1cHggVmVyZGFuYSc7XG4gICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XG4gICAgbGV0IHNjb3JlVGV4dCA9ICdHQU1FOiAnICsgdGhpcy5zY29yZTtcbiAgICBsZXQgbWV0cmljcyA9IHRoaXMuY29udGV4dC5tZWFzdXJlVGV4dChzY29yZVRleHQpO1xuICAgIGxldCB3aWR0aCA9IG1ldHJpY3Mud2lkdGg7XG4gICAgbGV0IHNjb3JlWCA9IHBvcyAtICh3aWR0aCAvIDIpO1xuICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChzY29yZVRleHQsIHNjb3JlWCwgMjUpO1xuICB9XG5cbiAgdXBkYXRlKGVsYXBzZWRUaW1lKSB7XG4gICAgc3VwZXIudXBkYXRlKGVsYXBzZWRUaW1lKTtcblxuICAgIGlmICh0aGlzLmtleURvd24uc3RhcnQgJiYgdGhpcy5nYW1lU3RhdGUgIT09ICdwbGF5Jykge1xuICAgICAgdGhpcy5nYW1lU3RhdGUgPSAncGxheSc7XG4gICAgICBjb25zb2xlLmxvZygnR2FtZSBTdGFydCcpO1xuICAgICAgdGhpcy5yYW5kb21pemVTcGF3bnMoKTtcbiAgICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5udW1PZk1vbnN0ZXJzID09PSAwICYmIHRoaXMuaW5pdGlhbGl6ZWQpIHsgLy8gWW91IGJlYXQgYWxsIG1vbnN0ZXJzXG4gICAgICB0aGlzLnJhbmRvbWl6ZVNwYXducygpO1xuICAgICAgaWYgKHRoaXMubWVzc2FnZVRpbWUgPiAwKSB7IC8vIHNob3cgbmV4dCByb3VuZCBtZXNzYWdlXG4gICAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ1JvdW5kICcgKyB0aGlzLnJvdW5kKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlVGltZSAtPSBlbGFwc2VkVGltZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMubWVzc2FnZVRpbWUgPSAxMDtcbiAgICAgICAgdGhpcy5yb3VuZCsrO1xuICAgICAgICB0aGlzLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgICAgIGlmIChhY3RvciBpbnN0YW5jZW9mIE1vbnN0ZXIpIHtcbiAgICAgICAgICAgIHRoaXMubnVtT2ZNb25zdGVycysrO1xuICAgICAgICAgICAgYWN0b3IuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgIGFjdG9yLmFscGhhID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7QWN0b3IsIFBoeXNpY3MsIFBvaW50LCBEaXJlY3Rpb25zfSBmcm9tICcuL2JlcnplcmsnO1xuaW1wb3J0IHtQbGF5ZXJ9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7QnVsbGV0fSBmcm9tICcuL2J1bGxldCc7XG5cbmV4cG9ydCBjbGFzcyBNb25zdGVyIGV4dGVuZHMgQWN0b3Ige1xuICBjb25zdHJ1Y3RvcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCwgZGlyWSkge1xuICAgIC8vIHN1cGVyKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYKTtcbiAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgIHRoaXMuZGlyVGltZXIgPSAwO1xuICAgIHRoaXMuaXNGaXJpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmxhc2VyRGVsdGEgPSB7fTtcbiAgICB0aGlzLmxhc2VyUmFuZ2UgPSAxMjAwO1xuICAgIHRoaXMubGFzZXJTdGFydCA9IHt9O1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDE0fTtcbiAgICB0aGlzLmhlYWRMYW1wQWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBkcmF3KGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgICBzdXBlci5kcmF3KGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICAgIGlmIChnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgICBnYW1lLmNvbnRleHQuZm9udCA9ICcxNnB4IFZlcmRhbmEnO1xuICAgICAgICBnYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gJ3JlZCc7XG4gICAgICAgIGdhbWUuY29udGV4dC5maWxsVGV4dCgnTW9uc3RlcicsXG4gICAgICAgICAgdGhpcy5jdXJYICsgKHRoaXMud2lkdGggLyA0KSxcbiAgICAgICAgICB0aGlzLmN1clkgLSAxMCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmFscGhhID49IDAuMSkge1xuICAgICAgdGhpcy5hbHBoYSAtPSAwLjE7XG4gICAgICBnYW1lLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSB0aGlzLmFscGhhO1xuICAgICAgc3VwZXIuZHJhdyhnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgICBnYW1lLmNvbnRleHQuZ2xvYmFsQWxwaGEgPSAxO1xuICAgIH1cbiAgfVxuXG4gIGZpcmVMYXNlcihnYW1lLCBwbGF5ZXIpIHtcbiAgICBsZXQgbGFzZXJFbmRwb2ludCA9IHtcbiAgICAgIHg6IHRoaXMubGFzZXJTdGFydC54ICsgdGhpcy5sYXNlckRlbHRhLngsXG4gICAgICB5OiB0aGlzLmxhc2VyU3RhcnQueSArIHRoaXMubGFzZXJEZWx0YS55XG4gICAgfTtcbiAgICBsZXQgdGFyZ2V0ID0gW107XG4gICAgbGV0IHRhcmdldE9iaiA9IHt9O1xuICAgIHRhcmdldE9iai54ID0gcGxheWVyLmN1clggKyA1O1xuICAgIHRhcmdldE9iai55ID0gcGxheWVyLmN1clk7XG4gICAgdGFyZ2V0T2JqLncgPSAxNTtcbiAgICB0YXJnZXRPYmouaCA9ICAxNTtcbiAgICB0YXJnZXQucHVzaCh0YXJnZXRPYmopO1xuICAgIGxldCB0YXJnZXREZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShcbiAgICAgIHRoaXMubGFzZXJTdGFydC54LCB0aGlzLmxhc2VyU3RhcnQueSwgdGFyZ2V0T2JqLngsIHRhcmdldE9iai55KTtcbiAgICB0aGlzLmZpcmluZyA9IHRydWU7XG4gICAgdGhpcy5tb3ZpbmcgPSBmYWxzZTtcblxuICAgIGxldCBibG9ja1Jlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgdGhpcy5sYXNlclN0YXJ0LCB0aGlzLmxhc2VyRGVsdGEsIGdhbWUuc3RhdGljQmxvY2tzKTtcbiAgICBsZXQgdGFyZ2V0UmVzdWx0ID0gZ2FtZS5waHlzaWNzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoXG4gICAgICB0aGlzLmxhc2VyU3RhcnQsIHRoaXMubGFzZXJEZWx0YSwgdGFyZ2V0KTtcblxuICAgIGxldCBlbmRQb3M7IGxldCB0YXJnZXRIaXQ7XG4gICAgaWYgKChibG9ja1Jlc3VsdCAmJiBibG9ja1Jlc3VsdC5oaXQpICYmXG4gICAgICAgICh0YXJnZXRSZXN1bHQgJiYgdGFyZ2V0UmVzdWx0LmhpdCkpIHtcbiAgICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3MuY2hlY2tOZWFyZXN0SGl0KHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja1Jlc3VsdCwgdGFyZ2V0UmVzdWx0KTtcbiAgICAgIGVuZFBvcyA9IHJlc3VsdC5lbmRQb3M7XG4gICAgICB0YXJnZXRIaXQgPSByZXN1bHQudGFyZ2V0SGl0O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYmxvY2tSZXN1bHQgJiYgYmxvY2tSZXN1bHQuaGl0KSB7XG4gICAgICAgIC8vIHVwZGF0ZSBlbmQgcG9zIHdpdGggaGl0IHBvc1xuICAgICAgICBlbmRQb3MgPSBuZXcgUG9pbnQoYmxvY2tSZXN1bHQuaGl0UG9zLngsXG4gICAgICAgICAgYmxvY2tSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICBnYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAncmVkJztcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0UmVzdWx0ICYmIHRhcmdldFJlc3VsdC5oaXQpIHtcbiAgICAgICAgZW5kUG9zID0gbmV3IFBvaW50KHRhcmdldFJlc3VsdC5oaXRQb3MueCxcbiAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICB0YXJnZXRIaXQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW5kUG9zID0gbmV3IFBvaW50KGxhc2VyRW5kcG9pbnQueCwgbGFzZXJFbmRwb2ludC55KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgZGVnVG9FbmRwb3MgPSBnYW1lLnBoeXNpY3MuZ2V0VGFyZ2V0RGVncmVlKHRoaXMubGFzZXJEZWx0YSk7XG4gICAgbGV0IGRlZ1RvVGFyZ2V0ID0gZ2FtZS5waHlzaWNzLmdldFRhcmdldERlZ3JlZSh0YXJnZXREZWx0YSk7XG5cbiAgICBnYW1lLmNvbnRleHRGWC5iZWdpblBhdGgoKTtcbiAgICBnYW1lLmNvbnRleHRGWC5tb3ZlVG8odGhpcy5sYXNlclN0YXJ0LngsIHRoaXMubGFzZXJTdGFydC55KTtcbiAgICBnYW1lLmNvbnRleHRGWC5saW5lVG8oZW5kUG9zLngsIGVuZFBvcy55KTtcbiAgICBnYW1lLmNvbnRleHRGWC5jbG9zZVBhdGgoKTtcbiAgICBnYW1lLmNvbnRleHRGWC5zdHJva2VTdHlsZSA9IHRhcmdldFJlc3VsdCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFJlc3VsdC5oaXQgPyAncmVkJyA6ICdibHVlJztcbiAgICBnYW1lLmNvbnRleHRGWC5zdHJva2UoKTtcblxuICAgIGlmICghdGFyZ2V0SGl0KSB7XG4gICAgICBsZXQgbmV3RGVncmVlO1xuICAgICAgaWYgKHRoaXMuZGlyWSA9PT0gMSkge1xuICAgICAgICBpZiAoZGVnVG9FbmRwb3MgPCAxODApIHtcbiAgICAgICAgICBkZWdUb0VuZHBvcyArPSAzNjA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZ1RvVGFyZ2V0IDwgMTgwKSB7XG4gICAgICAgICAgZGVnVG9UYXJnZXQgKz0gMzYwO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZGVnVG9FbmRwb3MgPiBkZWdUb1RhcmdldCkge1xuICAgICAgICBpZiAoZGVnVG9FbmRwb3MgLSBkZWdUb1RhcmdldCA+IDYpIHtcbiAgICAgICAgICBuZXdEZWdyZWUgPSBkZWdUb0VuZHBvcyAtIDM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgLSAwLjU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXNlckRlbHRhID0gZ2FtZS5waHlzaWNzLmRlZ1RvUG9zKG5ld0RlZ3JlZSwgdGhpcy5sYXNlclJhbmdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkZWdUb1RhcmdldCAtIGRlZ1RvRW5kcG9zID4gNikge1xuICAgICAgICAgIG5ld0RlZ3JlZSA9IGRlZ1RvRW5kcG9zICsgMztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdEZWdyZWUgPSBkZWdUb0VuZHBvcyArIDAuNTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc2VyRGVsdGEgPSBnYW1lLnBoeXNpY3MuZGVnVG9Qb3MobmV3RGVncmVlLCB0aGlzLmxhc2VyUmFuZ2UpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWdhbWUuZGVidWdNb2RlKSB7XG4gICAgICAgIHBsYXllci5yZWNvdmVyeVRpbWVyID0gMDtcbiAgICAgICAgcGxheWVyLmhlYWx0aCAtPSAyO1xuICAgICAgICBnYW1lLnBsYXllckRlYXRoTWV0aG9kID0gJ2JsaW5kJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBzdXBlci51cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIHRoaXMubGFzZXJTdGFydCA9IHtcbiAgICAgIHg6IHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gMiksXG4gICAgICB5OiB0aGlzLmN1clkgKyAxNFxuICAgIH07XG4gICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3JlZCc7XG4gICAgdGhpcy5kaXJUaW1lciAtPSBlbGFwc2VkVGltZTtcbiAgICBpZiAodGhpcy5kaXJUaW1lciA8PSAwICYmICF0aGlzLmZpcmluZykge1xuICAgICAgdGhpcy5tb3ZpbmcgPSBCb29sZWFuKGdhbWUuZ2V0UmFuZG9tKDAsIDEpKTtcbiAgICAgIHRoaXMuZGlyVGltZXIgPSBnYW1lLmdldFJhbmRvbSgyLCA0KTtcbiAgICAgIGxldCBuZXh0RGlyZWN0aW9uID0gZ2FtZS5nZXRSYW5kb20oMCwgMyk7XG4gICAgICB0aGlzLmRpclggPSBEaXJlY3Rpb25zLmRpcmVjdGlvbnNbbmV4dERpcmVjdGlvbl0ueDtcbiAgICAgIHRoaXMuZGlyWSA9IERpcmVjdGlvbnMuZGlyZWN0aW9uc1tuZXh0RGlyZWN0aW9uXS55O1xuICAgIH1cbiAgICB0aGlzLnZpc2libGVBY3RvcnMgPSAwO1xuICAgIHRoaXMuZWFjaFZpc2libGVBY3RvcihnYW1lLCBQbGF5ZXIsIGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgdGhpcy52aXNpYmxlQWN0b3JzICs9IDE7XG4gICAgICB0aGlzLmRlYnVnQ29sb3IgPSAnd2hpdGUnO1xuXG4gICAgICBpZiAoIXRoaXMuZmlyaW5nKSB7IC8vIHNldCB0aGUgaW5pdGlhbCBzdGFydGluZyBwb2ludCBmb3IgdGhlIGxhc2VyXG4gICAgICAgIGxldCBsYXNlckVuZHBvaW50O1xuICAgICAgICBpZiAodGhpcy5kaXJYID09PSAtMSB8fCB0aGlzLmRpclggPT09IDEpIHtcbiAgICAgICAgICBsYXNlckVuZHBvaW50ID0ge1xuICAgICAgICAgICAgeDogKHRoaXMubGFzZXJTdGFydC54ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpclgsXG4gICAgICAgICAgICB5OiB0aGlzLmxhc2VyU3RhcnQueVxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5kaXJZID09PSAtMSB8fCB0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgICBsYXNlckVuZHBvaW50ID0ge1xuICAgICAgICAgICAgeDogdGhpcy5sYXNlclN0YXJ0LngsXG4gICAgICAgICAgICB5OiAodGhpcy5sYXNlclN0YXJ0LnkgKyB0aGlzLmxhc2VyUmFuZ2UpICogLXRoaXMuZGlyWVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sYXNlckRlbHRhID0gZ2FtZS5waHlzaWNzLmdldERlbHRhKFxuICAgICAgICAgIGxhc2VyRW5kcG9pbnQueCwgbGFzZXJFbmRwb2ludC55LCB0aGlzLmxhc2VyU3RhcnQueCxcbiAgICAgICAgICB0aGlzLmxhc2VyU3RhcnQueSk7XG4gICAgICB9XG4gICAgICB0aGlzLmZpcmVMYXNlcihnYW1lLCBwbGF5ZXIpO1xuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMudmlzaWJsZUFjdG9ycyA9PT0gMCkge1xuICAgICAgdGhpcy5sYXNlckVuZHBvaW50ID0gbnVsbDtcbiAgICAgIHRoaXMuZmlyaW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5lYWNoT3ZlcmxhcHBpbmdBY3RvcihnYW1lLCBCdWxsZXQsIGZ1bmN0aW9uKGJ1bGxldCkge1xuICAgICAgYnVsbGV0LmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ2dyZWVuJztcbiAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICBnYW1lLm51bU9mTW9uc3RlcnMtLTtcbiAgICAgIGdhbWUuc2NvcmUrKztcbiAgICB9KTtcbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4vKmdsb2JhbHMgU1M6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0ICogYXMgZGVhdGhib3QgZnJvbSAnLi9kZWF0aGJvdCc7XG5pbXBvcnQge0FjdG9yLCBQaHlzaWNzLCBCb3gsIFBvaW50LCBMRVZFTFN9IGZyb20gJy4vYmVyemVyayc7XG5pbXBvcnQge0J1bGxldH0gZnJvbSAnLi9idWxsZXQnO1xuXG5leHBvcnQgY2xhc3MgUGxheWVyIGV4dGVuZHMgQWN0b3J7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICB0aGlzLmhlYWx0aCA9IDEwMDtcbiAgICB0aGlzLnJlY292ZXJ5VGltZXIgPSAyO1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDEwfTtcbiAgICB0aGlzLmhlYWRMYW1wQWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmhlYWRMYW1wQW5nbGUgPSAzNjI7XG4gICAgdGhpcy5oZWFkTGFtcFBvd2VyID0gMjgwO1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmIChnYW1lLmdhbWVTdGF0ZSAhPT0gJ2F0dHJhY3QnKSB7XG4gICAgICBzdXBlci5kcmF3KGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnVsbGV0KSB7XG4gICAgICB0aGlzLmJ1bGxldC5kcmF3KGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICB9XG4gICAgLy8gbGV0IGhlYWx0aFZpcyA9ICgoMTAwIC0gdGhpcy5oZWFsdGgpIC8gMTAwKTtcbiAgICAvLyBnYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsJyArIGhlYWx0aFZpcyArICcpJztcbiAgICAvLyBnYW1lLmNvbnRleHQuZmlsbFJlY3QoMCwgMCwgZ2FtZS5jYW52YXMud2lkdGgsIGdhbWUuY2FudmFzLmhlaWdodCk7XG4gICAgdGhpcy5kcmF3RlBTKGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XG4gICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgZ2FtZS5nYW1lU3RhdGUgPSAnZGVhZCc7XG4gICAgICBjb25zb2xlLmxvZygnREVBRCEnKTtcbiAgICAgIGlmICh0aGlzLmJ1bGxldCAmJiB0aGlzLmJ1bGxldC5hY3RpdmUpIHtcbiAgICAgICAgdGhpcy5idWxsZXQgPSBudWxsO1xuICAgICAgICBkZWxldGUgZ2FtZS5hY3RvcnMucGxheWVyQnVsbGV0O1xuICAgICAgfVxuICAgICAgLy8gbGV0IGxvd2VzdFNjb3JlID0gU1MuY3VycmVudFNjb3JlcyAmJiBTUy5jdXJyZW50U2NvcmVzLmxlbmd0aCA/XG4gICAgICAvLyAgIFNTLmN1cnJlbnRTY29yZXNbU1MuY3VycmVudFNjb3Jlcy5sZW5ndGggLSAxXS5zY29yZSA6IDA7XG4gICAgICAvLyBpZiAoZ2FtZS5zY29yZSA+IGxvd2VzdFNjb3JlKSB7XG4gICAgICAvLyAgIGxldCBwbGF5ZXJOYW1lID0gcHJvbXB0KCdQbGVhc2UgRW50ZXIgeW91ciBOYW1lLicpO1xuICAgICAgLy8gICBTUy5zdWJtaXRTY29yZShwbGF5ZXJOYW1lLCBnYW1lLnNjb3JlKTtcbiAgICAgIC8vICAgZGVhdGhib3Quc2NvcmVzID0gU1MuZ2V0U2NvcmVzKDgpO1xuICAgICAgLy8gfVxuICAgIH1cblxuICAgIGlmIChnYW1lLmdhbWVTdGF0ZSA9PT0gJ2F0dHJhY3QnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBkaXJYID0gMDtcbiAgICBsZXQgZGlyWSA9IDA7XG4gICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ2JsdWUnO1xuXG4gICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICdibGFjayc7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGVhbHRoIDwgMTAwKSB7XG4gICAgICBpZiAodGhpcy5yZWNvdmVyeVRpbWVyID4gMSkge1xuICAgICAgICB0aGlzLmhlYWx0aCArPSAyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZWNvdmVyeVRpbWVyICs9IGVsYXBzZWRUaW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChnYW1lLmtleURvd24udXApIHtcbiAgICAgIGRpclkgPSAtMTtcbiAgICAgIHRoaXMuZGlyWCA9IDA7XG4gICAgICB0aGlzLmRpclkgPSBkaXJZO1xuICAgIH1cbiAgICBpZiAoZ2FtZS5rZXlEb3duLmRvd24pIHtcbiAgICAgIGRpclkgPSAxO1xuICAgICAgdGhpcy5kaXJYID0gMDtcbiAgICAgIHRoaXMuZGlyWSA9IGRpclk7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24ubGVmdCkge1xuICAgICAgZGlyWCA9IC0xO1xuICAgICAgdGhpcy5kaXJZID0gMDtcbiAgICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24ucmlnaHQpIHtcbiAgICAgIGRpclggPSAxO1xuICAgICAgdGhpcy5kaXJZID0gMDtcbiAgICAgIHRoaXMuZGlyWCA9IGRpclg7XG4gICAgfVxuICAgIGlmICh0aGlzLmJ1bGxldCkge1xuICAgICAgLy8gY2hlY2sgd2hldGhlciBidWxsZXQgaXMgc3RpbGwgYWN0aXZlXG4gICAgICBpZiAoIXRoaXMuYnVsbGV0LmFjdGl2ZSkge1xuICAgICAgICB0aGlzLmJ1bGxldCA9IG51bGw7XG4gICAgICAgIGRlbGV0ZSBnYW1lLmFjdG9ycy5wbGF5ZXJCdWxsZXQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RVcCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMCwgLTEpO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdERvd24pIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIDAsIDEpO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdExlZnQpIHtcbiAgICAgICAgdGhpcy5maXJlQnVsbGV0KGdhbWUsIC0xLCAwKTtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmtleURvd24uc2hvb3RSaWdodCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMSwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRpclggPT09IC0xICYmIHRoaXMuZmFjaW5nICE9PSAnbGVmdCcpIHtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSB0aGlzLmltYWdlLnJldjtcbiAgICAgIHRoaXMuZmFjaW5nID0gJ2xlZnQnO1xuICAgIH1cblxuICAgIGlmIChkaXJYID09PSAxICYmIHRoaXMuZmFjaW5nICE9PSAncmlnaHQnKSB7XG4gICAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5pbWFnZTtcbiAgICAgIHRoaXMuZmFjaW5nID0gJ3JpZ2h0JztcbiAgICB9XG5cbiAgICBsZXQgbW92aW5nQm94ID0gbmV3IEJveCh0aGlzLmN1clgsIHRoaXMuY3VyWSwgdGhpcy53aWR0aCxcbiAgICAgIHRoaXMuaGVpZ2h0KTtcbiAgICBsZXQgc2VnbWVudERlbHRhID0ge1xuICAgICAgeDogKHRoaXMuc3BlZWRYICogZWxhcHNlZFRpbWUpICogZGlyWCxcbiAgICAgIHk6ICh0aGlzLnNwZWVkWSAqIGVsYXBzZWRUaW1lKSAqIGRpcllcbiAgICB9O1xuICAgIGxldCByZXN1bHQgPSBnYW1lLnBoeXNpY3Muc3dlZXBCb3hJbnRvQm94ZXMobW92aW5nQm94LCBzZWdtZW50RGVsdGEsXG4gICAgICBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgaWYgKHJlc3VsdCAmJiByZXN1bHQuaGl0KSB7XG4gICAgICB0aGlzLmN1clggPSByZXN1bHQuaGl0UG9zLnggLSAodGhpcy53aWR0aCAvIDIpO1xuICAgICAgdGhpcy5jdXJZID0gcmVzdWx0LmhpdFBvcy55IC0gKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY3VyWCArPSBzZWdtZW50RGVsdGEueDtcbiAgICAgIHRoaXMuY3VyWSArPSBzZWdtZW50RGVsdGEueTtcbiAgICB9XG5cbiAgICBpZiAoKHRoaXMuY3VyWCArIHRoaXMud2lkdGgpID4gZ2FtZS5jYW52YXMud2lkdGgpIHtcbiAgICAgIGxldCB4Q2xpcCA9ICh0aGlzLmN1clggKyB0aGlzLndpZHRoKSAtIGdhbWUuY2FudmFzLndpZHRoIC0gdGhpcy53aWR0aDtcbiAgICAgIGlmICh0aGlzLmRpclggPT09IDEpIHtcbiAgICAgICAgdGhpcy5jdXJYID0geENsaXA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmN1clggPCAwKSB7XG4gICAgICBpZiAodGhpcy5kaXJYID09PSAtMSkge1xuICAgICAgICB0aGlzLmN1clggPSB0aGlzLmN1clggKyBnYW1lLmNhbnZhcy53aWR0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgPiBnYW1lLmNhbnZhcy5oZWlnaHQpIHtcbiAgICAgIGxldCB5Q2xpcCA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLSBnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodDtcbiAgICAgIGlmICh0aGlzLmRpclkgPT09IDEpIHtcbiAgICAgICAgdGhpcy5jdXJZID0geUNsaXA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICBpZiAodGhpcy5kaXJZID09PSAtMSkge1xuICAgICAgICB0aGlzLmN1clkgPSB0aGlzLmN1clkgKyBnYW1lLmNhbnZhcy5oZWlnaHQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5lYWNoT3ZlcmxhcHBpbmdBY3RvcihnYW1lLCBkZWF0aGJvdC5Nb25zdGVyLCBmdW5jdGlvbihhY3Rvcikge1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3doaXRlJztcbiAgICAgIGlmICghZ2FtZS5kZWJ1Z01vZGUpIHtcbiAgICAgICAgdGhpcy5oZWFsdGggLT0gMjA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5oZWFsdGggPD0gMCkge1xuICAgICAgICBnYW1lLnBsYXllckRlYXRoTWV0aG9kID0gJ2RlYWQnO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gY29uc29sZS5sb2codGhpcy5jdXJYLCB0aGlzLmN1clkpO1xuICAgIC8vIHRoaXMuaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICB9XG4gIC8vIHN0YXJ0WCwgc3RhcnRZLCBzcGVlZCwgZGlyWCwgZGlyWVxuICBmaXJlQnVsbGV0KGdhbWUsIGRpclgsIGRpclkpIHtcbiAgICB0aGlzLmJ1bGxldCA9IG5ldyBCdWxsZXQodGhpcy5jdXJYLCB0aGlzLmN1clkgKyAyMCwgNjAwLCBkaXJYLCBkaXJZKTtcbiAgICBnYW1lLmFjdG9ycy5wbGF5ZXJCdWxsZXQgPSB0aGlzLmJ1bGxldDtcbiAgfVxufVxuIl19
