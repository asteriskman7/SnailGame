'use strict';

class Walk {
  constructor(canvas, snailImage, coinImage) {
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

    this.storedMoveTime = 2000;

    this.buttons = new Buttons(this.canvas, {});

    this.upgrades = {
      snailSpeed: {
        value: [1.0,1.5], //max shouldn't be higher than 10
        cost:  [10,50],
        button: this.buttons.add(0, 0, 100, 30, 'Speed', () => {this.buyUpgrade('snailSpeed');})
      },
      showHills: {
        value: [true],
        cost: [100],
        button: this.buttons.add(300, 0, 100, 30, 'Hills', () => {this.buyUpgrade('showHills');})
      },
      showMountains: {
        value: [true],
        cost: [1000],
        button: this.buttons.add(400, 0, 100, 30, 'Mtns', () => {this.buyUpgrade('showMountains');})
      },
      coinRate: {
        value: [2,4,8],
        cost: [15,100,200],
        button: this.buttons.add(100, 0, 100, 30, 'Rate', () => {this.buyUpgrade('coinRate');})
      },
      coinValue: {
        value: [3, 6],
        cost: [2000, 3000],
        button: this.buttons.add(200, 0, 100, 30, 'Value', () => {this.buyUpgrade('coinValue');})
      },
      child: {
        value: [true],
        cost: [5],
        button: this.buttons.add(this.canvas.width - 100, 0, 100, 30, 'Koch', () => {this.buyUpgrade('child');})
      }
    };

    this.buttons.add(this.canvas.width - 200, 0, 100, 30, 'Prestige', () => {this.showPrestige();});
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
    for (let key in loadedState) {
      this.state[key] = loadedState[key];
    }
    this.state.coins = 10;
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
  getTimeString(t) {
    let [h,m] = t.toLocaleTimeString().split` `[0].split`:`;
    let baseString = `${h}:${m}`;
    let displayString = baseString;
    return displayString;
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
    const img = document.getElementById('imgGrass');

    const imgy = this.canvas.height * 0.8 - 10;
    const imgx = (-this.xpos) % img.width;

    ctx.drawImage(img, imgx, imgy);
    ctx.drawImage(img, imgx + this.canvas.width, imgy);

  }
  getHillHeight(x, canvasx) {
    let noiseConfig = [
      {a: 128, s: 1/8},
      {a: 64,  s: 1/4},
      {a: 16,  s: 1/2},
      {a: 8,  s: 1},
      {a: 0,   s: 2},
      {a: 0,   s: 4},
    ];

    const rate = 0.3;
    const seed = 0;
    const xscale = 10;
    const yscale = 0.3;

    return yscale * fnoise((x*rate + canvasx)/xscale, noiseConfig) + 120;
  }
  drawHills() {
    if (!this.state.showHills) {return;}
    const ctx = this.ctx;
    let noiseConfig = [
      {a: 128, s: 1/8},
      {a: 64,  s: 1/4},
      {a: 16,  s: 1/2},
      {a: 8,  s: 1},
      {a: 0,   s: 2},
      {a: 0,   s: 4},
    ];

    const rate = 0.3;
    const seed = 0;
    const xscale = 10;
    const yscale = 0.3;

    ctx.beginPath();
    let firstHeight = this.getHillHeight(this.xpos, 0); //yscale * fnoise((this.xpos*rate + 0)/xscale, noiseConfig) + 120;
    ctx.moveTo(0, firstHeight);
    let lastHeight;
    for (let i = 1; i < this.canvas.width; i++) {
      let height = this.getHillHeight(this.xpos, i); //yscale * fnoise((this.xpos*rate + i)/xscale, noiseConfig) + 120;
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
    let noiseConfig = [
      {a: 128, s: 1/8},
      {a: 64,  s: 1/4},
      {a: 16,  s: 1/2},
      {a: 0,  s: 1},
      {a: 0,   s: 2},
      {a: 0,   s: 4},
    ];

    const rate = 0.1;
    const seed = 8755;
    const xscale = 10;
    const yscale = 0.4;

    return yscale * fnoise((x*rate + canvasx + seed)/xscale, noiseConfig) + 80;
  }
  drawMountains() {
    if (!this.state.showMountains) {return;}
    const ctx = this.ctx;

    let noiseConfig = [
      {a: 128, s: 1/8},
      {a: 64,  s: 1/4},
      {a: 16,  s: 1/2},
      {a: 0,  s: 1},
      {a: 0,   s: 2},
      {a: 0,   s: 4},
    ];

    const rate = 0.1;
    const seed = 8755;
    const xscale = 10;
    const yscale = 0.4;

    ctx.beginPath();
    let firstHeight = this.getMountainHeight(this.xpos, 0);
    ctx.moveTo(0, firstHeight);
    let lastHeight;
    for (let i = 1; i < this.canvas.width; i++) {
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
    //const coinScore = v * Math.random();

    //const maxValue = this.state.snailSpeed <= 0.5 ? 0.5/60 :  (this.state.snailSpeed * (7/9) + 2/9) / 60;

    //if (coinScore > maxValue * this.state.coinRate) {
      //grass coins are value * 1
      //hill coins are  value * 10
      //mount coins are value * 100
      this.coins.push({x: this.xpos, z: z, val: count * this.state.coinValue * Math.pow(10, z)});
    //}
  }
  drawCoins(z) {
    const speed = [1, 0.3, 0.1][z];
    const yf = [
      (canvasx) => this.canvas.height * 0.8,
      (canvasx) => this.getHillHeight(this.xpos, canvasx),
      (canvasx) => this.getMountainHeight(this.xpos, canvasx)
    ][z];

    this.coins.forEach( v => {
      if (v.z === z) {
        this.ctx.fillStyle = 'yellow';
        const canvasx = this.canvas.width - (this.xpos * speed - v.x);
        const y = yf(canvasx);
        const x = this.canvas.width - (this.xpos * speed - v.x);
        //this.ctx.fillText(v.val, this.canvas.width - (this.xpos * speed - v.x), y);
        this.ctx.drawImage(this.coinImage, x, y - this.coinImage.height * 0.5);
      }
    });
  }
  getCoins() {
    const speedMap = [1, 0.3, 0.1];
    this.coins = this.coins.filter( v => {
      const relx = this.canvas.width - (this.xpos*speedMap[v.z] - v.x);
      if (relx <= 195) {
        this.state.coins += v.val;
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
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);



    this.drawSky();
    this.drawMountains();
    this.drawCoins(2);
    this.drawHills();
    this.drawCoins(1);
    this.drawGrass();
    this.drawCoins(0);
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
        this.storedMoveTime -= deltaTime;
      }
    }

    for (let upgradeType in this.upgrades) {
      const cost = this.getUpgradeCost(upgradeType);
      const percent = Math.min(1, this.state.coins / cost);
      this.upgrades[upgradeType].button.options.percent = percent;
    }
  }
  feed(val) {
    this.storedMoveTime += 5000;
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
      }

    }
  }
  showPrestige() {
    const e = document.getElementById('divPrestige');
    e.style.display = 'block';

  }
}
