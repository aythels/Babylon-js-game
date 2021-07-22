const _ENTITY = function (scene) {
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

     logInfo(info, sentTime) {
       //create new array if needed
       if (!this.snapQueue) this.snapQueue = [];

       //timelog snap and add to queue
       info.recieveTime = Date.now();
       info.sentTime = sentTime;
       this.snapQueue.push(info);

       //cycle array if full
       if (this.snapQueue.length > 4) this.snapQueue.shift();

     }

     dispose() {
       UTILITY.removeItem(this, Entity.entityArray);
     }
  }

  Entity.scene = scene;

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
  Entity.logAllInfo = function(infoArray, sentTime) {
    for (let i = 0; i < infoArray.length; i++) {
      const info = infoArray[i];
      const entity = Entity.getEntityByID(info.id);

      if (entity) entity.logInfo(info, sentTime);
    }
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

    const fps = 51; //new update every 50 miliseconds
    let timeElapsed = Date.now() - current.recieveTime;
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
      this._forwardVec = new BABYLON.Vector3(0, 0, 0);
      this.stateHistory = [];
      this.applyMode = false;

      //local client variables
      this.sync = null;
      this._onBeginMove = [];
      this._onStopMove = [];
      this._onJump = [];
      this._onJumpFall = [];
      this._onJumpLand = [];
      this._onTick = [];
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
      //must call super.dispose() on end
      this.mesh.dispose();
      super.dispose(); //remove references to entity
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
  PlayerEntity.prototype.getClosestStateEntryByTime = function(time) {
    const counts = this.stateHistory;
    const goal = time;

    const closest = counts.reduce((prev, curr) => {
      return (Math.abs(curr.time - goal) < Math.abs(prev.time - goal) ? curr : prev);
    });

    return closest;
  };
  PlayerEntity.prototype.testSync = function() {
    if (!this.sync || this.stateHistory.length < 5) return;

    const syncTime = Entity.getCurrentSnap(this.sync).sentTime;
    const match = this.getClosestStateEntryByTime(syncTime - 25);

    if (match.time - syncTime > 10) return;
    //console.log(syncTime, match.time);

    //Moving
    const playerPos = match.pos;
    const syncPos = this.sync.mesh.position;

    const length = BABYLON.Vector3.Distance(playerPos, syncPos);
    const direction = syncPos.subtract(playerPos);
    direction.y = 0;
    direction.scale(length * 0.1);

    //const final = pos.scale(2); //.scale(length);      //.normalize().scale(length * 5); //check this
    //const playerVel = this.getVel();
    //if (length > 0.05) this.setVel(direction.add(playerVel));
    return direction;
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
    //testing offset
    ///this.testOffset = this.testSync();
    //if (!this.testOffset) this.testOffset = new BABYLON.Vector3(0, 0, 0);
    //if (this.testOffset.length() > this.getVel().length()) console.log('wtf');

    //position
    const currentVel = this.getVel();
    const wishDir = PlayerEntity.getWishDir(this._f, this._r, this._forwardVec);

    if (this.isOnGround()) this.setVel(PlayerEntity.moveGround(currentVel, wishDir));
    else if (!this.isOnGround()) this.setVel(PlayerEntity.moveAir(currentVel, wishDir));

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
  };
  PlayerEntity.prototype.logState = function() {
    const entry = {};
    entry.vel = this.getVel();
    entry.pos = this.getPos();
    entry.time = Date.now();

    this.stateHistory.push(entry);
    if (this.stateHistory.length > 10) this.stateHistory.shift();

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
  PlayerEntity.prototype.keyJump = function() {
    if (!this.isOnGround()) return;

    const currentVel = this.getVel();
    this.setVel(new BABYLON.Vector3(currentVel.x, 6, currentVel.z));
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
    const vector = new BABYLON.Vector3(forwardVec.x, forwardVec.y, forwardVec.z);
    this._forwardVec = vector;
  };

  this.Entity = Entity;
  this.PlayerEntity = PlayerEntity;

};
