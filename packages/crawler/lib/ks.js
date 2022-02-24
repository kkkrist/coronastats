'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')

const getMonthNumber = key =>
  ({
    Januar: '01',
    Februar: '02',
    März: '03',
    April: '04',
    Mai: '05',
    Juni: '06',
    Juli: '07',
    August: '08',
    September: '09',
    Oktober: '10',
    November: '11',
    Dezember: '12'
  }[key])

module.exports = () =>
  jsdom
    .fromURL(
      'https://www.kassel.de/aktuelles/aktuelle-meldungen/coronavirus.php',
      {
        userAgent: fetchOptions.headers['user-agent']
      }
    )
    .then(
      dom => {
        const dateMatches = [...dom.window.document.querySelectorAll('h3')]
          .map(el => el.nextElementSibling)
          .filter(el => /^Stand/.test(el?.textContent))

        const dateMatch = dateMatches[dateMatches.length - 1].textContent.match(
          /Stand:?\s\w+,?\s(\d*)\.\s([\wä]+)\s(\d{4})?/
        )

        if (!dateMatch) {
          throw new Error("Couldn't parse date")
        }

        const rows = dom.window.document.querySelectorAll('table tr')

        if (!rows || !rows.length) {
          throw new Error("Couldn't find table rows")
        }

        // const activeMatchS = rows[3].children[2].textContent.match(/[0-9.]+/)
        // const activeMatchLk = rows[4].children[2].textContent.match(/[0-9.]+/)

        // const recoveredMatchS = rows[3].children[3].textContent.match(/[0-9.]+/)
        // const recoveredMatchLk = rows[4].children[3].textContent.match(
        //   /[0-9.]+/
        // )

        const deathsMatchS = rows[3].children[2].textContent.match(/[0-9.]+/)
        const deathsMatchLk = rows[4].children[2].textContent.match(/[0-9.]+/)

        const infectedMatchS = rows[3].children[3].textContent.match(/[0-9.]+/)
        const infectedMatchLk = rows[4].children[3].textContent.match(/[0-9.]+/)

        const entryS = {
          areacode: 'ks-s',
          active: null, // Number(activeMatchS[0].replace('.', '')),
          date: `${dateMatch[3] || '2021'}-${getMonthNumber(
            dateMatch[2]
          )}-${dateMatch[1].padStart(2, '0')}T00:00:00.000Z`,
          deaths: Number(deathsMatchS[0]),
          infected: Number(infectedMatchS[0].replace('.', '')),
          quarantined: null,
          recovered: null // Number(recoveredMatchS[0].replace('.', ''))
        }

        const entryLk = {
          areacode: 'ks-lk',
          active: null, // Number(activeMatchLk[0].replace('.', '')),
          date: `${dateMatch[3] || '2021'}-${getMonthNumber(
            dateMatch[2]
          )}-${dateMatch[1].padStart(2, '0')}T00:00:00.000Z`,
          deaths: Number(deathsMatchLk[0]),
          infected: Number(infectedMatchLk[0].replace('.', '')),
          quarantined: null,
          recovered: null // Number(recoveredMatchLk[0].replace('.', ''))
        }

        return [entryS, entryLk]
      },
      error => {
        throw error
      }
    )
