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
      hovercolor: 'green',
      strokecolor: 'red',
      hover: false,
      shape: 'rect',
      ...options};
  }
  add(x, y, w, h, text, callback, options) {
    let comboOptions = {...this.options,...options};
    let newButton;
    switch (comboOptions.shape) {
      case 'rect':
        newButton = {shape: {type: comboOptions.shape, x1: x, y1: y, x2: x + w, y2: y + h, w, h}, text, callback, options: comboOptions, hovering: false};
        break;
      case 'circle':
        newButton = {shape: {type: comboOptions.shape, x, y, r: w}, text, callback, options: comboOptions, hovering: false};
        break;
      default:
        throw 'bad shape';
    }
    this.buttons.push(newButton);
    return newButton;
  }
  click(event) {
    if (event.consumed) {return false;}
    event.consumed = true;
    const c = this._getCursorPosition(event);
    let clicked = false;
    this.buttons.forEach( v => {
      const hover = v.options && v.options.hover;
      if (!hover && this._isPointInShape(c, v.shape)) {
        v.callback();
        clicked = true;
      }
    });
    return clicked;
  }
  hover(event) {
    const c = this._getCursorPosition(event);
    let hovered = false;
    this.buttons.forEach( v => {
      const hover = v.options && v.options.hover;
      v.hovering = this._isPointInShape(c, v.shape);

      if (hover && v.hovering) {
        v.callback();
        hovered = true;
      }
    });
    return hovered;
  }
  _isPointInRect(pt, rect) {
    return pt.x >= rect.x1 && pt.x <= rect.x2 && pt.y >= rect.y1 && pt.y <= rect.y2;
  }
  _isPointInCircle(pt, circle) {
    const dx = pt.x - circle.x;
    const dy = pt.y - circle.y;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }
  _isPointInShape(pt, shape) {
    switch (shape.type) {
      case 'rect':
        return this._isPointInRect(pt, shape);
      case 'circle':
        return this._isPointInCircle(pt, shape);
      default:
        throw 'bad shape';
    }
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
      const options = v.options; //{...this.options, ...v.options};

      ctx.fillStyle = v.hovering ? options.hovercolor : options.bgcolor;
      ctx.font = options.font;

      let textx;
      let texty;

      switch (v.shape.type) {
        case 'rect':
          ctx.fillRect(v.shape.x1, v.shape.y1, v.shape.w, v.shape.h);
          textx = v.shape.x1 + v.shape.w * 0.5;
          texty = v.shape.y1 + v.shape.h * 0.5;
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(v.shape.x, v.shape.y, v.shape.r, 0, Math.PI * 2);
          ctx.fill();
          textx = v.shape.x;
          texty = v.shape.y;
          break;
        default:
          throw 'bad shape';
      }

      ctx.fillStyle = options.fgcolor;
      ctx.fillText(v.text, textx, texty);

      //if (v.hovering) {     }

      ctx.strokeStyle = options.strokecolor;
      ctx.lineWidth = v.hovering ? 3 : 1;
      switch (v.shape.type) {
        case 'rect':
          ctx.strokeRect(v.shape.x1, v.shape.y1, v.shape.w, v.shape.h);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(v.shape.x, v.shape.y, v.shape.r, 0, Math.PI * 2);
          ctx.stroke();
          break;
        default:
          throw 'bad shape';
      }

    });

    ctx.restore();
  }
}
