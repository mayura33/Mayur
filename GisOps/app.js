// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
const FEATURE_TOGGLES = {
  storyCreator: false,
  autoConvexHull: true
};

const BASEMAP_TILES = {
  cartodb_dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }
  },
  cartodb_light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }
  },
  cartodb_voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }
  },
  esri_satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    }
  },
  osm_standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }
  }
};

// Register Proj4 British National Grid projection
proj4.defs("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs");

// Application State
let map = null;
let currentBaseLayer = null;
let loadedLayers = []; // Array of { id, name, type, layer, visible: true, text, measurement, color, editing: false, strokeWidth, strokeOpacity, strokeDash, fillColor, fillOpacity, markerType, markerRadius, markerIcon, markerIconSize }
let layerIdCounter = 0;
let activeUploadedFile = null; // { name, extension, content }
let storySlides = []; // Array of { id, title, desc, center: [lat, lng], zoom }
let activeSlideIndex = 0;
let slideIdCounter = 0;

// Advanced Features State
let activeMeasureMode = null; // 'line', 'polygon', or null
let measureWorkingLayer = null; // Leaflet-Geoman working layer reference
let measureDrawStartHandler = null; // Reference to measurement drawstart handler
let measureCreateHandler = null; // Reference to measurement create handler
let userLocationMarker = null; // Pulser GPS dot marker
let liveConvexHullLayer = null; // Global layer for Live Convex Hull
let userLocationCircle = null; // GPS Accuracy circle
let activeStyleLayerId = null; // ID of layer currently open in style editor

// Visual Suite State
let isSwipeActive = false;
let secondarySwipeLayer = null;
let activeAnalyticsLayerId = null;
let geometryChart = null; // Chart.js geometry breakdown instance
let attributesChart = null; // Chart.js attribute distribution instance
let storyFlowPathLine = null; // presentation path tracer line reference

// Visual Expansion Suite State
let activeTimelineLayerId = null;
let timelineTimer = null;
let timelineSliderDates = [];
let elevationChart = null;
let liveFeeds = { earthquakes: null, weather: null };
let isochroneClickActive = false;
let isochroneLayerGroup = null;
let isTimezoneLookupActive = false;

// Elements Cache
const elements = {
  formatSelect: document.getElementById('format-select'),
  projectionSelectContainer: document.getElementById('projection-select-container'),
  projectionSelect: document.getElementById('projection-select'),
  geoInput: document.getElementById('geo-input'),
  btnClearInput: document.getElementById('btn-clear-input'),
  btnVisualize: document.getElementById('btn-visualize'),
  btnClearAll: document.getElementById('btn-clear-all'),
  btnFitAll: document.getElementById('btn-fit-all'),
  
  // Tab Elements
  tabBtnText: document.getElementById('tab-btn-text'),
  tabBtnUrl: document.getElementById('tab-btn-url'),
  
  // URL Loader Elements
  urlInputContainer: document.getElementById('url-input-container'),
  geoUrlInput: document.getElementById('geo-url-input'),
  btnFetchUrl: document.getElementById('btn-fetch-url'),
  textInputWrapper: document.getElementById('text-input-wrapper'),
  fileUploaderWrapper: document.getElementById('file-uploader-wrapper'),
  
  // File Uploader Elements
  fileInput: document.getElementById('file-input'),
  fileDropzone: document.getElementById('file-dropzone'),
  uploadedFileBadge: document.getElementById('uploaded-file-badge'),
  uploadedFileName: document.getElementById('uploaded-file-name'),
  btnRemoveFile: document.getElementById('btn-remove-file'),
  
  // Validation Elements
  validationPanel: document.getElementById('validation-panel'),
  validationIcon: document.getElementById('validation-icon'),
  validationTitle: document.getElementById('validation-title'),
  validationMessage: document.getElementById('validation-message'),
  
  // Layers Elements
  layerCounter: document.getElementById('layer-counter'),
  emptyLayersMessage: document.getElementById('empty-layers-message'),
  layersList: document.getElementById('layers-list'),
  
  // Basemap & Opacity Elements
  btnBasemapToggle: document.getElementById('btn-basemap-toggle'),
  basemapDropdown: document.getElementById('basemap-dropdown'),
  basemapOptionCards: document.querySelectorAll('.basemap-option-card'),
  basemapOpacityValue: document.getElementById('basemap-opacity-value'),
  basemapOpacitySlider: document.getElementById('basemap-opacity-slider'),
  
  coordLat: document.getElementById('coord-lat'),
  coordLng: document.getElementById('coord-lng'),
  
  // Spatial Analysis Elements
  analysisLayerSelect: document.getElementById('analysis-layer-select'),
  analysisBufferDistance: document.getElementById('analysis-buffer-distance'),
  btnAnalysisBuffer: document.getElementById('btn-analysis-buffer'),
  btnAnalysisCentroid: document.getElementById('btn-analysis-centroid'),
  btnAnalysisEnvelope: document.getElementById('btn-analysis-envelope'),
  
  // Attribute Table Elements
  attributeTablePanel: document.getElementById('attribute-table-panel'),
  tableHeader: document.getElementById('table-header'),
  tableToggleIcon: document.getElementById('table-toggle-icon'),
  tableLayerName: document.getElementById('table-layer-name'),
  tableContentWrapper: document.getElementById('table-content-wrapper'),

  // Story Creator & Search Elements
  tabBtnStory: document.getElementById('tab-btn-story'),
  geometryInputPanel: document.getElementById('geometry-input-panel'),
  storyCreatorPanel: document.getElementById('story-creator-panel'),
  storySlidesContainer: document.getElementById('story-slides-container'),
  storyEmptyMessage: document.getElementById('story-empty-message'),
  storySlidesList: document.getElementById('story-slides-list'),
  btnPlayStory: document.getElementById('btn-play-story'),
  storyActionsRow: document.getElementById('story-actions-row'),
  btnAddStorySlide: document.getElementById('btn-add-story-slide'),
  
  // Search Overlay
  searchControl: document.getElementById('search-control'),
  mapSearchInput: document.getElementById('map-search-input'),
  btnMapSearch: document.getElementById('btn-map-search'),
  searchResultsList: document.getElementById('search-results-list'),
  
  // Story Player Card
  storyPlayerCard: document.getElementById('story-player-card'),
  playerSlideIndex: document.getElementById('player-slide-index'),
  btnCloseStoryPlayer: document.getElementById('btn-close-story-player'),
  playerSlideTitle: document.getElementById('player-slide-title'),
  playerSlideDesc: document.getElementById('player-slide-desc'),
  btnPrevSlide: document.getElementById('btn-prev-slide'),
  btnNextSlide: document.getElementById('btn-next-slide'),
  playerNavDots: document.getElementById('player-nav-dots'),

  // NEW Advanced Features Elements
  btnLocateUser: document.getElementById('btn-locate-user'),
  btnMeasureTool: document.getElementById('btn-measure-tool'),
  measurementControl: document.getElementById('measurement-control'),
  btnCloseMeasure: document.getElementById('btn-close-measure'),
  btnMeasureLine: document.getElementById('btn-measure-line'),
  btnMeasurePoly: document.getElementById('btn-measure-poly'),
  measureCurrentValue: document.getElementById('measure-current-value'),

  styleEditorPanel: document.getElementById('style-editor-panel'),
  btnCloseStyleEditor: document.getElementById('btn-close-style-editor'),
  styleLayerTitle: document.getElementById('style-layer-title'),
  styleStrokeColor: document.getElementById('style-stroke-color'),
  styleStrokeWeight: document.getElementById('style-stroke-weight'),
  styleStrokeOpacity: document.getElementById('style-stroke-opacity'),
  styleStrokeDash: document.getElementById('style-stroke-dash'),
  valStrokeWeight: document.getElementById('val-stroke-weight'),
  valStrokeOpacity: document.getElementById('val-stroke-opacity'),
  styleGroupFill: document.getElementById('style-group-fill'),
  styleFillColor: document.getElementById('style-fill-color'),
  styleFillOpacity: document.getElementById('style-fill-opacity'),
  valFillOpacity: document.getElementById('val-fill-opacity'),
  styleGroupMarker: document.getElementById('style-group-marker'),
  styleMarkerType: document.getElementById('style-marker-type'),
  styleMarkerCircleOptions: document.getElementById('style-marker-circle-options'),
  styleMarkerRadius: document.getElementById('style-marker-radius'),
  valMarkerRadius: document.getElementById('val-marker-radius'),
  styleMarkerIconOptions: document.getElementById('style-marker-icon-options'),
  styleMarkerIconSelect: document.getElementById('style-marker-icon-select'),
  styleMarkerIconSize: document.getElementById('style-marker-icon-size'),
  valMarkerIconSize: document.getElementById('val-marker-icon-size'),

  tableFilterRow: document.getElementById('table-filter-row'),
  tableFilterInput: document.getElementById('table-filter-input'),
  btnClearTableFilter: document.getElementById('btn-clear-table-filter'),
  tableFilterCount: document.getElementById('table-filter-count'),

  opLayerA: document.getElementById('op-layer-a'),
  opLayerB: document.getElementById('op-layer-b'),
  opTypeSelect: document.getElementById('op-type-select'),
  btnRunOperation: document.getElementById('btn-run-operation'),

  // Visual Suite Elements
  btnSwipeToggle: document.getElementById('btn-swipe-toggle'),
  swipeDivider: document.getElementById('swipe-divider'),
  
  // Analytics Dashboard Elements
  analyticsDashboardPanel: document.getElementById('analytics-dashboard-panel'),
  btnCloseAnalytics: document.getElementById('btn-close-analytics'),
  analyticsLayerTitle: document.getElementById('analytics-layer-title'),
  kpiFeaturesCount: document.getElementById('kpi-features-count'),
  kpiMeasurementSum: document.getElementById('kpi-measurement-sum'),
  kpiCentroid: document.getElementById('kpi-centroid'),
  kpiIntersectCount: document.getElementById('kpi-intersect-count'),
  kpiUnionCount: document.getElementById('kpi-union-count'),
  analyticsAttributeSelect: document.getElementById('analytics-attribute-select'),
  chartGroupAttributes: document.getElementById('chart-group-attributes'),
  btnAnalysisHeatmap: document.getElementById('btn-analysis-heatmap'),

  // Visual Expansion Suite Elements
  feedWeatherRadar: document.getElementById('feed-weather-radar'),
  feedEarthquakes: document.getElementById('feed-earthquakes'),
  btnAnalysisIsochrone: document.getElementById('btn-analysis-isochrone'),
  
  timelinePlayerPanel: document.getElementById('timeline-player-panel'),
  btnCloseTimeline: document.getElementById('btn-close-timeline'),
  btnTimelinePlay: document.getElementById('btn-timeline-play'),
  timelineSlider: document.getElementById('timeline-slider'),
  timelineSpeed: document.getElementById('timeline-speed'),
  timelineLayerName: document.getElementById('timeline-layer-name'),
  timelineStartVal: document.getElementById('timeline-start-val'),
  timelineCurrentVal: document.getElementById('timeline-current-val'),
  timelineEndVal: document.getElementById('timeline-end-val'),

  elevationProfilePanel: document.getElementById('elevation-profile-panel'),
  btnCloseElevation: document.getElementById('btn-close-elevation'),
  elevationLayerName: document.getElementById('elevation-layer-name'),
  elevationEmptyState: document.getElementById('elevation-empty-state'),
  
  styleMarkerClusterCheckbox: document.getElementById('style-marker-cluster-checkbox'),
  btnTimezoneLookup: document.getElementById('btn-timezone-lookup')
};

const DEFAULT_VECTOR_RENDERER = L.canvas({ padding: 0.5 });
const CONVEX_HULL_DEBOUNCE_MS = 150;
const ANALYTICS_TOPOLOGY_FEATURE_LIMIT = 250;
let liveConvexHullTimer = null;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function formatPropertyValue(value) {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
}

function normalizeHexColor(color, fallback = '#8b5cf6') {
  let value = String(color || '').trim();
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    value = `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function formatArea(areaSqM, decimals = 3) {
  return areaSqM >= 1000000
    ? `${(areaSqM / 1000000).toFixed(decimals)} sq km`
    : `${Math.round(areaSqM).toLocaleString()} sq m`;
}

function scheduleLiveConvexHullUpdate() {
  if (liveConvexHullTimer) {
    clearTimeout(liveConvexHullTimer);
  }
  liveConvexHullTimer = setTimeout(() => {
    liveConvexHullTimer = null;
    updateLiveConvexHull();
  }, CONVEX_HULL_DEBOUNCE_MS);
}

function updateLayerListPreview(layerRecord) {
  if (!layerRecord || !elements.layersList) return;
  const li = elements.layersList.querySelector(`[data-layer-id="${layerRecord.id}"]`);
  if (!li) return;

  const safeColor = normalizeHexColor(layerRecord.color);
  const iconEl = li.querySelector('.layer-icon');
  const picker = li.querySelector('.layer-color-picker');

  if (iconEl) {
    iconEl.style.backgroundColor = `${safeColor}15`;
    iconEl.style.color = safeColor;
  }
  if (picker) {
    picker.value = safeColor;
  }
}

// ==========================================================================
// MAP INITIALIZATION & GIS CONTROLS
// ==========================================================================
function initMap() {
  // Start centered on London/Greenwich area to showcase standard/BNG coordinate conversions
  map = L.map('map', {
    zoomControl: true,
    preferCanvas: true,
    renderer: DEFAULT_VECTOR_RENDERER,
    center: [51.4800, -0.0015],
    zoom: 13
  });

  map.zoomControl.setPosition('topleft');

  // Load basemap from localStorage or default to cartodb_dark
  const storedBasemap = localStorage.getItem('geoviewer_basemap_id') || 'cartodb_dark';
  setBasemap(storedBasemap);

  // Apply feature toggles
  if (!FEATURE_TOGGLES.storyCreator) {
    if (elements.tabBtnStory) {
      elements.tabBtnStory.style.display = 'none';
    }
  }

  // Initialize Leaflet-Geoman Drawing Controls
  map.pm.addControls({
    position: 'topleft',
    drawMarker: true,
    drawCircleMarker: false,
    drawPolyline: true,
    drawRectangle: true,
    drawPolygon: true,
    drawCircle: true,
    editMode: false,
    dragMode: false,
    cutPolygon: false,
    removalMode: false
  });

  // Set drawing options to match our default styling
  map.pm.setPathOptions({
    color: '#8b5cf6',
    fillColor: '#6366f1',
    fillOpacity: 0.15,
    weight: 3
  });

  // Listen to shape creation events
  map.on('pm:create', function(e) {
    if (activeMeasureMode) return;

    const layer = e.layer;
    const shapeType = e.shape; // Marker, Polyline, Polygon, Rectangle, Circle
    let geojson = layer.toGeoJSON();

    // Leaflet-Geoman circle toGeoJSON exports as standard Point. Write the radius back!
    if (layer instanceof L.Circle) {
      geojson.properties = {
        name: `Drawn Circle`,
        radius: layer.getRadius()
      };
    } else {
      geojson.properties = {
        name: `Drawn ${shapeType}`
      };
    }

    // Remove the temporary geoman layer; addGeometryToMap will create a tracked Leaflet GeoJSON layer
    map.removeLayer(layer);

    const geomLabel = geojson.geometry ? geojson.geometry.type : "Circle";
    const layerName = `Drawn ${geomLabel} #${loadedLayers.length + 1}`;

    const parsedResult = {
      type: 'geojson',
      data: geojson,
      summary: geomLabel,
      originalCRS: 'EPSG:4326'
    };

    addGeometryToMap(parsedResult, layerName);

    // Populate textarea with GeoJSON Representation
    elements.geoInput.value = JSON.stringify(geojson, null, 2);
    elements.formatSelect.value = 'geojson';
    updateFormatDependentUI();

    showValidationStatus('success', 'Shape Created', `Successfully added drawn ${geomLabel} to Active Layers.`);
  });

  // Track coordinates on mouse hover
  map.on('mousemove', function(e) {
    elements.coordLat.textContent = e.latlng.lat.toFixed(6);
    elements.coordLng.textContent = e.latlng.lng.toFixed(6);
  });

  // Register basemap opacity slider listener
  elements.basemapOpacitySlider.addEventListener('input', (e) => {
    const val = e.target.value;
    elements.basemapOpacityValue.textContent = `${val}%`;
    if (currentBaseLayer) {
      currentBaseLayer.setOpacity(val / 100);
    }
  });

  // Register input source tabs
  elements.tabBtnText.addEventListener('click', () => switchInputTab('text'));
  elements.tabBtnUrl.addEventListener('click', () => switchInputTab('url'));

  // Register remote URL fetcher
  elements.btnFetchUrl.addEventListener('click', handleFetchURL);

  // Register file input change listener
  elements.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
    }
  });

  // Register drag & drop file upload listeners
  elements.fileDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.fileDropzone.classList.add('dragover');
  });

  elements.fileDropzone.addEventListener('dragleave', () => {
    elements.fileDropzone.classList.remove('dragover');
  });

  elements.fileDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.fileDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  });

  // Register remove file button click listener
  elements.btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    clearLoadedFile();
  });

  // Register geoInput input event and formatSelect change event
  elements.geoInput.addEventListener('input', updateFormatDependentUI);
  elements.formatSelect.addEventListener('change', updateFormatDependentUI);

  // Register spatial analysis controls
  elements.analysisLayerSelect.addEventListener('change', updateAnalysisButtonsState);
  elements.btnAnalysisBuffer.addEventListener('click', handleSpatialBuffer);
  elements.btnAnalysisCentroid.addEventListener('click', handleSpatialCentroid);
  elements.btnAnalysisEnvelope.addEventListener('click', handleSpatialEnvelope);

  // Register attribute table panel toggle
  elements.tableHeader.addEventListener('click', toggleTablePanel);

  // Register storyCreator tab switcher
  elements.tabBtnStory.addEventListener('click', () => switchInputTab('story'));

  // Register search event listeners
  elements.btnMapSearch.addEventListener('click', handleMapSearch);
  elements.mapSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleMapSearch();
    }
  });

  // Hide search results when clicking elsewhere on the map
  map.on('click', () => {
    elements.searchResultsList.classList.add('hidden');
  });

  // Register story creator event listeners
  elements.btnAddStorySlide.addEventListener('click', handleAddStorySlide);
  elements.btnPlayStory.addEventListener('click', handlePlayStory);
  elements.btnCloseStoryPlayer.addEventListener('click', handleCloseStoryPlayer);
  elements.btnPrevSlide.addEventListener('click', handlePrevSlide);
  elements.btnNextSlide.addEventListener('click', handleNextSlide);

  // NEW Advanced Features Event Listeners
  
  // GPS Geolocation Locate User
  elements.btnLocateUser.addEventListener('click', locateUser);

  // Measurement Tool
  elements.btnMeasureTool.addEventListener('click', toggleMeasureTool);
  elements.btnCloseMeasure.addEventListener('click', closeMeasureTool);
  elements.btnMeasureLine.addEventListener('click', () => setMeasureMode('line'));
  elements.btnMeasurePoly.addEventListener('click', () => setMeasureMode('polygon'));

  // Style Editor Close Button & Input Change listeners
  elements.btnCloseStyleEditor.addEventListener('click', closeStyleEditor);
  elements.styleStrokeColor.addEventListener('input', applyStyleChange);
  elements.styleStrokeWeight.addEventListener('input', (e) => {
    elements.valStrokeWeight.textContent = e.target.value + 'px';
    applyStyleChange();
  });
  elements.styleStrokeOpacity.addEventListener('input', (e) => {
    elements.valStrokeOpacity.textContent = e.target.value + '%';
    applyStyleChange();
  });
  elements.styleStrokeDash.addEventListener('change', applyStyleChange);
  
  elements.styleFillColor.addEventListener('input', applyStyleChange);
  elements.styleFillOpacity.addEventListener('input', (e) => {
    elements.valFillOpacity.textContent = e.target.value + '%';
    applyStyleChange();
  });

  elements.styleMarkerType.addEventListener('change', handleMarkerTypeChange);
  elements.styleMarkerRadius.addEventListener('input', (e) => {
    elements.valMarkerRadius.textContent = e.target.value + 'px';
    applyStyleChange();
  });
  elements.styleMarkerIconSelect.addEventListener('change', applyStyleChange);
  elements.styleMarkerIconSize.addEventListener('input', (e) => {
    elements.valMarkerIconSize.textContent = e.target.value + 'px';
    applyStyleChange();
  });
  elements.styleMarkerClusterCheckbox.addEventListener('change', applyStyleChange);

  // Table Search/Filter Input
  elements.tableFilterInput.addEventListener('input', handleTableFilter);
  elements.btnClearTableFilter.addEventListener('click', clearTableFilter);

  // Spatial Operations Input controls
  elements.opLayerA.addEventListener('change', updateOpRunButtonState);
  elements.opLayerB.addEventListener('change', updateOpRunButtonState);
  elements.btnRunOperation.addEventListener('click', handleSpatialOperation);

  // Visual Suite Listeners
  elements.btnSwipeToggle.addEventListener('click', toggleSwipeComparison);
  elements.btnCloseAnalytics.addEventListener('click', closeAnalyticsDashboard);
  elements.analyticsAttributeSelect.addEventListener('change', () => {
    if (activeAnalyticsLayerId) {
      updateAnalyticsCharts();
    }
  });
  elements.btnAnalysisHeatmap.addEventListener('click', handleSpatialHeatmap);

  // Visual Expansion Suite Listeners
  elements.feedWeatherRadar.addEventListener('change', toggleLiveWeatherRadar);
  elements.feedEarthquakes.addEventListener('change', toggleLiveEarthquakes);
  elements.btnAnalysisIsochrone.addEventListener('click', toggleIsochroneMode);
  elements.btnTimezoneLookup.addEventListener('click', toggleTimezoneLookupMode);
  
  elements.btnCloseTimeline.addEventListener('click', closeTimelinePlayer);
  elements.btnTimelinePlay.addEventListener('click', toggleTimelinePlayback);
  elements.timelineSlider.addEventListener('input', handleTimelineSliderInput);
  
  elements.btnCloseElevation.addEventListener('click', closeElevationProfile);

  // Listen for map movements to update analytics charts in real-time
  map.on('moveend zoomend', () => {
    if (activeAnalyticsLayerId) {
      updateAnalyticsCharts();
    }
  });

  // Map Click Listener (for Isochrones & Timezone Lookup)
  map.on('click', (e) => {
    if (isochroneClickActive) {
      generateIsochroneContours(e.latlng);
    } else if (isTimezoneLookupActive) {
      fetchTimezoneAndLocalTime(e.latlng);
    }
  });

  // Global Geoman drawing detection to auto-toggle timezone mode
  map.on('pm:drawstart', () => {
    if (isTimezoneLookupActive) {
      toggleTimezoneLookupMode();
    }
  });
}

