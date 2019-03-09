'use strict';

const app = {
  state: {},
  init: function() {
    console.log('init');

    app.levelList = ['walk', 'koch', 'hilbert', 'fourier'];
    app.levels = {};
    app.levels.walk = new Walk(document.getElementById('cwalk'),
      document.getElementById('imgWalkingSnail'),
      document.getElementById('imgCoin')
    );
    app.levels.koch = new Koch(document.getElementById('ckoch'));
    app.levels.hilbert = new Hilbert(document.getElementById('chilbert'));
    app.levels.fourier = new Fourier(document.getElementById('cfourier'));

    app.levels.walk.setRelations(null, app.levels.koch);
    app.levels.koch.setRelations(app.levels.walk, app.levels.hilbert);
    app.levels.hilbert.setRelations(app.levels.koch, app.levels.fourier);
    app.levels.fourier.setRelations(app.levels.hilbert, null);

    app.load();
    app.tick();
    setInterval(app.save, 30000);
  },
  load: function() {
    const loadedState = JSON.parse(localStorage.getItem('snailGame'));

    if (loadedState) {
      for (let key in loadedState) {
        app.state[key] = loadedState[key];
      }

      app.levelList.forEach( levelName => {
        if (loadedState[levelName]) {
          app.levels[levelName].loadFromString(loadedState[levelName]);
        }
      });
    }
  },
  save: function() {
    app.levelList.forEach( levelName => {
      app.state[levelName] = app.levels[levelName].getSaveString();
    });
    window.localStorage.setItem('snailGame', JSON.stringify(app.state));
  },
  update: function(timestamp, deltaTime) {
    app.levelList.forEach( levelName => {
      app.levels[levelName].update(timestamp, deltaTime);
    });
  },
  draw: function(timestamp, deltaTime) {
    app.levelList.forEach( levelName => {
      app.levels[levelName].draw(timestamp, deltaTime);
    });
  },
  tick: function(timestamp) {
    if (app.prevTimestamp !== undefined) {
      const deltaTime = timestamp - app.prevTimestamp;
      app.update(timestamp, deltaTime);
      app.draw(timestamp, deltaTime);
    }
    app.prevTimestamp = timestamp;
    window.requestAnimationFrame(app.tick);
  }
};

app.init();
