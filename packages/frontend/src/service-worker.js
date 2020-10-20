const registerValidSW = (swUrl, addNotification) => {
  navigator.serviceWorker
    .register(swUrl)
    .then(registration => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing

        if (installingWorker == null) {
          return
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              addNotification(
                'Es ist ein Update verfügbar. Schließen Sie das Browser-Fenster/-Tab und laden Sie die App neu!'
              )
            } else {
              addNotification('Die App ist nun offline verfügbar.')
            }
          }
        }
      }
    })
    .catch(error => {
      addNotification(
        `Fehler bei der Einrichtung des Offline-Modus: ${error}`,
        'danger'
      )
    })
}

const checkValidServiceWorker = (swUrl, addNotification) => {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' }
  })
    .then(response => {
      const contentType = response.headers.get('content-type')

      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then(registration => {
          registration.unregister().then(() => {
            window.location.reload()
          })
        })
      } else {
        registerValidSW(swUrl, addNotification)
      }
    })
    .catch(() => {})
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}/
    )
)

export const register = addNotification => {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href)

    if (publicUrl.origin !== window.location.origin) {
      return
    }

    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`

    if (isLocalhost) {
      checkValidServiceWorker(swUrl, addNotification)

      navigator.serviceWorker.ready.then(() => {
        console.log('Service worker is active')
      })
    } else {
      registerValidSW(swUrl, addNotification)
    }
  }
}

export const unregister = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister()
      })
      .catch(error => {
        console.error(error.message)
      })
  }
}
