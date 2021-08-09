import dayjs from 'dayjs'
import TimeSeries from 'timeseries-analysis'
import areacodes from '../data/areacodes'

const oneDay = 1000 * 60 * 60 * 24

const forecast = data =>
  ['infected', 'quarantined', 'recovered', 'deaths'].reduce((acc, key, i) => {
    for (let di = data.length - 1; di > 0; di--) {
      if (
        data[di].forecast !== true &&
        (data[di][key] === null || data[di][key] === undefined)
      ) {
        return acc
      }
    }

    const t = new TimeSeries.main(
      TimeSeries.adapter.fromDB(data, {
        date: 'date',
        value: key
      })
    )

    const coeffs = t.ARMaxEntropy({
      degree: t.data.length - 1
    })

    let forecast = coeffs.reduce(
      (nextVal, coeff, i) => nextVal - t.data[t.data.length - 1 - i][1] * coeff,
      0
    )

    if (key === 'recovered' && forecast - t.data[t.data.length - 1][1] < 0) {
      forecast = t.data[t.data.length - 1][1]
    }

    return {
      ...acc,
      [key]: Math.round(forecast > 0 ? forecast : 0)
    }
  }, {})

export const addIncidence = (doc, docs, population) => {
  const d = new Date(
    (Math.floor(Date.parse(doc.date) / oneDay) - 7) * oneDay
  ).getTime()

  const findFn = doc =>
    new Date(Math.floor(Date.parse(doc.date) / oneDay) * oneDay).getTime() === d

  const rangeStart = docs.find(findFn)

  if (rangeStart) {
    doc.incidence = (
      ((doc.infected - rangeStart.infected) / population) *
      100000
    ).toFixed(1)
  }

  return doc
}

export const addPredictions = docs => {
  if (docs.length === 0) {
    return docs
  }

  const areacode = docs[0].areacode
  const lastDate = dayjs(docs[0].date)
  const nextPredictions = []

  for (let i = 1; i < 4; i++) {
    const nextForcast = forecast([...nextPredictions, ...docs].reverse())
    const date = lastDate.set('date', lastDate.date() + i).toISOString()

    if (nextForcast.deaths < docs[0].deaths) {
      nextForcast.deaths = docs[0].deaths
    }

    if (nextForcast.infected < docs[0].infected) {
      nextForcast.infected = docs[0].infected
    }

    nextPredictions.unshift({
      areacode,
      date,
      forecast: true,
      _id: `${date}-${areacode}`,
      ...nextForcast
    })
  }

  return [
    ...nextPredictions.map(doc =>
      addIncidence(
        {
          ...doc,
          active:
            doc.recovered !== undefined
              ? doc.infected - doc.recovered - doc.deaths
              : undefined
        },
        [...nextPredictions, ...docs],
        areacodes[areacode].population
      )
    ),
    ...docs
  ]
}