// Swap basemap tiles
function setBasemap(basemapId) {
  if (!BASEMAP_TILES[basemapId]) basemapId = 'cartodb_dark';

  if (currentBaseLayer) {
    map.removeLayer(currentBaseLayer);
  }

  const config = BASEMAP_TILES[basemapId];
  currentBaseLayer = L.tileLayer(config.url, config.options);
  
  // Set basemap opacity based on current slider setting
  const opacityVal = elements.basemapOpacitySlider ? elements.basemapOpacitySlider.value / 100 : 1;
  currentBaseLayer.setOpacity(opacityVal);
  currentBaseLayer.addTo(map);

  localStorage.setItem('geoviewer_basemap_id', basemapId);

  elements.basemapOptionCards.forEach(card => {
    if (card.dataset.basemap === basemapId) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Toggle Basemap Options Dropdown
elements.btnBasemapToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  elements.basemapDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  elements.basemapDropdown.classList.add('hidden');
  document.querySelectorAll('.layer-options-dropdown').forEach(d => d.classList.add('hidden'));
});

elements.basemapOptionCards.forEach(card => {
  card.addEventListener('click', () => {
    const selectedBasemap = card.dataset.basemap;
    setBasemap(selectedBasemap);
    elements.basemapDropdown.classList.add('hidden');
  });
});

// ==========================================================================
// TABS & URL LOADING HANDLERS
// ==========================================================================
function switchInputTab(tab) {
  elements.tabBtnText.classList.remove('active');
  elements.tabBtnUrl.classList.remove('active');
  elements.tabBtnStory.classList.remove('active');
  
  elements.geometryInputPanel.classList.add('hidden');
  elements.storyCreatorPanel.classList.add('hidden');

  if (tab === 'text') {
    elements.tabBtnText.classList.add('active');
    elements.geometryInputPanel.classList.remove('hidden');
    elements.urlInputContainer.classList.add('hidden');
    elements.textInputWrapper.classList.remove('hidden');
    elements.fileUploaderWrapper.classList.remove('hidden');
  } else if (tab === 'url') {
    elements.tabBtnUrl.classList.add('active');
    elements.geometryInputPanel.classList.remove('hidden');
    elements.urlInputContainer.classList.remove('hidden');
    elements.textInputWrapper.classList.add('hidden');
    elements.fileUploaderWrapper.classList.add('hidden');
  } else if (tab === 'story') {
    if (!FEATURE_TOGGLES.storyCreator) return;
    elements.tabBtnStory.classList.add('active');
    elements.storyCreatorPanel.classList.remove('hidden');
  }
}

async function handleFetchURL() {
  const url = elements.geoUrlInput.value.trim();
  if (!url) {
    showValidationStatus('error', 'Fetch Failed', 'Please enter a valid URL.');
    return;
  }

  showValidationStatus('warning', 'Fetching Data...', `Downloading remote dataset from ${url}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const text = await response.text();

    // Auto-detect type by extension
    let ext = url.split('?')[0].split('.').pop().toLowerCase();
    
    activeUploadedFile = {
      name: url.split('/').pop().split('?')[0] || 'Remote Dataset',
      extension: ext,
      content: text
    };

    elements.geoInput.value = text;
    elements.geoInput.removeAttribute('readonly');

    // Update uploader badge
    elements.uploadedFileName.textContent = activeUploadedFile.name;
    elements.uploadedFileBadge.classList.remove('hidden');
    elements.fileDropzone.classList.add('hidden');

    if (ext === 'kml') {
      elements.formatSelect.value = 'kml';
    } else if (ext === 'geojson' || ext === 'json') {
      elements.formatSelect.value = 'geojson';
    } else if (ext === 'wkt') {
      elements.formatSelect.value = 'wkt';
    } else {
      elements.formatSelect.value = 'auto';
    }

    updateFormatDependentUI();
    
    // Visualize loaded URL
    await handleVisualize();

    // Switch tab back to Paste view to show loaded text inside textarea
    switchInputTab('text');

  } catch (error) {
    showValidationStatus('error', 'Fetch Failed', `Failed to retrieve remote dataset: ${error.message}. Ensure the URL supports CORS.`);
  }
}

// ==========================================================================
// CONDITIONAL UI UPDATE
// ==========================================================================
function updateFormatDependentUI() {
  const format = elements.formatSelect.value;
  const text = elements.geoInput.value;
  
  let showProjection = false;
  if (format === 'wkt') {
    showProjection = true;
  } else if (format === 'auto') {
    const detected = detectFormat(text);
    if (detected === 'wkt') {
      showProjection = true;
    }
  }

  if (showProjection) {
    elements.projectionSelectContainer.classList.remove('hidden');
  } else {
    elements.projectionSelectContainer.classList.add('hidden');
  }
}

// ==========================================================================
// PROJECTION TRANSFORMATION UTILITIES (BNG -> WGS84)
// ==========================================================================
function reprojectCoords(coords, fromCRS, toCRS) {
  if (Array.isArray(coords) && typeof coords[0] === 'number') {
    const projected = proj4(fromCRS, toCRS, coords);
    return [projected[0], projected[1]];
  } else if (Array.isArray(coords)) {
    return coords.map(c => reprojectCoords(c, fromCRS, toCRS));
  }
  return coords;
}

function reprojectGeoJSON(geojson, fromCRS, toCRS) {
  if (!geojson) return geojson;
  const geojsonCopy = JSON.parse(JSON.stringify(geojson));
  
  function reprojectGeometry(geom) {
    if (!geom) return;
    if (geom.type === 'GeometryCollection') {
      if (Array.isArray(geom.geometries)) {
        geom.geometries.forEach(reprojectGeometry);
      }
    } else if (Array.isArray(geom.coordinates)) {
      geom.coordinates = reprojectCoords(geom.coordinates, fromCRS, toCRS);
    }
  }

  function reprojectFeature(feature) {
    if (feature.geometry) {
      reprojectGeometry(feature.geometry);
    }
  }

  if (geojsonCopy.type === 'FeatureCollection') {
    if (Array.isArray(geojsonCopy.features)) {
      geojsonCopy.features.forEach(reprojectFeature);
    }
  } else if (geojsonCopy.type === 'Feature') {
    reprojectFeature(geojsonCopy);
  } else {
    reprojectGeometry(geojsonCopy);
  }
  
  return geojsonCopy;
}

// ==========================================================================
// GEOMETRIC MEASUREMENTS (Area / Length / Points) using Turf.js
// ==========================================================================
function getGeometryMeasurement(geojson) {
  if (!geojson) return null;
  
  try {
    let area = 0;
    let hasPolygon = false;
    let hasCircle = false;
    let circleCount = 0;
    let totalCircleRadius = 0;
    
    // Traverse geojson to calculate polygon area and circle area
    function traverseFeaturesForArea(feature) {
      if (!feature || !feature.geometry) return;
      const geom = feature.geometry;
      const props = feature.properties || {};
      
      if (geom.type === 'Point' && typeof props.radius === 'number') {
        const r = props.radius;
        area += Math.PI * r * r;
        hasCircle = true;
        circleCount++;
        totalCircleRadius = r; // keep last for labeling simple circles
      } else if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
        area += turf.area(feature);
        hasPolygon = true;
      } else if (geom.type === 'GeometryCollection') {
        if (Array.isArray(geom.geometries)) {
          geom.geometries.forEach(g => {
            if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
              area += turf.area({ type: 'Feature', geometry: g, properties: {} });
              hasPolygon = true;
            }
          });
        }
      }
    }
    
    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      geojson.features.forEach(traverseFeaturesForArea);
    } else if (geojson.type === 'Feature') {
      traverseFeaturesForArea(geojson);
    } else {
      // Raw geometry
      if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
        area += turf.area({ type: 'Feature', geometry: geojson, properties: {} });
        hasPolygon = true;
      }
    }
    
    if ((hasPolygon || hasCircle) && area > 0) {
      const valStr = formatArea(area);
      
      if (hasCircle && !hasPolygon && circleCount === 1) {
        return { label: 'Area', value: `${valStr} (Radius: ${Math.round(totalCircleRadius)} m)` };
      }
      return { label: 'Area', value: valStr };
    }

    // Check for LineStrings
    let hasLine = false;
    function checkLine(geom) {
      if (!geom) return;
      if (geom.type === 'LineString' || geom.type === 'MultiLineString') {
        hasLine = true;
      } else if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
        geom.geometries.forEach(checkLine);
      }
    }

    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      geojson.features.forEach(f => {
        if (f.geometry) checkLine(f.geometry);
      });
    } else if (geojson.type === 'Feature') {
      if (geojson.geometry) checkLine(geojson.geometry);
    } else {
      checkLine(geojson);
    }

    if (hasLine) {
      let len = turf.length(geojson, { units: 'meters' });
      if (len >= 1000) {
        return { label: 'Length', value: `${(len / 1000).toFixed(3)} km` };
      } else {
        return { label: 'Length', value: `${Math.round(len).toLocaleString()} m` };
      }
    }

    // Check for Points
    let pointCount = 0;
    function countPoints(geom) {
      if (!geom) return;
      if (geom.type === 'Point') {
        pointCount += 1;
      } else if (geom.type === 'MultiPoint' && Array.isArray(geom.coordinates)) {
        pointCount += geom.coordinates.length;
      } else if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
        geom.geometries.forEach(countPoints);
      }
    }

    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      geojson.features.forEach(f => {
        if (f.geometry) countPoints(f.geometry);
      });
    } else if (geojson.type === 'Feature') {
      if (geojson.geometry) countPoints(geojson.geometry);
    } else {
      countPoints(geojson);
    }

    if (pointCount > 0) {
      return { label: 'Points', value: `${pointCount} marker(s)` };
    }
  } catch (err) {
    console.error('Measurement error:', err);
  }
  return null;
}

// ==========================================================================
// FILE UPLOADER STATE HANDLERS
// ==========================================================================
async function handleFilesSelect(files) {
  if (!files || files.length === 0) return;

  clearValidationStatus();
  showValidationStatus('warning', 'Loading Files...', 'Reading and parsing uploaded files...');

  try {
    const fileArray = Array.from(files);

    // 1. Check for MapInfo TAB files
    const hasTab = fileArray.some(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['tab', 'dat', 'map', 'id'].includes(ext);
    });

    if (hasTab) {
      const tabFile = fileArray.find(f => f.name.toLowerCase().endsWith('.tab'));
      const datFile = fileArray.find(f => f.name.toLowerCase().endsWith('.dat'));

      if (!tabFile) {
        throw new Error('MapInfo upload requires at least the .tab descriptor file.');
      }
      if (!datFile) {
        throw new Error('MapInfo upload requires both the .tab file and the corresponding .dat attribute file.');
      }

      const tabText = await readFileAsText(tabFile);
      const datBuffer = await readFileAsArrayBuffer(datFile);

      const geojson = parseMapInfoTab(tabText, datBuffer);

      activeUploadedFile = {
        name: tabFile.name,
        extension: 'tab',
        parsedGeoJSON: geojson
      };

      elements.geoInput.value = `[MapInfo TAB File Loaded: ${tabFile.name} (${geojson.features.length} records)]`;
      elements.geoInput.setAttribute('readonly', 'true');
      elements.formatSelect.value = 'auto';

      elements.uploadedFileName.textContent = tabFile.name + ' (+.dat)';
      elements.uploadedFileBadge.classList.remove('hidden');
      elements.fileDropzone.classList.add('hidden');

      updateFormatDependentUI();
      showValidationStatus('success', 'MapInfo TAB Loaded', `Successfully parsed MapInfo TAB attributes: ${tabFile.name}`);
      return;
    }

    // 2. Check for ESRI Shapefile components
    const shpFile = fileArray.find(f => f.name.toLowerCase().endsWith('.shp'));
    const dbfFile = fileArray.find(f => f.name.toLowerCase().endsWith('.dbf'));

    if (shpFile) {
      const shpBuffer = await readFileAsArrayBuffer(shpFile);
      let geojson = null;

      if (dbfFile) {
        const dbfBuffer = await readFileAsArrayBuffer(dbfFile);
        const geoms = shp.parseShp(shpBuffer);
        const dbf = shp.parseDbf(dbfBuffer);
        geojson = shp.combine([geoms, dbf]);
      } else {
        const geoms = shp.parseShp(shpBuffer);
        geojson = {
          type: 'FeatureCollection',
          features: geoms.map(g => ({
            type: 'Feature',
            geometry: g,
            properties: {}
          }))
        };
      }

      activeUploadedFile = {
        name: shpFile.name,
        extension: 'shp',
        parsedGeoJSON: geojson
      };

      elements.geoInput.value = `[Shapefile Geometry Loaded: ${shpFile.name}${dbfFile ? ' + attributes' : ''}]`;
      elements.geoInput.setAttribute('readonly', 'true');
      elements.formatSelect.value = 'shp';
      
      elements.uploadedFileName.textContent = shpFile.name + (dbfFile ? ` (+.dbf)` : '');
      elements.uploadedFileBadge.classList.remove('hidden');
      elements.fileDropzone.classList.add('hidden');

      updateFormatDependentUI();
      showValidationStatus('success', 'Shapefile Loaded', `Successfully parsed Shapefile: ${shpFile.name}`);
      return;
    }

    // 3. Fallback to single file handling (ZIP, KMZ, KML, WKT, GeoJSON)
    const file = fileArray[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'zip') {
      const zipBuffer = await readFileAsArrayBuffer(file);
      const parsedGeoJSON = await shp(zipBuffer);
      
      let mergedGeoJSON = parsedGeoJSON;
      if (Array.isArray(parsedGeoJSON)) {
        mergedGeoJSON = {
          type: 'FeatureCollection',
          features: parsedGeoJSON.flatMap(g => g.type === 'FeatureCollection' ? g.features : [g])
        };
      }

      activeUploadedFile = {
        name: file.name,
        extension: 'shp',
        parsedGeoJSON: mergedGeoJSON
      };

      elements.geoInput.value = `[Zipped Shapefile Loaded: ${file.name}]`;
      elements.geoInput.setAttribute('readonly', 'true');
      elements.formatSelect.value = 'shp';

      elements.uploadedFileName.textContent = file.name;
      elements.uploadedFileBadge.classList.remove('hidden');
      elements.fileDropzone.classList.add('hidden');

      updateFormatDependentUI();
      showValidationStatus('success', 'Zipped Shapefile Loaded', `Successfully parsed zipped Shapefile: ${file.name}`);
      
    } else if (ext === 'kmz') {
      const kmzBuffer = await readFileAsArrayBuffer(file);
      const geojson = await parseKMZ(kmzBuffer);

      activeUploadedFile = {
        name: file.name,
        extension: 'kmz',
        parsedGeoJSON: geojson
      };

      elements.geoInput.value = `[Binary KMZ File Loaded: ${file.name}]`;
      elements.geoInput.setAttribute('readonly', 'true');
      elements.formatSelect.value = 'kmz';

      elements.uploadedFileName.textContent = file.name;
      elements.uploadedFileBadge.classList.remove('hidden');
      elements.fileDropzone.classList.add('hidden');

      updateFormatDependentUI();
      showValidationStatus('success', 'KMZ Loaded', `Successfully parsed KMZ: ${file.name}`);

    } else {
      const text = await readFileAsText(file);
      activeUploadedFile = {
        name: file.name,
        extension: ext,
        content: text
      };

      elements.geoInput.value = text;
      elements.geoInput.removeAttribute('readonly');

      if (ext === 'kml') {
        elements.formatSelect.value = 'kml';
      } else if (ext === 'geojson' || ext === 'json') {
        elements.formatSelect.value = 'geojson';
      } else if (ext === 'wkt') {
        elements.formatSelect.value = 'wkt';
      } else {
        elements.formatSelect.value = 'auto';
      }

      elements.uploadedFileName.textContent = file.name;
      elements.uploadedFileBadge.classList.remove('hidden');
      elements.fileDropzone.classList.add('hidden');

      updateFormatDependentUI();
      clearValidationStatus();
    }

  } catch (err) {
    showValidationStatus('error', 'Upload Failed', err.message);
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error(`Error reading file ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error(`Error reading file ${file.name}`));
    reader.readAsText(file);
  });
}

function clearLoadedFile() {
  activeUploadedFile = null;
  elements.geoInput.value = '';
  elements.geoInput.removeAttribute('readonly');
  elements.fileInput.value = '';
  
  elements.uploadedFileBadge.classList.add('hidden');
  elements.fileDropzone.classList.remove('hidden');
  
  elements.formatSelect.value = 'auto';
  updateFormatDependentUI();
  clearValidationStatus();
}

// ==========================================================================
// FORMAT DETECTION & PARSING LOGIC
// ==========================================================================
function detectFormat(text) {
  const trimmed = text.trim();
  if (!trimmed) return 'empty';

  if (trimmed.startsWith('[Binary ZIP') || (activeUploadedFile && ['zip', 'shp'].includes(activeUploadedFile.extension))) {
    return 'shp';
  }
  if (trimmed.startsWith('[Binary KMZ') || (activeUploadedFile && activeUploadedFile.extension === 'kmz')) {
    return 'kmz';
  }
  if (trimmed.startsWith('[MapInfo') || (activeUploadedFile && ['tab', 'dat', 'map', 'id'].includes(activeUploadedFile.extension))) {
    return 'tab_unsupported';
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'geojson';
  }

  // XML / KML Detection
  if (trimmed.startsWith('<') && (trimmed.includes('<kml') || trimmed.includes('<KML') || trimmed.includes('<Document'))) {
    return 'kml';
  }

  const wktKeywords = /^\s*(point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)\b/i;
  if (wktKeywords.test(trimmed)) {
    return 'wkt';
  }

  return 'unknown';
}

// Parse KML text to GeoJSON
function parseKML(kmlText) {
  try {
    const parser = new DOMParser();
    const kmlDom = parser.parseFromString(kmlText, 'text/xml');
    
    const parserError = kmlDom.querySelector('parsererror');
    if (parserError) {
      throw new Error("Invalid XML structure: " + parserError.textContent);
    }
    
    const geojson = toGeoJSON.kml(kmlDom);
    if (!geojson || !geojson.type) {
      throw new Error("togeojson was unable to parse the KML contents.");
    }
    return geojson;
  } catch (e) {
    throw new Error(`KML Parser: ${e.message}`);
  }
}

// Extract KMZ (Zipped KML) using JSZip
function parseKMZ(arrayBuffer) {
  return JSZip.loadAsync(arrayBuffer)
    .then(zip => {
      const kmlFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'));
      if (!kmlFile) {
        throw new Error("No KML file found inside the KMZ archive.");
      }
      return zip.file(kmlFile).async("string");
    })
    .then(kmlText => {
      return parseKML(kmlText);
    })
    .catch(e => {
      throw new Error(`KMZ Extractor: ${e.message}`);
    });
}

