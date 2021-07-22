const _LocalWorld = function (scene) {
  const materialGrey = new BABYLON.StandardMaterial('', scene);
  materialGrey.diffuseColor = new BABYLON.Color3(82 / 255, 82 / 255, 82 / 255);

  const createGrid = function () {
    const size = 20;
    const steps = 2;
    const myLines = [];

    for (let i = -size; i <= size; i += steps) {
      myLines.push(
        [
          new BABYLON.Vector3(-size, -4, i),
          new BABYLON.Vector3(size, -4, i),
        ]);

      myLines.push(
        [
          new BABYLON.Vector3(i, -4, -size),
          new BABYLON.Vector3(i, -4, size),
        ]);
    }

    const linesy = BABYLON.MeshBuilder.CreateLineSystem('floor', {
      lines: myLines,
      updatable: false,
    }, scene);

    return linesy;
  };

  const createObstacle = function (material) {
    const mesh = BABYLON.MeshBuilder.CreateBox('BOX',
      { height: 5, width: 8, depth: 8 }, scene);
    mesh.material = material;

    //translations
    mesh.translate(BABYLON.Axis.Y, -4 + 2.5, BABYLON.Space.WORLD);

    return mesh;
  };

  const grid = createGrid();
  const obstacle1 = createObstacle();
};
