require('dotenv').config();
const express = require('express');
const dbUsers = require('./db-users');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/company', async (req, res) => {
  const newCompany = await dbUsers.registerCompany(req.body);
  res.send(newCompany);
});

app.get('/company', async (req, res) => {
  const company = await dbUsers.getCompany(req.query);
  res.send(company);
});

app.post('/user', async (req, res) => {
  const user = await dbUsers.registerUser(req.body);
  res.send(user);
});

app.post('/validate-user', async (req, res) => {
  const result = await dbUsers.validateUser(req.body);
  res.send(result);
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
