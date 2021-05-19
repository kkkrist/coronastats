'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')

const r = /\.|\*/g

module.exports = () =>
  jsdom
    .fromURL(
      'https://www.flensburg.de/Aktuelles/Corona-Portal/Aktuelle-Lagemeldungen/Aktuelles-Infektionsgeschehen/',
      {
        userAgent: fetchOptions.headers['user-agent']
      }
    )
    .then(
      dom => {
        const rows = dom.window.document.querySelectorAll('table')[0]
          .children[0].children

        const dateMatch = rows[0].children[1].textContent.match(
          /Stand:?\s([0-9.]+)\.([0-9.]+)\.([0-9.]+)/i
        )

        if (!dateMatch) {
          throw new Error(
            `Couldn't parse date from String "${rows[0].children[1].textContent}"`
          )
        }

        const record = {
          areacode: 'fl',
          date: new Date(
            `20${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
          ).toISOString(),
          deaths: Number(rows[3].children[1].textContent.replace(r, '')),
          infected: Number(rows[1].children[1].textContent.replace(r, '')),
          quarantined: Number(rows[5].children[1].textContent.replace(r, '')),
          recovered: Number(rows[4].children[1].textContent.replace(r, ''))
        }

        if (record.deaths === undefined || record.recovered === undefined) {
          return record
        }

        return {
          ...record,
          active: record.infected - record.recovered - record.deaths
        }
      },
      error => {
        throw error
      }
    )
