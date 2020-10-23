'use strict'

const { spawn } = require('child_process')

module.exports = error => {
  console.error(error)

  const mail = spawn('mail', [
    '-s',
    'Crawler error',
    process.env.ERROR_EMAIL
  ])

  mail.on('close', code => {
    console.log(`Mail sent (${code})`)
  })

  mail.stderr.on('data', error => {
    console.error('An error occured while sending mail:', error)
  })

  mail.stdout.on('data', data => {
    console.log('Mail:', data)
  })

  mail.stdin.write(error.toString())
  mail.stdin.end()
}
