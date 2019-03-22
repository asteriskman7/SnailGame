'use strict';

class Hilbert {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.state = {};
    this.state.enabled = false;
    this.state.coins = 0;
    this.state.coinValue = 1;
    this.state.level = 0;
    this.state.snailSpeed = 1;
    this.state.keyTime = 200;
    this.state.upgrades = {
      level: 0,
      snailSpeed: 0,
      keyTime: 0,
      coinValue: 0,
      child: 0
    };

    this.t = 0;

    this.setLevel(this.state.level);
    this.loopTime = 5;
    this.lastDrawEdges = 0;

    this.storedMoveTime = 0; //this.loopTime * 1000;
    this.lastKey = undefined;
    this.maxStoredTime = this.loopTime * 1000;

    this.mousePressed = undefined;
    this.mousePos = undefined;
    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);
    this.canvas.onkeypress = (e) => this.onkeypress.call(this, e);
    this.canvas.ontouchstart = (e) => this.ontouchstart.call(this, e);
    this.canvas.ontouchend = (e) => this.ontouchend.call(this, e);

    this.buttons = new Buttons(this.canvas, {
      font: '20px Courier',
      fgcolor: 'red',
      bgcolor: 'grey',
      strokecolor: 'black'
    });

    this.upgrades = {
      level: {
        value: [1, 2, 3],
        cost: [40, 800, 12000],
        button: this.buttons.add(0, 0, 100, 30, 'Level', () => {this.buyUpgrade('level');})
      },
      snailSpeed: {
        value: [4, 16, 64],
        cost: [200, 8000, 320000],
        button: this.buttons.add(100, 0, 100, 30, 'Speed', () => {this.buyUpgrade('snailSpeed');})
      },
      keyTime: {
        value: [200, 1000, 5000],
        cost: [10, 10000, 10000000],
        button: this.buttons.add(200, 0, 100, 30, 'DPK', () => {this.buyUpgrade('keyTime');})
      },
      coinValue: {
        value: [6, 36, 216],
        cost: [6, 600, 600000],
        button: this.buttons.add(300, 0, 100, 30, 'Value', () => {this.buyUpgrade('coinValue');})
      },
      child: {
        value: [true],
        cost: [5],
        button: this.buttons.add(this.canvas.width - 100, 0, 100, 30, 'Fourier', () => {this.buyUpgrade('child');})
      }
    };
  }
  enable() {
    this.state.enabled = true;
  }
  setRelations(parent, child) {
    this.parent = parent;
    this.child = child;
  }
  getSaveString() {
    return JSON.stringify(this.state);
  }
  loadFromString(str) {
    const loadedState = JSON.parse(str);
    //let anything from loadedState override current state
    this.state = {...this.state,...loadedState};
    this.setLevel(this.state.level);

  }
  onmousedown(e) {
    this.mousePressed = e;
    this.storedMoveTime += this.state.keyTime;
  }
  onmouseup(e) {
    this.mousePressed = undefined;
  }
  onmousemove(e) {
    this.mousePos = e;
  }
  ontouchstart(e) {
    e.preventDefault();
    const newE = {};
    newE.clientX = event.changedTouches[0].pageX - window.scrollX;
    newE.clientY = event.changedTouches[0].pageY - window.scrollY;
    this.mousePressed = newE;
    this.storedMoveTime += this.state.keyTime;
  }
  ontouchend(e) {
    this.mousePressed = undefined;
  }
  draw(timestamp, deltaTime) {
    if (!this.state.enabled) {
      this.canvas.style.display = 'none';
      return;
    }
    this.canvas.style.display = 'inline';
    const ctx = this.ctx;

    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    /*
    0: 0.5, 0.5     w = 1
    1: 1.5, 1.5     w = 3
    2: 3.5, 3.5     w = 7
    3: 7.5, 7.5     w = 15
    4: 15.5,15.5    w = 31
    */

    const linesWide = Math.pow(2, this.level+1) - 1;
    const lineSize = this.canvas.width * 0.8 / linesWide;
    const shapeCenterX = lineSize * linesWide * 0.5;
    const shapeCenterY = shapeCenterX;
    ctx.translate(this.canvas.width * 0.5 - shapeCenterX ,
      this.canvas.height * 0.5 - shapeCenterY);

    const f = (this.t % this.loopTime) / this.loopTime;
    const drawEdges = this.edgeCount * f;
    if (Math.floor(drawEdges) !== this.lastDrawEdges) {
      this.state.coins += this.state.coinValue;
      this.parent.feed(1);
    }
    this.lastDrawEdges = Math.floor(drawEdges);

    //ctx.fillStyle = 'red';
    //ctx.font = '30 Courier';
    //ctx.fillText('Hilbert', 10, 10);
    //ctx.fillRect(100 * Math.cos(this.t) + 100, 100, 10, 10);

    let drawnEdges = 0;
    let i = 0;
    let x = 0;
    let y = 0;
    let angle = 0;
    const deltaAngle = Math.PI / 2;

    while (drawnEdges <= drawEdges) {
      const c = this.cmds[i];
      switch (c) {
        case 'F':
          ctx.strokeStyle = 'purple';
          ctx.beginPath();
          ctx.moveTo(x, y);
          let curLineSize;
          let drawSnail = false;
          if (drawnEdges <= (drawEdges-1)) {
            curLineSize = lineSize;
          } else {
            curLineSize = (drawEdges - drawnEdges) * lineSize;
            drawSnail = true;
          }
          x += curLineSize * Math.cos(angle);
          y += curLineSize * Math.sin(angle);
          ctx.lineTo(x, y);
          ctx.stroke();
          drawnEdges++;
          if (drawSnail) {
            ctx.fillStyle = 'orange';
            ctx.fillRect(x-5,y-5, 10, 10);
          }
          break;
        case '-':
          angle += deltaAngle;
          break;
        case '+':
          angle -= deltaAngle;
          break;
      }
      i++;
    }

    ctx.restore();
    this.buttons.draw(this.mousePos);
  }
  update(timestamp, deltaTime) {
    if (!this.state.enabled) {return;}

    const hovered = this.buttons.hover(this.mousePos);

    if (this.storedMoveTime > 0) {
      const stepTime = Math.min(deltaTime, this.storedMoveTime);
      this.t += this.state.snailSpeed * stepTime / 1000;
      this.storedMoveTime -= stepTime;
    }

    if (this.mousePressed !== undefined) {
      const clicked = this.buttons.click(this.mousePressed);
    }

    for (let upgradeType in this.upgrades) {
      const cost = this.getUpgradeCost(upgradeType);
      const percent = Math.min(1, this.state.coins / cost);
      this.upgrades[upgradeType].button.options.percent = percent;
    }

  }
  setLevel(n) {
    let cmd = ['A'];

    let deltaAngle = Math.PI / 2;

    let iterations = n+1;
    let edgeCount;
    for (let i = 0; i < iterations; i++) {
      edgeCount = 0;
      let newCmd = [];
      cmd.forEach(v => {
        switch (v) {
          case 'A':
            newCmd = newCmd.concat('-BF+AFA+FB-'.split``);
            edgeCount += 3;
            break;
          case 'B':
            newCmd = newCmd.concat('+AF-BFB-FA+'.split``);
            edgeCount += 3;
            break;
          case 'F':
            edgeCount++;
            newCmd.push(v);
            break;
          case '-':
          case '+':
            newCmd.push(v);
            break;
        }
      });
      cmd = newCmd;
    }
    this.cmds = cmd;
    this.edgeCount = edgeCount;
    this.level = n;
  }
  feed() {
    this.storedMoveTime += this.loopTime * 1000;
  }
  onkeypress(event) {
    const key = event.key;
    if (key !== this.lastKey) {
      this.storedMoveTime += this.state.keyTime;
      this.lastKey = key;
    }
  }
  getUpgradeCost(type) {
    const nextUpgradeLevel = this.state.upgrades[type];
    const upgradeCost = this.upgrades[type].cost[nextUpgradeLevel];
    if (upgradeCost === undefined) {return Infinity;}
    return upgradeCost;
  }
  buyUpgrade(type) {
    const nextUpgradeLevel = this.state.upgrades[type];
    const upgradeCost = this.getUpgradeCost(type);
      if (this.state.coins >= upgradeCost) {
      this.state.coins -= upgradeCost;
      this.state.upgrades[type]++;
      if (type === 'child') {
        this.child.enable();
      } else {
        const newVal = this.upgrades[type].value[nextUpgradeLevel];
        this.state[type] = newVal;
        if (type === 'level') {
          this.setLevel(newVal);
        }
      }

    }
  }
}
