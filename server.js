var fs = require('fs'),
    http = require('http');

function readStaticFile(res, filepath) {
    fs.readFile(__dirname + '/' + filepath, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            res.log(JSON.stringify(err));
            return false;
        } else return data;
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
        console.log(body);
        body = Buffer.concat(body).toString();
        if (method == "GET") {
            const indexhtml = readStaticFile(response, 'index.html');
            const stylescss = readStaticFile(response, 'styles.css');
            if (indexhtml && stylescss) {
                response.writeHead(200);
                response.write(indexhtml);
                response.write(stylescss);
                response.end();
            }
        }
        if (method == "POST") {
            response.writeHead(200);
            response.end(body);
        }
    });
}

const server = http.createServer(requestListener);
server.listen(3000);