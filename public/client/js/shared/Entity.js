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
  Entity.logAllInfo = function(infoArray) {
    for (let i = 0; i < infoArray.length; i++) {
      const info = infoArray[i];
      const entity = Entity.getEntityByID(info.id);
      if (entity) entity.logInfo(info);
    }

    //logging snap rate
    Entity._snaps.push(Date.now());
    if (Entity._snaps.length > 10) Entity._snaps.shift();
    Entity.snapRate = UTILITY.averageDelta(Entity._snaps);
  };
  Entity._snaps = [];
  Entity.snapRate = 0;
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

    const fps = Entity.snapRate;
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

  class PlayerEntity extends Entity {
    constructor(id) {
      super(id);
      //player location
      this.mesh = BABYLON.MeshBuilder.CreateSphere('', { diameter: 2, }, Entity.scene);
      this.mesh.position = new BABYLON.Vector3(5, 5, 5);
      this.mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
          this.mesh,
          BABYLON.PhysicsImpostor.SphereImpostor,
          { mass: 1, restitution: 0, friction: 0 },
          Entity.scene);
      this.mesh.visibility = 0.2;

      //player rotation (based on camera direction)
      this.mesh.feet = new BABYLON.TransformNode('feet', Entity.scene);
      this.mesh.feet.position = new BABYLON.Vector3(0, -1, 0);
      this.mesh.feet.parent = this.mesh;

      //instance variables
      this._f = 0;
      this._r = 0;
      this._u = 0;
      this._forwardVec = new BABYLON.Vector3(0, 0, 0);
      this._run = 0;
      this.activeState = 0; //0 - idle, 1 - walk, 2 - run, 3 - crouch, 3.5 = crouch idle, 4 - jump
      this.stateHistory = [];
      this.applyMode = false;
      this.localCallbacksEnabled = false;

      //local client variables
      this.syncClock = 0;
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
    this.mesh.head = head;

    return head;
  };
  PlayerEntity.prototype.getHead2 = function() {
    const head = new BABYLON.TransformNode('head2', Entity.scene);
    head.position = new BABYLON.Vector3(0.5, 1, 0);

    const pivot = new BABYLON.TransformNode("root");
    pivot.position = new BABYLON.Vector3(0, 1, 0);
    pivot.parent = this.mesh.feet;
    head.parent = pivot;

    this.mesh.head = head;
    return head;
  };

  //callbacks
  PlayerEntity.prototype.onCrouch = function() {
    //console.log('Crouching');
  };
  PlayerEntity.prototype.onCrouchIdle = function() {
    //console.log('Stopped while crouching');
  };//
  PlayerEntity.prototype.onWalk = function() {
    //console.log('Walking');
  };//
  PlayerEntity.prototype.onRun = function() {
    //console.log('Running');
  };
  PlayerEntity.prototype.onStandIdle = function() {
    //console.log('Stopped standing');
  };//
  PlayerEntity.prototype.onJump = function() {
    //console.log('Jumped');
  };//
  PlayerEntity.prototype.onFall = function() {
    //console.log('Falling');
  };//
  PlayerEntity.prototype.onLand = function() {
    //console.log('Landed');
  };//
  PlayerEntity.prototype.onTick = function() {
    if ((this.activeState == 3 || this.activeState == 3.5) && this.mesh.head) {
        const pos = this.mesh.head.position;
        if (pos.y >= 0.5) pos.y -= 0.10;
    } else if (this.mesh.head) {
        const pos = this.mesh.head.position;
        if (pos.y < 1) pos.y += 0.10;
    }

    if (this.mesh.head.name == "head2") {
      //first rotation is pivot parented to feet
      this.mesh.head.rotationQuaternion =
        new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, - PlayerEntity.getYaw(this._forwardVec));
    }
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
  PlayerEntity.moveGround = function(currentVel, wishDir, addition) {
      const maxAccelGround = 100;
      const maxVelocityGround = addition ? 5 + addition : 5;
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
    if (dist > 0.05) this.syncClock++;
    else if (this.syncClock > 0) this.syncClock--;

    //sync
    if (this.syncClock > 30) {
      const difference = syncPos.subtract(currPos);
      this.setPos(this.getPos().add(difference));
      this.syncClock = 0;
    }
  };

  //on game tick
  PlayerEntity.prototype.applyMovement = function(instant) {
    //https://gameprogrammingpatterns.com/double-buffer.html
    //https://gamedev.stackexchange.com/questions/12754/how-to-interpolate-between-two-game-states
    //add rotation

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
    //MOVEMENT
    const wishDir = PlayerEntity.getWishDir(this._f, this._r, this._forwardVec);
    const currentVel = this.getVel();
    let newVel = currentVel;
    let activeState = 0;

    if (this.isOnGround()) {
      if (wishDir.length() == 0 && this._run == -1) activeState = 3.5;
      else if (wishDir.length() == 0) activeState = 0;
      else activeState = this._run == 1 ? 2 : this._run == -1 ? 3 : 1;

      newVel = PlayerEntity.moveGround(currentVel, wishDir, this._run == 1 ? 4 : this._run == -1 ? -4 : 0);
      if (this._u == 1) newVel.y = 6;
    }
    else if (!this.isOnGround()) {
      newVel = PlayerEntity.moveAir(currentVel, wishDir);
      activeState = 4;
    }

    this.setVel(newVel);
    this.activeState = activeState;

    //ROTATION
    const yaw = PlayerEntity.getYaw(this._forwardVec);
    this.mesh.feet.rotationQuaternion =
      new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, yaw);

    //reset input variables
    this._f = 0;
    this._r = 0;
    this._u = 0;
    this._run = 0;
  };
  PlayerEntity.prototype.logState = function() {
    const entry = {};
    entry.pos = this.getPos();
    entry.vel = this.getVel();
    entry.activeState = this.activeState;
    entry.tick = Entity.scene.getStepId();

    this.stateHistory.push(entry);
    if (this.stateHistory.length > 30) this.stateHistory.shift();

    if(this.localCallbacksEnabled) this.triggerLocalCallbacks();
  };
  PlayerEntity.prototype.triggerLocalCallbacks = function() {
    if (this.stateHistory.length < 3) return; //the last element in the array is the latest
    const first = this.stateHistory[this.stateHistory.length - 1].activeState;
    const second = this.stateHistory[this.stateHistory.length - 2].activeState;
    const third = this.stateHistory[this.stateHistory.length - 3].activeState;

    if (first == 4 && second != 4) this.onJump();
    if (first == 1 && second != 1) this.onWalk();
    if (first == 2 && second != 2) this.onRun();
    if (first == 3 && second != 3) this.onCrouch();
    if (first == 3.5 && second != 3.5) this.onCrouchIdle();
    if (first == 0 && second != 0) this.onStandIdle();
    if (first != 4 && second == 4) this.onLand();

    const first2 = this.stateHistory[this.stateHistory.length - 1].vel;
    const second2 = this.stateHistory[this.stateHistory.length - 2].vel;
    const third2 = this.stateHistory[this.stateHistory.length - 3].vel;
    if (second2.y >= 0 && first2.y < 0) this.onFall();

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
    this._run = package.runMove;

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
  PlayerEntity.prototype.keyRun = function() {
    if (this._run < 1) this._run++;
  };
  PlayerEntity.prototype.keyCrouch = function() {
    if (this._run > -1) this._run--;
  };

  this.Entity = Entity;
  this.PlayerEntity = PlayerEntity;

};
