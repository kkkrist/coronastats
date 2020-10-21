'use strict'

const fetch = require('node-fetch')
const jsdom = require('jsdom').JSDOM

const numberStrings = {
  Januar: 1,
  Februar: 2,
  März: 3,
  April: 4,
  Mai: 5,
  Juni: 6,
  Juli: 7,
  August: 8,
  September: 9,
  Oktober: 10,
  Novemer: 11,
  Dezember: 12
}

const getInt = val => {
  if (val !== null && val !== undefined && !isNaN(val)) {
    return Number(val)
  }

  const key = Object.keys(numberStrings).find(str =>
    new RegExp(str, 'i').test(val)
  )

  if (key) {
    return numberStrings[key]
  }

  throw new Error(`Couldn't convert string to number: ${val}`)
}

module.exports = () =>
  Promise.all([
    jsdom.fromURL('https://spezial.lklg.net/?p=64'),
    fetch(
      'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?f=json&objectIds=38&outFields=*'
    ).then(res => res.json())
  ]).then(
    ([
      dom,
      {
        features: [
          {
            attributes: { deaths }
          }
        ]
      }
    ]) => {
      const content = dom.window.document.querySelectorAll(
        '.row:not(.container) > div > p'
      )

      const dateMatch = content[1].textContent.match(
        /\+\+\+ Update ([0-9]+)\. ([A-Za-z]+) ([0-9]+)/
      )

      const infectedMatch = content[2].textContent.match(
        /gemeldeten Fälle[A-Za-z\s]+([0-9]+)/
      )

      const recoveredMatch = content[4].textContent.match(
        /([0-9]+) Personen haben die Corona-Infektion überwunden/
      )

      if (!dateMatch) {
        throw new Error(`Couldn't parse date string "${content[1]}"`)
      }

      if (!infectedMatch) {
        throw new Error(`Couldn't parse infected string "${content[2]}"`)
      }

      if (!recoveredMatch) {
        throw new Error(`Couldn't parse recovered string "${content[4]}"`)
      }

      const entry = {
        areacode: 'lg',
        date: new Date(
          `${dateMatch[3]}-${getInt(dateMatch[2])}-${dateMatch[1]}`
        ),
        deaths,
        infected: Number(infectedMatch[1]),
        quarantined: null,
        recovered: Number(recoveredMatch[1])
      }

      return [
        {
          ...entry,
          active: entry.infected - entry.recovered - entry.deaths
        }
      ]
    },
    error => {
      throw error
    }
  )
