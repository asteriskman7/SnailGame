'use strict';

function rnd(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function pnoise(x, offset) {
    offset = offset|0;
    var x0 = Math.floor(x);
    var x1 = x0 + 1;
    var r0 = rnd(x0+offset);
    var r1 = rnd(x1+offset);
    var dx = x - x0;
    var rx = (r1 - r0) * dx + r0;
    return rx;
}

function fnoise(x,config) {
    var r=0;
    for (var i = 0; i < config.length; i++) {
        var c = config[i];
        var ri = c.a * pnoise(x * c.s, c.s);
        r += ri;
    }
    return r;
}
