const { createServer } = require("http");
const next = require("next");

const dev = false;
const hostname = "0.0.0.0";
const port = Number(process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`SICOP listo en http://${hostname}:${port}`);
  });
});
