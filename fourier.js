'use strict';

class Fourier {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.canvas.style.display = 'inline';
    this.state = {};
    this.t = 0;
    this.snailSpeed = 1;
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
    ctx.fillStyle = 'red';
    ctx.font = '30 Courier';
    ctx.fillText('Fourier', 10, 10);

    ctx.fillRect((this.t*100) % 100, 100, 10, 10);

    ctx.restore();
  }
  update(timestamp, deltaTime) {
    this.t += this.snailSpeed * deltaTime / 1000;
  }
}
