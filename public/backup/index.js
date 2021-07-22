//on lose focus, clear inputs
//on lose focus pause/resume game?
//https://medium.com/@petertumulty/avoiding-the-global-scope-with-the-revealing-module-pattern-6796ae7af1b9
//https://stackoverflow.com/questions/407048/accessing-variables-from-other-functions-without-using-global-variables

let canvas = document.getElementById('renderCanvas');
initPointerLock(canvas);
document.addEventListener('DOMContentLoaded', () => new Game(canvas));


Game = function (canvas) {
  const engine = new BABYLON.Engine(canvas, true);   //antialiasing enabled
  window.addEventListener('resize', () => engine.resize());

  function createScene() {
    const scene = new BABYLON.Scene(engine);
    scene.enablePhysics(null, new BABYLON.OimoJSPlugin(100/*iternrations*/));
    scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -15, 0));
    scene.getPhysicsEngine()._physicsPlugin.world.enableRandomizer = false;
    return scene;
  }

  const scene = createScene();

  const ENTITY = new _ENTITY(scene);

  INPUTMANAGER.add('test1', () => {
    CONNECTION.shouldStop = !CONNECTION.shouldStop;
    console.log('stopped');
  }, 1);

  //static properties
  const localLighting = new LocalLighting(scene);
  const localWorld = new LocalWorld(scene);
  const world = new _WORLD(scene);

  //pov
  const cameraManager = new CameraManager(scene);
  const testPlayer = new ENTITY.PlayerEntity(98989);
  cameraManager.setCameraOwner(testPlayer.getHead());
  //cameraManager.toggleActiveCamera();

  //recieved data
  CONNECTION.onMessage.push(function test (data) {
    const creationDate = data[data.length - 1];

    if (!(data instanceof Array)) return;
      data.pop();
      //create new player if there does not exist an entity with matching id
      for (const element of data) {
        const id = element.id;
        const entity = ENTITY.Entity.getEntityByID(id);
        if (!entity) {
          let entity = new ENTITY.PlayerEntity(id);
          entity.render();
          console.log('creating new player with entity id ' + id);

          //testing sync
          testPlayer.sync = entity;
        }
      }

      //remove old players with no matching updated data

      for (const entity of ENTITY.Entity.entityArray) {
        if (entity.name == 'PlayerEntity' && entity != testPlayer) {
          if(!data.some((data) => data.id == entity.id)) {
            entity.dispose();
            console.log('deleting player with id ' + entity.id);
          }
        }
      }

      //apply updated data
      ENTITY.Entity.logAllInfo(data, creationDate);
  });

  scene.getPhysicsEngine()._physicsPlugin.world.postLoop = () => {
    if (INPUTMANAGER.isDown('keysForward')) testPlayer.keyForward();
    if (INPUTMANAGER.isDown('keysBackward')) testPlayer.keyBackward();
    if (INPUTMANAGER.isDown('keysRight')) testPlayer.keyRight();
    if (INPUTMANAGER.isDown('keysLeft')) testPlayer.keyLeft();
    if (INPUTMANAGER.isDown('keysUp')) testPlayer.keyJump();
    testPlayer.mouseMove(cameraManager.getCameraForwardVec());

    const afa = ['mouseMove', cameraManager.getCameraForwardVec()];
    CONNECTION.sendMessage([afa]);

    ENTITY.Entity.updateAll();

  };

  //Render Loop
  engine.runRenderLoop(() => {
    scene.render();
  });

};
