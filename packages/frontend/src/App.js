import dayjs from 'dayjs'
import PouchDB from 'pouchdb'
import React, { useCallback, useEffect, useState } from 'react'
import IconChart from './components/IconChart'
import IconTable from './components/IconTable'
import LineChart from './components/LineChart'
import Loading from './components/Loading'
import Table from './components/Table'
import areacodes from './data/areacodes.json'
import { formatNum } from './utils/display'
import { addIncidence, forecast } from './utils/math'
import { version } from '../package.json'
import { register as registerServiceWorker } from './service-worker'
import './styles.css'

const db = new PouchDB('coronastats')
const replication = db.replicate.from(
  'https://api.mundpropaganda.net/coronastats',
  { live: true, retry: true }
)

const App = () => {
  const [areacode, setAreacode] = useState(
    new URLSearchParams(window.location.search).get('areacode') ||
      localStorage.areacode ||
      'fl'
  )
  const [docs, setDocs] = useState([])
  const [predictions, setPredictions] = useState([])
  const [installEvent, setInstallEvent] = useState()
  const [lastChange, setLastChange] = useState()
  const [lastModified, setLastModified] = useState()
  const [notifications, setNotifications] = useState([])
  const [sharebutton, setSharebutton] = useState(false)
  const [tableview, setTableview] = useState(
    new URLSearchParams(window.location.search).get('tableview') === 'true' ||
      localStorage.tableview === 'true' ||
      false
  )

  const handlePopstate = ({ state: { areacode, tableview } }) => {
    setAreacode(areacode)
    setTableview(tableview)
  }

  const removeNotification = useCallback(id => {
    const el = document.querySelector(`div[data-id="${id}"]`)

    if (el) {
      el.classList.toggle('notification-in')
      el.classList.toggle('notification-out')
      setTimeout(
        () => setNotifications(prevState => prevState.filter(n => n.id !== id)),
        500
      )
    } else {
      setNotifications(prevState => prevState.filter(n => n.id !== id))
    }
  }, [])

  const addNotification = useCallback(
    (message, type) => {
      const id = Math.random().toString()

      setNotifications(prevState =>
        window.innerWidth >= 768
          ? [...prevState, { id, message, type }]
          : [{ id, message, type }, ...prevState]
      )

      if (!type) {
        setTimeout(() => removeNotification(id), 5000)
      }

      return id
    },
    [removeNotification]
  )

  const handleInstall = () => {
    if (
      sharebutton &&
      !window.matchMedia('(display-mode: standalone)').matches
    ) {
      return alert(
        'Bitte klicken Sie auf den Teilen-Button und wählen Sie "Zum Startbildschirm hinzufügen" aus!'
      )
    }

    if (installEvent) {
      installEvent.prompt()
    }
  }

  useEffect(() => {
    if (!navigator.onLine) {
      addNotification(
        'Es besteht keine Internetverbindung. Die App befindet sich im Offline-Modus.',
        'warning'
      )
    }

    window.addEventListener('online', () => {
      setNotifications(prevState => {
        const id = prevState.find(n =>
          /keine Internetverbindung/.test(n.message)
        )?.id
        id && removeNotification(id)
        return prevState
      })

      addNotification('Die Internetverbindung wurde wiederhergestellt.')
    })

    window.addEventListener('offline', () =>
      addNotification(
        'Es besteht keine Internetverbindung. Die App befindet sich im Offline-Modus.',
        'warning'
      )
    )
  }, [addNotification, removeNotification])

  useEffect(() => {
    replication.on('change', info => {
      setLastChange(info)

      if (
        info.pending === 0 &&
        info.docs.some(doc => doc.areacode === areacode)
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
  }, [addNotification, areacode, removeNotification])

  useEffect(() => {
    db.query(`areacode/${areacode}`, {
      descending: true,
      include_docs: true
    }).then(
      ({ rows }) => {
        setDocs(
          rows.map(({ doc }) =>
            addIncidence(
              doc,
              rows.map(r => r.doc),
              areacodes[areacode].population
            )
          )
        )

        setLastModified(
          rows.reduce((timestamp, { value }) => {
            const last_modified = Date.parse(value.last_modified)
            return last_modified > timestamp ? last_modified : timestamp
          }, 0)
        )
      },
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
  }, [addNotification, areacode, lastChange])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('areacode', areacode)
    params.set('tableview', tableview)

    localStorage.areacode = areacode
    localStorage.tableview = tableview

    if (window.location.search !== '?' + params.toString()) {
      window.history.pushState(
        { areacode, tableview },
        '',
        '?' + params.toString()
      )
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [areacode, tableview])

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
      return setSharebutton(true)
    }

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      setInstallEvent(e)
    })
  }, [])

  useEffect(() => {
    if (docs.length === 0) {
      return
    }

    const lastDate = dayjs(docs[0].date)
    const nextPredictions = []

    for (let i = 1; i < 4; i++) {
      const nextForcast = forecast([...nextPredictions, ...docs].reverse())
      const date = lastDate.set('date', lastDate.date() + i).toISOString()

      nextPredictions.unshift({
        areacode,
        date,
        last_modified: new Date().toISOString(),
        prediction: true,
        _id: `${date}-${areacode}`,
        ...nextForcast
      })
    }

    setPredictions(
      nextPredictions.map(doc =>
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
      )
    )
  }, [areacode, docs])

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
            onChange={({ target: { value } }) => setAreacode(value)}
            style={{ margin: '0.5rem', width: 'calc(100% - 1.5rem)' }}
            value={areacode}
          >
            <option value='fl'>Flensburg</option>
            <option value='lg'>Landkreis Lüneburg</option>
            <option value='od'>Kreis Stormarn</option>
            <option value='plö'>Kreis Plön</option>
            <option value='rz'>Kreis Herzogtum Lauenburg</option>
            <option value='sl'>Kreis Schleswig-Flensburg</option>
          </select>
        </div>

        <div style={{ width: 'auto' }}>
          <button
            className='selectbutton'
            onClick={() => setTableview(prevState => !prevState)}
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
          <Table docs={[...predictions, ...docs]} />
        ) : (
          <LineChart
            areacode={areacode}
            docs={docs.filter(d => d.areacode === areacode)}
          />
        )}
      </div>

      <footer>
        <p>
          Datenquelle:{' '}
          <a href={areacodes[areacode].sourceUri}>
            {areacodes[areacode].sourceLabel}
          </a>
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
          {(installEvent || sharebutton) && (
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
