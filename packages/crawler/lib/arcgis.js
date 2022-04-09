'use strict'

const fetch = require('node-fetch')
const fetchOptions = require('./fetch-options.json')

module.exports = (AdmUnitId, areacode) =>
  fetch(
    `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/rki_key_data_hubv/FeatureServer/0/query?f=json&where=AdmUnitId%3D${AdmUnitId}&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&resultOffset=0&resultRecordCount=50`,
    fetchOptions
  ).then(async res => {
    const {
      features: [
        {
          attributes: { AnzAktiv, AnzFall, AnzGenesen, AnzTodesfall, Inz7T }
        }
      ]
    } = await res.json()

    return {
      active: AnzAktiv,
      areacode,
      deaths: AnzTodesfall,
      infected: AnzFall,
      infected7p100k: Inz7T,
      date: new Date(res.headers.get('last-modified')).toISOString(),
      recovered: AnzGenesen
    }
  })
