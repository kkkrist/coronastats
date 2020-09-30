const fl = require('./fl')
require('dotenv').config()

fl().then(
  res => console.log(res.url, res.status, res.statusText),
  console.error
)
