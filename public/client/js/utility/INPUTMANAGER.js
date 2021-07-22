const _InputManager = function () {
  this.keys = {
    keysForward: {control: 87, isDown: false, onDown: [], onUp: [], },
    keysBackward: {control: 83, isDown: false, onDown: [], onUp: [], },
    keysLeft: {control: 65, isDown: false, onDown: [], onUp: [], },
    keysRight: {control: 68, isDown: false, onDown: [], onUp: [], },
    keysUp: {control: 32, isDown: false, onDown: [], onUp: [], },
    keysDown: {control: 88, isDown: false, onDown: [], onUp: [], },
    keysRun: {control: 16, isDown: false, onDown: [], onUp: [], },
    keysCrouch: {control: 67, isDown: false, onDown: [], onUp: [], },
    test1: {control: 73, isDown: false, onDown: [], onUp: [], }, //i
    test2: {control: 79, isDown: false, onDown: [], onUp: [], }, //o
    test3: {control: 80, isDown: false, onDown: [], onUp: [], }, //p
    mouseShoot: {control: 'LCLICK', isDown: false, onDown: [], onUp: [], },
    mouseAim: {control: 'RCLICK', isDown: false, onDown: [], onUp: [], },
    mouseScroll: {control: 'WHEEL', onDown: [], onUp: [], },
  };

  this.keysEnabled = true;
  this.keysMap = this.resetKeyMap();

  //init
  this.attachKeyboardControl();
  this.attachMouseControl();
};

//setup
_InputManager.prototype.resetKeyMap = function () {
  const _this = this;

  function createNameControl() {
    let obj = {};

    for (let prop in _this.keys) {
      obj[prop] = _this.keys[prop].control;
    }

    return obj;
  }

  let obj = {};

  obj.nameControl = createNameControl();
  obj.controlName = UTILITY.invertObject(createNameControl());

  return obj;
};

_InputManager.prototype.attachKeyboardControl = function () {
  const _this = this;

  this.onKeyDown = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    const keyName = _this.getKeyName(key);

    if (keyName) {
      if (_this.keys[keyName].isDown) return;
      _this.runKeyScripts(keyName, 'onDown');
      _this.keys[keyName].isDown = true;
    }

  };

  this.onKeyUp = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    const keyName = _this.getKeyName(key);

    if (keyName) {
      _this.runKeyScripts(keyName, 'onUp');
      _this.keys[keyName].isDown = false;
    }

  };

  window.addEventListener('keydown', this.onKeyDown);
  window.addEventListener('keyup', this.onKeyUp);
};

_InputManager.prototype.attachMouseControl = function () {
  const _this = this;

  this.onMouseDown = function (e) {
    //custom control naming
    const key = (e.button == 0 ? 'LCLICK' : (e.button == 2 ? 'RCLICK' : null));
    const keyName = _this.getKeyName(key);

    if (keyName) {
      if (_this.keys[keyName].isDown) return;
      _this.runKeyScripts(keyName, 'onDown');
      _this.keys[keyName].isDown = true;
    }

  };

  this.onMouseUp = function (e) {
    //custom key naming
    const key = (e.button == 0 ? 'LCLICK' : (e.button == 2 ? 'RCLICK' : null));
    const keyName = _this.getKeyName(key);

    if (keyName) {
      _this.runKeyScripts(keyName, 'onUp');
      _this.keys[keyName].isDown = false;
    }

  };

  this.onWheelMove = function (e) {
    //operates like button only
    const key = 'WHEEL';
    const keyName = _this.getKeyName(key);
    const direction = (e.deltaY > 0 ? 'onDown' : 'onUp');

    _this.runKeyScripts(keyName, direction);
  };

  window.addEventListener('mousedown', this.onMouseDown);
  window.addEventListener('mouseup', this.onMouseUp);
  window.addEventListener('wheel', this.onWheelMove);
};

//internal utility
_InputManager.prototype.getKeyName = function (control) {
  const keyName = this.keysMap.controlName[control];
  return keyName; //null if not found
};

_InputManager.prototype.runKeyScripts = function (keyName, type) {
  //if (this._keysControls[keyName] == null) return; //throws undefined error if keyName not found
  if (!this.keysEnabled) return;

  if (type == 1 || type == 'onDown')
    UTILITY.runArray(this.keys[keyName].onDown);
  else if (type == 2 || type == 'onUp')
    UTILITY.runArray(this.keys[keyName].onUp);
};

//user controlled functions
_InputManager.prototype.add = function (keyName, funct, type) {
  //if (this._keysControls[keyName] == null) return; //throws undefined error if keyname not found

  if (type == 1 || type == 'onDown')
    UTILITY.addUnique(funct, this.keys[keyName].onDown);
  else if (type == 2 || type == 'onUp')
    UTILITY.addUnique(funct, this.keys[keyName].onUp);

};

_InputManager.prototype.addOnce = function (keyName, funct, type) {
  let newFunct = function () {
    funct();
    this.delete(keyName, newFunct, type);
  };

  this.add(keyName, newFunct, type);

};

_InputManager.prototype.delete = function (keyName, funct, type) {
  if (type == 1 || type == 'onDown')
    UTILITY.removeItem(funct, this.keys[keyName].onDown);
  else if (type == 2 || type == 'onUp')
    UTILITY.removeItem(funct, this.keys[keyName].onUp);
};

_InputManager.prototype.isDown = function (keyName) {
  return this.keys[keyName].isDown;

  //returns false if not down or key is null
};

const INPUTMANAGER = new _InputManager();
