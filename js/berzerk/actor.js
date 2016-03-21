/*jshint browser:true */
'use strict';

import {Physics, Box, Point, EPSILON} from './physics';

export var Directions = {
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,
  directions: [
    {x: 0, y: -1},
    {x: 0, y: 1},
    {x: -1, y: 0},
    {x: 1, y: 0}],
  names:  ['up', 'down', 'left', 'right'],
  getIndex(dirX, dirY) {
    if (dirX > 0) {
      return this.RIGHT;
    } else if (dirX < 0) {
      return this.LEFT;
    } else if (dirY > 0) {
      return this.DOWN;
    } else if (dirY < 0) {
      return this.UP;
    } else {
      return this.RIGHT;
    }
  },
  getName(dirX, dirY) {
    return this.names[this.getIndex(dirX, dirY)];
  }
};

export class Actor {
  constructor(image, startX, startY, scale, speedX, speedY, dirX, dirY) {
    let unscaledWidth, unscaledHeight;
    if (image) {
      this.image = image;
      this.curImage = this.image;
      this.dirImages = {
        right: image,
        left: image.rev,
        up: image.up,
        down: image.down
      };
      // console.log(this.dirImages);
      unscaledWidth = image.w;
      unscaledHeight = image.h;
    } else {
      this.image = null;
      this.curImage = null;
      this.dirImages = {
        right: null,
        left: null,
        up: null,
        down: null
      };
      unscaledWidth = 1;
      unscaledHeight = 1;
    }

    this.previousDir = {x: this.dirX, y: this.dirY};
    this.startX = startX;
    this.startY = startY;

    this.facing = 'right';
    this.dirX = dirX;
    this.dirY = dirY;
    this.width = unscaledWidth * (scale / 100);
    this.height = unscaledHeight * (scale / 100);
    this.curX = startX;
    this.curY = startY;
    this.previousPos = {x: this.curX, y: this.curY};
    this.tilesInFOV = [];
    this.speedX = speedX;
    this.speedY = speedY;
    this.moving = true;
    this.active = true;
    this.alpha = 1;
    this.debugColor = 'red';
    this.eyeOffset = {x: 0, y: 0};
    this.laserDelta = {};
    this.laserRange = 9400;
    this.laserStart = {};
  }

  collidesWithWalls(game) {
    let result = {hit: false, dirX: 0, dirY: 0};
    // Hit the Left Wall
    if (this.curX < 0) {
      this.curX = EPSILON;
      result = {hit: true, dirX: 1};
    }
    // Hit right wall
    if (this.curX > (game.canvas.width - this.width)) {
      this.curX = (game.canvas.width - this.width) - EPSILON;
      result = {hit: true, dirX: -1};
    }
    // Hit the Ceiling
    if (this.curY < 0) {
      this.curY = EPSILON;
      result = {hit: true, dirY: 1};
    }
    // Hit the Floor
    if (this.curY > game.canvas.height - this.height) {
      this.curY = (game.canvas.height - this.height) - EPSILON;
      result = {hit: true, dirY: -1};
    }
    return result;
  }

  eachOverlappingActor(game, actorConstructor, callback) {
    game.eachActor(function(actor) {
      if (!(actor instanceof actorConstructor) || !actor.active) {
        return;
      }
      let overlapping = !(
        this.curX > actor.curX + actor.width ||
        this.curX + this.width < actor.curX ||
        this.curY + this.height < actor.curY ||
        this.curY > actor.curY + actor.height
      );
      if (overlapping) {
        callback.call(this, actor);
      }
    }, this);
  }

