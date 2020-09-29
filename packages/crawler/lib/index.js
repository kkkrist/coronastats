'use strict'

const crawler = require('./crawler')
const fetch = require('node-fetch')
require('dotenv').config()

crawler()
  .then(data =>
    fetch(`${process.env.API_URL}/${process.env.API_COL}`, {
      body: JSON.stringify(data),
      headers: {
        Authorization: `token ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
  )
  .then(res => console.log(res.url, res.status, res.statusText))
  .catch(console.error)
