const https = require('https');

https.get('https://sites.google.com/view/pharmaciedegarde-lome/tour-de-garde/', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Fetched data length:', data.length);
    console.log('Sample data:', data.substring(0, 500));
  });

}).on('error', (e) => {
  console.error('Error fetching:', e);
});
