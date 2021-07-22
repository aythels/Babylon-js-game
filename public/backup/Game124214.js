//wss vs ws upgade
//https://www.giacomovacca.com/2015/02/websockets-over-nodejs-from-plain-to.html

//security
//http://simplyautomationized.blogspot.com/2015/09/5-ways-to-secure-websocket-rpi.html
//https://stackoverflow.com/questions/4361173/http-headers-in-websockets-client-api
//https://devcenter.heroku.com/articles/websocket-security
//https://www.freecodecamp.org/news/how-to-secure-your-websocket-connections-d0be0996c556/

//good practices
//https://www.gamedev.net/forums/topic/608702-best-practices-for-sending-and-receiving-game-state/
//https://www.gamasutra.com/view/feature/130587/designing_secure_flexible_and_.php
//http://fabiensanglard.net/quake3/network.php
//https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking

//determining project root
//https://stackoverflow.com/questions/10265798/determine-project-root-from-a-running-node-js-application

const BABYLON = require('babylonjs');
const OIMO = require("oimo");
const path = require('path'); //working with file paths
const NanoTimer = require('nanotimer');
const NANOTIMER = new NanoTimer();

const _ENTITY = require(path.join(path.dirname(require.main.filename), 'app', 'Entity', '.main.js'));
const _WORLD = require(path.join(path.dirname(require.main.filename), 'app', 'World', 'World.js'));

let ENTITY;
let WORLD;

const Game = function (SERVER) {
  const _this = this;

  this.SERVER = SERVER;

  //setup
  function initScene(){
    const engine = new BABYLON.NullEngine();
    const scene = new BABYLON.Scene(engine);
    scene.enablePhysics(new BABYLON.Vector3(0, -15, 0), new BABYLON.OimoJSPlugin(100, OIMO));
    scene.getPhysicsEngine().getPhysicsPlugin().world.enableRandomizer = false;
    scene.getPhysicsEngine()._physicsPlugin.world.postLoop = () => {
      for (let user of _this.connections.values()) {
        _this.forEachUserLoop(user);
      }
      _this.physicsLoop();
    };
    engine.runRenderLoop(() => {
      scene.getPhysicsEngine()._step();
    });

    return scene;
  }
  this.scene = initScene();

  ENTITY = new _ENTITY(this.scene);
  WORLD = new _WORLD(this.scene);

  //communication
  this.connections = new Map();

  SERVER.onConnect.push((ws) => {
    console.log('User connected.', ws.userID);
    this.addUser(ws);
  });

  SERVER.onMessage.push((ws, data) => {
    /*Step Process:
      1. Recieve data
      2. Uncompress data
      3. Check if data is valid
      4. Append data to system (creating new users if necessary)
    */

    //console.log('message recieved', ws.userID, data);
    const user = this.connections.get(ws);
    this.appendUserData(user, data);
  });

  SERVER.onClose.push((ws) => {
    console.log('User disconnected.', ws.userID);
    this.deleteUser(ws);
  });

  //broadcasting settings
  const fps = 20; //ticks per second
  const fpsInterval = 1000 / fps; //miliseconds between frames
  NANOTIMER.setInterval(() => this.broadcastLoop(), '', fpsInterval + 'm');

};

//input utility
Game.prototype.addUser = function (ws) {
  //keys starting with _ are non-changeable data;

  let user = {
    keysForward: false,
    keysBackward: false,
    keysLeft: false,
    keysRight: false,
    keysUp: false,
    keysDown: false,
    keysReload: false,
    mouseShoot: false,
    mouseAim: false,
    mouseScroll: false,
    cameraDir: null,
    mouseMove: null,
    _connectionLevel: 0,
    _id: ws.userID,
  };

  //add user reference
  this.connections.set(ws, user);
};

Game.prototype.deleteUser = function (ws) {
  //dispose all assets associated with user
  const user = this.connections.get(ws);
  Object.keys(user).forEach((key) => {
    if (user[key])
      if (user[key].dispose) user[key].dispose();
  });

  //delete user reference
  this.connections.delete(ws);
};

Game.prototype.uncompressData = function (data) {
  return JSON.parse(data);
};

Game.prototype.isDataValid = function (data) {
  if (!(data instanceof Array)) return false; //data is not in array format

  for (let i = 0; i < data.length; i++) {
    const strand = data[i]; //[key, value]

    if (!(strand instanceof Array)) return false; //data components are not in array format

    const key = strand[0]; //key
    const value = strand[1]; //value

    if(key.includes('_')) return false; //data addresses an unchangeable property

  }

  return true;
};

Game.prototype.appendUserData = function (user, data) {
  data = this.uncompressData(data); //uncompressing
  if (!this.isDataValid(data)) return;  //validating

  //[[key, value], [key, value]]
  for (let i = 0; i < data.length; i++) {
    const strand = data[i]; //[key, value]

    const key = strand[0]; //key
    const value = strand[1]; //value

    if (user.hasOwnProperty(key)) user[key] = value;
  }
};

//output utility

Game.prototype.compressData = function (data) {
  return JSON.stringify(data);
};

Game.prototype.isDataDifferent = function (data) {

};

//game
Game.prototype.forEachUserLoop = function (user) {
  const id = user._id;
  if (!user.playerEntity) user.playerEntity = new ENTITY.PlayerEntity(id); //mapping method for fast searches

  if (user.keysUp) {
    //user.keysUp = false;
    user.playerEntity.keyJump();
  }

  if (user.keysForward) user.playerEntity.keyForward();
  if (user.keysBackward) user.playerEntity.keyBackward();
  if (user.keysRight) user.playerEntity.keyRight();
  if (user.keysLeft) user.playerEntity.keyLeft();

  //console.log(user.playerEntity._f, user.playerEntity._r);

  if (user.mouseMove) {
    //console.log('updating move dir', user.mouseMove);
    const vector = {
      x: user.mouseMove.x,
      y: user.mouseMove.y,
      z: user.mouseMove.z,
    };
    user.playerEntity.mouseMove(vector);
  }



  //console.log(user.playerEntity.f, user.playerEntity.r);

  //console.log(user.playerEntity.mesh.position);
};

Game.prototype.physicsLoop = function () {
  //console.log('ticking');
  ENTITY.Entity.updateAll();
};

Game.prototype.broadcastLoop = function () {
  /*Step Process:
    1. Get data from system
    2. Check if data is different enough to send
    3. Compress data
    4. Send data
  */

  //console.log('broadcasting');

  let data = ENTITY.Entity.getAllInfo();
  if (data) {
    data.push(Date.now());
    this.SERVER.broadcastAll(this.compressData(data));
  }
};

module.exports = Game;
