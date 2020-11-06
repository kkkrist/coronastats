'use strict'

const fetch = require('node-fetch')
const jsdom = require('jsdom').JSDOM

module.exports = () =>
  Promise.all([
    jsdom.fromURL('https://spezial.lklg.net/?p=64'),
    fetch(
      'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?f=json&objectIds=38&outFields=*',
      {
        headers: {
          'cache-control': 'no-cache',
          pragma: 'no-cache'
        }
      }
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
    ]) =>
      [...dom.window.document.querySelectorAll('tr')]
        .slice(2)
        .reduce((acc, row) => {
          const dateMatch = row.children[0].textContent.match(
            /([0-9]+)\.([0-9]+)\.([0-9]+)/
          )

          const infectedMatch = row.children[3].textContent.match(/([0-9.]+)/)

          const recoveredMatch = row.children[4].textContent.match(/([0-9.]+)/)

          if (!dateMatch) {
            throw new Error(
              `Couldn't parse date string "${row.children[0].textContent}"`
            )
          }

          if (!infectedMatch) {
            throw new Error(
              `Couldn't parse infected string "${row.children[3].textContent}"`
            )
          }

          if (!recoveredMatch) {
            throw new Error(
              `Couldn't parse recovered string "${row.children[4].textContent}"`
            )
          }

          const entry = {
            areacode: 'lg',
            date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00.000Z`,
            deaths,
            infected: Number(infectedMatch[1]),
            quarantined: null,
            recovered: Number(recoveredMatch[1])
          }

          return [
            ...acc,
            {
              ...entry,
              active: entry.infected - entry.recovered - entry.deaths
            }
          ]
        }, []),
    error => {
      throw error
    }
  )
