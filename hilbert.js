'use strict';

class Hilbert {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.state = {};
    this.t = 0;
    this.snailSpeed = 1;
    this.setLevel(3);
    this.loopTime = 5;
    this.lastDrawEdges = 0;
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
  draw(timestamp, deltaTime) {
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
  }
  update(timestamp, deltaTime) {
    this.t += this.snailSpeed * deltaTime / 1000;
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
}
