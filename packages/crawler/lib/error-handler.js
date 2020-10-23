'use strict'

const { spawn } = require('child_process')

module.exports = errors => {
  if (!Array.isArray(errors)) {
    errors = [errors]
  }

  errors.forEach(error => console.error(error))

  if (!process.env.ERROR_EMAIL) {
    return console.info('No error email defined!')
  }

  const mail = spawn('mail', ['-s', 'Crawler error', process.env.ERROR_EMAIL])

  mail.on('close', code => {
    console.log(`Mail sent (${code})`)
  })

  mail.stderr.on('data', error => {
    console.error('An error occured while sending mail:', error)
  })

  mail.stdout.on('data', data => {
    console.log('Mail:', data)
  })

  mail.stdin.write(errors.map(error => error.stack).join('\n\n'))
  mail.stdin.end()
}
