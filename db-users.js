const { MongoClient } = require('mongodb');
const shortId = require('shortid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { TEXTS } = require('./constants');

const saltRounds = 12;
const uri = process.env.DB_CONN_STRING;

const dbName = 'users';

const registerCompany = async company => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  let { name } = company;
  let newCompany = {};
  try {
    await client.connect();
    const db = client.db(dbName);
    let companyResult = await db
      .collection('companies')
      .findOne({ name: name });
    if (companyResult) {
      newCompany = companyResult;
    } else {
      const insertResult = await db
        .collection('companies')
        .insertOne({ name, _id: shortId.generate() });
      newCompany = { name, _id: insertResult.insertedId };
    }
  } catch (error) {
    console.log('error', error);
  } finally {
    await client.close();
  }
  return newCompany;
};

const getCompany = async query => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  let company = {};
  try {
    await client.connect();
    const db = client.db(dbName);
    let companyResult = await db.collection('companies').findOne(query);
    if (companyResult) {
      company = companyResult;
    }
  } catch (error) {
    console.log('error', error);
  } finally {
    await client.close();
  }
  return company;
};

const registerUser = async user => {
  let {
    company_id,
    company_name,
    first_name,
    last_name,
    email,
    password,
  } = user;
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    let company = {};
    if (company_id) {
      company = await getCompany({ _id: company_id });
    } else if (company_name) {
      company = await registerCompany({ name: company_name });
    } else {
      company = await registerCompany({
        name: process.env.DEFAULT_COMPANY_NAME,
      });
    }
    await client.connect();
    const db = client.db(dbName);
    let date = new Date();
    let hashedPassword = await bcrypt.hash(password, saltRounds);
    let newUser = {
      company_id: company._id,
      first_name,
      last_name,
      email,
      created_at: date,
      updated_at: date,
      _id: shortId.generate(),
    };
    await db.collection('users').insertOne({
      ...newUser,
      hash: hashedPassword,
    });
    await client.close();
    return newUser;
  } catch (error) {
    console.log('error', error);
    await client.close();
  }
};

const validateUser = async ({ email, password, company_id }) => {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  if (!company_id) {
    let company = await registerCompany({
      name: process.env.DEFAULT_COMPANY_NAME,
    });
    company_id = company._id;
  }
  const noValid = {
    valid: false,
    message: TEXTS.NO_VALID_USER,
  };
  try {
    client.connect();
    let user = await client
      .db(dbName)
      .collection('users')
      .findOne({ email, company_id });
    client.close();
    if (!user) {
      return noValid;
    }
    let comparePassword = await bcrypt.compare(password, user.hash);
    if (!comparePassword) return noValid;
    let { hash, ...userData } = user;
    return {
      valid: true,
      user: userData,
      token: jwt.sign(user, process.env.SECRET),
    };
  } catch (error) {
    console.log('error', error);
    client.close();
  }
};

module.exports = { registerCompany, getCompany, registerUser, validateUser };
