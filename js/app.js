/*
  app.js
  ------
  Entry point. theme.js, menu.js, map.js, places.js, and journeys.js each
  wire up their own DOM elements on load (they're small and self-
  contained, so there's nothing left to "start" here yet). This file
  exists as the single place future cross-module glue will live — e.g.
  once routing.js and navigation.js are built, they'll import getMap()
  from map.js and addJourney() from journeys.js, and that wiring will
  happen here rather than inside map.js or journeys.js themselves.
*/

console.log('RouteSync loaded.');