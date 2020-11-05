import TimeSeries from 'timeseries-analysis'

export const forecast = (data, keys) =>
  keys.reduce((acc, key) => {
    const sample = 3

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

    const prediction = coeffs.reduce(
      (nextVal, coeff, i) => nextVal - t.data[t.data.length - 1 - i][1] * coeff,
      0
    )

    return {
      ...acc,
      [key]: Math.round(
        prediction ||
          t.data
            .slice(t.data.length - sample)
            .reduce((acc, data) => acc + data[1], 0) / sample
      )
    }
  }, {})