function validateGeoJSONGeometry(geom) {
  if (!geom) return;
  if (!geom.type) {
    throw new Error('GeoJSON Geometry Error: Missing required "type" in geometry object.');
  }
  const validGeomTypes = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
  if (!validGeomTypes.includes(geom.type)) {
    throw new Error(`GeoJSON Geometry Error: "${geom.type}" is not a valid GeoJSON geometry type.`);
  }
  
  if (geom.type === 'GeometryCollection') {
    if (!Array.isArray(geom.geometries)) {
      throw new Error('GeoJSON Geometry Error: GeometryCollection must contain a "geometries" array.');
    }
    geom.geometries.forEach((g, idx) => {
      try {
        validateGeoJSONGeometry(g);
      } catch (err) {
        throw new Error(`GeometryCollection index ${idx}: ${err.message}`);
      }
    });
    return;
  }
  
  if (!geom.coordinates || !Array.isArray(geom.coordinates)) {
    throw new Error(`GeoJSON Geometry Error: Geometry of type "${geom.type}" is missing its required "coordinates" array.`);
  }

  if (geom.type === 'Point') {
    if (geom.coordinates.length < 2 || typeof geom.coordinates[0] !== 'number' || typeof geom.coordinates[1] !== 'number') {
      throw new Error('GeoJSON Coordinate Error: Point coordinates must be an array of at least 2 numbers: [longitude, latitude].');
    }
  } else if (geom.type === 'LineString') {
    if (geom.coordinates.length < 2) {
      throw new Error('GeoJSON Coordinate Error: LineString coordinates must contain at least 2 points.');
    }
    geom.coordinates.forEach((pt, idx) => {
      if (!Array.isArray(pt) || pt.length < 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
        throw new Error(`GeoJSON Coordinate Error: LineString contains invalid coordinates at index ${idx}. Expected [lng, lat].`);
      }
    });
  } else if (geom.type === 'Polygon') {
    if (geom.coordinates.length === 0 || !Array.isArray(geom.coordinates[0])) {
      throw new Error('GeoJSON Coordinate Error: Polygon coordinates must contain an array of rings.');
    }
    geom.coordinates.forEach((ring, rIdx) => {
      if (!Array.isArray(ring) || ring.length < 4) {
        throw new Error(`GeoJSON Coordinate Error: Polygon ring ${rIdx} must contain at least 4 coordinates (where the first and last points are identical).`);
      }
      ring.forEach((pt, pIdx) => {
        if (!Array.isArray(pt) || pt.length < 2 || typeof pt[0] !== 'number' || typeof pt[1] !== 'number') {
          throw new Error(`GeoJSON Coordinate Error: Polygon ring ${rIdx} contains invalid coordinates at index ${pIdx}. Expected [lng, lat].`);
        }
      });
    });
  }
}

// Unified parser for text-based inputs
function validateAndParse(text, mode) {
  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('Input text is empty. Please enter geometry or upload a file.');
  }

  let targetMode = mode;
  if (mode === 'auto') {
    targetMode = detectFormat(trimmedText);
    if (targetMode === 'empty') throw new Error('Input is empty.');
    if (targetMode === 'tab_unsupported') {
      throw new Error('MapInfo TAB files cannot be parsed directly in the browser. Please convert them to GeoJSON using QGIS or ogr2ogr first.');
    }
    if (targetMode === 'unknown') {
      throw new Error('Unable to auto-detect geometry format. Please paste valid WKT, GeoJSON, or KML text.');
    }
  }

  if (targetMode === 'geojson') {
    let parsedObj = null;
    try {
      parsedObj = JSON.parse(trimmedText);
    } catch (e) {
      throw new Error(`GeoJSON Syntactical Error: ${e.message}`);
    }

    if (!parsedObj || typeof parsedObj !== 'object') {
      throw new Error('GeoJSON Error: Parsed result is not a valid JSON Object.');
    }
    if (!parsedObj.type) {
      throw new Error('GeoJSON Schema Error: Missing required "type" property.');
    }

    const validTypes = ['Feature', 'FeatureCollection', 'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
    if (!validTypes.includes(parsedObj.type)) {
      throw new Error(`GeoJSON Schema Error: "${parsedObj.type}" is not a recognized GeoJSON type.`);
    }

    // Comprehensive Geometry Validation
    if (parsedObj.type === 'FeatureCollection') {
      if (!Array.isArray(parsedObj.features)) {
        throw new Error('GeoJSON Schema Error: FeatureCollection must contain a "features" array.');
      }
      parsedObj.features.forEach((f, idx) => {
        if (!f || typeof f !== 'object') {
          throw new Error(`GeoJSON Schema Error: Feature at index ${idx} is invalid.`);
        }
        if (f.type !== 'Feature') {
          throw new Error(`GeoJSON Schema Error: Feature at index ${idx} must have type "Feature".`);
        }
        if (f.geometry) {
          validateGeoJSONGeometry(f.geometry);
        } else {
          throw new Error(`GeoJSON Schema Error: Feature at index ${idx} is missing its "geometry" object.`);
        }
      });
    } else if (parsedObj.type === 'Feature') {
      if (parsedObj.geometry) {
        validateGeoJSONGeometry(parsedObj.geometry);
      } else {
        throw new Error('GeoJSON Schema Error: Feature object must contain a "geometry" object.');
      }
    } else {
      validateGeoJSONGeometry(parsedObj);
    }

    return {
      type: 'geojson',
      data: parsedObj,
      summary: parsedObj.type,
      originalCRS: 'EPSG:4326'
    };

  } else if (targetMode === 'wkt') {
    let geom = null;
    try {
      geom = wellknown.parse(trimmedText);
    } catch (e) {
      throw new Error(`WKT Syntactical Error: ${e.message}`);
    }

    if (!geom) {
      throw new Error('WKT Parsing Error: Syntax is invalid. E.g. POINT(72.87 19.07)');
    }

    let geojsonFeature = {
      type: 'Feature',
      geometry: geom,
      properties: {
        wkt: trimmedText
      }
    };

    const selectedProj = elements.projectionSelect.value;
    if (selectedProj === '27700') {
      try {
        geojsonFeature = reprojectGeoJSON(geojsonFeature, 'EPSG:27700', 'EPSG:4326');
        geojsonFeature.properties.original_crs = 'EPSG:27700';
      } catch (err) {
        throw new Error(`Reprojection Error: Failed to reproject coordinates from BNG (EPSG:27700) to WGS84: ${err.message}`);
      }
    }

    return {
      type: 'wkt',
      data: geojsonFeature,
      summary: geom.type + (selectedProj === '27700' ? ' (BNG)' : ''),
      originalCRS: selectedProj === '27700' ? 'EPSG:27700' : 'EPSG:4326'
    };
    
  } else if (targetMode === 'kml') {
    const geojson = parseKML(trimmedText);
    return {
      type: 'kml',
      data: geojson,
      summary: 'KML FeatureCollection',
      originalCRS: 'EPSG:4326'
    };
  }

  throw new Error(`Format mode "${targetMode}" is unsupported for direct text parsing.`);
}

// Display Validation Banner
function showValidationStatus(type, title, message) {
  elements.validationPanel.className = 'validation-panel';
  elements.validationPanel.classList.add(type);
  
  elements.validationTitle.textContent = title;
  elements.validationMessage.textContent = message;
  
  let iconHtml = '';
  if (type === 'success') {
    iconHtml = '<i class="fa-solid fa-circle-check"></i>';
  } else if (type === 'error') {
    iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
  } else if (type === 'warning') {
    iconHtml = '<i class="fa-solid fa-circle-exclamation"></i>';
  }
  elements.validationIcon.innerHTML = iconHtml;
}

function clearValidationStatus() {
  elements.validationPanel.classList.add('hidden');
}

// ==========================================================================
// LAYER MANAGEMENT & VISUALIZATION
// ==========================================================================
function addGeometryToMap(parsedResult, name, customColor = null) {
  const colorPalette = {
    stroke: customColor || '#8b5cf6',
    fill: customColor || '#6366f1',
    fillOpacity: 0.15,
    strokeWeight: 3
  };

  const measurement = getGeometryMeasurement(parsedResult.data);

  let geojsonLayer = L.geoJSON(parsedResult.data, {
    pointToLayer: function(feature, latlng) {
      if (feature.properties && typeof feature.properties.radius === 'number') {
        return L.circle(latlng, {
          radius: feature.properties.radius,
          fillColor: colorPalette.fill,
          color: colorPalette.stroke,
          weight: colorPalette.strokeWeight,
          opacity: 0.85,
          fillOpacity: colorPalette.fillOpacity,
          renderer: DEFAULT_VECTOR_RENDERER
        });
      }
      return L.circleMarker(latlng, {
        radius: 7,
        fillColor: colorPalette.fill,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.85,
        renderer: DEFAULT_VECTOR_RENDERER
      });
    },
    style: function(feature) {
      return {
        color: colorPalette.stroke,
        weight: colorPalette.strokeWeight,
        opacity: 0.85,
        fillColor: colorPalette.fill,
        fillOpacity: colorPalette.fillOpacity,
        renderer: DEFAULT_VECTOR_RENDERER
      };
    },
    onEachFeature: function(feature, layer) {
      let popupContent = `<div class="popup-details">`;
      popupContent += `<div class="popup-header"><i class="fa-solid fa-circle-info"></i> Feature Details</div>`;
      popupContent += `<div class="popup-body">`;
      popupContent += `<strong>Type:</strong> ${escapeHTML(feature.geometry ? feature.geometry.type : 'N/A')}<br>`;
      
      // Inject measurements if available
      if (measurement) {
        popupContent += `<strong style="color: #a78bfa;">${escapeHTML(measurement.label)}:</strong> ${escapeHTML(measurement.value)}<br>`;
      }
      
      // Properties
      if (feature.properties && Object.keys(feature.properties).length > 0) {
        const propsCopy = { ...feature.properties };
        if (propsCopy.wkt && propsCopy.wkt.length > 50) {
          propsCopy.wkt = propsCopy.wkt.substring(0, 47) + '...';
        }
        popupContent += `<hr style="margin:6px 0; border:none; border-top:1px solid rgba(255,255,255,0.08);">`;
        popupContent += `<strong>Properties:</strong><pre style="margin-top:4px; max-height:80px; overflow-y:auto; font-family:var(--font-mono); font-size:9px;">${escapeHTML(JSON.stringify(propsCopy, null, 2))}</pre>`;
      }
      
      popupContent += `</div></div>`;
      layer.bindPopup(popupContent);
    }
  });

  geojsonLayer.addTo(map);

  let displayType = parsedResult.summary;
  if (parsedResult.data) {
    const isCircleFeature = (f) => f && f.type === 'Feature' && f.geometry && f.geometry.type === 'Point' && f.properties && typeof f.properties.radius === 'number';
    
    if (isCircleFeature(parsedResult.data)) {
      displayType = 'Circle';
    } else if (parsedResult.data.type === 'FeatureCollection' && parsedResult.data.features && parsedResult.data.features.length === 1 && isCircleFeature(parsedResult.data.features[0])) {
      displayType = 'Circle';
    }
  }

  const layerRecord = {
    id: ++layerIdCounter,
    name: name || `Layer #${layerIdCounter}`,
    type: displayType,
    layer: geojsonLayer,
    geoJSONData: parsedResult.data,
    originalGeoJSONType: parsedResult.data.type,
    originalCRS: parsedResult.originalCRS || 'EPSG:4326',
    visible: true,
    text: elements.geoInput.value,
    measurement: measurement,
    color: colorPalette.stroke,
    editing: false,
    cluster: false
  };

  loadedLayers.push(layerRecord);
  updateLayersUI();
  zoomToLayer(layerRecord);
}

function zoomToLayer(layerRecord) {
  try {
    const bounds = layerRecord.layer.getBounds();
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  } catch (e) {
    const layers = layerRecord.layer.getLayers();
    if (layers.length > 0 && layers[0].getLatLng) {
      map.setView(layers[0].getLatLng(), 15);
    }
  }
}

function toggleLayerVisibility(id) {
  const layerRecord = loadedLayers.find(l => l.id === id);
  if (!layerRecord) return;

  if (layerRecord.visible) {
    map.removeLayer(layerRecord.layer);
    layerRecord.visible = false;
  } else {
    map.addLayer(layerRecord.layer);
    layerRecord.visible = true;
  }
  updateLayersUI();
}

function deleteLayer(id) {
  const index = loadedLayers.findIndex(l => l.id === id);
  if (index === -1) return;

  const layerRecord = loadedLayers[index];
  map.removeLayer(layerRecord.layer);
  loadedLayers.splice(index, 1);

  // Reset table if deleted layer was active in the table
  if (elements.tableLayerName.textContent === layerRecord.name) {
    resetTableToEmpty();
  }

  updateLayersUI();
}

function clearMapLayers() {
  loadedLayers.forEach(l => {
    map.removeLayer(l.layer);
  });
  loadedLayers = [];
  layerIdCounter = 0;
  
  resetTableToEmpty();
  updateLayersUI();
  clearValidationStatus();
}

// ==========================================================================
// EXPORT & DOWNLOAD UTILITIES
// ==========================================================================
function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadLayerData(id) {
  const layerRecord = loadedLayers.find(l => l.id === id);
  if (!layerRecord) return;

  let content = layerRecord.text;
  let fileName = layerRecord.name.replace(/\s+/g, '_').toLowerCase();
  let contentType = 'text/plain';

  // Detect format
  if (layerRecord.type.toLowerCase().includes('kml')) {
    fileName += '.kml';
    contentType = 'application/vnd.google-earth.kml+xml';
  } else if (layerRecord.type.toLowerCase().includes('wkt')) {
    fileName += '.wkt';
    contentType = 'text/plain';
  } else {
    // Fallback to geojson (e.g. for GeoJSON files and KMZ extracts)
    content = JSON.stringify(layerRecord.layer.toGeoJSON(), null, 2);
    fileName += '.geojson';
    contentType = 'application/json';
  }

  downloadFile(content, fileName, contentType);
  showValidationStatus('success', 'Layer Exported', `Successfully downloaded "${fileName}".`);
}

// ==========================================================================
// LAYER EDITING SYSTEM
// ==========================================================================
function getUpdatedGeoJSON(geojsonLayer, originalType) {
  const features = [];
  geojsonLayer.eachLayer(sub => {
    let f = sub.toGeoJSON();
    
    // Restore or inject properties from sub.feature
    if (sub.feature && sub.feature.properties) {
      f.properties = { ...sub.feature.properties, ...f.properties };
    } else if (!f.properties) {
      f.properties = {};
    }

    if (sub instanceof L.Circle) {
      f.properties.radius = sub.getRadius();
      const center = sub.getLatLng();
      f.geometry.coordinates = [center.lng, center.lat];
    } else if (sub instanceof L.Marker || sub instanceof L.CircleMarker) {
      const center = sub.getLatLng();
      f.geometry.coordinates = [center.lng, center.lat];
    }
    
    features.push(f);
  });

  // Reconstruct matching originalType
  if (originalType === 'Feature' && features.length === 1) {
    return features[0];
  } else if (['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'].includes(originalType) && features.length === 1) {
    return features[0].geometry;
  } else {
    return {
      type: 'FeatureCollection',
      features: features
    };
  }
}

function toggleLayerEdit(id) {
  const layerRecord = loadedLayers.find(l => l.id === id);
  if (!layerRecord) return;

  if (!layerRecord.editing) {
    // Disable editing on all other layers first to avoid conflicts
    loadedLayers.forEach(other => {
      if (other.id !== id && other.editing) {
        toggleLayerEdit(other.id);
      }
    });

    layerRecord.editing = true;
    layerRecord.layer.eachLayer(subLayer => {
      if (subLayer.pm) {
        subLayer.pm.enable({
          allowSelfIntersection: false,
          draggable: true
        });

        const handleEditEvent = () => {
          const updatedGeoJSON = getUpdatedGeoJSON(layerRecord.layer, layerRecord.originalGeoJSONType);
          layerRecord.geoJSONData = updatedGeoJSON;

          // Recalculate measurements
          layerRecord.measurement = getGeometryMeasurement(updatedGeoJSON);

          // Stringify back to WKT or GeoJSON
          if (layerRecord.type.toLowerCase().includes('kml')) {
            // Keep original KML if not supporting KML stringifying natively, or default to geojson
          } else if (layerRecord.type.toLowerCase().includes('wkt')) {
            try {
              let geom = null;
              if (updatedGeoJSON.type === 'FeatureCollection') {
                geom = updatedGeoJSON.features[0].geometry;
              } else if (updatedGeoJSON.type === 'Feature') {
                geom = updatedGeoJSON.geometry;
              } else {
                geom = updatedGeoJSON;
              }

              let exportGeom = geom;
              if (layerRecord.originalCRS === 'EPSG:27700') {
                exportGeom = reprojectGeoJSON(geom, 'EPSG:4326', 'EPSG:27700');
              }
              layerRecord.text = wellknown.stringify(exportGeom);
            } catch (e) {
              console.error('WKT Stringify Error:', e);
            }
          } else {
            // Default GeoJSON
            layerRecord.text = JSON.stringify(updatedGeoJSON, null, 2);
          }

          elements.geoInput.value = layerRecord.text;
          updateLayersUI();
        };

        subLayer.on('pm:edit', handleEditEvent);
        subLayer.on('pm:dragend', handleEditEvent);
        subLayer.on('pm:markerdragend', handleEditEvent);
      }
    });

    elements.geoInput.value = layerRecord.text;
    elements.geoInput.setAttribute('readonly', 'true');
    
    if (layerRecord.type.toLowerCase().includes('kmz')) elements.formatSelect.value = 'kmz';
    else if (layerRecord.type.toLowerCase().includes('kml')) elements.formatSelect.value = 'kml';
    else if (layerRecord.type.toLowerCase().includes('wkt')) elements.formatSelect.value = 'wkt';
    else elements.formatSelect.value = 'geojson';
    
    updateFormatDependentUI();

    showValidationStatus('warning', 'Editing Shape...', 'Drag vertices or center handles on the map to modify coordinates in real-time.');
  } else {
    layerRecord.editing = false;
    layerRecord.layer.eachLayer(subLayer => {
      if (subLayer.pm) {
        subLayer.pm.disable();
        subLayer.off('pm:edit');
        subLayer.off('pm:dragend');
        subLayer.off('pm:markerdragend');
      }
    });

    elements.geoInput.removeAttribute('readonly');
    showValidationStatus('success', 'Changes Saved', 'Geometry coordinates and properties successfully updated.');
  }

  updateLayersUI();
}

