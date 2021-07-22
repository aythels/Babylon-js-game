//EVENTMANAGER.add('onGamePause', () => cameraManager.removeControls());
//EVENTMANAGER.add('onGameResume', () => cameraManager.addControls());
//https://www.youtube.com/watch?v=nlcIz-czKyI
//https://www.youtube.com/watch?v=jm-a_bdY4uU

const _CameraManager = function (scene) {
const _this = this;

//camera properties
this.mouseSensitivity = 1000;
this.mouseInertia = 0.7;

//input controls
this.setCameraSensitivity = function(value) {
  if (value) this.mouseSensitivity = value;
  this.firstCamera.angularSensibility = this.mouseSensitivity;
  this.thirdCamera.angularSensibility = this.mouseSensitivity;
  return this.mouseSensitivity;
};

this.setCameraInertia = function(value) {
  if (value) this.mouseInertia = value;
  this.firstCamera.inertia = this.mouseInertia;
  this.thirdCamera.inertia = this.mouseInertia;
  return this.mouseInertia;
};

//utility
this.removeAllControls = function() {
  this.firstCamera.detachControl(scene.getEngine().getRenderingCanvas());
  this.thirdCamera.detachControl(scene.getEngine().getRenderingCanvas());
};

this.addLiveControls = function() {
  this.camera.attachControl(scene.getEngine().getRenderingCanvas());
  return this.camera;
};

this.setCameraOwner = function(firstObject, thirdObject) {
  this.firstCamera.parent = firstObject;
  this.thirdCamera.parent = thirdObject || firstObject;
  this.followCamera.lockedTarget = thirdObject || firstObject;
};

this.setCameraRotation = function(camera, yaw, pitch) {
  switch(camera) {
    case this.thirdCamera:
      if (yaw) this.thirdCamera.alpha = - Math.PI / 2 - yaw;
      if (pitch) this.thirdCamera.beta = Math.PI / 2 - pitch;
      break;
    case this.firstCamera:
      if (yaw) this.firstCamera.rotation.y = yaw;
      if (pitch) this.firstCamera.rotation.x = pitch;
      break;
    case this.followCamera:
      if (yaw) this.followCamera.rotationOffset = 180 + (yaw * 180 / Math.PI);
      //if (pitch) this.followCamera.heightOffset = this.followCamera.radius * Math.sin(pitch);
      break;
  }
};

this.setActiveCamera = function(camera, ignorePrevRotation) {
  if (!ignorePrevRotation) {
    const prevCamera = this.camera;
    const yaw = this.getCameraYaw();
    const pitch = this.getCameraPitch();
    this.setCameraRotation(camera, yaw, pitch);
  }

  this.camera = camera;

  this.removeAllControls();
  this.addLiveControls();

  scene.activeCamera = camera;
  return camera;
};

this.toggleActiveCamera = function() {
  //toggles between the first and third camera
  if (this.camera == this.firstCamera) return this.setActiveCamera(this.thirdCamera);
  if (this.camera == this.thirdCamera) return this.setActiveCamera(this.firstCamera);

};

this.activateFollowCamera = function(keepMode, funct) {
  if (this.camera == this.firstCamera || this.camera == this.followCamera) return;

  const radius = BABYLON.Vector3.Distance(this.thirdCamera.globalPosition, this.thirdCamera.parent.absolutePosition);

  this.followCamera.position = this.thirdCamera.globalPosition;
  this.followCamera.radius = radius / 3; //slow down speed

  const callBack = this.followCamera.onViewMatrixChangedObservable.add(() => {
    const dist = BABYLON.Vector3.Distance(this.followCamera.globalPosition, this.followCamera.lockedTarget.absolutePosition);

    if ((dist) < radius) {
      this.followCamera.radius = radius;
      if (funct) funct();
      if (!keepMode) setTimeout(() => _this.setActiveCamera(_this.thirdCamera), 50); //temp fix for flickering
      this.followCamera.onViewMatrixChangedObservable.removeCallback(callBack);
    }

  });

  return this.setActiveCamera(this.followCamera);
};

//animations
this.animationAimCamera = function () {
  if (this.camera == this.followCamera) return;
  const camera = this.camera;
  const fov = 0.65;

  let anim = BABYLON.Animation.CreateAndStartAnimation('',
    camera,
    'fov',
    30,
    3,
    camera.fov,
    fov,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

};

this.animationRetractCamera = function () {
  if (this.camera == this.followCamera) return;
  const camera = this.camera;
  const base = 0.8;

  let anim = BABYLON.Animation.CreateAndStartAnimation('',
    camera,
    'fov',
    30,
    3,
    camera.fov,
    base,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
};

//game utility
this.getCameraRightVec = function() {
  if (_this.camera) return BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), _this.getCameraForwardVec());
};

this.getCameraForwardVec = function() {
  if (_this.camera) return _this.camera.getForwardRay(1).direction;
};

this.getCameraAbsoluteYaw = function() {
  const v1 = this.getCameraForwardVec();
  v1.y = 0;
  const v2 = new BABYLON.Vector3(0, 0, 1);
  return BABYLON.Vector3.GetAngleBetweenVectors(v2, v1, BABYLON.Axis.Y);
};

this.getCameraYaw = function(degrees, normalize) {
  let rotation = 0;

  switch(this.camera) {
    case this.thirdCamera:
      rotation = - Math.PI / 2 - this.thirdCamera.alpha;
      break;
    case this.firstCamera:
      rotation = this.firstCamera.rotation.y;
      break;
    case this.followCamera:
      rotation = this.followCamera.rotation.y;
      break;
    default:
      rotation = 0;
  }

  if (!normalize) {
    let orient = rotation % (2 * Math.PI);
    if (orient >= Math.PI) orient -= 2 * Math.PI;
    if (orient <= -Math.PI) orient += 2 * Math.PI;
    rotation = orient;
  }

  if (degrees) return rotation * 180 / Math.PI;
  return rotation;
};

this.getCameraPitch = function(degrees) {
  let rotation = 0;

  switch(this.camera) {
    case this.thirdCamera:
      rotation = Math.PI / 2 - this.thirdCamera.beta;
      break;
    case this.firstCamera:
      rotation = this.firstCamera.rotation.x;
      break;
    case this.followCamera:
      rotation = this.followCamera.rotation.x;
      break;
    default:
      rotation = 0;
  }

  if (degrees) return rotation * 180 / Math.PI;
  return rotation;
};

//cameras
this.firstCamera = (function () {
  const camera = new BABYLON.UniversalCamera('first', new BABYLON.Vector3(0, 0, 0), scene);

  camera.angularSensibility = _this.mouseSensitivity;
  camera.inertia = _this.mouseInertia;

  camera.inputs.clear();
  camera.inputs.addMouse();

  return camera;
})();

this.thirdCamera = (function () {
  const radius = 4;
  const camera = new BABYLON.ArcRotateCamera('third', - Math.PI / 2, Math.PI / 2, radius, new BABYLON.Vector3(0, 0, 0), scene);

  camera.angularSensibility = _this.mouseSensitivity;
  camera.inertia = _this.mouseInertia;

  camera.inputs.clear();
  camera.inputs.addPointers();
  camera.panningSensibility = 0; //removes ctrl use

  //camera.upperBetaLimit = Math.PI - 0.2; //prevent directly looking upwards from

  camera.onViewMatrixChangedObservable.add(() => {
    //console.log(camera.beta); //0 = looking downwards from head, 3.14 = looking upwards from feet

    //math for adjusting camera position in an eclipse
    if (camera.beta <= Math.PI / 2) camera.radius = radius;
    else if (camera.beta > Math.PI / 2) {

      //camera.radius = radius - (camera.beta - Math.PI / 2); //linear rig
      //camera.radius = radius * (Math.sin(camera.beta)) //rig with no offset, y = 0 at 0 degrees

      const yOffset = 2; //distance from head to floor
      const radiusOffset = (yOffset - yOffset * Math.sin(camera.beta));
      camera.radius = radius * (Math.sin(camera.beta)) + radiusOffset;

      //console.log(4 * Math.sin(camera.beta)); // horizontal distance
      //console.log(4 * Math.cos(camera.beta)); //vertical distance

      //more info
      //https://www.desmos.com/calculator/n8kwtwfrce
      //http://www.mathopenref.com/coordparamellipse.html

    }
  });

  return camera;
})();

this.followCamera = (function () {
  const camera = new BABYLON.FollowCamera('follow', new BABYLON.Vector3(0, 0, 0), scene);

  //camera.radius = 1;

  //camera.upperHeightOffsetLimit = 0;
  camera.rotationOffset = 180; //yaw offset
  camera.heightOffset = 0; // The goal height of camera above local origin (centre) of target

  camera.cameraAcceleration = 0.02;
  camera.maxCameraSpeed = 10;

  camera.inputs.clear();

  return camera;
})();

this.camera = null;
this.setActiveCamera(this.thirdCamera);
//console.log();

};
