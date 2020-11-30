'use strict'

const jsdom = require('jsdom').JSDOM

module.exports = () =>
  jsdom
    .fromURL(
      'https://www.leipzig.de/jugend-familie-und-soziales/gesundheit/neuartiges-coronavirus-2019-n-cov/'
    )
    .then(
      dom => {
        const content =
          dom.window.document.querySelector('h2').nextElementSibling
            .textContent +
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
          /in häuslicher Quarantäne. [0-9]+ positiv Getestete, ([0-9.]+) Kontaktpersonen/
        )

        ;[
          activeMatch,
          dateMatch,
          deathsMatch,
          infectedMatch,
          quarantinedMatch
        ].forEach(match => {
          if (!match) {
            throw new Error(`Couldn't parse ${match}`)
          }
        })

        const entry = {
          areacode: 'l',
          active: Number(activeMatch[1].replace('.', '')),
          date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00.000Z`,
          deaths: Number(deathsMatch[1]),
          infected: Number(infectedMatch[1].replace('.', '')),
          quarantined: Number(quarantinedMatch[1].replace('.', ''))
        }

        return [
          {
            ...entry,
            recovered: entry.infected - entry.active - entry.deaths
          }
        ]
      },
      error => {
        throw error
      }
    )
