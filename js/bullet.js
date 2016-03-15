/*jshint browser:true */
'use strict';

import {Actor} from './berzerk';

export class Bullet extends Actor {
  constructor(startX, startY, speed, dirX, dirY) {
    var image = {w: 5, h: 5};
    super(image, startX, startY, 100, speed, speed, dirX, dirY);
    this.deathTimer = 0;
  }

  draw(game, elapsedTime) {
    game.context.fillStyle = '#FFF';
    game.context.fillRect(this.curX, this.curY, this.width, this.height);
  }

  update(game, elapsedTime) {
    super.update(game, elapsedTime);
    this.deathTimer += elapsedTime;
    if (this.deathTimer >= 1) {
      this.active = false;
    }
  }
}
