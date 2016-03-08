/*jshint browser:true */

(function(Deathbot, Actor, Physics) {
'use strict';

var Player = Deathbot.Player = function Player(
    image, startX, startY, scale, speedX, speedY, dirX, dirY) {
  Actor.apply(this, arguments);
  this.health = 100;
  this.recoveryTimer = 2;
  this.eyeOffset = {x: 0, y: 10};
};

Player.prototype = new Actor();
Player.prototype.constructor = Player;

Player.prototype.draw = function(game, elapsedTime) {
  if (game.gameState !== 'attract') {
    Actor.prototype.draw.call(this, game, elapsedTime);
  }
  if (this.bullet) {
    this.bullet.draw(game, elapsedTime);
  }
  var healthVis = ((100 - this.health) / 100);
  game.context.fillStyle = 'rgba(0,0,0,' + healthVis + ')';
  game.context.fillRect(0, 0, game.canvas.width, game.canvas.height);
};

Player.prototype.update = function(game, elapsedTime) {
  if (this.health <= 0) {
    this.active = false;
    game.gameState = 'dead';
    console.log('DEAD!');
    if (this.bullet && this.bullet.active) {
      this.bullet = null;
      delete game.actors.playerBullet;
    }
    var lowestScore = SS.currentScores && SS.currentScores.length ?
      SS.currentScores[SS.currentScores.length - 1].score : 0;
    if (game.score > lowestScore) {
      var playerName = prompt('Please Enter your Name.');
      SS.submitScore(playerName, game.score);
      Deathbot.scores = SS.getScores(8);
    }
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
    this.dirY = dirY;
  }
  if (game.keyDown.down) {
    dirY = 1;
    this.dirY = dirY;
  }
  if (game.keyDown.left) {
    dirX = -1;
    this.dirX = dirX;
  }
  if (game.keyDown.right) {
    dirX = 1;
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

  var movingBox = new Physics.Box(this.curX, this.curY, this.width,
    this.height);
  var segmentDelta = {
    x: (this.speedX * elapsedTime) * dirX,
    y: (this.speedY * elapsedTime) * dirY
  };
  var result = game.physics.sweepBoxIntoBoxes(movingBox, segmentDelta,
    game.staticBlocks);
  if (result && result.hit) {
    this.curX = result.hitPos.x - (this.width / 2);
    this.curY = result.hitPos.y - (this.height / 2);
  } else {
    this.curX += segmentDelta.x;
    this.curY += segmentDelta.y;
  }

  if ((this.curX + this.width) > game.canvas.width) {
    var xClip = (this.curX + this.width) - game.canvas.width - this.width;
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
    var yClip = (this.curY + this.height) - game.canvas.height - this.height;
    if (this.dirY === 1) {
      this.curY = yClip;
    }
  }
  if (this.curY < 0) {
    if (this.dirY === -1) {
      this.curY = this.curY + game.canvas.height;
    }
  }

  this.eachOverlappingActor(game, Deathbot.Monster, function(actor) {
    this.debugColor = 'white';
    this.health -= 20;
    if (this.health <= 0) {
      game.playerDeathMethod = 'dead';
    }
  });
};

// startX, startY, speed, dirX, dirY
Player.prototype.fireBullet = function(game, dirX, dirY) {
  this.bullet = new Deathbot.Bullet(this.curX, this.curY + 20, 600, dirX, dirY);
  game.actors.playerBullet = this.bullet;
};
}(window.Deathbot, window.Berzerk.Actor, window.Berzerk.Physics));
