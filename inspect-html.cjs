const https = require('https');

https.get('https://sites.google.com/view/pharmaciedegarde-lome/tour-de-garde/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const index = data.indexOf('☎');
    if (index !== -1) {
      console.log('--- HTML from first ☎ to 1000 characters after ---');
      console.log(data.substring(index, index + 1500));
    }
  });
}).on('error', (e) => {
  console.error(e);
});
