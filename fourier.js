'use strict';

class Fourier {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.state = {};
    this.angle = 0;
    this.snailSpeed = 1;
    this.setLevel(4);
    this.loopTime = 5;
    this.lastDrawEdges = 0;
    this.drawLimit = 5;

    this.storedMoveTime = this.loopTime * 1000;
    this.earnFactor = 1;
    this.maxStoredTime = this.loopTime * 1000;
    this.drawEnable = false;
    this.lastMousePos = {clientX: -100, clientY: -100};
    this.mousePos = this.lastMousePos;



    this.mousePressed = undefined;
    //this.mousePos = undefined;
    this.canvas.onmousedown = (e) => this.onmousedown.call(this, e);
    this.canvas.onmouseup = (e) => this.onmouseup.call(this, e);
    this.canvas.onmousemove = (e) => this.onmousemove.call(this, e);
    //this.canvas.onkeypress = (e) => this.onkeypress.call(this, e);

    this.buttons = new Buttons(this.canvas);

    this.buttons.add(0, 0, 100, 30, 'hello', () => {console.log('fourier button');});

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
    if (!this.drawEnable) {return;}
    const ctx = this.ctx;

    ctx.save();

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    //ctx.fillStyle = 'red';
    //ctx.font = '30 Courier';
    //ctx.fillText('Fourier', 10, 10);
    ctx.translate(this.canvas.width * 0.5, this.canvas.height * 0.5);

    //let cx = this.canvas.width * 0.5;
    //let cy = this.canvas.height * 0.5;
    let cx = 0;
    let cy = 0;

    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'RGBA(255,255,255,0.3)';

    this.units.forEach( (unit, i) => {
      //if (i === 0) {return;}
      const angle = unit.freq * this.angle;
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

    if (this.points.length >= this.units.length) {
      this.points = [];
      this.parent.feed(1);
    }
    this.points.push({x: cx, y: cy});

    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    const points = this.points;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.restore();

    this.buttons.draw(this.mousePos);
  }
  update(timestamp, deltaTime) {
    const hovered = this.buttons.hover(this.mousePos);

    if (this.mousePos.clientX !== this.lastMousePos.clientX || this.mousePos.clientY !== this.lastMousePos.clientY) {
      this.storedMoveTime += this.earnFactor * deltaTime;
    }
    this.storedMoveTime = Math.min(this.maxStoredTime, this.storedMoveTime);
    this.lastMousePos = this.mousePos;
    if (this.storedMoveTime > deltaTime) {
      const stepTime = Math.min(deltaTime, this.storedMoveTime);
      this.angle += Math.PI * 2 / this.units.length;
      this.storedMoveTime -= stepTime;
      this.drawEnable = true;
    } else {
      this.drawEnable = false;
    }

    if (this.mousePressed !== undefined) {
      const clicked = this.buttons.click(this.mousePressed);
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
}
