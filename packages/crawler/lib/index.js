const fetch = require('node-fetch')
const fl = require('./fl')
const rz = require('./rz')
const sl = require('./sl')

require('dotenv').config()

const mapper = ({ col, stats }) =>
  fetch(`${process.env.API_URL}/${col}`, {
    body: JSON.stringify(stats),
    headers: {
      Authorization: `token ${process.env.API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  }).then(
    res => console.log(res.url, res.status, res.statusText),
    console.error
  )

fl().then(mapper)
rz().then(mapper)
sl().then(mapper)
