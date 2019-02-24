'use strict';

const letterPaths = {
a: 'l 2.95293883,-9.33129 1.0866816,0.0236 2.0079985,6.52009 h -5.126302 5.1026784 l 0.8976937,2.76395',
e: 'v -9.37114 H 5.5458425 0.68487816 v 4.19279 H 5.3955037 0.66817382 v 4.66052 H 5.6126599',
h: 'v -9.83886 4.69392 H 6.1973121 v -4.71062 9.88897',
i: 'H 2.9065561 v -8.8366 H 0.01670434 5.896634 2.9065561 v 8.80319 h 2.9733734'
};

const letterPoints = {};

function pathToPoints(path) {
  const points = [[0,10]];
  let x = 0;
  let y = 10;
  const cmds = path.split` `;
  let curCmd;
  const cmdList = 'lLhHvV';
  //TODO: interpolate between points
  cmds.forEach( cmd => {
    if (cmdList.indexOf(cmd) !== -1) {
      curCmd = cmd;
    } else {
      const [cx,cy] = cmd.split`,`.map( v => parseFloat(v));
      switch (curCmd) {
        case 'L':
          [x,y] = [cx,cy];
          break;
        case 'l':
          [x,y] = [x+cx,y+cy];
          break;
        case 'H':
          x = cx;
          break;
        case 'h':
          x += cx;
          break;
        case 'V':
          y = cx;
          break;
        case 'v':
          y += cx;
          break;
        default:
          throw `unknown cmd ${curCmd}`;
      }
      points.push([x, y]);
    }
  });

  return points;
}

for (let letter in letterPaths) {
  letterPoints[letter] = pathToPoints(letterPaths[letter]);
}
