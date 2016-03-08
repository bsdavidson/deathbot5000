/*jshint browser:true */

(function(Berzerk, Physics) {
'use strict';

var Game = Berzerk.Game = function(canvas) {
  if (arguments.length === 0) {
    return;
  }

  this.mouse = {x: 0, y: 0};
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
};

Game.prototype.defineKey = function(keyName, keyCode) {
  this.keyDown[keyName] = false;
  this.keyNames[keyCode] = keyName;
};

Game.prototype.getRandom = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Loops through Actor array and creates callable images.
Game.prototype.loadImages = function(characters, images) {
  var imagesToLoad = [];
  var self = this;
  var loadedImages = 0;
  var numImages = 0;

  var getReverseImage = function(src, w, h) {
    numImages++;
    var tempImage = new Image();
    var tempCanvas = document.createElement('canvas');
    var tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = w;
    tempCanvas.height = h;
    tempContext.translate(w, 0);
    tempContext.scale(-1, 1);
    tempContext.drawImage(src, 0, 0);
    var encodedImage = tempCanvas.toDataURL();
    tempImage.onload = onImageLoaded;
    tempImage.src = encodedImage;
    return tempImage;
  };

  var onImageLoaded = function() {
    loadedImages++;
    console.log('loaded image', loadedImages, 'of', numImages);
    if (loadedImages === numImages) {
      self.imagesLoaded = true;
    }
  };

  var loadImage = function(src, callback) {
    var image = new Image();
    image.onload = function() {
      if (callback) {
        callback.call(image);
      }
      onImageLoaded();
    };
    imagesToLoad.push({image: image, src: src});
    return image;
  };

  var onMainImageLoaded = function() {
    this.rev = getReverseImage(this, this.width, this.height);
  };

  for (var i = 0, il = characters.length; i < il; i++) {
    // get our main image
    var character = characters[i];
    var image = this.images[character.name] = loadImage(
      character.image,
      onMainImageLoaded);

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
  for (i = 0, il = imagesToLoad.length; i < il; i++) {
    imagesToLoad[i].image.src = imagesToLoad[i].src;
  }
};

Game.prototype.eachActor = function(callback, context) {
  for (var c in this.actors) {
    if (this.actors.hasOwnProperty(c)) {
      callback.call(context, this.actors[c]);
    }
  }
};

Game.prototype.initialize = function(elapsedTime) {
  this.physics = new Physics(this);
  this.initialized = true;
};

Game.prototype.draw = function(elapsedTime) {
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.eachActor(function(actor) {
    actor.draw(this, elapsedTime);
  }, this);
};

Game.prototype.drawLoading = function() {};

Game.prototype.update = function(elapsedTime) {
  this.iteration++;
  this.eachActor(function(actor) {
    if (actor.active) {
      actor.update(this, elapsedTime);
    }
  }, this);
};

Game.prototype.tick = function(elapsedTime) {
  if (this.imagesLoaded) {
    if (!this.initialized) {
      this.initialize(elapsedTime);
    }
    this.draw(elapsedTime);
    this.update(elapsedTime);
  } else {
    this.drawLoading();
  }
};

Game.prototype.onKeyDown = function(event) {
  event.preventDefault();
  var key = event.keyCode;
  if (this.keyNames.hasOwnProperty(key)) {
    this.keyDown[this.keyNames[key]] = true;
  }
};

Game.prototype.onKeyUp = function(event) {
  event.preventDefault();
  var key = event.keyCode;
  if (this.keyNames.hasOwnProperty(key)) {
    this.keyDown[this.keyNames[key]] = false;
  }
};

Game.prototype.onMouseMove = function(event) {
  this.mouse.x = event.pageX - this.canvas.offsetLeft;
  this.mouse.y = event.pageY - this.canvas.offsetTop;
};

Game.prototype.onResize = function(event) {
  this.context = this.canvas.getContext('2d');
  this.canvas.width = window.innerWidth;
  this.canvas.height = window.innerHeight;
};

Game.prototype.setFocus = function(event, isBlurred) {
  if (this.debugMode && isBlurred) {
    this.framesPerSecond = 1;
  } else {
    this.framesPerSecond = 30;
  }
};
}(window.Berzerk, window.Berzerk.Physics));
