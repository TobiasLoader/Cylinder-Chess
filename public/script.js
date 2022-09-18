const startgame = document.getElementById("startgame");
startgame.addEventListener("click", function () {
  fetch("/game_init", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'startgame': true })
  }).then(function (response) {
    return response.text();
  }).then(function (data) {
    console.log('startgame body:');
    console.log(data);
  });
});

const joingame = document.getElementById("joingame");
joingame.addEventListener("click", function () {
  fetch("/game_init", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 'joingame': true })
  }).then(function (response) {
    return response.text();
  }).then(function (data) {
    console.log('joingame body:');
    console.log(data);
  });
});