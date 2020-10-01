'use strict'

const jsdom = require('jsdom').JSDOM

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom.fromURL('https://www.kreis-rz.de/Corona').then(dom => {
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
        date: new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`),
        deaths: Number(deathsMatch[1]),
        infected: Number(infectedMatch[1]),
        recovered: Number(recoveredMatch[1])
      }

      resolve({
        col: 'rz',
        stats: [
          {
            ...entry,
            active: entry.infected - entry.recovered - entry.deaths
          }
        ]
      })
    }, reject)
  })
