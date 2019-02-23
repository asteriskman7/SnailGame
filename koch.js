'use strict';

class Koch {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.state = {};
    this.t = 0;
    this.snailSpeed = 1;
    this.setLevel(2);
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
  }
  update(timestamp, deltaTime) {
    this.t += this.snailSpeed * deltaTime / 1000;

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

if (false) {

const canvas = document.getElementById('canvas_main');
const ctx = canvas.getContext('2d');
const w = canvas.width;
const h = canvas.height;
//let speedTimeout;
let offset = 0;
let offsetSpeed = 0;
document.getElementsByTagName('body').item(0).onkeypress = speedUp;
document.getElementsByTagName('body').item(0).onclick = speedUp;

function speedUp() {
  if (offsetSpeed === 0) {
    offset = 0;
  }
  offsetSpeed = 0.0005;
  //clearTimeout(speedTimeout);
  //speedTimeout = setTimeout(() => {offset = 0; offsetSpeed = 0}, 10000);
}

function textAtPointAndAngle(context, x, y, angle, text) {
  context.save();
  context.translate(x, y);
  context.rotate(-angle);
  context.fillText(text, 0, 0);
  context.restore();
}

function getDayFraction() {
  let curDate = new Date();
  let startOfDay = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate())
  offset += offsetSpeed;
  let snailFraction = 2 * (curDate - startOfDay) / 86400000;
  while  (snailFraction > 1) {snailFraction -= 1;}
  return snailFraction;
}

ctx.clearRect(0, 0, w, h);

let cmd = 'L--L--L'.split``;



let deltaAngle = Math.PI / 3;

let iterations = 2;
let edgeCount;
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
let scale = 30;
ctx.font = '8px Courier';
let lineText = 'asterisk_snail';
var text = ctx.measureText(lineText);
let snail = '?';
scale = text.width;
ctx.textAlign = 'center';
//ctx.textBaseline = 'middle';
ctx.textBaseline = 'bottom';
let snailFraction = 0;
let snailStep = 0.0001;
let snailAngle = 0;
function draw() {
	let x = 330;
	let y = 20;

  offset += offsetSpeed;
  let dayFraction = getDayFraction();
  let snailFraction = dayFraction + offset;
  while (snailFraction > 1) {snailFraction -= 1;}
  let diff = snailFraction - dayFraction;
  if (diff < 0 && diff > -0.005) {
    offset = 0;
    offsetSpeed = 0;
  }

  //snailFraction += snailStep;
  //if (snailFraction > 1.0) {snailFraction = 0;}
	let angle = -Math.PI / 3;
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  //ctx.arc(x, y, 5, 0, Math.PI*2);
  ctx.fill();

  //ctx.beginPath();
  //ctx.moveTo(x, y);
  let seenEdges = 0;
  cmd.forEach(v => {
    switch (v) {
      case 'L':
        let h = 360 * seenEdges / edgeCount;
        let thisFraction = seenEdges / edgeCount;
        seenEdges++;
        let markHour = false;
        if (seenEdges % 4 === 0) {
          markHour = true;
        }
        let nextFraction = seenEdges / edgeCount;
        if (snailFraction >= thisFraction && snailFraction < nextFraction) {
          let lineFraction = (snailFraction - thisFraction) / (nextFraction - thisFraction);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.font = '14px Courier';
          snailAngle += (angle - snailAngle) * 0.2;
          textAtPointAndAngle(ctx, x + lineFraction * scale * Math.cos(angle), y - lineFraction * scale * Math.sin(angle) , snailAngle, snail);
          snailDrawn = true;
        }
        ctx.fillStyle = `hsl(${h},100%,70%)`;
        ctx.strokeStyle = `hsl(${h},100%,70%)`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '8px Courier';
        textAtPointAndAngle(ctx, x, y, angle, lineText);
        x += scale * Math.cos(angle);
        y -= scale * Math.sin(angle);
        if (markHour) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.stroke();
          let hourNum = seenEdges / 4;
          //                   1   2 3   4   5   6   7    8   9   10    11  12
          let angleAdjust = [0,2/3,0,2/3,1/3,2/3,2/3,-2/3,0/3,-1/3,-1/3,-1/3,-1/3];
          ctx.font = '12px Courier';
          textAtPointAndAngle(ctx, x, y, angle + angleAdjust[hourNum] * Math.PI,
          `  ${hourNum}`);
        }
        //ctx.lineTo(x, y);
        //ctx.stroke();
        //ctx.beginPath();
        //ctx.moveTo(x, y);
        break;
      case '+':
        angle += deltaAngle;
        break;
      case '-':
        angle -= deltaAngle;
    }
  });

  //ctx.stroke();
  window.requestAnimationFrame(draw);
}
draw();

}
