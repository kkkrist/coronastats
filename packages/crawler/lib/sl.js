'use strict'

const jsdom = require('jsdom').JSDOM

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
        'https://www.schleswig-flensburg.de/Leben-Soziales/Gesundheit/Coronavirus'
      )
      .then(dom => {
        const content = dom.window.document.querySelectorAll('h1 ~ div > p')

        const dateMatch = content[0].textContent.match(
          /Stand ([0-9]+)\.([0-9]+)\.([0-9]+),\s(([0-9]+):([0-9]+))/
        )

        const infectedMatch = content[1].textContent.match(
          /derzeit bei ([0-9]+) Personen/
        )

        const recoveredMatch = content[1].textContent.match(
          /([0-9]+) Personen sind genesen/
        )

        const quarantinedMatch = content[2].textContent.match(
          /([0-9]+) Personen in Quarantäne/
        )

        const deathsMatch = content[1].textContent.match(/und (\w+) verstorben/)

        if (!dateMatch) {
          return reject(new Error(`Couldn't parse string "${content[0]}"`))
        }

        if (!infectedMatch || !recoveredMatch || !deathsMatch) {
          return reject(new Error(`Couldn't parse string "${content[1]}"`))
        }

        if (!quarantinedMatch) {
          return reject(new Error(`Couldn't parse string "${content[2]}"`))
        }

        const entry = {
          areacode: 'sl',
          date: new Date(
            `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]} ${dateMatch[4]}`
          ),
          deaths: getInt(deathsMatch[1]),
          infected: Number(infectedMatch[1]),
          quarantined: Number(quarantinedMatch[1]),
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
