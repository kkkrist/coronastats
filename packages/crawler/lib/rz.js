'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom
      .fromURL('https://www.kreis-rz.de/Corona', {
        userAgent: fetchOptions.headers['user-agent']
      })
      .then(dom => {
        const str = dom.window.document.querySelector('h1').nextElementSibling
          .textContent

        const infectedMatch = str.match(/gesamt.*?([0-9]+)/i)

        const recoveredMatch = str.match(/genesen.*?([0-9]+)/)

        const deathsMatch = str.match(/verstorben.*?([0-9]+)/)

        const dateMatch = str.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/)

        if (!infectedMatch || !recoveredMatch || !deathsMatch || !dateMatch) {
          return reject(new Error(`Couldn't parse string "${str}"`))
        }

        const entry = {
          areacode: 'rz',
          date: new Date(
            `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
          ).toISOString(),
          deaths: Number(deathsMatch[1]),
          infected: Number(infectedMatch[1]),
          recovered: Number(recoveredMatch[1])
        }

        resolve([
          {
            ...entry,
            active: entry.infected - entry.recovered - entry.deaths
          }
        ])
      }, reject)
  })
