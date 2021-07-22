const UTILITY = {};

//remove the specified element from an array
UTILITY.removeItem = function (element, array, callback) {
  const index = array.indexOf(element);
  if (index != -1) {
    array.splice(index, 1);
    if (callback != null) callback();
  }
};

//add an unique elemet to a array
UTILITY.addUnique = function (element, array, callback) {

  if (array.indexOf(element) == -1) {
    array.push(element);
    if (callback != null) callback();
  }
};

//swap the keys and values of an object
UTILITY.invertObject = function (obj) {
  const newObj = {};

  for (let prop in obj) {
    if (obj.hasOwnProperty(prop))
      newObj[obj[prop]] = prop;
  }

  return newObj;
};

//call each function in an array of functions
UTILITY.runArray = function(array, ...rest) {
  for (let i = 0; i < array.length; i++)
    array[i](...rest);
};

//INPUTMANAGER
const InputManager = function () {
  const _this = this;

  this.keys = {
    keysForward: {control: 87, isDown: false, onDown: [], onUp: [], },
    keysBackward: {control: 83, isDown: false, onDown: [], onUp: [], },
    keysLeft: {control: 65, isDown: false, onDown: [], onUp: [], },
    keysRight: {control: 68, isDown: false, onDown: [], onUp: [], },
    keysUp: {control: 32, isDown: false, onDown: [], onUp: [], },
    keysDown: {control: 16, isDown: false, onDown: [], onUp: [], },
    keysReload: {control: 82, isDown: false, onDown: [], onUp: [], },
    test1: {control: 73, isDown: false, onDown: [], onUp: [], }, //i
    test2: {control: 79, isDown: false, onDown: [], onUp: [], }, //o
    test3: {control: 80, isDown: false, onDown: [], onUp: [], }, //p
    mouseShoot: {control: 'LCLICK', isDown: false, onDown: [], onUp: [], },
    mouseAim: {control: 'RCLICK', isDown: false, onDown: [], onUp: [], },
    mouseScroll: {control: 'WHEEL', onDown: [], onUp: [], },
    mouseMove: {control: 'MOVE', onDown: [], },
  };

  this.keysEnabled = true;
  this.keysMap = this.resetKeyMap();

  //init
  this.attachKeyboardControl();
  this.attachMouseControl();
};

//setup
InputManager.prototype.resetKeyMap = function () {
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

InputManager.prototype.attachKeyboardControl = function () {
  const _this = this;

  this.onKeyDown = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    const keyName = _this.getKeyName(key);

    if (keyName != null) {
      if (_this.keys[keyName].isDown) return;
      _this.runKeyScripts(keyName, 'onDown');
      _this.keys[keyName].isDown = true;
      _this.onKeyEvent(keyName, true);
    }

  };

  this.onKeyUp = function (e) {
    const key = e.keyCode ? e.keyCode : e.which;
    const keyName = _this.getKeyName(key);

    if (keyName != null) {
      _this.runKeyScripts(keyName, 'onUp');
      _this.keys[keyName].isDown = false;
      _this.onKeyEvent(keyName, false);
    }

  };

  window.addEventListener('keydown', this.onKeyDown);
  window.addEventListener('keyup', this.onKeyUp);
};

InputManager.prototype.attachMouseControl = function () {
  const _this = this;

  this.onMouseDown = function (e) {
    const key = (e.button == 0 ? 'LCLICK' : (e.button == 2 ? 'RCLICK' : null)); //custom
    const keyName = _this.getKeyName(key);

    if (keyName != null) {
      if (_this.keys[keyName].isDown) return;
      _this.runKeyScripts(keyName, 'onDown');
      _this.keys[keyName].isDown = true;
      _this.onKeyEvent(keyName, true);
    }

  };

  this.onMouseUp = function (e) {
    const key = (e.button == 0 ? 'LCLICK' : (e.button == 2 ? 'RCLICK' : null)); //custom
    const keyName = _this.getKeyName(key);

    if (keyName != null) {
      _this.runKeyScripts(keyName, 'onUp');
      _this.keys[keyName].isDown = false;
      _this.onKeyEvent(keyName, false);
    }

  };

  this.onWheelMove = function (e) {
    //operates like button
    const key = 'WHEEL';
    const keyName = _this.getKeyName(key);
    const direction = (e.deltaY > 0 ? 'onDown' : 'onUp');

    _this.runKeyScripts(keyName, direction);
    _this.onKeyEvent(keyName, direction == 'onDown' ? true : false);
  };

  this.onMouseMove = function (e) {
    const key = 'MOVE';
    const keyName = _this.getKeyName(key);
    _this.runKeyScripts(keyName, 'onDown');
    //if (_this.moveEvent) _this.onKeyEvent('mouseMove', _this.moveEvent());
  };

  window.addEventListener('mousedown', this.onMouseDown);
  window.addEventListener('mouseup', this.onMouseUp);
  window.addEventListener('wheel', this.onWheelMove);
  window.addEventListener('mousemove', this.onMouseMove);
};

