const path = require('path');
const BABYLON = require('babylonjs');
const UTILITY = require(path.join(path.dirname(require.main.filename), 'app', 'Tools', 'Utility.js'));

const Entity = require(path.join(path.dirname(require.main.filename), 'app', 'Entity', 'Entity.js'));

class PlayerEntity extends Entity {
  constructor(id) {
    super(id);
    this.mesh = BABYLON.MeshBuilder.CreateSphere('', { diameter: 2, }, Entity.scene);
    this.mesh.position = new BABYLON.Vector3(5, 5, 5);
    this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
        this.mesh,
        BABYLON.PhysicsImpostor.SphereImpostor,
        { mass: 1, restitution: 0, friction: 0 },
        Entity.scene);

    this.mesh.feet = new BABYLON.TransformNode('feet', Entity.scene);
    this.mesh.feet.parent = this.mesh;

    //instance variables
    this._f = 0;
    this._r = 0;
    this._u = 0;
    this._forwardVec = new BABYLON.Vector3(0, 0, 0);
    this.stateHistory = [];
    this.applyMode = false;

    //local client variables
    this._onBeginMove = [];
    this._onStopMove = [];
    this._onJump = [];
    this._onJumpFall = [];
    this._onJumpLand = [];
    this._onTick = [];
    this._syncClock = 0;
  }

  render() {
    //details for applyMode update logic
    this.applyMode = true;
    this.mesh.physicsImpostor.dispose();
  }

  onUpdate(){
    if (this.applyMode) this.applyMovement();
    else this.processMovement();

    this.logState();
    this.triggerStateCallbacks();
  }

  //inherented properies
  getInfo() {
    //must call super.getInfo() for innate info properties
    const info = super.getInfo();
    info.pos = this.getPos();
    return info;
  }

  logInfo(info, sentTime) {
    //applyMovement is where the logged info is applied to the entity
    super.logInfo(info, sentTime);
  }

  dispose() {
    this.mesh.dispose();
    super.dispose(); //remove references to entity (must call)
  }

}

//client attributes (children disposed when parent is disposed)
PlayerEntity.prototype.getHead = function() {
  const head = new BABYLON.TransformNode('head', Entity.scene);
  head.position = new BABYLON.Vector3(0, 1, 0);
  head.parent = this.mesh;

  return head;
};
PlayerEntity.prototype.getHead2 = function() {
  const head2 = new BABYLON.TransformNode('head2', Entity.scene);
  head2.position = new BABYLON.Vector3(1, 1, 0);
  head2.parent = this.mesh.feet;

  this.mesh.head2 = head2;
  return head2;
};

//callbacks
PlayerEntity.prototype.onBeginMove = function() {
  const array = this._onBeginMove;
  for (let i = 0; i < array.length; i++)
    array[i]();
  //console.log('Moving');
};//
PlayerEntity.prototype.onStopMove = function() {
  const array = this._onStopMove;
  for (let i = 0; i < array.length; i++)
    array[i]();
  //console.log('Stopped');
};//
PlayerEntity.prototype.onJump = function() {
  const array = this._onJump;
  for (let i = 0; i < array.length; i++)
    array[i]();
  //console.log('Jumped');
};//
PlayerEntity.prototype.onJumpFall = function() {
  const array = this._onJumpFall;
  for (let i = 0; i < array.length; i++)
    array[i]();
  //console.log('Falling');
};//
PlayerEntity.prototype.onJumpLand = function() {
  const array = this._onJumpLand;
  for (let i = 0; i < array.length; i++)
    array[i]();
  //console.log('Landed');
};//
PlayerEntity.prototype.onTick = function() {
  const array = this._onTick;
  for (let i = 0; i < array.length; i++)
    array[i]();
};//

