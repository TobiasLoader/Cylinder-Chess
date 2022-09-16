var fs = require('fs'),
    http = require('http');

const requestListener = function (req, res) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            console.log(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
}

const server = http.createServer(requestListener);
server.listen(3000);