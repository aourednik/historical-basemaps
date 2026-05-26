# PMTiles Conversion

This folder contains the rerunnable scripts for turning the repository's GeoJSON snapshots into a single PMTiles archive.

## What gets built

- `output/historical-basemaps.mbtiles`: intermediate vector tileset
- `output/historical-basemaps.pmtiles`: final PMTiles archive
- `output/historical-basemaps.layers.json`: generated layer manifest

Each historical GeoJSON file in `../geojson` becomes its own vector source layer.

Layer naming is stable and year-based:

- `world_bc123000.geojson` -> `world_123000_bce`
- `world_bc1.geojson` -> `world_1_bce`
- `world_1492.geojson` -> `world_1492_ce`
- `places.geojson` -> `places`

## Requirements

- `node`
- `tippecanoe`
- `pmtiles`

On macOS with Homebrew:

```bash
brew install tippecanoe pmtiles
```

## Run the build

From the repository root:

```bash
./pmtiles/precompute-color-classes.sh
./pmtiles/build-pmtiles.sh
```

The precompute step writes processed snapshots to `pmtiles/processed_geojson/` and adds a `color_class` property to each polygon feature in `world_*.geojson` files. This class is used by the MapLibre example to keep neighboring polygons visually distinct.

To use a different output basename:

```bash
./pmtiles/build-pmtiles.sh historical-basemaps-v1
```

The script is safe to rerun. It overwrites the previous `.mbtiles`, `.pmtiles`, and layer manifest outputs for the selected basename.

By default, `build-pmtiles.sh` uses `pmtiles/processed_geojson/` when it exists and contains world snapshots. To force raw source files from `geojson/`, run:

```bash
./pmtiles/build-pmtiles.sh --use-raw
```

## Build steps

1. Install the required tools.
2. Run `./pmtiles/precompute-color-classes.sh` from the repository root.
3. Run `./pmtiles/build-pmtiles.sh` from the repository root.
4. Open `pmtiles/output/historical-basemaps.layers.json` to see the generated source-layer names.
5. Use `pmtiles/output/historical-basemaps.pmtiles` in your viewer or publishing workflow.

## Layer strategy

The resulting archive contains one vector source layer per historical snapshot year.

Examples:

- `world_5000_bce` for `geojson/world_bc5000.geojson`
- `world_323_bce` for `geojson/world_bc323.geojson`
- `world_1492_ce` for `geojson/world_1492.geojson`
- `world_2010_ce` for `geojson/world_2010.geojson`
- `places` for `geojson/places.geojson`

This makes the year selection explicit in downstream styling code instead of mixing all years into a single layer.

## Neighbor contrast precompute

`./pmtiles/precompute-color-classes.sh` creates `pmtiles/processed_geojson/` and adds a `color_class` property to polygon features in each `world_*.geojson` snapshot.

- Adjacency is precomputed from shared polygon edges.
- A greedy graph-coloring pass assigns a compact integer `color_class`.
- The MapLibre example uses this property to assign contrasting fills to neighboring polygons.

`./pmtiles/build-pmtiles.sh` automatically uses `pmtiles/processed_geojson/` when available.

To skip the precomputed source and build directly from `geojson/`:

```bash
./pmtiles/build-pmtiles.sh --use-raw
```

## Rendering guidance

- Pick a single `world_*` layer when you want one historical snapshot on the map.
- Use the `places` layer separately and filter it by `inhabitedSince` and `inhabitedUntil` if you want time-aware settlements.
- Keep the original `NAME`, `SUBJECTO`, `PARTOF`, and `BORDERPRECISION` properties available for labeling and styling.

## Rebuilding

The conversion is designed to be rerun whenever files in `geojson/` change.

- Edit or add GeoJSON snapshots in `geojson/`.
- Rerun `./pmtiles/precompute-color-classes.sh`.
- Then rerun `./pmtiles/build-pmtiles.sh`.
- Replace the published PMTiles artifact with the new file from `pmtiles/output/`.

## Notes

- The build script sorts the year layers chronologically from oldest BCE snapshots to latest CE snapshots.
- The `places` layer is included separately because it spans multiple time periods and should generally be filtered by its own attributes.