//utility
PlayerEntity.accelerate = function(currentVel, wishDir, maxAccel, maxVelocity) {
  const scene = Entity.scene;
  /*
  let projVel = BABYLON.Vector3.Dot(currentVel, wishDir);

  let accelVel = Math.min(maxAccel * scene.getPhysicsEngine().getTimeStep(), //limit acceleration
    maxVelocity - projVel);

  accelVel = Math.max(0, accelVel); //accelVel must be positive

  const newVel = currentVel.add(wishDir.scale(accelVel));

  return newVel;
  */

  let projVel = BABYLON.Vector3.Dot(currentVel, wishDir);

  let addspeed = maxVelocity - projVel;

  if (addspeed <= 0) return currentVel.add(wishDir.scale(0));

  let accelVel = maxAccel * scene.getPhysicsEngine().getTimeStep() * maxVelocity;

  if (accelVel > maxVelocity) accelVel = addspeed;

  const newVel = currentVel.add(wishDir.scale(accelVel));

  return newVel;
};
PlayerEntity.applyFriction = function(currentVel, friction, ignoreY) {
  const scene = Entity.scene;

  const speed = currentVel.length();

  let newVel = BABYLON.Vector3.Zero();

  if (speed != 0) {
    const drop = friction * scene.getPhysicsEngine().getTimeStep() * speed;
    const scale = Math.max(0, speed - drop) / speed;

    if (ignoreY) newVel = currentVel.multiplyByFloats(scale, 1, scale);
    else newVel = currentVel.scale(Math.max(scale));
  }

  return newVel;
};
PlayerEntity.moveGround = function(currentVel, wishDir) {
    const maxAccelGround = 100;
    const maxVelocityGround = 10;
    const groundFriction = 10;

    let newVel = PlayerEntity.applyFriction(currentVel, groundFriction, true);

    return PlayerEntity.accelerate(newVel, wishDir, maxAccelGround, maxVelocityGround);
};
PlayerEntity.moveAir = function(currentVel, wishDir) {
    const maxAccelAir = 2;
    const maxVelocityAir = 10;
    const airFriction = 1;

    let newVel = PlayerEntity.applyFriction(currentVel, airFriction, true);
    return PlayerEntity.accelerate(newVel, wishDir, maxAccelAir, maxVelocityAir);

};
PlayerEntity.getWishDir = function(f, r, forwardVec) {
    let rightVec = PlayerEntity.getRightVec(forwardVec);

    forwardVec.y = 0;
    forwardVec.normalize();
    forwardVec = forwardVec.scale(f);

    rightVec.y = 0;
    rightVec.normalize();
    rightVec = rightVec.scale(r);

    const wishDir = forwardVec.add(rightVec);
    wishDir.normalize();

    return wishDir;
};
PlayerEntity.getRightVec = function (forwardVec) {
  return BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), forwardVec);
};
PlayerEntity.getYaw = function(forwardVec) {
  const v1 = forwardVec.clone();
  v1.y = 0;
  const v2 = new BABYLON.Vector3(0, 0, 1);
  return BABYLON.Vector3.GetAngleBetweenVectors(v2, v1, BABYLON.Axis.Y);
};

//instance utility
PlayerEntity.prototype.getVel = function() {
  return this.mesh.physicsImpostor.getLinearVelocity();
};
PlayerEntity.prototype.setVel = function(vel) {
  this.mesh.physicsImpostor.setLinearVelocity(vel);
};
PlayerEntity.prototype.getPos = function() {
  return this.mesh.position;
};
PlayerEntity.prototype.setPos = function(pos) {
  this.mesh.position = pos;
};
PlayerEntity.prototype.isOnGround = function() {
  if (this.stateHistory.length < 3) return;
  const first = this.stateHistory[this.stateHistory.length - 1].vel;
  const second = this.stateHistory[this.stateHistory.length - 2].vel;
  const third = this.stateHistory[this.stateHistory.length - 3].vel;

  const tolerance = 0.1;

  if (first.y <= tolerance && second.y <= tolerance && third.y <= tolerance &&
    first.y >= 0 && second.y >= 0 && third.y >= 0) return true;
  else return false;
};
PlayerEntity.prototype.getStateByTick = function(tick) {
  return this.stateHistory.find((x) => x.tick == tick);
};
PlayerEntity.prototype.sync = function(otherEntityState, tick) {
  const currState = this.getStateByTick(tick);
  if (!currState) return;

  const syncPos = new BABYLON.Vector3(otherEntityState.pos.x, otherEntityState.pos.y, otherEntityState.pos.z);
  const currPos = currState.pos;

  const dist = BABYLON.Vector3.Distance(syncPos, currPos);
  if (dist > 0.05) this._syncClock++;
  else if (this._syncClock > 0) this._syncClock--;

  //sync
  if (this._syncClock > 30) {
    const difference = syncPos.subtract(currPos);
    this.setPos(this.getPos().add(difference));
    this._syncClock = 0;
  }
};

