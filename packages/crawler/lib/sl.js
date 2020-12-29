'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')

const numberStrings = {
  ein: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  'f&uuml;nf': 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10
}

const getInt = val => {
  if (val !== null && val !== undefined && !isNaN(val)) {
    return Number(val)
  }

  const key = Object.keys(numberStrings).find(str => val.startsWith(str))

  if (key) {
    return numberStrings[key]
  }

  throw new Error(`Couldn't convert string to number: ${val}`)
}

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom
      .fromURL(
        'https://www.schleswig-flensburg.de/Leben-Soziales/Gesundheit/Coronavirus',
        {
          userAgent: fetchOptions.headers['user-agent']
        }
      )
      .then(dom => {
        const content = dom.window.document
          .querySelector('div#read')
          .textContent.replace(/\u00A0/g, ' ')

        const dateMatch = content.match(
          /Stand: ([0-9]+)\.([0-9]+)\.([0-9]+),\s(([0-9]+):([0-9]+))/
        )

        const infectedMatch = content.match(
          /nachgewiesenen Infizierten .* auf ([0-9.]+)/
        )

        const recoveredMatch = content.match(/Wieder genesen sind davon ([0-9.]+) Personen/)

        const quarantinedMatch = content.match(
          /In Quarantäne befinden sich derzeit ([0-9.]+) Personen/
        )

        const deathsMatch = content.match(/Die Gesamtzahl der Verstorbenen beträgt (.*)/)

        if (!dateMatch) {
          return reject(new Error("Couldn't parse date"))
        }

        if (!infectedMatch) {
          return reject(new Error("Couldn't parse infected"))
        }

        if (!recoveredMatch) {
          return reject(new Error("Couldn't parse recovered"))
        }

        if (!deathsMatch) {
          return reject(new Error("Couldn't parse deaths"))
        }

        if (!quarantinedMatch) {
          return reject(new Error("Couldn't parse quarantined"))
        }

        const entry = {
          areacode: 'sl',
          date: new Date(
            `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]} ${dateMatch[4]}`
          ).toISOString(),
          deaths: getInt(deathsMatch[1]),
          infected: Number(infectedMatch[1].replace('.', '')),
          quarantined: Number(quarantinedMatch[1].replace('.', '')),
          recovered: Number(recoveredMatch[1].replace('.', ''))
        }

        resolve([
          {
            ...entry,
            active: entry.infected - entry.recovered - entry.deaths
          }
        ])
      }, reject)
  })
