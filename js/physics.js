/*jshint browser:true */

(function (Berzerk) {
'use strict';

var Physics = Berzerk.Physics = function Physics(game) {
    this.game = game;
};

var Box = Physics.Box = function Box(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
};

Box.prototype.inflate = function(paddingX, paddingY) {
    return new Box(
        this.x - paddingX / 2,
        this.y - paddingY / 2,
        this.w + paddingX,
        this.h + paddingY);
};

var Point = Physics.Point = function Point(x, y) {
    this.x = x;
    this.y = y;
};

Physics.prototype.drawPoint = function(x, y, color, size) {
    size = size || 4;
    this.game.context.fillStyle = color;
    this.game.context.fillRect(x - (size / 2), y - (size / 2), size, size);
};

Physics.prototype.drawLine = function(x1, y1, x2, y2, color) {
    this.game.context.beginPath();
    this.game.context.moveTo(x1, y1);
    this.game.context.lineTo(x2, y2);
    this.game.context.closePath();
    this.game.context.strokeStyle = color;
    this.game.context.stroke();
};

Physics.prototype.drawText = function(x, y, text, color) {
    color = color || 'white';
    this.game.context.font = '14px Arial';
    this.game.context.fillStyle = color;
    this.game.context.fillText(text, x, y);
};

Physics.prototype.drawBox = function(x, y, w, h, color) {
    color = color || 'white';
    this.game.context.strokeStyle = color;
    this.game.context.strokeRect(x, y, w, h);
};

Physics.prototype.getDelta = function(x1, y1, x2, y2) {
    var x = x2 - x1;
    var y = y2 - y1;
    return {x: x, y: y};
};

Physics.prototype.intersectSegmentIntoBox = function(segmentPos, segmentDelta, paddedBox, debug) {
    // drawBox(paddedBox.x, paddedBox.y, paddedBox.w, paddedBox.h, 'gray');

    var nearXPercent, farXPercent;
    if (segmentDelta.x >= 0) {
        // going left to right
        nearXPercent = (paddedBox.x - segmentPos.x) / segmentDelta.x;
        farXPercent = ((paddedBox.x + paddedBox.w) - segmentPos.x) / segmentDelta.x;
    } else {
        // going right to left
        nearXPercent = ((paddedBox.x + paddedBox.w) - segmentPos.x) / segmentDelta.x;
        farXPercent = (paddedBox.x - segmentPos.x) / segmentDelta.x;
    }

    var nearYPercent, farYPercent;
    if (segmentDelta.y >= 0) {
        // going top to bottom
        nearYPercent = (paddedBox.y - segmentPos.y) / segmentDelta.y;
        farYPercent = ((paddedBox.y + paddedBox.h) - segmentPos.y) / segmentDelta.y;
    } else {
        // going bottom to top
        nearYPercent = ((paddedBox.y + paddedBox.h) - segmentPos.y) / segmentDelta.y;
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

    hitPos.x += hitNormal.x * Berzerk.EPSILON;
    hitPos.y += hitNormal.y * Berzerk.EPSILON;

    return {
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
};

Physics.prototype.sweepBoxIntoBox = function(movingBox, segmentDelta, staticBox) {
    var segmentPos = {
        x: movingBox.x + movingBox.w / 2,
        y: movingBox.y + movingBox.h / 2
    };

    var paddedBox = new Box(
        staticBox.x - movingBox.w / 2,
        staticBox.y - movingBox.h / 2,
        staticBox.w + movingBox.w,
        staticBox.h + movingBox.h);
    var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta, paddedBox);
    return result;
};

Physics.prototype.intersectSegmentIntoBoxes = function(segmentPos, segmentDelta, staticBoxes) {
    var nearestResult = null;
    for (var i = 0, il = staticBoxes.length; i < il; i++) {
        var staticBox = staticBoxes[i];
        var result = this.intersectSegmentIntoBox(segmentPos, segmentDelta, staticBox);
        if (result.hit) {
            if (!nearestResult || result.hitPercent < nearestResult.hitPercent) {
                nearestResult = result;
            }
        }
    }
    return nearestResult;
};

// Sweep movingBox, along the movement described by segmentDelta, into each box
// in the list of staticBoxes. Return a result object describing the first
// static box that movingBox hits, or null.
Physics.prototype.sweepBoxIntoBoxes = function(movingBox, segmentDelta, staticBoxes) {
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
};

Physics.prototype.checkNearestHit = function(sourceActor, staticResult, targetResult) {
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
            result.endPos = new Berzerk.Physics.Point(staticResult.hitPos.x,
                                                      staticResult.hitPos.y);
        } else {
            result.endPos = new Berzerk.Physics.Point(targetResult.hitPos.x,
                                                      targetResult.hitPos.y);
            result.targetHit = true;
        }

    } else if (sourceActor.dirY === -1 || sourceActor.dirY === 1 ) {
        if (Math.abs(sourceY - staticY) < Math.abs(sourceY - targetY)) {
            result.targetHit = false;
            result.endPos = new Berzerk.Physics.Point(staticResult.hitPos.x,
                                                      staticResult.hitPos.y);
        } else {
            result.endPos = new Berzerk.Physics.Point(targetResult.hitPos.x,
                                                      targetResult.hitPos.y);
            result.targetHit = true;
        }
    } else {
     // Wat?
    }
    return result;
};

Physics.prototype.getTargetDeg = function(delta) {
    var theta = Math.atan2(delta.x, delta.y);
    var degree = theta * (180 / Math.PI);
    if (theta < 0) {
        degree += 360;
    }
    return degree;
};

Physics.prototype.degToPos = function(degree, radius) {
    var radian = degree * (Math.PI / 180);
    var result = {
        y: radius * Math.cos(radian),
        x: radius * Math.sin(radian)
    };
    return result;
};

}(window.Berzerk));
