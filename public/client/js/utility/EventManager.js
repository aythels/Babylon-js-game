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
