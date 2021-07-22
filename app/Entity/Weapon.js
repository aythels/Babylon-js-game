const path = require('path');
const BABYLON = require('babylonjs');
const UTILITY = require(path.join(path.dirname(require.main.filename), 'app', 'Tools', 'Utility.js'));

const Entity = require(path.join(path.dirname(require.main.filename), 'app', 'Entity', 'Entity.js'));

class Gun extends Entity {
  constructor(id) {

    this.currMagSize = 30;
    this.isReloading = false;
    this.shootTick = 0;
    this.reloadTick = 0;

    super(id);
 }

}

function shootRay () {
  const origin = _this.playerMesh.head.absolutePosition;
  const direction = cameraManager.getCameraForwardVec();
  const length = 100;

  const ray = new BABYLON.Ray(origin, direction, length);

  const hit = scene.pickWithRay(ray);

  if (hit.pickedMesh) {
    const hitMesh = hit.pickedMesh;
    const hitVector = hit.pickedPoint;
    const hitNormal = hit.getNormal(true); //world coordinates
    spawnProjectileTrail(hitVector, origin);
    spawnProjectileDecal(hitMesh, hitVector, hitNormal);
  }

}

function spawnProjectileTrail(hitVector, origin) {
  //https://doc.babylonjs.com/how_to/how_to_use_trailmesh#examples
  //mesh1.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

  const length = BABYLON.Vector3.Distance(hitVector, origin);
  const mesh = BABYLON.MeshBuilder.CreateBox('trail', { size: 0.05, width: length }, scene);

  const axis1 = hitVector.subtract(origin);
  const axis3 = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), axis1);
  const axis2 = BABYLON.Vector3.Cross(axis3, axis1); //tangent

  mesh.rotation = BABYLON.Vector3.RotationFromAxis(axis1, axis2, axis3);
  mesh.position = hitVector;
  mesh.locallyTranslate(new BABYLON.Vector3(-length / 2, 0, 0));

  mesh.isPickable = false;
  mesh.visibility = 0.2;

  setTimeout(() => {
      fadeOutMesh(mesh);
      thinOutMesh(mesh);
    }, 300);

  return mesh;
}

function spawnProjectileDecal(hitMesh, hitVector, hitNormal) {
  ////material
  const rotation = Math.random() * 2 * 3.14;
  const size = new BABYLON.Vector3(0.2, 0.2, 0.2);

  const decal = BABYLON.MeshBuilder.CreateDecal(
    'decal', hitMesh,
    { position: hitVector,
      normal: hitNormal,
      angle: rotation,
      size: size, }
    );

  const material = new BABYLON.StandardMaterial('bulletImpact', scene);
  material.diffuseColor = new BABYLON.Color3(160 / 255, 82 / 255, 255 / 255);
  material.zOffset = -2; //IMPORTANT

  decal.material = material;

  //material.dispose();

  setTimeout(() => {
      fadeOutMesh(decal);
    }, 1000);

  return decal;
}

function fadeOutMesh(mesh) {
  const speed = 30;

  const animation = BABYLON.Animation.CreateAndStartAnimation(
    'fade', mesh, 'visibility', 30, speed, mesh.visibility, 0.0,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  animation.onAnimationEnd = () => mesh.dispose();
}

function thinOutMesh(mesh) {
  const speed = 10;
  const newScale = new BABYLON.Vector3(mesh.scaling.x, 0, 0);

  const animation = BABYLON.Animation.CreateAndStartAnimation(
    'scale', mesh, 'scaling', 30, speed, mesh.scaling, newScale,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );

  animation.onAnimationEnd = () => mesh.dispose();
}

Gun.prototype.maxMagSize = 30;
Gun.prototype.shootDelay = 10;
Gun.prototype.reloadDelay = 50;

Gun.prototype.canShoot = function () {
  if (this.currMagSize > 0 && this.isReloading == false && this.shootTick == 0) return true;
  else return false;
};
Gun.prototype.shoot = function () {
  if (this.canShoot()) {
    this.currMagSize--;
    this.shootTick = this.shootDelay;
  }
};
Gun.prototype.canReload = function () {
  if (this.currMagSize != this.maxMagSize && this.isReloading == false) return true;
  else return false;
};
Gun.prototype.reload = function () {
  if (this.canReload()) {
    this.isReloading = true;
    this.reloadTick = this.reloadDelay;
  }
};

Gun.prototype.onUpdate = function () {
  if (this.shootTick > 0) this.shootTick--;
  if (this.reloadTick > 0) this.reloadTick--;
  if (this.isReloading && this.reloadTick == 0) {
    this.currMagSize = this.maxMagSize;
    this.isReloading = false;
  }
};

Gun.prototype.processPackage = function() {
    if (this._f < 1) this._f++;
};
Gun.prototype.keyAim = function() {
    if (this._f < 1) this._f++;
};
Gun.prototype.keyShoot = function() {
    if (this._f < 1) this._f++;
};
Gun.prototype.keyReload = function() {
    if (this._f < 1) this._f++;
};
