'use strict'

const jsdom = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')
const tesseract = require('tesseract.js')

const numberStrings = {
  ein: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  'f&uuml;nf': 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  dreizehn: 13,
  vierzehn: 14,
  fünfzehn: 15,
  sechzehn: 16,
  siebzehn: 17,
  achtzehn: 18,
  neunzehn: 19
}

const getInt = val => {
  if (val !== null && val !== undefined && !isNaN(val)) {
    return Number(val)
  }

  const key = Object.keys(numberStrings).find(str =>
    val.toLowerCase().startsWith(str)
  )

  if (key) {
    return numberStrings[key]
  }

  throw new Error(`Couldn't convert string to number: ${val}`)
}

module.exports = () =>
  new Promise((resolve, reject) => {
    jsdom
      .fromURL(
        'https://www.schleswig-flensburg.de/Leben-Soziales/Gesundheit/Coronavirus/Aktuelle-Zahlen/',
        {
          userAgent: fetchOptions.headers['user-agent']
        }
      )
      .then(dom =>
        Promise.all([
          Promise.resolve(
            dom.window.document
              .querySelector('div#read')
              .textContent.replace(/\u00A0/g, ' ')
          ),
          tesseract.recognize(
            dom.window.document.querySelector('div#read img').src
          )
        ])
      )
      .then(([content, ocr]) => {
        const dateMatch = ocr.data.text.match(
          /Stand.*?([0-9]{2})[.:]([0-9]{2})[.:]([0-9]{4})/i
        )

        const infectedMatch = content.match(
          /Gesamtzahl\sgemeldete\sFälle:\s([0-9.]+)/
        )

        const recoveredMatch = content.match(/Genesen:\s([0-9.]+)/)

        const quarantinedMatch = content.match(
          /In\sQuarantäne:\s([0-9.]+)7-Tage-Inzidenz/
        )

        const deathsMatch = content.match(/Verstorben:\s([0-9.]+)/i)

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
          areacode: 'sl',
          date: new Date(
            `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
          ).toISOString(),
          deaths: getInt(deathsMatch[1]),
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
