const path = require('path');
const BABYLON = require('babylonjs');
const UTILITY = require(path.join(path.dirname(require.main.filename), 'app', 'Tools', 'Utility.js'));

const _WORLD = function (scene) {

  const createGround = function () {
    const mesh = BABYLON.MeshBuilder.CreatePlane('GROUND',
      { size: 60, }, scene);

    //move the mesh into correct orientation and position
    mesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.WORLD);
    mesh.translate(BABYLON.Axis.Y, -4, BABYLON.Space.WORLD);

    //physics stuff
    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0, restitution: 0, friction: 0 },
      scene);

    mesh.checkCollisions = true;

    return mesh;
  };

  const ground = createGround();

  //testing deterministic lockstep
  var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);
    sphere.position.y = 4;
  sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 8, restitution: 0.9 }, scene);

  scene.onAfterStepObservable.add(function(theScene){
  if(sphere.physicsImpostor.getLinearVelocity().length() < BABYLON.PhysicsEngine.Epsilon) {
      console.log("sphere is at rest on stepId: "+theScene.getStepId());
      theScene.onAfterStepObservable.clear();
  }});
};

module.exports = _WORLD;
