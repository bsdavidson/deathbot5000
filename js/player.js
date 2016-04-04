/*jshint browser:true */
/*globals SS:false */
'use strict';

import * as deathbot from './deathbot';
import {Actor, Physics, Box, Point, LEVELS} from './berzerk';
import {Bullet} from './bullet';

export class Player extends Actor{
  constructor(image, startX, startY, scale, speedX, speedY, dirX, dirY) {
    super(...arguments);
    this.health = 100;
    this.recoveryTimer = 2;
    this.eyeOffset = {x: 0, y: 10};
    this.headLampActive = true;
  }

  draw(game, elapsedTime) {
    if (game.gameState !== 'attract') {
      super.draw(game, elapsedTime);
    }
    if (this.bullet) {
      this.bullet.draw(game, elapsedTime);
    }
    // let healthVis = ((100 - this.health) / 100);
    // game.context.fillStyle = 'rgba(0,0,0,' + healthVis + ')';
    // game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);
    this.drawFPS(game, elapsedTime);

  }

  update(game, elapsedTime) {
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
    let dirX = 0;
    let dirY = 0;
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

    let movingBox = new Box(this.curX, this.curY, this.width,
      this.height);
    let segmentDelta = {
      x: (this.speedX * elapsedTime) * dirX,
      y: (this.speedY * elapsedTime) * dirY
    };
    let result = game.physics.sweepBoxIntoBoxes(movingBox, segmentDelta,
      game.staticBlocks);
    if (result && result.hit) {
      this.curX = result.hitPos.x - (this.width / 2);
      this.curY = result.hitPos.y - (this.height / 2);
    } else {
      this.curX += segmentDelta.x;
      this.curY += segmentDelta.y;
    }

    if ((this.curX + this.width) > game.canvas.width) {
      let xClip = (this.curX + this.width) - game.canvas.width - this.width;
      if (this.dirX === 1) {
        this.curX = xClip;
      }
    }
    if (this.curX < 0) {
      if (this.dirX === -1) {
        this.curX = this.curX + game.canvas.width;
      }
    }
    if ((this.curY + this.height) > game.canvas.height) {
      let yClip = (this.curY + this.height) - game.canvas.height - this.height;
      if (this.dirY === 1) {
        this.curY = yClip;
      }
    }
    if (this.curY < 0) {
      if (this.dirY === -1) {
        this.curY = this.curY + game.canvas.height;
      }
    }

    this.eachOverlappingActor(game, deathbot.Monster, function(actor) {
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
  fireBullet(game, dirX, dirY) {
    this.bullet = new Bullet(this.curX, this.curY + 20, 600, dirX, dirY);
    game.actors.playerBullet = this.bullet;
  }
}
