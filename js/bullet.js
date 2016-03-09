/*jshint browser:true */
'use strict';

var Actor = require('./berzerk').Actor;

function Bullet(
    startX, startY, speed, dirX, dirY) {
  var image = {w: 5, h: 5};
  Actor.call(this, image, startX, startY, 100, speed, speed, dirX, dirY);
  this.deathTimer = 0;
}

exports.Bullet = Bullet;

Bullet.prototype = new Actor();
Bullet.prototype.constructor = Bullet;

Bullet.prototype.draw = function(game, elapsedTime) {
  game.context.fillStyle = '#FFF';
  game.context.fillRect(this.curX, this.curY, this.width, this.height);
};

Bullet.prototype.update = function(game, elapsedTime) {
  Actor.prototype.update.call(this, game, elapsedTime);
  this.deathTimer += elapsedTime;
  if (this.deathTimer >= 1) {
    this.active = false;
  }
};
