import { Column } from 'react-base-table'

export default [
  {
    frozen: Column.FrozenDirection.LEFT,
    key: 'date',
    dataKey: 'date',
    sortable: true,
    title: 'Datum'
  },
  {
    key: 'infected',
    dataKey: 'infected',
    sortable: true,
    title: 'Infizierte'
  },
  {
    key: 'quarantined',
    dataKey: 'quarantined',
    sortable: true,
    title: 'unter Quarantäne'
  },
  {
    key: 'recovered',
    dataKey: 'recovered',
    sortable: true,
    title: 'Genesene'
  },
  {
    key: 'active',
    dataKey: 'active',
    sortable: true,
    title: 'aktive'
  },
  {
    key: 'deaths',
    dataKey: 'deaths',
    sortable: true,
    title: 'Todesfälle'
  },
  {
    key: 'incidence',
    dataKey: 'incidence',
    sortable: true,
    title: '7-Tage-Inzidenz*'
  }
]
