'use strict';

class Koch {
  constructor(canvas, parent) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.parent = parent;
    this.state = {};
    this.t = 0;
    this.snailSpeed = 1;
    this.setLevel(0);
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

    ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);

    this.ctx.fillStyle = 'red';
    this.ctx.font = '30 Courier';
    this.ctx.fillText('Koch', 10, 10);


    ctx.fillRect(100 * Math.cos(this.t), 100 * Math.sin(this.t), 10, 10);
    ctx.restore();
  }
  update(timestamp, deltaTime) {
    const prevT = this.t;
    this.t += this.snailSpeed * deltaTime / 1000;
    if (this.t % 6.8 < prevT % 6.8) {
      this.parent.feed(10);
    }
  }
  setLevel(n) {
    let cmd = 'L--L--L'.split``;

    let deltaAngle = Math.PI / 3;

    let iterations = n;
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
    this.cmds = cmd;
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
