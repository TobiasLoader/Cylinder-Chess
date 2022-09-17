var fs = require('fs'),
    http = require('http');

async function sendStaticFiles(res, filepaths) {
    for (var filepath of filepaths) {
        var file;
        try {
            file = fs.readFileSync(__dirname + '/' + filepath);
            res.write(file);
            console.log(filepath + ' found');

        } catch (err) {
            res.log(JSON.stringify(err));
            console.log(filepath + ' not found');
        }
    }
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
            sendStaticFiles(response, ['index.html', 'styles.css']);
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