//internal utility
InputManager.prototype.getKeyName = function (control) {
  const keyName = this.keysMap.controlName[control];
  return keyName; //null if not found
};

InputManager.prototype.runKeyScripts = function (keyName, type) {
  //if (this._keysControls[keyName] == null) return; //throws undefined error if keyName not found
  if (!this.keysEnabled) return;

  if (type == 1 || type == 'onDown')
    UTILITY.runArray(this.keys[keyName].onDown);
  else if (type == 2 || type == 'onUp')
    UTILITY.runArray(this.keys[keyName].onUp);
};

InputManager.prototype.setKeyEvent = function (funct) {
  this.keyEvent = funct;
};

InputManager.prototype.addKeyEventInfo = function (keyName, infoFunct) {
  //info funct should return [name, value];

  if (!(this.keys[keyName]._otherInfo instanceof Array)) {
    this.keys[keyName]._otherInfo = [];
  }

  this.keys[keyName]._otherInfo.push(infoFunct);

};

InputManager.prototype.onKeyEvent = function (keyName, isDown) {

  const array = [];
  const otherInfo = this.keys[keyName]._otherInfo;
  if (otherInfo instanceof Array)
    for (const info of otherInfo)
      array.push(info());

  if (this.keyEvent) this.keyEvent([keyName, isDown], ...array);
  //console.log([keyName, isDown], ...array);
};

//user controlled functions
InputManager.prototype.add = function (keyName, funct, type) {
  //if (this._keysControls[keyName] == null) return; //throws undefined error if keyname not found

  if (type == 1 || type == 'onDown')
    UTILITY.addUnique(funct, this.keys[keyName].onDown);
  else if (type == 2 || type == 'onUp')
    UTILITY.addUnique(funct, this.keys[keyName].onUp);

};

InputManager.prototype.addOnce = function (keyName, funct, type) {
  let newFunct = function () {
    funct();
    this.delete(keyName, newFunct, type);
  };

  this.add(keyName, newFunct, type);

};

InputManager.prototype.delete = function (keyName, funct, type) {
  if (type == 1 || type == 'onDown')
    UTILITY.removeItem(funct, this.keys[keyName].onDown);
  else if (type == 2 || type == 'onUp' || type == null)
    UTILITY.removeItem(funct, this.keys[keyName].onUp);
};

InputManager.prototype.isDown = function (keyName) {
  return this.keys[keyName].isDown;

  //returns false if not down or key is null
};

const INPUTMANAGER = new InputManager();

//EVENTMANAGER
const EVENTMANAGER = {};
EVENTMANAGER.events = {
    onGameResume: [() => console.log('resumed')],
    onGamePause: [() => console.log('paused')],
};
EVENTMANAGER.add = function (event, funct, once) {
  return this.events[event] == null ? console.log('event not found', event) : this.events[event].push(funct);
};
EVENTMANAGER.addOnce = function (event, funct) {
  const _this = this;
  let newFunct = function () {
    funct();
    _this.deleteCallback(event, newFunct);
  };

  this.add(event, newFunct);
  return;

};
EVENTMANAGER.delete = function (event, funct) {
  UTILITY.removeItem(funct, this.events[event]);
};
EVENTMANAGER.runEvent = function (event, ...args) {
  if (this.events[event] == null)
    console.error('event not found', event);
  else
    for (let i = 0; i < this.events[event].length; i++)
      this.events[event][i](...args);
};
