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
            [...dom.window.document.querySelectorAll('h3')].reduce(
              (acc, cur) => {
                if (
                  cur.textContent !== 'Fallzahlen' ||
                  !cur.nextElementSibling
                ) {
                  return acc
                }

                const infectedMatch = cur.nextElementSibling.textContent.match(
                  /([0-9]+) nachweislich Infizierte/
                )

                const recoveredMatch = cur.nextElementSibling.textContent.match(
                  /([0-9]+) davon gelten als genesen/
                )

                const quarantinedMatch = cur.nextElementSibling.textContent.match(
                  /([0-9]+) Verdachtsfälle in Quarantäne/
                )

                const deathsMatch = cur.nextElementSibling.textContent.match(
                  /([0-9]+) Verstorbene/
                )

                let dateMatch

                while (dateMatch === undefined) {
                  if (!cur.previousElementSibling) {
                    cur = cur.parentElement
                  }

                  if (cur.previousElementSibling.tagName === 'H2') {
                    dateMatch = cur.previousElementSibling.textContent.match(
                      /^([0-9]+)\.([0-9]+)\.([0-9]+)/
                    )
                  } else {
                    cur = cur.previousElementSibling
                  }
                }

                if (
                  !infectedMatch ||
                  !recoveredMatch ||
                  !quarantinedMatch ||
                  !deathsMatch ||
                  !dateMatch
                ) {
                  return acc
                }

                const entry = {
                  date: new Date(
                    `20${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
                  ),
                  deaths: Number(deathsMatch[1]),
                  infected: Number(infectedMatch[1]),
                  quarantined: Number(quarantinedMatch[1]),
                  recovered: Number(recoveredMatch[1])
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
          ),
        reject
      )
  })
