'use strict'

const _get = require('lodash/get')
const jsdom = require('jsdom').JSDOM

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom
      .fromURL(
        'https://www.kreis-stormarn.de/aktuelles/pressemeldungen/2020/zahl-der-bestaetigten-corona-faelle-in-stormarn.html'
      )
      .then(dom => {
        const stats = [...dom.window.document.querySelectorAll('h4')].reduce(
          (acc, cur) => {
            if (
              !/^([0-9]+)\.([0-9]+)\.([0-9]+)$/.test(cur.textContent) ||
              !cur.nextElementSibling
            ) {
              return acc
            }

            let content = ''
            let path = 'nextElementSibling'

            while (_get(cur, `${path}.tagName`) === 'P') {
              content += '\n' + _get(cur, `${path}.textContent`, '')
              path += '.nextElementSibling'
            }

            const infectedMatch =
              content.match(
                /(?:COVID-19-Fälle|positiv getesteten Personen)(?:[A-Za-z0-9\W\s-]+?)beträgt(?:[A-Za-z\W\s]+)([0-9]+)/
              ) ||
              content.match(
                /bestätigten.*Fälle ist auf ([0-9]+) (an|)gestiegen/
              ) ||
              content.match(/([0-9]+) bestätigte.*Fälle/)

            const recoveredMatch = content.match(
              /([0-9]+)\*? Personen.*genesen/
            )

            const quarantinedMatch = content.match(
              /([0-9]+)\*? aktuell in Quarantäne/
            )

            const deathsMatch =
              content.match(/([0-9]+)\*? Personen sind.*verstorben/) ||
              content.match(
                /verstorbenen Personen(?:[A-Za-z0-9\W\s-]+)beträgt(?:[A-Za-z\W\s]+)([0-9]+)/
              )

            const dateMatch = cur.textContent.match(
              /^([0-9]+)\.([0-9]+)\.([0-9]+)$/
            )

            if (
              !infectedMatch ||
              !recoveredMatch ||
              !deathsMatch ||
              !dateMatch
            ) {
              return acc
            }

            const entry = {
              areacode: 'od',
              date: new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`),
              deaths: deathsMatch ? Number(deathsMatch[1]) : null,
              infected: Number(infectedMatch[1]),
              quarantined: quarantinedMatch
                ? Number(quarantinedMatch[1])
                : null,
              recovered: recoveredMatch ? Number(recoveredMatch[1]) : null
            }

            return [
              ...acc,
              {
                ...entry,
                active: entry.infected - entry.recovered - entry.deaths
              }
            ]
          },
          []
        )

        resolve(stats)
      }, reject)
  })
