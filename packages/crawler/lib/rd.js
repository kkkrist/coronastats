'use strict'

const fetch = require('node-fetch')
const fetchOptions = require('./fetch-options.json')

module.exports = () =>
  Promise.all([
    fetch('https://covid19dashboardrdeck.aco/daten/update.js', fetchOptions),
    fetch('https://covid19dashboardrdeck.aco/daten/dash.js', fetchOptions)
  ])
    .then(responses => Promise.all(responses.map(res => res.text())))
    .then(async texts => {
      const {
        rows: [lastEntry]
      } = await fetch(
        'https://api.mundpropaganda.net/coronastats/_design/areacode/_view/rd?descending=true&limit=1',
        fetchOptions
      ).then(res => res.json())

      const text = texts.join('')

      const matches = {
        activeMatch: text.match(/todayActivInfected\s?=\s?'(\d+)'/),
        dateMatch: text.match(
          /lastUpdate\s?=\s?'(\d+)\.(\d+)\.(\d+)\s(\d+):(\d+):(\d+)/
        ),
        deathsMatch: text.match(/todayDeath\s?=\s?'(\d+)'/),
        infectedMatch: text.match(/todaySumInfected\s?=\s?'(\d+)'/),
        recoveredMatch: text.match(/todayHealth\s?=\s?'(\d+)'/)
      }

      const errors = Object.entries(matches).filter(([key, value]) => !value)

      if (errors.length > 0) {
        throw new Error(
          `No match for: ${errors.map(([key]) => key).join(', ')}`
        )
      }

      const {
        activeMatch,
        dateMatch,
        deathsMatch,
        infectedMatch,
        recoveredMatch
      } = matches

      const entry = {
        areacode: 'rd',
        active: Number(activeMatch[1]),
        date: new Date(
          `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}.000`
        ).toISOString(),
        deaths: Number(deathsMatch[1]),
        infected: Number(infectedMatch[1]),
        quarantined: null,
        recovered: Number(recoveredMatch[1])
      }

      if (
        entry.active === lastEntry.value.active &&
        entry.deaths === lastEntry.value.deaths &&
        entry.infected === lastEntry.value.infected &&
        entry.recovered === lastEntry.value.recovered
      ) {
        return []
      }

      return [entry]
    })
