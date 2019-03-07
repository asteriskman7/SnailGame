'use strict';

class Koch {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';

    this.mousePressed = undefined;
    this.mousePos = undefined;
    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);

    this.state = {};
    this.t = 0;
    this.snailSpeed = 1;
    this.setLevel(2);
    this.loopTime = 5;
    this.lastDrawEdges = 0;

    this.hoverTarget = 0;
    this.hoverRemaining = this.loopTime * 1000 / 3;

    this.buttons = new Buttons(this.canvas, {
      font: '10 Courier',
      fgcolor: 'red',
      bgcolor: 'grey',
      strokecolor: 'black'
    });

    this.buttons.add(canvas.width - 100, 0, 100, 30, 'hello', () => {console.log('button pressed');});

    const hoverButtonOptions = {
      shape: 'circle',
      strokecolor: '#00000000',
      bgcolor: '#F0808040',
      hovercolor: '#00F00040',
      hover: true};

    this.buttons.add(canvas.width * 0.1, canvas.height * 0.27, 50, 50, '1', () => {this.hoverButton(0);}, hoverButtonOptions);
    this.buttons.add(canvas.width * 0.9, canvas.height * 0.27, 50, 50, '2', () => {this.hoverButton(1);}, hoverButtonOptions);
    this.buttons.add(canvas.width * 0.5, canvas.height * 0.9,  50, 50, '3', () => {this.hoverButton(2);}, hoverButtonOptions);
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
  draw(timestamp, deltaTime) {
    const ctx = this.ctx;

    ctx.save();

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    /*
    0: 0.5, 0.5 * tan(PI/6)  w = 1
    1: 1.5, 1.5 * tan(PI/6)  w = 3
    2: 4.5, 4.5 * tan(PI/6)  w = 9
    */
    const linesWide = Math.pow(3, this.level);
    const lineSize = this.canvas.width * 0.8 / linesWide;
    const shapeCenterX = lineSize * Math.pow(3, this.level) * 0.5;
    const shapeCenterY = shapeCenterX * Math.tan(Math.PI/6);
    ctx.translate(this.canvas.width * 0.5 - shapeCenterX,
      this.canvas.height * 0.5 - shapeCenterY);

    const f = (this.t % this.loopTime) / this.loopTime;
    const drawEdges = this.edgeCount * f;
    if (Math.floor(drawEdges) !== this.lastDrawEdges) {
      this.parent.feed(1);
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

    while (drawnEdges <= drawEdges) {
      const c = this.cmds[i];
      switch (c) {
        case 'L':
          ctx.strokeStyle = 'yellow';
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
            ctx.fillStyle = 'blue';
            ctx.fillRect(x-5, y-5, 10, 10);
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

    this.hovering = undefined;
    const hovered = this.buttons.hover(this.mousePos);

    if (this.hovering !== undefined) {
      if (this.hovering === this.hoverTarget && this.hoverRemaining > 0) {
        this.t += this.snailSpeed * deltaTime / 1000;
        this.hoverRemaining -= deltaTime;
      }
      if (this.hoverRemaining <= 0) {
        this.hoverRemaining = this.loopTime * 1000 / 3 + this.hoverRemaining;
        this.hoverTarget = (this.hoverTarget + 1) % 3;
      }
    }

    if (this.mousePressed !== undefined) {
      const clicked = this.buttons.click(this.mousePressed);
      if (!clicked) {

      }
    }

  }
  hoverButton(n) {
    this.hovering = n;
  }
  feed(val) {

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
}
