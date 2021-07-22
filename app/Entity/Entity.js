const path = require('path');
const BABYLON = require('babylonjs');
const UTILITY = require(path.join(path.dirname(require.main.filename), 'app', 'Tools', 'Utility.js'));

class Entity {
   constructor(id) {
    if (!id) console.error('Missing id in creating Entity');

    this.id = id; //this.id
    this.constructor.prototype.name = this.constructor.name; //this.name

    Entity.entityArray.push(this);
  }

   getInfo() {
     const info = {};
     info.id = this.id;
     info.name = this.name;

     return info;
   }

   logInfo(info) {
     //create new array if needed
     if (!this.snapQueue) this.snapQueue = [];

     //timelog snap and add to queue
     info.recieveTime = Date.now();
     this.snapQueue.push(info);

     //cycle array if full
     if (this.snapQueue.length > 4) this.snapQueue.shift();

   }

   dispose() {
     UTILITY.removeItem(this, Entity.entityArray);
   }
}

Entity.entityArray = [];
Entity.getEntityByID = function(id) {
  //returns entity in entityArray with matching id (undefined if not found)
  return Entity.entityArray.find(entity => entity.id == id);

};
Entity.getEntitiesByID = function(id) {
  //return array of  all entities in entityArray with matching ids (empty array if not found)
  return Entity.entityArray.filter(entity => entity.id == id);
};
Entity.getAllInfo = function() {
  //returns array of info objects called on each entity in internal array

  let array = [];

  for (let i = 0; i < Entity.entityArray.length; i++) {
    let entity = Entity.entityArray[i];
    if (entity.getInfo()) array.push(entity.getInfo());
  }

  if (array.length != 0) return array;
};
Entity.logAllInfo = function(infoArray) {
  for (let i = 0; i < infoArray.length; i++) {
    const info = infoArray[i];
    const entity = Entity.getEntityByID(info.id);
    if (entity) entity.logInfo(info);
  }
};

Entity.getSnapRate = function(entity) {
  if (!entity.snapQueue) return;

  const averageDelta = ([x,...xs]) => {
    if (x === undefined)
      return NaN;
    else
      return xs.reduce(
        ([acc, last], x) => [acc + (x - last), x],
        [0, x]
      ) [0] / xs.length;
  };

  const arr = [];

  for (let i = 0; i < entity.snapQueue.length; i++) {
    arr.push(entity.snapQueue[i].recieveTime);
  }

  return averageDelta(arr);
};
Entity.getCurrentSnap = function(entity) {
  if (!entity.snapQueue) return;
  return entity.snapQueue[entity.snapQueue.length - 1];
};
Entity.getPreviousSnap = function(entity) {
  if (!entity.snapQueue) return;
  return entity.snapQueue[entity.snapQueue.length - 2];
};
Entity.getLerpFactor = function(entity) {
  //at factor = 1, object stops moving when lerping
  //small factor = not moving fast enough, so value is overwritten by tick
  //big factor = moving too much, overshooting value only to be corrected by tick

  let current = Entity.getCurrentSnap(entity);
  let previous = Entity.getPreviousSnap(entity);
  if (!current || !previous) return;

  const fps = Entity.getSnapRate(entity);
  let timeElapsed = Date.now() - current.recieveTime; //time since last update

  let factor = timeElapsed / fps;

  if (factor >= 1) {
    previous = current;
    current = Entity.getCurrentSnap(entity);

    //recalculating
    timeElapsed = Date.now() - current.recieveTime;
    factor = timeElapsed / fps;

    if (factor >= 1) {
      console.log(previous.recieveTime - current.recieveTime);

        //allow for extrapolation
        //entity.previous = previous;
        //if (factor > 1.02) factor = 1.02;

      factor = 1;
    }
  }

  return factor;
};

//update logic hook
Entity.updateAll = function() {
  //to be hooked onto physics loop
  for (let i = 0; i < Entity.entityArray.length; i++) {
    Entity.entityArray[i].onUpdate();
  }};

module.exports = Entity;
