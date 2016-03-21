/*jshint browser:true */
'use strict';

export class Box {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  inflate(paddingX, paddingY) {
    return new Box(
      this.x - paddingX / 2,
      this.y - paddingY / 2,
      this.w + paddingX,
      this.h + paddingY);
  }
}

export class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export const EPSILON = 1 / 32;

export class Physics {
  constructor(game) {
    this.game = game;
  }

  drawPoint(x, y, color, size) {
    size = size || 4;
    this.game.context.fillStyle = color;
    this.game.context.fillRect(x - (size / 2), y - (size / 2), size, size);
  }

  drawLine(x1, y1, x2, y2, color) {
    this.game.context.beginPath();
    this.game.context.moveTo(x1, y1);
    this.game.context.lineTo(x2, y2);
    this.game.context.closePath();
    this.game.context.strokeStyle = color;
    this.game.context.stroke();
  }

  drawText(x, y, text, color) {
    color = color || 'white';
    this.game.context.font = '14px Arial';
    this.game.context.fillStyle = color;
    this.game.context.fillText(text, x, y);
  }

  drawBox(x, y, w, h, color) {
    color = color || 'white';
    this.game.context.strokeStyle = color;
    this.game.context.strokeRect(x, y, w, h);
  }

  getDelta(x1, y1, x2, y2) {
    return {x: x2 - x1, y: y2 - y1};
  }

  intersectSegmentIntoBox(segmentPos, segmentDelta, paddedBox, debug) {
    // drawBox(paddedBox.x, paddedBox.y, paddedBox.w, paddedBox.h, 'gray');
    var nearXPercent, farXPercent;
    if (segmentDelta.x >= 0) {
      // going left to right
      nearXPercent = (paddedBox.x - segmentPos.x) / segmentDelta.x;
      farXPercent = ((paddedBox.x + paddedBox.w) -
                     segmentPos.x) / segmentDelta.x;
    } else {
      // going right to left
      nearXPercent = (
        ((paddedBox.x + paddedBox.w) - segmentPos.x) / segmentDelta.x);
      farXPercent = (paddedBox.x - segmentPos.x) / segmentDelta.x;
    }

    var nearYPercent, farYPercent;
    if (segmentDelta.y >= 0) {
      // going top to bottom
      nearYPercent = (paddedBox.y - segmentPos.y) / segmentDelta.y;
      farYPercent = ((paddedBox.y + paddedBox.h) -
                    segmentPos.y) / segmentDelta.y;
    } else {
      // going bottom to top
      nearYPercent = (
        ((paddedBox.y + paddedBox.h) - segmentPos.y) / segmentDelta.y);
      farYPercent = (paddedBox.y - segmentPos.y) / segmentDelta.y;
    }

    // calculate the further of the two near percents
    var nearPercent;
    if (nearXPercent > nearYPercent) {
      nearPercent = nearXPercent;
    } else {
      nearPercent = nearYPercent;
    }

    // calculate the nearest of the two far percent
    var farPercent;
    if (farXPercent < farYPercent) {
      farPercent = farXPercent;
    } else {
      farPercent = farYPercent;
    }

    var hit;
    if (nearXPercent > farYPercent || nearYPercent > farXPercent) {
      // Where the segment hits the left edge of the box, has to be between
      // the top and bottom edges of the box. Otherwise, the segment is
      // passing the box vertically before it hits the left side.
      hit = false;
    } else if (nearPercent > 1) {
      // the box is past the end of the line
      hit = false;
    } else if (farPercent < 0) {
      // the box is before the start of the line
      hit = false;
    } else {
      hit = true;
    }

    var hitPercent = nearPercent;
    var hitNormal = {};
    if (nearXPercent > nearYPercent) {
      // collided with the left or right edge
      if (segmentDelta.x >= 0) {
        // collided with the left edge
        hitNormal.x = -1;
      } else {
        // collided with the right edge
        hitNormal.x = 1;
      }
      hitNormal.y = 0;
    } else {
      // collided with the to or bottom edge
      hitNormal.x = 0;
      if (segmentDelta.y >= 0) {
        // collided with the top edge
        hitNormal.y = -1;
      } else {
        // collided with the bottom edge
        hitNormal.y = 1;
      }
    }
    if (hitPercent < 0) {
      hitPercent = 0;
    }

    var hitPos = {
      x: segmentPos.x + (segmentDelta.x * hitPercent),
      y: segmentPos.y + (segmentDelta.y * hitPercent)
    };

    hitPos.x += hitNormal.x * EPSILON;
    hitPos.y += hitNormal.y * EPSILON;

    let result =  {
      hit: hit,
      hitNormal: hitNormal,
      hitPercent: hitPercent,
      hitPos: hitPos,
      nearPercent: nearPercent,
      nearXPercent: nearXPercent,
      nearYPercent: nearYPercent,
      farPercent: farPercent,
      farXPercent: farXPercent,
      farYPercent: farYPercent,
      hitBox: paddedBox
    };
    // if (debug) {
    //    let hitCounter = 0;
    //    let hitColors = ['#f00', '#0f0', '#ff0', '#0ff', '#f0f',
    //                     '#fff', '#f90'];
    //     this.drawPoint(result.hitPos.x, result.hitPos.y,
    //                    hitColors[hitCounter % hitColors.length], 4);
    //     this.drawLine(segmentPos.x, segmentPos.y,
    //                   segmentPos.x + segmentDelta.x,
    //                   segmentPos.y + segmentDelta.y, '#0ff');
    //     hitCounter += 1;
    // }
    return result;
  }