  eachVisibleActor(game, actorConstructor, callback) {
    game.eachActor(function(actor) {
      if (!(actor instanceof actorConstructor)) {
        return;
      }
      if (game.gameState !== 'play') {
        return;
      }
      let visionStart = {
        x: this.curX + (this.width / 2) + this.eyeOffset.x,
        y: this.curY + this.eyeOffset.y
      };
      let visionDelta = {
        x: (actor.curX + (actor.width / 2) + actor.eyeOffset.x) - visionStart.x,
        y: (actor.curY + actor.eyeOffset.y) - visionStart.y
      };
      let actorDirLength = Math.sqrt(
        visionDelta.x * visionDelta.x + visionDelta.y * visionDelta.y);
      let actorDir = {
        x: visionDelta.x / actorDirLength,
        y: visionDelta.y / actorDirLength
      };
      let dotProduct = (this.dirX * actorDir.x) + (this.dirY * actorDir.y);

      let visible = false;

      let inFOV;
      if (dotProduct > 0.70) {
        inFOV = true;
      } else {
        inFOV = false;
      }

      if (inFOV) {
        let actorArr = [];
        let actorObj = {
          x: actor.curX,
          y: actor.curY,
          w: actor.width,
          h: actor.height
        };
        actorArr.push(actorObj);
        let blockResult = game.physics.intersectSegmentIntoBoxes(
          visionStart, visionDelta, game.staticBlocks);
        let actorResult = game.physics.intersectSegmentIntoBoxes(
          visionStart, visionDelta, actorArr);

        if (game.debugMode) {
          let endPos = new Point(
            actor.curX + (actor.width / 2) + actor.eyeOffset.x,
            actor.curY + actor.eyeOffset.y);
          game.context.beginPath();
          game.context.moveTo(visionStart.x, visionStart.y);
          game.context.lineTo(endPos.x, endPos.y);
          game.context.closePath();
          game.context.strokeStyle = 'white';
          game.context.stroke();
        }

        if (actorResult && actorResult.hit && blockResult && blockResult.hit) {
          let result = game.physics.checkNearestHit(
            this, blockResult, actorResult);
          visible = result.targetHit;
        } else if (actorResult && actorResult.hit) {
          visible = true;
        } else {
          visible = false;
        }
      }
      if (visible) {
        callback.call(this, actor);
      }
    }, this);
  }

  headLamp(game, elapsedTime, angle = 45, power = 800) {
    let pointArray = [];
    let startingPoint = {};
    let degreeToCurEndPoint;
    let sweepAngle = angle;
    let gridSize = {w: 28, h: 28};
    let cellSize = 32;
    let dir = {x: this.dirX, y: this.dirY};

    startingPoint.x = this.curX + (this.width / 2);
    startingPoint.y = this.curY + 14;
    let initialEndpoint = {};
    // Get our initial point that is straight ahead
    if (this.dirX === -1 || this.dirX === 1) {
      initialEndpoint = {x: (startingPoint.x + this.laserRange) * -this.dirX,
                         y: startingPoint.y};
    } else if (this.dirY === -1 || this.dirY === 1) {
      initialEndpoint = {x: startingPoint.x,
                        y: (startingPoint.y + this.laserRange) * -this.dirY};
    }

    // Using the Mouse
    // initialEndpoint = {x: (this.curX - game.mouse.x) * this.laserRange,
    //                    y: (this.curY - game.mouse.y) * this.laserRange};

    let initialDelta = game.physics.getDelta(initialEndpoint.x,
                                            initialEndpoint.y,
                                            startingPoint.x,
                                            startingPoint.y);
    let degToInitialEndpos = game.physics.getTargetDegree(initialDelta);
    let degreeToStartSweep = degToInitialEndpos - sweepAngle;
    let degreeToEndSweep = degToInitialEndpos + sweepAngle;
    initialDelta = game.physics.degToPos(degreeToStartSweep, this.laserRange);

    let endingEndPos;
    degreeToCurEndPoint = degreeToStartSweep;

    while (degreeToCurEndPoint < degreeToEndSweep) {
      let xxx = degreeToCurEndPoint == degreeToStartSweep;
      degreeToCurEndPoint += 0.2;
      let endingDelta = game.physics.degToPos(degreeToCurEndPoint,
                                              this.laserRange);
      game.physics.getFirstCollision(startingPoint, cellSize, endingDelta,
        (cellx, celly) => {
          let gridPos = (celly * game.cols) + cellx;
          let block = game.staticGrid[gridPos];
          if (block) {
            let endingResult = game.physics.intersectSegmentIntoBox(
              startingPoint, endingDelta, block);
            if (endingResult && endingResult.hit) {
              endingEndPos = new Point(
              endingResult.hitPos.x, endingResult.hitPos.y);
              pointArray.push(endingEndPos);
              return false;
            }}
        });
    }

    let lightCtx = game.context;
    lightCtx.beginPath();
    lightCtx.moveTo(startingPoint.x, startingPoint.y);
    for (let i = 0, li = pointArray.length; i < li; i++) {
      lightCtx.lineTo(pointArray[i].x, pointArray[i].y);
    }
    lightCtx.closePath();
    let grd = lightCtx.createRadialGradient(this.curX,this.curY,power,
                                                  this.curX,this.curY,0);
    grd.addColorStop(0, 'transparent');
    grd.addColorStop(0.8, 'rgba(255,255,255,0.3)');
    grd.addColorStop(1, 'rgba(255,255,255,0.5)');
    lightCtx.fillStyle = grd;
    lightCtx.fill();
  }

