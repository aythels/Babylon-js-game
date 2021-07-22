//making stuff look good https://doc.babylonjs.com/how_to/using_depth-of-field_and_other_lens_effects
//https://www.youtube.com/watch?v=YGDzRVwmTgM
//movement animations
//https://www.youtube.com/watch?v=2xjIfFOTtBc

//const playerUtility = new PlayerUtility(scene);
//const player = new Player(scene, cameraManager, playerUtility);
//this.camera = player.camera;

PlayerUtility = function (scene) {
  const _this = this;

  //on init

  this.defaultSpawnPos = new BABYLON.Vector3(5, 5, 5);

  //position
  this.createPlayerMesh = function(funct, position) {
    const mesh = BABYLON.MeshBuilder.CreateSphere('', { diameter: 2, }, scene);
    mesh.position = position || this.defaultSpawnPos;
    mesh.visibility = 0.5;
    mesh.isPickable = false;

    //physics imposter
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      mesh,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 1, restitution: 0, friction: 0 },
      scene);

    mesh.physicsImpostor.registerAfterPhysicsStep(() => {
      funct();
    });

    //other parts
    const body = BABYLON.MeshBuilder.CreateCylinder('', { diameter: 1, height: 1.8 }, scene);
    body.setPivotMatrix(BABYLON.Matrix.Translation(0, 1.8 / 2, 0), false);
    body.position = new BABYLON.Vector3(0, -1, 0);

    body.visibility = 0.5;
    body.parent = mesh;
    body.isPickable = false;

    this.createPlayerFeet(mesh);
    this.createPlayerHead(mesh);

    const cameraHolder = BABYLON.MeshBuilder.CreateSphere('', { diameter: 0.2, }, scene);
    cameraHolder.position = new BABYLON.Vector3(0, 0, 0);
    mesh.physicsImpostor.registerAfterPhysicsStep(() => cameraHolder.position = mesh.feet.derp.position);

    return mesh;
  };

  //direction
  this.createPlayerFeet = function(body) {
    const mesh = BABYLON.MeshBuilder.CreateCylinder("cone", {
      diameter: 0.5,
      diameterTop: 0,
      height: 0.5,
      tessellation: 4}, scene);

    //mesh3.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI / 2);
    //mesh.rotate(BABYLON.Axis.X, Math.PI/2, BABYLON.Space.WORLD);

    mesh.visibility = 0.5;
    mesh.isPickable = false;

    body.physicsImpostor.registerAfterPhysicsStep(() => mesh.position = body.position);
    body.feet = mesh;


    const mesh2 = BABYLON.MeshBuilder.CreateSphere('', { diameter: 0.5, }, scene);
    mesh2.position = new BABYLON.Vector3(1, 1, 0);
    mesh2.parent = mesh;
    mesh2.visibility = 0.5;
    mesh.derp = mesh2;

    return mesh;
  };

  //camera location
  this.createPlayerHead = function(body) {
    const mesh = BABYLON.MeshBuilder.CreateSphere('', { diameter: 0.5, }, scene);
    mesh.position = new BABYLON.Vector3(0, 1, 0);


    //set pivot
    //pivotAt = new BABYLON.Vector3(0, 0, 0);
    //relativePosition = pivotAt.subtract(mesh.position);
    //mesh.setPivotPoint(relativePosition);

    mesh.visibility = 0.5;
    mesh.isPickable = false;

    mesh.parent = body;
    body.head = mesh;
  };

  //physics utilty

  function accelerate(currentVel, wishDir, maxAccel, maxVelocity) {
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
  }

  function applyFriction(currentVel, friction, ignoreY) {
    const speed = currentVel.length();

    let newVel = BABYLON.Vector3.Zero();

    if (speed != 0) {
      const drop = friction * scene.getPhysicsEngine().getTimeStep() * speed;
      const scale = Math.max(0, speed - drop) / speed;

      if (ignoreY) newVel = currentVel.multiplyByFloats(scale, 1, scale);
      else newVel = currentVel.scale(Math.max(scale));
    }

    return newVel;
  }

  function moveGround(currentVel, wishDir) {
    const maxAccelGround = 100;
    const maxVelocityGround = 10;
    const groundFriction = 10;

    let newVel = applyFriction(currentVel, groundFriction, true);

    return accelerate(newVel, wishDir, maxAccelGround, maxVelocityGround);
  }

  function moveAir(currentVel, wishDir) { const maxAccelAir = 2; const
  maxVelocityAir = 10; const airFriction = 1;

    let newVel = applyFriction(currentVel, airFriction, true);
    return accelerate(newVel, wishDir, maxAccelAir, maxVelocityAir);

  }

  //utility

  function getWishDir(f, r, forwardVec, rightVec) {
    forwardVec.y = 0;
    forwardVec.normalize();
    forwardVec = forwardVec.scale(f);

    rightVec.y = 0;
    rightVec.normalize();
    rightVec = rightVec.scale(r);

    const wishDir = forwardVec.add(rightVec);
    wishDir.normalize();

    return wishDir;
  }

  function getPlayerVel(player) {
    return player.playerMesh.physicsImpostor.getLinearVelocity();
  }

  //actives

  this.jump = function(player) {
    if (!player.isOnGround) return;
    player.playerMesh.physicsImpostor.setLinearVelocity(
      new BABYLON.Vector3(player.currentVel.x, 6, player.currentVel.z));
    player.isOnGround = false;

    player.onJump();

  };

  this.crouch = function(player) {
    if (player.isCrouched) return;
    player.isCrouched = true;
    player.onBeginCrouch();
    const mesh = player.playerMesh.head;
    let anim = BABYLON.Animation.CreateAndStartAnimation('', mesh, 'position.y', 30, 3, mesh.position.y, -0.1,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    anim.onAnimationEnd = () => {
      player.onFinishCrouch();
    };
  };

  this.rise = function(player) {
    if (!player.isCrouched) return;
    player.isCrouched = false;
    player.onBeginRise();
    const mesh = player.playerMesh.head;
    let test = BABYLON.Animation.CreateAndStartAnimation('', mesh, 'position.y', 30, 3, mesh.position.y, 0.5,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    test.onAnimationEnd = () => {
      player.onFinishRise();
    };
  };

  //on tick
  this.updatePlayerStatus = function (player, f, r, forwardVec) {
    //checking if player is on ground

    const rightVec = getCameraRightVec(forwardVec);
    const yaw = getCameraYaw(forwardVec);


    player.oldY = player.newY;
    player.newY = getPlayerVel(player).y;
    if (player.oldY < 0 && player.newY >= 0) {
      player.isOnGround = true;
      player.onJumpLand();
    }
    if (player.oldY >= 0 && player.newY < 0) {
      player.onJumpFall();
    }

    //checking for movement
    player.oldXZ = player.newXZ;
    const velXZ = getPlayerVel(player);
    velXZ.y = 0;
    player.newXZ = velXZ;
    if (player.oldXZ.length() <= 0.5 && player.newXZ.length() > 0.5) {
      player.onBeginMove();
    }
    if (player.oldXZ.length() > 0.5 && player.newXZ.length() <= 0.5) {
      player.onStopMove();
    }

    player.currentVel = getPlayerVel(player);
    player.wishDir = getWishDir(f, r, forwardVec, rightVec);
    player.lookYaw = yaw;

    updatePlayer(player);
  };

  function updatePlayer(player) {
    const currentVel = player.currentVel;
    const wishDir = player.wishDir;


    let value = null;
    if(!player.interpUsed) {
      player.interpUsed = true;
      value = player.moveTo();
    }

    const final = value || new BABYLON.Vector3(0, 0 ,0);

    if (player.isOnGround)
      player.playerMesh.physicsImpostor.setLinearVelocity(moveGround(currentVel, wishDir).add(final));
    else if (!player.isOnGround && Math.abs(getPlayerVel(player).y) > 2)
      player.playerMesh.physicsImpostor.setLinearVelocity(moveAir(currentVel, wishDir).add(final));

    player.playerMesh.feet.rotationQuaternion =
      new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, player.lookYaw);

    player.playerMesh.feet.derp.rotationQuaternion =
      new BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, - player.lookYaw);

    //console.log(Math.abs(getPlayerVel(player).y));

  }


  //more UTILITY
  function getCameraRightVec (cameraForwardVec) {
    return BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), cameraForwardVec);
  }

  function getCameraYaw (cameraForwardVec) {
    const v1 = cameraForwardVec.clone();
    v1.y = 0;
    const v2 = new BABYLON.Vector3(0, 0, 1);
    return BABYLON.Vector3.GetAngleBetweenVectors(v2, v1, BABYLON.Axis.Y);
  }

};