  sweepBoxIntoBox(movingBox, segmentDelta, staticBox) {
    var segmentPos = {
      x: movingBox.x + movingBox.w / 2,
      y: movingBox.y + movingBox.h / 2
    };

    var paddedBox = new Box(
      staticBox.x - movingBox.w / 2,
      staticBox.y - movingBox.h / 2,
      staticBox.w + movingBox.w,
      staticBox.h + movingBox.h);
    var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta,
      paddedBox);
    return result;
  }

  intersectSegmentIntoBoxes(segmentPos, segmentDelta, staticBoxes, debug) {
    let hitCounter = 0;
    let hitColors = ['#f00', '#0f0', '#ff0', '#0ff', '#f0f', '#fff', '#f90'];
    var nearestResult = null;
    for (var i = 0, il = staticBoxes.length; i < il; i++) {
      var staticBox = staticBoxes[i];
      var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta,
        staticBox);
      if (result.hit) {
        if (debug) {
          this.drawPoint(result.hitPos.x, result.hitPos.y,
                         hitColors[hitCounter % hitColors.length], 4);
          this.drawLine(segmentPos.x, segmentPos.y,
                        segmentPos.x + segmentDelta.x,
                        segmentPos.y + segmentDelta.y, '#0ff');
          hitCounter += 1;
        }
        if (!nearestResult || result.hitPercent < nearestResult.hitPercent) {
          nearestResult = result;
        }
      }
    }
    return nearestResult;
  }

  // Sweep movingBox, along the movement described by segmentDelta, into each
  // box in the list of staticBoxes. Return a result object describing the first
  // static box that movingBox hits, or null.
  sweepBoxIntoBoxes(movingBox, segmentDelta, staticBoxes) {
    var nearestResult = null;
    for (var i = 0, il = staticBoxes.length; i < il; i++) {
      var staticBox = staticBoxes[i];
      var result = this.sweepBoxIntoBox(movingBox, segmentDelta, staticBox);
      if (result.hit) {
        if (!nearestResult || result.hitPercent < nearestResult.hitPercent) {
          nearestResult = result;
        }
      }
    }
    return nearestResult;
  }

  getFirstCollision(startPos, cellSize, delta, callback) {
    let dir = {}, endPos = {}, cell = {}, timeStep = {}, time = {};
    let dirs = ['x', 'y'];
    let firstEdge = {};

    for(let i = 0; i < 2; i++){
      let k = dirs[i];
      dir[k] = delta[k] < 0 ? -1 : 1;
      endPos[k] = startPos[k] + delta[k];
      cell[k] = Math.floor(startPos[k] / cellSize);
      timeStep[k] = (cellSize * dir[k]) / delta[k];
      if (dir[k] === 0) {
        time[k] = 1;
      } else {
        firstEdge[k] = cell[k] * cellSize;
        if (dir[k] > 0) {
          firstEdge[k] += cellSize;
        }
        time[k] = (firstEdge[k] - startPos[k]) /
                        delta[k];
      }
    }

    while (time.x < 1 || time.y < 1) {
      if (time.x < time.y) {
        time.x += timeStep.x;
        cell.x += dir.x;
      } else {
        cell.y += dir.y;
        time.y += timeStep.y;
      }
      if (callback(cell.x, cell.y) === false) {
        break;
      }
    }
  }

  checkNearestHit(sourceActor, staticResult, targetResult) {
    var result = {};
    var sourceX = sourceActor.curX;
    var staticX = staticResult.hitPos.x;
    var targetX = targetResult.hitPos.x;
    var sourceY = sourceActor.curY;
    var staticY = staticResult.hitPos.y;
    var targetY = targetResult.hitPos.y;

    if (sourceActor.dirX === -1 || sourceActor.dirX === 1) {
      if (Math.abs(sourceX - staticX) < Math.abs(sourceX - targetX)) {
        result.targetHit = false;
        result.endPos = new Point(
          staticResult.hitPos.x, staticResult.hitPos.y);
      } else {
        result.endPos = new Point(
          targetResult.hitPos.x, targetResult.hitPos.y);
        result.targetHit = true;
      }
    } else if (sourceActor.dirY === -1 || sourceActor.dirY === 1) {
      if (Math.abs(sourceY - staticY) < Math.abs(sourceY - targetY)) {
        result.targetHit = false;
        result.endPos = new Point(
          staticResult.hitPos.x, staticResult.hitPos.y);
      } else {
        result.endPos = new Point(
          targetResult.hitPos.x, targetResult.hitPos.y);
        result.targetHit = true;
      }
    }
    return result;
  }

  getTargetDegree(delta) {
    var theta = Math.atan2(delta.x, delta.y);
    var degree = theta * (180 / Math.PI);
    if (theta < 0) {
      degree += 360;
    }
    return degree;
  }

  degToPos(degree, radius) {
    var radian = degree * (Math.PI / 180);
    var result = {
      x: radius * Math.sin(radian),
      y: radius * Math.cos(radian)
    };
    return result;
  }
}
