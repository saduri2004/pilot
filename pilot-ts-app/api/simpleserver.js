const http = require('http');

http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(3004, 'localhost', () => {
  console.log('Server running at http://localhost:3004/');
});