function updateLayersUI({ updateHull = true } = {}) {
  elements.layersList.innerHTML = '';
  
  // Update live convex hull based on current visible layers
  if (updateHull && typeof updateLiveConvexHull === 'function') {
    scheduleLiveConvexHullUpdate();
  }
  
  elements.layerCounter.textContent = loadedLayers.length;
  updateAnalysisLayerSelect();
  updateOpLayersSelect();

  if (loadedLayers.length === 0) {
    elements.emptyLayersMessage.classList.remove('hidden');
    elements.layersList.innerHTML = '';
    return;
  }

  elements.emptyLayersMessage.classList.add('hidden');
  elements.layersList.innerHTML = '';

  loadedLayers.forEach(l => {
    const li = document.createElement('li');
    li.className = 'layer-item';
    li.dataset.layerId = l.id;
    if (l.editing) {
      li.classList.add('editing');
    }
    
    let iconClass = 'fa-solid fa-shapes';
    const typeLower = l.type.toLowerCase();
    if (typeLower.includes('circle')) {
      iconClass = 'fa-regular fa-circle';
    } else if (typeLower.includes('point')) {
      iconClass = 'fa-solid fa-location-dot';
    } else if (typeLower.includes('line')) {
      iconClass = 'fa-solid fa-route';
    } else if (typeLower.includes('polygon')) {
      iconClass = 'fa-solid fa-draw-polygon';
    } else if (typeLower.includes('collection')) {
      iconClass = 'fa-solid fa-folder-tree';
    }

    let measurementHtml = '';
    if (l.measurement) {
      const calcIcon = l.measurement.label === 'Area' ? 'fa-solid fa-chart-area' : (l.measurement.label === 'Length' ? 'fa-solid fa-ruler' : 'fa-solid fa-hashtag');
      measurementHtml = `
        <span class="measurement-badge" title="${escapeHTML(l.measurement.label)}: ${escapeHTML(l.measurement.value)}">
          <i class="${calcIcon}"></i> ${escapeHTML(l.measurement.value)}
        </span>
      `;
    }

    l.color = normalizeHexColor(l.color);
    const safeName = escapeHTML(l.name);
    const safeType = escapeHTML(l.type);
    const supportsLayerOptions = l.type !== 'Heatmap' && l.type !== 'Isochrones';

    li.innerHTML = `
      <div class="layer-info">
        <div class="layer-icon" style="background-color: ${l.color}15; color: ${l.color};" title="${safeType}">
          <i class="${iconClass}"></i>
        </div>
        <div class="layer-meta">
          <span class="layer-name" title="${safeName}">${safeName}</span>
          <span class="layer-type">${safeType}</span>
          <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
            <input type="color" class="layer-color-picker" value="${l.color}" title="Change Layer Color" aria-label="Change Layer Color" />
            ${measurementHtml}
          </div>
        </div>
      </div>
      <div class="layer-actions">
        <button class="layer-action-btn btn-toggle ${l.visible ? '' : 'muted'}" title="${l.visible ? 'Hide layer' : 'Show layer'}" aria-label="${l.visible ? 'Hide layer' : 'Show layer'}">
          <i class="fa-solid ${l.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
        </button>
        <button class="layer-action-btn btn-zoom" title="Zoom to layer" aria-label="Zoom to layer">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </button>
        
        ${supportsLayerOptions ? `
        <div class="layer-options-wrapper" style="position: relative; display: inline-block;">
          <button class="layer-action-btn btn-options" title="Layer options" aria-label="Layer options">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <div class="layer-options-dropdown hidden">
            <button class="dropdown-item btn-analytics"><i class="fa-solid fa-chart-simple"></i> Viewport Analytics</button>
            <button class="dropdown-item btn-table"><i class="fa-solid fa-table"></i> Attribute Table</button>
            <button class="dropdown-item btn-timeline"><i class="fa-solid fa-clock"></i> Timeline Player</button>
            <button class="dropdown-item btn-elevation"><i class="fa-solid fa-mountain-sun"></i> Elevation Profile</button>
            <button class="dropdown-item btn-style"><i class="fa-solid fa-palette"></i> Edit Styling</button>
            <button class="dropdown-item btn-edit ${l.editing ? 'active' : ''}"><i class="fa-solid ${l.editing ? 'fa-square-check' : 'fa-pen-to-square'}"></i> ${l.editing ? 'Save Shapes' : 'Edit Shapes'}</button>
            <button class="dropdown-item btn-download"><i class="fa-solid fa-download"></i> Export Layer</button>
          </div>
        </div>
        ` : ''}

        <button class="layer-action-btn btn-delete" title="Delete layer" aria-label="Delete layer">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;

    // Bind event listeners
    li.querySelector('.btn-zoom').addEventListener('click', () => zoomToLayer(l));
    li.querySelector('.btn-toggle').addEventListener('click', () => toggleLayerVisibility(l.id));
    li.querySelector('.btn-delete').addEventListener('click', () => deleteLayer(l.id));

    if (supportsLayerOptions) {
      li.querySelector('.btn-analytics').addEventListener('click', () => openAnalyticsDashboard(l.id));
      li.querySelector('.btn-table').addEventListener('click', () => loadLayerTable(l.id));
      li.querySelector('.btn-timeline').addEventListener('click', () => openTimelinePlayer(l.id));
      li.querySelector('.btn-elevation').addEventListener('click', () => openElevationProfile(l.id));
      li.querySelector('.btn-style').addEventListener('click', () => openStyleEditor(l.id));
      li.querySelector('.btn-edit').addEventListener('click', () => toggleLayerEdit(l.id));
      li.querySelector('.btn-download').addEventListener('click', () => downloadLayerData(l.id));

      // Options dropdown toggle
      const btnOptions = li.querySelector('.btn-options');
      const dropdown = li.querySelector('.layer-options-dropdown');
      btnOptions.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.layer-options-dropdown').forEach(d => {
          if (d !== dropdown) d.classList.add('hidden');
        });
        dropdown.classList.toggle('hidden');
      });
    }

    // Bind color picker listener
    const colorPicker = li.querySelector('.layer-color-picker');
    colorPicker.addEventListener('input', (e) => {
      const newColor = normalizeHexColor(e.target.value);
      l.color = newColor;
      
      // Update layer colors live on map (checking if setStyle is available)
      if (l.layer.setStyle) {
        l.layer.setStyle({
          color: newColor,
          fillColor: newColor
        });
      }
      
      // Handle sublayers (points / markers / circleMarkers)
      l.layer.eachLayer(sub => {
        if (sub.setStyle) {
          sub.setStyle({
            color: newColor,
            fillColor: newColor
          });
        }
      });

      // Update icon display background color
      const iconEl = li.querySelector('.layer-icon');
      if (iconEl) {
        iconEl.style.backgroundColor = `${newColor}15`;
        iconEl.style.color = newColor;
      }
    });

    elements.layersList.appendChild(li);
  });
}

function fitAllLayers() {
  if (loadedLayers.length === 0) return;

  let groupBounds = null;
  loadedLayers.forEach(l => {
    if (typeof l.layer.getBounds === 'function') {
      const bounds = l.layer.getBounds();
      if (bounds && bounds.isValid()) {
        if (!groupBounds) {
          groupBounds = L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast());
        } else {
          groupBounds.extend(bounds);
        }
      }
    }
  });

  if (groupBounds && groupBounds.isValid()) {
    map.fitBounds(groupBounds, { padding: [40, 40] });
  }
}

// ==========================================================================
// SPATIAL ANALYSIS ACTIONS & HELPERS
// ==========================================================================
function updateAnalysisLayerSelect() {
  const select = elements.analysisLayerSelect;
  const currentVal = select.value;
  
  // Clear and keep default placeholder
  select.innerHTML = '<option value="">-- Select Active Layer --</option>';
  
  loadedLayers.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.id;
    opt.textContent = `${l.name} (${l.type})`;
    select.appendChild(opt);
  });

  // Try to preserve previous selection if it still exists
  const exists = loadedLayers.some(l => l.id == currentVal);
  if (exists) {
    select.value = currentVal;
  } else {
    select.value = "";
  }

  // Update button enabled states
  updateAnalysisButtonsState();
}

function updateAnalysisButtonsState() {
  const layerSelected = elements.analysisLayerSelect.value !== "";
  elements.btnAnalysisBuffer.disabled = !layerSelected;
  elements.btnAnalysisCentroid.disabled = !layerSelected;
  elements.btnAnalysisEnvelope.disabled = !layerSelected;
  elements.btnAnalysisHeatmap.disabled = !layerSelected;
}

function handleSpatialBuffer() {
  const layerId = parseInt(elements.analysisLayerSelect.value);
  const layerRecord = loadedLayers.find(l => l.id === layerId);
  if (!layerRecord) return;

  const distance = parseFloat(elements.analysisBufferDistance.value);
  if (isNaN(distance) || distance <= 0) {
    showValidationStatus('error', 'Buffer Failed', 'Please enter a valid positive buffer distance.');
    return;
  }

  try {
    const geojson = layerRecord.layer.toGeoJSON();
    // turf.buffer expects features and returns FeatureCollection or Feature
    const buffered = turf.buffer(geojson, distance, { units: 'meters' });

    if (!buffered) {
      throw new Error("Turf.js failed to generate buffer.");
    }

    const layerName = `Buffer (${distance}m) - ${layerRecord.name}`;
    const parsedResult = {
      type: 'geojson',
      data: buffered,
      summary: 'Polygon',
      originalCRS: 'EPSG:4326'
    };

    addGeometryToMap(parsedResult, layerName);
    showValidationStatus('success', 'Buffer Generated', `Successfully generated ${distance}m buffer zone for "${layerRecord.name}".`);
  } catch (err) {
    showValidationStatus('error', 'Buffer Failed', `Error generating buffer: ${err.message}`);
  }
}

function handleSpatialCentroid() {
  const layerId = parseInt(elements.analysisLayerSelect.value);
  const layerRecord = loadedLayers.find(l => l.id === layerId);
  if (!layerRecord) return;

  try {
    const geojson = layerRecord.layer.toGeoJSON();
    const centroid = turf.centroid(geojson);

    if (!centroid) {
      throw new Error("Turf.js failed to calculate centroid.");
    }

    const layerName = `Centroid - ${layerRecord.name}`;
    const parsedResult = {
      type: 'geojson',
      data: centroid,
      summary: 'Point',
      originalCRS: 'EPSG:4326'
    };

    addGeometryToMap(parsedResult, layerName);
    showValidationStatus('success', 'Centroid Generated', `Successfully calculated spatial centroid for "${layerRecord.name}".`);
  } catch (err) {
    showValidationStatus('error', 'Centroid Failed', `Error calculating centroid: ${err.message}`);
  }
}

function handleSpatialEnvelope() {
  const layerId = parseInt(elements.analysisLayerSelect.value);
  const layerRecord = loadedLayers.find(l => l.id === layerId);
  if (!layerRecord) return;

  try {
    const geojson = layerRecord.layer.toGeoJSON();
    const envelope = turf.envelope(geojson);

    if (!envelope) {
      throw new Error("Turf.js failed to generate bounding envelope.");
    }

    const layerName = `Envelope - ${layerRecord.name}`;
    const parsedResult = {
      type: 'geojson',
      data: envelope,
      summary: 'Polygon',
      originalCRS: 'EPSG:4326'
    };

    addGeometryToMap(parsedResult, layerName);
    showValidationStatus('success', 'Envelope Generated', `Successfully generated bounding envelope for "${layerRecord.name}".`);
  } catch (err) {
    showValidationStatus('error', 'Envelope Failed', `Error generating envelope: ${err.message}`);
  }
}

function updateLiveConvexHull() {
  if (!FEATURE_TOGGLES.autoConvexHull) {
    if (liveConvexHullLayer) {
      map.removeLayer(liveConvexHullLayer);
      liveConvexHullLayer = null;
    }
    return;
  }

  // Gather all valid geometries currently drawn/loaded on the map
  const allFeatures = [];
  loadedLayers.forEach(l => {
    // Only include visible layers
    if (l.visible && l.layer) {
      try {
        const geojson = l.layer.toGeoJSON();
        turf.featureEach(geojson, (f) => {
          if (f.geometry) {
            // Flatten circles to polygons so they can be included in the hull
            if (f.geometry.type === 'Point' && f.properties && typeof f.properties.radius === 'number') {
               const circlePoly = turf.circle(f.geometry.coordinates, f.properties.radius, { steps: 32, units: 'meters' });
               allFeatures.push(circlePoly);
            } else {
               allFeatures.push(f);
            }
          }
        });
      } catch (e) {
        // Ignore layers that can't be converted
      }
    }
  });

  if (allFeatures.length === 0) {
    if (liveConvexHullLayer) {
      map.removeLayer(liveConvexHullLayer);
      liveConvexHullLayer = null;
    }
    return;
  }

  try {
    const fc = turf.featureCollection(allFeatures);
    const hull = turf.convex(fc);
    
    if (liveConvexHullLayer) {
      map.removeLayer(liveConvexHullLayer);
      liveConvexHullLayer = null;
    }
    
    if (hull) {
      const areaMeters = turf.area(hull);
      const areaKm = areaMeters / 1000000;
      const areaLabel = `${areaMeters.toFixed(2)} sq m / ${areaKm.toFixed(6)} sq km`;

      liveConvexHullLayer = L.geoJSON(hull, {
        style: {
          color: '#f43f5e',
          weight: 2,
          dashArray: '5, 5',
          fillColor: '#f43f5e',
          fillOpacity: 0.05,
          interactive: true
        },
        onEachFeature: function(feature, layer) {
          layer.bindPopup(`<b>Live Convex Hull</b><br>Total Area: <span style="color:#f43f5e; font-weight:bold;">${areaLabel}</span>`);
        }
      }).addTo(map);
      
      // Ensure the hull stays at the back so it doesn't block clicks on the actual features
      if (liveConvexHullLayer.bringToBack) {
        liveConvexHullLayer.bringToBack();
      }
    }
  } catch (err) {
    // Can fail if all points are perfectly collinear or not enough points. Just clear the layer.
    if (liveConvexHullLayer) {
      map.removeLayer(liveConvexHullLayer);
      liveConvexHullLayer = null;
    }
  }
}

// ==========================================================================
// ATTRIBUTE TABLE PANEL INTERACTIONS & RENDERING
// ==========================================================================
function toggleTablePanel() {
  const panel = elements.attributeTablePanel;
  if (panel.classList.contains('collapsed')) {
    panel.classList.remove('collapsed');
    panel.classList.add('expanded');
    elements.tableToggleIcon.className = 'fa-solid fa-chevron-down';
  } else {
    panel.classList.remove('expanded');
    panel.classList.add('collapsed');
    elements.tableToggleIcon.className = 'fa-solid fa-chevron-up';
  }
}

function resetTableToEmpty() {
  elements.tableLayerName.textContent = 'None Loaded';
  elements.tableContentWrapper.innerHTML = `
    <div class="table-empty-state">
      <i class="fa-solid fa-table-list"></i>
      <p>Select a layer and click its table action, or load a dataset with properties.</p>
    </div>
  `;
  elements.attributeTablePanel.classList.remove('expanded');
  elements.attributeTablePanel.classList.add('collapsed');
  elements.tableToggleIcon.className = 'fa-solid fa-chevron-up';
  
  // Hide filter row
  elements.tableFilterRow.classList.add('hidden');
}

function loadLayerTable(id) {
  const layerRecord = loadedLayers.find(l => l.id === id);
  if (!layerRecord) return;

  elements.tableLayerName.textContent = layerRecord.name;
  elements.tableContentWrapper.innerHTML = '';
  
  // Expand the panel & show filter row
  elements.attributeTablePanel.classList.remove('collapsed');
  elements.attributeTablePanel.classList.add('expanded');
  elements.tableToggleIcon.className = 'fa-solid fa-chevron-down';

  elements.tableFilterRow.classList.remove('hidden');
  elements.tableFilterInput.value = '';
  elements.tableFilterCount.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';

  const sublayers = [];
  layerRecord.layer.eachLayer(sub => {
    sublayers.push(sub);
  });

  elements.tableFilterCount.textContent = `${sublayers.length} features`;

  if (sublayers.length === 0) {
    elements.tableContentWrapper.innerHTML = `
      <div class="table-empty-state">
        <i class="fa-solid fa-circle-exclamation"></i>
        <p>This layer has no spatial features to display.</p>
      </div>
    `;
    return;
  }

  // Extract unique properties
  const allKeysSet = new Set();
  sublayers.forEach(sub => {
    if (sub.feature && sub.feature.properties) {
      Object.keys(sub.feature.properties).forEach(key => {
        if (key !== 'original_crs') {
          allKeysSet.add(key);
        }
      });
    }
  });

  const columns = ['Feature ID', 'Geometry Type', ...Array.from(allKeysSet)];

  const table = document.createElement('table');
  table.className = 'gis-data-table';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  sublayers.forEach((sub, index) => {
    const tr = document.createElement('tr');
    tr.dataset.sublayerId = L.Util.stamp(sub);
    
    // Feature ID
    const tdId = document.createElement('td');
    tdId.textContent = index + 1;
    tr.appendChild(tdId);

    // Geometry Type
    const tdGeom = document.createElement('td');
    let geomType = 'N/A';
    if (sub instanceof L.Circle) geomType = 'Circle';
    else if (sub instanceof L.Marker) geomType = 'Marker';
    else if (sub instanceof L.CircleMarker) geomType = 'CircleMarker';
    else if (sub instanceof L.Polygon) geomType = 'Polygon';
    else if (sub instanceof L.Polyline) geomType = 'Polyline';
    else if (sub.feature && sub.feature.geometry) geomType = sub.feature.geometry.type;
    tdGeom.textContent = geomType;
    tr.appendChild(tdGeom);

    // Properties
    const props = (sub.feature && sub.feature.properties) ? sub.feature.properties : {};
    if (sub instanceof L.Circle) {
      props.radius = Math.round(sub.getRadius());
    }

    columns.slice(2).forEach(col => {
      const td = document.createElement('td');
      let val = props[col];
      if (val === undefined || val === null) {
        val = '-';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      }
      td.textContent = val;
      td.title = val;
      tr.appendChild(td);
    });

    tr.addEventListener('click', () => {
      tbody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
      zoomToSublayer(sub);
    });

    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  elements.tableContentWrapper.appendChild(table);
}

function zoomToSublayer(subLayer) {
  try {
    if (subLayer.getBounds) {
      const bounds = subLayer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16 });
      }
    } else if (subLayer.getLatLng) {
      map.setView(subLayer.getLatLng(), 16);
    }
    
    setTimeout(() => {
      subLayer.openPopup();
    }, 250);
  } catch (e) {
    console.error('Error zooming to sublayer:', e);
  }
}

// ==========================================================================
// OSM NOMINATIM GEOLOCATION SEARCH
// ==========================================================================
async function handleMapSearch() {
  const query = elements.mapSearchInput.value.trim();
  if (!query) return;

  elements.searchResultsList.innerHTML = '<li class="search-result-item" style="cursor: default;">Searching...</li>';
  elements.searchResultsList.classList.remove('hidden');

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const results = await response.json();
    renderSearchResults(results);
  } catch (err) {
    elements.searchResultsList.innerHTML = `<li class="search-result-item" style="cursor: default; color: var(--color-error);">Search failed: ${escapeHTML(err.message)}</li>`;
  }
}

function renderSearchResults(results) {
  elements.searchResultsList.innerHTML = '';
  
  if (!results || results.length === 0) {
    elements.searchResultsList.innerHTML = '<li class="search-result-item" style="cursor: default;">No locations found.</li>';
    return;
  }

  results.forEach(res => {
    const li = document.createElement('li');
    li.className = 'search-result-item';
    li.textContent = res.display_name;
    li.addEventListener('click', () => {
      const lat = parseFloat(res.lat);
      const lon = parseFloat(res.lon);
      
      // Zoom and Center on map
      map.setView([lat, lon], 15);

      // Create landmark Point feature
      const cleanName = res.display_name.split(',')[0];
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        properties: {
          name: cleanName,
          address: res.display_name
        }
      };

      addGeometryToMap({
        type: 'geojson',
        data: geojson,
        summary: 'Point',
        originalCRS: 'EPSG:4326'
      }, cleanName);

      showValidationStatus('success', 'Location Found', `Successfully plotted "${cleanName}" on the map.`);
      
      // Reset input & hide dropdown
      elements.mapSearchInput.value = '';
      elements.searchResultsList.classList.add('hidden');
    });
    
    elements.searchResultsList.appendChild(li);
  });
}

// ==========================================================================
// STORY MAP PRESENTATION BUILDER & PLAYER
// ==========================================================================
function handleAddStorySlide() {
  slideIdCounter++;
  const center = map.getCenter();
  const zoom = map.getZoom();

  const newSlide = {
    id: slideIdCounter,
    title: `Chapter ${storySlides.length + 1}`,
    desc: `Configure map view and write chapter details here.`,
    center: [center.lat, center.lng],
    zoom: zoom
  };

  storySlides.push(newSlide);
  renderStorySlidesList();
  
  showValidationStatus('success', 'Slide Added', `Added Chapter ${storySlides.length} capturing current map coordinates.`);
}

function handleDeleteStorySlide(id) {
  const index = storySlides.findIndex(s => s.id === id);
  if (index === -1) return;

  storySlides.splice(index, 1);
  
  // Re-number slides
  storySlides.forEach((s, idx) => {
    if (s.title.startsWith('Chapter ')) {
      s.title = `Chapter ${idx + 1}`;
    }
  });

  renderStorySlidesList();
}

function handleCaptureSlideView(id) {
  const slide = storySlides.find(s => s.id === id);
  if (!slide) return;

  const center = map.getCenter();
  const zoom = map.getZoom();

  slide.center = [center.lat, center.lng];
  slide.zoom = zoom;

  renderStorySlidesList();
  showValidationStatus('success', 'View Captured', `Updated slide viewport coordinates to current map camera.`);
}

function renderStorySlidesList() {
  elements.storySlidesList.innerHTML = '';

  if (storySlides.length === 0) {
    elements.storyEmptyMessage.classList.remove('hidden');
    elements.storyActionsRow.style.display = 'none';
    return;
  }

  elements.storyEmptyMessage.classList.add('hidden');
  elements.storyActionsRow.style.display = 'flex';

  storySlides.forEach((slide, index) => {
    const li = document.createElement('li');
    li.className = 'slide-item';
    li.dataset.slideId = slide.id;

    li.innerHTML = `
      <div class="slide-item-header">
        <span class="slide-number">Slide ${index + 1}</span>
        <button class="btn-delete-slide" title="Delete slide" aria-label="Delete slide"><i class="fa-solid fa-trash-can"></i></button>
      </div>
      <input type="text" class="slide-input-title" value="${escapeHTML(slide.title)}" placeholder="Chapter Title" />
      <textarea class="slide-textarea-desc" placeholder="Narrative description...">${escapeHTML(slide.desc)}</textarea>
      <div class="slide-coords-row">
        <span class="slide-coords-badge" title="Saved Coordinates: ${slide.center[0].toFixed(4)}, ${slide.center[1].toFixed(4)} (Zoom: ${escapeHTML(slide.zoom)})">
          <i class="fa-solid fa-camera"></i> Lat: ${slide.center[0].toFixed(3)}, Lng: ${slide.center[1].toFixed(3)}
        </span>
        <button class="btn-capture-view" title="Capture current map view">Capture View</button>
      </div>
    `;

    // Bind event listeners
    li.querySelector('.btn-delete-slide').addEventListener('click', () => handleDeleteStorySlide(slide.id));
    li.querySelector('.btn-capture-view').addEventListener('click', () => handleCaptureSlideView(slide.id));
    
    // Sync title input in real-time
    const titleInput = li.querySelector('.slide-input-title');
    titleInput.addEventListener('input', (e) => {
      slide.title = e.target.value;
    });

    // Sync description in real-time
    const descTextarea = li.querySelector('.slide-textarea-desc');
    descTextarea.addEventListener('input', (e) => {
      slide.desc = e.target.value;
    });

    elements.storySlidesList.appendChild(li);
  });
}

// STORY PLAYER SYSTEM
function handlePlayStory() {
  if (storySlides.length === 0) return;

  activeSlideIndex = 0;
  
  // Clear any existing story path tracer
  if (storyFlowPathLine) {
    map.removeLayer(storyFlowPathLine);
    storyFlowPathLine = null;
  }
  
  // Draw animated flow path tracer line if there are 2 or more slides
  if (storySlides.length >= 2) {
    const latlngs = storySlides.map(s => s.center);
    storyFlowPathLine = L.polyline(latlngs, {
      color: '#a78bfa', // vibrant purple highlight
      weight: 3.5,
      opacity: 0.85,
      className: 'animated-flow-path',
      interactive: false
    }).addTo(map);
  }

  // Show player card
  elements.storyPlayerCard.classList.remove('hidden');
  
  loadActivePlayerSlide();
}

function handleCloseStoryPlayer() {
  elements.storyPlayerCard.classList.add('hidden');
  
  // Remove flow path tracer
  if (storyFlowPathLine) {
    map.removeLayer(storyFlowPathLine);
    storyFlowPathLine = null;
  }
}

function loadActivePlayerSlide() {
  const slide = storySlides[activeSlideIndex];
  if (!slide) return;

  // Fly map to captured center & zoom
  map.flyTo(slide.center, slide.zoom, {
    duration: 1.5,
    easeLinearity: 0.25
  });

  // Update text
  elements.playerSlideIndex.textContent = `Slide ${activeSlideIndex + 1} of ${storySlides.length}`;
  elements.playerSlideTitle.textContent = slide.title;
  elements.playerSlideDesc.textContent = slide.desc;

  // Enable/disable navigation buttons
  elements.btnPrevSlide.disabled = activeSlideIndex === 0;
  elements.btnNextSlide.disabled = activeSlideIndex === storySlides.length - 1;

  // Render navigation dots
  elements.playerNavDots.innerHTML = '';
  storySlides.forEach((s, idx) => {
    const dot = document.createElement('span');
    dot.className = `story-dot ${idx === activeSlideIndex ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      activeSlideIndex = idx;
      loadActivePlayerSlide();
    });
    elements.playerNavDots.appendChild(dot);
  });
}

