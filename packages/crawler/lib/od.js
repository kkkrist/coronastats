'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options')

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom
      .fromURL(
        'https://www.kreis-stormarn.de/aktuelles/pressemeldungen/2020/zahl-der-bestaetigten-corona-faelle-in-stormarn.html',
        {
          userAgent: fetchOptions.headers['user-agent']
        }
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
            let nextEl = cur.nextElementSibling

            while (nextEl && nextEl.tagName === 'P') {
              content += '\n' + nextEl.textContent
              nextEl = nextEl.nextElementSibling
            }

            const infectedMatch =
              content.match(
                /(?:COVID-19-Fälle|positiv getesteten Personen)(?:[A-Za-z0-9\W\s-]+?)beträgt(?:[A-Za-z\W\s]+)([0-9.]+)/
              ) ||
              content.match(
                /bestätigten.*Fälle ist auf ([0-9]+) (an|)gestiegen/
              ) ||
              content.match(/([0-9]+) bestätigte.*Fälle/)

            const recoveredMatch = content.match(
              /([0-9.]+)\*? Personen.*genesen/
            )

            const quarantinedMatch = content.match(
              /([0-9.]+)\*? aktuell in Quarantäne/
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
              !dateMatch ||
              !deathsMatch ||
              !infectedMatch ||
              !recoveredMatch
            ) {
              return acc
            }

            const entry = {
              areacode: 'od',
              date: new Date(
                `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
              ).toISOString(),
              deaths: Number(deathsMatch[1]),
              infected: Number(infectedMatch[1].replace('.', '')),
              quarantined: quarantinedMatch
                ? Number(quarantinedMatch[1].replace('.', ''))
                : null,
              recovered: Number(recoveredMatch[1].replace('.', ''))
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
