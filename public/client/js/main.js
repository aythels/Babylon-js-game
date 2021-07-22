//on lose focus, clear inputs
//on lose focus pause/resume game?
//https://medium.com/@petertumulty/avoiding-the-global-scope-with-the-revealing-module-pattern-6796ae7af1b9
//https://stackoverflow.com/questions/407048/accessing-variables-from-other-functions-without-using-global-variables
//scene.preventDefaultOnPointerDown = false; //
//https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization

//game initialization
const canvas = document.getElementById('renderCanvas');
document.addEventListener('DOMContentLoaded', () => new Game(canvas));
_PointerLock(canvas);

Game = function (canvas) {
  //engine initialization with antialiasing enabled
  const engine = new BABYLON.Engine(canvas, true, {
    deterministicLockstep: true,
    lockstepMaxSteps: 4
  });
  window.addEventListener('resize', () => engine.resize());

  //scene initialization
  const scene = new BABYLON.Scene(engine);
  scene.enablePhysics(null, new BABYLON.OimoJSPlugin(100));  //100 iterations
  scene.getPhysicsEngine().getPhysicsPlugin().world.enableRandomizer = false;

  scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -15, 0));
  scene.getPhysicsEngine().setTimeStep(1/60);

  //local component initialization
  _LocalLighting(scene);
  _LocalWorld(scene);

  //client component initialization
  const cameraManager = new _CameraManager(scene);
  const animManager = new _AnimManager(scene);

  //shared component initialization
  const WORLD = new _WORLD(scene);
  const ENTITY = new _ENTITY(scene);

  //player initialization
  const testPlayer = new ENTITY.PlayerEntity(98989);
  testPlayer.localCallbacksEnabled = true;
  cameraManager.setCameraOwner(testPlayer.getHead2());

  CONNECTION.onMessage.push((data) => {
    //create new player if there does not exist an entity with matching id
    for (const element of data) {
      if (element.name == 'PlayerEntity') {
        const id = element.id;
        const entity = ENTITY.Entity.getEntityByID(id);
        if (!entity) {
          const entity = new ENTITY.PlayerEntity(id);
          entity.render();
          console.log('creating new player with entity id ' + id);
        }
      }
    }

    //delete inactive users
    for (const entity of ENTITY.Entity.entityArray) {
      if (entity.name == 'PlayerEntity' && !data.some((data) => data.id == entity.id) && entity.id != 98989) {
        entity.dispose();
        console.log('deleting player with id ' + entity.id);
      }
    }

    //updating all existing player states
    ENTITY.Entity.logAllInfo(data, Date.now());

    //syncing client with server copy
    const syncID = data[data.length - 1]._id;
    const syncState = data.find((element) => element.id == syncID);
    const syncTick = data[data.length - 1]._tick;
    testPlayer.sync(syncState, syncTick);
  });

  //update loop
  scene.onBeforeStepObservable.add((sce) => {
    //sample user inputs
    const inputPackage = {
      tick: sce.getStepId(),
      viewAngle: [0, 0, 0],
      forwardMove: 0,
      sideMove: 0,
      upMove: 0,
      runMove: 0,
      buttons: [],
    };

    const viewAngle = cameraManager.getCameraForwardVec();
    inputPackage.viewAngle = [viewAngle.x, viewAngle.y, viewAngle.z];
    if (INPUTMANAGER.isDown('keysForward')) inputPackage.forwardMove++;
    if (INPUTMANAGER.isDown('keysBackward')) inputPackage.forwardMove--;
    if (INPUTMANAGER.isDown('keysRight')) inputPackage.sideMove++;
    if (INPUTMANAGER.isDown('keysLeft')) inputPackage.sideMove--;
    if (INPUTMANAGER.isDown('keysUp')) inputPackage.upMove++;
    if (INPUTMANAGER.isDown('keysRun')) inputPackage.runMove++;
    if (INPUTMANAGER.isDown('keysCrouch')) inputPackage.runMove--;

    //process client-sided simulation
    testPlayer.processPackage(inputPackage);
    ENTITY.Entity.updateAll();

    //send server user inputs
    CONNECTION.sendMessage(inputPackage);

    //processServerInfo

  });

  //render loop
  engine.runRenderLoop(() => {
    scene.render();
  });


  //load model
  BABYLON.SceneLoader.ImportMesh(null, "assets/models/", "untitled.babylon", scene, function (meshes, particleSystems, skeletons) {
    for (let i = 0; i < meshes.length; i++) {
      //meshes[i].position = new BABYLON.Vector3(0, -4, 10);
      meshes[i].parent = testPlayer.mesh.feet;
      meshes[i].rotate(BABYLON.Axis.X, -Math.PI / 2, BABYLON.Space.WORLD);
      meshes[i].rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.WORLD);
      meshes[i].scaling = new BABYLON.Vector3(0.013, 0.013, 0.013);
      meshes[i].isPickable = false;
    }

    /*
    BABYLON.Animation.AllowMatricesInterpolation = true;
    scene.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
    scene.animationPropertiesOverride.loopMode = BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE;
    */
    const idleAnim = scene.beginWeightedAnimation(skeletons[0], 0, 101, 1, true, 2);
    const walkAnim = scene.beginWeightedAnimation(skeletons[0], 105, 153, 0, true, 2);
    const runAnim = scene.beginWeightedAnimation(skeletons[0], 158, 190, 0, true, 2);

    testPlayer.onRun = () => animManager.blend(0.15, runAnim, 0);
    testPlayer.onStandIdle = () => animManager.blend(0.15, idleAnim, 0);
    testPlayer.onWalk = () => animManager.blend(0.15, walkAnim, 0);

    INPUTMANAGER.add('test2', () => {
      //idle to walk
      //blendTo(0.02, idleAnim, walkAnim, null, 0.15);

      //walk to run
      //blendTo(0.08, walkAnim, runAnim, 0.58, 0);

      animManager.blend(0.15, runAnim, 0);

    }, 1);

    INPUTMANAGER.add('test3', () => {
      //walk to idle
      //blendTo(0.02, walkAnim, idleAnim, 0.15, null);

      //run to walk
      //blendTo(0.08, runAnim, walkAnim, 0.1, 0);
      animManager.blend(0.15, idleAnim, 0);

    }, 1);

  });

};
