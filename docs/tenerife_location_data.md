# Tenerife Location Data Notes

## Current Runtime Approach

The current `tenerife-island-location.glb` is a lightweight art blockout, not GIS terrain.
It uses a procedural island mesh with authored city pads and landmarks so the browser can keep the
asset small while we iterate on gameplay scale and composition.

## Puerto de la Cruz Blockout Anchors

Used for the first city pass:

- Historic center: Plaza del Charco, fishing pier / Casa de la Aduana, Plaza de Europa, San Telmo.
- East waterfront: Lago Martianez and Avenida Colon / Martianez promenade.
- West waterfront: Playa Jardin and Castillo San Felipe.
- Inland / upper town: Botanical Garden, La Paz / Martianez slope direction.
- West visitor anchor: Loro Parque.

Useful factual anchors:

- Puerto de la Cruz is on the northern coast of Tenerife, near La Orotava, and is the smallest
  municipality on the island by area.
- The center is close to sea level, while the municipality rises inland toward volcanic slopes.
- Plaza del Charco is treated as the social/historic center.
- Lago Martianez is a coastal saltwater pool complex designed by Cesar Manrique.
- Castillo San Felipe sits near Playa Jardin on the western waterfront.

## Source Links

- Puerto de la Cruz overview: https://en.wikipedia.org/wiki/Puerto_de_la_Cruz
- Tourist map / landmark grouping: https://puertodelacruztn.com/mapaturistico.html
- Plaza del Charco notes: https://puertodelacruztn.com/plazadelcharco.html
- Lago Martianez notes: https://empresas.puertodelacruz.es/node/34
- Tenerife OpenStreetMap page: https://wiki.openstreetmap.org/wiki/Tenerife

## Next Data Upgrade

When we move from blockout to real layout, use:

- OpenStreetMap building footprints and roads for Puerto de la Cruz.
- CNIG/IGN MDT05 or Copernicus DEM for terrain.
- A chunked export strategy: full island as low-poly LOD, detailed city chunks loaded only nearby.
