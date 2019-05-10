const axios = require("axios");
const db = require("../database/dbConfig");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const secrets = require("./secrets");

const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

async function register(req, res) {
  // implement user registration
  function findByID(id) {
    return db("users")
      .where({ id })
      .first();
  }

  async function add(user) {
    const [id] = await db("users").insert(user);
    return findByID(id);
  }

  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 10);
  user.password = hash;

  add(user)
    .then(done => {
      res.status(201).json(done);
    })
    .catch(error => {
      res
        .status(500)
        .json({ message: "There was an error in registering this dad" });
    });
}

function login(req, res) {
  // implement user login
  function findBy(filter) {
    console.log(filter);
    return db("users").where(filter);
  }

  let { username, password } = req.body;
  console.log(req.body);
  findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);
        res
          .status(200)
          .json({ message: `Welcome to the party, ${user.username}`, token });
      } else {
        res.status(401).json({ message: "Your login is incorrect" });
      }
    })
    .catch(error => {
      res.status(500).json({
        message: "Something went wrong when logging in."
      });
    });
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const options = {
    expiresIn: "2h"
  };
  return jwt.sign(payload, secrets.jwtSecret, options);
}
