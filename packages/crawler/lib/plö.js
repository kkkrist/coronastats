'use strict'

const fetch = require('node-fetch')

module.exports = () =>
  fetch(
    'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?f=json&objectIds=10&outFields=*'
  )
    .then(res => res.json())
    .then(
      ({
        features: [
          {
            attributes: { cases, deaths, last_update, recovered }
          }
        ]
      }) => {
        const dateMatch = last_update.match(
          /([0-9]+)\.([0-9]+)\.(20[0-9]+), ([0-9]+:[0-9]+)/
        )

        if (!dateMatch) {
          throw new Error(`Couldn't parse timestamp string "${last_update}"`)
        }

        return [
          {
            areacode: 'plö',
            date: new Date(
              `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}, ${dateMatch[4]}`
            ),
            deaths,
            infected: cases,
            recovered
          }
        ]
      }
    )
