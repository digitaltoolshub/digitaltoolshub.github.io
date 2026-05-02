let size = 2;
let offset = (size - 1) / 2;
console.log("2x2 positions:");
for(let x=0; x<size; x++) {
  for(let y=0; y<size; y++) {
    for(let z=0; z<size; z++) {
       console.log(x - offset, y - offset, z - offset);
    }
  }
}
