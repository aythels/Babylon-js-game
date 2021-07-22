//http://www.html5gamedevs.com/topic/19895-babylonjs-multiplayer-code/page/2/
//https://gafferongames.com/post/deterministic_lockstep/
//https://forum.babylonjs.com/t/zombieswithguns-io-https-zombieswithguns-io/3700/38

const _Connection = function () {
  const _this = this;
  this.isConnected = false;
  this.pauseMsg = true;

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
      if (_this.pauseMsg) return;

      const data = _this.uncompressData(event.data);
      UTILITY.runArray(_this.onMessage, data);
    };

    return ws;
  }

  let tempTimer = 0;

  this.ws = initWebSocket();
  this.onMessage = [];
  this.sendMessage = function (data) {
    if (this.pauseMsg) return;

    tempTimer++;
    //console.log(tempTimer);
    if (!this.isConnected) return;
    this.ws.send(this.compressData(data));
  };

};

_Connection.prototype.uncompressData = function (data) {
  return JSON.parse(data);
};

_Connection.prototype.compressData = function (data) {
  return JSON.stringify(data);
};

const CONNECTION = new _Connection();

INPUTMANAGER.add('test1', () => {
  CONNECTION.pauseMsg = true;
  console.log('stopped');
}, 1);