Player = function (scene, cameraManager, playerUtility) {
  const _this = this;

  let tick = 0;

  //this.shouldTick = false;
  this.onAfterPhysicsTick = function() {
    //_this.shouldTick = !_this.shouldTick;
    //if (_this.shouldTick) return;

    _this.logViewHistory(cameraManager.getCameraForwardVec());
    /*
    if (_this.viewHistory.length > 2) {
    console.log(BABYLON.Vector3.GetAngleBetweenVectors(
      _this.viewHistory[_this.viewHistory.length - 1],
      _this.viewHistory[_this.viewHistory.length - 2], BABYLON.Axis.Y));
    }*/

    let f = 0;
    let r = 0;
    if (INPUTMANAGER.isDown('keysForward')) f += 1;
    if (INPUTMANAGER.isDown('keysBackward')) f -= 1;
    if (INPUTMANAGER.isDown('keysRight')) r += 1;
    if (INPUTMANAGER.isDown('keysLeft')) r -= 1;
    const forwardVec = cameraManager.getCameraForwardVec();

    //temp
    const afa = ['mouseMove', cameraManager.getCameraForwardVec()];
    CONNECTION.sendMessage([afa]);


    playerUtility.updatePlayerStatus(_this, f, r, forwardVec);

    _this.log(_this.playerMesh.position);

    mesh.position = _this.history[0];
  };

  this.playerMesh = playerUtility.createPlayerMesh(this.onAfterPhysicsTick);

  this.isOnGround = false;
  this.oldY = 0;
  this.newY = 0;
  this.oldXZ = BABYLON.Vector3.Zero();
  this.newXZ = BABYLON.Vector3.Zero();
  this.currentVel = 0;

  this.lookYaw = 0;
  this.isCrouched = false;



  const mesh = BABYLON.MeshBuilder.CreateSphere('', { diameter: 2, }, scene);
  mesh.position = new BABYLON.Vector3(5, 5, 10);
  mesh.visibility = 0.5;

  //testing
  this.viewHistory = [];
  this.logViewHistory = function (view) {
    this.viewHistory.push(view);
    if (this.viewHistory.length > 30) this.viewHistory.shift();
  };

  this.history = [];
  this.log = function (position) {
    position.__time = Date.now();
    const delay = 400000;
    const tick = 60 / 1000; //second
    const rate = Math.round(tick * delay);

    this.history.push(position);
    if (this.history.length > rate) this.history.shift();
  };

  this.interp = new BABYLON.Vector3(0, 0 ,0);
  this.interpUsed = false;

  this.interpolate = function (pos, time) { //temp
    this.interp.x = pos.x;
    this.interp.y = pos.y;
    this.interp.z = pos.z;
    this.interp.__time = time;
    this.interpUsed = false;
  };



  this.moveTo = function () {
    if (!this.history[0] || !this.start || !this.isOnGround) return;

    const playerPosition = this.history.find(e => this.interp.__time < e.__time) || this.playerMesh.position; //check this

    const pos = _this.interp.subtract(playerPosition);
    const length = BABYLON.Vector3.Distance(_this.interp, playerPosition);
    const final = pos.scale(2); //.scale(length);      //.normalize().scale(length * 5); //check this

    if (length > 0.05) {
      //_this.playerMesh.physicsImpostor.setLinearVelocity(final);
      return final;
    }
  };

  //cameraManager.setCameraOwner(this.playerMesh.head);
  cameraManager.setCameraOwner(this.playerMesh.feet.derp);

  INPUTMANAGER.add('test3', () => {
    cameraManager.toggleActiveCamera();
  }, 1);

  INPUTMANAGER.add('test2', () => {
    _this.start = true;
    _this.moveTo();
  }, 1);

  INPUTMANAGER.add('keysUp', () => {
    playerUtility.jump(this);
  }, 1);

  INPUTMANAGER.add('keysDown', () => {
    playerUtility.crouch(this);
  }, 1);

  INPUTMANAGER.add('keysDown', () => {
    playerUtility.rise(this);
  }, 3);

  //client side callbacks

  this.onBeginCrouch = function() {
    //console.log('crouching');
  };

  this.onFinishCrouch = function() {
    //console.log('crouched');
  };

  this.onBeginRise = function() {
    //console.log('rising');
  };

  this.onFinishRise = function() {
    //console.log('rised');
  };

  this.onBeginMove = function() {
    //console.log('Moving');
  };

  this.onStopMove = function() {
    //console.log('Stopped');
  };

  this.onJump = function() {
    //console.log('Jumped');
  };

  this.onJumpFall = function() {
    //console.log('Falling');
  };

  this.onJumpLand = function() {
    soundManager.playStop('land');
    //console.log('Landed');
  };

};
