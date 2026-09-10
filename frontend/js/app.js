/* ==========================================================================
   ThermaSight AI - SIH Thermal Anomaly Source Attribution Dashboard Logic
   Vibrant GIS Cartography, Live Satellite Stream Polling & AI Telemetry
   ========================================================================== */

(function () {
    'use strict';

    // ----------------------------------------------------------------------
    // 1. STATE & CONSTANTS
    // ----------------------------------------------------------------------
    const API_BASE_URL = (window.location.protocol === 'file:' || !window.location.host) 
        ? 'http://localhost:8000' 
        : window.location.origin;

    const DEFAULT_CENTER = [22.5937, 78.9629]; // India Center
    const DEFAULT_ZOOM = 5;

    // Key Industrial Infrastructure Hubs across India
    const KNOWN_INDUSTRIAL_HUBS = [
        { name: "Gujarat Refinery Petrochemical Complex", lat: 22.3072, lon: 73.1812, type: "Petrochemical Refinery" },
        { name: "Angul Steel & Thermal Power Hub", lat: 20.8880, lon: 85.1511, type: "Steel & Power" },
        { name: "Jamnagar Petroleum Refinery (RIL)", lat: 22.4707, lon: 69.8378, type: "Mega Refinery" },
        { name: "Singrauli Thermal Power Supercluster", lat: 24.2005, lon: 82.6657, type: "Thermal Power" },
        { name: "Bhilai Steel Plant", lat: 21.1938, lon: 81.3509, type: "Steel Metallurgy" },
        { name: "Visakhapatnam Steel & Port Zone", lat: 17.6868, lon: 83.2185, type: "Industrial Port" }
    ];

    // Standalone Mock Dataset
    const MOCK_EVENTS = [
        {
            "event_id": "FIRMS-IND-2025-001",
            "latitude": 22.3072,
            "longitude": 73.1812,
            "acq_date": "2025-05-12",
            "acq_time": "1330",
            "satellite": "VIIRS_SNPP",
            "frp": 64.2,
            "brightness_temperature": 358.4,
            "confidence": "high",
            "daynight": "N",
            "classification": "INDUSTRIAL",
            "prediction_probability": 0.942,
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Gujarat Refinery Petrochemical Complex",
            "industrial_distance_km": 0.22,
            "industrial_nearby": true,
            "hotspot_count_7d": 5,
            "hotspot_count_30d": 24,
            "hotspot_count_90d": 71,
            "land_cover": "Built-up / Industrial",
            "reasons": [
                "Industrial facility within 300m (0.22 km distance)",
                "High temporal persistence (24 detections in 30 days)",
                "Elevated FRP thermal flare signature (64.2 MW)",
                "Built-up / Industrial land cover category"
            ]
        },
        {
            "event_id": "FIRMS-IND-2025-002",
            "latitude": 30.0668,
            "longitude": 79.0193,
            "acq_date": "2025-05-14",
            "acq_time": "0815",
            "satellite": "VIIRS_SNPP",
            "frp": 12.8,
            "brightness_temperature": 322.1,
            "confidence": "nominal",
            "daynight": "D",
            "classification": "NATURAL",
            "prediction_probability": 0.965,
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Garhwal Hydro Station",
            "industrial_distance_km": 14.85,
            "industrial_nearby": false,
            "hotspot_count_7d": 2,
            "hotspot_count_30d": 2,
            "hotspot_count_90d": 3,
            "land_cover": "Tree cover / Forest",
            "reasons": [
                "No industrial infrastructure within 5 km (nearest 14.85 km)",
                "Transient thermal activity (2 detections in 30 days)",
                "Forest land cover classification (Wildfire signature)",
                "Nominal FRP and brightness profile"
            ]
        },
        {
            "event_id": "FIRMS-IND-2025-003",
            "latitude": 20.8880,
            "longitude": 85.1511,
            "acq_date": "2025-05-18",
            "acq_time": "0210",
            "satellite": "VIIRS_SNPP",
            "frp": 88.5,
            "brightness_temperature": 367.9,
            "confidence": "high",
            "daynight": "N",
            "classification": "INDUSTRIAL",
            "prediction_probability": 0.918,
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Angul Steel & Thermal Power Hub",
            "industrial_distance_km": 0.41,
            "industrial_nearby": true,
            "hotspot_count_7d": 7,
            "hotspot_count_30d": 31,
            "hotspot_count_90d": 89,
            "land_cover": "Built-up",
            "reasons": [
                "Industrial facility within 500m (0.41 km distance)",
                "High temporal persistence (31 detections in 30 days)",
                "Extreme thermal intensity (88.5 MW FRP flare)"
            ]
        },
        {
            "event_id": "FIRMS-IND-2025-004",
            "latitude": 30.9010,
            "longitude": 75.8573,
            "acq_date": "2025-10-25",
            "acq_time": "1245",
            "satellite": "VIIRS_SNPP",
            "frp": 28.4,
            "brightness_temperature": 338.2,
            "confidence": "nominal",
            "daynight": "D",
            "classification": "NATURAL",
            "prediction_probability": 0.884,
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Ludhiana Textile Zone",
            "industrial_distance_km": 8.12,
            "industrial_nearby": false,
            "hotspot_count_7d": 3,
            "hotspot_count_30d": 4,
            "hotspot_count_90d": 4,
            "land_cover": "Cropland",
            "reasons": [
                "Cropland land cover context (Seasonal stubble burn signature)",
                "No industrial infrastructure within 5 km",
                "Short duration cluster without long-term persistence"
            ]
        },
        {
            "event_id": "FIRMS-IND-2025-005",
            "latitude": 22.4707,
            "longitude": 69.8378,
            "acq_date": "2025-06-01",
            "acq_time": "2310",
            "satellite": "VIIRS_SNPP",
            "frp": 95.0,
            "brightness_temperature": 372.4,
            "confidence": "high",
            "daynight": "N",
            "classification": "INDUSTRIAL",
            "prediction_probability": 0.981,
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Jamnagar Petroleum Refinery (RIL)",
            "industrial_distance_km": 0.15,
            "industrial_nearby": true,
            "hotspot_count_7d": 9,
            "hotspot_count_30d": 42,
            "hotspot_count_90d": 115,
            "land_cover": "Built-up / Industrial",
            "reasons": [
                "Industrial flare stack located within 150m (0.15 km)",
                "Continuous high temporal recurrence (42 detections / 30d)",
                "Very high radiative flare intensity (95.0 MW FRP)"
            ]
        }
    ];

    let appState = {
        events: [],
        filteredEvents: [],
        stats: null,
        selectedEventId: null,
        activeView: 'map',
        activeTileLayer: 'dark',
        autoSyncInterval: null,
        isLivePolling: true,
        filters: {
            search: '',
            classification: 'ALL',
            minFrp: 0,
            minConfidence: 0.5,
            industrialOnly: false,
            recurrence: 'all'
        },
        layers: {
            industrialNodes: true,
            bufferRings: true,
            frpPulse: true
        }
    };

    let map = null;
    let tileLayers = {};
    let markersLayerGroup = null;
    let facilityLayerGroup = null;
    let bufferRingsGroup = null;
    let charts = {};

    // ----------------------------------------------------------------------
    // 2. INITIALIZATION
    // ----------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        initLucideIcons();
        initMap();
        initEventListeners();
        loadDashboardData();
        startAutoSyncPolling();
    });

    function initLucideIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // ----------------------------------------------------------------------
    // 3. LEAFLET MAP INITIALIZATION (HIGH VISIBILITY TILE LAYERS)
    // ----------------------------------------------------------------------
    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        map = L.map('map', {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Highly visible CartoDB Dark Matter raster tiles (No watermark, crisp contrast)
        tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        });

        // Esri World Imagery (Satellite View)
        tileLayers.sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 18
        });

        // OpenStreetMap (Street View)
        tileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        });

        // Default to Dark Cartography
        tileLayers.dark.addTo(map);

        bufferRingsGroup = L.layerGroup().addTo(map);
        facilityLayerGroup = L.layerGroup().addTo(map);
        markersLayerGroup = L.layerGroup().addTo(map);

        map.on('mousemove', (e) => {
            const coordsText = document.getElementById('coordsText');
            if (coordsText) {
                coordsText.textContent = `${e.latlng.lat.toFixed(4)}° N, ${e.latlng.lng.toFixed(4)}° E`;
            }
        });

        renderIndustrialFacilities();
    }

    function renderIndustrialFacilities() {
        if (!facilityLayerGroup || !bufferRingsGroup) return;
        facilityLayerGroup.clearLayers();
        bufferRingsGroup.clearLayers();

        if (!appState.layers.industrialNodes) return;

        KNOWN_INDUSTRIAL_HUBS.forEach(hub => {
            const iconHtml = `<div class="marker-facility" title="${hub.name}"><i data-lucide="factory" style="width:13px;height:13px;"></i></div>`;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-map-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker([hub.lat, hub.lon], { icon: customIcon });
            marker.bindTooltip(`<strong>${hub.name}</strong><br><span style="color:#00f0ff; font-size:10px;">${hub.type}</span>`, { direction: 'top', offset: [0, -8] });
            facilityLayerGroup.addLayer(marker);

            // Buffer Ring (5 km radius)
            if (appState.layers.bufferRings) {
                const circle = L.circle([hub.lat, hub.lon], {
                    radius: 5000,
                    color: '#00f0ff',
                    weight: 1.5,
                    dashArray: '4, 4',
                    fillColor: '#00f0ff',
                    fillOpacity: 0.06
                });
                bufferRingsGroup.addLayer(circle);
            }
        });
        initLucideIcons();
    }

    // ----------------------------------------------------------------------
    // 4. DATA FETCHING & LIVE SYNC ENGINE
    // ----------------------------------------------------------------------
    async function loadDashboardData(showNotification = false) {
        try {
            const [eventsResp, statsResp] = await Promise.all([
                fetch(`${API_BASE_URL}/events`).catch(() => null),
                fetch(`${API_BASE_URL}/events/stats`).catch(() => null)
            ]);

            if (eventsResp && eventsResp.ok) {
                const backendEvents = await eventsResp.json();
                
                // Merge simulated events if any exist
                const simEvents = appState.events.filter(e => e.event_id.startsWith('SIM-'));
                appState.events = [...simEvents, ...backendEvents];
                
                appState.stats = (statsResp && statsResp.ok) ? await statsResp.json() : computeStatsFromEvents(appState.events);
                updateStatusChip('live', '● LIVE SYNC ACTIVE');

                if (showNotification) {
                    showToast('⚡ Live API Poll: Telemetry updated from FastAPI backend', 'info');
                }
            } else {
                if (appState.events.length === 0) {
                    appState.events = MOCK_EVENTS;
                }
                appState.stats = computeStatsFromEvents(appState.events);
                updateStatusChip('demo', '● STANDALONE DEMO');
            }
        } catch (err) {
            if (appState.events.length === 0) {
                appState.events = MOCK_EVENTS;
            }
            appState.stats = computeStatsFromEvents(appState.events);
            updateStatusChip('demo', '● STANDALONE DEMO');
        }

        applyFilters();
    }

    function startAutoSyncPolling() {
        if (appState.autoSyncInterval) clearInterval(appState.autoSyncInterval);
        
        // Auto-poll every 6 seconds to demonstrate LIVE sync
        appState.autoSyncInterval = setInterval(() => {
            if (appState.isLivePolling) {
                loadDashboardData(false);
            }
        }, 6000);
    }

    function computeStatsFromEvents(events) {
        if (!events || events.length === 0) return { total_events: 0, industrial_count: 0, natural_count: 0, avg_frp: 0, max_frp: 0, high_confidence_ratio: 0 };
        const total = events.length;
        const industrial = events.filter(e => e.classification === 'INDUSTRIAL').length;
        const natural = events.filter(e => e.classification === 'NATURAL').length;
        const frps = events.map(e => e.frp);
        const max_frp = Math.round(Math.max(...frps) * 10) / 10;
        const highConf = events.filter(e => e.prediction_probability >= 0.90).length;

        return {
            total_events: total,
            industrial_count: industrial,
            natural_count: natural,
            avg_frp: Math.round((frps.reduce((a, b) => a + b, 0) / total) * 10) / 10,
            max_frp: max_frp,
            high_confidence_ratio: Math.round((highConf / total) * 100) / 100
        };
    }

    function updateStatusChip(type, text) {
        const chipText = document.getElementById('statusText');
        const chipDot = document.querySelector('#systemStatusChip .chip-dot');
        if (chipText) chipText.textContent = text;
        if (chipDot) {
            if (type === 'live') {
                chipDot.style.backgroundColor = '#00e699';
                chipDot.style.boxShadow = '0 0 8px #00e699';
            } else {
                chipDot.style.backgroundColor = '#ff9900';
                chipDot.style.boxShadow = 'none';
            }
        }
    }

    // ----------------------------------------------------------------------
    // 5. FILTERING ENGINE
    // ----------------------------------------------------------------------
    function applyFilters() {
        const { search, classification, minFrp, minConfidence, industrialOnly, recurrence } = appState.filters;

        appState.filteredEvents = appState.events.filter(event => {
            if (search) {
                const query = search.toLowerCase();
                const matchId = event.event_id.toLowerCase().includes(query);
                const matchFacility = (event.nearest_industrial_facility || '').toLowerCase().includes(query);
                const matchLand = (event.land_cover || '').toLowerCase().includes(query);
                if (!matchId && !matchFacility && !matchLand) return false;
            }
            if (classification !== 'ALL' && event.classification !== classification) return false;
            if (event.frp < minFrp) return false;
            if (event.prediction_probability < minConfidence) return false;
            if (industrialOnly && event.industrial_distance_km >= 1.0) return false;
            if (recurrence === 'high' && event.hotspot_count_30d < 10) return false;
            if (recurrence === 'transient' && event.hotspot_count_30d >= 5) return false;
            return true;
        });

        renderHeaderTelemetry();
        renderMapMarkers();
        renderTable();
        renderAnalyticsCharts();
        updateFilterCounters();

        if (!appState.selectedEventId && appState.filteredEvents.length > 0) {
            selectEvent(appState.filteredEvents[0].event_id, false);
        }
    }

    function updateFilterCounters() {
        document.getElementById('filteredCount').textContent = appState.filteredEvents.length;
        document.getElementById('totalCount').textContent = appState.events.length;
        document.getElementById('gridEventCount').textContent = appState.filteredEvents.length;
    }

    function renderHeaderTelemetry() {
        const stats = appState.stats || computeStatsFromEvents(appState.events);
        document.getElementById('statTotalEvents').textContent = stats.total_events;
        document.getElementById('statIndustrialCount').textContent = stats.industrial_count;
        document.getElementById('statNaturalCount').textContent = stats.natural_count;
        document.getElementById('statMaxFrp').textContent = stats.max_frp;
    }

    // ----------------------------------------------------------------------
    // 6. MAP MARKERS (VIBRANT COLORS & PULSE ANIMATION)
    // ----------------------------------------------------------------------
    function renderMapMarkers() {
        if (!markersLayerGroup) return;
        markersLayerGroup.clearLayers();

        appState.filteredEvents.forEach(event => {
            const isInd = event.classification === 'INDUSTRIAL';
            const markerClass = isInd ? 'marker-ind' : 'marker-nat';
            const isPulsing = appState.layers.frpPulse ? 'marker-pulse' : '';
            const size = Math.min(Math.max(16 + Math.round(event.frp / 6), 18), 32);

            const html = `<div class="${markerClass} ${isPulsing}" style="width:${size}px;height:${size}px;" title="${event.event_id}"></div>`;
            const customIcon = L.divIcon({
                html: html,
                className: 'custom-map-marker',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });

            const marker = L.marker([event.latitude, event.longitude], { icon: customIcon });

            const popupContent = `
                <div style="padding:6px; min-width:170px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <span class="badge-sm ${isInd ? 'badge-ind' : 'badge-nat'}">${event.classification}</span>
                        <span style="font-size:10px; font-family:monospace; color:#94a3b8;">${event.event_id}</span>
                    </div>
                    <div style="font-size:14px; font-weight:700; color:#ffffff; margin-bottom:4px;">
                        ${event.frp} MW FRP
                    </div>
                    <div style="font-size:11px; color:#cbd5e1; margin-bottom:8px;">
                        ${event.nearest_industrial_facility || event.land_cover}<br>
                        <small style="color:#64748b;">Distance: ${event.industrial_distance_km} km</small>
                    </div>
                    <button class="btn btn-secondary btn-sm btn-full popup-inspect-btn" data-id="${event.event_id}">
                        Inspect Telemetry
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => selectEvent(event.event_id, false));

            markersLayerGroup.addLayer(marker);
        });

        map.off('popupopen');
        map.on('popupopen', () => {
            document.querySelectorAll('.popup-inspect-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    selectEvent(id, true);
                    map.closePopup();
                });
            });
        });
    }

    // ----------------------------------------------------------------------
    // 7. DATA TABLE RENDERER
    // ----------------------------------------------------------------------
    function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        if (appState.filteredEvents.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:24px; color:#64748b;">No thermal events match current filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = appState.filteredEvents.map(e => {
            const isSelected = e.event_id === appState.selectedEventId ? 'selected-row' : '';
            const isInd = e.classification === 'INDUSTRIAL';
            const certPct = Math.round(e.prediction_probability * 100);

            return `
                <tr class="${isSelected}" data-id="${e.event_id}">
                    <td style="font-family:var(--font-mono); font-weight:600; color:#ffffff;">${e.event_id}</td>
                    <td><span class="badge-sm ${isInd ? 'badge-ind' : 'badge-nat'}">${e.classification}</span></td>
                    <td style="font-family:var(--font-mono); font-weight:600; color:${certPct > 90 ? '#00e699' : '#ff6b00'};">${certPct}%</td>
                    <td style="font-family:var(--font-mono); font-size:11px;">${e.latitude.toFixed(4)}°, ${e.longitude.toFixed(4)}°</td>
                    <td style="font-family:var(--font-heading); font-weight:700; color:#ffffff;">${e.frp} MW</td>
                    <td style="max-width:170px; overflow:hidden; text-overflow:ellipsis;">${e.nearest_industrial_facility || 'None in 5km'}</td>
                    <td style="font-family:var(--font-mono);">${e.industrial_distance_km} km</td>
                    <td><span style="font-weight:600; color:${e.hotspot_count_30d > 10 ? '#ff6b00' : '#94a3b8'};">${e.hotspot_count_30d}</span></td>
                    <td>${e.land_cover || 'Built-up'}</td>
                    <td style="font-size:10px; color:#64748b;">${e.acq_date} ${e.acq_time}</td>
                    <td><button class="btn btn-outline btn-sm row-inspect-btn" data-id="${e.event_id}">Inspect</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.getAttribute('data-id');
                if (id) selectEvent(id, true);
            });
        });
    }

    // ----------------------------------------------------------------------
    // 8. INSPECTOR PANEL
    // ----------------------------------------------------------------------
    function selectEvent(eventId, focusMap = false) {
        appState.selectedEventId = eventId;
        const event = appState.events.find(e => e.event_id === eventId);

        document.querySelectorAll('#tableBody tr').forEach(row => {
            if (row.getAttribute('data-id') === eventId) row.classList.add('selected-row');
            else row.classList.remove('selected-row');
        });

        if (!event) return;

        const emptyState = document.getElementById('inspectorEmptyState');
        const inspectorContent = document.getElementById('inspectorContent');

        if (emptyState) emptyState.classList.add('hidden');
        if (inspectorContent) inspectorContent.classList.remove('hidden');

        const banner = document.getElementById('verdictBanner');
        const classTag = document.getElementById('verdictClassTag');
        const verdictId = document.getElementById('verdictEventId');
        const fillBar = document.getElementById('verdictProgressFill');
        const probText = document.getElementById('verdictProbText');

        const isInd = event.classification === 'INDUSTRIAL';
        const probPct = Math.round(event.prediction_probability * 100);

        if (banner) banner.className = isInd ? 'verdict-card' : 'verdict-card natural-card';
        if (classTag) classTag.textContent = event.classification;
        if (verdictId) verdictId.textContent = event.event_id;
        if (probText) probText.textContent = `${probPct}% Certainty Score`;
        if (fillBar) fillBar.style.width = `${probPct}%`;

        // Evidence
        const evidenceList = document.getElementById('evidenceList');
        if (evidenceList) {
            const reasons = event.reasons && event.reasons.length > 0 ? event.reasons : [
                `Proximity: ${event.industrial_distance_km} km to nearest facility`,
                `FRP Thermal intensity: ${event.frp} MW`,
                `Temporal recurrence: ${event.hotspot_count_30d} hits in 30 days`
            ];
            evidenceList.innerHTML = reasons.map(r => `<li><i data-lucide="${isInd ? 'flame' : 'trees'}"></i><span>${r}</span></li>`).join('');
            initLucideIcons();
        }

        // Specs
        document.getElementById('detFacility').textContent = event.nearest_industrial_facility || 'None within 5 km';
        document.getElementById('detDistance').textContent = `${event.industrial_distance_km} km`;
        document.getElementById('detLandCover').textContent = event.land_cover || 'Built-up / Industrial';
        document.getElementById('det30dCount').textContent = `${event.hotspot_count_30d} hits`;

        document.getElementById('detCoordinates').textContent = `${event.latitude.toFixed(4)}°, ${event.longitude.toFixed(4)}°`;
        document.getElementById('detFrp').textContent = `${event.frp} MW`;
        document.getElementById('detBt').textContent = `${event.brightness_temperature || 350.0} K`;
        document.getElementById('detAcqTime').textContent = `${event.acq_date} @ ${event.acq_time} UTC`;
        document.getElementById('detSatOrbit').textContent = `${event.satellite || 'VIIRS_SNPP'} (${event.daynight === 'N' ? 'Night Orbit' : 'Day Orbit'})`;
        document.getElementById('detConfidence').textContent = (event.confidence || 'HIGH').toUpperCase();

        if (focusMap && map) {
            map.flyTo([event.latitude, event.longitude], 12, { duration: 1.0 });
        }
    }

    // ----------------------------------------------------------------------
    // 9. ANALYTICS CHARTS
    // ----------------------------------------------------------------------
    function renderAnalyticsCharts() {
        const events = appState.filteredEvents;

        const pieCtx = document.getElementById('chartAttributionPie')?.getContext('2d');
        if (pieCtx) {
            const indCount = events.filter(e => e.classification === 'INDUSTRIAL').length;
            const natCount = events.filter(e => e.classification === 'NATURAL').length;

            if (charts.pie) charts.pie.destroy();
            charts.pie = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Industrial Flares', 'Natural Fires'],
                    datasets: [{ data: [indCount, natCount], backgroundColor: ['#ff6b00', '#00e699'], borderColor: '#121829', borderWidth: 3 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } }
            });
        }

        const histCtx = document.getElementById('chartFrpHist')?.getContext('2d');
        if (histCtx) {
            const bins = [0, 0, 0, 0, 0];
            events.forEach(e => {
                if (e.frp < 20) bins[0]++;
                else if (e.frp < 40) bins[1]++;
                else if (e.frp < 60) bins[2]++;
                else if (e.frp < 80) bins[3]++;
                else bins[4]++;
            });

            if (charts.hist) charts.hist.destroy();
            charts.hist = new Chart(histCtx, {
                type: 'bar',
                data: {
                    labels: ['0-20 MW', '20-40 MW', '40-60 MW', '60-80 MW', '80+ MW'],
                    datasets: [{ data: bins, backgroundColor: 'rgba(255, 107, 0, 0.75)', borderRadius: 4 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e2942' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e2942' } } },
                    plugins: { legend: { display: false } }
                }
            });
        }

        const scatterCtx = document.getElementById('chartScatter')?.getContext('2d');
        if (scatterCtx) {
            const indPoints = events.filter(e => e.classification === 'INDUSTRIAL').map(e => ({ x: e.industrial_distance_km, y: e.frp }));
            const natPoints = events.filter(e => e.classification === 'NATURAL').map(e => ({ x: e.industrial_distance_km, y: e.frp }));

            if (charts.scatter) charts.scatter.destroy();
            charts.scatter = new Chart(scatterCtx, {
                type: 'scatter',
                data: {
                    datasets: [
                        { label: 'Industrial Flares', data: indPoints, backgroundColor: '#ff6b00' },
                        { label: 'Natural Wildfires', data: natPoints, backgroundColor: '#00e699' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Distance to Facility (km)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#1e2942' } },
                        y: { title: { display: true, text: 'FRP Intensity (MW)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#1e2942' } }
                    },
                    plugins: { legend: { labels: { color: '#94a3b8' } } }
                }
            });
        }
    }

    // ----------------------------------------------------------------------
    // 10. SIMULATION ENGINE
    // ----------------------------------------------------------------------
    function calculateDistanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 100) / 100;
    }

    function runSimulationAttribution(lat, lon, frp, bt, landCover, satellite) {
        let minDistance = 9999;
        let nearestFacility = null;

        KNOWN_INDUSTRIAL_HUBS.forEach(hub => {
            const dist = calculateDistanceKm(lat, lon, hub.lat, hub.lon);
            if (dist < minDistance) {
                minDistance = dist;
                nearestFacility = hub;
            }
        });

        const isNearby = minDistance <= 2.0;
        const isBuiltUp = landCover.includes('Built-up') || landCover.includes('Industrial');

        let classification = 'NATURAL';
        let confidence = 0.85;

        if (isNearby || (isBuiltUp && frp > 35.0)) {
            classification = 'INDUSTRIAL';
            confidence = Math.min(0.88 + (isNearby ? 0.08 : 0.02), 0.98);
        } else {
            classification = 'NATURAL';
            confidence = Math.min(0.86 + (minDistance > 10 ? 0.08 : 0.02), 0.97);
        }

        const newId = `SIM-FIRMS-${Date.now().toString().slice(-4)}`;
        const newEvent = {
            event_id: newId,
            latitude: lat,
            longitude: lon,
            acq_date: new Date().toISOString().split('T')[0],
            acq_time: "1200",
            satellite: satellite,
            frp: frp,
            brightness_temperature: bt,
            confidence: "high",
            daynight: "D",
            classification: classification,
            prediction_probability: Math.round(confidence * 1000) / 1000,
            model_version: "xgboost_v1_prototype",
            nearest_industrial_facility: nearestFacility ? nearestFacility.name : null,
            industrial_distance_km: minDistance,
            industrial_nearby: isNearby,
            hotspot_count_7d: isNearby ? 4 : 1,
            hotspot_count_30d: isNearby ? 18 : 2,
            hotspot_count_90d: isNearby ? 45 : 3,
            land_cover: landCover,
            reasons: [
                `Proximity: ${minDistance} km to ${nearestFacility ? nearestFacility.name : 'nearest facility'}`,
                `FRP Radiative signature: ${frp} MW`,
                `Land cover zoning: ${landCover}`
            ]
        };

        appState.events.unshift(newEvent);
        appState.stats = computeStatsFromEvents(appState.events);
        applyFilters();
        selectEvent(newId, true);
        showToast(`⚡ LIVE SIMULATION: Event ${newId} created & attributed!`, 'success');
    }

    // ----------------------------------------------------------------------
    // 11. EVENT LISTENERS
    // ----------------------------------------------------------------------
    function initEventListeners() {
        // Toggle Sidebar
        const btnToggleSidebar = document.getElementById('btnToggleSidebar');
        const controlPanel = document.getElementById('controlPanel');
        if (btnToggleSidebar && controlPanel) {
            btnToggleSidebar.addEventListener('click', () => {
                controlPanel.classList.toggle('collapsed');
                setTimeout(() => { if (map) map.invalidateSize(); }, 260);
            });
        }

        // Live Poll Trigger Button in Header Status Chip
        document.getElementById('systemStatusChip')?.addEventListener('click', () => {
            loadDashboardData(true);
        });

        // Close Inspector
        const btnCloseInspector = document.getElementById('btnCloseInspector');
        const inspectorPanel = document.getElementById('inspectorPanel');
        if (btnCloseInspector && inspectorPanel) {
            btnCloseInspector.addEventListener('click', () => {
                inspectorPanel.classList.toggle('collapsed');
                setTimeout(() => { if (map) map.invalidateSize(); }, 260);
            });
        }

        // View Tabs
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const view = tab.getAttribute('data-view');
                appState.activeView = view;

                document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
                if (view === 'map') {
                    document.getElementById('viewMapContainer')?.classList.add('active');
                    if (map) map.invalidateSize();
                } else if (view === 'grid') {
                    document.getElementById('viewGridContainer')?.classList.add('active');
                } else if (view === 'analytics') {
                    document.getElementById('viewAnalyticsContainer')?.classList.add('active');
                    renderAnalyticsCharts();
                }
            });
        });

        // Search Input & Clear
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                appState.filters.search = e.target.value;
                if (clearSearchBtn) {
                    if (e.target.value) clearSearchBtn.classList.remove('hidden');
                    else clearSearchBtn.classList.add('hidden');
                }
                applyFilters();
            });
        }
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                appState.filters.search = '';
                clearSearchBtn.classList.add('hidden');
                applyFilters();
            });
        }

        // Classification Pills
        document.querySelectorAll('#classFilterGroup .pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#classFilterGroup .pill-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                appState.filters.classification = btn.getAttribute('data-class');
                applyFilters();
            });
        });

        // ----------------------------------------------------------------------
        // SLIDER FILL HELPER — updates CSS custom property so the track shows
        // a filled left-side gradient matching the thumb position.
        // ----------------------------------------------------------------------
        function updateSliderFill(slider) {
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            const val = parseFloat(slider.value);
            const pct = ((val - min) / (max - min)) * 100;
            slider.style.setProperty('--fill', `${pct}%`);
        }

        // Sliders & Controls
        const frpSlider = document.getElementById('frpSlider');
        if (frpSlider) {
            updateSliderFill(frpSlider); // init
            frpSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                appState.filters.minFrp = val;
                document.getElementById('frpSliderVal').textContent = `${val} MW`;
                updateSliderFill(e.target);
                applyFilters();
            });
        }

        const confSlider = document.getElementById('confSlider');
        if (confSlider) {
            updateSliderFill(confSlider); // init
            confSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                appState.filters.minConfidence = val;
                document.getElementById('confSliderVal').textContent = `${Math.round(val * 100)}%`;
                updateSliderFill(e.target);
                applyFilters();
            });
        }

        document.getElementById('chkIndustrialOnly')?.addEventListener('change', (e) => {
            appState.filters.industrialOnly = e.target.checked;
            applyFilters();
        });

        document.getElementById('selectRecurrence')?.addEventListener('change', (e) => {
            appState.filters.recurrence = e.target.value;
            applyFilters();
        });

        document.getElementById('btnResetFilters')?.addEventListener('click', () => {
            appState.filters = { search: '', classification: 'ALL', minFrp: 0, minConfidence: 0.5, industrialOnly: false, recurrence: 'all' };
            if (searchInput) searchInput.value = '';
            if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
            if (frpSlider) { frpSlider.value = 0; updateSliderFill(frpSlider); }
            document.getElementById('frpSliderVal').textContent = '0 MW';
            if (confSlider) { confSlider.value = 0.5; updateSliderFill(confSlider); }
            document.getElementById('confSliderVal').textContent = '50%';
            document.getElementById('chkIndustrialOnly').checked = false;
            document.getElementById('selectRecurrence').value = 'all';
            document.querySelectorAll('#classFilterGroup .pill-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#classFilterGroup [data-class="ALL"]')?.classList.add('active');
            applyFilters();
            showToast('Filters reset', 'info');
        });

        // Basemap Switcher
        document.querySelectorAll('.tile-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tileType = btn.getAttribute('data-tile');

                if (tileLayers[appState.activeTileLayer] && map) {
                    map.removeLayer(tileLayers[appState.activeTileLayer]);
                }
                appState.activeTileLayer = tileType;
                if (tileLayers[tileType] && map) {
                    tileLayers[tileType].addTo(map);
                }
            });
        });

        // Overlay Switches
        document.getElementById('toggleIndustrialNodes')?.addEventListener('change', (e) => {
            appState.layers.industrialNodes = e.target.checked;
            renderIndustrialFacilities();
        });

        document.getElementById('toggleBufferRings')?.addEventListener('change', (e) => {
            appState.layers.bufferRings = e.target.checked;
            renderIndustrialFacilities();
        });

        document.getElementById('toggleFrpPulse')?.addEventListener('change', (e) => {
            appState.layers.frpPulse = e.target.checked;
            renderMapMarkers();
        });

        // Inspector Zoom & Copy GeoJSON
        document.getElementById('btnZoomToMap')?.addEventListener('click', () => {
            if (appState.selectedEventId) {
                const e = appState.events.find(ev => ev.event_id === appState.selectedEventId);
                if (e && map) {
                    document.getElementById('tabViewMap')?.click();
                    map.flyTo([e.latitude, e.longitude], 13, { duration: 1.0 });
                }
            }
        });

        document.getElementById('btnCopyGeoJson')?.addEventListener('click', () => {
            if (appState.selectedEventId) {
                const e = appState.events.find(ev => ev.event_id === appState.selectedEventId);
                if (e) {
                    const geojson = { type: "Feature", geometry: { type: "Point", coordinates: [e.longitude, e.latitude] }, properties: e };
                    navigator.clipboard.writeText(JSON.stringify(geojson, null, 2));
                    showToast('GeoJSON copied to clipboard!', 'success');
                }
            }
        });

        document.getElementById('btnExportData')?.addEventListener('click', () => exportToCSV(appState.filteredEvents));

        // Modal
        const simModal = document.getElementById('simulateModal');
        document.getElementById('btnSimulateModal')?.addEventListener('click', () => simModal?.classList.remove('hidden'));
        document.getElementById('btnCloseSimModal')?.addEventListener('click', () => simModal?.classList.add('hidden'));
        document.getElementById('btnCancelSim')?.addEventListener('click', () => simModal?.classList.add('hidden'));

        document.getElementById('simForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const lat = parseFloat(document.getElementById('simLat').value);
            const lon = parseFloat(document.getElementById('simLon').value);
            const frp = parseFloat(document.getElementById('simFrp').value);
            const bt = parseFloat(document.getElementById('simBt').value);
            const landCover = document.getElementById('simLandCover').value;
            const satellite = document.getElementById('simSatellite').value;

            runSimulationAttribution(lat, lon, frp, bt, landCover, satellite);
            simModal?.classList.add('hidden');
        });
    }

    function exportToCSV(events) {
        if (!events || events.length === 0) return;
        const headers = ["event_id", "classification", "prediction_probability", "latitude", "longitude", "frp", "nearest_facility", "distance_km", "hotspots_30d", "land_cover"];
        const rows = events.map(e => [
            e.event_id, e.classification, e.prediction_probability, e.latitude, e.longitude, e.frp,
            `"${e.nearest_industrial_facility || ''}"`, e.industrial_distance_km, e.hotspot_count_30d, `"${e.land_cover || ''}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `ThermaSight_Export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Exported ${events.length} events to CSV!`, 'success');
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}" style="width:14px;height:14px;"></i><span>${message}</span>`;
        container.appendChild(toast);
        initLucideIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.2s ease';
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    }

})();
