const SoundManager = function () {
  const _this = this;
  const parentDir = location.protocol + '//' + location.host + '/assets/sounds/'; //just localhost
  this.soundList = {};

  /*
  const sound = new Howl({
    //src: ['sounds.webm', 'sounds.mp3'],
    //sprite: {
    //  blast: [0, 3000],
    //  laser: [4000, 1000],
    //  winner: [6000, 5000]
    //},
    //autoplay: true,
    //volume: 0.5,
    //rate: 1,
    //onend: () => console.log('Finished!'),
  });
  */

  const land = new Howl({ src: [parentDir.concat('land.mp3')] });
  createSound('land', land);

  const songtest = new Howl({ src: [parentDir.concat('songtest.mp3')] });
  createSound('songtest', songtest);

  function createSound(soundName, soundObject) {
    _this.soundList[soundName] = soundObject;
  }

  this.globalSetVolume = function (value) {
    if (value < 0) value = 0;
    if (value > 1) value = 1;

    Howler.volume(value);
  };

  this.globalSetMute = function (boolean) {
    Howler.mute(boolean);
  };

  this.play = function (soundName) {
    const sound = this.soundList[soundName];
    sound.play();
  };

  this.playStop = function (soundName) {
    const sound = this.soundList[soundName];
    if (sound.playing()) return;

    this.play(soundName);
  };

  this.playReset = function (soundName) {
    const sound = this.soundList[soundName];
    if (sound.playing()) sound.stop();

    this.play(soundName);
  };

  this.stop = function (soundName, shouldFadeout, duration) {
    const sound = this.soundList[soundName];
    if (shouldFadeout) {
      sound.fade(sound.volume(), 0, duration || 1000);
      sound.once('fade', () => sound.stop());
    } else {
      sound.stop();
    }

  };

  //mute/(un)mute = sets volume to 0 but does not stop playback
  //stop = stops playback
  //pause/play = stops but saves playback

  //INPUTMANAGER.addKeyScript('test1', () => this.stop('songtest', true), 1);
  //INPUTMANAGER.addKeyScript('test3', () => console.log(songtest.playing()), 1);
  //INPUTMANAGER.addKeyScript('test2', () => this.playStop('songtest'), 1);

};
const soundManager = new SoundManager();
