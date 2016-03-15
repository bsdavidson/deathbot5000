/*jshint browser:true */
/*globals SS:false */
'use strict';

import {Game as BerzerkGame, Keys, Physics} from './berzerk';
import {Player} from './player';
import {Monster} from './monster';

const DEBUG_TILE = 9;
const LEVELS = [
  {
    cols: 28,
    rows: 28,
    grid: [
      0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,1,1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,1,1,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,2,2,0,2,2,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,
      1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,
      1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
      1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ]
  }
];

const CHARACTERS = [
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

export class Game extends BerzerkGame {
  constructor(canvas, canvasBG, fillStyle) {
    super(canvas);
    this.playerDeathMethod = '';
    this.gameState = 'attract'; // attract, play, dead
    this.score = 0;
    this.round = 2;
    this.numOfMonsters = 0;
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
    this.canvasFX = document.querySelector('#fx');
    this.canvasFX.width = window.innerWidth;
    this.canvasFX.height = window.innerHeight;
    this.contextFX = this.canvasFX.getContext('2d');
    // this.contextFX.fillStyle = 'rgba(0, 0, 0, .50)';
    // this.contextFX.fillRect(0, 0, this.canvasFX.width, this.canvasFX.height);
    this.messageTime = 10;

    this.defineKey('start', Keys.SPACE);
    this.defineKey('up', Keys.UP);
    this.defineKey('down', Keys.DOWN);
    this.defineKey('left', Keys.LEFT);
    this.defineKey('right', Keys.RIGHT);
    this.defineKey('shootUp', Keys.W);
    this.defineKey('shootLeft', Keys.A);
    this.defineKey('shootDown', Keys.S);
    this.defineKey('shootRight', Keys.D);
  }

  createSpawnPoints(actorWidth, actorHeight) {
    let spawnLocations = [];
    let spawnGrid = this.grid.slice(0);

    let actorBlock = {
      w: Math.ceil(actorWidth / this.cellWidth),
      h: Math.ceil(actorHeight / this.cellHeight)
    };
    for (let i = 0, li = this.grid.length; i < li; i++) {
      if (this.grid[i] === 0) {
        let numOfSpacesNeeded = actorBlock.w * actorBlock.h;
        let numOfEmptySpaces = 0;
        for (let row = 0; row < actorBlock.w; row++) {
          for (let col = 0; col < actorBlock.h; col++) {
            let curCol = (i % this.cols) + row;
            let curRow = Math.floor(i / this.cols) + col;
            let index = (curRow * this.cols) + curCol;
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

  randomizeSpawns() {
    this.eachActor(function(actor) {
      if (!(actor instanceof Monster)) {
        return;
      }
      actor.spawnPoints = this.createSpawnPoints(actor.width, actor.height);
      let spawnIndex = actor.spawnPoints[
      Math.floor(Math.random() * actor.spawnPoints.length)];
      let spawnXY = this.calcGridXY(spawnIndex);
      actor.curX = spawnXY.x1 + Physics.EPSILON;
      actor.curY = spawnXY.y1 + Physics.EPSILON;
    },this);
  }

  calcGridXY(gridIndex) {
    let curRow, curCol, gridX1, gridX2, gridY1, gridY2;
    let result = {x1: 0, y1: 0, x2: 0, y2: 0};
    curCol = gridIndex % this.cols;
    curRow = Math.floor(gridIndex / this.cols);
    gridX1 = curCol * this.cellWidth;
    gridY1 = curRow * this.cellHeight;
    gridX2 = gridX1 + this.cellWidth;
    gridY2 = gridY1 + this.cellHeight;
    result = {x1: gridX1, y1: gridY1, x2: gridX2, y2: gridY2};
    return result;
  }

  // Loops through Actor array and creates callable images.
  loadImages() {
    super.loadImages(CHARACTERS,
      {tiles: 'img/tiles.png'});
  }

  eachActor(callback, context) {
    for (let c in this.actors) {
      if (this.actors.hasOwnProperty(c)) {
        callback.call(context, this.actors[c]);
      }
    }
  }

  initialize(elapsedTime) {
    super.initialize(elapsedTime);

    this.drawBackground(elapsedTime);
    this.staticBlocks = [];
    this.physics = new Physics(this);
    this.actors = {
      //image, startX, startY, scale, speedX, speedY, dirX, dirY
      player: new Player(
        this.images.player, 85, 454, 100, 150, 150, 1, 1),
      deathbot1: new Monster(
        this.images.deathbot, 250, 500, 100, 100, 100, -1, 1),
      deathbot3: new Monster(
        this.images.deathbot, 120, 110, 300, 110, 115, 1, 1),
      deathbot4: new Monster(
        this.images.deathbot, 300, 200, 100, 200, 200, -1, -1),
      deathbot5: new Monster(
        this.images.deathbot, 500, 400, 100, 200, 200, 1, 1)
    };

    this.numOfMonsters = 0;
    this.playerDeathMethod = '';
    this.round = 2;
    this.score = 0;

    this.eachActor((actor) => {
      if (actor instanceof Monster) {
        this.numOfMonsters++;
      }
      actor.active = true;
      actor.health = 100;
    }, this);

    for (let i = 0, li = this.grid.length; li > i; i++) {
      if (this.grid[i]) {
        let blockXY = this.calcGridXY(i);
        let block = new Physics.Box(
          blockXY.x1, blockXY.y1, this.cellWidth, this.cellHeight);
        this.staticBlocks.push(block);
      }
    }

    this.randomizeSpawns();
  }

  leaderboard() {
    let yPos = 60;
    let xPos = 940;
    if (SS.currentScores) {
      this.drawScores('***** Hi Scores *****', yPos, xPos, 20);
      yPos += 30;
      let lb = SS.currentScores;
      for (let i = 0; i < lb.length; i++) {
        this.drawScores(lb[i].name + '  ' +  lb[i].score, yPos, xPos, 20);
        yPos += 30;
      }
    }
  }

  draw(elapsedTime) {
    this.contextFX.clearRect(0, 0, this.canvas.width, this.canvas.height);
    super.draw(elapsedTime);

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

  drawBackground(elapsedTime) {
    let bgColor;
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

  drawGrid(grid) {
    let gridPosX = 0, gridPosY = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        let index = (row * this.cols) + col;
        gridPosX = col * this.cellWidth;
        gridPosY = row * this.cellHeight;

        if (grid[index]) {
          this.contextBG.drawImage(this.tiles, grid[index] *
          this.cellWidth, 0, this.cellWidth, this.cellHeight,
          gridPosX, gridPosY, this.cellWidth, this.cellHeight);
        }
        if (grid[index] === DEBUG_TILE) {
          this.contextBG.strokeStyle = 'red';
          this.contextBG.strokeRect(gridPosX, gridPosY, this.cellWidth,
            this.cellHeight);
        }
      }
    }
  }

  drawLoading() {
    this.contextBG.fillStyle = '#ccc';
    this.contextBG.fillRect(0, 0, this.canvasBG.width, this.canvasBG.height);
  }

  drawMessage(message, yPos, size) {
    let pos = this.canvas.width / 2;
    yPos = yPos || 200;
    size = size || 25;
    this.context.font = size + 'px Verdana';
    let metrics = this.context.measureText(message);
    let width = metrics.width;
    let messageX = pos - width / 2;
    this.context.fillStyle = 'white';
    this.context.fillText(message, messageX, yPos);
  }

 drawScores(message, yPos, xPos, size) {
    let pos = this.canvas.width / 2;
    yPos = yPos || 200;
    size = size || 25;
    this.context.font = size + 'px Verdana';
    this.context.fillStyle = 'white';
    this.context.fillText(message, xPos, yPos);
  }

  drawScore() {
    let pos = this.canvas.width / 2;
    this.context.font = '25px Verdana';
    this.context.fillStyle = 'white';
    let scoreText = 'GAME: ' + this.score;
    let metrics = this.context.measureText(scoreText);
    let width = metrics.width;
    let scoreX = pos - (width / 2);
    this.context.fillText(scoreText, scoreX, 25);
  }

  update(elapsedTime) {
    super.update(elapsedTime);

    if (this.keyDown.start && this.gameState !== 'play') {
      this.gameState = 'play';
      console.log('Game Start');
      this.randomizeSpawns();
      this.initialized = false;
    }

    if (this.numOfMonsters === 0 && this.initialized) { // You beat all monsters
      this.randomizeSpawns();
      if (this.messageTime > 0) { // show next round message
        this.drawMessage('Round ' + this.round);
        this.messageTime -= elapsedTime;
      } else {
        this.messageTime = 10;
        this.round++;
        // Reviving monsters, this will be refactored later to randomize
        // positions rather than just reactivating the dead ones where they
        // fell.
        this.eachActor(function(actor) {
          if (actor instanceof Monster) {
            this.numOfMonsters++;
            actor.active = true;
            actor.alpha = 1;
          }
        }, this);
      }
    }
  }
}
