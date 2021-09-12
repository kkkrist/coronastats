'use strict'

const jsdom = require('jsdom')
const fetchOptions = require('./fetch-options.json')

const options = {
  cookieJar: new jsdom.CookieJar(),
  userAgent: fetchOptions.headers['user-agent']
}

options.cookieJar.setCookie(
  'nolis_vorschaltseite_gesehen=1',
  'https://www.lk-row.de',
  () => {}
)

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom.JSDOM.fromURL(
      'https://www.lk-row.de/portal/seiten/aktuelle-zahlen-corona--900000752-23700.html',
      options
    ).then(dom => {
      const content = dom.window.document
        .querySelector('div#nolis_content')
        .textContent.replace(/\u00A0/g, ' ')

      const dateMatch = [...dom.window.document.querySelectorAll('strong')]
        .map(el =>
          el.textContent.match(/stand.*?(\d{1,2})\.(\d{1,2})\.(\d{4})/i)
        )
        .find(m => m)

      const infectedMatch = content.match(/Insgesamt.*?([0-9.]+).*?gezählt/i)

      const recoveredMatch = content.match(/([0-9.]+)\sdavon.*?genesen/)

      const quarantinedMatch = content.match(
        /([0-9.]+)\sKontaktpersonen.*?Quarantäne/
      )

      const deathsMatch = content.match(/Verstorben.*?([0-9.]+)\sPersonen/i)

      if (!dateMatch) {
        return reject(new Error("Couldn't parse date"))
      }

      if (!infectedMatch) {
        return reject(new Error("Couldn't parse infected"))
      }

      if (!recoveredMatch) {
        return reject(new Error("Couldn't parse recovered"))
      }

      if (!deathsMatch) {
        return reject(new Error("Couldn't parse deaths"))
      }

      if (!quarantinedMatch) {
        return reject(new Error("Couldn't parse quarantined"))
      }

      const entry = {
        areacode: 'row',
        date: new Date(
          `${dateMatch[3]}-${dateMatch[2].padStart(
            2,
            '0'
          )}-${dateMatch[1].padStart(2, '0')}`
        ).toISOString(),
        deaths: Number(deathsMatch[1]),
        infected: Number(infectedMatch[1].replace('.', '')),
        quarantined: Number(quarantinedMatch[1].replace('.', '')),
        recovered: Number(recoveredMatch[1].replace('.', ''))
      }

      resolve([
        {
          ...entry,
          active: entry.infected - entry.recovered - entry.deaths
        }
      ])
    }, reject)
  })
