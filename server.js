const express = require('express')
const app = express()

app.use(express.static('public'))

app.get('/favicon', (req, res) => {
    res.sendFile('favicon.ico');
})

app.post('/game_init', (req, res) => {
    const { headers, method, url } = req;
    console.log(method, url);
    let body = [];
    req.on('error', (err) => {
        console.error(err);
    }).on('data', (chunk) => {
        body.push(chunk);
    }).on('end', () => {
        body = Buffer.concat(body).toString();
        console.log(JSON.parse(body));
        res.writeHead(200);
        res.end(body);
    });
});

app.listen(3000);