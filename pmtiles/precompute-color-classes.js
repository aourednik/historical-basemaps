#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const rawGeojsonDir = path.join(repoRoot, "geojson");
const processedGeojsonDir = path.join(__dirname, "processed_geojson");
const worldFilePattern = /^world_(bc)?\d+\.geojson$/i;
const precision = 1e6;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function pointKey(point) {
  const x = Math.round(point[0] * precision);
  const y = Math.round(point[1] * precision);
  return `${x},${y}`;
}

function edgeKey(pointA, pointB) {
  const keyA = pointKey(pointA);
  const keyB = pointKey(pointB);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
}

function forEachRing(geometry, callback) {
  if (!geometry) {
    return;
  }

  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates) {
      callback(ring);
    }
    return;
  }

  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        callback(ring);
      }
    }
  }
}

function isPolygonGeometry(geometry) {
  return Boolean(geometry) && (geometry.type === "Polygon" || geometry.type === "MultiPolygon");
}

function buildAdjacency(features) {
  const polygonIndexes = [];
  const edgeToFeatureIndexes = new Map();

  for (let index = 0; index < features.length; index += 1) {
    const feature = features[index];

    if (!isPolygonGeometry(feature.geometry)) {
      continue;
    }

    polygonIndexes.push(index);

    const featureEdgeKeys = new Set();

    forEachRing(feature.geometry, (ring) => {
      if (!Array.isArray(ring) || ring.length < 2) {
        return;
      }

      for (let i = 0; i < ring.length - 1; i += 1) {
        const a = ring[i];
        const b = ring[i + 1];

        if (!Array.isArray(a) || !Array.isArray(b) || a.length < 2 || b.length < 2) {
          continue;
        }

        const key = edgeKey(a, b);
        featureEdgeKeys.add(key);
      }
    });

    for (const key of featureEdgeKeys) {
      const list = edgeToFeatureIndexes.get(key);
      if (list) {
        list.push(index);
      } else {
        edgeToFeatureIndexes.set(key, [index]);
      }
    }
  }

  const adjacency = new Map();
  for (const index of polygonIndexes) {
    adjacency.set(index, new Set());
  }

  for (const featureIndexes of edgeToFeatureIndexes.values()) {
    if (featureIndexes.length < 2) {
      continue;
    }

    for (let i = 0; i < featureIndexes.length; i += 1) {
      for (let j = i + 1; j < featureIndexes.length; j += 1) {
        const left = featureIndexes[i];
        const right = featureIndexes[j];
        adjacency.get(left).add(right);
        adjacency.get(right).add(left);
      }
    }
  }

  return { polygonIndexes, adjacency };
}

function colorAdjacency(polygonIndexes, adjacency) {
  const ordered = [...polygonIndexes].sort((left, right) => {
    const leftDegree = adjacency.get(left).size;
    const rightDegree = adjacency.get(right).size;
    if (leftDegree === rightDegree) {
      return left - right;
    }
    return rightDegree - leftDegree;
  });

  const colorByFeatureIndex = new Map();
  let maxColor = -1;

  for (const index of ordered) {
    const usedColors = new Set();
    for (const neighbor of adjacency.get(index)) {
      if (colorByFeatureIndex.has(neighbor)) {
        usedColors.add(colorByFeatureIndex.get(neighbor));
      }
    }

    let color = 0;
    while (usedColors.has(color)) {
      color += 1;
    }

    colorByFeatureIndex.set(index, color);
    if (color > maxColor) {
      maxColor = color;
    }
  }

  return {
    colorByFeatureIndex,
    colorCount: maxColor + 1,
  };
}

function processWorldFile(inputPath, outputPath) {
  const json = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const features = Array.isArray(json.features) ? json.features : [];

  const { polygonIndexes, adjacency } = buildAdjacency(features);
  const { colorByFeatureIndex, colorCount } = colorAdjacency(polygonIndexes, adjacency);

  for (let index = 0; index < features.length; index += 1) {
    const feature = features[index];
    const props = feature.properties && typeof feature.properties === "object"
      ? feature.properties
      : {};

    feature.properties = props;

    if (colorByFeatureIndex.has(index)) {
      feature.properties.color_class = colorByFeatureIndex.get(index);
    } else {
      feature.properties.color_class = null;
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(json));

  return {
    featureCount: features.length,
    polygonFeatureCount: polygonIndexes.length,
    colorCount,
  };
}

function main() {
  if (!fs.existsSync(rawGeojsonDir)) {
    fail(`GeoJSON directory not found: ${rawGeojsonDir}`);
  }

  fs.mkdirSync(processedGeojsonDir, { recursive: true });

  const files = fs.readdirSync(rawGeojsonDir).filter((filename) => filename.endsWith(".geojson"));

  if (files.length === 0) {
    fail("No GeoJSON files found in geojson/.");
  }

  let processedWorldFiles = 0;

  for (const filename of files) {
    const inputPath = path.join(rawGeojsonDir, filename);
    const outputPath = path.join(processedGeojsonDir, filename);

    if (worldFilePattern.test(filename)) {
      const stats = processWorldFile(inputPath, outputPath);
      processedWorldFiles += 1;
      console.log(
        `Processed ${filename}: ${stats.polygonFeatureCount} polygon features, ${stats.colorCount} color classes.`,
      );
    } else {
      fs.copyFileSync(inputPath, outputPath);
      console.log(`Copied ${filename} unchanged.`);
    }
  }

  console.log(`Done. Processed world snapshots: ${processedWorldFiles}`);
  console.log(`Output directory: ${path.relative(repoRoot, processedGeojsonDir)}`);
}

main();