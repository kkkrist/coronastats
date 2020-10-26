import dayjs from 'dayjs'
import React, { useCallback, useEffect, useState } from 'react'
import PouchDB from 'pouchdb'
import { ResponsiveLine } from '@nivo/line'
import areacodes from './areacodes.json'
import chartConfig from './chart-config'
import markers from './markers'
import { formatNum } from './utils'
import { version } from '../package.json'
import { register as registerServiceWorker } from './service-worker'

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
  const [installEvent, setInstallEvent] = useState()
  const [lastChange, setLastChange] = useState()
  const [lastModified, setLastModified] = useState()
  const [notifications, setNotifications] = useState([])
  const [sharebutton, setSharebutton] = useState(false)
  const [stats, setStats] = useState([])

  const handlePopstate = ({ state: { areacode } }) => setAreacode(areacode)

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
        setLastModified(
          rows.reduce((timestamp, { value }) => {
            const last_modified = Date.parse(value.last_modified)
            return last_modified > timestamp ? last_modified : timestamp
          }, 0)
        )

        setStats(
          rows.reduce(
            (acc, { value: doc }, index, arr) => {
              acc[0].data.unshift({ x: new Date(doc.date), y: doc.deaths })

              doc.active &&
                acc[1].data.unshift({
                  x: new Date(doc.date),
                  y: doc.active
                })

              doc.recovered &&
                acc[2].data.unshift({
                  x: new Date(doc.date),
                  y: doc.recovered ?? 0
                })

              const d = dayjs(doc.date)

              const rangeStart = arr.find(
                ({ value }) =>
                  dayjs(value.date).format('YYYY-MM-DD') ===
                  d.set('date', d.date() - 7).format('YYYY-MM-DD')
              )?.value

              if (rangeStart) {
                acc[3].data.unshift({
                  x: new Date(doc.date),
                  y: (
                    ((doc.infected - rangeStart.infected) /
                      areacodes[areacode].population) *
                    100000
                  ).toFixed(1)
                })
              }

              acc[4].data.unshift({
                x: new Date(doc.date),
                y: doc.infected
              })

              doc.quarantined &&
                acc[5].data.unshift({
                  x: new Date(doc.date),
                  y: doc.quarantined
                })

              return acc
            },
            [
              {
                color: '#FA5C3A',
                id: 'Todesfälle',
                data: []
              },
              {
                color: '#F79F39',
                id: 'aktive Fälle',
                data: []
              },
              {
                color: '#76CE6D',
                id: 'Genesene',
                data: []
              },
              {
                color: '#BB8DEE',
                id: '7-Tage-Inzidenz*',
                data: []
              },
              {
                color: '#E6B539',
                id: 'Infizierte',
                data: []
              },
              {
                color: '#48AFF3',
                id: 'unter Quarantäne',
                data: []
              }
            ]
          )
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
    const params = `?areacode=${areacode}`
    localStorage.areacode = areacode

    if (!window.location.search) {
      window.history.replaceState({ areacode }, '', params)
    } else if (window.location.search !== params) {
      window.history.pushState({ areacode }, '', params)
    }

    window.addEventListener('popstate', handlePopstate)
    return () => window.removeEventListener('popstate', handlePopstate)
  }, [areacode])

  useEffect(() => {
    registerServiceWorker(addNotification)
  }, [addNotification])

  useEffect(() => {
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
      return setSharebutton(true)
    }

    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      setInstallEvent(e)
    })
  }, [])

  return (
    <div id='app'>
      <h1>Zeitverlauf der Corona-Fälle in </h1>

      <div style={{ fontSize: '2em', marginBottom: '1.5rem' }}>
        <select
          onChange={({ target: { value } }) => {
            setStats([])
            setAreacode(value)
          }}
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

      <div id='container'>
        <div
          id='linechart'
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          {stats.length === 0 ? (
            <span>Bitte warten…</span>
          ) : (
            <ResponsiveLine
              data={stats}
              markers={markers[areacodes[areacode].state]}
              {...chartConfig}
            />
          )}
        </div>
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
            <button onClick={() => handleInstall()}>Installieren</button>
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
