'use strict'

const jsdom = require('jsdom').JSDOM
const fetch = require('node-fetch')
const fetchOptions = require('./fetch-options.json')

module.exports = () =>
  jsdom
    .fromURL('https://corona.landkreis-lueneburg.de/aktuelle-situation/', {
      userAgent: fetchOptions.headers['user-agent']
    })
    .then(
      dom => dom.window.document.getElementById('wdtNonceFrontendEdit_15').value
    )
    .then(nonce =>
      fetch(
        'https://corona.landkreis-lueneburg.de/wp-admin/admin-ajax.php?action=get_wdtable&table_id=15',
        {
          ...fetchOptions,
          body:
            'draw=1&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=desc&wdtNonce=' +
            nonce,
          headers: {
            ...fetchOptions.headers,
            accept: 'application/json',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          method: 'POST'
        }
      )
    )
    .then(res => res.json())
    .then(({ data }) =>
      data.reduce((acc, row) => {
        const dateMatch = row[1].match(/([0-9]+)\.([0-9]+)\.([0-9]+)/)

        if (!dateMatch) {
          throw new Error(
            `Couldn't parse date string "${row.children[0].textContent}"`
          )
        }

        const entry = {
          areacode: 'lg',
          date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T00:00:00.000Z`,
          deaths: Number(row[7].replace('.', '')),
          infected: Number(row[5].replace('.', '')),
          quarantined: null,
          recovered: Number(row[6].replace('.', ''))
        }

        return [
          ...acc,
          {
            ...entry,
            active: entry.infected - entry.recovered - entry.deaths
          }
        ]
      }, [])
    )
    .catch(error => {
      throw error
    })
