import PouchDB from 'pouchdb'
import React, { useCallback, useEffect, useReducer } from 'react'
import IconChart from './components/IconChart'
import IconTable from './components/IconTable'
import LineChart from './components/LineChart'
import Loading from './components/Loading'
import Table from './components/Table'
import areacodes from './data/areacodes.json'
import { formatNum } from './utils/display'
import { addIncidence, addPredictions } from './utils/math'
import { version } from '../package.json'
import { register as registerServiceWorker } from './service-worker'
import './styles.css'

const locations = {
  fl: 'Flensburg',
  'ks-s': 'Kassel',
  rz: 'Kreis Herzogtum Lauenburg',
  plö: 'Kreis Plön',
  rd: 'Kreis Rendsburg-Eckernförde',
  sl: 'Kreis Schleswig-Flensburg',
  od: 'Kreis Stormarn',
  'ks-lk': 'Landkreis Kassel',
  lg: 'Landkreis Lüneburg',
  row: 'Landkreis Rotenburg',
  l: 'Leipzig'
}

const db = new PouchDB('coronastats')
const replication = db.replicate.from(
  'https://api.mundpropaganda.net/coronastats',
  { live: true, retry: true }
)

const getDocs = (docs, areacode, forecast) => {
  docs = docs.filter(d => !d.forecast && d.areacode === areacode)
  return forecast ? addPredictions(docs) : docs
}

const getLastModified = data => {
  const now = new Date().getTime()
  return data.reduce((timestamp, doc) => {
    const last_modified = Date.parse(doc.last_modified)
    return last_modified < now - 3 && last_modified > timestamp
      ? last_modified
      : timestamp
  }, 0)
}

const reducer = (state, { type, ...values }) => {
  switch (type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications:
          window.innerWidth >= 576
            ? [...state.notifications, values.notification]
            : [values.notification, ...state.notifications]
      }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          n => !Object.values(n).some(v => v.includes(values.id))
        )
      }

    case 'SET_AREACODE': {
      const nextState = {
        ...state,
        areacode: values.areacode,
        docs: getDocs(state.docs, values.areacode, state.forecast)
      }

      return {
        ...nextState,
        lastModified: getLastModified(nextState.docs)
      }
    }

    case 'SET_DOCS': {
      const nextState = {
        ...state,
        docs: getDocs(values.docs, state.areacode, state.forecast)
      }

      return {
        ...nextState,
        lastModified: getLastModified(nextState.docs)
      }
    }

    case 'SET_FORECAST':
      return {
        ...state,
        docs: getDocs(state.docs, state.areacode, values.forecast),
        forecast: values.forecast
      }

    case 'SET_VALUES':
      return {
        ...state,
        ...values
      }

    default:
      throw new Error(`Unknown action type: ${type}`)
  }
}

