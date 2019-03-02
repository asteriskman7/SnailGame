'use strict';

class Walk {
  constructor(canvas, snailImage) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');

    this.mousePressed = undefined;
    this.mousePos = undefined;

    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);

    this.snailImage = snailImage;

    this.canvas.style.display = 'inline';
    this.state = {};
    this.t = 0;
    this.state.coins = 0;
    this.snailSpeed = 0.5;
    this.groundSpeed = 4;
    this.snailDir = -1;
    this.snailSize = 1;
    this.snailMinSize = 0.8;
    this.snailGrowRate = 0.002;
    this.xperSecond = this.snailGrowRate * this.snailImage.width * 0.5;
    this.xpos = 0;
    this.coins = [];

    this.buttons = new Buttons(this.canvas, {
      font: '10 Courier',
      fgcolor: 'red',
      bgcolor: 'grey',
      strokecolor: 'black'
    });

    this.buttons.add(canvas.width - 100, 0, 100, 30, 'hello', () => {console.log('button pressed');});
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
  addCoins(v, z) {
    const coinScore = v * Math.random();
    if (coinScore > 1.5) {
      this.coins.push({x: this.xpos, z: z, val: 1});
    }
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
        this.ctx.fillText(v.val, this.canvas.width - (this.xpos * speed - v.x), y);
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
  draw(timestamp, deltaTime) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.font = '20 Courier';
    ctx.fillStyle = 'red';
    ctx.fillText(this.t, 30, 30);
    ctx.fillText(this.xpos, 30, 60);
    ctx.fillText(this.state.coins, 30, 90);

    this.drawSky();
    this.drawMountains();
    this.drawCoins(2);
    this.drawHills();
    this.drawCoins(1);
    this.drawGrass();
    this.drawCoins(0);
    this.drawSnail(this.t);
    this.buttons.draw(this.mousePos);

    ctx.restore();
  }
  update(timestamp, deltaTime) {
    this.getCoins();
    if (this.mousePressed !== undefined) {
      const clicked = this.buttons.click(this.mousePressed);
      if (!clicked) {
        this.t += this.snailSpeed * deltaTime / 1000;
        const v = Math.max(0, this.snailSpeed * this.groundSpeed * Math.sin(this.t * 16));
        this.addCoins(v, 0);
        this.addCoins(v, 1);
        this.addCoins(v, 2);
        this.xpos += v;
      }
    }
  }
  feed(val) {
    this.state.coins += val;
  }
}

if (false) {

const canvas = document.getElementById('cmain');
const ctx = canvas.getContext('2d', {alpha: false});
const imgSnail = document.getElementById('img_snail');


function getTimeString(t) {
  let [h,m] = t.toLocaleTimeString().split` `[0].split`:`;
  let baseString = `${h}:${m}`;
  let displayString = baseString;
  return displayString;
}

function drawSky() {
  ctx.fillStyle = '#3998af';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrass() {
  ctx.fillStyle = 'green';
  ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);

  let noiseConfig = [
    {a: 128, s: 1/8},
    {a: 64,  s: 1/4},
    {a: 16,  s: 1/2},
    {a: 8,  s: 1},
    {a: 4,   s: 2},
    {a: 2,  s: 4},
  ];

  const rate = 1.0;
  const seed = 0;
  const xscale = 10;
  const yscale = 0.6;

  for (let i = 0; i < canvas.width; i++) {
    let c = yscale * fnoise((xpos*rate + i)/xscale, noiseConfig) - 20;

    ctx.strokeStyle = `hsl(123, ${c}%, 33%)`;
    ctx.beginPath();
    ctx.moveTo(i, canvas.height * 0.8);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
}

let minuteMarkers = [];
let lastMarkerMinute = -1;
function drawMinuteMarkers() {
  let curTime = new Date();
  if (curTime.getMinutes() !== lastMarkerMinute) {
    lastMarkerMinute = curTime.getMinutes();
    minuteMarkers.push({t: getTimeString(curTime), x: canvas.width});
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = '40px Sans';
  ctx.fillStyle = 'black';
  for (let i = 0; i < minuteMarkers.length; i++) {
    ctx.strokeStyle = 'black';
    ctx.strokeText(minuteMarkers[i].t, minuteMarkers[i].x, canvas.height - 0);
    ctx.fillStyle = 'white';
    ctx.fillText(minuteMarkers[i].t, minuteMarkers[i].x, canvas.height - 0);
  }
}

function moveMinuteMarkers(dist) {
  for (let i = 0; i < minuteMarkers.length; i++) {
    minuteMarkers[i].x -= dist;
  }
  minuteMarkers = minuteMarkers.filter(v => {
    return v.x > 0;
  });
}


let snailDir = -1;
let snailSize = 1;
let snailMinSize = 0.8;
let snailGrowRate = 0.002;
let xperSecond = snailGrowRate * imgSnail.width * 0.5;
function drawSnail(s) {
  let p = s / 60;
  let theta = p * Math.PI * 2 * 16;
  let f = 0.2;
  if (snailDir > 0) {
    snailSize += snailGrowRate;
    if (snailSize >= 1) {
      snailSize = 1;
      snailDir = -1;
    }
  } else {
    snailSize -= snailGrowRate;
    if (snailSize <= snailMinSize) {
      snailSize = snailMinSize;
      snailDir = 1;
    }
  }
  let w = imgSnail.width * snailSize;
  ctx.drawImage(imgSnail, 40, 110, w, imgSnail.height);
  if (snailDir < 0) {
    xpos += snailGrowRate * imgSnail.width;
    moveMinuteMarkers(snailGrowRate * imgSnail.width);
  }
}

function drawHills() {
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
  let firstHeight = yscale * fnoise((xpos*rate + 0)/xscale, noiseConfig) + 120;
  ctx.moveTo(0, firstHeight);
  let lastHeight;
  for (let i = 1; i < canvas.width; i++) {
    let height = yscale * fnoise((xpos*rate + i)/xscale, noiseConfig) + 120;
    lastHeight = height;
    ctx.lineTo(i, height);
  }
  ctx.lineTo(canvas.width+10, lastHeight);
  ctx.lineTo(canvas.width+10, canvas.height+10);
  ctx.lineTo(-10, canvas.height + 10);
  ctx.lineTo(-10, firstHeight);
  ctx.fillStyle = '#0a5410';
  ctx.fill();
  ctx.strokeStyle = '#073b0b';
  ctx.stroke();
}

function drawMountains() {
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
  let firstHeight = yscale * fnoise((xpos*rate + 0 + seed)/xscale, noiseConfig) + 80;
  ctx.moveTo(0, firstHeight);
  let lastHeight;
  for (let i = 1; i < canvas.width; i++) {
    let height = yscale * fnoise((xpos*rate + i + seed)/xscale, noiseConfig) + 80;
    lastHeight = height;
    ctx.lineTo(i, height);
  }
  ctx.lineTo(canvas.width+10, lastHeight);
  ctx.lineTo(canvas.width+10, canvas.height+10);
  ctx.lineTo(-10, canvas.height + 10);
  ctx.lineTo(-10, firstHeight);
  ctx.fillStyle = 'grey';
  ctx.fill();
  ctx.strokeStyle = '#505050';
  ctx.stroke();
}

let xpos = 0;
function draw() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let curTime = new Date();

  drawSky();
  drawMountains();
  drawHills();
  drawGrass();
  drawMinuteMarkers();
  drawSnail(curTime.getSeconds() + curTime.getMilliseconds() / 1000);

  requestAnimationFrame(draw);
}
draw();

}
