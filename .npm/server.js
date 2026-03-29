const http = require('http');
const fs = require('fs');
const port = process.argv[2] || 8080;
const bind = process.argv[3] || '0.0.0.0';
http.createServer((req, res) => {
    if (req.url.includes('/sub') || req.url.includes('/ad3daddc-990d-4d82-87a3-bd85b5b1057d')) {
        res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
        try { res.end(fs.readFileSync('/home/runner/work/sb-nodejs-komari/sb-nodejs-komari/.npm/sub.txt', 'utf8')); } catch(e) { res.end('error'); }
    } else { res.writeHead(404); res.end('404'); }
}).listen(port, bind, () => console.log('HTTP on ' + bind + ':' + port));
