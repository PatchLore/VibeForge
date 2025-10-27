// Quick test to see what /api/status returns
fetch('http://localhost:3000/api/status?taskId=test123')
  .then(r => r.json())
  .then(d => console.log('Status:', JSON.stringify(d, null, 2)))
  .catch(e => console.error('Error:', e));
