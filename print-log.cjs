const fs = require('fs');
const content = fs.readFileSync('test-results.log', 'utf8');

// Parse log file contents
const lines = content.split('\n');
let currentPharm = '';
const results = {};

for (const line of lines) {
  if (line.startsWith('Testing [')) {
    currentPharm = line.substring(line.indexOf(']:') + 3).trim();
    results[currentPharm] = { q1: 'NOT RUN', q2: 'NOT RUN', coords: 'N/A' };
  } else if (line.includes('SUCCESS (Q1)')) {
    results[currentPharm].q1 = 'SUCCESS';
    const match = line.match(/SUCCESS \(Q1\): ([^\(]+)/);
    if (match) results[currentPharm].coords = match[1].trim();
  } else if (line.includes('FAILED (Q1)')) {
    results[currentPharm].q1 = 'FAILED';
  } else if (line.includes('SUCCESS (Q2)')) {
    results[currentPharm].q2 = 'SUCCESS';
    const match = line.match(/SUCCESS \(Q2\): ([^\(]+)/);
    if (match) results[currentPharm].coords = match[1].trim();
  } else if (line.includes('FAILED (Q2)')) {
    results[currentPharm].q2 = 'FAILED';
  }
}

console.log('--- RECAP ---');
for (const [pharm, data] of Object.entries(results)) {
  console.log(`${pharm}: Q1=${data.q1}, Q2=${data.q2}, Coords=${data.coords}`);
}
console.log('-------------');
