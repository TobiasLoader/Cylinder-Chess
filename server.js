import fs from 'fs';
import { createServer } from 'http';

const requestListener = function (req, res) {
    fs.readFile(__dirname + 'index.file', function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }
        res.writeHead(200);
        res.end(data);
    });
}

const server = createServer(requestListener);
server.listen(8080);