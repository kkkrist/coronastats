'use strict'

const fetch = require('node-fetch')
const JSDOM = require('jsdom').JSDOM

const rDate = /([0-9]+)\.([0-9]+)\.([0-9]+)/
const rDeaths = /([0-9]+)[\D]+Verst(?:or|ro)?ben/i
const rInfected = /([0-9]+)[\D]+Infizierte/
const rQuarantined = /([0-9]+)[\D]+ (?<!Lehrer )in Qua?rantäne/
const rRecovered = /([0-9]+)[\D]+gen?en?sen/

const getMatch = (el, regex, isOptional) => {
  let match = el.textContent.match(regex)

  if (match) {
    return match
  }

  let nextEl = el.previousElementSibling

  while (nextEl && !match) {
    match = nextEl.textContent.match(regex)
    nextEl = nextEl.previousElementSibling || nextEl.parentElement
  }

  if (!isOptional && !match) {
    throw new Error(`Couldn't find ${regex.toString()} in "${el.textContent}"!`)
  }

  return match
}

const getRecord = el => {
  const dateMatch = getMatch(el, rDate)
  const deathsMatch = getMatch(el, rDeaths)
  const infectedMatch = getMatch(el, rInfected)
  const quarantinedMatch = getMatch(el, rQuarantined)
  const recoveredMatch = getMatch(el, rRecovered)

  const record = {
    areacode: 'fl',
    date: new Date(
      `20${dateMatch[3].slice(-2)}-${dateMatch[2]}-${dateMatch[1]}`
    ).toISOString(),
    deaths: Number(deathsMatch[1]),
    infected: Number(infectedMatch[1]),
    quarantined: Number(quarantinedMatch[1]),
    recovered: Number(recoveredMatch[1])
  }

  return {
    ...record,
    active: record.infected - record.recovered - record.deaths
  }
}

const reducer = (acc, el) => {
  if (el.childElementCount > 0) {
    return [...el.childNodes].reduce(reducer, acc)
  }

  const str = el.textContent

  if (
    rInfected.test(str) &&
    rRecovered.test(str) &&
    rQuarantined.test(str) &&
    rDeaths.test(str)
  ) {
    return [...acc, getRecord(el)]
  }

  return acc
}

module.exports = () =>
  fetch(
    'https://www.flensburg.de/Startseite/Informationen-zum-Coronavirus.php?object=tx,2306.5&ModID=7&FID=2306.20374.1',
    {
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache'
      }
    }
  )
    .then(res => res.text())
    .then(text => {
      const dom = new JSDOM(text.replace(/<\/?span.*?>/gi, ''))
      return [
        ...dom.window.document.querySelector(
          '.einleitung + div > div > .toggler_container'
        ).childNodes
      ].reduce(reducer, [])
    })
