const fetch = require('node-fetch')
const fl = require('./fl')
const rz = require('./rz')

require('dotenv').config()

Promise.all([fl(), rz()])
  .then(data =>
    Promise.all(
      data.map(({ col, stats }) =>
        fetch(`${process.env.API_URL}/${col}`, {
          body: JSON.stringify(stats),
          headers: {
            Authorization: `token ${process.env.API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          method: 'POST'
        })
      )
    )
  )
  .then(
    responses =>
      responses.forEach(res =>
        console.log(res.url, res.status, res.statusText)
      ),
    console.error
  )
