/*jshint browser:true */

(function(Berzerk) {
'use strict';

var DEBUG_TILE = 9;

var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_LEFT = 37;
var KEY_RIGHT = 39;
var KEY_W = 87;
var KEY_A = 65;
var KEY_S = 83;
var KEY_D = 68;
var KEY_SPACE = 32;

var KEY_NAMES = {};
KEY_NAMES[KEY_SPACE] = 'start';
KEY_NAMES[KEY_UP] = 'up';
KEY_NAMES[KEY_DOWN] = 'down';
KEY_NAMES[KEY_LEFT] = 'left';
KEY_NAMES[KEY_RIGHT] = 'right';
KEY_NAMES[KEY_W] = 'shootUp';
KEY_NAMES[KEY_A] = 'shootLeft';
KEY_NAMES[KEY_S] = 'shootDown';
KEY_NAMES[KEY_D] = 'shootRight';

var LEVELS = [
    {
        cols: 28,
        rows: 28,
        grid: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        ]
    }
];

var CHARACTERS = [
    {
        name: 'deathbot',
        image: 'img/deathbot.png',
        imageUp: 'img/deathbot_up.png',
        imageDown: 'img/deathbot_down.png',
        w: 40,
        h: 52
    },
    {
        name: 'player',
        image: 'img/player.png',
        w: 28,
        h: 52
    }
];

var Game = Berzerk.Game = function(canvas, canvasBG, fillStyle) {
    this.mouse = {x: 0, y: 0};
    this.initialized = false;
    this.debugMode = false;
    this.playerDeathMethod = '';
    this.gameState = 'attract'; // attract, play, dead
    this.score = 0;
    this.round = 2;
    this.numOfMonsters = 0;
    this.images = {};
    this.imagesLoaded = false;
    this.actors = {};
    this.keyDown = {};
    for (var key in KEY_NAMES) {
        if (KEY_NAMES.hasOwnProperty(key)) {
            var name = KEY_NAMES[key];
            this.keyDown[name] = false;
        }
    }
    this.cellWidth = 32;
    this.cellHeight = 32;
    this.tiles = null;
    this.cols = LEVELS[0].cols;
    this.rows = LEVELS[0].rows;
    this.grid = LEVELS[0].grid;

    this.spawnGrid = [];
    this.staticBlocks = [];
    this.fillStyle = fillStyle;
    this.canvasBG = canvasBG;
    this.canvasBG.width = window.innerWidth;
    this.canvasBG.height = window.innerHeight;
    this.contextBG = this.canvasBG.getContext('2d');
    this.canvas = canvas;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.context = this.canvas.getContext('2d');

    this.canvasFX = document.querySelector('#fx');
    this.canvasFX.width = window.innerWidth;
    this.canvasFX.height = window.innerHeight;
    this.contextFX = this.canvasFX.getContext('2d');
    // this.contextFX.fillStyle = 'rgba(0, 0, 0, .50)';
    // this.contextFX.fillRect(0, 0, this.canvasFX.width, this.canvasFX.height);

    this.messageTime = 10;

};

Game.prototype.createSpawnPoints = function(actorWidth, actorHeight) {
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
                    var curCol = (i % this.cols) + row;
                    var curRow = Math.floor(i / this.cols) + col;
                    var index = (curRow * this.cols) + curCol;
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
};

Game.prototype.randomizeSpawns = function() {
    this.eachActor(function(actor){
        if (!(actor instanceof Berzerk.Monster)) {
            return;
        }
        actor.spawnPoints = this.createSpawnPoints(actor.width, actor.height);
        var spawnIndex = actor.spawnPoints[Math.floor(Math.random() * actor.spawnPoints.length)];
        var spawnXY = this.calcGridXY(spawnIndex);
        actor.curX = spawnXY.x1 + Berzerk.EPSILON;
        actor.curY = spawnXY.y1 + Berzerk.EPSILON;
    },this);
};

Game.prototype.getRandom = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

Game.prototype.calcGridXY = function(gridIndex) {
    var curRow, curCol, gridX1, gridX2, gridY1, gridY2;
    var result = {x1: 0, y1: 0, x2: 0, y2: 0};
    curCol = gridIndex % this.cols;
    curRow = Math.floor(gridIndex / this.cols);
    gridX1 = curCol * this.cellWidth;
    gridY1 = curRow * this.cellHeight;
    gridX2 = gridX1 + this.cellWidth;
    gridY2 = gridY1 + this.cellHeight;
    result = {x1: gridX1, y1: gridY1, x2: gridX2, y2: gridY2};
    return result;
};

// Loops through Actor array and creates callable images.
Game.prototype.loadImages = function() {
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

    for (var i = 0, il = CHARACTERS.length; i < il; i++) {
        // get our main image
        var character = CHARACTERS[i];
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
    this.tiles = loadImage('img/tiles.png');
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
    this.staticBlocks = [];
    this.physics = new Berzerk.Physics(this);
    this.actors = {
        //image, startX, startY, scale, speedX, speedY, dirX, dirY
        player: new Berzerk.Player(this.images.player,        85, 454, 100, 150, 150, 1, 1),
        deathbot1: new Berzerk.Monster(this.images.deathbot, 250, 500, 100, 100, 100, -1, 1),
        deathbot3: new Berzerk.Monster(this.images.deathbot, 120, 110, 300, 110, 115, 1, 1),
        deathbot4: new Berzerk.Monster(this.images.deathbot, 300, 200, 100, 200, 200, -1, -1),
        deathbot5: new Berzerk.Monster(this.images.deathbot, 500, 400, 100, 200, 200, 1, 1)
    };

    this.numOfMonsters = 0;
    this.playerDeathMethod = '';
    this.round = 2;
    this.score = 0;

    this.eachActor(function(actor) {
        if (actor instanceof Berzerk.Monster) {
            this.numOfMonsters++;
        }
        actor.active = true;
        actor.health = 100;
    }, this);

    for (var i = 0, li = this.grid.length; li > i; i++) {
        if (this.grid[i]) {
            var blockXY = this.calcGridXY(i);
            var block = new Berzerk.Physics.Box(
                blockXY.x1, blockXY.y1, this.cellWidth, this.cellHeight);
            this.staticBlocks.push(block);
        }
    }

    this.randomizeSpawns();
    this.initialized = true;
};

Game.prototype.draw = function(elapsedTime) {
    this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.contextFX.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.eachActor(function(actor) {
        actor.draw(this, elapsedTime);
    }, this);
    this.drawScore();
    if (this.gameState === 'attract') {
        this.drawMessage('Deathbot 5000', 120);
        this.drawMessage('WASD to Shoot', 180);
        this.drawMessage('Arrow Keys to Move', 220);
        this.drawMessage('Press Space to Begin', 260);
    }
    if (this.gameState === 'dead') {
        this.drawMessage('Thou art ' + this.playerDeathMethod);
        this.drawMessage('Press Space to Start again', 240);
    }
};

Game.prototype.drawBackground = function(elapsedTime) {
    var bgColor;
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
};

Game.prototype.drawGrid = function(grid) {
    var gridPosX = 0, gridPosY = 0;
    for (var row = 0; row < this.rows; row++) {
        for (var col = 0; col < this.cols; col++) {
            var index = (row * this.cols) + col;
            gridPosX = col * this.cellWidth;
            gridPosY = row * this.cellHeight;

            if (grid[index]) {
                this.contextBG.drawImage(this.tiles, grid[index] *
                this.cellWidth, 0, this.cellWidth, this.cellHeight,
                gridPosX, gridPosY, this.cellWidth, this.cellHeight);
                // this.context.font = '10px Arial';
                // this.context.fillStyle = 'red';
                // this.context.fillText(index, gridPosX, gridPosY + 8);
            }
            if (grid[index] === DEBUG_TILE) {
                this.contextBG.strokeStyle = 'red';
                this.contextBG.strokeRect(gridPosX, gridPosY, this.cellWidth, this.cellHeight);
            }
        }

    }
};

Game.prototype.drawLoading = function() {
    this.contextBG.fillStyle = '#ccc';
    this.contextBG.fillRect(0, 0, this.canvasBG.width, this.canvasBG.height);
};

Game.prototype.drawMessage = function(message, yPos, size) {
    var pos = this.canvas.width / 2;
    yPos = yPos || 200;
    size = size || 25;
    this.context.font = size +'px Verdana';
    var metrics = this.context.measureText(message);
    var width = metrics.width;
    var messageX = pos - width / 2;
    this.context.fillStyle = 'white';
    this.context.fillText(message, messageX, yPos);
};

Game.prototype.drawScore = function() {
    var pos = this.canvas.width / 2;
    this.context.font = '25px Verdana';
    this.context.fillStyle = 'white';
    var scoreText = 'GAME: ' + this.score;
    var metrics = this.context.measureText(scoreText);
    var width = metrics.width;
    var scoreX = pos - (width / 2);
    this.context.fillText(scoreText, scoreX, 25);
};

Game.prototype.update = function(elapsedTime) {
    this.iteration++;
    if (this.keyDown.start && this.gameState !== 'play') {
        this.gameState = 'play';
        console.log('Game Start');
        this.randomizeSpawns();
        this.initialized = false;
    }

    this.eachActor(function(actor) {
        if (actor.active) {
            actor.update(this, elapsedTime);
        }
        if (this.numOfMonsters === 0 && this.initialized) { // You beat all monsters
        this.randomizeSpawns();
            if (this.messageTime > 0) { // show next round message
                this.drawMessage('Round ' + this.round);
                this.messageTime -= elapsedTime;
            } else {
                this.messageTime = 10;
                this.round++;
                // Reviving monsters, this will be refactored later to randomize positions
                // rather than just reactivating the dead ones where they fell.
                this.eachActor(function(actor) {
                    if (actor instanceof Berzerk.Monster) {
                       this.numOfMonsters++;
                       actor.active = true;
                       actor.alpha = 1;
                    }
                }, this);
            }
        }
    }, this);
};

Game.prototype.tick = function(elapsedTime) {
    if (this.imagesLoaded) {
        if (!this.initialized) {
            this.drawBackground(elapsedTime);
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
    if (KEY_NAMES.hasOwnProperty(key)) {
        var name = KEY_NAMES[key];
        this.keyDown[name] = true;
    }
};

Game.prototype.onKeyUp = function(event) {
    event.preventDefault();
    var key = event.keyCode;
    if (KEY_NAMES.hasOwnProperty(key)) {
        var name = KEY_NAMES[key];
        this.keyDown[name] = false;
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

}(window.Berzerk));
