'use strict'

const jsdom = require('jsdom').JSDOM

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom
      .fromURL(
        'https://www.flensburg.de/Startseite/Informationen-zum-Coronavirus.php?object=tx,2306.5&ModID=7&FID=2306.20374.1'
      )
      .then(
        dom =>
          resolve(
            [...dom.window.document.querySelectorAll('h2')]
              .filter(el => /^([0-9]+)\.([0-9]+)\.2[0-9]$/.test(el.textContent))
              .reduce((data, date) => {
                let content = ''
                let nextEl = date.nextElementSibling

                while (nextEl && nextEl.tagName !== 'H2') {
                  content = `${nextEl.textContent}\n${content}`
                  nextEl = nextEl.nextElementSibling
                }

                const infectedMatch = content.match(
                  /([0-9]+)\*? nachweislich Infizierte/
                )

                const recoveredMatch = content.match(/([0-9]+)\*?.*genesen/)

                const quarantinedMatch = content.match(
                  /([0-9]+)\*? Verdachtsfälle in Qua?rantäne/
                )

                const deathsMatch = content.match(/([0-9]+)\*? Verstorbene/)

                const dateMatch = date.textContent.match(
                  /([0-9]+)\.([0-9]+)\.([0-9]+)/
                )

                const timeMatch = content.match(/Stand ([0-9]+)\.([0-9]+) Uhr/)

                if (!infectedMatch) {
                  throw new Error(
                    `Couldn't parse infected of ${date.textContent}`
                  )
                }

                if (!recoveredMatch) {
                  throw new Error(
                    `Couldn't parse recovered of ${date.textContent}`
                  )
                }

                if (!quarantinedMatch) {
                  throw new Error(
                    `Couldn't parse quarantined of ${date.textContent}`
                  )
                }

                if (!deathsMatch) {
                  throw new Error(
                    `Couldn't parse deaths of ${date.textContent}`
                  )
                }

                if (!dateMatch) {
                  throw new Error(`Couldn't parse date of ${date.textContent}`)
                }

                const entry = {
                  areacode: 'fl',
                  date: new Date(
                    `20${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}${
                      timeMatch ? ` ${timeMatch[1]}:${timeMatch[2]}` : ''
                    }`
                  ),
                  deaths: Number(deathsMatch[1]),
                  infected: Number(infectedMatch[1]),
                  quarantined: Number(quarantinedMatch[1]),
                  recovered: Number(recoveredMatch[1])
                }

                return [
                  ...data,
                  {
                    ...entry,
                    active: entry.infected - entry.recovered - entry.deaths
                  }
                ]
              }, [])
          ),
        reject
      )
  })
