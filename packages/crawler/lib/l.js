'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')
const fetch = require('node-fetch')

module.exports = () =>
  Promise.all([
    jsdom.fromURL(
      'https://www.leipzig.de/jugend-familie-und-soziales/gesundheit/neuartiges-coronavirus-2019-n-cov/',
      {
        userAgent: fetchOptions.headers['user-agent']
      }
    ),
    fetch(
      'https://api.mundpropaganda.net/coronastats/_design/areacode/_view/l?descending=true&limit=1',
      fetchOptions
    ).then(res => res.json())
  ]).then(
    ([
      dom,
      {
        rows: [lastEntry]
      }
    ]) => {
      const content =
        [...dom.window.document.querySelectorAll('h2')].find(el =>
          el.textContent.includes('Fallzahlen')
        ).nextElementSibling.textContent +
        '\n' +
        dom.window.document.querySelector('div.schlaglichter-container')
          .textContent

      const activeMatch = content.match(/aktive Fälle. ([0-9.]+)/)

      const dateMatch = content.match(/Stand ([0-9]+)\.([0-9]+)\.([0-9]+)/)

      const deathsMatch = content.match(/bisher ([0-9]+) Todesfälle/)

      const infectedMatch = content.match(
        /positiv Getestete. bisher insgesamt ([0-9.]+)/
      )

      const quarantinedMatch = content.match(
        /in häuslicher Quarantäne. ([0-9.]+)/
      )

      ;[dateMatch, deathsMatch, infectedMatch].forEach(match => {
        if (!match) {
          throw new Error(`Couldn't parse ${match}`)
        }
      })

      const entry = {
        areacode: 'l',
        active: activeMatch && Number(activeMatch[1].replace('.', '')),
        date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00.000Z`,
        deaths: Number(deathsMatch[1]),
        infected: Number(infectedMatch[1].replace('.', '')),
        quarantined:
          quarantinedMatch && Number(quarantinedMatch[1].replace('.', ''))
      }

      if (
        entry.active === lastEntry.value.active &&
        entry.deaths === lastEntry.value.deaths &&
        entry.infected === lastEntry.value.infected &&
        entry.quarantined === lastEntry.value.quarantined
      ) {
        return []
      }

      return [
        {
          ...entry,
          recovered: entry.active
            ? entry.infected - entry.active - entry.deaths
            : null
        }
      ]
    },
    error => {
      throw error
    }
  )
