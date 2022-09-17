var fs = require('fs'),
    http = require('http');

async function sendStaticFiles(res, filepaths) {
    for (var filepath of filepaths) {
        fs.readFile(__dirname + '/' + filepath, function (err, data) {
            if (res.writeableEnded) {
                if (!err) {
                    res.write(data);
                    console.log(filepath + ' found')
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                    res.log(JSON.stringify(err));
                    console.log(filepath + ' not found')
                }
            }
        });
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
            (async () => {
                response.writeHead(200);
                await sendStaticFiles(response, ['index.html', 'styles.css']);
                response.end();
            })();
        }
        if (method == "POST") {
            response.writeHead(200);
            response.end(body);
        }
    });
}

const server = http.createServer(requestListener);
server.listen(3000);