function handleNextSlide() {
  if (activeSlideIndex < storySlides.length - 1) {
    activeSlideIndex++;
    loadActivePlayerSlide();
  }
}

function handlePrevSlide() {
  if (activeSlideIndex > 0) {
    activeSlideIndex--;
    loadActivePlayerSlide();
  }
}

// ==========================================================================
// TEMPLATE SAMPLES DATA
// ==========================================================================
const SAMPLES = {
  'wkt-point': `POINT (-0.0015 51.4800)`,
  'wkt-polygon': `POLYGON ((-0.003 51.478, 0.001 51.478, 0.001 51.482, -0.003 51.482, -0.003 51.478))`,
  'wkt-bng-point': `POINT (538965 177340)`, // Greenwich Observatory Easting & Northing (EPSG:27700)
  'geojson-collection': `{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-0.0015, 51.4800]
      },
      "properties": {
        "name": "Greenwich Meridian Line",
        "type": "Marker Point"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-0.005, 51.475],
          [-0.003, 51.477],
          [-0.001, 51.479],
          [0.002, 51.481]
        ]
      },
      "properties": {
        "name": "Historic Route",
        "type": "Path"
      }
    }
  ]
}`,
  'geojson-circle': `{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-0.0015, 51.4800]
  },
  "properties": {
    "name": "Greenwich Observatory Circle",
    "radius": 250
  }
}`,
  'kml-polygon': `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>KML Sample Doc</name>
    <Placemark>
      <name>Greenwich Park Boundary</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -0.002,51.477,0
              0.002,51.477,0
              0.002,51.481,0
              -0.002,51.481,0
              -0.002,51.477,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`
};

document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Clear any active uploaded file state
    if (activeUploadedFile) {
      clearLoadedFile();
    }

    const type = btn.dataset.type;
    if (SAMPLES[type]) {
      elements.geoInput.value = SAMPLES[type];
      clearValidationStatus();
      
      if (type.startsWith('wkt-')) {
        elements.formatSelect.value = 'wkt';
        if (type === 'wkt-bng-point') {
          elements.projectionSelect.value = '27700';
        } else {
          elements.projectionSelect.value = '4326';
        }
      } else if (type.startsWith('geojson-')) {
        elements.formatSelect.value = 'geojson';
      } else if (type.startsWith('kml-')) {
        elements.formatSelect.value = 'kml';
      }
      
      updateFormatDependentUI();
    }
  });
});

// ==========================================================================
// INTERACTIVE EVENT LISTENERS & TRIGGERS
// ==========================================================================
async function handleVisualize() {
  const text = elements.geoInput.value;
  const mode = elements.formatSelect.value;

  showValidationStatus('warning', 'Parsing...', 'Validating and loading input data...');

  try {
    let parsed = null;

    if (mode === 'shp') {
      if (!activeUploadedFile || !['zip', 'shp'].includes(activeUploadedFile.extension)) {
        throw new Error('Shapefile mode requires uploading a zipped Shapefile (.zip) or raw Shapefile component (.shp).');
      }
    }
    if (mode === 'kmz') {
      if (!activeUploadedFile || activeUploadedFile.extension !== 'kmz') {
        throw new Error('KMZ mode requires uploading a binary KMZ file (.kmz).');
      }
    }
    
    if (activeUploadedFile && activeUploadedFile.parsedGeoJSON) {
      parsed = {
        type: activeUploadedFile.extension,
        data: activeUploadedFile.parsedGeoJSON,
        summary: activeUploadedFile.extension === 'kmz' ? 'KMZ FeatureCollection' : (activeUploadedFile.extension === 'shp' ? 'Shapefile FeatureCollection' : (activeUploadedFile.extension === 'tab' ? 'MapInfo TAB FeatureCollection' : 'ZIP FeatureCollection')),
        originalCRS: 'EPSG:4326'
      };
    } else if (activeUploadedFile && ['tab', 'dat', 'map', 'id'].includes(activeUploadedFile.extension)) {
      throw new Error('MapInfo TAB files cannot be parsed directly in the browser. Please convert them to GeoJSON using QGIS or ogr2ogr first.');
    } else {
      // Normal synchronous text parsing (GeoJSON, KML, or WKT)
      parsed = validateAndParse(text, mode);
    }
    
    // Create layer display name
    const formatLabel = parsed.type.toUpperCase();
    const geomLabel = parsed.summary;
    const displayName = activeUploadedFile ? activeUploadedFile.name : `${formatLabel} Layer`;

    addGeometryToMap(parsed, displayName);
    showValidationStatus('success', 'Visualization Successful', `Successfully visualized "${displayName}" (${geomLabel}) on the map.`);

  } catch (error) {
    showValidationStatus('error', 'Visualization Failed', error.message);
  }
}

elements.btnClearInput.addEventListener('click', () => {
  if (activeUploadedFile) {
    clearLoadedFile();
  } else {
    elements.geoInput.value = '';
    clearValidationStatus();
  }
});

elements.btnVisualize.addEventListener('click', handleVisualize);
elements.btnClearAll.addEventListener('click', clearMapLayers);
elements.btnFitAll.addEventListener('click', fitAllLayers);

window.addEventListener('DOMContentLoaded', initMap);

// ==========================================================================
// GPS GEOLOCATION & USER NAVIGATION
// ==========================================================================
function locateUser() {
  if (!navigator.geolocation) {
    showValidationStatus('error', 'Location Error', 'Geolocation is not supported by your browser.');
    return;
  }

  showValidationStatus('warning', 'Locating...', 'Requesting GPS coordinate access from browser...');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      // Remove existing GPS layers if any
      if (userLocationMarker) map.removeLayer(userLocationMarker);
      if (userLocationCircle) map.removeLayer(userLocationCircle);

      // Pulse GPS dot icon
      const gpsIcon = L.divIcon({
        className: 'gps-pulse-marker-wrapper',
        html: '<div class="gps-pulse-marker"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      userLocationMarker = L.marker([lat, lng], { icon: gpsIcon }).addTo(map);
      userLocationMarker.bindPopup(`<b>My Current Location</b><br>Accuracy: +/-${Math.round(accuracy)} meters`).openPopup();

      // Accuracy boundary circle
      userLocationCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.12,
        weight: 1
      }).addTo(map);

      // Zoom and center map
      map.setView([lat, lng], 16);

      showValidationStatus('success', 'Location Found', `Centered map on current location (Accuracy: +/-${Math.round(accuracy)}m).`);
    },
    (error) => {
      let msg = 'Failed to retrieve location.';
      if (error.code === error.PERMISSION_DENIED) {
        msg = 'Location permission denied by browser settings.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Location info is unavailable.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'Geolocation request timed out.';
      }
      showValidationStatus('error', 'Location Access Failed', msg);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// ==========================================================================
// INTERACTIVE MEASUREMENT RULER TOOL
// ==========================================================================
function toggleMeasureTool() {
  const panel = elements.measurementControl;
  if (panel.classList.contains('hidden')) {
    if (isTimezoneLookupActive) {
      toggleTimezoneLookupMode();
    }
    if (isochroneClickActive) {
      toggleIsochroneMode();
    }
    panel.classList.remove('hidden');
    setMeasureMode('line');
  } else {
    closeMeasureTool();
  }
}

function closeMeasureTool() {
  elements.measurementControl.classList.add('hidden');
  stopMeasurementDrawing();
}

function stopMeasurementDrawing() {
  if (activeMeasureMode) {
    map.pm.disableDraw();
    activeMeasureMode = null;
  }
  if (measureDrawStartHandler) {
    map.off('pm:drawstart', measureDrawStartHandler);
    measureDrawStartHandler = null;
  }
  if (measureCreateHandler) {
    map.off('pm:create', measureCreateHandler);
    measureCreateHandler = null;
  }
  if (measureWorkingLayer) {
    measureWorkingLayer.off('pm:vertexadded', updateLiveMeasurement);
    measureWorkingLayer.off('pm:change', updateLiveMeasurement);
    map.removeLayer(measureWorkingLayer);
    measureWorkingLayer = null;
  }
  elements.btnMeasureLine.classList.remove('active');
  elements.btnMeasurePoly.classList.remove('active');
  elements.measureCurrentValue.textContent = '0.00 m';
}

function setMeasureMode(mode) {
  stopMeasurementDrawing();
  activeMeasureMode = mode;

  if (mode === 'line') {
    elements.btnMeasureLine.classList.add('active');
    
    map.pm.enableDraw('Line', {
      snappingOption: true,
      templineStyle: { color: '#8b5cf6', dashArray: '5,5' },
      hintlineStyle: { color: '#8b5cf6', dashArray: '5,5' },
      pathOptions: { color: '#c084fc', weight: 3 }
    });

    showValidationStatus('warning', 'Measuring Distance', 'Click coordinates to place segments. Double-click final vertex to complete.');
  } else if (mode === 'polygon') {
    elements.btnMeasurePoly.classList.add('active');

    map.pm.enableDraw('Polygon', {
      snappingOption: true,
      templineStyle: { color: '#8b5cf6', dashArray: '5,5' },
      hintlineStyle: { color: '#8b5cf6', dashArray: '5,5' },
      pathOptions: { color: '#c084fc', fillColor: '#a78bfa', fillOpacity: 0.15, weight: 3 }
    });

    showValidationStatus('warning', 'Measuring Area', 'Click coordinates to draw bounding shape. Double-click final vertex to complete.');
  }

  // Monitor vertex additions for real-time calculation updates
  measureDrawStartHandler = ({ workingLayer }) => {
    measureWorkingLayer = workingLayer;
    
    workingLayer.on('pm:vertexadded', updateLiveMeasurement);
    workingLayer.on('pm:change', updateLiveMeasurement);
  };
  map.on('pm:drawstart', measureDrawStartHandler);

  // Finish shape drawing
  measureCreateHandler = (e) => {
    const layer = e.layer;
    let finalValue = '';
    let label = '';
    
    const geojson = layer.toGeoJSON();
    
    if (activeMeasureMode === 'line') {
      const lengthMeters = turf.length(geojson, { units: 'meters' });
      label = 'Distance';
      finalValue = lengthMeters > 1000 
        ? `${(lengthMeters / 1000).toFixed(2)} km` 
        : `${lengthMeters.toFixed(2)} m`;
    } else {
      const areaSqM = turf.area(geojson);
      label = 'Area';
      finalValue = areaSqM > 1000000 
        ? `${(areaSqM / 1000000).toFixed(2)} sq km` 
        : `${areaSqM.toFixed(2)} sq m`;
    }

    layer.bindPopup(`<b>Measurement Result</b><br>${label}: ${finalValue}`).openPopup();
    
    const cleanName = `${label} Measurement (${finalValue})`;
    const parsedResult = {
      type: 'geojson',
      data: geojson,
      summary: activeMeasureMode === 'line' ? 'LineString' : 'Polygon',
      originalCRS: 'EPSG:4326'
    };

    map.removeLayer(layer);
    addGeometryToMap(parsedResult, cleanName);

    showValidationStatus('success', 'Measurement Saved', `Saved "${cleanName}" in Active Layers.`);
    closeMeasureTool();
  };
  map.once('pm:create', measureCreateHandler);
}

function updateLiveMeasurement() {
  if (!measureWorkingLayer || !activeMeasureMode) return;
  
  try {
    let currentValText = '0.00 m';
    
    if (activeMeasureMode === 'line') {
      const latlngs = measureWorkingLayer.getLatLngs();
      if (latlngs && latlngs.length > 1) {
        const coords = latlngs.map(ll => [ll.lng, ll.lat]);
        const line = turf.lineString(coords);
        const lengthM = turf.length(line, { units: 'meters' });
        currentValText = lengthM > 1000 
          ? `${(lengthM / 1000).toFixed(2)} km` 
          : `${lengthM.toFixed(2)} m`;
      }
    } else {
      const latlngs = measureWorkingLayer.getLatLngs();
      if (latlngs && latlngs[0]) {
        let points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
        if (points.length > 2) {
          const coords = points.map(ll => [ll.lng, ll.lat]);
          coords.push(coords[0]); // close loop
          const poly = turf.polygon([coords]);
          const areaSqM = turf.area(poly);
          currentValText = areaSqM > 1000000 
            ? `${(areaSqM / 1000000).toFixed(2)} sq km` 
            : `${areaSqM.toFixed(2)} sq m`;
        }
      }
    }
    
    elements.measureCurrentValue.textContent = currentValText;
  } catch (err) {
    console.error('Measurement calculation error:', err);
  }
}

// ==========================================================================
// ADVANCED STYLE EDITOR PANEL
// ==========================================================================
function openStyleEditor(layerId) {
  const layerRecord = loadedLayers.find(l => l.id === layerId);
  if (!layerRecord) return;

  activeStyleLayerId = layerId;
  elements.styleLayerTitle.textContent = layerRecord.name;

  // Defaults
  if (layerRecord.strokeWidth === undefined) layerRecord.strokeWidth = 3;
  if (layerRecord.strokeOpacity === undefined) layerRecord.strokeOpacity = 100;
  if (layerRecord.strokeDash === undefined) layerRecord.strokeDash = 'solid';
  if (layerRecord.fillColor === undefined) layerRecord.fillColor = layerRecord.color || '#6366f1';
  if (layerRecord.fillOpacity === undefined) layerRecord.fillOpacity = 15;
  if (layerRecord.markerType === undefined) {
    layerRecord.markerType = layerRecord.type.toLowerCase().includes('point') ? 'pin' : 'circle';
  }
  if (layerRecord.markerRadius === undefined) layerRecord.markerRadius = 8;
  if (layerRecord.markerIcon === undefined) layerRecord.markerIcon = 'fa-location-dot';
  if (layerRecord.markerIconSize === undefined) layerRecord.markerIconSize = 20;

  // Sync inputs
  layerRecord.color = normalizeHexColor(layerRecord.color);
  layerRecord.fillColor = normalizeHexColor(layerRecord.fillColor, layerRecord.color);

  elements.styleStrokeColor.value = layerRecord.color;
  elements.styleStrokeWeight.value = layerRecord.strokeWidth;
  elements.valStrokeWeight.textContent = `${layerRecord.strokeWidth}px`;
  elements.styleStrokeOpacity.value = layerRecord.strokeOpacity;
  elements.valStrokeOpacity.textContent = `${layerRecord.strokeOpacity}%`;
  elements.styleStrokeDash.value = layerRecord.strokeDash;

  elements.styleFillColor.value = layerRecord.fillColor;
  elements.styleFillOpacity.value = layerRecord.fillOpacity;
  elements.valFillOpacity.textContent = `${layerRecord.fillOpacity}%`;

  elements.styleMarkerType.value = layerRecord.markerType;
  elements.styleMarkerRadius.value = layerRecord.markerRadius;
  elements.valMarkerRadius.textContent = `${layerRecord.markerRadius}px`;
  elements.styleMarkerIconSelect.value = layerRecord.markerIcon;
  elements.styleMarkerIconSize.value = layerRecord.markerIconSize;
  elements.valMarkerIconSize.textContent = `${layerRecord.markerIconSize}px`;

  const typeLower = layerRecord.type.toLowerCase();
  
  if (typeLower.includes('line') && !typeLower.includes('polygon') && !typeLower.includes('collection')) {
    elements.styleGroupFill.style.display = 'none';
  } else {
    elements.styleGroupFill.style.display = 'flex';
  }

  if (typeLower.includes('point') || typeLower.includes('circle') || typeLower.includes('collection')) {
    elements.styleGroupMarker.style.display = 'flex';
    document.getElementById('style-marker-cluster-row').style.display = 'flex';
    elements.styleMarkerClusterCheckbox.checked = layerRecord.cluster || false;
    handleMarkerTypeUI(layerRecord.markerType);
  } else {
    elements.styleGroupMarker.style.display = 'none';
    document.getElementById('style-marker-cluster-row').style.display = 'none';
  }

  elements.styleEditorPanel.classList.remove('collapsed');
  elements.styleEditorPanel.classList.add('expanded');
}

function closeStyleEditor() {
  elements.styleEditorPanel.classList.remove('expanded');
  elements.styleEditorPanel.classList.add('collapsed');
  activeStyleLayerId = null;
}

function handleMarkerTypeUI(type) {
  if (type === 'circle') {
    elements.styleMarkerCircleOptions.classList.remove('hidden');
    elements.styleMarkerIconOptions.classList.add('hidden');
  } else if (type === 'icon') {
    elements.styleMarkerCircleOptions.classList.add('hidden');
    elements.styleMarkerIconOptions.classList.remove('hidden');
  } else {
    elements.styleMarkerCircleOptions.classList.add('hidden');
    elements.styleMarkerIconOptions.classList.add('hidden');
  }
}

function handleMarkerTypeChange(e) {
  const type = e.target.value;
  handleMarkerTypeUI(type);
  applyStyleChange();
}

function applyStyleChange() {
  if (!activeStyleLayerId) return;
  const layerRecord = loadedLayers.find(l => l.id === activeStyleLayerId);
  if (!layerRecord) return;

  const oldMarkerType = layerRecord.markerType;
  const oldCluster = layerRecord.cluster || false;

  // Retrieve current form values
  layerRecord.color = normalizeHexColor(elements.styleStrokeColor.value);
  layerRecord.strokeWidth = parseInt(elements.styleStrokeWeight.value);
  layerRecord.strokeOpacity = parseInt(elements.styleStrokeOpacity.value);
  layerRecord.strokeDash = elements.styleStrokeDash.value;
  
  layerRecord.fillColor = normalizeHexColor(elements.styleFillColor.value, layerRecord.color);
  layerRecord.fillOpacity = parseInt(elements.styleFillOpacity.value);
  
  layerRecord.markerType = elements.styleMarkerType.value;
  layerRecord.markerRadius = parseInt(elements.styleMarkerRadius.value);
  layerRecord.markerIcon = elements.styleMarkerIconSelect.value;
  layerRecord.markerIconSize = parseInt(elements.styleMarkerIconSize.value);
  layerRecord.cluster = elements.styleMarkerClusterCheckbox.checked;

  let dashArray = null;
  if (layerRecord.strokeDash === 'dashed') {
    dashArray = `${layerRecord.strokeWidth * 3}, ${layerRecord.strokeWidth * 2}`;
  } else if (layerRecord.strokeDash === 'dotted') {
    dashArray = `1, ${layerRecord.strokeWidth * 2}`;
  }

  const pathOptions = {
    color: layerRecord.color,
    weight: layerRecord.strokeWidth,
    opacity: layerRecord.strokeOpacity / 100,
    fillColor: layerRecord.fillColor,
    fillOpacity: layerRecord.fillOpacity / 100,
    dashArray: dashArray,
    renderer: DEFAULT_VECTOR_RENDERER
  };

  const recreateMarkersNeeded = (oldMarkerType !== layerRecord.markerType) || (oldCluster !== layerRecord.cluster);
  
  if (recreateMarkersNeeded) {
    rebuildLayerFeatures(layerRecord);
  } else {
    // Normal style updates (checking if setStyle is available on the Layer Group)
    if (layerRecord.layer.setStyle) {
      layerRecord.layer.setStyle(pathOptions);
    }
    
    layerRecord.layer.eachLayer(sub => {
      if (sub.setStyle) {
        sub.setStyle(pathOptions);
      }
      
      if (sub instanceof L.CircleMarker && !(sub instanceof L.Circle) && layerRecord.markerType === 'circle') {
        sub.setRadius(layerRecord.markerRadius);
      }

      if (sub instanceof L.Marker && layerRecord.markerType === 'icon') {
        const iconHtml = `<i class="fa-solid ${escapeHTML(layerRecord.markerIcon)}" style="color: ${layerRecord.color}; font-size: ${layerRecord.markerIconSize}px;"></i>`;
        const customIcon = L.divIcon({
          className: 'custom-fa-icon-marker',
          html: iconHtml,
          iconSize: [layerRecord.markerIconSize, layerRecord.markerIconSize],
          iconAnchor: [layerRecord.markerIconSize / 2, layerRecord.markerIconSize / 2]
        });
        sub.setIcon(customIcon);
      }
    });
  }

  updateLayerListPreview(layerRecord);
}

function rebuildLayerFeatures(layerRecord) {
  const geojson = layerRecord.geoJSONData || layerRecord.layer.toGeoJSON();
  map.removeLayer(layerRecord.layer);

  let dashArray = null;
  if (layerRecord.strokeDash === 'dashed') {
    dashArray = `${layerRecord.strokeWidth * 3}, ${layerRecord.strokeWidth * 2}`;
  } else if (layerRecord.strokeDash === 'dotted') {
    dashArray = `1, ${layerRecord.strokeWidth * 2}`;
  }

  const pathOptions = {
    color: layerRecord.color,
    weight: layerRecord.strokeWidth,
    opacity: layerRecord.strokeOpacity / 100,
    fillColor: layerRecord.fillColor,
    fillOpacity: layerRecord.fillOpacity / 100,
    dashArray: dashArray,
    renderer: DEFAULT_VECTOR_RENDERER
  };

  const newLayer = L.geoJSON(geojson, {
    style: function() { return pathOptions; },
    pointToLayer: function(feature, latlng) {
      if (feature.properties && typeof feature.properties.radius === 'number') {
        return L.circle(latlng, {
          ...pathOptions,
          radius: feature.properties.radius
        });
      }
      if (layerRecord.markerType === 'circle') {
        return L.circleMarker(latlng, {
          radius: layerRecord.markerRadius,
          color: layerRecord.color,
          fillColor: layerRecord.fillColor,
          fillOpacity: layerRecord.fillOpacity / 100,
          weight: layerRecord.strokeWidth,
          renderer: DEFAULT_VECTOR_RENDERER
        });
      } else if (layerRecord.markerType === 'icon') {
        const iconHtml = `<i class="fa-solid ${escapeHTML(layerRecord.markerIcon)}" style="color: ${layerRecord.color}; font-size: ${layerRecord.markerIconSize}px;"></i>`;
        const customIcon = L.divIcon({
          className: 'custom-fa-icon-marker',
          html: iconHtml,
          iconSize: [layerRecord.markerIconSize, layerRecord.markerIconSize],
          iconAnchor: [layerRecord.markerIconSize / 2, layerRecord.markerIconSize / 2]
        });
        return L.marker(latlng, { icon: customIcon });
      } else {
        return L.marker(latlng);
      }
    },
    onEachFeature: function(feature, subLayer) {
      if (feature.properties) {
        let popupContent = '<div class="popup-details">';
        popupContent += `<div class="popup-header">${escapeHTML(feature.properties.name || 'Feature Properties')}</div>`;
        popupContent += '<div class="popup-body">';
        Object.keys(feature.properties).forEach(key => {
          if (key !== 'name' && key !== 'radius') {
            popupContent += `<strong>${escapeHTML(key)}:</strong> ${escapeHTML(formatPropertyValue(feature.properties[key]))}<br>`;
          }
        });
        popupContent += '</div></div>';
        subLayer.bindPopup(popupContent);
      }
    }
  });

  let finalLayer;
  if (layerRecord.cluster) {
    const clusterGroup = createClusterGroup();
    clusterGroup.addLayer(newLayer);
    finalLayer = clusterGroup;
  } else {
    finalLayer = newLayer;
  }

  if (layerRecord.visible) {
    finalLayer.addTo(map);
  }
  layerRecord.layer = finalLayer;
}

// ==========================================================================
// ATTRIBUTE TABLE SEARCH & FILTER WITH LINKED MAP-HIGHLIGHTING
// ==========================================================================
function handleTableFilter() {
  const query = elements.tableFilterInput.value.trim().toLowerCase();
  
  const table = elements.tableContentWrapper.querySelector('.gis-data-table');
  if (!table) return;

  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;

  const currentLayerName = elements.tableLayerName.textContent;
  const layerRecord = loadedLayers.find(l => l.name === currentLayerName);
  if (!layerRecord) return;

  // Save original style map
  const defaultStylesMap = new Map();
  layerRecord.layer.eachLayer(sub => {
    let defaultStyle = {
      opacity: layerRecord.strokeOpacity !== undefined ? layerRecord.strokeOpacity / 100 : 0.8,
      fillOpacity: layerRecord.fillOpacity !== undefined ? layerRecord.fillOpacity / 100 : 0.15
    };
    defaultStylesMap.set(L.Util.stamp(sub), defaultStyle);
  });

  rows.forEach(row => {
    const sublayerId = row.dataset.sublayerId;
    let match = false;

    let matchingSublayer = null;
    layerRecord.layer.eachLayer(sub => {
      if (String(L.Util.stamp(sub)) === sublayerId) {
        matchingSublayer = sub;
      }
    });

    if (!query) {
      match = true;
    } else {
      // Parse operator queries e.g. key=val, key>val, key<val
      const eqIdx = query.indexOf('=');
      const gtIdx = query.indexOf('>');
      const ltIdx = query.indexOf('<');
      
      let key = '', operator = '', val = '';
      
      if (eqIdx !== -1) {
        key = query.substring(0, eqIdx).trim();
        operator = '=';
        val = query.substring(eqIdx + 1).trim();
      } else if (gtIdx !== -1) {
        key = query.substring(0, gtIdx).trim();
        operator = '>';
        val = query.substring(gtIdx + 1).trim();
      } else if (ltIdx !== -1) {
        key = query.substring(0, ltIdx).trim();
        operator = '<';
        val = query.substring(ltIdx + 1).trim();
      }

      if (operator && key) {
        const props = (matchingSublayer && matchingSublayer.feature && matchingSublayer.feature.properties) 
          ? matchingSublayer.feature.properties 
          : {};
          
        let propVal = props[key];
        
        // Case-insensitive key lookup
        if (propVal === undefined) {
          const matchingKey = Object.keys(props).find(k => k.toLowerCase() === key);
          if (matchingKey) propVal = props[matchingKey];
        }

        if (propVal !== undefined && propVal !== null) {
          const numProp = parseFloat(propVal);
          const numVal = parseFloat(val);

          if (operator === '=') {
            match = String(propVal).toLowerCase().includes(val);
          } else if (operator === '>') {
            match = !isNaN(numProp) && !isNaN(numVal) && numProp > numVal;
          } else if (operator === '<') {
            match = !isNaN(numProp) && !isNaN(numVal) && numProp < numVal;
          }
        }
      } else {
        // Fallback to text matching across row cells
        const cells = row.querySelectorAll('td');
        for (let i = 0; i < cells.length; i++) {
          if (cells[i].textContent.toLowerCase().includes(query)) {
            match = true;
            break;
          }
        }
      }
    }

    if (match) {
      row.style.display = '';
      visibleCount++;
      
      if (matchingSublayer) {
        const defaults = defaultStylesMap.get(L.Util.stamp(matchingSublayer));
        if (matchingSublayer.setStyle) {
          matchingSublayer.setStyle({
            opacity: defaults ? defaults.opacity : 1,
            fillOpacity: defaults ? defaults.fillOpacity : 0.2
          });
        }
      }
    } else {
      row.style.display = 'none';
      
      if (matchingSublayer) {
        if (matchingSublayer.setStyle) {
          matchingSublayer.setStyle({
            opacity: 0.15,
            fillOpacity: 0.05
          });
        }
      }
    }
  });

  elements.tableFilterCount.textContent = `${visibleCount} showing`;
  if (query) {
    elements.tableFilterCount.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
  } else {
    elements.tableFilterCount.style.backgroundColor = 'rgba(139, 92, 246, 0.08)';
  }
}

function clearTableFilter() {
  elements.tableFilterInput.value = '';
  handleTableFilter();
}

// ==========================================================================
// SPATIAL OPERATIONS TOOLBOX (UNION, INTERSECTION, DIFFERENCE)
// ==========================================================================
function updateOpRunButtonState() {
  const layerA = elements.opLayerA.value;
  const layerB = elements.opLayerB.value;
  elements.btnRunOperation.disabled = !layerA || !layerB || layerA === layerB;
}

function updateOpLayersSelect() {
  const selectA = elements.opLayerA;
  const selectB = elements.opLayerB;
  const currentValA = selectA.value;
  const currentValB = selectB.value;
  
  selectA.innerHTML = '<option value="">-- Select Layer A (Source) --</option>';
  selectB.innerHTML = '<option value="">-- Select Layer B (Overlay) --</option>';
  
  loadedLayers.forEach(l => {
    const optA = document.createElement('option');
    optA.value = l.id;
    optA.textContent = `${l.name} (${l.type})`;
    selectA.appendChild(optA);

    const optB = document.createElement('option');
    optB.value = l.id;
    optB.textContent = `${l.name} (${l.type})`;
    selectB.appendChild(optB);
  });

  if (loadedLayers.some(l => l.id == currentValA)) selectA.value = currentValA;
  if (loadedLayers.some(l => l.id == currentValB)) selectB.value = currentValB;

  updateOpRunButtonState();
}

function flattenToSinglePolygon(geojson) {
  let polygons = [];
  
  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach(f => {
      const flattened = flattenToSinglePolygon(f);
      if (flattened) polygons.push(flattened);
    });
  } else if (geojson.type === 'Feature') {
    if (geojson.geometry && geojson.geometry.type === 'Point' && geojson.properties && typeof geojson.properties.radius === 'number') {
      const center = geojson.geometry.coordinates;
      const radiusMeters = geojson.properties.radius;
      const circlePoly = turf.circle(center, radiusMeters, { steps: 64, units: 'meters' });
      return circlePoly;
    }
    return flattenToSinglePolygon(geojson.geometry);
  } else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    return turf.feature(geojson);
  }
  
  if (polygons.length === 0) return null;
  if (polygons.length === 1) return polygons[0];
  
  let unioned = polygons[0];
  for (let i = 1; i < polygons.length; i++) {
    unioned = turf.union(unioned, polygons[i]);
  }
  return unioned;
}