  update(game, elapsedTime) {
    let hitWall = this.collidesWithWalls(game);
    if (hitWall.dirX) {
      this.dirX = hitWall.dirX;
    }
    if (hitWall.dirY) {
      this.dirY = hitWall.dirY;
    }

    if (this.moving) {
      let movingBox = new Box(this.curX, this.curY, this.width,
        this.height);
      let segmentDelta = {
        x: (this.speedX * elapsedTime) * this.dirX,
        y: (this.speedY * elapsedTime) * this.dirY
      };
      let result = game.physics.sweepBoxIntoBoxes(movingBox, segmentDelta,
        game.staticBlocks);
      this.previousPos = {
        x: this.curX,
        y: this.curY
      };
      if (result && result.hit) {
        this.dirX = result.hitNormal.x;
        this.dirY = result.hitNormal.y;
        this.curX = result.hitPos.x - (this.width / 2);
        this.curY = result.hitPos.y - (this.height / 2);
      } else {
        this.curX += segmentDelta.x;
        this.curY += segmentDelta.y;
      }
    }

    // Image Switcher
    this.facing = Directions.getName(this.dirX, this.dirY);
    this.curImage = this.dirImages[this.facing];
  }

  preDraw(game, elapsedTime) {
    if (this.active && this.headLampActive === true) {
      this.headLamp(game, elapsedTime, this.headLampAngle, this.headLampPower);
    }
  }

  draw(game, elapsedTime) {
    if (this.curImage) {
      // console.log(this.curImage);
      let imgSplitX = 0, imgSplitY = 0;
      if (this.curX + this.width > game.canvas.width) {
        imgSplitX = (this.curX + this.width) - game.canvas.width - this.width;
      }
      if (this.curX < 0) {
        imgSplitX = game.canvas.width + this.curX;
      }
      if (this.curY < 0) {
        imgSplitY = game.canvas.height - this.height + (this.height +
                                                        this.curY);
      }
      if ((this.curY + this.height) > game.canvas.height) {
        imgSplitY = (this.curY + this.height) -
                     game.canvas.height - this.height;
      }

      if (imgSplitX !== 0 || imgSplitY !== 0) {
        if (imgSplitX === 0) {
          imgSplitX = this.curX;
        }
        if (imgSplitY === 0) {
          imgSplitY = this.curY;
        }

        game.context.drawImage(this.curImage, imgSplitX, this.curY,
          this.width, this.height);

        game.context.drawImage(this.curImage, this.curX, imgSplitY,
          this.width, this.height);

        game.context.drawImage(this.curImage, imgSplitX, imgSplitY,
          this.width, this.height);
      }
      game.context.drawImage(this.curImage, this.curX, this.curY,
        this.width, this.height);
    }

    if (game.debugMode) {
      let x1 = this.curX;
      let y1 = this.curY;
      let x2 = this.curX + this.width;
      let y2 = this.curY + this.height;

      game.context.beginPath();
      game.context.moveTo(x1, y1);
      game.context.lineTo(x2, y1);
      game.context.lineTo(x2, y2);
      game.context.lineTo(x1, y2);
      game.context.closePath();
      game.context.strokeStyle = this.debugColor;
      game.context.stroke();
      game.context.font = '14px Verdana';
      game.context.fillStyle = 'blue';
      game.context.fillText(
        'x' + Math.floor(this.curX) + ' ' +
        'y' + Math.floor(this.curY) + ' ' +
        this.dirX + ' ' + this.dirY,
        this.curX + (this.width / 4),
        this.curY + (this.height + 30));
    }
  }
}
