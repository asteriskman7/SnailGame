'use strict';

const app = {
  state: {},
  init: function() {
    console.log('init');

    app.state = {
      prestigeCount: 0
    };

    document.getElementById('buttonPrestige').onclick = app.prestigeClick;
    document.getElementById('buttonCancel').onclick = app.prestigeCancel;
    document.getElementById('buttonReset').onclick = app.reset;



    app.levelList = ['walk', 'koch', 'hilbert', 'fourier'];
    app.levels = {};
    app.levels.walk = new Walk(document.getElementById('cwalk'),
      document.getElementById('imgWalkingSnail'),
      document.getElementById('imgCoin')
    );
    app.levels.koch = new Koch(document.getElementById('ckoch'),
      document.getElementById('imgSnailKoch')
    );
    app.levels.hilbert = new Hilbert(document.getElementById('chilbert'),
      document.getElementById('imgSnailHilbert')
    );
    app.levels.fourier = new Fourier(document.getElementById('cfourier'),
      document.getElementById('imgSnailFourier')
    );

    app.levels.walk.setRelations(null, app.levels.koch);
    app.levels.koch.setRelations(app.levels.walk, app.levels.hilbert);
    app.levels.hilbert.setRelations(app.levels.koch, app.levels.fourier);
    app.levels.fourier.setRelations(app.levels.hilbert, null);

    app.load();
    app.tick();
    setInterval(app.save, 30000);
  },
  reset: function() {
    if (window.confirm('Are you sure you want to reset all progress and start over?')) {
      localStorage.removeItem('snailGame');
      location.reload();
    }
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
  },
  prestigeClick: function() {
    const address = document.getElementById('inputAddress').value;
    if (address === app.levels.fourier.msg) {
      console.log('BIG P TIME');
      app.prestige();
      document.getElementById('divPrestige').style.display = 'none';
    } else {
      alert('ERROR: The asterisk_coin wallet associated with the address you entered does not contain at least 1000 asterisk_coin.');
    }
  },
  prestigeCancel: function() {
    document.getElementById('divPrestige').style.display = 'none';
  },
  prestige: function() {

  }
};

app.init();
