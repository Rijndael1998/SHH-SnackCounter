const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require("socket.io");

const app = next({ dev: process.env.NODE_ENV !== 'production' });
const handle = app.getRequestHandler();

const testvalues = [
  {
    "name": "Alice Johnson",
    "value": -120.5
  },
  {
    "name": "Ben Carter",
    "value": 340
  },
  {
    "name": "Chloe Singh",
    "value": -15
  },
  {
    "name": "Daniel O'Neill",
    "value": 0
  },
  {
    "name": "Eva Müller",
    "value": 89.99
  },
  {
    "name": "Faisal Khan",
    "value": -2300
  },
  {
    "name": "Grace Liu",
    "value": 12.5
  },
  {
    "name": "Hugo Martín",
    "value": -0.75
  },
  {
    "name": "Isabella Rossi",
    "value": 760
  },
  {
    "name": "Jack Thompson",
    "value": -450
  },
  {
    "name": "Keiko Tanaka",
    "value": 25.2
  },
  {
    "name": "Liam Murphy",
    "value": 10450.33
  }
];

/**
 * FIXME: This is inaccurate
 */
const snackList = [
  {
    "name": "Coke",
    "value": 0.60,
  },
  {
    "name": "Coke (sugar)",
    "value": 1.00,
  },
  {
    "name": "Crisps",
    "value": 0.40,
  },
  {
    "name": "Other",
    "value": 0.5,
  }
]

function findSnack(name) {
  return snackList.filter(v => v.name == name)[0];
}

function findUser(name) {
  return testvalues.filter(v => v.name == name)[0];
}

function emitLedger(socket) {
  console.log("sending ledger");
  socket.emit("telem", JSON.stringify({
    "k": "ledger",
    "v": testvalues,
  }));
}

function emitSnackList(socket) {
  console.log("sending snack list");
  socket.emit("telem", JSON.stringify({
    "k": "snack",
    "v": snackList,
  }))
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);

  io.on('connection', socket => {
    console.log('Client connected');

    // if the server restarts, the details should be sent to any connected client
    emitLedger(socket); 
    emitSnackList(socket);

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });

    socket.on("ledger", () => {
      emitLedger(socket);
    });

    socket.on("snack", () => {
      emitSnackList(socket);
    });

    socket.on("snack_spent", (e) => {
      console.log("snack_spent");
      const data = JSON.parse(e);
      console.log(data);

      const user = data["userName"]; // string
      const snackCount = data["snackCount"]; // [snack: string, quantity: number]

      // find cost of snack
      let cost = 0;
      snackCount.map(v => {
        const [snack, quantity] = v;
        const snackObj = findSnack(snack);
        cost += snackObj.value * quantity;
      });

      console.log(`applying ${cost} to ${user}`);
      const userObj = findUser(user);
      userObj.value = userObj.value - cost;

      // emit change to everyone
      emitLedger(io);
    });

  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});