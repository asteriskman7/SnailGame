'use strict';

class Walk {
  constructor(canvas, snailImage, coinImage, grassImage) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.mousePressed = undefined;
    this.mousePos = undefined;

    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);
    this.canvas.ontouchstart = (e) => this.ontouchstart.call(this, e);
    this.canvas.ontouchend = (e) => this.ontouchend.call(this, e);

    this.snailImage = snailImage;
    this.coinImage = coinImage;
    this.grassImage = grassImage;

    this.canvas.style.display = 'inline';
    this.t = 0;
    this.state = {};
    this.state.coins = 0;
    this.state.showHills = false;
    this.state.showMountains = false;
    this.state.snailSpeed = 0.5;
    this.state.coinRate = 0.95;
    this.state.coinValue = 1;
    this.state.upgrades = {
      snailSpeed: 0,
      showHills: 0,
      showMountains: 0,
      coinRate: 0,
      coinValue: 0,
      child: 0
    };

    this.groundSpeed = 5.0;

    this.snailDir = -1;
    this.snailSize = 1;
    this.snailMinSize = 0.8;
    this.snailGrowRate = 0.002;
    this.xperSecond = this.snailGrowRate * this.snailImage.width * 0.5;
    this.xpos = 0;
    this.coins = [];
    this.coinTime = 0;
    this.zxoffset = [0, 0, 0];
    this.speedMap = [1, 0.3, 0.1];
    this.yFunctions = [
      (canvasx) => this.canvas.height * 0.8,
      (canvasx) => this.getHillHeight(this.xpos, canvasx),
      (canvasx) => this.getMountainHeight(this.xpos, canvasx)
    ];
    this.noiseConfig = [
      {a: 128, s: 1/8},
      {a: 64,  s: 1/4},
      {a: 16,  s: 1/2},
      {a: 8,  s: 1},
      {a: 0,   s: 2},
      {a: 0,   s: 4},
    ];

    this.storedMoveTime = 2000;

    this.buttons = new Buttons(this.canvas, {});

    this.upgrades = {
      snailSpeed: {
        value: [1.0,1.5],
        cost:  [5,25000],
        button: this.buttons.add(0, 0, 100, 30, 'Speed', () => {this.buyUpgrade('snailSpeed');})
      },
      showHills: {
        value: [true],
        cost: [250],
        button: this.buttons.add(300, 0, 100, 30, 'Hills', () => {this.buyUpgrade('showHills');})
      },
      showMountains: {
        value: [true],
        cost: [10000],
        button: this.buttons.add(400, 0, 100, 30, 'Mtns', () => {this.buyUpgrade('showMountains');})
      },
      coinRate: {
        value: [0.5,0.2],
        cost: [15,75000],
        button: this.buttons.add(100, 0, 100, 30, 'Rate', () => {this.buyUpgrade('coinRate');})
      },
      coinValue: {
        value: [3, 6, 100],
        cost: [3500, 130000, 450000],
        button: this.buttons.add(200, 0, 100, 30, 'Value', () => {this.buyUpgrade('coinValue');})
      },
      child: {
        value: [true],
        cost: [30],
        button: this.buttons.add(this.canvas.width - 100, 0, 100, 30, 'Koch', () => {this.buyUpgrade('child');})
      }
    };

    this.buttons.add(this.canvas.width - 200, 0, 100, 30, 'Prestige', () => {this.showPrestige();}, {percent: 1.0});
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
    const newE = {};
    newE.clientX = event.changedTouches[0].pageX - window.scrollX;
    newE.clientY = event.changedTouches[0].pageY - window.scrollY;
    this.mousePressed = newE;
  }
  ontouchend(e) {
    this.mousePressed = undefined;
  }
  drawSnail(position) {
    const fullW = this.snailImage.width;
    //go from snailMinSize to 1.0
    //need to have amplitude of (1 - snailMinSize) * 0.5
    //offset by snailMinSize + amplitude
    const amp = (1 - this.snailMinSize) * 0.5;
    const offset = this.snailMinSize + amp;
    const w = (offset + amp * Math.cos(position * 16)) * fullW;
    this.ctx.drawImage(this.snailImage, 40, 100, w, this.snailImage.height);
  }
  drawGrass() {
    const ctx = this.ctx;

    const imgy = this.canvas.height * 0.8 - 10;
    const imgx = (-this.xpos) % this.grassImage.width;

    ctx.drawImage(this.grassImage, imgx, imgy);
    ctx.drawImage(this.grassImage, imgx + this.canvas.width, imgy);

  }
  getHillHeight(x, canvasx) {
    const rate = 0.3;
    const seed = 0;
    const xscale = 10;
    const yscale = 0.3;

    return yscale * fnoise((x*rate + canvasx)/xscale, this.noiseConfig) + 120;
  }
  drawHills() {
    if (!this.state.showHills) {return;}
    const ctx = this.ctx;
    ctx.beginPath();
    let firstHeight = this.getHillHeight(this.xpos, 0);
    ctx.moveTo(0, firstHeight);
    let lastHeight;
    for (let i = 1; i < this.canvas.width; i+=3) {
      let height = this.getHillHeight(this.xpos, i);
      lastHeight = height;
      ctx.lineTo(i, height);
    }
    ctx.lineTo(this.canvas.width+10, lastHeight);
    ctx.lineTo(this.canvas.width+10, this.canvas.height+10);
    ctx.lineTo(-10, this.canvas.height + 10);
    ctx.lineTo(-10, firstHeight);
    ctx.fillStyle = '#0a5410';
    ctx.fill();
    ctx.strokeStyle = '#073b0b';
    ctx.stroke();
  }
  getMountainHeight(x, canvasx) {
    const rate = 0.1;
    const seed = 8755;
    const xscale = 10;
    const yscale = 0.4;

    return yscale * fnoise((x*rate + canvasx + seed)/xscale, this.noiseConfig) + 80;
  }
  drawMountains() {
    if (!this.state.showMountains) {return;}
    const ctx = this.ctx;

    ctx.beginPath();
    let firstHeight = this.getMountainHeight(this.xpos, 0);
    ctx.moveTo(0, firstHeight);
    let lastHeight;
    for (let i = 1; i < this.canvas.width; i+=3) {
      let height = this.getMountainHeight(this.xpos, i);
      lastHeight = height;
      ctx.lineTo(i, height);
    }
    ctx.lineTo(this.canvas.width+10, lastHeight);
    ctx.lineTo(this.canvas.width+10, this.canvas.height+10);
    ctx.lineTo(-10, this.canvas.height + 10);
    ctx.lineTo(-10, firstHeight);
    ctx.fillStyle = 'grey';
    ctx.fill();
    ctx.strokeStyle = '#505050';
    ctx.stroke();
  }
  drawSky() {
    const ctx = this.ctx;
    ctx.fillStyle = '#3998af';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  addCoins(count, z) {
    this.coins.push({x: this.xpos - this.zxoffset[z] , z: z, val: count * this.state.coinValue * Math.pow(10, z)});
  }
  drawCoins() {
    this.coins.forEach( v => {
      const speed = this.speedMap[v.z];
      const canvasx = this.canvas.width - (this.xpos * speed - v.x);
      const y = this.yFunctions[v.z](canvasx);
      const x = this.canvas.width - (this.xpos * speed - v.x);
      this.ctx.drawImage(this.coinImage, x, y - this.coinImage.height * 0.5);
    });
  }
  getCoins() {
    this.coins = this.coins.filter( v => {
      const relx = this.canvas.width - (this.xpos*this.speedMap[v.z] - v.x);
      if (relx <= 195) {
        this.state.coins += v.val * app.prestigeBonus;
        return false;
      }
      return true;
    });
  }
  drawCoinCount() {
    const ctx = this.ctx;
    ctx.font = '30px Courier';
    ctx.fillStyle = 'black';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.strokeText(this.state.coins, 30, this.canvas.height - 5);
    ctx.fillText(this.state.coins, 30, this.canvas.height - 5);
  }
  draw(timestamp, deltaTime) {
    const ctx = this.ctx;
    ctx.save();
    //ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawSky();
    this.drawMountains();
    this.drawHills();
    this.drawGrass();
    this.drawCoins();
    this.drawSnail(this.t);
    this.drawCoinCount();
    this.buttons.draw(this.mousePos);

    ctx.restore();
  }
  update(timestamp, deltaTime) {
    this.getCoins();
    const hovered = this.buttons.hover(this.mousePos);
    if (this.mousePressed !== undefined || this.storedMoveTime > 0) {
      const clicked = this.mousePressed && this.buttons.click(this.mousePressed);
      if (!clicked || this.storedMoveTime > 0) {
        this.t += this.state.snailSpeed * deltaTime / 1000;
        let dx = Math.max(0, this.state.snailSpeed * this.groundSpeed * Math.sin(this.t * 16));

        let v = this.state.snailSpeed * deltaTime / 1000;
        this.coinTime += this.state.snailSpeed * deltaTime;
        let coinsToAdd = Math.floor(this.coinTime / (1000 * this.state.coinRate));

        this.coinTime -= coinsToAdd * this.state.coinRate * 1000;

        if (coinsToAdd > 0) {
          this.addCoins(coinsToAdd, 0);
          if (this.state.showHills) {
            this.addCoins(coinsToAdd, 1);
          }
          if (this.state.showMountains) {
            this.addCoins(coinsToAdd, 2);
          }
        }
        this.xpos += dx;
        this.storedMoveTime = Math.max(0, this.storedMoveTime - deltaTime);
      }
    }

    for (let upgradeType in this.upgrades) {
      const cost = this.getUpgradeCost(upgradeType);
      const percent = Math.min(1, this.state.coins / cost);
      this.upgrades[upgradeType].button.options.percent = percent;
      this.upgrades[upgradeType].button.options.visible = cost !== Infinity;
    }
  }
  feed(val) {
    this.storedMoveTime += 5000;
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
      if (type === 'child') {
        if (upgradeCost === 0) {
          this.child.state.coins += Math.floor(this.state.coins * 0.5);
          this.state.coins = 0;
        } else {
          this.state.coins -= upgradeCost;
          this.state.upgrades[type]++;
          this.child.enable();
          this.mousePressed = undefined;
        }
      } else {
        this.state.coins -= upgradeCost;
        this.state.upgrades[type]++;
        const newVal = this.upgrades[type].value[nextUpgradeLevel];
        this.state[type] = newVal;
        if (type === 'showHills') {
          this.zxoffset[1] = this.xpos - this.xpos * this.speedMap[1];
        }
        if (type === 'showMountains') {
          this.zxoffset[2] = this.xpos - this.xpos * this.speedMap[2];
        }
      }
    }
  }
  showPrestige() {
    const e = document.getElementById('divPrestige');
    e.style.display = 'block';
  }
}