function handleSpatialOperation() {
  const idA = parseInt(elements.opLayerA.value);
  const idB = parseInt(elements.opLayerB.value);
  const opType = elements.opTypeSelect.value;

  const recordA = loadedLayers.find(l => l.id === idA);
  const recordB = loadedLayers.find(l => l.id === idB);

  if (!recordA || !recordB) {
    showValidationStatus('error', 'Operation Failed', 'Please select two valid layers.');
    return;
  }

  if (opType === 'join') {
    showValidationStatus('warning', 'Calculating Spatial Join...', `Counting points from "${recordA.name}" inside polygons of "${recordB.name}"...`);
    try {
      const geojsonA = recordA.layer.toGeoJSON();
      const geojsonB = recordB.layer.toGeoJSON();

      const pointFeatures = [];
      turf.featureEach(geojsonA, (f) => {
        if (f.geometry) {
          if (f.geometry.type === 'Point' || f.geometry.type === 'MultiPoint') {
            pointFeatures.push(f);
          } else {
            // For Polygons/Lines, use their centroid to allow joining
            try {
              const centroid = turf.centroid(f);
              if (centroid) pointFeatures.push(centroid);
            } catch (e) {}
          }
        }
      });

      if (pointFeatures.length === 0) {
        throw new Error("Layer A (Source) must contain valid geometries for a Spatial Join.");
      }

      const polygonsClone = JSON.parse(JSON.stringify(geojsonB));
      const joinedFeatures = [];
      let maxCount = 0;

      turf.featureEach(polygonsClone, (poly) => {
        if (poly.geometry && (poly.geometry.type === 'Polygon' || poly.geometry.type === 'MultiPolygon')) {
          let count = 0;
          pointFeatures.forEach(pt => {
            if (turf.booleanPointInPolygon(pt, poly)) {
              count++;
            }
          });
          poly.properties = poly.properties || {};
          poly.properties.point_count = count;
          joinedFeatures.push(poly);
          if (count > maxCount) maxCount = count;
        }
      });

      if (joinedFeatures.length === 0) {
        throw new Error("Layer B (Overlay) must contain polygon geometries for a Spatial Join.");
      }

      const joinedFC = {
        type: 'FeatureCollection',
        features: joinedFeatures
      };

      const joinedLayer = L.geoJSON(joinedFC, {
        style: function(feature) {
          const count = feature.properties.point_count || 0;
          const pct = maxCount > 0 ? count / maxCount : 0;
          return {
            color: '#8b5cf6',
            weight: 2,
            opacity: 0.8,
            fillColor: '#8b5cf6',
            fillOpacity: 0.15 + 0.65 * pct
          };
        },
        onEachFeature: function(feature, sub) {
          let popup = `<div class="popup-details">`;
          popup += `<div class="popup-header"><i class="fa-solid fa-clone"></i> Joined Polygon</div>`;
          popup += `<div class="popup-body">`;
          popup += `<strong>Point Count:</strong> <span style="color: #a78bfa; font-weight:700;">${escapeHTML(feature.properties.point_count)}</span><br>`;
          Object.keys(feature.properties).forEach(k => {
            if (k !== 'point_count') {
              popup += `<strong>${escapeHTML(k)}:</strong> ${escapeHTML(formatPropertyValue(feature.properties[k]))}<br>`;
            }
          });
          popup += `</div></div>`;
          sub.bindPopup(popup);
        }
      }).addTo(map);

      const layerName = `Spatial Join - ${recordA.name} in ${recordB.name}`;
      const layerRecord = {
        id: ++layerIdCounter,
        name: layerName,
        type: 'Spatial Join',
        layer: joinedLayer,
        geoJSONData: joinedFC,
        originalGeoJSONType: 'FeatureCollection',
        originalCRS: 'EPSG:4326',
        visible: true,
        text: `[Spatial Join with max ${maxCount} points per polygon]`,
        measurement: { label: 'Max Points Count', value: maxCount },
        color: '#8b5cf6',
        editing: false,
        cluster: false
      };

      loadedLayers.push(layerRecord);
      updateLayersUI();
      showValidationStatus('success', 'Join Complete', `Successfully generated spatial join density theme (max count: ${maxCount}).`);
    } catch (err) {
      showValidationStatus('error', 'Operation Failed', `Error: ${err.message}`);
    }
    return;
  }

  showValidationStatus('warning', 'Processing Overlay...', `Calculating spatial ${opType}...`);

  try {
    const geojsonA = recordA.layer.toGeoJSON();
    const geojsonB = recordB.layer.toGeoJSON();

    const polyA = flattenToSinglePolygon(geojsonA);
    const polyB = flattenToSinglePolygon(geojsonB);

    if (!polyA || !polyB) {
      throw new Error("Target layers must contain valid polygon geometries.");
    }

    let resultGeoJSON = null;

    if (opType === 'union') {
      resultGeoJSON = turf.union(polyA, polyB);
    } else if (opType === 'intersect') {
      resultGeoJSON = turf.intersect(polyA, polyB);
    } else if (opType === 'difference') {
      resultGeoJSON = turf.difference(polyA, polyB);
    }

    if (!resultGeoJSON) {
      throw new Error(`The ${opType} operation yielded an empty geometry (no overlapping polygon).`);
    }

    const opLabel = opType.charAt(0).toUpperCase() + opType.slice(1);
    const layerName = `${opLabel} - ${recordA.name} & ${recordB.name}`;
    
    const parsedResult = {
      type: 'geojson',
      data: resultGeoJSON,
      summary: resultGeoJSON.type || 'Polygon',
      originalCRS: 'EPSG:4326'
    };

    // Give different operations distinct colors for better visibility
    let opColor = '#ec4899'; // Pink for union
    if (opType === 'intersect') opColor = '#f59e0b'; // Amber for intersect
    else if (opType === 'difference') opColor = '#14b8a6'; // Teal for difference

    addGeometryToMap(parsedResult, layerName, opColor);
    showValidationStatus('success', 'Operation Complete', `Successfully generated "${layerName}".`);
  } catch (err) {
    showValidationStatus('error', 'Operation Failed', `Error: ${err.message}`);
  }
}

// ==========================================================================
// SWIPE BASMAP COMPARISON SYSTEM
// ==========================================================================
let swipeDividerRatio = 0.5;
let isDraggingDivider = false;

function toggleSwipeComparison() {
  isSwipeActive = !isSwipeActive;
  
  if (isSwipeActive) {
    elements.btnSwipeToggle.classList.add('active');
    elements.swipeDivider.classList.remove('hidden');
    
    // Create custom swipe pane if it doesn't exist
    if (!map.getPane('swipePane')) {
      const pane = map.createPane('swipePane');
      pane.style.zIndex = 250; // Above tiles, below vector layers (400)
    }
    
    // Load ESRI Satellite basemap in the swipe pane
    secondarySwipeLayer = L.tileLayer(BASEMAP_TILES.esri_satellite.url, {
      ...BASEMAP_TILES.esri_satellite.options,
      pane: 'swipePane'
    }).addTo(map);
    
    swipeDividerRatio = 0.5;
    updateSwipeClip();
    
    // Bind divider drag events
    elements.swipeDivider.addEventListener('mousedown', startDividerDrag);
    elements.swipeDivider.addEventListener('touchstart', startDividerDrag);
    
    // Bind map events for real-time clip updating
    map.on('move', updateSwipeClip);
    map.on('zoom', updateSwipeClip);
    map.on('viewreset', updateSwipeClip);
    window.addEventListener('resize', updateSwipeClip);
  } else {
    elements.btnSwipeToggle.classList.remove('active');
    elements.swipeDivider.classList.add('hidden');
    
    // Unbind drag events
    elements.swipeDivider.removeEventListener('mousedown', startDividerDrag);
    elements.swipeDivider.removeEventListener('touchstart', startDividerDrag);
    
    // Unbind map events
    map.off('move', updateSwipeClip);
    map.off('zoom', updateSwipeClip);
    map.off('viewreset', updateSwipeClip);
    window.removeEventListener('resize', updateSwipeClip);
    
    if (secondarySwipeLayer) {
      map.removeLayer(secondarySwipeLayer);
      secondarySwipeLayer = null;
    }
    
    const pane = map.getPane('swipePane');
    if (pane) {
      pane.style.clipPath = 'none';
    }
  }
}

function updateSwipeClip() {
  if (!isSwipeActive || !secondarySwipeLayer) return;
  
  const mapContainer = map.getContainer();
  const width = mapContainer.offsetWidth;
  const dividerX = width * swipeDividerRatio;
  
  // Position the DOM divider line
  elements.swipeDivider.style.left = `${dividerX}px`;
  
  // Clip the pane container relative to current translation
  const layerPoint = map.containerPointToLayerPoint(L.point(dividerX, 0));
  const pane = map.getPane('swipePane');
  if (pane) {
    // Top, Right, Bottom, Left. We clip everything to the left of the divider
    pane.style.clipPath = `inset(0 0 0 ${layerPoint.x}px)`;
  }
}

function startDividerDrag(e) {
  e.preventDefault();
  isDraggingDivider = true;
  elements.swipeDivider.classList.add('dragging');
  
  if (e.type === 'touchstart') {
    document.addEventListener('touchmove', onDividerDrag, { passive: false });
    document.addEventListener('touchend', stopDividerDrag);
  } else {
    document.addEventListener('mousemove', onDividerDrag);
    document.addEventListener('mouseup', stopDividerDrag);
  }
}

