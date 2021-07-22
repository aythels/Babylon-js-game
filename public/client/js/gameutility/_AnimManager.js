const _AnimManager = function(scene) {

  //utility
  this.percentToFrame = function (anim, percent) {
    //preconidtion |percent| <= 1
    const value = ((anim.toFrame - anim.fromFrame) * percent) + anim.fromFrame;
    return value;
  };

  this.frameToPercent = function (anim, frame) {
    //precondition anim.fromFrame < frame < anim.toFrame
    return (anim.masterFrame - anim.fromFrame) / (anim.toFrame - anim.fromFrame);
  };

  this.frameMatch = function (anim, targetFrame, tolerance) {
    if (!tolerance) tolerance = 1;
    if (Math.abs(anim.masterFrame - targetFrame) <= tolerance) return true;
    else return false;
  };

  this.getPlayingArray = function (target) {
    const targetArray = scene.getAllAnimatablesByTarget(target);
    const playingArray = targetArray.filter(anim => anim.animationStarted);
    return playingArray;
  };

  //blending function
  this.blendOne = function(blendRate, oldAnim, newAnim, oldPercent, newPercent) {
    //net weight must be 1 at all times or else model starts t-posing
    //console.log(frameToPercent(oldAnim, oldAnim.masterFrame));

    function blend() {
      if (newPercent) newAnim.goToFrame(this.percentToFrame(newAnim, newPercent));
      //console.log(newAnim.masterFrame, oldAnim.masterFrame);
      const obs = scene.onBeforeAnimationsObservable.add(() => {
          oldAnim.weight -= blendRate;
          if (oldAnim.weight <= 0) {
              scene.onBeforeAnimationsObservable.remove(obs);
              oldAnim.weight = 0;
              newAnim.weight = 1.0;
          } else {
              newAnim.weight += 1.0 - oldAnim.weight;
          }
      });
    }

    if (!oldPercent) blend();
    else {
      const derp = scene.onBeforeAnimationsObservable.add(() => {
        if (frameMatch(oldAnim, percentToFrame(oldAnim, oldPercent))) {
          scene.onBeforeAnimationsObservable.remove(derp);
          blend();
        }
      });
    }

  };

  this.blend = function (blendRate, newAnim, newPercent) {
    scene.onBeforeAnimationsObservable.clear();
    const playingArray = this.getPlayingArray(newAnim.target);
    UTILITY.removeItem(newAnim, playingArray);
    if (newPercent) newAnim.goToFrame(this.percentToFrame(newAnim, newPercent));

    const obs = scene.onBeforeAnimationsObservable.add(() => {
        for (let i = 0; i < playingArray.length; i++) {
          playingArray[i].weight -= blendRate;
          newAnim.weight += blendRate;
          if (playingArray[i].weight <= 0) {
            playingArray[i].weight = 0;
            UTILITY.removeItem(playingArray[i], playingArray);
          }
        }

        if (playingArray == []) {
            scene.onBeforeAnimationsObservable.remove(obs);
            newAnim.weight = 1.0;
        }
    });
  };

};
