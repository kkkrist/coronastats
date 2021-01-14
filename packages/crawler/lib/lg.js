'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')

module.exports = () =>
  jsdom
    .fromURL('https://spezial.lklg.net/?p=64', {
      userAgent: fetchOptions.headers['user-agent']
    })
    .then(
      dom =>
        [...dom.window.document.querySelectorAll('tr')]
          .slice(2)
          .reduce((acc, row) => {
            if (row.children.length < 6) {
              return acc
            }

            const dateMatch = row.children[0].textContent.match(
              /([0-9]+)\.([0-9]+)\.([0-9]+)/
            )

            const infectedMatch = row.children[3].textContent.match(/([0-9.]+)/)

            const recoveredMatch = row.children[4].textContent.match(
              /([0-9.]+)/
            )

            const deathsMatch = row.children[5].textContent.match(/([0-9.]+)/)

            if (!recoveredMatch) {
              return acc
            }

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

            if (!deathsMatch) {
              throw new Error(
                `Couldn't parse deaths string "${row.children[4].textContent}"`
              )
            }

            const entry = {
              areacode: 'lg',
              date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00.000Z`,
              deaths: Number(deathsMatch[1].replace('.', '')),
              infected: Number(infectedMatch[1].replace('.', '')),
              quarantined: null,
              recovered: Number(recoveredMatch[1].replace('.', ''))
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