function onDividerDrag(e) {
  if (!isDraggingDivider) return;
  
  const mapContainer = map.getContainer();
  const rect = mapContainer.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  
  let x = clientX - rect.left;
  x = Math.max(0, Math.min(x, rect.width)); // Clamp bounds
  
  swipeDividerRatio = x / rect.width;
  updateSwipeClip();
}

function stopDividerDrag() {
  if (isDraggingDivider) {
    isDraggingDivider = false;
    elements.swipeDivider.classList.remove('dragging');
    
    document.removeEventListener('mousemove', onDividerDrag);
    document.removeEventListener('mouseup', stopDividerDrag);
    document.removeEventListener('touchmove', onDividerDrag);
    document.removeEventListener('touchend', stopDividerDrag);
  }
}

// ==========================================================================
// REAL-TIME VIEWPORT ANALYTICS DASHBOARD
// ==========================================================================
function openAnalyticsDashboard(layerId) {
  const record = loadedLayers.find(l => l.id === layerId);
  if (!record) return;

  activeAnalyticsLayerId = layerId;
  elements.analyticsLayerTitle.textContent = record.name;

  // Extract all attributes from the layer's features
  const keys = new Set();
  record.layer.eachLayer(sub => {
    if (sub.feature && sub.feature.properties) {
      Object.keys(sub.feature.properties).forEach(k => {
        // Ignore internal or dummy properties
        if (k !== 'wkt' && k !== 'geometry' && k !== '_mapinfo_placeholder') {
          keys.add(k);
        }
      });
    }
  });

  // Populate attribute grouping dropdown
  const select = elements.analyticsAttributeSelect;
  select.innerHTML = '';
  
  if (keys.size > 0) {
    elements.chartGroupAttributes.style.display = 'block';
    keys.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      select.appendChild(opt);
    });
    // Default to the first key
    select.value = Array.from(keys)[0];
  } else {
    elements.chartGroupAttributes.style.display = 'none';
  }

  // Open panel
  elements.analyticsDashboardPanel.classList.remove('collapsed');
  elements.analyticsDashboardPanel.classList.add('expanded');

  // Trigger initial render
  updateAnalyticsCharts();
}

function closeAnalyticsDashboard() {
  elements.analyticsDashboardPanel.classList.remove('expanded');
  elements.analyticsDashboardPanel.classList.add('collapsed');
  activeAnalyticsLayerId = null;

  if (geometryChart) {
    geometryChart.destroy();
    geometryChart = null;
  }
  if (attributesChart) {
    attributesChart.destroy();
    attributesChart = null;
  }
}

function updateAnalyticsCharts() {
  if (!activeAnalyticsLayerId) return;

  const record = loadedLayers.find(l => l.id === activeAnalyticsLayerId);
  if (!record) return;

  const bounds = map.getBounds();
  const visibleFeatures = [];

  // Filter sublayers within viewport bounds
  record.layer.eachLayer(sub => {
    let inViewport = false;
    if (typeof sub.getLatLng === 'function') {
      inViewport = bounds.contains(sub.getLatLng());
    } else if (typeof sub.getBounds === 'function') {
      inViewport = bounds.intersects(sub.getBounds());
    }
    
    if (inViewport && sub.feature) {
      visibleFeatures.push(sub.feature);
    }
  });

  // 1. Update KPI: Count
  elements.kpiFeaturesCount.textContent = visibleFeatures.length.toLocaleString();

  // 2. Update KPI: Measurement (Area or Length)
  const tempCollection = {
    type: 'FeatureCollection',
    features: visibleFeatures
  };
  const measurement = getGeometryMeasurement(tempCollection);
  elements.kpiMeasurementSum.textContent = measurement ? `${measurement.label}: ${measurement.value}` : 'N/A';

  // Calculate new KPIs: Centroid, Intersect Count, Union Count
  let centroidText = 'N/A';
  let intersectCount = 0;
  let unionCount = 0;
  if (elements.kpiIntersectCount) elements.kpiIntersectCount.title = '';
  if (elements.kpiUnionCount) elements.kpiUnionCount.title = '';

  if (visibleFeatures.length > 0) {
    try {
      const center = turf.centroid(tempCollection);
      if (center && center.geometry) {
        centroidText = `[${center.geometry.coordinates[1].toFixed(5)}, ${center.geometry.coordinates[0].toFixed(5)}]`;
      }
    } catch (e) {}

    if (visibleFeatures.length <= ANALYTICS_TOPOLOGY_FEATURE_LIMIT) {
      // Calculate intersections
      visibleFeatures.forEach((f1, i) => {
        let intersects = false;
        for (let j = 0; j < visibleFeatures.length; j++) {
          if (i !== j) {
            try {
              if (turf.booleanIntersects(f1, visibleFeatures[j])) {
                intersects = true;
                break;
              }
            } catch (e) {}
          }
        }
        if (intersects) intersectCount++;
      });

      // Calculate union count using our flattener
      try {
        const unioned = flattenToSinglePolygon(tempCollection);
        if (unioned) {
          if (unioned.geometry.type === 'MultiPolygon' || unioned.geometry.type === 'MultiPoint' || unioned.geometry.type === 'MultiLineString') {
            unionCount = unioned.geometry.coordinates.length;
          } else {
            unionCount = 1;
          }
        }
      } catch (e) {}
    } else {
      intersectCount = 'Skipped';
      unionCount = 'Skipped';
      if (elements.kpiIntersectCount) {
        elements.kpiIntersectCount.title = `Skipped for more than ${ANALYTICS_TOPOLOGY_FEATURE_LIMIT} visible features.`;
      }
      if (elements.kpiUnionCount) {
        elements.kpiUnionCount.title = `Skipped for more than ${ANALYTICS_TOPOLOGY_FEATURE_LIMIT} visible features.`;
      }
    }
  }

  if (elements.kpiCentroid) elements.kpiCentroid.textContent = centroidText;
  if (elements.kpiIntersectCount) elements.kpiIntersectCount.textContent = typeof intersectCount === 'number' ? intersectCount.toLocaleString() : intersectCount;
  if (elements.kpiUnionCount) elements.kpiUnionCount.textContent = typeof unionCount === 'number' ? unionCount.toLocaleString() : unionCount;

  // 3. Compute Geometry Breakdown
  const geomCounts = { Point: 0, LineString: 0, Polygon: 0, Other: 0 };
  visibleFeatures.forEach(f => {
    const geomType = f.geometry ? f.geometry.type : 'Point';
    if (geomType === 'Point' || geomType === 'MultiPoint') {
      geomCounts.Point++;
    } else if (geomType === 'LineString' || geomType === 'MultiLineString') {
      geomCounts.LineString++;
    } else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      geomCounts.Polygon++;
    } else {
      geomCounts.Other++;
    }
  });

  // Render/Update Geometry Doughnut Chart
  const ctxGeom = document.getElementById('chart-geometry-types').getContext('2d');
  if (geometryChart) {
    geometryChart.destroy();
  }
  
  geometryChart = new Chart(ctxGeom, {
    type: 'doughnut',
    data: {
      labels: ['Points', 'Lines', 'Polygons', 'Other'],
      datasets: [{
        data: [geomCounts.Point, geomCounts.LineString, geomCounts.Polygon, geomCounts.Other],
        backgroundColor: [
          '#14b8a6', // Teal
          '#8b5cf6', // Purple
          '#6366f1', // Indigo
          '#ec4899'  // Pink
        ],
        borderWidth: 1,
        borderColor: 'rgba(13, 18, 30, 0.95)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#e2e8f0',
            font: { family: 'Outfit, sans-serif', size: 10 },
            padding: 8,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(13, 18, 30, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          borderWidth: 1,
          bodyFont: { family: 'Outfit, sans-serif' }
        }
      },
      cutout: '65%'
    }
  });

  // 4. Compute Selected Attribute Distribution
  const attrKey = elements.analyticsAttributeSelect.value;
  if (attrKey && elements.chartGroupAttributes.style.display !== 'none') {
    const valueCounts = {};
    visibleFeatures.forEach(f => {
      if (f.properties && f.properties[attrKey] !== undefined && f.properties[attrKey] !== null) {
        const val = String(f.properties[attrKey]).trim();
        valueCounts[val] = (valueCounts[val] || 0) + 1;
      } else {
        valueCounts['(Missing)'] = (valueCounts['(Missing)'] || 0) + 1;
      }
    });

    const sortedValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const labels = sortedValues.map(item => item[0]);
    const dataValues = sortedValues.map(item => item[1]);

    const ctxAttr = document.getElementById('chart-attribute-values').getContext('2d');
    if (attributesChart) {
      attributesChart.destroy();
    }

    attributesChart = new Chart(ctxAttr, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Count',
          data: dataValues,
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          hoverBackgroundColor: '#8b5cf6',
          borderRadius: 4,
          borderWidth: 0
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(13, 18, 30, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(139, 92, 246, 0.2)',
            borderWidth: 1,
            bodyFont: { family: 'Outfit, sans-serif' }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { family: 'Outfit, sans-serif', size: 9 }, stepSize: 1 }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#e2e8f0', font: { family: 'Outfit, sans-serif', size: 9 } }
          }
        }
      }
    });
  }
}

// ==========================================================================
// HEATMAP DENSITY VISUALIZER
// ==========================================================================
function handleSpatialHeatmap() {
  const layerId = parseInt(elements.analysisLayerSelect.value);
  if (!layerId) {
    showValidationStatus('error', 'Heatmap Failed', 'Please select an active layer from the analysis dropdown first.');
    return;
  }

  const record = loadedLayers.find(l => l.id === layerId);
  if (!record) {
    showValidationStatus('error', 'Heatmap Failed', 'Selected layer not found.');
    return;
  }

  showValidationStatus('warning', 'Generating Heatmap...', `Processing point features from "${record.name}"...`);

  try {
    const points = [];
    
    // Extract lat/lng and optional intensity from all points in the layer
    record.layer.eachLayer(sub => {
      // Find sublayers that are points (Marker, CircleMarker, but not Polygons/Lines)
      if (typeof sub.getLatLng === 'function' && !(sub instanceof L.Polygon) && !(sub instanceof L.Polyline)) {
        const latlng = sub.getLatLng();
        let intensity = 1.0;
        
        if (sub.feature && sub.feature.properties) {
          // Look for potential numeric weight properties
          const weightKeys = ['weight', 'intensity', 'value', 'count', 'amount', 'temp', 'density'];
          const foundKey = Object.keys(sub.feature.properties).find(k => weightKeys.includes(k.toLowerCase()));
          if (foundKey) {
            const val = parseFloat(sub.feature.properties[foundKey]);
            if (!isNaN(val)) {
              intensity = val;
            }
          }
        }
        points.push([latlng.lat, latlng.lng, intensity]);
      }
    });

    if (points.length === 0) {
      throw new Error('Selected layer contains no point geometries. Heatmap density visualization requires point data.');
    }

    // Initialize Leaflet.heat layer
    const heatLayer = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      max: 1.0
    });

    // Wrap in a custom LayerGroup to allow standard toggle, delete, and bounds-fitting operations
    const heatGroup = L.layerGroup([heatLayer]);
    
    // Calculate bounding box bounds manually so Zoom to Layer functions properly
    const bounds = L.latLngBounds(points.map(p => [p[0], p[1]]));
    heatGroup.getBounds = () => bounds;
    
    // Add dummy setStyle to prevent styling crash in layers list UI
    heatGroup.setStyle = () => {};

    const layerName = `Heatmap - ${record.name}`;
    const layerRecord = {
      id: ++layerIdCounter,
      name: layerName,
      type: 'Heatmap',
      layer: heatGroup,
      originalGeoJSONType: 'FeatureCollection',
      originalCRS: 'EPSG:4326',
      visible: true,
      text: `[Heatmap Layer with ${points.length} points]`,
      measurement: { label: 'Points Count', value: points.length },
      color: '#f97316', // Orange color badge for heatmap
      editing: false
    };

    heatGroup.addTo(map);
    loadedLayers.push(layerRecord);
    updateLayersUI();

    showValidationStatus('success', 'Heatmap Visualised', `Successfully generated density heatmap "${layerName}" with ${points.length} coordinates.`);
  } catch (err) {
    showValidationStatus('error', 'Heatmap Failed', err.message);
  }
}

// ==========================================================================
// MAPINFO TAB FILE BINARY PARSER
// ==========================================================================
function parseMapInfoTab(tabText, datBuffer) {
  const lines = tabText.split('\n');
  const fields = [];
  let inFields = false;
  
  for (let line of lines) {
    line = line.trim();
    if (line.toLowerCase().startsWith('fields')) {
      inFields = true;
      continue;
    }
    if (inFields) {
      if (line === '' || line.startsWith(';') || line.toLowerCase().startsWith('begin') || line.toLowerCase().startsWith('type')) {
        if (line.startsWith(';')) inFields = false;
        continue;
      }
      
      const match = line.match(/^(\w+)\s+([\w\s(),]+)/);
      if (match) {
        const name = match[1];
        const typeStr = match[2].toLowerCase();
        let size = 0;
        let type = 'string';
        
        if (typeStr.startsWith('char')) {
          const charMatch = typeStr.match(/char\s*\((\d+)\)/);
          size = charMatch ? parseInt(charMatch[1]) : 254;
          type = 'string';
        } else if (typeStr.startsWith('integer')) {
          size = 4;
          type = 'integer';
        } else if (typeStr.startsWith('smallint')) {
          size = 2;
          type = 'integer';
        } else if (typeStr.startsWith('float')) {
          size = 8;
          type = 'float';
        } else if (typeStr.startsWith('decimal')) {
          const decMatch = typeStr.match(/decimal\s*\((\d+)\s*,\s*(\d+)\)/);
          size = decMatch ? parseInt(decMatch[1]) + 2 : 12;
          type = 'string';
        } else if (typeStr.startsWith('date')) {
          size = 4;
          type = 'date';
        } else if (typeStr.startsWith('logical')) {
          size = 1;
          type = 'logical';
        } else {
          size = 10;
          type = 'string';
        }
        
        fields.push({ name, type, size });
      }
    }
  }
  
  const view = new DataView(datBuffer);
  let recordLength = 0;
  let recordCount = 0;
  
  if (datBuffer.byteLength >= 8) {
    recordLength = view.getUint16(2, false);
    recordCount = view.getUint32(4, false);
  }
  
  const records = [];
  const headerSize = 512;
  
  if (recordLength > 0 && recordCount > 0) {
    const totalFieldSize = fields.reduce((sum, f) => sum + f.size, 0);
    const recordOffsetShift = recordLength > totalFieldSize ? recordLength - totalFieldSize : 1;
    
    for (let r = 0; r < recordCount; r++) {
      const recordStart = headerSize + r * recordLength;
      if (recordStart + recordLength > datBuffer.byteLength) break;
      
      const recordProps = {};
      let fieldOffset = recordOffsetShift;
      
      fields.forEach(f => {
        const fieldStart = recordStart + fieldOffset;
        if (fieldStart + f.size <= datBuffer.byteLength) {
          if (f.type === 'string') {
            const uint8Arr = new Uint8Array(datBuffer, fieldStart, f.size);
            let str = '';
            for (let i = 0; i < uint8Arr.length; i++) {
              if (uint8Arr[i] === 0) break;
              str += String.fromCharCode(uint8Arr[i]);
            }
            recordProps[f.name] = str.trim();
          } else if (f.type === 'integer') {
            if (f.size === 4) {
              recordProps[f.name] = view.getInt32(fieldStart, false);
            } else if (f.size === 2) {
              recordProps[f.name] = view.getInt16(fieldStart, false);
            }
          } else if (f.type === 'float') {
            recordProps[f.name] = view.getFloat64(fieldStart, false);
          } else if (f.type === 'logical') {
            const val = view.getUint8(fieldStart);
            recordProps[f.name] = (val === 84 || val === 116) ? 'T' : 'F';
          } else {
            recordProps[f.name] = `(Binary ${f.size} bytes)`;
          }
        } else {
          recordProps[f.name] = '';
        }
        fieldOffset += f.size;
      });
      
      records.push(recordProps);
    }
  }
  
  const center = map ? map.getCenter() : L.latLng(51.48, -0.0015);
  const features = records.map((rec, idx) => {
    const angle = idx * 0.5;
    const radius = 0.0005 * Math.sqrt(idx + 1); // Archimedean spiral
    const lat = center.lat + radius * Math.sin(angle);
    const lng = center.lng + radius * Math.cos(angle);
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        ...rec,
        _mapinfo_placeholder: true
      }
    };
  });
  
  return {
    type: 'FeatureCollection',
    features: features
  };
}

// ==========================================================================
// VISUAL EXPANSION SUITE FUNCTIONS
// ==========================================================================

