export const { format: formatNum } = new Intl.NumberFormat('de')

export const longDate = d => d.toLocaleDateString()

export const shortDate = d => `${d.getDate()}.${d.getMonth() + 1}.`
