const fs = require('fs');
const html = fs.readFileSync('rubiks-cube-solver.html', 'utf-8');
const scriptMatch = html.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
if (scriptMatch) {
  try {
    new Function(scriptMatch[1]);
    console.log('Syntax OK');
  } catch (e) {
    console.error('Syntax Error:', e);
  }
} else {
  console.log('No script found');
}
