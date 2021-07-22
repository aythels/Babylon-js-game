function _PointerLock(canvas, lockFunct, unlockFunct) {
  let pointerLockOn = false;
  if (!lockFunct) lockFunct = () => {};
  if (!unlockFunct) unlockFunct = () => {};

  function pointerlockchange(event) {
    if (document.pointerLockElement == canvas ||
      document.requestPointerLock == canvas ||
      document.msRequestPointerLock == canvas ||
      document.mozRequestPointerLock == canvas ||
      document.webkitRequestPointerLock == canvas) {
      if (!pointerLockOn) {
        lockFunct();
        pointerLockOn = true; //locked or resume
      }
    } else {
      unlockFunct();
      pointerLockOn = false; //unlocked or pause
    }
  }

  document.addEventListener('pointerlockchange', pointerlockchange);
  document.addEventListener('mspointerlockchange', pointerlockchange);
  document.addEventListener('mozpointerlockchange', pointerlockchange);
  document.addEventListener('webkitpointerlockchange', pointerlockchange);
  document.addEventListener('click', () => {
    canvas.requestPointerLock =
      canvas.requestPointerLock ||
      canvas.msRequestPointerLock ||
      canvas.mozRequestPointerLock ||
      canvas.webkitRequestPointerLock;
    canvas.requestPointerLock();
  });

}
