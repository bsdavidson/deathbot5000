/*jshint browser:true */

(function(Berzerk) {
'use strict';

var Actor = Berzerk.Actor = function Actor(image, startX, startY, scale, speedX, speedY, dirX, dirY) {
    if (arguments.length === 0) {
        return;
    }

    var unscaledWidth, unscaledHeight;
    if (image) {
        this.image = image;
        this.curImage = this.image;
        this.dirImages = {
            right: image,
            left: image.rev,
            up: image.up,
            down: image.down
        };
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

    this.facing = 'right';
    this.dirX = dirX;
    this.dirY = dirY;
    this.width = unscaledWidth * (scale / 100);
    this.height = unscaledHeight * (scale / 100);
    this.curX = startX;
    this.curY = startY;
    this.previousPos = {x: this.curX, y: this.curY};
    this.speedX = speedX;
    this.speedY = speedY;
    this.moving = true;
    this.active = true;
    this.alpha = 1;
    this.debugColor = 'red';
    this.eyeOffset = {x: 0, y: 0};
};

Actor.prototype.collidesWithWalls = function(game) {
    var result = {hit: false, dirX: 0, dirY: 0};
    // Hit the Left Wall
    if (this.curX < 0) {
        this.curX = Berzerk.EPSILON;
        result = {hit: true, dirX: 1};
    }
    // Hit right wall
    if (this.curX > (game.canvas.width - this.width)) {
        this.curX = (game.canvas.width - this.width) - Berzerk.EPSILON;
        result = {hit: true, dirX: -1};
    }
    // Hit the Ceiling
    if (this.curY < 0) {
        this.curY = Berzerk.EPSILON;
        result = {hit: true, dirY: 1};
    }
    // Hit the Floor
    if (this.curY > game.canvas.height - this.height) {
        this.curY = (game.canvas.height - this.height) - Berzerk.EPSILON;
        result = {hit: true, dirY: -1};
    }
    return result;
};

Actor.prototype.eachOverlappingActor = function(game, actorConstructor, callback) {
     game.eachActor(function(actor) {
        if (!(actor instanceof actorConstructor) || !actor.active) {
            return;
        }
        var overlapping = !(
            this.curX > actor.curX + actor.width ||
            this.curX + this.width < actor.curX ||
            this.curY + this.height < actor.curY ||
            this.curY > actor.curY + actor.height
        );
        if (overlapping) {
            callback.call(this, actor);
        }
    }, this);
};

Actor.prototype.eachVisibleActor = function(game, actorConstructor, callback) {
     game.eachActor(function(actor) {
        if (!(actor instanceof actorConstructor)) {
            return;
        }
        if (game.gameState !== 'play') {
            return;
        }

        var visible = false;
        var inFOV = (
            (this.dirX === 1 && (this.curX + this.width) < actor.curX) ||
            (this.dirX === -1 && this.curX > (actor.curX + actor.width)) ||
            (this.dirY === -1 && this.curY > (actor.curY + actor.height)) ||
            (this.dirY === 1 && this.curY + this.height < actor.curY)
            );

        if (inFOV) {
            var visionStart = {
                x: this.curX + (this.width / 2) + this.eyeOffset.x,
                y: this.curY + this.eyeOffset.y
            };
            var visionDelta = {
                x: (actor.curX + (actor.width / 2) + actor.eyeOffset.x) - visionStart.x,
                y: (actor.curY + actor.eyeOffset.y) - visionStart.y
            };
            var actorArr = [];
            var actorObj = {
                x: actor.curX,
                y: actor.curY,
                w: actor.width,
                h: actor.height
            };
            actorArr.push(actorObj);
            var blockResult = game.physics.intersectSegmentIntoBoxes(visionStart, visionDelta, game.staticBlocks);
            var actorResult = game.physics.intersectSegmentIntoBoxes(visionStart, visionDelta, actorArr);

            if (game.debugMode) {
                 var endPos = new Berzerk.Physics.Point(
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
                var result = game.physics.checkNearestHit(this, blockResult, actorResult);
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
};

Actor.prototype.update = function Actor(game, elapsedTime) {
    var hitWall = this.collidesWithWalls(game);
    if (hitWall.dirX) {
        this.dirX = hitWall.dirX;
    }
    if (hitWall.dirY) {
        this.dirY = hitWall.dirY;
    }

    if (this.moving) {
        var movingBox = new Berzerk.Physics.Box(this.curX, this.curY, this.width, this.height);
        var segmentDelta = {
            x: (this.speedX * elapsedTime) * this.dirX,
            y: (this.speedY * elapsedTime) * this.dirY
        };
        var result = game.physics.sweepBoxIntoBoxes(movingBox, segmentDelta, game.staticBlocks);
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
    this.facing = Berzerk.directionNames[Berzerk.getDirectionIndex(this.dirX, this.dirY)];
    this.curImage = this.dirImages[this.facing];
};

Actor.prototype.draw = function(game, elapsedTime) {
    if (this.curImage) {
        var imgSplitX = 0, imgSplitY = 0;
        if (this.curX + this.width > game.canvas.width) {
            imgSplitX = (this.curX + this.width) - game.canvas.width - this.width;
        }
        if (this.curX < 0) {
            imgSplitX = game.canvas.width + this.curX;
        }
        if (this.curY < 0) {
            imgSplitY = game.canvas.height - this.height + (this.height + this.curY);
        }
        if ((this.curY + this.height) > game.canvas.height) {
            imgSplitY = (this.curY + this.height) - game.canvas.height - this.height;
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
        var x1 = this.curX;
        var y1 = this.curY;
        var x2 = this.curX + this.width;
        var y2 = this.curY + this.height;

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
};

}(window.Berzerk));
