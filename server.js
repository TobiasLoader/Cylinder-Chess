var fs = require('fs'),
    http = require('http');

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
        console.log(body.toString());
        if (method == "GET") {
            fs.readFile(__dirname + '/index.html', function (err, data) {
                if (err) {
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                    console.log(JSON.stringify(err));
                    return;
                }
                response.writeHead(200);
                response.end(data);
            });
        }
        if (method == "POST") {
            response.writeHead(200);
            response.end(body);
        }
    });
}

const server = http.createServer(requestListener);
server.listen(3000);

