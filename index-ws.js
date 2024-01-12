const express = require("express");
const server = require("http").createServer();

const app = express();

app.get("/", function (req, res) {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, function () {
  console.log("server started on port 3000");
});

/** Begin websocket */

const WebSocketServer = require("ws").Server;

const wss = new WebSocketServer({ server: server });

// Listener on the signal interrupt event (CTRL+C)
// server.close does:
//    - stops server from accepting new connections
//    - keeps current connections alive
//    - when all connections are closed -> server will emit a `close` event
//    - when `close` event is emitted -> callback is called
process.on("SIGINT", () => {
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    shutdownDB();
  });
});

wss.on("connection", function connection(ws) {
  const numClients = wss.clients.size;
  console.log("Clients connected", numClients);

  wss.broadcast(`Current visitors: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send("Welcome to my server");
  }

  db.run(`INSERT INTO visitors (count, time)
    VALUES (${numClients}, datetime('now'))
  `);

  ws.on("close", function close() {
    console.log("A client has disconnected");
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

/** END WEBSOCKETS */

/** START DATABASE */

const sqlite = require("sqlite3");

const db = new sqlite.Database(":memory:");

db.serialize(() => {
  // need to use db.run() whenever you want to run a SQL command
  db.run(`
    CREATE TABLE visitors (
      count INTEGER,
      time TEXT
    )
  `);
});

function getCounts() {
  db.each("SELECT * FROM visitors", (err, row) => {
    console.log(row);
  });
}

function shutdownDB() {
  getCounts();
  console.log("shutting down db");
  db.close();
}
