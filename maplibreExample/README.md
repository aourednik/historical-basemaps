# MapLibre PMTiles Example

This example shows how to load `pmtiles/output/historical-basemaps.pmtiles` into MapLibre GL JS with an OpenFreeMap basemap.

When it runs locally, it loads generated files from `../pmtiles/output/`.
When it runs from GitHub Pages, it loads the committed PMTiles archive from `assets/` so the archive is served from the same origin as the page.

## Run it

Serve the repository over HTTP with byte-range support and open `maplibreExample/index.html`.

For example:

```bash
npx http-server . -p 8000 -c-1 --cors
```

Then open:

```text
http://localhost:8000/maplibreExample/
```

`PMTiles` requires HTTP range requests, so avoid `python3 -m http.server` for this example.

## What it does

- Uses the PMTiles archive metadata to drive a year range slider.
- Uses the generated `../pmtiles/output/historical-basemaps.pmtiles` archive as a vector source.
- Colors polygons using precomputed `color_class` values for better neighboring contrast.
- Switches automatically between the local generated archive and the committed GitHub Pages archive based on the page host.

Rebuild the PMTiles archive first if the files in `geojson/` have changed:

```bash
./pmtiles/precompute-color-classes.sh
./pmtiles/build-pmtiles.sh
cp pmtiles/output/historical-basemaps.pmtiles maplibreExample/assets/historical-basemaps.pmtiles
```
