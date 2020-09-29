const http = require('http')
const MongoClient = require('mongodb').MongoClient

require('dotenv').config()
const port = process.env.PORT || 3000

if (!process.env.MONGODB_URI) {
  throw new Error('No mongodb ressource provided!')
}

if (!process.env.AUTH_TOKEN) {
  throw new Error('No auth token provided!')
}

const getCollection = async name => {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI, {
      useUnifiedTopology: true
    })
    const db = await client.db('coronastats')
    return await db.collection(name)
  } catch (error) {
    throw error
  }
}

const server = http.createServer(async (req, res) => {
  const colName = req.url
    .split('')
    .filter(char => /\w/.test(char))
    .join('')

  if (
    !colName ||
    (req.method === 'GET' && req.headers['accept'] !== 'application/json') ||
    (req.method === 'POST' &&
      req.headers['content-type'] !== 'application/json')
  ) {
    res.statusCode = 400
    return res.end()
  }

  if (req.headers.origin) {
    res.setHeader('access-control-allow-origin', req.headers.origin)
  }

  if (req.method === 'GET') {
    try {
      const col = await getCollection(colName)
      const data = await col
        .find()
        .sort({ date: -1 })
        .toArray()
      console.info(`${data.length} entries read from ${colName}`)
      res.setHeader('content-type', 'application/json')
      return res.end(JSON.stringify(data))
    } catch (error) {
      console.error(error)
      res.statusCode = 500
      return res.end(error.toString())
    }
  }

  if (
    req.method === 'POST' &&
    req.headers['authorization'] === `token ${process.env.AUTH_TOKEN}`
  ) {
    const body = []

    return req
      .on('data', chunk => {
        body.push(chunk)
      })
      .on('end', async () => {
        try {
          const last_modified = new Date().toISOString()
          const payload = JSON.parse(Buffer.concat(body).toString())
          const col = await getCollection(colName)
          const output = await Promise.all(
            payload.map(entry =>
              col.updateOne(
                { date: entry.date },
                { $set: { last_modified, ...entry } },
                { upsert: true }
              )
            )
          )
          console.info(`${payload.length} entries written to "${colName}"`)
          res.statusCode = 201
          res.end()
        } catch (error) {
          console.error(error)
          res.statusCode = 500
          res.end(error.toString())
        }
      })
  }

  res.statusCode = 404
  return res.end()
})

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
