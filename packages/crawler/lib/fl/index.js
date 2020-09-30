'use strict'

const crawler = require('./crawler')
const fetch = require('node-fetch')

module.exports = () =>
  crawler().then(data =>
    fetch(`${process.env.API_URL}/fl`, {
      body: JSON.stringify(data),
      headers: {
        Authorization: `token ${process.env.API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
  )
