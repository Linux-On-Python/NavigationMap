What it actually does


Real map, real location. Uses the browser's Geolocation API to center on your actual position (continuously tracked, with a visible accuracy radius so low-accuracy readings are honest rather than hidden), rendered with Leaflet.js on free OpenStreetMap tiles.
Real search and routing. Type a destination and get up to five real matching places (via Nominatim geocoding) or tap anywhere on the map to reverse-geocode that spot. Routes are calculated by OSRM's free public routing server and drawn on the map.
Two-step trip flow. Tapping "Go" only previews a route — a separate "Start trip" button is what actually begins turn-by-turn navigation, so you can review a route before committing to it. "Cancel" is available both before starting (dismiss the preview) and during an active trip (stop navigation).
Tails voice guidance. Real spoken turn-by-turn directions via the Web Speech API, in an upbeat, in-character voice, pulled from a bank of Tails-style phrases per event (starting a trip, turning left/right, continuing straight, roundabouts, arriving). Mutable mid-trip.
Saved places. Favorite spots, "want to visit" places, and custom categories (College, Supermarket, Pharmacy, etc.), each with a small colored badge. Places saved from the map or search carry real coordinates, so tapping them later routes there instantly; each can also be deleted.
Recent journeys. The last three real trips you've actually taken, most recent first — no placeholder data.
Dark/light mode. Follows the OS/browser preference automatically, with a manual override toggle that's remembered across visits.
Works offline once loaded. A service worker caches the entire app shell and every map tile you've actually browsed, so the app opens and shows previously-seen areas with no connection. A trip already in progress keeps giving turn-by-turn voice directions offline too, since it doesn't need the network again once it's started.
Honest limitations

This project is built entirely on free, publicly available services, which comes with real trade-offs worth stating plainly rather than glossing over:

No live traffic. OSRM's free routing calculates the shortest route by road topology and speed limits only — there's no free equivalent to Google's real-time, crowd-sourced traffic data, so "fastest route" here means "fastest by road network," not "fastest right now."
No new routes or searches offline. Search (Nominatim) and routing (OSRM) are both external network calls with no free offline equivalent. Only a trip that's already been started keeps working without a connection.
Search quality depends on OpenStreetMap's data. Abbreviations or informal names (e.g. a university's short-form nickname) may not match unless that exact alias exists in OSM's data — there's no large commercial alias/business database behind it the way Google Maps has.
Map POIs aren't clickable. The map tiles are images, not interactive data — tapping near a labeled business only gives raw coordinates, which are then reverse-geocoded to a best-guess nearby address, not a guaranteed match to the icon you tapped.
Offline maps are "wherever you've been," not "download a country." Bulk tile downloading isn't permitted under free tile providers' usage policies. Coverage builds up naturally as you use the app in an area.
"Add place" and category entry still use plain browser prompts, not a polished form — a known rough edge, left as a good next improvement.
Tech stack
HTML5, CSS3, vanilla JavaScript (ES modules) — no framework, no build step, no bundler.
Leaflet.js for the map.
OpenStreetMap tiles (free, attribution required).
Nominatim for geocoding/reverse geocoding.
OSRM public demo server for routing.
Web Speech API (browser-native) for voice.
Geolocation API (browser-native) for positioning.
localStorage for saved places, journeys, and theme preference.
A Service Worker + Cache API for offline app-shell and tile caching.

**This project is still under active development.**
