#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const rawGeojsonDir = path.join(repoRoot, "geojson");
const processedGeojsonDir = path.join(__dirname, "processed_geojson");
const outputDir = path.join(__dirname, "output");

function parseArgs(argv) {
  const positional = [];
  let useRaw = false;
  let inputDir;

  for (const arg of argv) {
    if (arg === "--use-raw") {
      useRaw = true;
      continue;
    }

    if (arg.startsWith("--input-dir=")) {
      inputDir = arg.slice("--input-dir=".length);
      continue;
    }

    positional.push(arg);
  }

  return {
    outputBaseName: positional[0] || "historical-basemaps",
    useRaw,
    inputDir,
  };
}

function resolveGeojsonDir(options) {
  if (options.inputDir) {
    return path.isAbsolute(options.inputDir)
      ? options.inputDir
      : path.resolve(repoRoot, options.inputDir);
  }

  if (!options.useRaw && fs.existsSync(processedGeojsonDir)) {
    const hasProcessedWorldFiles = fs
      .readdirSync(processedGeojsonDir)
      .some((filename) => /^world_(bc)?\d+\.geojson$/i.test(filename));

    if (hasProcessedWorldFiles) {
      return processedGeojsonDir;
    }
  }

  return rawGeojsonDir;
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function ensureCommand(command) {
  const result = spawnSync("which", [command], { encoding: "utf8" });

  if (result.status !== 0) {
    fail(`Required command not found: ${command}`);
  }
}

function extractLayerDetails(filename) {
  if (filename === "places.geojson") {
    return {
      type: "places",
      sortYear: Number.POSITIVE_INFINITY,
      sourceLayer: "places",
      displayName: "Places",
      description: "Historical settlements and places with inhabitedSince and inhabitedUntil attributes.",
    };
  }

  const match = filename.match(/^world_(bc)?(\d+)\.geojson$/i);

  if (!match) {
    return null;
  }

  const isBce = Boolean(match[1]);
  const absoluteYear = Number.parseInt(match[2], 10);
  const year = isBce ? -absoluteYear : absoluteYear;
  const era = isBce ? "BCE" : "CE";
  const eraSuffix = isBce ? "bce" : "ce";

  return {
    type: "world",
    sortYear: year,
    sourceLayer: `world_${absoluteYear}_${eraSuffix}`,
    displayName: `World ${absoluteYear} ${era}`,
    description: `Historical world basemap snapshot for ${absoluteYear} ${era}.`,
  };
}

function getLayerManifest(geojsonDir, mbtilesPath, pmtilesPath) {
  const entries = fs
    .readdirSync(geojsonDir)
    .filter((filename) => filename.endsWith(".geojson"))
    .map((filename) => {
      const details = extractLayerDetails(filename);

      if (!details) {
        return null;
      }

      return {
        filename,
        filePath: path.join(geojsonDir, filename),
        ...details,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.sortYear === right.sortYear) {
        return left.filename.localeCompare(right.filename);
      }

      return left.sortYear - right.sortYear;
    });

  return {
    generatedAt: new Date().toISOString(),
    tilesetName: "Historical Basemaps",
    sourceDirectory: path.relative(repoRoot, geojsonDir),
    layerCount: entries.length,
    layers: entries.map((entry) => ({
      filename: entry.filename,
      sourceLayer: entry.sourceLayer,
      displayName: entry.displayName,
      description: entry.description,
      sortYear: Number.isFinite(entry.sortYear) ? entry.sortYear : null,
    })),
    build: {
      mbtiles: path.relative(repoRoot, mbtilesPath),
      pmtiles: path.relative(repoRoot, pmtilesPath),
    },
    tippecanoeLayers: entries,
  };
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    encoding: "utf8",
  });

  if (result.error) {
    fail(`${command} failed to start: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(`${command} exited with status ${result.status}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const geojsonDir = resolveGeojsonDir(options);

  if (!fs.existsSync(geojsonDir)) {
    fail(`GeoJSON directory not found: ${geojsonDir}`);
  }

  const outputBaseName = options.outputBaseName;
  const mbtilesPath = path.join(outputDir, `${outputBaseName}.mbtiles`);
  const pmtilesPath = path.join(outputDir, `${outputBaseName}.pmtiles`);

  ensureCommand("tippecanoe");
  ensureCommand("pmtiles");
  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = getLayerManifest(geojsonDir, mbtilesPath, pmtilesPath);

  if (manifest.layerCount === 0) {
    fail(`No supported GeoJSON files were found in ${geojsonDir}.`);
  }

  console.log(`Using GeoJSON source directory: ${path.relative(repoRoot, geojsonDir)}`);

  const tippecanoeArgs = [
    "--force",
    `--output=${mbtilesPath}`,
    "--name=Historical Basemaps",
    "--description=Historical basemaps as vector tiles grouped by year and places.",
    "--attribution=See the repository README for attribution, caveats, and usage guidance.",
    "--maximum-zoom=g",
    "--drop-densest-as-needed",
    "--extend-zooms-if-still-dropping",
    "--detect-longitude-wraparound",
    ...manifest.tippecanoeLayers.map((layer) =>
      `--named-layer=${JSON.stringify({
        file: layer.filePath,
        layer: layer.sourceLayer,
        description: layer.displayName,
      })}`,
    ),
  ];

  console.log(`Building MBTiles at ${path.relative(repoRoot, mbtilesPath)} ...`);
  run("tippecanoe", tippecanoeArgs);

  console.log(`Converting to PMTiles at ${path.relative(repoRoot, pmtilesPath)} ...`);
  run("pmtiles", ["convert", mbtilesPath, pmtilesPath, "--force"]);

  console.log("Build complete.");
  console.log(`PMTiles: ${path.relative(repoRoot, pmtilesPath)}`);
}

main();
