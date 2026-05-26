const localDataBaseUrl = "../pmtiles/output";
const releaseDataBaseUrl =
  "https://github.com/markmclaren/historical-basemaps/releases/latest/download";
const dataBaseUrl = isLocalRun() ? localDataBaseUrl : releaseDataBaseUrl;
const manifestUrl = `${dataBaseUrl}/historical-basemaps.layers.json`;
const archiveUrl = `${dataBaseUrl}/historical-basemaps.pmtiles`;
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const map = new maplibregl.Map({
  container: "map",
  style: "https://tiles.openfreemap.org/styles/liberty",
  center: [12, 24],
  zoom: 1.5,
  hash: true,
  renderWorldCopies: false,
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

const palette = [
  "#c8794d",
  "#cc9b44",
  "#8f6f43",
  "#5d8a6c",
  "#7c5b86",
  "#406c80",
  "#b9605b",
  "#6a7f2b",
];

const yearRange = document.getElementById("year-layer-range");
const yearDisplay = document.getElementById("year-layer-display");
const status = document.getElementById("status");
const projectionButtons = Array.from(document.querySelectorAll(".projection-button"));

let manifest;
let currentLayerId;
let worldLayers = [];
let currentProjection = "mercator";

function isLocalRun() {
  return ["", "localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function setStatus(message) {
  status.textContent = message;
}

function updateProjectionButtons() {
  projectionButtons.forEach((button) => {
    const isActive = button.dataset.projection === currentProjection;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setProjection(projection) {
  currentProjection = projection === "globe" ? "globe" : "mercator";
  map.setProjection({ type: currentProjection });
  updateProjectionButtons();
}

function buildColorClassExpression() {
  const expression = [
    "match",
    ["%", ["coalesce", ["to-number", ["get", "color_class"]], 0], palette.length],
  ];

  for (let index = 0; index < palette.length; index += 1) {
    expression.push(index, palette[index]);
  }

  expression.push(palette[0]);
  return expression;
}

function addPmtilesSource() {
  const sourceId = "historical-basemaps";
  if (map.getSource(sourceId)) {
    return sourceId;
  }

  map.addSource(sourceId, {
    type: "vector",
    url: `pmtiles://${archiveUrl}`,
  });

  return sourceId;
}

function hideBasemapLabels() {
  const style = map.getStyle();
  if (!style || !Array.isArray(style.layers)) {
    return;
  }

  for (const layer of style.layers) {
    if (layer.type !== "symbol") {
      continue;
    }

    // Keep labels that come from the historical PMTiles source.
    if (layer.source === "historical-basemaps") {
      continue;
    }

    if (map.getLayoutProperty(layer.id, "visibility") !== "none") {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }
}

function hideBasemapBoundaries() {
  const style = map.getStyle();
  if (!style || !Array.isArray(style.layers)) {
    return;
  }

  for (const layer of style.layers) {
    if (layer.type !== "line") {
      continue;
    }

    // Keep boundary lines that come from the historical PMTiles source.
    if (layer.source === "historical-basemaps") {
      continue;
    }

    const id = (layer.id || "").toLowerCase();
    const sourceLayer = (layer["source-layer"] || "").toLowerCase();
    const isAdministrativeBoundary =
      /boundary|admin|border|country|state|province/.test(id) ||
      /boundary|admin|border|country|state|province/.test(sourceLayer);

    if (!isAdministrativeBoundary) {
      continue;
    }

    if (map.getLayoutProperty(layer.id, "visibility") !== "none") {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  }
}

function removeLayerIfPresent(id) {
  if (map.getLayer(id)) {
    map.removeLayer(id);
  }
}

function updateHistoricalLayer(sourceLayer) {
  const sourceId = addPmtilesSource();
  const fillLayerId = "historical-fill";
  const lineLayerId = "historical-line";
  const labelLayerId = "historical-label";

  [fillLayerId, lineLayerId, labelLayerId].forEach(removeLayerIfPresent);

  map.addLayer({
    id: fillLayerId,
    type: "fill",
    source: sourceId,
    "source-layer": sourceLayer,
    paint: {
      "fill-color": buildColorClassExpression(),
      "fill-opacity": 0.28,
    },
  });

  map.addLayer({
    id: lineLayerId,
    type: "line",
    source: sourceId,
    "source-layer": sourceLayer,
    paint: {
      "line-color": "#4a3428",
      "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 6, 1.2],
      "line-opacity": 0.9,
    },
  });

  map.addLayer({
    id: labelLayerId,
    type: "symbol",
    source: sourceId,
    "source-layer": sourceLayer,
    minzoom: 2.5,
    layout: {
      "text-field": ["coalesce", ["get", "NAME"], ["get", "SUBJECTO"]],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], 3, 10, 6, 14],
    },
    paint: {
      "text-color": "#3f2415",
      "text-halo-color": "rgba(255,255,255,0.8)",
      "text-halo-width": 1,
    },
  });

  currentLayerId = sourceLayer;
  const selected = manifest.layers.find((layer) => layer.sourceLayer === sourceLayer);
  if (selected) {
    yearDisplay.textContent = selected.displayName;
  }
  setStatus(`Showing ${selected ? selected.displayName : sourceLayer}.`);
}

function setHistoricalLayerByIndex(indexValue) {
  if (!worldLayers.length) {
    return;
  }

  const index = Math.max(0, Math.min(worldLayers.length - 1, Number(indexValue)));
  const selected = worldLayers[index];
  yearRange.value = String(index);
  updateHistoricalLayer(selected.sourceLayer);
}

function populateYearRange() {
  worldLayers = manifest.layers.filter((layer) => layer.sourceLayer !== "places");

  if (!worldLayers.length) {
    yearDisplay.textContent = "No historical layers found.";
    return;
  }

  yearRange.min = "0";
  yearRange.max = String(worldLayers.length - 1);
  yearRange.step = "1";

  // Default to latest layer from the manifest ordering.
  const defaultIndex = worldLayers.length - 1;
  yearRange.value = String(defaultIndex);

  yearRange.addEventListener("input", () => setHistoricalLayerByIndex(yearRange.value));

  setHistoricalLayerByIndex(defaultIndex);
}

async function loadManifest() {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch layer manifest: ${response.status}`);
  }
  manifest = await response.json();
}

map.on("load", async () => {
  try {
    setProjection(currentProjection);
    hideBasemapLabels();
    hideBasemapBoundaries();
    await loadManifest();
    populateYearRange();
    addPmtilesSource();
  } catch (error) {
    console.error(error);
    setStatus(error.message);
  }
});

projectionButtons.forEach((button) => {
  button.addEventListener("click", () => setProjection(button.dataset.projection));
});

map.on("error", (event) => {
  if (event && event.error) {
    console.error(event.error);
    setStatus(`Map error: ${event.error.message}`);
  }
});
