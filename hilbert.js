const canvas = document.getElementById('canvas_main');
const ctx = canvas.getContext('2d');
const w = canvas.width;
const h = canvas.height;

let nowTime;
let startTime;
let endTime;
function initTimes() {
  nowTime = new Date();
  startTime = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate(), nowTime.getHours())
  endTime = new Date(startTime.getTime() + 1000 * 60 * 60);
}




function timeLeft(startTime, endTime) {
  //let startTime = new Date(); //now
  //let endTime = new Date(2018, 6, 27, 18);
  let duration = endTime - startTime;
  let curTime = new Date();
  let timeLeft = endTime - curTime;
  let timeSplit = {};
  let timeUnsplit = timeLeft;
  timeSplit.days = Math.floor(timeUnsplit/1000/60/60/24);
  timeUnsplit -= timeSplit.days * 1000 * 60 * 60 * 24;
  timeSplit.hours = Math.floor(timeUnsplit/1000/60/60);
  timeUnsplit -= timeSplit.hours * 1000 * 60 * 60;
  timeSplit.minutes = Math.floor(timeUnsplit/1000/60);
  timeUnsplit -= timeSplit.minutes * 1000 * 60;
  timeSplit.seconds = Math.floor(timeUnsplit/1000);
  timeUnsplit -= timeSplit.seconds * 1000;
  timeSplit.milliseconds = timeUnsplit;
  return {totalTime: duration, timeLeft: timeLeft, timeSplit: timeSplit};
}

function textAtPointAndAngle(context, x, y, angle, text) {
  context.save();
  context.translate(x, y);
  context.rotate(-angle);
  context.fillText(text, 0, 0);
  context.restore();
}

function rndRange(min, max) {
  return Math.random() * (max - min) + min;
}

ctx.clearRect(0, 0, w, h);

let cmd = 'A'.split``;



let deltaAngle = Math.PI / 2;

let iterations = 6;
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
let scale = 10;
ctx.font = '16px Courier';
//let lineText = 'snail';
//var text = ctx.measureText(lineText);
let snail = '?';
//scale = text.width;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

let maxSeenI = 0;
let snailAngle = 0;

function draw() {
  let x = 30;
  let y = 30;
  let angle = 0;

  let tl = timeLeft(startTime, endTime);
  let fraction = 1 - tl.timeLeft / tl.totalTime;
  if (fraction > 1) {
    initTimes();
    tl = timeLeft(startTime, endTime);
    fraction = 1 - tl.timeLeft / tl.totalTime;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  //ctx.lineCap = 'square';

  ctx.beginPath();
  ctx.moveTo(x, y);
  let seenEdges = 0;
  let maxEdge = Math.min(edgeCount, edgeCount * fraction);

  let i = 0;
  while (seenEdges < maxEdge && i < cmd.length) {
    v = cmd[i];
    i++;
    switch (v) {
      case 'F':
        let fs = tl.timeSplit.seconds + tl.timeSplit.milliseconds / 1000;
        //let fm = tl.timeSplit.minutes + fs / 60;
        //let fh = tl.timeSplit.hours + fm / 60;
        let h = 360 * seenEdges / edgeCount;
        let drawTip = false;

        //ctx.fillStyle = `hsl(${h},100%,70%)`;
        ctx.strokeStyle = `hsl(${h},100%,70%)`;
        if ((maxEdge - seenEdges) < 1) {
          length = scale * ((maxEdge - seenEdges));
          drawTip = true;
        } else {
          length = scale;
        }
        x += length * Math.cos(angle);
        y -= length * Math.sin(angle);

        ctx.lineTo(x, y);
        //ctx.lineWidth = (10 * seenEdges / maxEdge) + 0.1;

        //pulse going backwards:
        //ctx.lineWidth = 5 *Math.pow(Math.sin(3.14159/2.0-(fs/60)*3.14159 + 3.14159 * seenEdges / maxEdge),1e4) + 1.5;
        //pulse going forewards
        ctx.lineWidth = 5 *Math.pow(Math.sin(-3.14159/2.0+(fs/60)*3.14159 + 3.14159 * seenEdges / maxEdge),1e4) + 1.5;

        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        if (drawTip) {
          snailAngle += (angle - snailAngle) * 0.2;
          textAtPointAndAngle(ctx, x, y, snailAngle, snail);
        }
        seenEdges++;
        break;
      case '+':
        angle += deltaAngle;
        break;
      case '-':
        angle -= deltaAngle;
    }
  }

  ctx.stroke();
  requestAnimationFrame(draw);
}

initTimes();
//setInterval(draw, 50);
draw();
