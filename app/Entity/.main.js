const path = require('path');

const Entity = require(path.join(path.dirname(require.main.filename), 'app', 'Entity', 'Entity.js'));
const PlayerEntity = require(path.join(path.dirname(require.main.filename), 'app', 'Entity', 'PlayerEntity.js'));

const _ENTITY = function (scene) {
  Entity.scene = scene;
  this.Entity = Entity;
  this.PlayerEntity = PlayerEntity;
};

module.exports = _ENTITY;
