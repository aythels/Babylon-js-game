const _WORLD = function (scene) {
  const materialGrey = new BABYLON.StandardMaterial('', scene);
  materialGrey.diffuseColor = new BABYLON.Color3(82 / 255, 82 / 255, 82 / 255);

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
    mesh.material = materialGrey;

    return mesh;
  };

  const ground = createGround();
};
