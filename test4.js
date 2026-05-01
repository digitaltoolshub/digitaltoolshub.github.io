const Cube = require('cubejs');
Cube.initSolver();

let charMap = {
    R: 'R', L: 'L', U: 'U', D: 'D', F: 'F', B: 'B'
};

let getColor = (faceName) => faceName;

let stateStr = "";

// U face
for(let z=0; z<=2; z++) { for(let x=0; x<=2; x++) stateStr += charMap[getColor('U')]; }
// R face
for(let y=2; y>=0; y--) { for(let z=2; z>=0; z--) stateStr += charMap[getColor('R')]; }
// F face
for(let y=2; y>=0; y--) { for(let x=0; x<=2; x++) stateStr += charMap[getColor('F')]; }
// D face
for(let z=2; z>=0; z--) { for(let x=0; x<=2; x++) stateStr += charMap[getColor('D')]; }
// L face
for(let y=2; y>=0; y--) { for(let z=0; z<=2; z++) stateStr += charMap[getColor('L')]; }
// B face
for(let y=2; y>=0; y--) { for(let x=2; x>=0; x--) stateStr += charMap[getColor('B')]; }

console.log("My Solved String:");
console.log(stateStr.match(/.{9}/g));

let c = Cube.fromString(stateStr);
console.log("Is Solved?", c.isSolved());

