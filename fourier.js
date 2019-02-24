'use strict';

class Fourier {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.state = {};
    this.angle = 0;
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
      ctx.beginPath();
      ctx.arc(cx, cy, unit.mag, 0, Math.PI * 2);
      ctx.stroke();
      cx += dx;
      cy += dy;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.points.length >= this.units.length) {
      this.points = [];
    }
    this.points.push({x: cx, y: cy});
    this.parent.feed(1);

    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    const points = this.points;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    //test draw a letter
    /*
    const lp = letterPoints.i;
    const s = 25;
    ctx.beginPath();
    ctx.moveTo(lp[0][0]*s, lp[0][1]*s);
    for (let i = 1; i < lp.length; i++) {
      ctx.lineTo(lp[i][0]*s, lp[i][1]*s);
    }
    ctx.stroke();
    for (let i = 0; i < lp.length; i++) {
      ctx.fillRect(lp[i][0]*s - 5, lp[i][1]*s - 5, 10, 10);
    }
    */

    ctx.restore();
  }
  update(timestamp, deltaTime) {
    //this.angle += this.snailSpeed * deltaTime / 1000;
    this.angle += Math.PI * 2 / this.units.length;
    //this.angle += Math.PI * 2 / 200;
  }
  setLevel(n) {
    const points = [];

    /*
    const pointCount = 200;
    for (let i = 0; i < pointCount; i++) {
      if ((i % 50) >= 25) {
        points.push([i, pointCount]);
      } else {
        points.push([i, -pointCount]);
      }
    }
    */

    const msg = 'hiaeiiaeh';
    let dx = -40;
    for (let j = 0; j < msg.length; j++) {
      const c = msg[j];
      const lp = letterPoints[c];
      const s = 7;
      for (let i = 0; i < lp.length; i++) {
        points.push([dx*s + lp[i][0]*s,lp[i][1]*s]);
      }
      dx += 10;
    }



    const factor = 2;
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
