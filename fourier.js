'use strict';

class Fourier {
  constructor(canvas, snailImage) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.snailImage = snailImage;
    this.state = {};
    this.state.enabled = false;
    this.state.coins = 0;
    this.state.coinValue = 1;
    this.state.level = 0;
    this.state.earnFactor = 1;
    this.state.upgrades = {
      level: 0,
      coinValue: 0,
      earnFactor: 0
    };

    this.angle = 0;
    this.snailSpeed = 1;
    this.setLevel(this.state.level);
    this.loopTime = 5;
    this.lastDrawEdges = 0;
    this.drawLimit = 5;

    this.storedMoveTime = 0;
    this.maxStoredTime = this.loopTime * 1000;
    this.drawEnable = false;
    this.lastMousePos = {clientX: -100, clientY: -100};
    this.mousePos = this.lastMousePos;

    this.mousePressed = undefined;
    //this.mousePos = undefined;
    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);
    this.canvas.ontouchstart = (e) => this.ontouchstart.call(this, e);
    this.canvas.ontouchend = (e) => this.ontouchend.call(this, e);
    this.canvas.ontouchmove = (e) => this.ontouchmove.call(this, e);

    this.buttons = new Buttons(this.canvas, { });

    this.upgrades = {
      level: {
        value: [1, 2, 4],
        cost: [500, 30000, 10000000],
        button: this.buttons.add(0, 0, 100, 30, 'Level', () => {this.buyUpgrade('level');})
      },
      coinValue: {
        value: [8, 64, 512],
        cost: [65, 6000, 50000],
        button: this.buttons.add(100, 0, 100, 30, 'Value', () => {this.buyUpgrade('coinValue');})
      },
      earnFactor: {
        value: [20, 200, 20000],
        cost: [2, 120, 600],
        button: this.buttons.add(200, 0, 100, 30, 'APS', () => {this.buyUpgrade('earnFactor');})
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
  }
  ontouchend(e) {
    this.mousePressed = undefined;
  }
  ontouchmove(e) {
    e.clientX = event.changedTouches[0].pageX;
    e.clientY = event.changedTouches[0].pageY;
    this.mousePos = e;
  }
  draw(timestamp, deltaTime) {
    if (!this.state.enabled) {
      this.canvas.style.display = 'none';
      return;
    }
    this.canvas.style.display = 'inline';
    if (this.drawEnable) {

      const ctx = this.ctx;

      ctx.save();

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (app.showCoins) {
        this.fillStyle = 'red';
        this.font = '15px Courier';
        this.ctx.fillText(this.state.coins, 10, this.canvas.height - 30);
      }

      ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);

      const snailSize = this.snailImage.width;
      let cx = 0;
      let cy = 0;

      ctx.fillStyle = '#4c994a';
      ctx.strokeStyle = '#706ee085';

      let lastAngle;

      this.units.forEach( (unit, i) => {
        //if (i === 0) {return;}
        const angle = unit.freq * this.angle;
        lastAngle = angle;
        const dx = unit.mag * Math.cos(angle + unit.phase);
        const dy = unit.mag * Math.sin(angle + unit.phase);
        if (unit.mag > this.drawLimit) {
          ctx.beginPath();
          ctx.arc(cx, cy, unit.mag, 0, Math.PI * 2);
          ctx.stroke();
        }
        cx += dx;
        cy += dy;
        if (unit.mag > this.drawLimit) {
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(lastAngle);
      ctx.drawImage(this.snailImage, -snailSize * 0.5, -snailSize * 0.5);
      ctx.restore();

      if (this.points.length >= this.units.length) {
        this.points = [];
        this.parent.feed(4);
        const levelFactor = Math.pow(5, this.state.level);
        this.state.coins += this.state.coinValue * app.prestigeBonus * levelFactor;
      }
      this.points.push({x: cx, y: cy});

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#454385';
      ctx.beginPath();
      const points = this.points;
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      ctx.restore();

    }

    this.buttons.draw(this.mousePos);
  }
  update(timestamp, deltaTime) {
    if (!this.state.enabled) {return;}
    const hovered = this.buttons.hover(this.mousePos);

    if (this.mousePos.clientX !== this.lastMousePos.clientX || this.mousePos.clientY !== this.lastMousePos.clientY) {
      this.storedMoveTime += this.state.earnFactor * deltaTime;
    }

    this.lastMousePos = this.mousePos;
    if (this.storedMoveTime > deltaTime) {
      const stepTime = Math.min(deltaTime, this.storedMoveTime);
      this.angle += Math.PI * 2 / this.units.length;
      this.storedMoveTime = Math.max(0, this.storedMoveTime - stepTime);
      this.drawEnable = true;
    } else {
      this.drawEnable = false;
    }

    if (this.mousePressed !== undefined) {
      const clicked = this.buttons.click(this.mousePressed);
    }

    for (let upgradeType in this.upgrades) {
      const cost = this.getUpgradeCost(upgradeType);
      const percent = Math.min(1, this.state.coins / cost);
      this.upgrades[upgradeType].button.options.percent = percent;
      this.upgrades[upgradeType].button.options.visible = cost !== Infinity;
    }

  }
  getMessage(len) {
    let result = '';
    let source = letterPathLetters.slice();
    while (source.length > 0) {
      const choice = Math.floor(Math.random() * source.length);
      result += source[choice];
      source.splice(choice, 1);
    }
    while (result.length < len) {
      result += letterPathLetters[Math.floor(Math.random() * letterPathLetters.length)];
    }

    return result;
  }
  setLevel(n) {
    const points = [];

    this.msg = this.getMessage(8);
    let dx = -40;
    for (let j = 0; j < this.msg.length; j++) {
      const c = this.msg[j];
      const lp = letterPoints[c];
      const s = 7;
      for (let i = 0; i < lp.length; i++) {
        points.push([dx*s + lp[i][0]*s,lp[i][1]*s]);
      }
      dx += 10;
    }

    const factor = [50,20,15,10,2][n];
    const reducedPoints = points.map( (v,i) => {
      let sumx = 0;
      let sumy = 0;
      for (let j = 0; j < factor; j++) {
        sumx += points[(i + j) % points.length][0];
        sumy += points[(i + j) % points.length][1];
      }
      return [sumx / factor, sumy / factor];
    });

    this.units = this.dft(reducedPoints);
    this.points = [];
    this.angle = 0;
  }
  dft(data) {
    let X = [];
    for (let k = 0; k < data.length; k++) {
      let Xr = 0;
      let Xi = 0;
      for (let n = 0; n < data.length; n++) {
        const [dr, di] = data[n];
        const angle = 2 * Math.PI * k * n / data.length;
        Xr += dr * Math.cos(angle) + di * Math.sin(angle);
        Xi += di * Math.cos(angle) - dr * Math.sin(angle);
      }

      const mag = Math.sqrt(Xr * Xr + Xi * Xi) / data.length;
      const phase = Math.atan2(Xi, Xr);
      X.push({mag, phase, freq: k});
    }

    X.sort( (a, b) => {
      return b.mag - a.mag;
    });

    return X;
  }
  getUpgradeCost(type) {
    const nextUpgradeLevel = this.state.upgrades[type];
    const upgradeCost = this.upgrades[type].cost[nextUpgradeLevel];

    if (upgradeCost === undefined) {
      if (type !== 'child') {
        return Infinity;
      } else {
        return 0;
      }
    }
    return upgradeCost;
  }
  buyUpgrade(type) {
    const nextUpgradeLevel = this.state.upgrades[type];
    const upgradeCost = this.getUpgradeCost(type);    
    if (this.state.coins >= upgradeCost) {
      this.state.coins -= upgradeCost;
      this.state.upgrades[type]++;
      const newVal = this.upgrades[type].value[nextUpgradeLevel];
      this.state[type] = newVal;
      if (type === 'level') {
        this.setLevel(newVal);
      }
    }
  }
}
