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

  //setup
  function initScene(){
    const engine = new BABYLON.NullEngine({
      deterministicLockstep: true,
      lockstepMaxSteps: 4
    });
    const scene = new BABYLON.Scene(engine);
    scene.enablePhysics(null, new BABYLON.OimoJSPlugin(100, OIMO));  //100 iterations
    scene.getPhysicsEngine().getPhysicsPlugin().world.enableRandomizer = false;
    scene.getPhysicsEngine().setGravity(new BABYLON.Vector3(0, -15, 0));
    scene.getPhysicsEngine().setTimeStep(1/60);

    //this shit is redundant
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 100, BABYLON.Vector3.Zero(), scene);

    engine.runRenderLoop(() => {
      scene.render();
      //scene.getPhysicsEngine()._step();
    });

    return scene;
  }
  const scene = initScene();

  scene.onBeforeStepObservable.add((sce) => {
    const tick = sce.getStepId();

    //read and execute client input message
    for (let user of _this.connections.values()) {
      const id = user._id;
      if (!user.playerEntity) user.playerEntity = new ENTITY.PlayerEntity(id);

      if (user.inputPackage[0]) {
        user.playerEntity.processPackage(user.inputPackage[0]);
        user.latestProcessedTick = user.inputPackage[0].tick;
        user.inputPackage.shift();
      }
    }

    //Simulate server-controlled objects using simulation time from last full pass
    ENTITY.Entity.updateAll();

    //For each connected client, package up visible objects/world state and send to client
      /*Step Process:
        1. Get data from system
        2. Check if data is different enough to send
        3. Compress data
        4. Send data
      */
      if (tick % 2 == 0) {
        const data = ENTITY.Entity.getAllInfo();
        for (let user of _this.connections.values()) {
          data.push({_id: user._id, _tick: user.latestProcessedTick,});
          if (data) SERVER.emit(this.compress(data), user._ws);
        }
      }

  });

  ENTITY = new _ENTITY(scene);
  WORLD = new _WORLD(scene);

  //communication
  this.connections = new Map();

  SERVER.onConnect.push((ws) => {
    console.log('User connected.', ws.userID);
    this.addUser(ws);
  });

  let tempTimer = 0;

  SERVER.onMessage.push((ws, data) => {
    tempTimer++;
    //console.log(tempTimer);
    /*Step Process:
      1. Recieve data
      2. Uncompress data
      3. Check if data is valid
      4. Append data to system (creating new users if necessary)
    */

    //console.log('message recieved', ws.userID, data);
    this.appendUser(ws, data);
  });

  SERVER.onClose.push((ws) => {
    console.log('User disconnected.', ws.userID);
    this.deleteUser(ws);
  });
};

//connection methods
Game.prototype.addUser = function (ws) {
  const user = {
    inputPackage: [],
    latestProcessedTick: 0,
    _id: ws.userID,
    _ws: ws,
  };

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

Game.prototype.appendUser = function (ws, rawData) {
  data = this.uncompress(rawData);
  if (data) {
    const user = this.connections.get(ws);
    user.inputPackage.push(data);
    if (user.inputPackage.length > 5) user.inputPackage = [];
  }
};

Game.prototype.uncompress = function (rawData) {
  return JSON.parse(rawData);
};

Game.prototype.compress = function (data) {
  return JSON.stringify(data);
};

Game.prototype.isDataDifferent = function (data) {

};

module.exports = Game;
