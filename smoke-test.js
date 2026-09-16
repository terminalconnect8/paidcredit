const http = require('http');
const app = require('./server');

const server = app.listen(0, () => {
  const port = server.address().port;
  http.get({ host: '127.0.0.1', port, path: '/health' }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('HTTP', res.statusCode, data);
      server.close(() => process.exit(res.statusCode === 200 ? 0 : 1));
    });
  }).on('error', (err) => {
    console.error(err);
    server.close(() => process.exit(1));
  });
});
