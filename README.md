# heatmap

Examples: [hertzen.com](http://heatmap-js.herokuapp.com/) | [html2canvas.hertzen.com](http://heatmap-js.herokuapp.com/html2canvas.html)

Click heatmap from Google Analytics. This repo only illustrates an example of setting up Google service accounts to retrieve data from Google Analytics API and converting the data into a heatmap
with canvas. To actually gather click tracking data, you need to setup some custom events in your Google analytics.

## Getting Started

### Locally ###

Install dependencies

`npm install`

Set the `SERVICE_ACCOUNT` environment variable to point to your Google service account that has access to the target Google analytics account. For more information on service accounts, check
the documentation for them at [developers.google.com](https://developers.google.com/accounts/docs/OAuth2ServiceAccount).

### Heroku setup

Create a new Heroku application.

Set the following environment variable:
`heroku config:set SERVICE_ACCOUNT=[Your Google service account id] --app [Your Heroku application name]`

Define your Google accountId, host names to be used, and optionally if you want to setup path's to crawl.

Examples for creating heatmaps can be found under `assets/drawing.js`, `index.html` and `html2canvas.html`.


## License
Copyright (c) 2013 Niklas von Hertzen  
Licensed under the MIT license.
