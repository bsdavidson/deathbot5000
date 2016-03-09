/*jshint browser:true */
'use strict';

var Actor = require('./berzerk').Actor;
var Physics = require('./berzerk').Physics;
var Player = require('./player').Player;
var Bullet = require('./bullet').Bullet;

function Monster(
    image, startX, startY, scale, speedX, speedY, dirX) {
  Actor.apply(this, arguments);
  this.dirTimer = 0;
  this.isFiring = false;
  this.laserDelta = {};
  this.laserRange = 3400;
  this.laserStart = {};
  this.eyeOffset = {x: 0, y: 14};
}

exports.Monster = Monster;

Monster.prototype = new Actor();
Monster.prototype.constructor = Monster;

Monster.prototype.draw = function(game, elapsedTime) {
  if (this.active) {
    Actor.prototype.draw.call(this, game, elapsedTime);
    if (game.debugMode) {
      game.context.font = '16px Verdana';
      game.context.fillStyle = 'red';
      game.context.fillText('Monster',
        this.curX + (this.width / 4),
        this.curY - 10);
    }
  } else if (this.alpha >= 0.1) {
    this.alpha -= 0.1;
    game.context.globalAlpha = this.alpha;
    Actor.prototype.draw.call(this, game, elapsedTime);
    game.context.globalAlpha = 1;
  }
};

Monster.prototype.fireLaser = function(game, player) {
  var laserEndpoint = {
    x: this.laserStart.x + this.laserDelta.x,
    y: this.laserStart.y + this.laserDelta.y
  };
  var target = [];
  var targetObj = {};
  targetObj.x = player.curX + 5;
  targetObj.y = player.curY;
  targetObj.w = 15;
  targetObj.h =  15;
  target.push(targetObj);
  var targetDelta = game.physics.getDelta(
    this.laserStart.x, this.laserStart.y, targetObj.x, targetObj.y);
  this.firing = true;
  this.moving = false;

  var blockResult = game.physics.intersectSegmentIntoBoxes(
    this.laserStart, this.laserDelta, game.staticBlocks);
  var targetResult = game.physics.intersectSegmentIntoBoxes(
    this.laserStart, this.laserDelta, target);

  var endPos; var targetHit;
  if ((blockResult && blockResult.hit) && (targetResult && targetResult.hit)) {
    var result = game.physics.checkNearestHit(this, blockResult, targetResult);
    endPos = result.endPos;
    targetHit = result.targetHit;
  } else {
    if (blockResult && blockResult.hit) {
      // update end pos with hit pos
      endPos = new Physics.Point(blockResult.hitPos.x,
        blockResult.hitPos.y);
      game.context.strokeStyle = 'red';
    } else if (targetResult && targetResult.hit) {
      endPos = new Physics.Point(targetResult.hitPos.x,
        targetResult.hitPos.y);
      targetHit = true;
    } else {
      endPos = new Physics.Point(laserEndpoint.x, laserEndpoint.y);
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
    var newDegree;
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
};

Monster.prototype.update = function(game, elapsedTime) {
  Actor.prototype.update.call(this, game, elapsedTime);
  this.laserStart = {
    x: this.curX + (this.width / 2),
    y: this.curY + 14
  };
  this.debugColor = 'red';
  this.dirTimer -= elapsedTime;
  if (this.dirTimer <= 0 && !this.firing) {
    this.moving = Boolean(game.getRandom(0, 1));
    this.dirTimer = game.getRandom(2, 4);
    var nextDirection = game.getRandom(0, 3);
    this.dirX = Actor.directions[nextDirection].x;
    this.dirY = Actor.directions[nextDirection].y;
  }
  this.visibleActors = 0;
  this.eachVisibleActor(game, Player, function(player) {
    this.visibleActors += 1;
    this.debugColor = 'white';

    if (!this.firing) { // set the initial starting point for the laser
      var laserEndpoint;
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
      this.laserDelta = game.physics.getDelta(
        laserEndpoint.x, laserEndpoint.y, this.laserStart.x,
        this.laserStart.y);
    }
    this.fireLaser(game, player);
  });

  if (this.visibleActors === 0) {
    this.laserEndpoint = null;
    this.firing = false;
  }

  this.eachOverlappingActor(game, Bullet, function(bullet) {
    bullet.active = false;
    this.debugColor = 'green';
    this.active = false;
    game.numOfMonsters--;
    game.score++;
  });
};
