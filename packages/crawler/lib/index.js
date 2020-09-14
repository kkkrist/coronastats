'use strict'

const crawler = require('./crawler')
const fetch = require('node-fetch')
require('dotenv').config()

crawler()
  .then(data =>
    fetch(`${process.env.JSONBIN_BASEURL}/me/${process.env.JSONBIN_ENDPOINT}`, {
      body: JSON.stringify(data),
      headers: {
        Authorization: `token ${process.env.JSONBIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
  )
  .then(res => console.log(res.url, res.status, res.statusText))
  .catch(console.error)
