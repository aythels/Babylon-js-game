//https://forum.babylonjs.com/t/zombieswithguns-io-https-zombieswithguns-io/3700/38
//http://www.html5gamedevs.com/topic/19895-babylonjs-multiplayer-code/page/2/
//https://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
//https://gafferongames.com/post/deterministic_lockstep/
//https://github.com/Jerenaux/binary-protocol-example/blob/master/js/codec.js

const Connection = function () {
  const _this = this;

  this.shouldStop = false;
  function initWebSocket() {
    const heading = location.protocol == 'https:' ? 'wss://' : 'ws://';
    const parentDir = location.host;
    const ws = new WebSocket(heading + parentDir);

    ws.onopen = (event) => {
      //console.log('Connected to server.');
      _this.isConnected = true;
    };

    ws.onclose = () => {
      //console.log('Disconnected from server.');
      _this.isConnected = false;
    };

    ws.onmessage = (event) => {
      if (_this.shouldStop) return;

      if (!_this.noArray) _this.noArray = [];

      var sum = 0;
      const elmt = _this.noArray;
        for( var i = 0; i < elmt.length; i++ ){
            sum += parseInt( elmt[i], 10 ); //don't forget to add the base
        }

      var avg = sum/elmt.length;
      //console.log(avg);

      const total = Date.now() - _this.lastdate;
      if (total) _this.noArray.push(total);
      _this.lastdate = Date.now();


      let data = event.data;
      data = _this.uncompressData(data);
      UTILITY.runArray(_this.onMessage, data);
    };

    return ws;
  }

  this.ws = initWebSocket();
  this.isConnected = false;
  this.clientID = null;

  this.onMessage = [/*() => SYNCER.onServerUpdate()*/];
  this.sendMessage = function (data) {
    if (!this.isConnected) return;
    this.ws.send(this.compressData(data));
  };

};

Connection.prototype.uncompressData = function (data) {
  return JSON.parse(data);
};

Connection.prototype.compressData = function (data) {
  return JSON.stringify(data);
};

const CONNECTION = new Connection();

INPUTMANAGER.setKeyEvent((...args) => {
  //console.log(...args);
  CONNECTION.sendMessage([...args]);
});

//need to add input message commands
  //new way of removing users
  //server sided check for differences in data, send only these differences







  const TimeSyncer = function() {
    const _this = this;
    const SERVER_STEP_MS = 100;
  	let expectedTime;
  	let integrator = 0;
  	let totalDrift = 0;

    function clamp(num, min, max) {
      return num <= min ? min : num >= max ? max : num;
    }

  	this.onServerUpdate = function () {
      if (!_this.started) {
        expectedTime = Date.now() + SERVER_STEP_MS;
        _this.started = true;
        return;
      }

  		const timeDifference = expectedTime - this.getNow();

  		integrator = integrator * 0.92 + timeDifference; //difference in miliseconds as accumulated by previous value
  		const adjustment = clamp(integrator * 0.05, -3, 3); //0.05 == scale of change //server tick time has a max +- 3 uncertainty

      console.log(timeDifference);

      totalDrift += adjustment;
  		expectedTime += SERVER_STEP_MS;

      //console.log(timeDifference);
  	}

  	this.getNow = function () {
  		return Date.now() + totalDrift;
  	}

  };

//let SYNCER = new TimeSyncer();
















/*
const GameLoop = function () {
  //list of entities that need to be disposed and can be searched by id
  this.dynamicEntities = new Map();

  //list of entity ids that need to be disposed (we don't care about its information anymore hence only ids)
  this.dynamicEntitiesDisposeIDs = [];

  //list of present entities that will dispose themselves
  this.staticEntities = [];

  //what if not moving?
  function processDynamicEntities (packet) {
    const oldIDs = [...this.dynamicEntities.keys()];

    const updatedMap = new Map();
    const array = packet.dynamicEntities;
    for (let i = 0; i < array.length; i++) {
      const id = array[i].id;
      const info = array[i];

      updatedMap.set(id, info);
    }

    //if new map does not contain old id, set the id to be disposed
    for (let id in oldIDs) {
      if (!updatedMap.has(id)) this.dynamicEntitiesDisposeIDs.push(id);
    }

    //update the current map with new packet information
    this.dynamicEntities = updatedMap;
  }

  function processStaticEntities (packet) {
    const array = packet.staticEntities;

    for (let i = 0; i < array.length; i++) {
        this.staticEntities.push(array[i]);
    }
  }

  this.onTick = function() {

    for (let key of this.dynamicEntities.keys()) {
      const id = key;
      const info = this.dynamicEntities.get(key);

      let mesh = scene.getMeshByID(id);
      if (!mesh) {
        mesh = BABYLON.MeshBuilder.CreateSphere('', { diameter: 2, }, scene);
        mesh.id = id;
      }

      //update mesh information
    }

    //dispose entities set out for disposal
    this.disposeDynamicEntities();
  };

  this.disposeDynamicEntities = function () {
    for (let i = 0; i < this.dynamicEntitiesDisposeIDs.length; i++) {
      const id = this.dynamicEntitiesDisposeIDs[i];
      this.disposeDynamicByID(id);
    }
  };

  this.disposeDynamicByID = function (id) {

    //dispose all assets, client entities related to id
    const array = scene.getMeshesByID(id);
    for (let i = 0; i < array.length; i++) {
      array[i].dispose();
    }

    UTILITY.removeItem(id, this.dynamicEntitiesDisposeIDs);
  };

};
*/
//const GAMELOOP = new GameLoop();







/*

//example packet
{
  dynamicEntities: [
      {
        class: string,
        id: string,
        position: vector3,
        orientation: vector3,
        enemy: boolean,
        health: integer,
      }
    ]
  staticEntities: [
    {
      class: string,
      origin: Vector3,
      directionL Vector3,
    }
  ]
}

*/
