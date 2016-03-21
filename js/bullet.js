/*jshint browser:true */
'use strict';

import {Actor} from './berzerk';

export class Bullet extends Actor {
  constructor(startX, startY, speed, dirX, dirY) {
    var image = {w: 5, h: 5};
    super(image, startX, startY, 100, speed, speed, dirX, dirY);
    this.deathTimer = 0;
    this.headLampActive = true;
    this.headLampAngle = 180;
    this.headLampPower = 280;
  }

  draw(game, elapsedTime) {
    game.contextFX.fillStyle = '#FFF';
    game.contextFX.fillRect(this.curX, this.curY, this.width, this.height);
  }

  update(game, elapsedTime) {
    super.update(game, elapsedTime);
    this.deathTimer += elapsedTime;
    if (this.deathTimer >= 1) {
      this.active = false;
    }
  }
}
