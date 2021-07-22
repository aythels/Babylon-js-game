//utility
const path = require('path'); //working with file paths
const moment = require('moment'); //working with timestamps

//server
const express = require('express'); //server stuff
const http = require('http');
const app = express();
const server = app.listen(process.env.PORT || 3000);

const logger = (req, res, next) => {
  console.log(req.protocol + '://' + req.get('host') + req.originalUrl, moment().format());
  next();
};

//app.use(logger);

const clientFolderPath = path.join(__dirname, 'public', 'client');
app.use('/', express.static(clientFolderPath));

const assetsFolderPath = path.join(__dirname, 'public', 'assets');
app.use('/assets', express.static(assetsFolderPath));

const GameServer = require(path.join(__dirname, 'app', 'Server.js'));
const gameServer = new GameServer(server);

const Game = require(path.join(__dirname, 'app', 'Game.js'));
const game = new Game(gameServer);

process.on('SIGINT', () => { console.log("Bye bye!"); process.exit(); });
