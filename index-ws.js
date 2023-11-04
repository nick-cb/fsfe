const express = require("express");
const server = require("http").createServer();

const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, function () {
  console.log("Server started on port 3000");
});

const WebsocketServer = require("ws").Server;

const wss = new WebsocketServer({ server });

process.on("SIGINT", () => {
	wss.clients.forEach(function(client){
		client.close();
	})

	server.close(() => {
		shutdownDB();
	})
})

wss.on("connection", function (ws) {
  const numClients = wss.clients.size;
  console.log("Clients connected", numClients);

  wss.broadcast(`Current visitor ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send("Welcome to my server");
  }

  db.run(`INSERT INTO visitors (count, time) values (${numClients}, datetime('now'))`)

  ws.on("close", function () {
    wss.broadcast(`Current visitor ${numClients}`);
    console.log("A client has disconnected");
  });
});

wss.broadcast = function (data) {
  wss.clients.forEach(function (client) {
    client.send(data);
  });
};

const sqlite = require("sqlite3");
const db = new sqlite.Database(":memory:");

db.serialize(()=> {
	db.run(`
		CREATE TABLE visitors (
			count 	INTEGER,
			time	TEXT
		)
	`);
})

function getCounts() {
	db.each("SELECT * FROM visitors", (err, row) => {
		console.log(row);
	})
}

function shutdownDB() {
	getCounts();
	console.log("Shutting down db");
	db.close();
}
