const nano = require('nano')

const fl = require('./fl')
const rz = require('./rz')
const sl = require('./sl')

require('dotenv').config()

const db = nano(process.env.COUCHDB_URI)

const mapper = ({ col, stats }) =>
  db.find({ selector: { area: col } }).then(({ docs }) =>
    db.bulk({
      docs: stats.map(stat => ({
        ...(docs.find(doc => doc.date === stat.date.toISOString()) || {}),
        ...stat,
        area: col,
        last_modified: new Date().toISOString()
      }))
    })
  )

fl()
  .then(mapper)
  .then(console.log)
  .catch(console.error)
rz()
  .then(mapper)
  .then(console.log)
  .catch(console.error)
sl()
  .then(mapper)
  .then(console.log)
  .catch(console.error)
