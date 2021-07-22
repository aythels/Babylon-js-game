const uuid = require('short-uuid');
const WebSocket = require('ws');
const path = require('path'); //working with file paths
const UTILITY = require(path.join(path.dirname(require.main.filename), 'app', 'Tools', 'Utility.js'));

const Server = function (server) {
  const _this = this;
  this.onConnect = [];
  this.onMessage = [];
  this.onClose = [];

  const socketServer = new WebSocket.Server({ server });

  socketServer.on('connection', (ws) => {
    ws.isAlive = true;
    ws.userID = uuid.generate();

    UTILITY.runArray(this.onConnect, ws);

    ws.on('pong', () => ws.isAlive = true);

    ws.on('message', (data) => {
      // event.data is either a string (if text) or arraybuffer (if binary)

      UTILITY.runArray(this.onMessage, ws, data);
    });

    ws.on('close', () => {

      UTILITY.runArray(this.onClose, ws);
    });

  });

  //send data to everyone
  this.broadcastAll = function (data) {
    socketServer.clients.forEach((client) => {
      client.send(data);
    });
  };

  //send data to everyone except for specified client
  this.broadcastExcept = function (data, ws) {
    socketServer.clients.forEach((client) => {
      if (client != ws)
        client.send(data);
    });
  };

  //send data to specified client
  this.emit = function (data, ws) {
    ws.send(data);
  };

  function pingSockets() {
    socketServer.clients.forEach((client) => {
      if (!client.isAlive) return client.terminate();

      client.isAlive = false;
      client.ping();
    });
  }

  setInterval(() => pingSockets(), 30000);

};

module.exports = Server;
