import PropTypes from 'prop-types'

export const docs = PropTypes.arrayOf(
  PropTypes.shape({
    areacode: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    deaths: PropTypes.number.isRequired,
    infected: PropTypes.number.isRequired,
    infected7p100k: PropTypes.number,
    last_modified: PropTypes.string,
    quarantined: PropTypes.number,
    recovered: PropTypes.number,
    _id: PropTypes.string.isRequired,
    _rev: PropTypes.string
  })
)
