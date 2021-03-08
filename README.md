# Corona Dashboard

This is an alternate dashboard for Corona Virus case numbers in some German regions. It does not rely solely on data provided by Robert Koch Institute like many others do. Instead most of the data comes from crawling websites and APIs  (sometimes hidden) of those regions which include much more detailed data like the number of recovered or actively affected patients. Additionally this data is made available over time which can lead to some interesting conclusions and allows for simple forecasting.

![Screenshot Chart](https://raw.githubusercontent.com/kkkrist/coronastats/master/screenshot_chart.webp)

![Screenshot Chart](https://raw.githubusercontent.com/kkkrist/coronastats/master/screenshot_table.webp)

Currently the following regions are supported:

- Flensburg
- Kassel
- Landkreis Kassel
- Landkreis Lüneburg
- Leipzig
- Kreis Herzogtum Lauenburg
- Kreis Plön
- Kreis Schleswig-Flensburg
- Kreis Stormarn

The selection is just based on my personal preference and requests from users. Be free to suggest more or even better provide a pull request for a crawler for other regions!

## Frontend

The frontend consists of a simple [React](https://github.com/facebook/react/) web application that also works as a [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps), so you can install it as a local app. Data is held in the local browser storage via [PouchDB](https://github.com/pouchdb/pouchdb) and synced in the background. Syncing is done transparently as needed and in real-time.

Together with employing [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) this enables the app to work offline without any restrictions (as you'd expect from a locally installed app).

Data is presented either as an interactive line chart or a sortable table (see screenshots above). You can also enable forecasting which tries to predict the next 7 days based on the available data . This is done live in the browser using the [Timeseries Analysis](https://github.com/26medias/timeseries-analysis) package.

## Backend

Data is stored in an [Apache CouchDB](https://github.com/apache/couchdb) database. You can find the design documents in the  `_design` folder (only used for authentication for now).

All data is being made publically available via common CouchDB APIs. Drop me a message if you want to use the data for other projects!

### Crawler

The crawler is based on [Node.js](https://github.com/nodejs/node). It's expected to be perdiodically run by systemd timers or cron jobs and consists of an individual module per region. The modules usually use [jsdom](https://github.com/jsdom/jsdom) to parse websites or the `http` module to fetch data from APIs.

Each crawler module is expected to return an array of objects which should contain data for a single day. Here's an example for such an object:

```json
[
  {
    "areacode": "fl", // *required
    "date": "2021-02-16T00:00:00.000Z",  // *required
    "deaths": 27,  // *required
    "infected": 1344,  // *required
    "quarantined": 676, // *optional
    "recovered": 780, // *optional
    "active": 537 // *optional
  }
]
```

Pull requests for more crawlers / regions are always welcome!

## License

This project's code is free software. You can redistribute it and/or modify it under the terms of the GNU General Public License v3.0.