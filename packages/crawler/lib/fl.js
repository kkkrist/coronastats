'use strict'

const fetch = require('node-fetch')
const JSDOM = require('jsdom').JSDOM
const fetchOptions = require('./fetch-options.json')

const rDate = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/

const rDeaths = [
  /Verstorbene:?\s+([0-9.]+)/i,
  /verstorben:?\s+([0-9.]+)/i,
  /([0-9.]+)[\D]+Verst(?:or|ro)?ben/i
]

const rInfected = [
  /Fallzahlen:?\s+([0-9.]+)/i,
  /Positive gesamt:?\s+([0-9.]+)/i,
  /([0-9.]+)[\D]+Infizierte/i
]

const rQuarantined = [
  /Quarantänen:?\s+([0-9]+)/i,
  /Quarantänefälle:?\s+([0-9.]+)/i,
  /([0-9.]+)[\D]+ (?<!Lehrer )in Qua?rantäne/i
]

const rRecovered = [
  /Genesene:?\s+([0-9]+)/,
  /genesen:?\s+([0-9.*]+)/i,
  /([0-9.]+)[\D]+gen?en?sen/
]

const matcher = (str, r) => {
  if (Array.isArray(r)) {
    let match
    r.every(re => !(match = str.match(re)))
    return match
  }

  return str.match(r)
}

const getMatch = (el, regex, isOptional) => {
  let match = matcher(el.textContent, regex)

  if (match) {
    return match
  }

  let nextEl = el.previousElementSibling || el.parentElement

  while (nextEl && !match) {
    match = matcher(nextEl.textContent, regex)
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

  let year = dateMatch[3].slice(-2)
  const month = dateMatch[2]
  const day = dateMatch[1]

  if (year === '20' && Number(month) < 4) {
    year = '21'
  }

  const record = {
    areacode: 'fl',
    date: new Date(`20${year}-${month}-${day}`).toISOString(),
    deaths: Number(deathsMatch[1].replace('.', '')),
    infected: Number(infectedMatch[1].replace('.', '')),
    quarantined: Number(quarantinedMatch[1].replace('.', '')),
    recovered: recoveredMatch[1].includes('*')
      ? null
      : Number(recoveredMatch[1].replace('.', ''))
  }

  if (record.deaths === null || record.recovered === null) {
    return record
  }

  return {
    ...record,
    active: record.infected - record.recovered - record.deaths
  }
}

const reducer = (acc, el) => {
  if (
    !['P', 'UL'].includes(el.nodeName) &&
    el.childElementCount > 0 &&
    ![...el.children].every(({ tagName }) => tagName === 'BR')
  ) {
    return [...el.childNodes].reduce(reducer, acc)
  }

  const str = el.textContent

  if (
    matcher(str, rInfected) &&
    matcher(str, rRecovered) &&
    matcher(str, rQuarantined) &&
    matcher(str, rDeaths)
  ) {
    return [...acc, getRecord(el)]
  }

  return acc
}

module.exports = () =>
  fetch(
    'https://www.flensburg.de/Startseite/Informationen-zum-Coronavirus.php?object=tx,2306.5&ModID=7&FID=2306.20374.1',
    fetchOptions
  )
    .then(res => res.text())
    .then(text => {
      const dom = new JSDOM(text.replace(/<\/?(span|strong).*?>/gi, ''))
      const containerMarkup = dom.window.document
        .querySelector('.einleitung + div > div > .toggler_container')
        .innerHTML.replace(/<\/?(div).*?>/gi, '')
      return [
        ...new JSDOM(containerMarkup).window.document.body.childNodes
      ].reduce(reducer, [])
    })
