var fs = require('fs'),
    http = require('http');

function sendStaticFile(res, filepath) {
    fs.readFileSync(__dirname + '/' + filepath, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            res.log(JSON.stringify(err));
        }
        res.write(data);
    });
}

const requestListener = function (request, response) {
    const { headers, method, url } = request;
    console.log(method, url);
    let body = [];
    request.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        if (method == "GET") {
            response.writeHead(200);
            sendStaticFile(response, 'index.html');
            sendStaticFile(response, 'styles.css');
            response.end();
        }
        if (method == "POST") {
            response.writeHead(200);
            response.end(body);
        }
    });
}

const server = http.createServer(requestListener);
server.listen(3000);