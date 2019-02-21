'use strict';

class Buttons {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.buttons = [];
    this.options = {
      font: '20 Courier',
      fgcolor: 'black',
      bgcolor: 'white',
      strokecolor: 'black',
      ...options};
  }
  add(x, y, w, h, text, callback, options) {
    this.buttons.push({rect: {x1: x, y1: y, x2: x + w, y2: y + h, w, h}, text, callback, options});
  }
  click(event) {
    const c = this._getCursorPosition(event);
    let clicked = false;
    this.buttons.forEach( v => {
      if (this._isPointInRect(c, v.rect)) {
        v.callback();
        clicked = true;
      }
    });
    return clicked;
  }
  _isPointInRect(pt, rect) {
    return pt.x >= rect.x1 && pt.x <= rect.x2 && pt.y >= rect.y1 && pt.y <= rect.y2;
  }
  _getCursorPosition(event) {
    //modified from https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
    if (event === undefined) {
      return {x: Infinity, y: Infinity};
    }
    let rect = this.canvas.getBoundingClientRect();
    let absx = event.clientX - rect.left;
    let absy = event.clientY - rect.top;
    let relx = absx;// * this.canvas.width / this.canvas.style.width.slice(0,-2);
    let rely = absy;// * this.canvas.height / this.canvas.style.height.slice(0,-2);
    return {x: relx, y: rely};
  }
  draw(event) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const c = this._getCursorPosition(event);
    this.buttons.forEach( v => {
      const options = {...this.options, ...v.options};

      const hover = this._isPointInRect(c, v.rect);

      ctx.fillStyle = options.bgcolor;
      ctx.fillRect(v.rect.x1, v.rect.y1, v.rect.w, v.rect.h);

      ctx.font = options.font;
      ctx.fillStyle = options.fgcolor;
      ctx.fillText(v.text, v.rect.x1 + v.rect.w * 0.5, v.rect.y1 + v.rect.h * 0.5);

      if (hover) {

      }

      ctx.strokeStyle = options.strokecolor;
      ctx.lineWidth = hover ? 3 : 1;
      ctx.strokeRect(v.rect.x1, v.rect.y1, v.rect.w, v.rect.h);
    });

    ctx.restore();
  }
}
