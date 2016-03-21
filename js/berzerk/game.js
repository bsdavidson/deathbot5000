/*jshint browser:true */
'use strict';

import {Physics} from './physics';

export class Game {
  constructor(canvas) {
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
  }

  defineKey(keyName, keyCode) {
    this.keyDown[keyName] = false;
    this.keyNames[keyCode] = keyName;
  }

  getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  // Loops through Actor array and creates callable images.
  loadImages(characters, images) {
    let imagesToLoad = [];
    let self = this;
    let loadedImages = 0;
    let numImages = 0;

    let getReverseImage = function(src, w, h) {
      numImages++;
      let tempImage = new Image();
      let tempCanvas = document.createElement('canvas');
      let tempContext = tempCanvas.getContext('2d');
      tempCanvas.width = w;
      tempCanvas.height = h;
      tempContext.translate(w, 0);
      tempContext.scale(-1, 1);
      tempContext.drawImage(src, 0, 0);
      tempImage.onload = onImageLoaded;
      tempImage.src = tempCanvas.toDataURL();
      return tempImage;
    };

    let onImageLoaded = function() {
      loadedImages++;
      console.log('loaded image', loadedImages, 'of', numImages);
      if (loadedImages === numImages) {
        self.imagesLoaded = true;
      }
    };

    let loadImage = function(src, callback) {
      let image = new Image();
      image.onload = function() {
        if (callback) {
          callback.call(image);
        }
        onImageLoaded();
      };
      imagesToLoad.push({image: image, src: src});
      return image;
    };

    let onMainImageLoaded = function() {
      this.rev = getReverseImage(this, this.width, this.height);
    };

    for (let i = 0, il = characters.length; i < il; i++) {
      // get our main image
      let character = characters[i];
      let image = this.images[character.name] = loadImage(
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

    for (let key in images) {
      if (images.hasOwnProperty(key)) {
        this[key] = loadImage(images[key]);
      }
    }

    numImages = imagesToLoad.length;
    for (let i = 0, il = imagesToLoad.length; i < il; i++) {
      imagesToLoad[i].image.src = imagesToLoad[i].src;
    }
  }

  eachActor(callback, context) {
    for (let c in this.actors) {
      if (this.actors.hasOwnProperty(c)) {
        callback.call(context, this.actors[c]);
      }
    }
  }

  initialize(elapsedTime) {
    this.physics = new Physics(this);
    this.initialized = true;
  }

  draw(elapsedTime) {
    this.context.globalAlpha = 1;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // this.context.fillStyle = 'rgba(0,0,0,1.0)';
    // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

    this.eachActor(function(actor) {
      actor.preDraw(this, elapsedTime);
    }, this);
    this.context.globalCompositeOperation="source-atop";
    this.eachActor(function(actor) {
      actor.draw(this, elapsedTime);
    }, this);
    this.context.globalCompositeOperation="source-over";

  }

  drawLoading() {}

  update(elapsedTime) {
    this.iteration++;
    this.eachActor(function(actor) {
      if (actor.active) {
        actor.update(this, elapsedTime);
      }
    }, this);
  }

  tick(elapsedTime) {
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

  onKeyDown(event) {
    event.preventDefault();
    let key = event.keyCode;
    if (this.keyNames.hasOwnProperty(key)) {
      this.keyDown[this.keyNames[key]] = true;
    }
  }

  onKeyUp(event) {
    event.preventDefault();
    let key = event.keyCode;
    if (this.keyNames.hasOwnProperty(key)) {
      this.keyDown[this.keyNames[key]] = false;
    }
  }

  onMouseMove(event) {
    this.mouse.x = event.pageX - this.canvas.offsetLeft;
    this.mouse.y = event.pageY - this.canvas.offsetTop;
  }

  onResize(event) {
    this.context = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setFocus(event, isBlurred) {
    if (this.debugMode && isBlurred) {
      this.framesPerSecond = 1;
    } else {
      this.framesPerSecond = 30;
    }
  }
}
