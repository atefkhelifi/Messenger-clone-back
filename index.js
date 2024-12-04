const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

//Routes
const usersRoutes = require("./routes/user");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
require("dotenv/config");

app.use(cors());
app.options("*", cors());

//Middleware
app.use(express.json());
app.use(authJwt());
app.use(errorHandler);

//Routes

const api = process.env.API_URL;
app.use(`${api}/users`, usersRoutes);

mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "Messenger",
  })
  .then(() => {
    console.log("db connecting");
  })
  .catch((err) => {
    console.log(err);
  });
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.listen(3000, () => {
  console.log(api);
  console.log("Server is running on port 3000");
});