const App = () => {
  const [state, dispatch] = useReducer(reducer, {
    areacode:
      new URLSearchParams(window.location.search).get('areacode') ||
      localStorage.areacode ||
      'fl',
    docs: [],
    forecast:
      new URLSearchParams(window.location.search).get('forecast') === 'true' ||
      localStorage.forecast === 'true' ||
      false,
    installEvent: undefined,
    lastChange: undefined,
    lastModified: undefined,
    notifications: [],
    sharebutton: false,
    tableview:
      new URLSearchParams(window.location.search).get('tableview') === 'true' ||
      localStorage.tableview === 'true' ||
      false
  })

  const handlePopstate = ({ state: { areacode, forecast, tableview } }) =>
    dispatch({ type: 'SET_AREACODE', areacode, forecast, tableview })

  const removeNotification = useCallback(id => {
    const el = document.querySelector(`div[data-id="${id}"]`)

    if (el) {
      el.classList.toggle('notification-in')
      el.classList.toggle('notification-out')
      return new Promise(resolve => {
        setTimeout(
          () => resolve(dispatch({ type: 'REMOVE_NOTIFICATION', id })),
          500
        )
      })
    } else {
      return Promise.resolve(dispatch({ type: 'REMOVE_NOTIFICATION', id }))
    }
  }, [])

  const addNotification = useCallback(
    (message = '', type = '', id = Math.random().toString()) => {
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: { id, message, type }
      })

      if (!type) {
        setTimeout(() => removeNotification(id), 5000)
      }

      return id
    },
    [removeNotification]
  )

  const handleInstall = () => {
    if (
      state.sharebutton &&
      !window.matchMedia('(display-mode: standalone)').matches
    ) {
      return alert(
        'Bitte klicken Sie auf den Teilen-Button und wählen Sie "Zum Startbildschirm hinzufügen" aus!'
      )
    }

    if (state.installEvent) {
      state.installEvent.prompt()
    }
  }

  useEffect(() => {
    if (!navigator.onLine) {
      addNotification(
        'Es besteht keine Internetverbindung. Die App befindet sich im Offline-Modus.',
        'warning',
        'offline'
      )
    }

    window.addEventListener('online', () => {
      removeNotification('offline').then(() =>
        addNotification('Die Internetverbindung wurde wiederhergestellt.')
      )
    })

    window.addEventListener('offline', () =>
      addNotification(
        'Es besteht keine Internetverbindung. Die App befindet sich im Offline-Modus.',
        'warning',
        'offline'
      )
    )
  }, [addNotification, removeNotification])

  useEffect(() => {
    replication.on('change', info => {
      dispatch({ type: 'SET_VALUES', lastChange: info })

      if (
        info.pending === 0 &&
        info.docs.some(doc => doc.areacode === state.areacode)
      ) {
        addNotification('Neue Daten geladen.')
      }
    })

    replication.on('denied', error =>
      addNotification(
        `Konnte nicht auf Datenbank zugreifen: ${error.message}`,
        'warning'
      )
    )

    replication.on('error', error =>
      addNotification(`Datenbankfehler: ${error.message}`, 'danger')
    )
  }, [addNotification, removeNotification, state.areacode])

  useEffect(() => {
    db.query(`areacode/${state.areacode}`, {
      descending: true,
      include_docs: true
    }).then(
      ({ rows }) =>
        dispatch({
          type: 'SET_DOCS',
          docs: rows.map(({ doc }) =>
            addIncidence(
              doc,
              rows.map(r => r.doc),
              areacodes[state.areacode].population
            )
          )
        }),
      error => {
        if (error.status !== 404) {
          console.error(error)
          addNotification(
            `Es ist ein Fehler aufgetreten: ${error.message}`,
            'danger'
          )
        }
      }
    )
  }, [addNotification, state.areacode, state.lastChange])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('areacode', state.areacode)
    params.set('forecast', state.forecast)
    params.set('tableview', state.tableview)

    localStorage.areacode = state.areacode
    localStorage.forecast = state.forecast
    localStorage.tableview = state.tableview

    if (window.location.search !== '?' + params.toString()) {
      window.history.pushState(
        {
          areacode: state.areacode,
          forecast: state.forecast,
          tableview: state.tableview
        },
        '',
        '?' + params.toString()
      )
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [state.areacode, state.forecast, state.tableview])

  useEffect(() => {
    registerServiceWorker(addNotification)
  }, [addNotification])

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    if (
      /iPhone|MacIntel/.test(navigator.platform) &&
      navigator.maxTouchPoints > 1
    ) {
      return dispatch({ type: 'SET_VALUES', sharebutton: true })
    }

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      dispatch({ type: 'SET_VALUES', installEvent: e })
    })
  }, [])

  const {
    areacode,
    docs,
    forecast,
    lastModified,
    notifications,
    sharebutton,
    tableview
  } = state

  return (
    <div id='app'>
      <h1>Zeitverlauf der Corona-Fälle in </h1>

      <div
        style={{
          fontSize: '2em',
          margin: '-0.5rem -0.5rem 2rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ width: 'auto' }}>
          <select
            onChange={({ target: { value } }) =>
              dispatch({ type: 'SET_AREACODE', areacode: value })
            }
            style={{ margin: '0.5rem', width: 'calc(100% - 1.5rem)' }}
            value={areacode}
          >
            {Object.entries(locations).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: 'auto' }}>
          <button
            className='selectbutton'
            onClick={() =>
              dispatch({ type: 'SET_VALUES', tableview: !tableview })
            }
            style={{ margin: '0.5rem' }}
            type='button'
          >
            {tableview ? (
              <IconTable width='1rem' />
            ) : (
              <IconChart width='1rem' />
            )}
          </button>
        </div>
      </div>

      <div id='container'>
        {docs.length === 0 ? (
          <Loading />
        ) : tableview ? (
          <Table docs={docs} />
        ) : (
          <LineChart
            areacode={areacode}
            className={forecast ? 'with-forecast' : undefined}
            docs={docs}
          />
        )}
      </div>

      <footer>
        <p>
          <label>
            <input
              checked={forecast}
              onChange={({ target: { checked } }) =>
                dispatch({ type: 'SET_FORECAST', forecast: checked })
              }
              type='checkbox'
            />
            Trend anzeigen
          </label>
        </p>

        <p>
          Datenquelle:{' '}
          <a href={areacodes[areacode].sourceUri}>
            {areacodes[areacode].sourceLabel}
          </a> / arcgis.com{' '}
          {lastModified
            ? ` (Letztes Update: ${new Date(lastModified).toLocaleString()})`
            : ''}
        </p>

        <p>
          *) Die 7-Tage-Inzidenz wird mit einer Einwohnerzahl von{' '}
          {formatNum(areacodes[areacode].population)} errechnet (Quelle:{' '}
          <a href={areacodes[areacode].populationSourceUri}>
            {areacodes[areacode].populationSourceLabel}
          </a>
          ).
        </p>

        <p>
          {(state.installEvent || sharebutton) && (
            <button className='sharebutton' onClick={() => handleInstall()}>
              Installieren
            </button>
          )}
        </p>

        <p>
          <a href='https://github.com/kkkrist/coronastats'>coronastats</a> v
          {version} by{' '}
          <a href='https://mundpropaganda.net'>
            &#123;M/<span style={{ color: '#eb0c00' }}>P</span>&#125;
          </a>
          {' · '}
          <a href='https://mundpropaganda.net/impressum'>Impressum</a>
          {' · '}
          <a href='https://mundpropaganda.net/datenschutzerklaerung'>
            Datenschutzerklärung
          </a>
        </p>
      </footer>

      <div id='notifications'>
        {notifications.map(n => (
          <div
            className='notification-in'
            data-id={n.id}
            key={n.id}
            onClick={() => removeNotification(n.id)}
          >
            <span className={n.type}>{n.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
