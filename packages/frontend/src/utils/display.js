export const longDate = d => d.toLocaleDateString()

export const shortDate = d => `${d.getDate()}.${d.getMonth() + 1}.`

export const { format: formatNum } = new Intl.NumberFormat('de')