//on game tick
PlayerEntity.prototype.applyMovement = function(instant) {
  //https://gameprogrammingpatterns.com/double-buffer.html
  //https://gamedev.stackexchange.com/questions/12754/how-to-interpolate-between-two-game-states

  let newPosition;

  if (instant) {
    const info = Entity.getCurrentSnap(this);
    if (info) newPosition = info.pos;
  } else if (!instant) {
    const factor = Entity.getLerpFactor(this);
    const current = Entity.getCurrentSnap(this);
    const previous = Entity.getPreviousSnap(this);

    if (factor && current && previous) {
      newPosition = BABYLON.Vector3.Lerp(previous.pos, current.pos, factor);
    }
  }

    if (newPosition) this.setPos(newPosition);
};
PlayerEntity.prototype.processMovement = function() {
  //movement
  const wishDir = PlayerEntity.getWishDir(this._f, this._r, this._forwardVec);
  const currentVel = this.getVel();
  let newVel = currentVel;

  if (this.isOnGround()) newVel = PlayerEntity.moveGround(currentVel, wishDir);
  else if (!this.isOnGround()) newVel = PlayerEntity.moveAir(currentVel, wishDir);
  if (this._u == 1 && this.isOnGround()) newVel.y = 6;

  this.setVel(newVel);

  //rotation
  const yaw = PlayerEntity.getYaw(this._forwardVec);
  this.mesh.feet.rotationQuaternion =
    new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, yaw);

  if (this.mesh.head2) {
    //this is just thrown in as a hook
    this.mesh.head2.rotationQuaternion =
      new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, - yaw);
  }

  //reset input variables
  this._f = 0;
  this._r = 0;
  this._u = 0;
};
PlayerEntity.prototype.logState = function() {
  const entry = {};
  entry.vel = this.getVel();
  entry.pos = this.getPos();
  entry.tick = Entity.scene.getStepId();

  this.stateHistory.push(entry);
  if (this.stateHistory.length > 30) this.stateHistory.shift();

};
PlayerEntity.prototype.triggerStateCallbacks = function() {
  //triggering local callbacks
  if (this.stateHistory.length < 3) return; //the last element in the array is the latest
  const first = this.stateHistory[this.stateHistory.length - 1].vel;
  const second = this.stateHistory[this.stateHistory.length - 2].vel;
  const third = this.stateHistory[this.stateHistory.length - 3].vel;

  const tolerance = 0.1;

  //jump triggers
  if (Math.abs(second.y) <= tolerance && second.y >= 0 &&
    Math.abs(first.y) >= tolerance && first.y >= 0)
  {
    this.onJump();
  }

  if (second.y >= 0 && first.y < 0) {
    this.onJumpFall();
  }

  if (Math.abs(first.y) <= tolerance && first.y >= 0 &&
    Math.abs(second.y) >= tolerance && second.y <= 0)
  {
    this.onJumpLand();
  }

  //movement triggers
  const first2 = first.clone();
  const second2 = second.clone();
  const third2 = third.clone();
  first2.y = 0;
  second2.y = 0;
  third2.y = 0;

  if (first2.length() > tolerance && second2.length() < tolerance) this.onBeginMove();

  if (first2.length() < tolerance && second2.length() < tolerance && third2.length() > tolerance) this.onStopMove();

  this.onTick();
};

//client commands
PlayerEntity.prototype.processPackage = function(package) {
  /*

  //Package template
  const inputPackage = {
    viewAngle: [0, 0, 0],
    forwardMove: 0,
    sideMove: 0,
    upMove: 0,
    buttons: [],
  };

  */
  this._forwardVec = new BABYLON.Vector3(package.viewAngle[0], package.viewAngle[1], package.viewAngle[2]);
  this._f = package.forwardMove;
  this._r = package.sideMove;
  this._u = package.upMove;

};
PlayerEntity.prototype.keyUp = function() {
  if (this._u < 1) this._u++;
};
PlayerEntity.prototype.keyDown = function() {
  if (this._u > -1) this._u--;
};
PlayerEntity.prototype.keyRight = function() {
  if (this._r < 1) this._r++;
};
PlayerEntity.prototype.keyLeft = function() {
    if (this._r > -1) this._r--;
};
PlayerEntity.prototype.keyForward = function() {
    if (this._f < 1) this._f++;
};
PlayerEntity.prototype.keyBackward = function() {
    if (this._f > -1) this._f--;
};
PlayerEntity.prototype.mouseMove = function(forwardVec) {
  this._forwardVec = forwardVec;
};

module.exports = PlayerEntity;