// Helper to create glassmorphic marker cluster group
function createClusterGroup() {
  return L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    chunkedLoading: true,
    chunkInterval: 80,
    chunkDelay: 20,
    removeOutsideVisibleBounds: true,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let level = 'small';
      if (count >= 100) level = 'large';
      else if (count >= 10) level = 'medium';
      return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${level}`,
        iconSize: [40, 40]
      });
    }
  });
}

// 1. TEMPORAL TIMELINE PLAYER DRAWERS
function openTimelinePlayer(layerId) {
  const record = loadedLayers.find(l => l.id === layerId);
  if (!record) return;
  
  let timeKey = null;
  const uniqueTimes = new Set();
  
  record.layer.eachLayer(sub => {
    if (sub.feature && sub.feature.properties) {
      const keys = Object.keys(sub.feature.properties);
      const found = keys.find(k => ['date', 'time', 'timestamp', 'year', 'datetime', 'created_at'].includes(k.toLowerCase()));
      if (found) {
        timeKey = found;
        const val = sub.feature.properties[found];
        if (val !== undefined && val !== null) {
          uniqueTimes.add(val);
        }
      }
    }
  });
  
  if (!timeKey || uniqueTimes.size === 0) {
    showValidationStatus('error', 'Timeline Failed', `No temporal fields (date, time, year, etc.) found in layer "${record.name}".`);
    return;
  }
  
  // Sort times chronologically
  timelineSliderDates = Array.from(uniqueTimes).sort((a, b) => {
    const da = new Date(a).getTime() || parseFloat(a) || 0;
    const db = new Date(b).getTime() || parseFloat(b) || 0;
    return da - db;
  });
  
  activeTimelineLayerId = layerId;
  elements.timelineLayerName.textContent = record.name;
  elements.timelineStartVal.textContent = timelineSliderDates[0];
  elements.timelineEndVal.textContent = timelineSliderDates[timelineSliderDates.length - 1];
  
  elements.timelineSlider.disabled = false;
  elements.timelineSlider.min = 0;
  elements.timelineSlider.max = timelineSliderDates.length - 1;
  elements.timelineSlider.value = 0;
  
  // Collapse other panels
  elements.attributeTablePanel.classList.add('collapsed');
  elements.attributeTablePanel.classList.remove('expanded');
  elements.elevationProfilePanel.classList.add('collapsed');
  elements.elevationProfilePanel.classList.remove('expanded');
  
  // Show timeline player
  elements.timelinePlayerPanel.classList.remove('collapsed');
  elements.timelinePlayerPanel.classList.add('expanded');
  
  // Render initial timeline tick
  elements.timelineCurrentVal.textContent = timelineSliderDates[0];
  filterLayerByTime(record, timelineSliderDates[0], timeKey);
}

function closeTimelinePlayer() {
  if (timelineTimer) {
    clearInterval(timelineTimer);
    timelineTimer = null;
  }
  elements.btnTimelinePlay.innerHTML = '<i class="fa-solid fa-play"></i> Play';
  elements.timelinePlayerPanel.classList.remove('expanded');
  elements.timelinePlayerPanel.classList.add('collapsed');
  
  // Restore full opacity on features
  if (activeTimelineLayerId) {
    const record = loadedLayers.find(l => l.id === activeTimelineLayerId);
    if (record) {
      record.layer.eachLayer(sub => {
        if (sub.setStyle) {
          sub.setStyle({
            opacity: record.strokeOpacity ? record.strokeOpacity / 100 : 0.85,
            fillOpacity: record.fillOpacity ? record.fillOpacity / 100 : 0.15
          });
        }
        if (sub instanceof L.Marker && !(sub instanceof L.CircleMarker)) {
          sub.setOpacity(1);
        }
      });
    }
  }
  activeTimelineLayerId = null;
}

function toggleTimelinePlayback() {
  const btn = elements.btnTimelinePlay;
  
  if (timelineTimer) {
    clearInterval(timelineTimer);
    timelineTimer = null;
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
  } else {
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    const record = loadedLayers.find(l => l.id === activeTimelineLayerId);
    if (!record) return;
    
    let timeKey = null;
    record.layer.eachLayer(sub => {
      if (sub.feature && sub.feature.properties) {
        const keys = Object.keys(sub.feature.properties);
        const found = keys.find(k => ['date', 'time', 'timestamp', 'year', 'datetime', 'created_at'].includes(k.toLowerCase()));
        if (found) timeKey = found;
      }
    });
    
    const slider = elements.timelineSlider;
    const speed = parseInt(elements.timelineSpeed.value) || 500;
    
    timelineTimer = setInterval(() => {
      let val = parseInt(slider.value);
      val++;
      if (val >= timelineSliderDates.length) {
        val = 0; // Loop timeline
      }
      slider.value = val;
      
      const currentTimeVal = timelineSliderDates[val];
      elements.timelineCurrentVal.textContent = currentTimeVal;
      filterLayerByTime(record, currentTimeVal, timeKey);
    }, speed);
  }
}

function handleTimelineSliderInput() {
  const index = parseInt(elements.timelineSlider.value);
  const currentTimeVal = timelineSliderDates[index];
  elements.timelineCurrentVal.textContent = currentTimeVal;
  
  const record = loadedLayers.find(l => l.id === activeTimelineLayerId);
  if (!record) return;
  
  let timeKey = null;
  record.layer.eachLayer(sub => {
    if (sub.feature && sub.feature.properties) {
      const keys = Object.keys(sub.feature.properties);
      const found = keys.find(k => ['date', 'time', 'timestamp', 'year', 'datetime', 'created_at'].includes(k.toLowerCase()));
      if (found) timeKey = found;
    }
  });
  
  filterLayerByTime(record, currentTimeVal, timeKey);
}

function filterLayerByTime(record, currentTimeVal, timeKey) {
  const targetTime = new Date(currentTimeVal).getTime() || parseFloat(currentTimeVal) || 0;
  
  record.layer.eachLayer(sub => {
    if (sub.feature && sub.feature.properties) {
      const val = sub.feature.properties[timeKey];
      const featureTime = new Date(val).getTime() || parseFloat(val) || 0;
      const show = featureTime <= targetTime;
      
      if (sub.setStyle) {
        sub.setStyle({
          opacity: show ? (record.strokeOpacity ? record.strokeOpacity / 100 : 0.85) : 0,
          fillOpacity: show ? (record.fillOpacity ? record.fillOpacity / 100 : 0.15) : 0
        });
      }
      if (sub instanceof L.Marker && !(sub instanceof L.CircleMarker)) {
        sub.setOpacity(show ? 1 : 0);
      }
    }
  });
}

// 2. LIVE ELEVATION PROFILE DRAWER
function openElevationProfile(layerId) {
  const record = loadedLayers.find(l => l.id === layerId);
  if (!record) return;

  const coordinates = [];
  record.layer.eachLayer(sub => {
    if (sub instanceof L.Polyline && !(sub instanceof L.Polygon)) {
      const latlngs = sub.getLatLngs();
      latlngs.forEach(ll => {
        coordinates.push([ll.lng, ll.lat]);
      });
    }
  });

  if (coordinates.length < 2) {
    showValidationStatus('error', 'Elevation Profile Failed', `Selected layer "${record.name}" does not contain polyline geometries.`);
    return;
  }

  // View drawer
  elements.elevationLayerName.textContent = record.name;
  elements.elevationProfilePanel.classList.remove('collapsed');
  elements.elevationProfilePanel.classList.add('expanded');
  
  // Collapse other drawers
  elements.attributeTablePanel.classList.add('collapsed');
  elements.attributeTablePanel.classList.remove('expanded');
  elements.timelinePlayerPanel.classList.add('collapsed');
  elements.timelinePlayerPanel.classList.remove('expanded');

  fetchElevationProfile(coordinates, record.name);
}

function closeElevationProfile() {
  elements.elevationProfilePanel.classList.remove('expanded');
  elements.elevationProfilePanel.classList.add('collapsed');
  
  if (elevationChart) {
    elevationChart.destroy();
    elevationChart = null;
  }
  
  if (elevationHoverMarker) {
    map.removeLayer(elevationHoverMarker);
    elevationHoverMarker = null;
  }
}

function fetchElevationProfile(coordinates, layerName) {
  // Sample up to 50 coordinates to keep REST API string sizes reasonable
  const sampledCoords = [];
  const maxPoints = 50;
  if (coordinates.length <= maxPoints) {
    coordinates.forEach(c => sampledCoords.push(c));
  } else {
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.floor((i / (maxPoints - 1)) * (coordinates.length - 1));
      sampledCoords.push(coordinates[idx]);
    }
  }

  const lats = sampledCoords.map(c => c[1]);
  const lngs = sampledCoords.map(c => c[0]);
  const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lngs.join(',')}`;

  elements.elevationEmptyState.style.display = 'flex';
  elements.elevationEmptyState.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><p>Querying Open-Meteo Elevation API...</p>';

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && Array.isArray(data.elevation)) {
        renderElevationChart(sampledCoords, data.elevation);
      } else {
        throw new Error("Invalid elevation API format");
      }
    })
    .catch(err => {
      console.warn("Elevation API failed; falling back to terrain generator:", err);
      // Sinusoidal mockup terrain values
      const mockElevations = sampledCoords.map((c, i) => {
        return 120 + 45 * Math.sin(i * 0.15) + 15 * Math.cos(i * 0.45);
      });
      renderElevationChart(sampledCoords, mockElevations, true);
    });
}

let elevationHoverMarker = null;
function renderElevationChart(coords, elevations, isMock = false) {
  elements.elevationEmptyState.style.display = 'none';
  
  const ctx = document.getElementById('chart-elevation-profile').getContext('2d');
  if (elevationChart) {
    elevationChart.destroy();
  }
  
  // Calculate running geodetic distances for X axis labels
  let runningDist = 0;
  const labels = [0];
  for (let i = 1; i < coords.length; i++) {
    const p1 = turf.point(coords[i - 1]);
    const p2 = turf.point(coords[i]);
    const d = turf.distance(p1, p2, { units: 'meters' });
    runningDist += d;
    labels.push(runningDist);
  }
  
  const formattedLabels = labels.map(d => d >= 1000 ? `${(d / 1000).toFixed(2)} km` : `${Math.round(d)} m`);

  elevationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedLabels,
      datasets: [{
        label: isMock ? 'Elevation (Terrain Generator Fallback - m)' : 'Elevation (m)',
        data: elevations,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ec4899',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: isMock ? '#ec4899' : '#94a3b8',
            font: { family: 'Outfit, sans-serif', size: 10 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(13, 18, 30, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          borderWidth: 1,
          bodyFont: { family: 'Outfit, sans-serif' },
          callbacks: {
            label: function(context) {
              return `Elevation: ${Math.round(context.raw)} m`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit, sans-serif', size: 8 }, maxTicksLimit: 8 }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8', font: { family: 'Outfit, sans-serif', size: 8 } }
        }
      },
      onHover: function(event, activeElements) {
        if (activeElements.length > 0) {
          const index = activeElements[0].index;
          const coord = coords[index];
          if (coord) {
            const latlng = L.latLng(coord[1], coord[0]);
            if (elevationHoverMarker) {
              elevationHoverMarker.setLatLng(latlng);
            } else {
              const hoverIcon = L.divIcon({
                className: 'elevation-crosshair-marker-wrapper',
                html: '<div class="gps-pulse-marker" style="background-color: #ec4899; box-shadow: 0 0 10px #ec4899; width:12px; height:12px; border-radius:50%;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
              });
              elevationHoverMarker = L.marker(latlng, { icon: hoverIcon }).addTo(map);
            }
          }
        } else {
          if (elevationHoverMarker) {
            map.removeLayer(elevationHoverMarker);
            elevationHoverMarker = null;
          }
        }
      }
    }
  });
}

// 3. ORGANIC ISOCHRONE CONTOURS Click-Handler
function toggleIsochroneMode() {
  isochroneClickActive = !isochroneClickActive;
  
  if (isochroneClickActive) {
    if (isTimezoneLookupActive) {
      toggleTimezoneLookupMode();
    }
    closeMeasureTool();
    map.pm.disableDraw();
    
    elements.btnAnalysisIsochrone.classList.add('active');
    showValidationStatus('warning', 'Isochrone Active', 'Click anywhere on the map to generate 5, 10, and 15-minute travel zones.');
    map.getContainer().style.cursor = 'crosshair';
  } else {
    elements.btnAnalysisIsochrone.classList.remove('active');
    map.getContainer().style.cursor = '';
  }
}

function generateIsochroneContours(latlng) {
  // Turn off placement mode
  toggleIsochroneMode();
  
  showValidationStatus('warning', 'Calculating Travel Zones...', 'Generating organic travel-time buffers around the cursor...');

  try {
    const centerPt = turf.point([latlng.lng, latlng.lat]);
    
    // 5 mins = 400m, 10 mins = 800m, 15 mins = 1200m
    const radii = [400, 800, 1200];
    const labels = ['5 Min Walk', '10 Min Walk', '15 Min Walk'];
    const colors = ['#14b8a6', '#6366f1', '#8b5cf6'];
    const opacityScales = [0.4, 0.25, 0.15];
    
    if (isochroneLayerGroup) {
      map.removeLayer(isochroneLayerGroup);
    }
    
    isochroneLayerGroup = L.layerGroup();
    const features = [];
    
    for (let i = radii.length - 1; i >= 0; i--) {
      const radiusM = radii[i];
      const buffer = turf.buffer(centerPt, radiusM, { units: 'meters', steps: 64 });
      
      // Perturb coordinate vertices to simulate real street-network layouts organics
      if (buffer.geometry && buffer.geometry.type === 'Polygon') {
        const coords = buffer.geometry.coordinates[0];
        const perturbedCoords = coords.map((coord, idx) => {
          if (idx === coords.length - 1) return null;
          
          const noise = 0.05 + 0.1 * Math.sin(idx * 0.8) + Math.random() * 0.05;
          const factor = 1 + noise;
          
          const dx = coord[0] - latlng.lng;
          const dy = coord[1] - latlng.lat;
          return [latlng.lng + dx * factor, latlng.lat + dy * factor];
        });
        
        const finalCoords = perturbedCoords.filter(c => c !== null);
        finalCoords.push(finalCoords[0]);
        
        buffer.geometry.coordinates[0] = finalCoords;
      }
      
      buffer.properties = {
        name: labels[i],
        time: labels[i],
        radius: `${radiusM} m`
      };
      
      const leafGeoJSON = L.geoJSON(buffer, {
        style: {
          color: colors[i],
          weight: 2.5,
          opacity: 0.85,
          fillColor: colors[i],
          fillOpacity: opacityScales[i]
        }
      });
      
      isochroneLayerGroup.addLayer(leafGeoJSON);
      features.push(buffer);
    }
    
    const isochroneFC = {
      type: 'FeatureCollection',
      features: features
    };
    
    const layerName = `Isochrones - [${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`;
    const layerRecord = {
      id: ++layerIdCounter,
      name: layerName,
      type: 'Isochrones',
      layer: isochroneLayerGroup,
      geoJSONData: isochroneFC,
      originalGeoJSONType: 'FeatureCollection',
      originalCRS: 'EPSG:4326',
      visible: true,
      text: `[Travel accessibility contours around ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}]`,
      measurement: { label: 'Center Coordinate', value: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}` },
      color: '#14b8a6',
      editing: false,
      cluster: false
    };
    
    // Add dummy setStyle to prevent styling crashes in layers list UI
    isochroneLayerGroup.setStyle = () => {};
    
    isochroneLayerGroup.addTo(map);
    loadedLayers.push(layerRecord);
    updateLayersUI();
    
    showValidationStatus('success', 'Contours Created', `Successfully generated travel contours around target location.`);
  } catch (err) {
    showValidationStatus('error', 'Isochrone Failed', err.message);
  }
}

// 4. LIVE WEATHER RADAR & EARTHQUAKES WMS FEEDS
function toggleLiveWeatherRadar(e) {
  const active = e.target.checked;
  
  if (active) {
    showValidationStatus('warning', 'Connecting Weather Service...', 'Retrieving recent radar scan configuration...');
    
    const configUrl = 'https://api.rainviewer.com/public/weather-maps.json';
    
    fetch(configUrl)
      .then(res => res.json())
      .then(data => {
        if (data && data.radar && Array.isArray(data.radar.past)) {
          const pastFrames = data.radar.past;
          const latestFrame = pastFrames[pastFrames.length - 1];
          const path = latestFrame.path;
          
          if (liveFeeds.weather) {
            map.removeLayer(liveFeeds.weather);
          }
          
          const tileUrl = `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
          
          liveFeeds.weather = L.tileLayer(tileUrl, {
            opacity: 0.65,
            attribution: '&copy; <a href="https://www.rainviewer.com/api.html">RainViewer</a> weather radar data',
            zIndex: 300
          }).addTo(map);
          
          const timeString = new Date(latestFrame.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          showValidationStatus('success', 'Radar Connected', `Displaying precipitation radar (scan time: ${timeString}).`);
        } else {
          throw new Error("Invalid radar API configuration");
        }
      })
      .catch(err => {
        showValidationStatus('error', 'Weather Service Error', `Could not connect to RainViewer cache: ${err.message}`);
        e.target.checked = false;
      });
  } else {
    if (liveFeeds.weather) {
      map.removeLayer(liveFeeds.weather);
      liveFeeds.weather = null;
    }
  }
}

function toggleLiveEarthquakes(e) {
  const active = e.target.checked;
  
  if (active) {
    showValidationStatus('warning', 'Loading Earthquakes Feed...', 'Fetching recent global earthquake data from USGS...');
    
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    
    fetch(url)
      .then(res => res.json())
      .then(geojson => {
        if (liveFeeds.earthquakes) {
          map.removeLayer(liveFeeds.earthquakes);
        }
        
        liveFeeds.earthquakes = L.geoJSON(geojson, {
          pointToLayer: function(feature, latlng) {
            const mag = feature.properties.mag || 1.0;
            const radius = Math.max(5, Math.min(25, mag * 3.5));
            let color = '#10b981';
            if (mag >= 4.5) color = '#ef4444';
            else if (mag >= 2.5) color = '#f59e0b';
            
            return L.circleMarker(latlng, {
              radius: radius,
              color: color,
              weight: 1.5,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.5,
              className: 'eq-pulsing-marker'
            });
          },
          onEachFeature: function(feature, layer) {
            const props = feature.properties || {};
            const date = new Date(props.time).toLocaleString();
            let popup = `<div class="popup-details">`;
            popup += `<div class="popup-header" style="background-color:rgba(239, 68, 68, 0.15); color:#ef4444;"><i class="fa-solid fa-house-crack"></i> Earthquake Alert</div>`;
            popup += `<div class="popup-body">`;
            popup += `<strong>Magnitude:</strong> <span style="font-size:14px; font-weight:700; color:#ef4444;">${escapeHTML(props.mag)}</span><br>`;
            popup += `<strong>Location:</strong> ${escapeHTML(props.place)}<br>`;
            popup += `<strong>Time:</strong> ${date}<br>`;
            popup += `<strong>Depth:</strong> ${escapeHTML(feature.geometry.coordinates[2] || 0)} km<br>`;
            popup += `<strong>Status:</strong> ${escapeHTML(props.status)}<br>`;
            popup += `</div></div>`;
            layer.bindPopup(popup);
          }
        }).addTo(map);
        
        showValidationStatus('success', 'USGS Feed Connected', `Successfully plotted ${geojson.features.length} recent earthquake coordinates.`);
      })
      .catch(err => {
        showValidationStatus('error', 'Feed Connection Failed', `Error connecting to USGS service: ${err.message}`);
        e.target.checked = false;
      });
  } else {
    if (liveFeeds.earthquakes) {
      map.removeLayer(liveFeeds.earthquakes);
      liveFeeds.earthquakes = null;
    }
  }
}

// 5. COORDINATE TIMEZONE & LOCAL TIME LOOKUP
function toggleTimezoneLookupMode() {
  isTimezoneLookupActive = !isTimezoneLookupActive;
  const btn = elements.btnTimezoneLookup;
  
  if (isTimezoneLookupActive) {
    closeMeasureTool();
    if (isochroneClickActive) {
      toggleIsochroneMode();
    }
    map.pm.disableDraw();
    
    btn.classList.add('active');
    map.getContainer().classList.add('timezone-cursor');
    showValidationStatus('warning', 'Timezone Lookup Active', 'Click anywhere on the map to see country/state timezone and local time.');
  } else {
    btn.classList.remove('active');
    map.getContainer().classList.remove('timezone-cursor');
  }
}

async function fetchTimezoneAndLocalTime(latlng) {
  const { lat, lng } = latlng;
  
  const loadingPopup = L.popup()
    .setLatLng(latlng)
    .setContent(`
      <div class="popup-details">
        <div class="popup-header" style="background-color:rgba(139, 92, 246, 0.15); color:#a78bfa;">
          <i class="fa-solid fa-spinner fa-spin"></i> Resolving Timezone...
        </div>
        <div class="popup-body">
          Querying geographical metadata for coordinates [${lat.toFixed(5)}, ${lng.toFixed(5)}]...
        </div>
      </div>
    `)
    .openOn(map);

  let addressStr = 'Unknown Location';
  let timezoneId = null;
  let dstStatus = 'Unknown';
  let formattedTime = '';

  try {
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData && geoData.display_name) {
        const addr = geoData.address || {};
        const parts = [];
        if (addr.suburb || addr.neighbourhood || addr.city_district) {
          parts.push(addr.suburb || addr.neighbourhood || addr.city_district);
        }
        if (addr.city || addr.town || addr.village || addr.county) {
          parts.push(addr.city || addr.town || addr.village || addr.county);
        }
        if (addr.state || addr.region) {
          parts.push(addr.state || addr.region);
        }
        if (addr.country) {
          parts.push(addr.country);
        }
        addressStr = parts.length > 0 ? parts.join(', ') : geoData.display_name;
      }
    }
  } catch (err) {
    console.warn("Reverse geocoding failed, using coordinates only:", err);
  }

  if (addressStr === 'Unknown Location') {
    addressStr = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  try {
    const timeApiUrl = `https://timeapi.io/api/time/current/coordinate?latitude=${lat}&longitude=${lng}`;
    const timeRes = await fetch(timeApiUrl);
    if (timeRes.ok) {
      const timeData = await timeRes.json();
      if (timeData && timeData.timeZone) {
        timezoneId = timeData.timeZone;
        dstStatus = timeData.dstActive ? 'Daylight Saving Time (DST)' : 'Standard Time';
      }
    }
  } catch (err) {
    console.warn("TimeAPI.io failed, attempting Open-Meteo fallback...", err);
  }

  if (!timezoneId) {
    try {
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto`;
      const meteoRes = await fetch(meteoUrl);
      if (meteoRes.ok) {
        const meteoData = await meteoRes.json();
        if (meteoData && meteoData.timezone) {
          timezoneId = meteoData.timezone;
          dstStatus = 'Standard / Unknown';
        }
      }
    } catch (err) {
      console.warn("Open-Meteo fallback failed as well:", err);
    }
  }

  if (timezoneId) {
    try {
      const now = new Date();
      formattedTime = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneId,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).format(now);

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneId,
        timeZoneName: 'longOffset'
      }).formatToParts(now);
      const tzPart = parts.find(p => p.type === 'timeZoneName');
      const offsetStr = tzPart ? tzPart.value : '';

      loadingPopup.setContent(`
        <div class="popup-details">
          <div class="popup-header" style="background-color:rgba(139, 92, 246, 0.15); color:#a78bfa;">
            <i class="fa-solid fa-clock"></i> Timezone & Local Time
          </div>
          <div class="popup-body" style="font-size:12px; line-height:1.6;">
            <strong>Location:</strong> ${escapeHTML(addressStr)}<br>
            <strong>Timezone:</strong> <code style="color:#c084fc; font-family:var(--font-mono);">${escapeHTML(timezoneId)}</code> (${escapeHTML(offsetStr)})<br>
            <strong>Local Time:</strong> <span style="color:#a78bfa; font-weight:600;">${escapeHTML(formattedTime)}</span><br>
            <strong>Status:</strong> ${escapeHTML(dstStatus)}<br>
            <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:8px;">
              Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}
            </span>
          </div>
        </div>
      `);
      return;
    } catch (err) {
      console.error("Local formatting failed:", err);
    }
  }

  const localTime = new Date().toLocaleString();
  const utcTime = new Date().toUTCString();
  loadingPopup.setContent(`
    <div class="popup-details">
      <div class="popup-header" style="background-color:rgba(239, 68, 68, 0.15); color:#ef4444;">
        <i class="fa-solid fa-triangle-exclamation"></i> Timezone Offline
      </div>
      <div class="popup-body" style="font-size:12px;">
        Could not resolve local timezone for these coordinates.<br><br>
        <strong>Location:</strong> ${escapeHTML(addressStr)}<br>
        <strong>Your Time:</strong> ${escapeHTML(localTime)}<br>
        <strong>UTC Time:</strong> ${escapeHTML(utcTime)}<br>
        <span style="font-size:10px; color:var(--text-muted); display:block; margin-top:8px;">
          Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}
        </span>
      </div>
    </div>
  `);
}
