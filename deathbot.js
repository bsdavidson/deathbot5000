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
    this.laserRange = 3400;
    this.laserStart = {};
  }

  _createClass(Actor, [{
    key: 'collidesWithWalls',
    value: function collidesWithWalls(game) {
      var result = { hit: false, dirX: 0, dirY: 0 };
      // Hit the Left Wall
      if (this.curX < 0) {
        this.curX = _physics.Physics.EPSILON;
        result = { hit: true, dirX: 1 };
      }
      // Hit right wall
      if (this.curX > game.canvas.width - this.width) {
        this.curX = game.canvas.width - this.width - _physics.Physics.EPSILON;
        result = { hit: true, dirX: -1 };
      }
      // Hit the Ceiling
      if (this.curY < 0) {
        this.curY = _physics.Physics.EPSILON;
        result = { hit: true, dirY: 1 };
      }
      // Hit the Floor
      if (this.curY > game.canvas.height - this.height) {
        this.curY = game.canvas.height - this.height - _physics.Physics.EPSILON;
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
            var endPos = new _physics.Physics.Point(actor.curX + actor.width / 2 + actor.eyeOffset.x, actor.curY + actor.eyeOffset.y);
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
      var pointArray = [];
      var startingPoint = {};
      var degreeToCurEndPoint = void 0;
      var sweepAngle = 40;

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
        intialEndPos = new _physics.Physics.Point(initialResult.hitPos.x, initialResult.hitPos.y);
      } else {
        intialEndPos = new _physics.Physics.Point(initialEndpoint.x, initialEndpoint.y);
      }

      pointArray.push(intialEndPos);
      var endingEndPos = void 0;
      degreeToCurEndPoint = degreeToStartSweep;
      while (degreeToCurEndPoint < degreeToEndSweep) {
        degreeToCurEndPoint += 0.5;
        var endingDelta = game.physics.degToPos(degreeToCurEndPoint, this.laserRange);
        var endingResult = game.physics.intersectSegmentIntoBoxes(startingPoint, endingDelta, tilesInFOV);

        if (endingResult && endingResult.hit) {
          // update end pos with hit pos
          endingEndPos = new _physics.Physics.Point(endingResult.hitPos.x, endingResult.hitPos.y);
          pointArray.push(endingEndPos);
        }
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
        var movingBox = new _physics.Physics.Box(this.curX, this.curY, this.width, this.height);
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

function Physics(game) {
  this.game = game;
}
exports.Physics = Physics;

Physics.EPSILON = 1 / 32;

var Box = Physics.Box = function Box(x, y, w, h) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
};

Box.prototype.inflate = function (paddingX, paddingY) {
  return new Box(this.x - paddingX / 2, this.y - paddingY / 2, this.w + paddingX, this.h + paddingY);
};

var Point = Physics.Point = function Point(x, y) {
  this.x = x;
  this.y = y;
};

Physics.prototype.drawPoint = function (x, y, color, size) {
  size = size || 4;
  this.game.context.fillStyle = color;
  this.game.context.fillRect(x - size / 2, y - size / 2, size, size);
};

Physics.prototype.drawLine = function (x1, y1, x2, y2, color) {
  this.game.context.beginPath();
  this.game.context.moveTo(x1, y1);
  this.game.context.lineTo(x2, y2);
  this.game.context.closePath();
  this.game.context.strokeStyle = color;
  this.game.context.stroke();
};

Physics.prototype.drawText = function (x, y, text, color) {
  color = color || 'white';
  this.game.context.font = '14px Arial';
  this.game.context.fillStyle = color;
  this.game.context.fillText(text, x, y);
};

Physics.prototype.drawBox = function (x, y, w, h, color) {
  color = color || 'white';
  this.game.context.strokeStyle = color;
  this.game.context.strokeRect(x, y, w, h);
};

Physics.prototype.getDelta = function (x1, y1, x2, y2) {
  return { x: x2 - x1, y: y2 - y1 };
};

Physics.prototype.intersectSegmentIntoBox = function (segmentPos, segmentDelta, paddedBox, debug) {
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

  hitPos.x += hitNormal.x * Physics.EPSILON;
  hitPos.y += hitNormal.y * Physics.EPSILON;

  return {
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
};

Physics.prototype.sweepBoxIntoBox = function (movingBox, segmentDelta, staticBox) {
  var segmentPos = {
    x: movingBox.x + movingBox.w / 2,
    y: movingBox.y + movingBox.h / 2
  };

  var paddedBox = new Box(staticBox.x - movingBox.w / 2, staticBox.y - movingBox.h / 2, staticBox.w + movingBox.w, staticBox.h + movingBox.h);
  var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta, paddedBox);
  return result;
};

Physics.prototype.intersectSegmentIntoBoxes = function (segmentPos, segmentDelta, staticBoxes) {
  var nearestResult = null;
  for (var i = 0, il = staticBoxes.length; i < il; i++) {
    var staticBox = staticBoxes[i];
    var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta, staticBox);
    if (result.hit) {
      if (!nearestResult || result.hitPercent < nearestResult.hitPercent) {
        nearestResult = result;
      }
    }
  }
  return nearestResult;
};

// Sweep movingBox, along the movement described by segmentDelta, into each box
// in the list of staticBoxes. Return a result object describing the first
// static box that movingBox hits, or null.
Physics.prototype.sweepBoxIntoBoxes = function (movingBox, segmentDelta, staticBoxes) {
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
};

Physics.prototype.checkNearestHit = function (sourceActor, staticResult, targetResult) {
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
      result.endPos = new Physics.Point(staticResult.hitPos.x, staticResult.hitPos.y);
    } else {
      result.endPos = new Physics.Point(targetResult.hitPos.x, targetResult.hitPos.y);
      result.targetHit = true;
    }
  } else if (sourceActor.dirY === -1 || sourceActor.dirY === 1) {
    if (Math.abs(sourceY - staticY) < Math.abs(sourceY - targetY)) {
      result.targetHit = false;
      result.endPos = new Physics.Point(staticResult.hitPos.x, staticResult.hitPos.y);
    } else {
      result.endPos = new Physics.Point(targetResult.hitPos.x, targetResult.hitPos.y);
      result.targetHit = true;
    }
  }
  return result;
};

Physics.prototype.getTargetDegree = function (delta) {
  var theta = Math.atan2(delta.x, delta.y);
  var degree = theta * (180 / Math.PI);
  if (theta < 0) {
    degree += 360;
  }
  return degree;
};

Physics.prototype.degToPos = function (degree, radius) {
  var radian = degree * (Math.PI / 180);
  var result = {
    x: radius * Math.sin(radian),
    y: radius * Math.cos(radian)
  };
  return result;
};

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
exports.Game = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _berzerk = require('./berzerk');

var _player = require('./player');

var _monster = require('./monster');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DEBUG_TILE = 9;
var LEVELS = [{
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
        actor.curX = spawnXY.x1 + _berzerk.Physics.EPSILON;
        actor.curY = spawnXY.y1 + _berzerk.Physics.EPSILON;
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
          var block = new _berzerk.Physics.Box(blockXY.x1, blockXY.y1, this.cellWidth, this.cellHeight);
          this.staticBlocks.push(block);
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
    _this.laserRange = 500;
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
          endPos = new _berzerk.Physics.Point(blockResult.hitPos.x, blockResult.hitPos.y);
          game.context.strokeStyle = 'red';
        } else if (targetResult && targetResult.hit) {
          endPos = new _berzerk.Physics.Point(targetResult.hitPos.x, targetResult.hitPos.y);
          targetHit = true;
        } else {
          endPos = new _berzerk.Physics.Point(laserEndpoint.x, laserEndpoint.y);
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
        player.recoveryTimer = 0;
        player.health -= 2;
        game.playerDeathMethod = 'blind';
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

      var movingBox = new _berzerk.Physics.Box(this.curX, this.curY, this.width, this.height);
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
        this.health -= 20;
        if (this.health <= 0) {
          game.playerDeathMethod = 'dead';
        }
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9iZXJ6ZXJrL2FjdG9yLmpzIiwianMvYmVyemVyay9nYW1lLmpzIiwianMvYmVyemVyay9pbmRleC5qcyIsImpzL2Jlcnplcmsva2V5cy5qcyIsImpzL2JlcnplcmsvcGh5c2ljcy5qcyIsImpzL2J1bGxldC5qcyIsImpzL2RlYXRoYm90LmpzIiwianMvZ2FtZS5qcyIsImpzL21vbnN0ZXIuanMiLCJqcy9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0FDQ0E7Ozs7Ozs7OztBQUVBOzs7O0FBRU8sSUFBSSxrQ0FBYTtBQUN0QixNQUFJLENBQUo7QUFDQSxRQUFNLENBQU47QUFDQSxRQUFNLENBQU47QUFDQSxTQUFPLENBQVA7QUFDQSxjQUFZLENBQ1YsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUMsQ0FBRCxFQURBLEVBRVYsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFGRyxFQUdWLEVBQUMsR0FBRyxDQUFDLENBQUQsRUFBSSxHQUFHLENBQUgsRUFIRSxFQUlWLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBSkcsQ0FBWjtBQUtBLFNBQVEsQ0FBQyxJQUFELEVBQU8sTUFBUCxFQUFlLE1BQWYsRUFBdUIsT0FBdkIsQ0FBUjtBQUNBLDhCQUFTLE1BQU0sTUFBTTtBQUNuQixRQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ1osYUFBTyxLQUFLLEtBQUwsQ0FESztLQUFkLE1BRU8sSUFBSSxPQUFPLENBQVAsRUFBVTtBQUNuQixhQUFPLEtBQUssSUFBTCxDQURZO0tBQWQsTUFFQSxJQUFJLE9BQU8sQ0FBUCxFQUFVO0FBQ25CLGFBQU8sS0FBSyxJQUFMLENBRFk7S0FBZCxNQUVBLElBQUksT0FBTyxDQUFQLEVBQVU7QUFDbkIsYUFBTyxLQUFLLEVBQUwsQ0FEWTtLQUFkLE1BRUE7QUFDTCxhQUFPLEtBQUssS0FBTCxDQURGO0tBRkE7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SyxNQUFMLEdBQWMsbUJBQVcsS0FBSyxJQUFMLEVBQVcsS0FBSyxJQUFMLEdBQVksRUFBWixFQUFnQixHQUF0QyxFQUEyQyxJQUEzQyxFQUFpRCxJQUFqRCxDQUFkLENBRDJCO0FBRTNCLFdBQUssTUFBTCxDQUFZLFlBQVosR0FBMkIsS0FBSyxNQUFMLENBRkE7Ozs7U0E5SmxCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1BoeXNpY3N9IGZyb20gJy4vcGh5c2ljcyc7XG5cbmV4cG9ydCB2YXIgRGlyZWN0aW9ucyA9IHtcbiAgVVA6IDAsXG4gIERPV046IDEsXG4gIExFRlQ6IDIsXG4gIFJJR0hUOiAzLFxuICBkaXJlY3Rpb25zOiBbXG4gICAge3g6IDAsIHk6IC0xfSxcbiAgICB7eDogMCwgeTogMX0sXG4gICAge3g6IC0xLCB5OiAwfSxcbiAgICB7eDogMSwgeTogMH1dLFxuICBuYW1lczogIFsndXAnLCAnZG93bicsICdsZWZ0JywgJ3JpZ2h0J10sXG4gIGdldEluZGV4KGRpclgsIGRpclkpIHtcbiAgICBpZiAoZGlyWCA+IDApIHtcbiAgICAgIHJldHVybiB0aGlzLlJJR0hUO1xuICAgIH0gZWxzZSBpZiAoZGlyWCA8IDApIHtcbiAgICAgIHJldHVybiB0aGlzLkxFRlQ7XG4gICAgfSBlbHNlIGlmIChkaXJZID4gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuRE9XTjtcbiAgICB9IGVsc2UgaWYgKGRpclkgPCAwKSB7XG4gICAgICByZXR1cm4gdGhpcy5VUDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuUklHSFQ7XG4gICAgfVxuICB9LFxuICBnZXROYW1lKGRpclgsIGRpclkpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lc1t0aGlzLmdldEluZGV4KGRpclgsIGRpclkpXTtcbiAgfVxufTtcblxuZXhwb3J0IGNsYXNzIEFjdG9yIHtcbiAgY29uc3RydWN0b3IoaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpclkpIHtcbiAgICBsZXQgdW5zY2FsZWRXaWR0aCwgdW5zY2FsZWRIZWlnaHQ7XG4gICAgaWYgKGltYWdlKSB7XG4gICAgICB0aGlzLmltYWdlID0gaW1hZ2U7XG4gICAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5pbWFnZTtcbiAgICAgIHRoaXMuZGlySW1hZ2VzID0ge1xuICAgICAgICByaWdodDogaW1hZ2UsXG4gICAgICAgIGxlZnQ6IGltYWdlLnJldixcbiAgICAgICAgdXA6IGltYWdlLnVwLFxuICAgICAgICBkb3duOiBpbWFnZS5kb3duXG4gICAgICB9O1xuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kaXJJbWFnZXMpO1xuICAgICAgdW5zY2FsZWRXaWR0aCA9IGltYWdlLnc7XG4gICAgICB1bnNjYWxlZEhlaWdodCA9IGltYWdlLmg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaW1hZ2UgPSBudWxsO1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IG51bGw7XG4gICAgICB0aGlzLmRpckltYWdlcyA9IHtcbiAgICAgICAgcmlnaHQ6IG51bGwsXG4gICAgICAgIGxlZnQ6IG51bGwsXG4gICAgICAgIHVwOiBudWxsLFxuICAgICAgICBkb3duOiBudWxsXG4gICAgICB9O1xuICAgICAgdW5zY2FsZWRXaWR0aCA9IDE7XG4gICAgICB1bnNjYWxlZEhlaWdodCA9IDE7XG4gICAgfVxuXG4gICAgdGhpcy5wcmV2aW91c0RpciA9IHt4OiB0aGlzLmRpclgsIHk6IHRoaXMuZGlyWX07XG4gICAgdGhpcy5zdGFydFggPSBzdGFydFg7XG4gICAgdGhpcy5zdGFydFkgPSBzdGFydFk7XG5cbiAgICB0aGlzLmZhY2luZyA9ICdyaWdodCc7XG4gICAgdGhpcy5kaXJYID0gZGlyWDtcbiAgICB0aGlzLmRpclkgPSBkaXJZO1xuICAgIHRoaXMud2lkdGggPSB1bnNjYWxlZFdpZHRoICogKHNjYWxlIC8gMTAwKTtcbiAgICB0aGlzLmhlaWdodCA9IHVuc2NhbGVkSGVpZ2h0ICogKHNjYWxlIC8gMTAwKTtcbiAgICB0aGlzLmN1clggPSBzdGFydFg7XG4gICAgdGhpcy5jdXJZID0gc3RhcnRZO1xuICAgIHRoaXMucHJldmlvdXNQb3MgPSB7eDogdGhpcy5jdXJYLCB5OiB0aGlzLmN1cll9O1xuICAgIHRoaXMudGlsZXNJbkZPViA9IFtdO1xuICAgIHRoaXMuc3BlZWRYID0gc3BlZWRYO1xuICAgIHRoaXMuc3BlZWRZID0gc3BlZWRZO1xuICAgIHRoaXMubW92aW5nID0gdHJ1ZTtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5hbHBoYSA9IDE7XG4gICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ3JlZCc7XG4gICAgdGhpcy5leWVPZmZzZXQgPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5sYXNlckRlbHRhID0ge307XG4gICAgdGhpcy5sYXNlclJhbmdlID0gMzQwMDtcbiAgICB0aGlzLmxhc2VyU3RhcnQgPSB7fTtcbiAgfVxuXG4gIGNvbGxpZGVzV2l0aFdhbGxzKGdhbWUpIHtcbiAgICBsZXQgcmVzdWx0ID0ge2hpdDogZmFsc2UsIGRpclg6IDAsIGRpclk6IDB9O1xuICAgIC8vIEhpdCB0aGUgTGVmdCBXYWxsXG4gICAgaWYgKHRoaXMuY3VyWCA8IDApIHtcbiAgICAgIHRoaXMuY3VyWCA9IFBoeXNpY3MuRVBTSUxPTjtcbiAgICAgIHJlc3VsdCA9IHtoaXQ6IHRydWUsIGRpclg6IDF9O1xuICAgIH1cbiAgICAvLyBIaXQgcmlnaHQgd2FsbFxuICAgIGlmICh0aGlzLmN1clggPiAoZ2FtZS5jYW52YXMud2lkdGggLSB0aGlzLndpZHRoKSkge1xuICAgICAgdGhpcy5jdXJYID0gKGdhbWUuY2FudmFzLndpZHRoIC0gdGhpcy53aWR0aCkgLSBQaHlzaWNzLkVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJYOiAtMX07XG4gICAgfVxuICAgIC8vIEhpdCB0aGUgQ2VpbGluZ1xuICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICB0aGlzLmN1clkgPSBQaHlzaWNzLkVQU0lMT047XG4gICAgICByZXN1bHQgPSB7aGl0OiB0cnVlLCBkaXJZOiAxfTtcbiAgICB9XG4gICAgLy8gSGl0IHRoZSBGbG9vclxuICAgIGlmICh0aGlzLmN1clkgPiBnYW1lLmNhbnZhcy5oZWlnaHQgLSB0aGlzLmhlaWdodCkge1xuICAgICAgdGhpcy5jdXJZID0gKGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0KSAtIFBoeXNpY3MuRVBTSUxPTjtcbiAgICAgIHJlc3VsdCA9IHtoaXQ6IHRydWUsIGRpclk6IC0xfTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGVhY2hPdmVybGFwcGluZ0FjdG9yKGdhbWUsIGFjdG9yQ29uc3RydWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgZ2FtZS5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGlmICghKGFjdG9yIGluc3RhbmNlb2YgYWN0b3JDb25zdHJ1Y3RvcikgfHwgIWFjdG9yLmFjdGl2ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBsZXQgb3ZlcmxhcHBpbmcgPSAhKFxuICAgICAgICB0aGlzLmN1clggPiBhY3Rvci5jdXJYICsgYWN0b3Iud2lkdGggfHxcbiAgICAgICAgdGhpcy5jdXJYICsgdGhpcy53aWR0aCA8IGFjdG9yLmN1clggfHxcbiAgICAgICAgdGhpcy5jdXJZICsgdGhpcy5oZWlnaHQgPCBhY3Rvci5jdXJZIHx8XG4gICAgICAgIHRoaXMuY3VyWSA+IGFjdG9yLmN1clkgKyBhY3Rvci5oZWlnaHRcbiAgICAgICk7XG4gICAgICBpZiAob3ZlcmxhcHBpbmcpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzLCBhY3Rvcik7XG4gICAgICB9XG4gICAgfSwgdGhpcyk7XG4gIH1cblxuICBnZXRUaWxlc0luRk9WKGdhbWUpIHtcbiAgICBsZXQgdGlsZXNJbkZPViA9IFtdO1xuICAgIGxldCBibG9ja3MgPSBnYW1lLnN0YXRpY0Jsb2NrcztcbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSBibG9ja3MubGVuZ3RoOyBpIDwgbGk7IGkrKykge1xuICAgICAgbGV0IHZpc2lvbkRlbHRhID0ge1xuICAgICAgICB4OiAoYmxvY2tzW2ldLngpIC0gdGhpcy5jdXJYLFxuICAgICAgICB5OiAoYmxvY2tzW2ldLnkpIC0gdGhpcy5jdXJZXG4gICAgICB9O1xuICAgICAgbGV0IGJsb2NrRGlyTGVuZ3RoID0gTWF0aC5zcXJ0KHZpc2lvbkRlbHRhLnggKiB2aXNpb25EZWx0YS54ICtcbiAgICAgICAgdmlzaW9uRGVsdGEueSAqIHZpc2lvbkRlbHRhLnkpO1xuICAgICAgbGV0IGJsb2NrRGlyID0ge307XG4gICAgICBibG9ja0Rpci54ID0gdmlzaW9uRGVsdGEueCAvIGJsb2NrRGlyTGVuZ3RoO1xuICAgICAgYmxvY2tEaXIueSA9IHZpc2lvbkRlbHRhLnkgLyBibG9ja0Rpckxlbmd0aDtcbiAgICAgIGxldCBkb3RQcm9kdWN0ID0gKHRoaXMuZGlyWCAqIGJsb2NrRGlyLngpICsgKHRoaXMuZGlyWSAqIGJsb2NrRGlyLnkpO1xuICAgICAgaWYgKGRvdFByb2R1Y3QgPiAwLjcwKSB7XG4gICAgICAgIHRpbGVzSW5GT1YucHVzaChnYW1lLnN0YXRpY0Jsb2Nrc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aWxlc0luRk9WO1xuICB9XG5cbiAgZWFjaFZpc2libGVBY3RvcihnYW1lLCBhY3RvckNvbnN0cnVjdG9yLCBjYWxsYmFjaykge1xuICAgIGdhbWUuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICBpZiAoIShhY3RvciBpbnN0YW5jZW9mIGFjdG9yQ29uc3RydWN0b3IpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmIChnYW1lLmdhbWVTdGF0ZSAhPT0gJ3BsYXknKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGxldCB2aXNpb25TdGFydCA9IHtcbiAgICAgICAgeDogdGhpcy5jdXJYICsgKHRoaXMud2lkdGggLyAyKSArIHRoaXMuZXllT2Zmc2V0LngsXG4gICAgICAgIHk6IHRoaXMuY3VyWSArIHRoaXMuZXllT2Zmc2V0LnlcbiAgICAgIH07XG4gICAgICBsZXQgdmlzaW9uRGVsdGEgPSB7XG4gICAgICAgIHg6IChhY3Rvci5jdXJYICsgKGFjdG9yLndpZHRoIC8gMikgKyBhY3Rvci5leWVPZmZzZXQueCkgLSB2aXNpb25TdGFydC54LFxuICAgICAgICB5OiAoYWN0b3IuY3VyWSArIGFjdG9yLmV5ZU9mZnNldC55KSAtIHZpc2lvblN0YXJ0LnlcbiAgICAgIH07XG4gICAgICBsZXQgYWN0b3JEaXJMZW5ndGggPSBNYXRoLnNxcnQoXG4gICAgICAgIHZpc2lvbkRlbHRhLnggKiB2aXNpb25EZWx0YS54ICsgdmlzaW9uRGVsdGEueSAqIHZpc2lvbkRlbHRhLnkpO1xuICAgICAgbGV0IGFjdG9yRGlyID0ge1xuICAgICAgICB4OiB2aXNpb25EZWx0YS54IC8gYWN0b3JEaXJMZW5ndGgsXG4gICAgICAgIHk6IHZpc2lvbkRlbHRhLnkgLyBhY3RvckRpckxlbmd0aFxuICAgICAgfTtcbiAgICAgIGxldCBkb3RQcm9kdWN0ID0gKHRoaXMuZGlyWCAqIGFjdG9yRGlyLngpICsgKHRoaXMuZGlyWSAqIGFjdG9yRGlyLnkpO1xuXG4gICAgICBsZXQgdmlzaWJsZSA9IGZhbHNlO1xuXG4gICAgICBsZXQgaW5GT1Y7XG4gICAgICBpZiAoZG90UHJvZHVjdCA+IDAuNzApIHtcbiAgICAgICAgaW5GT1YgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5GT1YgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGluRk9WKSB7XG4gICAgICAgIGxldCBhY3RvckFyciA9IFtdO1xuICAgICAgICBsZXQgYWN0b3JPYmogPSB7XG4gICAgICAgICAgeDogYWN0b3IuY3VyWCxcbiAgICAgICAgICB5OiBhY3Rvci5jdXJZLFxuICAgICAgICAgIHc6IGFjdG9yLndpZHRoLFxuICAgICAgICAgIGg6IGFjdG9yLmhlaWdodFxuICAgICAgICB9O1xuICAgICAgICBhY3RvckFyci5wdXNoKGFjdG9yT2JqKTtcbiAgICAgICAgbGV0IGJsb2NrUmVzdWx0ID0gZ2FtZS5waHlzaWNzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoXG4gICAgICAgICAgdmlzaW9uU3RhcnQsIHZpc2lvbkRlbHRhLCBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgICAgIGxldCBhY3RvclJlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgICAgIHZpc2lvblN0YXJ0LCB2aXNpb25EZWx0YSwgYWN0b3JBcnIpO1xuXG4gICAgICAgIGlmIChnYW1lLmRlYnVnTW9kZSkge1xuICAgICAgICAgIGxldCBlbmRQb3MgPSBuZXcgUGh5c2ljcy5Qb2ludChcbiAgICAgICAgICAgIGFjdG9yLmN1clggKyAoYWN0b3Iud2lkdGggLyAyKSArIGFjdG9yLmV5ZU9mZnNldC54LFxuICAgICAgICAgICAgYWN0b3IuY3VyWSArIGFjdG9yLmV5ZU9mZnNldC55KTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0Lm1vdmVUbyh2aXNpb25TdGFydC54LCB2aXNpb25TdGFydC55KTtcbiAgICAgICAgICBnYW1lLmNvbnRleHQubGluZVRvKGVuZFBvcy54LCBlbmRQb3MueSk7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgIGdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9ICd3aGl0ZSc7XG4gICAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFjdG9yUmVzdWx0ICYmIGFjdG9yUmVzdWx0LmhpdCAmJiBibG9ja1Jlc3VsdCAmJiBibG9ja1Jlc3VsdC5oaXQpIHtcbiAgICAgICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLmNoZWNrTmVhcmVzdEhpdChcbiAgICAgICAgICAgIHRoaXMsIGJsb2NrUmVzdWx0LCBhY3RvclJlc3VsdCk7XG4gICAgICAgICAgdmlzaWJsZSA9IHJlc3VsdC50YXJnZXRIaXQ7XG4gICAgICAgIH0gZWxzZSBpZiAoYWN0b3JSZXN1bHQgJiYgYWN0b3JSZXN1bHQuaGl0KSB7XG4gICAgICAgICAgdmlzaWJsZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmlzaWJsZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzaWJsZSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMsIGFjdG9yKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIGhlYWRMYW1wKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgbGV0IHBvaW50QXJyYXkgPSBbXTtcbiAgICBsZXQgc3RhcnRpbmdQb2ludCA9IHt9O1xuICAgIGxldCBkZWdyZWVUb0N1ckVuZFBvaW50O1xuICAgIGxldCBzd2VlcEFuZ2xlID0gNDA7XG5cbiAgICBzdGFydGluZ1BvaW50LnggPSB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDIpO1xuICAgIHN0YXJ0aW5nUG9pbnQueSA9IHRoaXMuY3VyWSArIDE0O1xuXG4gICAgbGV0IHRpbGVzSW5GT1YgPSB0aGlzLmdldFRpbGVzSW5GT1YoZ2FtZSk7XG4gICAgLy8gY29uc29sZS5sb2codGlsZXNJbkZPVik7XG4gICAgbGV0IGluaXRpYWxFbmRwb2ludCA9IHt9O1xuICAgIC8vIEdldCBvdXIgaW5pdGlhbCBwb2ludCB0aGF0IGlzIHN0cmFpZ2h0IGFoZWFkXG4gICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEgfHwgdGhpcy5kaXJYID09PSAxKSB7XG4gICAgICBpbml0aWFsRW5kcG9pbnQgPSB7eDogKHN0YXJ0aW5nUG9pbnQueCArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJYLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHN0YXJ0aW5nUG9pbnQueX07XG4gICAgfSBlbHNlIGlmICh0aGlzLmRpclkgPT09IC0xIHx8IHRoaXMuZGlyWSA9PT0gMSkge1xuICAgICAgaW5pdGlhbEVuZHBvaW50ID0ge3g6IHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5OiAoc3RhcnRpbmdQb2ludC55ICsgdGhpcy5sYXNlclJhbmdlKSAqIC10aGlzLmRpcll9O1xuICAgIH1cblxuICAgIGxldCBpbml0YWxEZWx0YSA9IGdhbWUucGh5c2ljcy5nZXREZWx0YShpbml0aWFsRW5kcG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbEVuZHBvaW50LnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0aW5nUG9pbnQueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdQb2ludC55KTtcbiAgICBsZXQgZGVnVG9Jbml0aWFsRW5kcG9zID0gZ2FtZS5waHlzaWNzLmdldFRhcmdldERlZ3JlZShpbml0YWxEZWx0YSk7XG4gICAgbGV0IGRlZ3JlZVRvU3RhcnRTd2VlcCA9IGRlZ1RvSW5pdGlhbEVuZHBvcyAtIHN3ZWVwQW5nbGU7XG4gICAgbGV0IGRlZ3JlZVRvRW5kU3dlZXAgPSBkZWdUb0luaXRpYWxFbmRwb3MgKyBzd2VlcEFuZ2xlO1xuICAgIGluaXRhbERlbHRhID0gZ2FtZS5waHlzaWNzLmRlZ1RvUG9zKGRlZ3JlZVRvU3RhcnRTd2VlcCwgdGhpcy5sYXNlclJhbmdlKTtcbiAgICBsZXQgaW5pdGlhbFJlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKHN0YXJ0aW5nUG9pbnQsXG4gICAgICBpbml0YWxEZWx0YSwgdGlsZXNJbkZPVik7XG4gICAgbGV0IGludGlhbEVuZFBvcztcbiAgICBpZiAoaW5pdGlhbFJlc3VsdCAmJiBpbml0aWFsUmVzdWx0LmhpdCkge1xuICAgICAgLy8gdXBkYXRlIGVuZCBwb3Mgd2l0aCBoaXQgcG9zXG4gICAgICBpbnRpYWxFbmRQb3MgPSBuZXcgUGh5c2ljcy5Qb2ludChcbiAgICAgICAgaW5pdGlhbFJlc3VsdC5oaXRQb3MueCwgaW5pdGlhbFJlc3VsdC5oaXRQb3MueSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGludGlhbEVuZFBvcyA9IG5ldyBQaHlzaWNzLlBvaW50KFxuICAgICAgICBpbml0aWFsRW5kcG9pbnQueCwgaW5pdGlhbEVuZHBvaW50LnkpO1xuICAgIH1cblxuICAgIHBvaW50QXJyYXkucHVzaChpbnRpYWxFbmRQb3MpO1xuICAgIGxldCBlbmRpbmdFbmRQb3M7XG4gICAgZGVncmVlVG9DdXJFbmRQb2ludCA9IGRlZ3JlZVRvU3RhcnRTd2VlcDtcbiAgICB3aGlsZSAoZGVncmVlVG9DdXJFbmRQb2ludCA8IGRlZ3JlZVRvRW5kU3dlZXApIHtcbiAgICAgIGRlZ3JlZVRvQ3VyRW5kUG9pbnQgKz0gMC41O1xuICAgICAgbGV0IGVuZGluZ0RlbHRhID0gZ2FtZS5waHlzaWNzLmRlZ1RvUG9zKFxuICAgICAgICBkZWdyZWVUb0N1ckVuZFBvaW50LCB0aGlzLmxhc2VyUmFuZ2UpO1xuICAgICAgbGV0IGVuZGluZ1Jlc3VsdCA9IGdhbWUucGh5c2ljcy5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzKFxuICAgICAgICBzdGFydGluZ1BvaW50LCBlbmRpbmdEZWx0YSwgdGlsZXNJbkZPVik7XG5cbiAgICAgIGlmIChlbmRpbmdSZXN1bHQgJiYgZW5kaW5nUmVzdWx0LmhpdCkge1xuICAgICAgICAvLyB1cGRhdGUgZW5kIHBvcyB3aXRoIGhpdCBwb3NcbiAgICAgICAgZW5kaW5nRW5kUG9zID0gbmV3IFBoeXNpY3MuUG9pbnQoXG4gICAgICAgICAgZW5kaW5nUmVzdWx0LmhpdFBvcy54LCBlbmRpbmdSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICBwb2ludEFycmF5LnB1c2goZW5kaW5nRW5kUG9zKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBnYW1lLmNvbnRleHRGWC5iZWdpblBhdGgoKTtcbiAgICBnYW1lLmNvbnRleHRGWC5tb3ZlVG8oc3RhcnRpbmdQb2ludC54LCBzdGFydGluZ1BvaW50LnkpO1xuICAgIGZvciAobGV0IGkgPSAwLCBsaSA9IHBvaW50QXJyYXkubGVuZ3RoOyBpIDwgbGk7IGkrKykge1xuICAgICAgZ2FtZS5jb250ZXh0RlgubGluZVRvKHBvaW50QXJyYXlbaV0ueCwgcG9pbnRBcnJheVtpXS55KTtcbiAgICB9XG4gICAgZ2FtZS5jb250ZXh0RlguY2xvc2VQYXRoKCk7XG4gICAgZ2FtZS5jb250ZXh0RlguZmlsbFN0eWxlID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgLjMwKSc7XG4gICAgZ2FtZS5jb250ZXh0RlguZmlsbCgpO1xuICB9XG5cbiAgdXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgbGV0IGhpdFdhbGwgPSB0aGlzLmNvbGxpZGVzV2l0aFdhbGxzKGdhbWUpO1xuICAgIGlmIChoaXRXYWxsLmRpclgpIHtcbiAgICAgIHRoaXMuZGlyWCA9IGhpdFdhbGwuZGlyWDtcbiAgICB9XG4gICAgaWYgKGhpdFdhbGwuZGlyWSkge1xuICAgICAgdGhpcy5kaXJZID0gaGl0V2FsbC5kaXJZO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1vdmluZykge1xuICAgICAgbGV0IG1vdmluZ0JveCA9IG5ldyBQaHlzaWNzLkJveCh0aGlzLmN1clgsIHRoaXMuY3VyWSwgdGhpcy53aWR0aCxcbiAgICAgICAgdGhpcy5oZWlnaHQpO1xuICAgICAgbGV0IHNlZ21lbnREZWx0YSA9IHtcbiAgICAgICAgeDogKHRoaXMuc3BlZWRYICogZWxhcHNlZFRpbWUpICogdGhpcy5kaXJYLFxuICAgICAgICB5OiAodGhpcy5zcGVlZFkgKiBlbGFwc2VkVGltZSkgKiB0aGlzLmRpcllcbiAgICAgIH07XG4gICAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLnN3ZWVwQm94SW50b0JveGVzKG1vdmluZ0JveCwgc2VnbWVudERlbHRhLFxuICAgICAgICBnYW1lLnN0YXRpY0Jsb2Nrcyk7XG4gICAgICB0aGlzLnByZXZpb3VzUG9zID0ge1xuICAgICAgICB4OiB0aGlzLmN1clgsXG4gICAgICAgIHk6IHRoaXMuY3VyWVxuICAgICAgfTtcbiAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmhpdCkge1xuICAgICAgICB0aGlzLmRpclggPSByZXN1bHQuaGl0Tm9ybWFsLng7XG4gICAgICAgIHRoaXMuZGlyWSA9IHJlc3VsdC5oaXROb3JtYWwueTtcbiAgICAgICAgdGhpcy5jdXJYID0gcmVzdWx0LmhpdFBvcy54IC0gKHRoaXMud2lkdGggLyAyKTtcbiAgICAgICAgdGhpcy5jdXJZID0gcmVzdWx0LmhpdFBvcy55IC0gKHRoaXMuaGVpZ2h0IC8gMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN1clggKz0gc2VnbWVudERlbHRhLng7XG4gICAgICAgIHRoaXMuY3VyWSArPSBzZWdtZW50RGVsdGEueTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJbWFnZSBTd2l0Y2hlclxuICAgIHRoaXMuZmFjaW5nID0gRGlyZWN0aW9ucy5nZXROYW1lKHRoaXMuZGlyWCwgdGhpcy5kaXJZKTtcbiAgICB0aGlzLmN1ckltYWdlID0gdGhpcy5kaXJJbWFnZXNbdGhpcy5mYWNpbmddO1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGlmICh0aGlzLmN1ckltYWdlKSB7XG4gICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmN1ckltYWdlKTtcbiAgICAgIGxldCBpbWdTcGxpdFggPSAwLCBpbWdTcGxpdFkgPSAwO1xuICAgICAgaWYgKHRoaXMuY3VyWCArIHRoaXMud2lkdGggPiBnYW1lLmNhbnZhcy53aWR0aCkge1xuICAgICAgICBpbWdTcGxpdFggPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgICBpbWdTcGxpdFggPSBnYW1lLmNhbnZhcy53aWR0aCArIHRoaXMuY3VyWDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmN1clkgPCAwKSB7XG4gICAgICAgIGltZ1NwbGl0WSA9IGdhbWUuY2FudmFzLmhlaWdodCAtIHRoaXMuaGVpZ2h0ICsgKHRoaXMuaGVpZ2h0ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJZKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICAgIGltZ1NwbGl0WSA9ICh0aGlzLmN1clkgKyB0aGlzLmhlaWdodCkgLVxuICAgICAgICAgICAgICAgICAgICAgZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChpbWdTcGxpdFggIT09IDAgfHwgaW1nU3BsaXRZICE9PSAwKSB7XG4gICAgICAgIGlmIChpbWdTcGxpdFggPT09IDApIHtcbiAgICAgICAgICBpbWdTcGxpdFggPSB0aGlzLmN1clg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGltZ1NwbGl0WSA9PT0gMCkge1xuICAgICAgICAgIGltZ1NwbGl0WSA9IHRoaXMuY3VyWTtcbiAgICAgICAgfVxuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCB0aGlzLmN1clksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgdGhpcy5jdXJYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG4gICAgICAgIGdhbWUuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5jdXJJbWFnZSwgaW1nU3BsaXRYLCBpbWdTcGxpdFksXG4gICAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgICAgfVxuICAgICAgZ2FtZS5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmN1ckltYWdlLCB0aGlzLmN1clgsIHRoaXMuY3VyWSxcbiAgICAgICAgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuICAgIH1cblxuICAgIC8vIHRoaXMuaGVhZExhbXAoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuXG4gICAgaWYgKGdhbWUuZGVidWdNb2RlKSB7XG4gICAgICBsZXQgeDEgPSB0aGlzLmN1clg7XG4gICAgICBsZXQgeTEgPSB0aGlzLmN1clk7XG4gICAgICBsZXQgeDIgPSB0aGlzLmN1clggKyB0aGlzLndpZHRoO1xuICAgICAgbGV0IHkyID0gdGhpcy5jdXJZICsgdGhpcy5oZWlnaHQ7XG5cbiAgICAgIGdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgIGdhbWUuY29udGV4dC5tb3ZlVG8oeDEsIHkxKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkxKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDIsIHkyKTtcbiAgICAgIGdhbWUuY29udGV4dC5saW5lVG8oeDEsIHkyKTtcbiAgICAgIGdhbWUuY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgIGdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IHRoaXMuZGVidWdDb2xvcjtcbiAgICAgIGdhbWUuY29udGV4dC5zdHJva2UoKTtcbiAgICAgIGdhbWUuY29udGV4dC5mb250ID0gJzE0cHggVmVyZGFuYSc7XG4gICAgICBnYW1lLmNvbnRleHQuZmlsbFN0eWxlID0gJ2JsdWUnO1xuICAgICAgZ2FtZS5jb250ZXh0LmZpbGxUZXh0KFxuICAgICAgICAneCcgKyBNYXRoLmZsb29yKHRoaXMuY3VyWCkgKyAnICcgK1xuICAgICAgICAneScgKyBNYXRoLmZsb29yKHRoaXMuY3VyWSkgKyAnICcgK1xuICAgICAgICB0aGlzLmRpclggKyAnICcgKyB0aGlzLmRpclksXG4gICAgICAgIHRoaXMuY3VyWCArICh0aGlzLndpZHRoIC8gNCksXG4gICAgICAgIHRoaXMuY3VyWSArICh0aGlzLmhlaWdodCArIDMwKSk7XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtQaHlzaWNzfSBmcm9tICcuL3BoeXNpY3MnO1xuXG5leHBvcnQgY2xhc3MgR2FtZSB7XG4gIGNvbnN0cnVjdG9yKGNhbnZhcykge1xuICAgIHRoaXMubW91c2UgPSB7eDogMCwgeTogMH07XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVidWdNb2RlID0gZmFsc2U7XG4gICAgdGhpcy5pbWFnZXMgPSB7fTtcbiAgICB0aGlzLmltYWdlc0xvYWRlZCA9IGZhbHNlO1xuICAgIHRoaXMuYWN0b3JzID0ge307XG4gICAgdGhpcy5rZXlEb3duID0ge307XG4gICAgdGhpcy5rZXlOYW1lcyA9IHt9O1xuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICAgIHRoaXMuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIH1cblxuICBkZWZpbmVLZXkoa2V5TmFtZSwga2V5Q29kZSkge1xuICAgIHRoaXMua2V5RG93bltrZXlOYW1lXSA9IGZhbHNlO1xuICAgIHRoaXMua2V5TmFtZXNba2V5Q29kZV0gPSBrZXlOYW1lO1xuICB9XG5cbiAgZ2V0UmFuZG9tKG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSArIG1pbik7XG4gIH1cblxuICAvLyBMb29wcyB0aHJvdWdoIEFjdG9yIGFycmF5IGFuZCBjcmVhdGVzIGNhbGxhYmxlIGltYWdlcy5cbiAgbG9hZEltYWdlcyhjaGFyYWN0ZXJzLCBpbWFnZXMpIHtcbiAgICBsZXQgaW1hZ2VzVG9Mb2FkID0gW107XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBsb2FkZWRJbWFnZXMgPSAwO1xuICAgIGxldCBudW1JbWFnZXMgPSAwO1xuXG4gICAgbGV0IGdldFJldmVyc2VJbWFnZSA9IGZ1bmN0aW9uKHNyYywgdywgaCkge1xuICAgICAgbnVtSW1hZ2VzKys7XG4gICAgICBsZXQgdGVtcEltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICBsZXQgdGVtcENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgbGV0IHRlbXBDb250ZXh0ID0gdGVtcENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgdGVtcENhbnZhcy53aWR0aCA9IHc7XG4gICAgICB0ZW1wQ2FudmFzLmhlaWdodCA9IGg7XG4gICAgICB0ZW1wQ29udGV4dC50cmFuc2xhdGUodywgMCk7XG4gICAgICB0ZW1wQ29udGV4dC5zY2FsZSgtMSwgMSk7XG4gICAgICB0ZW1wQ29udGV4dC5kcmF3SW1hZ2Uoc3JjLCAwLCAwKTtcbiAgICAgIHRlbXBJbWFnZS5vbmxvYWQgPSBvbkltYWdlTG9hZGVkO1xuICAgICAgdGVtcEltYWdlLnNyYyA9IHRlbXBDYW52YXMudG9EYXRhVVJMKCk7XG4gICAgICByZXR1cm4gdGVtcEltYWdlO1xuICAgIH07XG5cbiAgICBsZXQgb25JbWFnZUxvYWRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgbG9hZGVkSW1hZ2VzKys7XG4gICAgICBjb25zb2xlLmxvZygnbG9hZGVkIGltYWdlJywgbG9hZGVkSW1hZ2VzLCAnb2YnLCBudW1JbWFnZXMpO1xuICAgICAgaWYgKGxvYWRlZEltYWdlcyA9PT0gbnVtSW1hZ2VzKSB7XG4gICAgICAgIHNlbGYuaW1hZ2VzTG9hZGVkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IGxvYWRJbWFnZSA9IGZ1bmN0aW9uKHNyYywgY2FsbGJhY2spIHtcbiAgICAgIGxldCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrLmNhbGwoaW1hZ2UpO1xuICAgICAgICB9XG4gICAgICAgIG9uSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH07XG4gICAgICBpbWFnZXNUb0xvYWQucHVzaCh7aW1hZ2U6IGltYWdlLCBzcmM6IHNyY30pO1xuICAgICAgcmV0dXJuIGltYWdlO1xuICAgIH07XG5cbiAgICBsZXQgb25NYWluSW1hZ2VMb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMucmV2ID0gZ2V0UmV2ZXJzZUltYWdlKHRoaXMsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgICB9O1xuXG4gICAgZm9yIChsZXQgaSA9IDAsIGlsID0gY2hhcmFjdGVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICAvLyBnZXQgb3VyIG1haW4gaW1hZ2VcbiAgICAgIGxldCBjaGFyYWN0ZXIgPSBjaGFyYWN0ZXJzW2ldO1xuICAgICAgbGV0IGltYWdlID0gdGhpcy5pbWFnZXNbY2hhcmFjdGVyLm5hbWVdID0gbG9hZEltYWdlKFxuICAgICAgICBjaGFyYWN0ZXIuaW1hZ2UsXG4gICAgICAgIG9uTWFpbkltYWdlTG9hZGVkKTtcblxuICAgICAgaWYgKGNoYXJhY3Rlci5pbWFnZVVwKSB7XG4gICAgICAgIGltYWdlLnVwID0gbG9hZEltYWdlKGNoYXJhY3Rlci5pbWFnZVVwKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltYWdlLnVwID0gaW1hZ2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFyYWN0ZXIuaW1hZ2VEb3duKSB7XG4gICAgICAgIGltYWdlLmRvd24gPSBsb2FkSW1hZ2UoY2hhcmFjdGVyLmltYWdlRG93bik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWFnZS5kb3duID0gaW1hZ2U7XG4gICAgICB9XG5cbiAgICAgIGltYWdlLncgPSBjaGFyYWN0ZXIudztcbiAgICAgIGltYWdlLmggPSBjaGFyYWN0ZXIuaDtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gaW1hZ2VzKSB7XG4gICAgICBpZiAoaW1hZ2VzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdGhpc1trZXldID0gbG9hZEltYWdlKGltYWdlc1trZXldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBudW1JbWFnZXMgPSBpbWFnZXNUb0xvYWQubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwLCBpbCA9IGltYWdlc1RvTG9hZC5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XG4gICAgICBpbWFnZXNUb0xvYWRbaV0uaW1hZ2Uuc3JjID0gaW1hZ2VzVG9Mb2FkW2ldLnNyYztcbiAgICB9XG4gIH1cblxuICBlYWNoQWN0b3IoY2FsbGJhY2ssIGNvbnRleHQpIHtcbiAgICBmb3IgKGxldCBjIGluIHRoaXMuYWN0b3JzKSB7XG4gICAgICBpZiAodGhpcy5hY3RvcnMuaGFzT3duUHJvcGVydHkoYykpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCB0aGlzLmFjdG9yc1tjXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaW5pdGlhbGl6ZShlbGFwc2VkVGltZSkge1xuICAgIHRoaXMucGh5c2ljcyA9IG5ldyBQaHlzaWNzKHRoaXMpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgZHJhdyhlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGFjdG9yLmRyYXcodGhpcywgZWxhcHNlZFRpbWUpO1xuICAgIH0sIHRoaXMpO1xuICB9XG5cbiAgZHJhd0xvYWRpbmcoKSB7fVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuaXRlcmF0aW9uKys7XG4gICAgdGhpcy5lYWNoQWN0b3IoZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIGlmIChhY3Rvci5hY3RpdmUpIHtcbiAgICAgICAgYWN0b3IudXBkYXRlKHRoaXMsIGVsYXBzZWRUaW1lKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzKTtcbiAgfVxuXG4gIHRpY2soZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAodGhpcy5pbWFnZXNMb2FkZWQpIHtcbiAgICAgIGlmICghdGhpcy5pbml0aWFsaXplZCkge1xuICAgICAgICB0aGlzLmluaXRpYWxpemUoZWxhcHNlZFRpbWUpO1xuICAgICAgfVxuICAgICAgdGhpcy5kcmF3KGVsYXBzZWRUaW1lKTtcbiAgICAgIHRoaXMudXBkYXRlKGVsYXBzZWRUaW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kcmF3TG9hZGluZygpO1xuICAgIH1cbiAgfVxuXG4gIG9uS2V5RG93bihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgbGV0IGtleSA9IGV2ZW50LmtleUNvZGU7XG4gICAgaWYgKHRoaXMua2V5TmFtZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdGhpcy5rZXlEb3duW3RoaXMua2V5TmFtZXNba2V5XV0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIG9uS2V5VXAoZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGxldCBrZXkgPSBldmVudC5rZXlDb2RlO1xuICAgIGlmICh0aGlzLmtleU5hbWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHRoaXMua2V5RG93blt0aGlzLmtleU5hbWVzW2tleV1dID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgb25Nb3VzZU1vdmUoZXZlbnQpIHtcbiAgICB0aGlzLm1vdXNlLnggPSBldmVudC5wYWdlWCAtIHRoaXMuY2FudmFzLm9mZnNldExlZnQ7XG4gICAgdGhpcy5tb3VzZS55ID0gZXZlbnQucGFnZVkgLSB0aGlzLmNhbnZhcy5vZmZzZXRUb3A7XG4gIH1cblxuICBvblJlc2l6ZShldmVudCkge1xuICAgIHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgdGhpcy5jYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIH1cblxuICBzZXRGb2N1cyhldmVudCwgaXNCbHVycmVkKSB7XG4gICAgaWYgKHRoaXMuZGVidWdNb2RlICYmIGlzQmx1cnJlZCkge1xuICAgICAgdGhpcy5mcmFtZXNQZXJTZWNvbmQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmZyYW1lc1BlclNlY29uZCA9IDMwO1xuICAgIH1cbiAgfVxufVxuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmV4cG9ydCB7UGh5c2ljc30gZnJvbSAnLi9waHlzaWNzJztcbmV4cG9ydCB7S2V5c30gZnJvbSAnLi9rZXlzJztcbmV4cG9ydCB7R2FtZX0gZnJvbSAnLi9nYW1lJztcbmV4cG9ydCB7QWN0b3IsIERpcmVjdGlvbnN9IGZyb20gJy4vYWN0b3InO1xuIiwiLyoganNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5leHBvcnQgY29uc3QgS2V5cyA9IHtcbiAgVVA6IDM4LFxuICBET1dOOiA0MCxcbiAgTEVGVDogMzcsXG4gIFJJR0hUOiAzOSxcbiAgVzogODcsXG4gIEE6IDY1LFxuICBTOiA4MyxcbiAgRDogNjgsXG4gIFNQQUNFOiAzMlxufTtcbiIsIi8qanNoaW50IGJyb3dzZXI6dHJ1ZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBQaHlzaWNzKGdhbWUpIHtcbiAgdGhpcy5nYW1lID0gZ2FtZTtcbn1cbmV4cG9ydHMuUGh5c2ljcyA9IFBoeXNpY3M7XG5cblBoeXNpY3MuRVBTSUxPTiA9IDEgLyAzMjtcblxudmFyIEJveCA9IFBoeXNpY3MuQm94ID0gZnVuY3Rpb24gQm94KHgsIHksIHcsIGgpIHtcbiAgdGhpcy54ID0geDtcbiAgdGhpcy55ID0geTtcbiAgdGhpcy53ID0gdztcbiAgdGhpcy5oID0gaDtcbn07XG5cbkJveC5wcm90b3R5cGUuaW5mbGF0ZSA9IGZ1bmN0aW9uKHBhZGRpbmdYLCBwYWRkaW5nWSkge1xuICByZXR1cm4gbmV3IEJveChcbiAgICB0aGlzLnggLSBwYWRkaW5nWCAvIDIsXG4gICAgdGhpcy55IC0gcGFkZGluZ1kgLyAyLFxuICAgIHRoaXMudyArIHBhZGRpbmdYLFxuICAgIHRoaXMuaCArIHBhZGRpbmdZKTtcbn07XG5cbnZhciBQb2ludCA9IFBoeXNpY3MuUG9pbnQgPSBmdW5jdGlvbiBQb2ludCh4LCB5KSB7XG4gIHRoaXMueCA9IHg7XG4gIHRoaXMueSA9IHk7XG59O1xuXG5QaHlzaWNzLnByb3RvdHlwZS5kcmF3UG9pbnQgPSBmdW5jdGlvbih4LCB5LCBjb2xvciwgc2l6ZSkge1xuICBzaXplID0gc2l6ZSB8fCA0O1xuICB0aGlzLmdhbWUuY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFJlY3QoeCAtIChzaXplIC8gMiksIHkgLSAoc2l6ZSAvIDIpLCBzaXplLCBzaXplKTtcbn07XG5cblBoeXNpY3MucHJvdG90eXBlLmRyYXdMaW5lID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIsIGNvbG9yKSB7XG4gIHRoaXMuZ2FtZS5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICB0aGlzLmdhbWUuY29udGV4dC5tb3ZlVG8oeDEsIHkxKTtcbiAgdGhpcy5nYW1lLmNvbnRleHQubGluZVRvKHgyLCB5Mik7XG4gIHRoaXMuZ2FtZS5jb250ZXh0LmNsb3NlUGF0aCgpO1xuICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2UoKTtcbn07XG5cblBoeXNpY3MucHJvdG90eXBlLmRyYXdUZXh0ID0gZnVuY3Rpb24oeCwgeSwgdGV4dCwgY29sb3IpIHtcbiAgY29sb3IgPSBjb2xvciB8fCAnd2hpdGUnO1xuICB0aGlzLmdhbWUuY29udGV4dC5mb250ID0gJzE0cHggQXJpYWwnO1xuICB0aGlzLmdhbWUuY29udGV4dC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgdGhpcy5nYW1lLmNvbnRleHQuZmlsbFRleHQodGV4dCwgeCwgeSk7XG59O1xuXG5QaHlzaWNzLnByb3RvdHlwZS5kcmF3Qm94ID0gZnVuY3Rpb24oeCwgeSwgdywgaCwgY29sb3IpIHtcbiAgY29sb3IgPSBjb2xvciB8fCAnd2hpdGUnO1xuICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VTdHlsZSA9IGNvbG9yO1xuICB0aGlzLmdhbWUuY29udGV4dC5zdHJva2VSZWN0KHgsIHksIHcsIGgpO1xufTtcblxuUGh5c2ljcy5wcm90b3R5cGUuZ2V0RGVsdGEgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xuICByZXR1cm4ge3g6IHgyIC0geDEsIHk6IHkyIC0geTF9O1xufTtcblxuUGh5c2ljcy5wcm90b3R5cGUuaW50ZXJzZWN0U2VnbWVudEludG9Cb3ggPSBmdW5jdGlvbihcbiAgICBzZWdtZW50UG9zLCBzZWdtZW50RGVsdGEsIHBhZGRlZEJveCwgZGVidWcpIHtcbiAgLy8gZHJhd0JveChwYWRkZWRCb3gueCwgcGFkZGVkQm94LnksIHBhZGRlZEJveC53LCBwYWRkZWRCb3guaCwgJ2dyYXknKTtcblxuICB2YXIgbmVhclhQZXJjZW50LCBmYXJYUGVyY2VudDtcbiAgaWYgKHNlZ21lbnREZWx0YS54ID49IDApIHtcbiAgICAvLyBnb2luZyBsZWZ0IHRvIHJpZ2h0XG4gICAgbmVhclhQZXJjZW50ID0gKHBhZGRlZEJveC54IC0gc2VnbWVudFBvcy54KSAvIHNlZ21lbnREZWx0YS54O1xuICAgIGZhclhQZXJjZW50ID0gKChwYWRkZWRCb3gueCArIHBhZGRlZEJveC53KSAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueDtcbiAgfSBlbHNlIHtcbiAgICAvLyBnb2luZyByaWdodCB0byBsZWZ0XG4gICAgbmVhclhQZXJjZW50ID0gKFxuICAgICAgKChwYWRkZWRCb3gueCArIHBhZGRlZEJveC53KSAtIHNlZ21lbnRQb3MueCkgLyBzZWdtZW50RGVsdGEueCk7XG4gICAgZmFyWFBlcmNlbnQgPSAocGFkZGVkQm94LnggLSBzZWdtZW50UG9zLngpIC8gc2VnbWVudERlbHRhLng7XG4gIH1cblxuICB2YXIgbmVhcllQZXJjZW50LCBmYXJZUGVyY2VudDtcbiAgaWYgKHNlZ21lbnREZWx0YS55ID49IDApIHtcbiAgICAvLyBnb2luZyB0b3AgdG8gYm90dG9tXG4gICAgbmVhcllQZXJjZW50ID0gKHBhZGRlZEJveC55IC0gc2VnbWVudFBvcy55KSAvIHNlZ21lbnREZWx0YS55O1xuICAgIGZhcllQZXJjZW50ID0gKChwYWRkZWRCb3gueSArIHBhZGRlZEJveC5oKSAtIHNlZ21lbnRQb3MueSkgLyBzZWdtZW50RGVsdGEueTtcbiAgfSBlbHNlIHtcbiAgICAvLyBnb2luZyBib3R0b20gdG8gdG9wXG4gICAgbmVhcllQZXJjZW50ID0gKFxuICAgICAgKChwYWRkZWRCb3gueSArIHBhZGRlZEJveC5oKSAtIHNlZ21lbnRQb3MueSkgLyBzZWdtZW50RGVsdGEueSk7XG4gICAgZmFyWVBlcmNlbnQgPSAocGFkZGVkQm94LnkgLSBzZWdtZW50UG9zLnkpIC8gc2VnbWVudERlbHRhLnk7XG4gIH1cblxuICAvLyBjYWxjdWxhdGUgdGhlIGZ1cnRoZXIgb2YgdGhlIHR3byBuZWFyIHBlcmNlbnRzXG4gIHZhciBuZWFyUGVyY2VudDtcbiAgaWYgKG5lYXJYUGVyY2VudCA+IG5lYXJZUGVyY2VudCkge1xuICAgIG5lYXJQZXJjZW50ID0gbmVhclhQZXJjZW50O1xuICB9IGVsc2Uge1xuICAgIG5lYXJQZXJjZW50ID0gbmVhcllQZXJjZW50O1xuICB9XG5cbiAgLy8gY2FsY3VsYXRlIHRoZSBuZWFyZXN0IG9mIHRoZSB0d28gZmFyIHBlcmNlbnRcbiAgdmFyIGZhclBlcmNlbnQ7XG4gIGlmIChmYXJYUGVyY2VudCA8IGZhcllQZXJjZW50KSB7XG4gICAgZmFyUGVyY2VudCA9IGZhclhQZXJjZW50O1xuICB9IGVsc2Uge1xuICAgIGZhclBlcmNlbnQgPSBmYXJZUGVyY2VudDtcbiAgfVxuXG4gIHZhciBoaXQ7XG4gIGlmIChuZWFyWFBlcmNlbnQgPiBmYXJZUGVyY2VudCB8fCBuZWFyWVBlcmNlbnQgPiBmYXJYUGVyY2VudCkge1xuICAgIC8vIFdoZXJlIHRoZSBzZWdtZW50IGhpdHMgdGhlIGxlZnQgZWRnZSBvZiB0aGUgYm94LCBoYXMgdG8gYmUgYmV0d2VlblxuICAgIC8vIHRoZSB0b3AgYW5kIGJvdHRvbSBlZGdlcyBvZiB0aGUgYm94LiBPdGhlcndpc2UsIHRoZSBzZWdtZW50IGlzXG4gICAgLy8gcGFzc2luZyB0aGUgYm94IHZlcnRpY2FsbHkgYmVmb3JlIGl0IGhpdHMgdGhlIGxlZnQgc2lkZS5cbiAgICBoaXQgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChuZWFyUGVyY2VudCA+IDEpIHtcbiAgICAvLyB0aGUgYm94IGlzIHBhc3QgdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgIGhpdCA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGZhclBlcmNlbnQgPCAwKSB7XG4gICAgLy8gdGhlIGJveCBpcyBiZWZvcmUgdGhlIHN0YXJ0IG9mIHRoZSBsaW5lXG4gICAgaGl0ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgaGl0ID0gdHJ1ZTtcbiAgfVxuXG4gIHZhciBoaXRQZXJjZW50ID0gbmVhclBlcmNlbnQ7XG4gIHZhciBoaXROb3JtYWwgPSB7fTtcbiAgaWYgKG5lYXJYUGVyY2VudCA+IG5lYXJZUGVyY2VudCkge1xuICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIGxlZnQgb3IgcmlnaHQgZWRnZVxuICAgIGlmIChzZWdtZW50RGVsdGEueCA+PSAwKSB7XG4gICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSBsZWZ0IGVkZ2VcbiAgICAgIGhpdE5vcm1hbC54ID0gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIHJpZ2h0IGVkZ2VcbiAgICAgIGhpdE5vcm1hbC54ID0gMTtcbiAgICB9XG4gICAgaGl0Tm9ybWFsLnkgPSAwO1xuICB9IGVsc2Uge1xuICAgIC8vIGNvbGxpZGVkIHdpdGggdGhlIHRvIG9yIGJvdHRvbSBlZGdlXG4gICAgaGl0Tm9ybWFsLnggPSAwO1xuICAgIGlmIChzZWdtZW50RGVsdGEueSA+PSAwKSB7XG4gICAgICAvLyBjb2xsaWRlZCB3aXRoIHRoZSB0b3AgZWRnZVxuICAgICAgaGl0Tm9ybWFsLnkgPSAtMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY29sbGlkZWQgd2l0aCB0aGUgYm90dG9tIGVkZ2VcbiAgICAgIGhpdE5vcm1hbC55ID0gMTtcbiAgICB9XG4gIH1cbiAgaWYgKGhpdFBlcmNlbnQgPCAwKSB7XG4gICAgaGl0UGVyY2VudCA9IDA7XG4gIH1cblxuICB2YXIgaGl0UG9zID0ge1xuICAgIHg6IHNlZ21lbnRQb3MueCArIChzZWdtZW50RGVsdGEueCAqIGhpdFBlcmNlbnQpLFxuICAgIHk6IHNlZ21lbnRQb3MueSArIChzZWdtZW50RGVsdGEueSAqIGhpdFBlcmNlbnQpXG4gIH07XG5cbiAgaGl0UG9zLnggKz0gaGl0Tm9ybWFsLnggKiBQaHlzaWNzLkVQU0lMT047XG4gIGhpdFBvcy55ICs9IGhpdE5vcm1hbC55ICogUGh5c2ljcy5FUFNJTE9OO1xuXG4gIHJldHVybiB7XG4gICAgaGl0OiBoaXQsXG4gICAgaGl0Tm9ybWFsOiBoaXROb3JtYWwsXG4gICAgaGl0UGVyY2VudDogaGl0UGVyY2VudCxcbiAgICBoaXRQb3M6IGhpdFBvcyxcbiAgICBuZWFyUGVyY2VudDogbmVhclBlcmNlbnQsXG4gICAgbmVhclhQZXJjZW50OiBuZWFyWFBlcmNlbnQsXG4gICAgbmVhcllQZXJjZW50OiBuZWFyWVBlcmNlbnQsXG4gICAgZmFyUGVyY2VudDogZmFyUGVyY2VudCxcbiAgICBmYXJYUGVyY2VudDogZmFyWFBlcmNlbnQsXG4gICAgZmFyWVBlcmNlbnQ6IGZhcllQZXJjZW50LFxuICAgIGhpdEJveDogcGFkZGVkQm94XG4gIH07XG59O1xuXG5QaHlzaWNzLnByb3RvdHlwZS5zd2VlcEJveEludG9Cb3ggPSBmdW5jdGlvbihcbiAgICBtb3ZpbmdCb3gsIHNlZ21lbnREZWx0YSwgc3RhdGljQm94KSB7XG4gIHZhciBzZWdtZW50UG9zID0ge1xuICAgIHg6IG1vdmluZ0JveC54ICsgbW92aW5nQm94LncgLyAyLFxuICAgIHk6IG1vdmluZ0JveC55ICsgbW92aW5nQm94LmggLyAyXG4gIH07XG5cbiAgdmFyIHBhZGRlZEJveCA9IG5ldyBCb3goXG4gICAgc3RhdGljQm94LnggLSBtb3ZpbmdCb3gudyAvIDIsXG4gICAgc3RhdGljQm94LnkgLSBtb3ZpbmdCb3guaCAvIDIsXG4gICAgc3RhdGljQm94LncgKyBtb3ZpbmdCb3gudyxcbiAgICBzdGF0aWNCb3guaCArIG1vdmluZ0JveC5oKTtcbiAgdmFyIHJlc3VsdCA9IHRoaXMuaW50ZXJzZWN0U2VnbWVudEludG9Cb3goc2VnbWVudFBvcywgc2VnbWVudERlbHRhLFxuICAgIHBhZGRlZEJveCk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5QaHlzaWNzLnByb3RvdHlwZS5pbnRlcnNlY3RTZWdtZW50SW50b0JveGVzID0gZnVuY3Rpb24oXG4gICAgc2VnbWVudFBvcywgc2VnbWVudERlbHRhLCBzdGF0aWNCb3hlcykge1xuICB2YXIgbmVhcmVzdFJlc3VsdCA9IG51bGw7XG4gIGZvciAodmFyIGkgPSAwLCBpbCA9IHN0YXRpY0JveGVzLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcbiAgICB2YXIgc3RhdGljQm94ID0gc3RhdGljQm94ZXNbaV07XG4gICAgdmFyIHJlc3VsdCA9IHRoaXMuaW50ZXJzZWN0U2VnbWVudEludG9Cb3goc2VnbWVudFBvcywgc2VnbWVudERlbHRhLFxuICAgICAgc3RhdGljQm94KTtcbiAgICBpZiAocmVzdWx0LmhpdCkge1xuICAgICAgaWYgKCFuZWFyZXN0UmVzdWx0IHx8IHJlc3VsdC5oaXRQZXJjZW50IDwgbmVhcmVzdFJlc3VsdC5oaXRQZXJjZW50KSB7XG4gICAgICAgIG5lYXJlc3RSZXN1bHQgPSByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBuZWFyZXN0UmVzdWx0O1xufTtcblxuLy8gU3dlZXAgbW92aW5nQm94LCBhbG9uZyB0aGUgbW92ZW1lbnQgZGVzY3JpYmVkIGJ5IHNlZ21lbnREZWx0YSwgaW50byBlYWNoIGJveFxuLy8gaW4gdGhlIGxpc3Qgb2Ygc3RhdGljQm94ZXMuIFJldHVybiBhIHJlc3VsdCBvYmplY3QgZGVzY3JpYmluZyB0aGUgZmlyc3Rcbi8vIHN0YXRpYyBib3ggdGhhdCBtb3ZpbmdCb3ggaGl0cywgb3IgbnVsbC5cblBoeXNpY3MucHJvdG90eXBlLnN3ZWVwQm94SW50b0JveGVzID0gZnVuY3Rpb24oXG4gICAgbW92aW5nQm94LCBzZWdtZW50RGVsdGEsIHN0YXRpY0JveGVzKSB7XG4gIHZhciBuZWFyZXN0UmVzdWx0ID0gbnVsbDtcbiAgZm9yICh2YXIgaSA9IDAsIGlsID0gc3RhdGljQm94ZXMubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xuICAgIHZhciBzdGF0aWNCb3ggPSBzdGF0aWNCb3hlc1tpXTtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5zd2VlcEJveEludG9Cb3gobW92aW5nQm94LCBzZWdtZW50RGVsdGEsIHN0YXRpY0JveCk7XG4gICAgaWYgKHJlc3VsdC5oaXQpIHtcbiAgICAgIGlmICghbmVhcmVzdFJlc3VsdCB8fCByZXN1bHQuaGl0UGVyY2VudCA8IG5lYXJlc3RSZXN1bHQuaGl0UGVyY2VudCkge1xuICAgICAgICBuZWFyZXN0UmVzdWx0ID0gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbmVhcmVzdFJlc3VsdDtcbn07XG5cblBoeXNpY3MucHJvdG90eXBlLmNoZWNrTmVhcmVzdEhpdCA9IGZ1bmN0aW9uKFxuICAgIHNvdXJjZUFjdG9yLCBzdGF0aWNSZXN1bHQsIHRhcmdldFJlc3VsdCkge1xuICB2YXIgcmVzdWx0ID0ge307XG4gIHZhciBzb3VyY2VYID0gc291cmNlQWN0b3IuY3VyWDtcbiAgdmFyIHN0YXRpY1ggPSBzdGF0aWNSZXN1bHQuaGl0UG9zLng7XG4gIHZhciB0YXJnZXRYID0gdGFyZ2V0UmVzdWx0LmhpdFBvcy54O1xuICB2YXIgc291cmNlWSA9IHNvdXJjZUFjdG9yLmN1clk7XG4gIHZhciBzdGF0aWNZID0gc3RhdGljUmVzdWx0LmhpdFBvcy55O1xuICB2YXIgdGFyZ2V0WSA9IHRhcmdldFJlc3VsdC5oaXRQb3MueTtcblxuICBpZiAoc291cmNlQWN0b3IuZGlyWCA9PT0gLTEgfHwgc291cmNlQWN0b3IuZGlyWCA9PT0gMSkge1xuICAgIGlmIChNYXRoLmFicyhzb3VyY2VYIC0gc3RhdGljWCkgPCBNYXRoLmFicyhzb3VyY2VYIC0gdGFyZ2V0WCkpIHtcbiAgICAgIHJlc3VsdC50YXJnZXRIaXQgPSBmYWxzZTtcbiAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUGh5c2ljcy5Qb2ludChcbiAgICAgICAgc3RhdGljUmVzdWx0LmhpdFBvcy54LCBzdGF0aWNSZXN1bHQuaGl0UG9zLnkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQuZW5kUG9zID0gbmV3IFBoeXNpY3MuUG9pbnQoXG4gICAgICAgIHRhcmdldFJlc3VsdC5oaXRQb3MueCwgdGFyZ2V0UmVzdWx0LmhpdFBvcy55KTtcbiAgICAgIHJlc3VsdC50YXJnZXRIaXQgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIGlmIChzb3VyY2VBY3Rvci5kaXJZID09PSAtMSB8fCBzb3VyY2VBY3Rvci5kaXJZID09PSAxKSB7XG4gICAgaWYgKE1hdGguYWJzKHNvdXJjZVkgLSBzdGF0aWNZKSA8IE1hdGguYWJzKHNvdXJjZVkgLSB0YXJnZXRZKSkge1xuICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IGZhbHNlO1xuICAgICAgcmVzdWx0LmVuZFBvcyA9IG5ldyBQaHlzaWNzLlBvaW50KFxuICAgICAgICBzdGF0aWNSZXN1bHQuaGl0UG9zLngsIHN0YXRpY1Jlc3VsdC5oaXRQb3MueSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdC5lbmRQb3MgPSBuZXcgUGh5c2ljcy5Qb2ludChcbiAgICAgICAgdGFyZ2V0UmVzdWx0LmhpdFBvcy54LCB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgcmVzdWx0LnRhcmdldEhpdCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5QaHlzaWNzLnByb3RvdHlwZS5nZXRUYXJnZXREZWdyZWUgPSBmdW5jdGlvbihkZWx0YSkge1xuICB2YXIgdGhldGEgPSBNYXRoLmF0YW4yKGRlbHRhLngsIGRlbHRhLnkpO1xuICB2YXIgZGVncmVlID0gdGhldGEgKiAoMTgwIC8gTWF0aC5QSSk7XG4gIGlmICh0aGV0YSA8IDApIHtcbiAgICBkZWdyZWUgKz0gMzYwO1xuICB9XG4gIHJldHVybiBkZWdyZWU7XG59O1xuXG5QaHlzaWNzLnByb3RvdHlwZS5kZWdUb1BvcyA9IGZ1bmN0aW9uKGRlZ3JlZSwgcmFkaXVzKSB7XG4gIHZhciByYWRpYW4gPSBkZWdyZWUgKiAoTWF0aC5QSSAvIDE4MCk7XG4gIHZhciByZXN1bHQgPSB7XG4gICAgeDogcmFkaXVzICogTWF0aC5zaW4ocmFkaWFuKSxcbiAgICB5OiByYWRpdXMgKiBNYXRoLmNvcyhyYWRpYW4pXG4gIH07XG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4ndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7QWN0b3J9IGZyb20gJy4vYmVyemVyayc7XG5cbmV4cG9ydCBjbGFzcyBCdWxsZXQgZXh0ZW5kcyBBY3RvciB7XG4gIGNvbnN0cnVjdG9yKHN0YXJ0WCwgc3RhcnRZLCBzcGVlZCwgZGlyWCwgZGlyWSkge1xuICAgIHZhciBpbWFnZSA9IHt3OiA1LCBoOiA1fTtcbiAgICBzdXBlcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIDEwMCwgc3BlZWQsIHNwZWVkLCBkaXJYLCBkaXJZKTtcbiAgICB0aGlzLmRlYXRoVGltZXIgPSAwO1xuICB9XG5cbiAgZHJhdyhnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIGdhbWUuY29udGV4dC5maWxsU3R5bGUgPSAnI0ZGRic7XG4gICAgZ2FtZS5jb250ZXh0LmZpbGxSZWN0KHRoaXMuY3VyWCwgdGhpcy5jdXJZLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gIH1cblxuICB1cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBzdXBlci51cGRhdGUoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgIHRoaXMuZGVhdGhUaW1lciArPSBlbGFwc2VkVGltZTtcbiAgICBpZiAodGhpcy5kZWF0aFRpbWVyID49IDEpIHtcbiAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0Jztcblxud2luZG93LkRlYXRoYm90ID0gZXhwb3J0cztcbmV4cG9ydCB7R2FtZX0gZnJvbSAnLi9nYW1lJztcbmV4cG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5leHBvcnQge01vbnN0ZXJ9IGZyb20gJy4vbW9uc3Rlcic7XG5leHBvcnQge0J1bGxldH0gZnJvbSAnLi9idWxsZXQnO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsICgpID0+IHtcbiAgLy8gVGhlIERlYXRoYm90IHByb3BlcnRpZXMgd2lsbCBiZSBmaWxsZWQgaW4gYnkgdGhlIG90aGVyIHNjcmlwdHMuIEV2ZW5cbiAgLy8gdGhvdWdoIHRoZXkgZG9uJ3QgbG9vayBsaWtlIHRoZXkgZXhpc3QgYXQgdGhpcyBwb2ludCwgdGhleSB3aWxsIGJ5IHRoZVxuICAvLyB0aW1lIHRoZSB3aW5kb3cgbG9hZCBldmVudCBoYXMgZmlyZWQuXG5cbiAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNkZWF0aGJvdCcpO1xuICB2YXIgY2FudmFzQkcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjYmFja2dyb3VuZCcpO1xuICB2YXIgZ2FtZSA9IHdpbmRvdy5kZWF0aGJvdEdhbWUgPSBuZXcgZXhwb3J0cy5HYW1lKFxuICAgIGNhbnZhcywgY2FudmFzQkcsICcjMTExJyk7XG4gIGdhbWUubG9hZEltYWdlcygpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgZ2FtZS5vbktleURvd24oZXZlbnQpO1xuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZXZlbnQpID0+IHtcbiAgICBnYW1lLm9uS2V5VXAoZXZlbnQpO1xuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgZ2FtZS5vbk1vdXNlTW92ZShldmVudCk7XG4gIH0pO1xuXG4gIHZhciBibHVycmVkID0gZmFsc2U7XG4gIHZhciBzZXRGb2N1cyA9IChldmVudCkgPT4ge1xuICAgIGlmIChldmVudCkge1xuICAgICAgaWYgKGV2ZW50LnR5cGUgPT09ICdibHVyJykge1xuICAgICAgICBibHVycmVkID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQudHlwZSA9PT0gJ2ZvY3VzJykge1xuICAgICAgICBibHVycmVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGdhbWUuc2V0Rm9jdXMoZXZlbnQsIGRvY3VtZW50LmhpZGRlbiB8fCBibHVycmVkKTtcbiAgfTtcbiAgc2V0Rm9jdXMoKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBzZXRGb2N1cywgdHJ1ZSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIHNldEZvY3VzLCB0cnVlKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Zpc2liaWxpdHljaGFuZ2UnLCBzZXRGb2N1cywgdHJ1ZSk7XG5cbiAgdmFyIHJlc2l6ZVRpbWVvdXQ7XG4gIHdpbmRvdy5vbnJlc2l6ZSA9IChldmVudCkgPT4ge1xuICAgIGlmIChyZXNpemVUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQocmVzaXplVGltZW91dCk7XG4gICAgICByZXNpemVUaW1lb3V0ID0gbnVsbDtcbiAgICB9XG4gICAgcmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICByZXNpemVUaW1lb3V0ID0gbnVsbDtcbiAgICAgIGdhbWUub25SZXNpemUoZXZlbnQpO1xuICAgIH0sIDEwMDApO1xuICB9O1xuXG4gIHZhciBvbGRGcmFtZVRpbWUgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwKTtcbiAgdmFyIHRpY2sgPSAoKSA9PiB7XG4gICAgdmFyIG5ld0ZyYW1lVGltZSA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDEwMDApO1xuICAgIHZhciBlbGFwc2VkVGltZSA9IG5ld0ZyYW1lVGltZSAtIG9sZEZyYW1lVGltZTtcbiAgICBvbGRGcmFtZVRpbWUgPSBuZXdGcmFtZVRpbWU7XG4gICAgZ2FtZS50aWNrKGVsYXBzZWRUaW1lKTtcbiAgICBzZXRUaW1lb3V0KHRpY2ssIE1hdGguZmxvb3IoMTAwMCAvIGdhbWUuZnJhbWVzUGVyU2Vjb25kKSk7XG4gIH07XG4gIHRpY2soKTtcbn0pO1xuIiwiLypqc2hpbnQgYnJvd3Nlcjp0cnVlICovXG4vKmdsb2JhbHMgU1M6ZmFsc2UgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtHYW1lIGFzIEJlcnplcmtHYW1lLCBLZXlzLCBQaHlzaWNzfSBmcm9tICcuL2JlcnplcmsnO1xuaW1wb3J0IHtQbGF5ZXJ9IGZyb20gJy4vcGxheWVyJztcbmltcG9ydCB7TW9uc3Rlcn0gZnJvbSAnLi9tb25zdGVyJztcblxuY29uc3QgREVCVUdfVElMRSA9IDk7XG5jb25zdCBMRVZFTFMgPSBbXG4gIHtcbiAgICBjb2xzOiAyOCxcbiAgICByb3dzOiAyOCxcbiAgICBncmlkOiBbXG4gICAgICAwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLFxuICAgICAgMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDEsMSwwLDAsMCwwLDAsMCwyLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwxLDEsMCwwLDAsMCwwLDAsMiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMiwyLDAsMiwyLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwyLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMiwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDIsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDEsMSwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMSwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwwLDEsMSwxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMSxcbiAgICAgIDEsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDEsXG4gICAgICAxLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwwLDAsMCwxLFxuICAgICAgMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSwxLDEsMSxcbiAgICBdXG4gIH1cbl07XG5cbmNvbnN0IENIQVJBQ1RFUlMgPSBbXG4gIHtcbiAgICBuYW1lOiAnZGVhdGhib3QnLFxuICAgIGltYWdlOiAnaW1nL2RlYXRoYm90LnBuZycsXG4gICAgaW1hZ2VVcDogJ2ltZy9kZWF0aGJvdF91cC5wbmcnLFxuICAgIGltYWdlRG93bjogJ2ltZy9kZWF0aGJvdF9kb3duLnBuZycsXG4gICAgdzogNDAsXG4gICAgaDogNTJcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdwbGF5ZXInLFxuICAgIGltYWdlOiAnaW1nL3BsYXllci5wbmcnLFxuICAgIHc6IDI4LFxuICAgIGg6IDUyXG4gIH1cbl07XG5cbmV4cG9ydCBjbGFzcyBHYW1lIGV4dGVuZHMgQmVyemVya0dhbWUge1xuICBjb25zdHJ1Y3RvcihjYW52YXMsIGNhbnZhc0JHLCBmaWxsU3R5bGUpIHtcbiAgICBzdXBlcihjYW52YXMpO1xuICAgIHRoaXMucGxheWVyRGVhdGhNZXRob2QgPSAnJztcbiAgICB0aGlzLmdhbWVTdGF0ZSA9ICdhdHRyYWN0JzsgLy8gYXR0cmFjdCwgcGxheSwgZGVhZFxuICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgIHRoaXMucm91bmQgPSAyO1xuICAgIHRoaXMubnVtT2ZNb25zdGVycyA9IDA7XG4gICAgdGhpcy5jZWxsV2lkdGggPSAzMjtcbiAgICB0aGlzLmNlbGxIZWlnaHQgPSAzMjtcbiAgICB0aGlzLnRpbGVzID0gbnVsbDtcbiAgICB0aGlzLmNvbHMgPSBMRVZFTFNbMF0uY29scztcbiAgICB0aGlzLnJvd3MgPSBMRVZFTFNbMF0ucm93cztcbiAgICB0aGlzLmdyaWQgPSBMRVZFTFNbMF0uZ3JpZDtcbiAgICB0aGlzLnNwYXduR3JpZCA9IFtdO1xuICAgIHRoaXMuc3RhdGljQmxvY2tzID0gW107XG4gICAgdGhpcy5maWxsU3R5bGUgPSBmaWxsU3R5bGU7XG4gICAgdGhpcy5jYW52YXNCRyA9IGNhbnZhc0JHO1xuICAgIHRoaXMuY2FudmFzQkcud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICB0aGlzLmNhbnZhc0JHLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICB0aGlzLmNvbnRleHRCRyA9IHRoaXMuY2FudmFzQkcuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB0aGlzLmNhbnZhc0ZYID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI2Z4Jyk7XG4gICAgdGhpcy5jYW52YXNGWC53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIHRoaXMuY2FudmFzRlguaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgIHRoaXMuY29udGV4dEZYID0gdGhpcy5jYW52YXNGWC5nZXRDb250ZXh0KCcyZCcpO1xuICAgIC8vIHRoaXMuY29udGV4dEZYLmZpbGxTdHlsZSA9ICdyZ2JhKDAsIDAsIDAsIC41MCknO1xuICAgIC8vIHRoaXMuY29udGV4dEZYLmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzRlgud2lkdGgsIHRoaXMuY2FudmFzRlguaGVpZ2h0KTtcbiAgICB0aGlzLm1lc3NhZ2VUaW1lID0gMTA7XG5cbiAgICB0aGlzLmRlZmluZUtleSgnc3RhcnQnLCBLZXlzLlNQQUNFKTtcbiAgICB0aGlzLmRlZmluZUtleSgndXAnLCBLZXlzLlVQKTtcbiAgICB0aGlzLmRlZmluZUtleSgnZG93bicsIEtleXMuRE9XTik7XG4gICAgdGhpcy5kZWZpbmVLZXkoJ2xlZnQnLCBLZXlzLkxFRlQpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdyaWdodCcsIEtleXMuUklHSFQpO1xuICAgIHRoaXMuZGVmaW5lS2V5KCdzaG9vdFVwJywgS2V5cy5XKTtcbiAgICB0aGlzLmRlZmluZUtleSgnc2hvb3RMZWZ0JywgS2V5cy5BKTtcbiAgICB0aGlzLmRlZmluZUtleSgnc2hvb3REb3duJywgS2V5cy5TKTtcbiAgICB0aGlzLmRlZmluZUtleSgnc2hvb3RSaWdodCcsIEtleXMuRCk7XG4gIH1cblxuICBjcmVhdGVTcGF3blBvaW50cyhhY3RvcldpZHRoLCBhY3RvckhlaWdodCkge1xuICAgIGxldCBzcGF3bkxvY2F0aW9ucyA9IFtdO1xuICAgIGxldCBzcGF3bkdyaWQgPSB0aGlzLmdyaWQuc2xpY2UoMCk7XG5cbiAgICBsZXQgYWN0b3JCbG9jayA9IHtcbiAgICAgIHc6IE1hdGguY2VpbChhY3RvcldpZHRoIC8gdGhpcy5jZWxsV2lkdGgpLFxuICAgICAgaDogTWF0aC5jZWlsKGFjdG9ySGVpZ2h0IC8gdGhpcy5jZWxsSGVpZ2h0KVxuICAgIH07XG4gICAgZm9yIChsZXQgaSA9IDAsIGxpID0gdGhpcy5ncmlkLmxlbmd0aDsgaSA8IGxpOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmdyaWRbaV0gPT09IDApIHtcbiAgICAgICAgbGV0IG51bU9mU3BhY2VzTmVlZGVkID0gYWN0b3JCbG9jay53ICogYWN0b3JCbG9jay5oO1xuICAgICAgICBsZXQgbnVtT2ZFbXB0eVNwYWNlcyA9IDA7XG4gICAgICAgIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IGFjdG9yQmxvY2sudzsgcm93KyspIHtcbiAgICAgICAgICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCBhY3RvckJsb2NrLmg7IGNvbCsrKSB7XG4gICAgICAgICAgICBsZXQgY3VyQ29sID0gKGkgJSB0aGlzLmNvbHMpICsgcm93O1xuICAgICAgICAgICAgbGV0IGN1clJvdyA9IE1hdGguZmxvb3IoaSAvIHRoaXMuY29scykgKyBjb2w7XG4gICAgICAgICAgICBsZXQgaW5kZXggPSAoY3VyUm93ICogdGhpcy5jb2xzKSArIGN1ckNvbDtcbiAgICAgICAgICAgIGlmICh0aGlzLmdyaWRbaW5kZXhdID09PSAwKSB7XG4gICAgICAgICAgICAgIG51bU9mRW1wdHlTcGFjZXMrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG51bU9mRW1wdHlTcGFjZXMgPT09IG51bU9mU3BhY2VzTmVlZGVkKSB7XG4gICAgICAgICAgc3Bhd25Mb2NhdGlvbnMucHVzaChpKTtcbiAgICAgICAgICBzcGF3bkdyaWRbaV0gPSBERUJVR19USUxFO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3Bhd25HcmlkID0gc3Bhd25HcmlkO1xuICAgIHJldHVybiBzcGF3bkxvY2F0aW9ucztcbiAgfVxuXG4gIHJhbmRvbWl6ZVNwYXducygpIHtcbiAgICB0aGlzLmVhY2hBY3RvcihmdW5jdGlvbihhY3Rvcikge1xuICAgICAgaWYgKCEoYWN0b3IgaW5zdGFuY2VvZiBNb25zdGVyKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBhY3Rvci5zcGF3blBvaW50cyA9IHRoaXMuY3JlYXRlU3Bhd25Qb2ludHMoYWN0b3Iud2lkdGgsIGFjdG9yLmhlaWdodCk7XG4gICAgICBsZXQgc3Bhd25JbmRleCA9IGFjdG9yLnNwYXduUG9pbnRzW1xuICAgICAgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYWN0b3Iuc3Bhd25Qb2ludHMubGVuZ3RoKV07XG4gICAgICBsZXQgc3Bhd25YWSA9IHRoaXMuY2FsY0dyaWRYWShzcGF3bkluZGV4KTtcbiAgICAgIGFjdG9yLmN1clggPSBzcGF3blhZLngxICsgUGh5c2ljcy5FUFNJTE9OO1xuICAgICAgYWN0b3IuY3VyWSA9IHNwYXduWFkueTEgKyBQaHlzaWNzLkVQU0lMT047XG4gICAgfSx0aGlzKTtcbiAgfVxuXG4gIGNhbGNHcmlkWFkoZ3JpZEluZGV4KSB7XG4gICAgbGV0IGN1clJvdywgY3VyQ29sLCBncmlkWDEsIGdyaWRYMiwgZ3JpZFkxLCBncmlkWTI7XG4gICAgbGV0IHJlc3VsdCA9IHt4MTogMCwgeTE6IDAsIHgyOiAwLCB5MjogMH07XG4gICAgY3VyQ29sID0gZ3JpZEluZGV4ICUgdGhpcy5jb2xzO1xuICAgIGN1clJvdyA9IE1hdGguZmxvb3IoZ3JpZEluZGV4IC8gdGhpcy5jb2xzKTtcbiAgICBncmlkWDEgPSBjdXJDb2wgKiB0aGlzLmNlbGxXaWR0aDtcbiAgICBncmlkWTEgPSBjdXJSb3cgKiB0aGlzLmNlbGxIZWlnaHQ7XG4gICAgZ3JpZFgyID0gZ3JpZFgxICsgdGhpcy5jZWxsV2lkdGg7XG4gICAgZ3JpZFkyID0gZ3JpZFkxICsgdGhpcy5jZWxsSGVpZ2h0O1xuICAgIHJlc3VsdCA9IHt4MTogZ3JpZFgxLCB5MTogZ3JpZFkxLCB4MjogZ3JpZFgyLCB5MjogZ3JpZFkyfTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gTG9vcHMgdGhyb3VnaCBBY3RvciBhcnJheSBhbmQgY3JlYXRlcyBjYWxsYWJsZSBpbWFnZXMuXG4gIGxvYWRJbWFnZXMoKSB7XG4gICAgc3VwZXIubG9hZEltYWdlcyhDSEFSQUNURVJTLFxuICAgICAge3RpbGVzOiAnaW1nL3RpbGVzLnBuZyd9KTtcbiAgfVxuXG4gIGVhY2hBY3RvcihjYWxsYmFjaywgY29udGV4dCkge1xuICAgIGZvciAobGV0IGMgaW4gdGhpcy5hY3RvcnMpIHtcbiAgICAgIGlmICh0aGlzLmFjdG9ycy5oYXNPd25Qcm9wZXJ0eShjKSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKGNvbnRleHQsIHRoaXMuYWN0b3JzW2NdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpbml0aWFsaXplKGVsYXBzZWRUaW1lKSB7XG4gICAgc3VwZXIuaW5pdGlhbGl6ZShlbGFwc2VkVGltZSk7XG5cbiAgICB0aGlzLmRyYXdCYWNrZ3JvdW5kKGVsYXBzZWRUaW1lKTtcbiAgICB0aGlzLnN0YXRpY0Jsb2NrcyA9IFtdO1xuICAgIHRoaXMucGh5c2ljcyA9IG5ldyBQaHlzaWNzKHRoaXMpO1xuICAgIHRoaXMuYWN0b3JzID0ge1xuICAgICAgLy9pbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCwgZGlyWVxuICAgICAgcGxheWVyOiBuZXcgUGxheWVyKFxuICAgICAgICB0aGlzLmltYWdlcy5wbGF5ZXIsIDg1LCA0NTQsIDEwMCwgMTUwLCAxNTAsIDEsIDEpLFxuICAgICAgZGVhdGhib3QxOiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDI1MCwgNTAwLCAxMDAsIDEwMCwgMTAwLCAtMSwgMSksXG4gICAgICBkZWF0aGJvdDM6IG5ldyBNb25zdGVyKFxuICAgICAgICB0aGlzLmltYWdlcy5kZWF0aGJvdCwgMTIwLCAxMTAsIDMwMCwgMTEwLCAxMTUsIDEsIDEpLFxuICAgICAgZGVhdGhib3Q0OiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDMwMCwgMjAwLCAxMDAsIDIwMCwgMjAwLCAtMSwgLTEpLFxuICAgICAgZGVhdGhib3Q1OiBuZXcgTW9uc3RlcihcbiAgICAgICAgdGhpcy5pbWFnZXMuZGVhdGhib3QsIDUwMCwgNDAwLCAxMDAsIDIwMCwgMjAwLCAxLCAxKVxuICAgIH07XG5cbiAgICB0aGlzLm51bU9mTW9uc3RlcnMgPSAwO1xuICAgIHRoaXMucGxheWVyRGVhdGhNZXRob2QgPSAnJztcbiAgICB0aGlzLnJvdW5kID0gMjtcbiAgICB0aGlzLnNjb3JlID0gMDtcblxuICAgIHRoaXMuZWFjaEFjdG9yKChhY3RvcikgPT4ge1xuICAgICAgaWYgKGFjdG9yIGluc3RhbmNlb2YgTW9uc3Rlcikge1xuICAgICAgICB0aGlzLm51bU9mTW9uc3RlcnMrKztcbiAgICAgIH1cbiAgICAgIGFjdG9yLmFjdGl2ZSA9IHRydWU7XG4gICAgICBhY3Rvci5oZWFsdGggPSAxMDA7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBmb3IgKGxldCBpID0gMCwgbGkgPSB0aGlzLmdyaWQubGVuZ3RoOyBsaSA+IGk7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZ3JpZFtpXSkge1xuICAgICAgICBsZXQgYmxvY2tYWSA9IHRoaXMuY2FsY0dyaWRYWShpKTtcbiAgICAgICAgbGV0IGJsb2NrID0gbmV3IFBoeXNpY3MuQm94KFxuICAgICAgICAgIGJsb2NrWFkueDEsIGJsb2NrWFkueTEsIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQpO1xuICAgICAgICB0aGlzLnN0YXRpY0Jsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnJhbmRvbWl6ZVNwYXducygpO1xuICB9XG5cbiAgbGVhZGVyYm9hcmQoKSB7XG4gICAgbGV0IHlQb3MgPSA2MDtcbiAgICBsZXQgeFBvcyA9IDk0MDtcbiAgICAvLyBpZiAoU1MuY3VycmVudFNjb3Jlcykge1xuICAgIC8vICAgdGhpcy5kcmF3U2NvcmVzKCcqKioqKiBIaSBTY29yZXMgKioqKionLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICB5UG9zICs9IDMwO1xuICAgIC8vICAgbGV0IGxiID0gU1MuY3VycmVudFNjb3JlcztcbiAgICAvLyAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGIubGVuZ3RoOyBpKyspIHtcbiAgICAvLyAgICAgdGhpcy5kcmF3U2NvcmVzKGxiW2ldLm5hbWUgKyAnICAnICsgIGxiW2ldLnNjb3JlLCB5UG9zLCB4UG9zLCAyMCk7XG4gICAgLy8gICAgIHlQb3MgKz0gMzA7XG4gICAgLy8gICB9XG4gICAgLy8gfVxuICB9XG5cbiAgZHJhdyhlbGFwc2VkVGltZSkge1xuICAgIHRoaXMuY29udGV4dEZYLmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICBzdXBlci5kcmF3KGVsYXBzZWRUaW1lKTtcblxuICAgIHRoaXMuZHJhd1Njb3JlKCk7XG5cbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgdGhpcy5kcmF3TWVzc2FnZSgnRGVhdGhib3QgNTAwMCcsIDEyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdXQVNEIHRvIFNob290JywgMTgwKTtcbiAgICAgIHRoaXMuZHJhd01lc3NhZ2UoJ0Fycm93IEtleXMgdG8gTW92ZScsIDIyMCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBCZWdpbicsIDI2MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmdhbWVTdGF0ZSA9PT0gJ2RlYWQnKSB7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdUaG91IGFydCAnICsgdGhpcy5wbGF5ZXJEZWF0aE1ldGhvZCk7XG4gICAgICB0aGlzLmRyYXdNZXNzYWdlKCdQcmVzcyBTcGFjZSB0byBTdGFydCBhZ2FpbicsIDI0MCk7XG4gICAgICB0aGlzLmxlYWRlcmJvYXJkKCk7XG4gICAgfVxuICB9XG5cbiAgZHJhd0JhY2tncm91bmQoZWxhcHNlZFRpbWUpIHtcbiAgICBsZXQgYmdDb2xvcjtcbiAgICBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdhdHRyYWN0Jykge1xuICAgICAgYmdDb2xvciA9ICdQdXJwbGUnO1xuICAgIH0gZWxzZSBpZiAodGhpcy5nYW1lU3RhdGUgPT09ICdkZWFkJykge1xuICAgICAgYmdDb2xvciA9ICdyZWQnO1xuICAgIH0gZWxzZSB7XG4gICAgICBiZ0NvbG9yID0gdGhpcy5maWxsU3R5bGU7XG4gICAgfVxuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9IGJnQ29sb3I7XG4gICAgdGhpcy5jb250ZXh0QkcuZmlsbFJlY3QoMCwgMCwgdGhpcy5jYW52YXNCRy53aWR0aCwgdGhpcy5jYW52YXNCRy5oZWlnaHQpO1xuICAgIHRoaXMuZHJhd0dyaWQodGhpcy5ncmlkKTtcbiAgICBpZiAodGhpcy5kZWJ1Z01vZGUpIHtcbiAgICAgIHRoaXMuZHJhd0dyaWQodGhpcy5zcGF3bkdyaWQpO1xuICAgIH1cbiAgfVxuXG4gIGRyYXdHcmlkKGdyaWQpIHtcbiAgICBsZXQgZ3JpZFBvc1ggPSAwLCBncmlkUG9zWSA9IDA7XG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgdGhpcy5yb3dzOyByb3crKykge1xuICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgdGhpcy5jb2xzOyBjb2wrKykge1xuICAgICAgICBsZXQgaW5kZXggPSAocm93ICogdGhpcy5jb2xzKSArIGNvbDtcbiAgICAgICAgZ3JpZFBvc1ggPSBjb2wgKiB0aGlzLmNlbGxXaWR0aDtcbiAgICAgICAgZ3JpZFBvc1kgPSByb3cgKiB0aGlzLmNlbGxIZWlnaHQ7XG5cbiAgICAgICAgaWYgKGdyaWRbaW5kZXhdKSB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0QkcuZHJhd0ltYWdlKHRoaXMudGlsZXMsIGdyaWRbaW5kZXhdICpcbiAgICAgICAgICB0aGlzLmNlbGxXaWR0aCwgMCwgdGhpcy5jZWxsV2lkdGgsIHRoaXMuY2VsbEhlaWdodCxcbiAgICAgICAgICBncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLCB0aGlzLmNlbGxIZWlnaHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChncmlkW2luZGV4XSA9PT0gREVCVUdfVElMRSkge1xuICAgICAgICAgIHRoaXMuY29udGV4dEJHLnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICAgICAgdGhpcy5jb250ZXh0Qkcuc3Ryb2tlUmVjdChncmlkUG9zWCwgZ3JpZFBvc1ksIHRoaXMuY2VsbFdpZHRoLFxuICAgICAgICAgICAgdGhpcy5jZWxsSGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRyYXdMb2FkaW5nKCkge1xuICAgIHRoaXMuY29udGV4dEJHLmZpbGxTdHlsZSA9ICcjY2NjJztcbiAgICB0aGlzLmNvbnRleHRCRy5maWxsUmVjdCgwLCAwLCB0aGlzLmNhbnZhc0JHLndpZHRoLCB0aGlzLmNhbnZhc0JHLmhlaWdodCk7XG4gIH1cblxuICBkcmF3TWVzc2FnZShtZXNzYWdlLCB5UG9zLCBzaXplKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB5UG9zID0geVBvcyB8fCAyMDA7XG4gICAgc2l6ZSA9IHNpemUgfHwgMjU7XG4gICAgdGhpcy5jb250ZXh0LmZvbnQgPSBzaXplICsgJ3B4IFZlcmRhbmEnO1xuICAgIGxldCBtZXRyaWNzID0gdGhpcy5jb250ZXh0Lm1lYXN1cmVUZXh0KG1lc3NhZ2UpO1xuICAgIGxldCB3aWR0aCA9IG1ldHJpY3Mud2lkdGg7XG4gICAgbGV0IG1lc3NhZ2VYID0gcG9zIC0gd2lkdGggLyAyO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIHRoaXMuY29udGV4dC5maWxsVGV4dChtZXNzYWdlLCBtZXNzYWdlWCwgeVBvcyk7XG4gIH1cblxuIGRyYXdTY29yZXMobWVzc2FnZSwgeVBvcywgeFBvcywgc2l6ZSkge1xuICAgIGxldCBwb3MgPSB0aGlzLmNhbnZhcy53aWR0aCAvIDI7XG4gICAgeVBvcyA9IHlQb3MgfHwgMjAwO1xuICAgIHNpemUgPSBzaXplIHx8IDI1O1xuICAgIHRoaXMuY29udGV4dC5mb250ID0gc2l6ZSArICdweCBWZXJkYW5hJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQobWVzc2FnZSwgeFBvcywgeVBvcyk7XG4gIH1cblxuICBkcmF3U2NvcmUoKSB7XG4gICAgbGV0IHBvcyA9IHRoaXMuY2FudmFzLndpZHRoIC8gMjtcbiAgICB0aGlzLmNvbnRleHQuZm9udCA9ICcyNXB4IFZlcmRhbmEnO1xuICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSAnd2hpdGUnO1xuICAgIGxldCBzY29yZVRleHQgPSAnR0FNRTogJyArIHRoaXMuc2NvcmU7XG4gICAgbGV0IG1ldHJpY3MgPSB0aGlzLmNvbnRleHQubWVhc3VyZVRleHQoc2NvcmVUZXh0KTtcbiAgICBsZXQgd2lkdGggPSBtZXRyaWNzLndpZHRoO1xuICAgIGxldCBzY29yZVggPSBwb3MgLSAod2lkdGggLyAyKTtcbiAgICB0aGlzLmNvbnRleHQuZmlsbFRleHQoc2NvcmVUZXh0LCBzY29yZVgsIDI1KTtcbiAgfVxuXG4gIHVwZGF0ZShlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShlbGFwc2VkVGltZSk7XG5cbiAgICBpZiAodGhpcy5rZXlEb3duLnN0YXJ0ICYmIHRoaXMuZ2FtZVN0YXRlICE9PSAncGxheScpIHtcbiAgICAgIHRoaXMuZ2FtZVN0YXRlID0gJ3BsYXknO1xuICAgICAgY29uc29sZS5sb2coJ0dhbWUgU3RhcnQnKTtcbiAgICAgIHRoaXMucmFuZG9taXplU3Bhd25zKCk7XG4gICAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubnVtT2ZNb25zdGVycyA9PT0gMCAmJiB0aGlzLmluaXRpYWxpemVkKSB7IC8vIFlvdSBiZWF0IGFsbCBtb25zdGVyc1xuICAgICAgdGhpcy5yYW5kb21pemVTcGF3bnMoKTtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VUaW1lID4gMCkgeyAvLyBzaG93IG5leHQgcm91bmQgbWVzc2FnZVxuICAgICAgICB0aGlzLmRyYXdNZXNzYWdlKCdSb3VuZCAnICsgdGhpcy5yb3VuZCk7XG4gICAgICAgIHRoaXMubWVzc2FnZVRpbWUgLT0gZWxhcHNlZFRpbWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm1lc3NhZ2VUaW1lID0gMTA7XG4gICAgICAgIHRoaXMucm91bmQrKztcbiAgICAgICAgLy8gUmV2aXZpbmcgbW9uc3RlcnMsIHRoaXMgd2lsbCBiZSByZWZhY3RvcmVkIGxhdGVyIHRvIHJhbmRvbWl6ZVxuICAgICAgICAvLyBwb3NpdGlvbnMgcmF0aGVyIHRoYW4ganVzdCByZWFjdGl2YXRpbmcgdGhlIGRlYWQgb25lcyB3aGVyZSB0aGV5XG4gICAgICAgIC8vIGZlbGwuXG4gICAgICAgIHRoaXMuZWFjaEFjdG9yKGZ1bmN0aW9uKGFjdG9yKSB7XG4gICAgICAgICAgaWYgKGFjdG9yIGluc3RhbmNlb2YgTW9uc3Rlcikge1xuICAgICAgICAgICAgdGhpcy5udW1PZk1vbnN0ZXJzKys7XG4gICAgICAgICAgICBhY3Rvci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgYWN0b3IuYWxwaGEgPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtBY3RvciwgUGh5c2ljcywgRGlyZWN0aW9uc30gZnJvbSAnLi9iZXJ6ZXJrJztcbmltcG9ydCB7UGxheWVyfSBmcm9tICcuL3BsYXllcic7XG5pbXBvcnQge0J1bGxldH0gZnJvbSAnLi9idWxsZXQnO1xuXG5leHBvcnQgY2xhc3MgTW9uc3RlciBleHRlbmRzIEFjdG9yIHtcbiAgY29uc3RydWN0b3IoaW1hZ2UsIHN0YXJ0WCwgc3RhcnRZLCBzY2FsZSwgc3BlZWRYLCBzcGVlZFksIGRpclgsIGRpclkpIHtcbiAgICAvLyBzdXBlcihpbWFnZSwgc3RhcnRYLCBzdGFydFksIHNjYWxlLCBzcGVlZFgsIHNwZWVkWSwgZGlyWCk7XG4gICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICB0aGlzLmRpclRpbWVyID0gMDtcbiAgICB0aGlzLmlzRmlyaW5nID0gZmFsc2U7XG4gICAgdGhpcy5sYXNlckRlbHRhID0ge307XG4gICAgdGhpcy5sYXNlclJhbmdlID0gNTAwO1xuICAgIHRoaXMubGFzZXJTdGFydCA9IHt9O1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDE0fTtcbiAgfVxuXG4gIGRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICAgIHN1cGVyLmRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpO1xuICAgICAgaWYgKGdhbWUuZGVidWdNb2RlKSB7XG4gICAgICAgIGdhbWUuY29udGV4dC5mb250ID0gJzE2cHggVmVyZGFuYSc7XG4gICAgICAgIGdhbWUuY29udGV4dC5maWxsU3R5bGUgPSAncmVkJztcbiAgICAgICAgZ2FtZS5jb250ZXh0LmZpbGxUZXh0KCdNb25zdGVyJyxcbiAgICAgICAgICB0aGlzLmN1clggKyAodGhpcy53aWR0aCAvIDQpLFxuICAgICAgICAgIHRoaXMuY3VyWSAtIDEwKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuYWxwaGEgPj0gMC4xKSB7XG4gICAgICB0aGlzLmFscGhhIC09IDAuMTtcbiAgICAgIGdhbWUuY29udGV4dC5nbG9iYWxBbHBoYSA9IHRoaXMuYWxwaGE7XG4gICAgICBzdXBlci5kcmF3KGdhbWUsIGVsYXBzZWRUaW1lKTtcbiAgICAgIGdhbWUuY29udGV4dC5nbG9iYWxBbHBoYSA9IDE7XG4gICAgfVxuICB9XG5cbiAgZmlyZUxhc2VyKGdhbWUsIHBsYXllcikge1xuICAgIGxldCBsYXNlckVuZHBvaW50ID0ge1xuICAgICAgeDogdGhpcy5sYXNlclN0YXJ0LnggKyB0aGlzLmxhc2VyRGVsdGEueCxcbiAgICAgIHk6IHRoaXMubGFzZXJTdGFydC55ICsgdGhpcy5sYXNlckRlbHRhLnlcbiAgICB9O1xuICAgIGxldCB0YXJnZXQgPSBbXTtcbiAgICBsZXQgdGFyZ2V0T2JqID0ge307XG4gICAgdGFyZ2V0T2JqLnggPSBwbGF5ZXIuY3VyWCArIDU7XG4gICAgdGFyZ2V0T2JqLnkgPSBwbGF5ZXIuY3VyWTtcbiAgICB0YXJnZXRPYmoudyA9IDE1O1xuICAgIHRhcmdldE9iai5oID0gIDE1O1xuICAgIHRhcmdldC5wdXNoKHRhcmdldE9iaik7XG4gICAgbGV0IHRhcmdldERlbHRhID0gZ2FtZS5waHlzaWNzLmdldERlbHRhKFxuICAgICAgdGhpcy5sYXNlclN0YXJ0LngsIHRoaXMubGFzZXJTdGFydC55LCB0YXJnZXRPYmoueCwgdGFyZ2V0T2JqLnkpO1xuICAgIHRoaXMuZmlyaW5nID0gdHJ1ZTtcbiAgICB0aGlzLm1vdmluZyA9IGZhbHNlO1xuXG4gICAgbGV0IGJsb2NrUmVzdWx0ID0gZ2FtZS5waHlzaWNzLmludGVyc2VjdFNlZ21lbnRJbnRvQm94ZXMoXG4gICAgICB0aGlzLmxhc2VyU3RhcnQsIHRoaXMubGFzZXJEZWx0YSwgZ2FtZS5zdGF0aWNCbG9ja3MpO1xuICAgIGxldCB0YXJnZXRSZXN1bHQgPSBnYW1lLnBoeXNpY3MuaW50ZXJzZWN0U2VnbWVudEludG9Cb3hlcyhcbiAgICAgIHRoaXMubGFzZXJTdGFydCwgdGhpcy5sYXNlckRlbHRhLCB0YXJnZXQpO1xuXG4gICAgbGV0IGVuZFBvczsgbGV0IHRhcmdldEhpdDtcbiAgICBpZiAoKGJsb2NrUmVzdWx0ICYmIGJsb2NrUmVzdWx0LmhpdCkgJiZcbiAgICAgICAgKHRhcmdldFJlc3VsdCAmJiB0YXJnZXRSZXN1bHQuaGl0KSkge1xuICAgICAgbGV0IHJlc3VsdCA9IGdhbWUucGh5c2ljcy5jaGVja05lYXJlc3RIaXQodGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrUmVzdWx0LCB0YXJnZXRSZXN1bHQpO1xuICAgICAgZW5kUG9zID0gcmVzdWx0LmVuZFBvcztcbiAgICAgIHRhcmdldEhpdCA9IHJlc3VsdC50YXJnZXRIaXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChibG9ja1Jlc3VsdCAmJiBibG9ja1Jlc3VsdC5oaXQpIHtcbiAgICAgICAgLy8gdXBkYXRlIGVuZCBwb3Mgd2l0aCBoaXQgcG9zXG4gICAgICAgIGVuZFBvcyA9IG5ldyBQaHlzaWNzLlBvaW50KGJsb2NrUmVzdWx0LmhpdFBvcy54LFxuICAgICAgICAgIGJsb2NrUmVzdWx0LmhpdFBvcy55KTtcbiAgICAgICAgZ2FtZS5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICB9IGVsc2UgaWYgKHRhcmdldFJlc3VsdCAmJiB0YXJnZXRSZXN1bHQuaGl0KSB7XG4gICAgICAgIGVuZFBvcyA9IG5ldyBQaHlzaWNzLlBvaW50KHRhcmdldFJlc3VsdC5oaXRQb3MueCxcbiAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0UG9zLnkpO1xuICAgICAgICB0YXJnZXRIaXQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW5kUG9zID0gbmV3IFBoeXNpY3MuUG9pbnQobGFzZXJFbmRwb2ludC54LCBsYXNlckVuZHBvaW50LnkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBkZWdUb0VuZHBvcyA9IGdhbWUucGh5c2ljcy5nZXRUYXJnZXREZWdyZWUodGhpcy5sYXNlckRlbHRhKTtcbiAgICBsZXQgZGVnVG9UYXJnZXQgPSBnYW1lLnBoeXNpY3MuZ2V0VGFyZ2V0RGVncmVlKHRhcmdldERlbHRhKTtcblxuICAgIGdhbWUuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICBnYW1lLmNvbnRleHQubW92ZVRvKHRoaXMubGFzZXJTdGFydC54LCB0aGlzLmxhc2VyU3RhcnQueSk7XG4gICAgZ2FtZS5jb250ZXh0LmxpbmVUbyhlbmRQb3MueCwgZW5kUG9zLnkpO1xuICAgIGdhbWUuY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICBnYW1lLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0YXJnZXRSZXN1bHQgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRSZXN1bHQuaGl0ID8gJ3JlZCcgOiAnYmx1ZSc7XG4gICAgZ2FtZS5jb250ZXh0LnN0cm9rZSgpO1xuXG4gICAgaWYgKCF0YXJnZXRIaXQpIHtcbiAgICAgIGxldCBuZXdEZWdyZWU7XG4gICAgICBpZiAodGhpcy5kaXJZID09PSAxKSB7XG4gICAgICAgIGlmIChkZWdUb0VuZHBvcyA8IDE4MCkge1xuICAgICAgICAgIGRlZ1RvRW5kcG9zICs9IDM2MDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVnVG9UYXJnZXQgPCAxODApIHtcbiAgICAgICAgICBkZWdUb1RhcmdldCArPSAzNjA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChkZWdUb0VuZHBvcyA+IGRlZ1RvVGFyZ2V0KSB7XG4gICAgICAgIGlmIChkZWdUb0VuZHBvcyAtIGRlZ1RvVGFyZ2V0ID4gNikge1xuICAgICAgICAgIG5ld0RlZ3JlZSA9IGRlZ1RvRW5kcG9zIC0gMztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdEZWdyZWUgPSBkZWdUb0VuZHBvcyAtIDAuNTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc2VyRGVsdGEgPSBnYW1lLnBoeXNpY3MuZGVnVG9Qb3MobmV3RGVncmVlLCB0aGlzLmxhc2VyUmFuZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGRlZ1RvVGFyZ2V0IC0gZGVnVG9FbmRwb3MgPiA2KSB7XG4gICAgICAgICAgbmV3RGVncmVlID0gZGVnVG9FbmRwb3MgKyAzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0RlZ3JlZSA9IGRlZ1RvRW5kcG9zICsgMC41O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGFzZXJEZWx0YSA9IGdhbWUucGh5c2ljcy5kZWdUb1BvcyhuZXdEZWdyZWUsIHRoaXMubGFzZXJSYW5nZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBsYXllci5yZWNvdmVyeVRpbWVyID0gMDtcbiAgICAgIHBsYXllci5oZWFsdGggLT0gMjtcbiAgICAgIGdhbWUucGxheWVyRGVhdGhNZXRob2QgPSAnYmxpbmQnO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSkge1xuICAgIHN1cGVyLnVwZGF0ZShnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgdGhpcy5sYXNlclN0YXJ0ID0ge1xuICAgICAgeDogdGhpcy5jdXJYICsgKHRoaXMud2lkdGggLyAyKSxcbiAgICAgIHk6IHRoaXMuY3VyWSArIDE0XG4gICAgfTtcbiAgICB0aGlzLmRlYnVnQ29sb3IgPSAncmVkJztcbiAgICB0aGlzLmRpclRpbWVyIC09IGVsYXBzZWRUaW1lO1xuICAgIGlmICh0aGlzLmRpclRpbWVyIDw9IDAgJiYgIXRoaXMuZmlyaW5nKSB7XG4gICAgICB0aGlzLm1vdmluZyA9IEJvb2xlYW4oZ2FtZS5nZXRSYW5kb20oMCwgMSkpO1xuICAgICAgdGhpcy5kaXJUaW1lciA9IGdhbWUuZ2V0UmFuZG9tKDIsIDQpO1xuICAgICAgbGV0IG5leHREaXJlY3Rpb24gPSBnYW1lLmdldFJhbmRvbSgwLCAzKTtcbiAgICAgIHRoaXMuZGlyWCA9IERpcmVjdGlvbnMuZGlyZWN0aW9uc1tuZXh0RGlyZWN0aW9uXS54O1xuICAgICAgdGhpcy5kaXJZID0gRGlyZWN0aW9ucy5kaXJlY3Rpb25zW25leHREaXJlY3Rpb25dLnk7XG4gICAgfVxuICAgIHRoaXMudmlzaWJsZUFjdG9ycyA9IDA7XG4gICAgdGhpcy5lYWNoVmlzaWJsZUFjdG9yKGdhbWUsIFBsYXllciwgZnVuY3Rpb24ocGxheWVyKSB7XG4gICAgICB0aGlzLnZpc2libGVBY3RvcnMgKz0gMTtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICd3aGl0ZSc7XG5cbiAgICAgIGlmICghdGhpcy5maXJpbmcpIHsgLy8gc2V0IHRoZSBpbml0aWFsIHN0YXJ0aW5nIHBvaW50IGZvciB0aGUgbGFzZXJcbiAgICAgICAgbGV0IGxhc2VyRW5kcG9pbnQ7XG4gICAgICAgIGlmICh0aGlzLmRpclggPT09IC0xIHx8IHRoaXMuZGlyWCA9PT0gMSkge1xuICAgICAgICAgIGxhc2VyRW5kcG9pbnQgPSB7XG4gICAgICAgICAgICB4OiAodGhpcy5sYXNlclN0YXJ0LnggKyB0aGlzLmxhc2VyUmFuZ2UpICogLXRoaXMuZGlyWCxcbiAgICAgICAgICAgIHk6IHRoaXMubGFzZXJTdGFydC55XG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmRpclkgPT09IC0xIHx8IHRoaXMuZGlyWSA9PT0gMSkge1xuICAgICAgICAgIGxhc2VyRW5kcG9pbnQgPSB7XG4gICAgICAgICAgICB4OiB0aGlzLmxhc2VyU3RhcnQueCxcbiAgICAgICAgICAgIHk6ICh0aGlzLmxhc2VyU3RhcnQueSArIHRoaXMubGFzZXJSYW5nZSkgKiAtdGhpcy5kaXJZXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc2VyRGVsdGEgPSBnYW1lLnBoeXNpY3MuZ2V0RGVsdGEoXG4gICAgICAgICAgbGFzZXJFbmRwb2ludC54LCBsYXNlckVuZHBvaW50LnksIHRoaXMubGFzZXJTdGFydC54LFxuICAgICAgICAgIHRoaXMubGFzZXJTdGFydC55KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZmlyZUxhc2VyKGdhbWUsIHBsYXllcik7XG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy52aXNpYmxlQWN0b3JzID09PSAwKSB7XG4gICAgICB0aGlzLmxhc2VyRW5kcG9pbnQgPSBudWxsO1xuICAgICAgdGhpcy5maXJpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLmVhY2hPdmVybGFwcGluZ0FjdG9yKGdhbWUsIEJ1bGxldCwgZnVuY3Rpb24oYnVsbGV0KSB7XG4gICAgICBidWxsZXQuYWN0aXZlID0gZmFsc2U7XG4gICAgICB0aGlzLmRlYnVnQ29sb3IgPSAnZ3JlZW4nO1xuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgIGdhbWUubnVtT2ZNb25zdGVycy0tO1xuICAgICAgZ2FtZS5zY29yZSsrO1xuICAgIH0pO1xuICB9XG59XG4iLCIvKmpzaGludCBicm93c2VyOnRydWUgKi9cbi8qZ2xvYmFscyBTUzpmYWxzZSAqL1xuJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgKiBhcyBkZWF0aGJvdCBmcm9tICcuL2RlYXRoYm90JztcbmltcG9ydCB7QWN0b3IsIFBoeXNpY3N9IGZyb20gJy4vYmVyemVyayc7XG5pbXBvcnQge0J1bGxldH0gZnJvbSAnLi9idWxsZXQnO1xuXG5leHBvcnQgY2xhc3MgUGxheWVyIGV4dGVuZHMgQWN0b3J7XG4gIGNvbnN0cnVjdG9yKGltYWdlLCBzdGFydFgsIHN0YXJ0WSwgc2NhbGUsIHNwZWVkWCwgc3BlZWRZLCBkaXJYLCBkaXJZKSB7XG4gICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICB0aGlzLmhlYWx0aCA9IDEwMDtcbiAgICB0aGlzLnJlY292ZXJ5VGltZXIgPSAyO1xuICAgIHRoaXMuZXllT2Zmc2V0ID0ge3g6IDAsIHk6IDEwfTtcbiAgfVxuXG4gIGRyYXcoZ2FtZSwgZWxhcHNlZFRpbWUpIHtcbiAgICBpZiAoZ2FtZS5nYW1lU3RhdGUgIT09ICdhdHRyYWN0Jykge1xuICAgICAgc3VwZXIuZHJhdyhnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmJ1bGxldCkge1xuICAgICAgdGhpcy5idWxsZXQuZHJhdyhnYW1lLCBlbGFwc2VkVGltZSk7XG4gICAgfVxuICAgIGxldCBoZWFsdGhWaXMgPSAoKDEwMCAtIHRoaXMuaGVhbHRoKSAvIDEwMCk7XG4gICAgZ2FtZS5jb250ZXh0LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLCcgKyBoZWFsdGhWaXMgKyAnKSc7XG4gICAgZ2FtZS5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIGdhbWUuY2FudmFzLndpZHRoLCBnYW1lLmNhbnZhcy5oZWlnaHQpO1xuICB9XG5cbiAgdXBkYXRlKGdhbWUsIGVsYXBzZWRUaW1lKSB7XG4gICAgaWYgKHRoaXMuaGVhbHRoIDw9IDApIHtcbiAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICBnYW1lLmdhbWVTdGF0ZSA9ICdkZWFkJztcbiAgICAgIGNvbnNvbGUubG9nKCdERUFEIScpO1xuICAgICAgaWYgKHRoaXMuYnVsbGV0ICYmIHRoaXMuYnVsbGV0LmFjdGl2ZSkge1xuICAgICAgICB0aGlzLmJ1bGxldCA9IG51bGw7XG4gICAgICAgIGRlbGV0ZSBnYW1lLmFjdG9ycy5wbGF5ZXJCdWxsZXQ7XG4gICAgICB9XG4gICAgICAvLyBsZXQgbG93ZXN0U2NvcmUgPSBTUy5jdXJyZW50U2NvcmVzICYmIFNTLmN1cnJlbnRTY29yZXMubGVuZ3RoID9cbiAgICAgIC8vICAgU1MuY3VycmVudFNjb3Jlc1tTUy5jdXJyZW50U2NvcmVzLmxlbmd0aCAtIDFdLnNjb3JlIDogMDtcbiAgICAgIC8vIGlmIChnYW1lLnNjb3JlID4gbG93ZXN0U2NvcmUpIHtcbiAgICAgIC8vICAgbGV0IHBsYXllck5hbWUgPSBwcm9tcHQoJ1BsZWFzZSBFbnRlciB5b3VyIE5hbWUuJyk7XG4gICAgICAvLyAgIFNTLnN1Ym1pdFNjb3JlKHBsYXllck5hbWUsIGdhbWUuc2NvcmUpO1xuICAgICAgLy8gICBkZWF0aGJvdC5zY29yZXMgPSBTUy5nZXRTY29yZXMoOCk7XG4gICAgICAvLyB9XG4gICAgfVxuXG4gICAgaWYgKGdhbWUuZ2FtZVN0YXRlID09PSAnYXR0cmFjdCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGRpclggPSAwO1xuICAgIGxldCBkaXJZID0gMDtcbiAgICB0aGlzLmRlYnVnQ29sb3IgPSAnYmx1ZSc7XG5cbiAgICBpZiAodGhpcy5oZWFsdGggPD0gMCkge1xuICAgICAgdGhpcy5kZWJ1Z0NvbG9yID0gJ2JsYWNrJztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oZWFsdGggPCAxMDApIHtcbiAgICAgIGlmICh0aGlzLnJlY292ZXJ5VGltZXIgPiAxKSB7XG4gICAgICAgIHRoaXMuaGVhbHRoICs9IDI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlY292ZXJ5VGltZXIgKz0gZWxhcHNlZFRpbWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGdhbWUua2V5RG93bi51cCkge1xuICAgICAgZGlyWSA9IC0xO1xuICAgICAgdGhpcy5kaXJYID0gMDtcbiAgICAgIHRoaXMuZGlyWSA9IGRpclk7XG4gICAgfVxuICAgIGlmIChnYW1lLmtleURvd24uZG93bikge1xuICAgICAgZGlyWSA9IDE7XG4gICAgICB0aGlzLmRpclggPSAwO1xuICAgICAgdGhpcy5kaXJZID0gZGlyWTtcbiAgICB9XG4gICAgaWYgKGdhbWUua2V5RG93bi5sZWZ0KSB7XG4gICAgICBkaXJYID0gLTE7XG4gICAgICB0aGlzLmRpclkgPSAwO1xuICAgICAgdGhpcy5kaXJYID0gZGlyWDtcbiAgICB9XG4gICAgaWYgKGdhbWUua2V5RG93bi5yaWdodCkge1xuICAgICAgZGlyWCA9IDE7XG4gICAgICB0aGlzLmRpclkgPSAwO1xuICAgICAgdGhpcy5kaXJYID0gZGlyWDtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnVsbGV0KSB7XG4gICAgICAvLyBjaGVjayB3aGV0aGVyIGJ1bGxldCBpcyBzdGlsbCBhY3RpdmVcbiAgICAgIGlmICghdGhpcy5idWxsZXQuYWN0aXZlKSB7XG4gICAgICAgIHRoaXMuYnVsbGV0ID0gbnVsbDtcbiAgICAgICAgZGVsZXRlIGdhbWUuYWN0b3JzLnBsYXllckJ1bGxldDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdFVwKSB7XG4gICAgICAgIHRoaXMuZmlyZUJ1bGxldChnYW1lLCAwLCAtMSk7XG4gICAgICB9XG4gICAgICBpZiAoZ2FtZS5rZXlEb3duLnNob290RG93bikge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgMCwgMSk7XG4gICAgICB9XG4gICAgICBpZiAoZ2FtZS5rZXlEb3duLnNob290TGVmdCkge1xuICAgICAgICB0aGlzLmZpcmVCdWxsZXQoZ2FtZSwgLTEsIDApO1xuICAgICAgfVxuICAgICAgaWYgKGdhbWUua2V5RG93bi5zaG9vdFJpZ2h0KSB7XG4gICAgICAgIHRoaXMuZmlyZUJ1bGxldChnYW1lLCAxLCAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZGlyWCA9PT0gLTEgJiYgdGhpcy5mYWNpbmcgIT09ICdsZWZ0Jykge1xuICAgICAgdGhpcy5jdXJJbWFnZSA9IHRoaXMuaW1hZ2UucmV2O1xuICAgICAgdGhpcy5mYWNpbmcgPSAnbGVmdCc7XG4gICAgfVxuXG4gICAgaWYgKGRpclggPT09IDEgJiYgdGhpcy5mYWNpbmcgIT09ICdyaWdodCcpIHtcbiAgICAgIHRoaXMuY3VySW1hZ2UgPSB0aGlzLmltYWdlO1xuICAgICAgdGhpcy5mYWNpbmcgPSAncmlnaHQnO1xuICAgIH1cblxuICAgIGxldCBtb3ZpbmdCb3ggPSBuZXcgUGh5c2ljcy5Cb3godGhpcy5jdXJYLCB0aGlzLmN1clksIHRoaXMud2lkdGgsXG4gICAgICB0aGlzLmhlaWdodCk7XG4gICAgbGV0IHNlZ21lbnREZWx0YSA9IHtcbiAgICAgIHg6ICh0aGlzLnNwZWVkWCAqIGVsYXBzZWRUaW1lKSAqIGRpclgsXG4gICAgICB5OiAodGhpcy5zcGVlZFkgKiBlbGFwc2VkVGltZSkgKiBkaXJZXG4gICAgfTtcbiAgICBsZXQgcmVzdWx0ID0gZ2FtZS5waHlzaWNzLnN3ZWVwQm94SW50b0JveGVzKG1vdmluZ0JveCwgc2VnbWVudERlbHRhLFxuICAgICAgZ2FtZS5zdGF0aWNCbG9ja3MpO1xuICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0LmhpdCkge1xuICAgICAgdGhpcy5jdXJYID0gcmVzdWx0LmhpdFBvcy54IC0gKHRoaXMud2lkdGggLyAyKTtcbiAgICAgIHRoaXMuY3VyWSA9IHJlc3VsdC5oaXRQb3MueSAtICh0aGlzLmhlaWdodCAvIDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmN1clggKz0gc2VnbWVudERlbHRhLng7XG4gICAgICB0aGlzLmN1clkgKz0gc2VnbWVudERlbHRhLnk7XG4gICAgfVxuXG4gICAgaWYgKCh0aGlzLmN1clggKyB0aGlzLndpZHRoKSA+IGdhbWUuY2FudmFzLndpZHRoKSB7XG4gICAgICBsZXQgeENsaXAgPSAodGhpcy5jdXJYICsgdGhpcy53aWR0aCkgLSBnYW1lLmNhbnZhcy53aWR0aCAtIHRoaXMud2lkdGg7XG4gICAgICBpZiAodGhpcy5kaXJYID09PSAxKSB7XG4gICAgICAgIHRoaXMuY3VyWCA9IHhDbGlwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJYIDwgMCkge1xuICAgICAgaWYgKHRoaXMuZGlyWCA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5jdXJYID0gdGhpcy5jdXJYICsgZ2FtZS5jYW52YXMud2lkdGg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpID4gZ2FtZS5jYW52YXMuaGVpZ2h0KSB7XG4gICAgICBsZXQgeUNsaXAgPSAodGhpcy5jdXJZICsgdGhpcy5oZWlnaHQpIC0gZ2FtZS5jYW52YXMuaGVpZ2h0IC0gdGhpcy5oZWlnaHQ7XG4gICAgICBpZiAodGhpcy5kaXJZID09PSAxKSB7XG4gICAgICAgIHRoaXMuY3VyWSA9IHlDbGlwO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5jdXJZIDwgMCkge1xuICAgICAgaWYgKHRoaXMuZGlyWSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5jdXJZID0gdGhpcy5jdXJZICsgZ2FtZS5jYW52YXMuaGVpZ2h0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZWFjaE92ZXJsYXBwaW5nQWN0b3IoZ2FtZSwgZGVhdGhib3QuTW9uc3RlciwgZnVuY3Rpb24oYWN0b3IpIHtcbiAgICAgIHRoaXMuZGVidWdDb2xvciA9ICd3aGl0ZSc7XG4gICAgICB0aGlzLmhlYWx0aCAtPSAyMDtcbiAgICAgIGlmICh0aGlzLmhlYWx0aCA8PSAwKSB7XG4gICAgICAgIGdhbWUucGxheWVyRGVhdGhNZXRob2QgPSAnZGVhZCc7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5oZWFkTGFtcChnYW1lLCBlbGFwc2VkVGltZSk7XG4gIH1cblxuICAvLyBzdGFydFgsIHN0YXJ0WSwgc3BlZWQsIGRpclgsIGRpcllcbiAgZmlyZUJ1bGxldChnYW1lLCBkaXJYLCBkaXJZKSB7XG4gICAgdGhpcy5idWxsZXQgPSBuZXcgQnVsbGV0KHRoaXMuY3VyWCwgdGhpcy5jdXJZICsgMjAsIDYwMCwgZGlyWCwgZGlyWSk7XG4gICAgZ2FtZS5hY3RvcnMucGxheWVyQnVsbGV0ID0gdGhpcy5idWxsZXQ7XG4gIH1cbn1cbiJdfQ==
