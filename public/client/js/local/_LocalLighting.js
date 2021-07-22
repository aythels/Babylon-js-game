const _LocalLighting = function (scene) {
  const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
  const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 1, -1), scene);
};
