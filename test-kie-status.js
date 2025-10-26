const taskId = '7b687ab0631ad60fc4e260938288bc14';
const apiKey = process.env.VIBEFORGE_API_KEY;

fetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
  headers: { "Authorization": `Bearer ${apiKey}` },
})
.then(r => r.json())
.then(data => console.log('Kie.ai Status:', JSON.stringify(data, null, 2)))
.catch(e => console.error('Error:', e));
