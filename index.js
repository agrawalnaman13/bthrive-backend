const config = require("config");
const dbConnect = require("./dbConnection");
const app = require("./app.js");
const fs = require("fs");
const http = require("http");
const https = require("https");

if (!config.get("jwtprivatekey")) {
  console.error("FATAL ERROR: jwtprivatekey is not defined");
  process.exit(1);
}
dbConnect();

const port = process.env.PORT || 3003;

// let server;
// if (process.env.NODE_ENV === "development") {
//   server = http.createServer(app);
// } else {
//   var privateKey = fs.readFileSync("./sslcert/privateKey.pem");
//   var certificate = fs.readFileSync("./sslcert/certificate.pem");
//   var credentials = { key: privateKey, cert: certificate };
//   server = https.createServer(credentials, app);
// }
app.listen(port, () => console.log(`listening on port ${port}...`));
