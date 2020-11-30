import dayjs from 'dayjs'
import TimeSeries from 'timeseries-analysis'
import areacodes from '../data/areacodes'

const forecast = (data, sample = 5) =>
  ['infected', 'quarantined', 'recovered', 'deaths'].reduce((acc, key, i) => {
    sample = sample + i

    const t = new TimeSeries.main(
      TimeSeries.adapter.fromDB(data, {
        date: 'date',
        value: key
      })
    )

    if (
      t.data
        .slice(t.data.length - sample)
        .some(d => isNaN(d[1]) || d[1] === null)
    ) {
      return acc
    }

    const coeffs = t
      .ARMaxEntropy({
        data: t.data.slice(t.data.length - sample),
        degree: 2
      })
      .filter(n => !isNaN(n))

    const forecast = coeffs.reduce(
      (nextVal, coeff, i) => nextVal - t.data[t.data.length - 1 - i][1] * coeff,
      0
    )

    return {
      ...acc,
      [key]: Math.round(
        forecast ||
          t.data
            .slice(t.data.length - sample)
            .reduce((acc, data) => acc + data[1], 0) / sample
      )
    }
  }, {})

export const addIncidence = (doc, docs, population) => {
  const d = dayjs(doc.date)

  const rangeStart = docs.find(
    doc =>
      dayjs(doc.date).format('YYYY-MM-DD') ===
      d.set('date', d.date() - 7).format('YYYY-MM-DD')
  )

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

    nextPredictions.unshift({
      areacode,
      date,
      last_modified: new Date().toISOString(),
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
