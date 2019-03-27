'use strict';

class Koch {
  constructor(canvas, snailImage) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.snailImage = snailImage;

    this.mousePressed = undefined;
    this.mousePos = undefined;
    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);
    this.canvas.ontouchstart = (e) => this.ontouchstart.call(this, e);
    this.canvas.ontouchend = (e) => this.ontouchend.call(this, e);

    this.state = {};
    this.state.enabled = false;
    this.state.coins = 0;
    this.state.coinValue = 1;
    this.state.level = 0;
    this.state.snailSpeed = 1;
    this.state.hoverRatio = 2;
    this.state.upgrades = {
      level: 0,
      snailSpeed: 0,
      hoverRatio: 0,
      coinValue: 0,
      child: 0
    };

    this.t = 0;
    this.setLevel(this.state.level);
    this.loopTime = 5;
    this.lastDrawEdges = 0;

    this.hoverTarget = 0;
    this.hoverRemaining = this.loopTime * 1000 / 6;
    this.storedMoveTime = 0;

    this.buttons = new Buttons(this.canvas, {});

    const hoverButtonOptions = {
      shape: 'circle',
      strokecolor: '#00000000',
      bgcolor: '#F0808040',
      hovercolor: '#F0000040',
      hover: true};

    this.hoverButtons = [];

    this.hoverButtons.push(this.buttons.add(canvas.width * 0.1, canvas.height * 0.27, 60, 50, '', () => {this.hoverButton(0);}, hoverButtonOptions));
    this.hoverButtons.push(this.buttons.add(canvas.width * 0.9, canvas.height * 0.27, 60, 50, '', () => {this.hoverButton(1);}, hoverButtonOptions));
    this.hoverButtons.push(this.buttons.add(canvas.width * 0.5, canvas.height * 0.9,  60, 50, '', () => {this.hoverButton(2);}, hoverButtonOptions));

    this.upgrades = {
      level: {
        value: [1, 2, 3],
        cost: [350, 25000, 1000000],
        button: this.buttons.add(0, 0, 100, 30, 'Level', () => {this.buyUpgrade('level');})
      },
      snailSpeed: {
        value: [3, 9, 27],
        cost: [200000, 800000, 2000000],
        button: this.buttons.add(100, 0, 100, 30, 'Speed', () => {this.buyUpgrade('snailSpeed');})
      },
      hoverRatio: {
        value: [4, 10],
        cost: [12, 4000],
        button: this.buttons.add(200, 0, 100, 30, 'Hover', () => {this.buyUpgrade('hoverRatio');})
      },
      coinValue: {
        value: [9, 25, 250],
        cost: [30, 1500, 10000000],
        button: this.buttons.add(300, 0, 100, 30, 'Value', () => {this.buyUpgrade('coinValue');})
      },
      child: {
        value: [true],
        cost: [5000],
        button: this.buttons.add(this.canvas.width - 100, 0, 100, 30, 'Hilbert', () => {this.buyUpgrade('child');})
      }
    };

    this.setHoverColors();
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
    //e.preventDefault();
    const newE = {};
    newE.clientX = event.changedTouches[0].pageX - window.scrollX;
    newE.clientY = event.changedTouches[0].pageY - window.scrollY;
    this.mousePressed = newE;
    this.mousePos = newE;
  }
  ontouchend(e) {
    this.mousePressed = undefined;
    this.mousePos = undefined;
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

    if (app.showCoins) {
      this.fillStyle = 'red';
      this.font = '15px Courier';
      this.ctx.fillText(this.state.coins, 10, this.canvas.height - 30);
    }

    /*
    0: 0.5, 0.5 * tan(PI/6)  w = 1
    1: 1.5, 1.5 * tan(PI/6)  w = 3
    2: 4.5, 4.5 * tan(PI/6)  w = 9
    */
    const linesWide = Math.pow(3, this.level);
    const lineSize = this.canvas.width * 0.8 / linesWide;
    const shapeCenterX = lineSize * Math.pow(3, this.level) * 0.5;
    const shapeCenterY = shapeCenterX * Math.tan(Math.PI/6);
    const snailSize = this.snailImage.width;
    ctx.translate(this.canvas.width * 0.5 - shapeCenterX,
      this.canvas.height * 0.5 - shapeCenterY);

    const f = (this.t % this.loopTime) / this.loopTime;
    const drawEdges = this.edgeCount * f;
    if (Math.floor(drawEdges) !== this.lastDrawEdges) {
      this.parent.feed(1);
      this.state.coins += this.state.coinValue * app.prestigeBonus;
    }
    this.lastDrawEdges = Math.floor(drawEdges);


    //ctx.fillStyle = 'red';
    //ctx.font = '30px Courier';
    //ctx.fillText(drawEdges, 0, 0);

    let drawnEdges = 0;
    let i = 0;
    let x = 0;
    let y = 0;
    let angle = 0;
    const deltaAngle = Math.PI / 3;

    ctx.lineCap = 'round';
    ctx.lineWidth = 4;

    while (drawnEdges <= drawEdges) {
      const c = this.cmds[i];
      switch (c) {
        case 'L':
          ctx.strokeStyle = '#1b1b1b';
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
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            this.ctx.drawImage(this.snailImage, -snailSize*0.5, -snailSize*0.5);
            ctx.restore();
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
    this.hovering = undefined;
    const hovered = this.buttons.hover(this.mousePos);

    if (this.storedMoveTime > 0) {
      const stepTime = Math.min(deltaTime, this.storedMoveTime);
      this.t += this.state.snailSpeed * stepTime / 1000;
      this.storedMoveTime = Math.max(0, this.storedMoveTime - stepTime);
    }
    if (this.hovering !== undefined) {
      if (this.hovering === this.hoverTarget) {
        this.hoverRemaining -= deltaTime;
        this.storedMoveTime += deltaTime * this.state.hoverRatio;
      }

      if (this.hoverRemaining <= 0) {
        this.hoverRemaining = this.loopTime * 1000 / 6 + this.hoverRemaining;

        this.hoverTarget = (this.hoverTarget + 1) % 3;
        this.setHoverColors();
      }
    }

    if (this.mousePressed !== undefined) {
      const clicked = this.buttons.click(this.mousePressed);
      if (!clicked) {

      }
    }

    for (let upgradeType in this.upgrades) {
      const cost = this.getUpgradeCost(upgradeType);
      const percent = Math.min(1, this.state.coins / cost);
      this.upgrades[upgradeType].button.options.percent = percent;
      this.upgrades[upgradeType].button.options.visible = cost !== Infinity;
    }

  }
  hoverButton(n) {
    this.hovering = n;
  }
  setHoverColors(){
    for (let i = 0; i < 3; i++) {
      this.hoverButtons[i].options.hovercolor = (this.hoverTarget === i) ? '#00F00040' : '#F0000040';
    }
  }
  feed(val) {
    this.storedMoveTime += this.loopTime * 1000;
  }
  setLevel(n) {
    let cmd = 'L--L--L'.split``;

    let deltaAngle = Math.PI / 3;

    let iterations = n;
    let edgeCount = 3;
    for (let i = 0; i < iterations; i++) {
      edgeCount = 0;
      let newCmd = [];
      cmd.forEach(v => {
        switch (v) {
          case 'L':
            newCmd = newCmd.concat('L+L--L+L'.split``);
            edgeCount += 4;
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
    //const upgradeCost = this.state.coins;
    //console.log(`buy ${this.constructor.name} ${type} @ ${this.state.coins}`);
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
        if (type === 'level') {
          this.setLevel(newVal);
        }
      }
    }
  }
}
