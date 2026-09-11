/* ==========================================================================
   ThermaSight AI - Reference Design UI Logic
   Screen 1 (Map Explorer) & Screen 2 (Event Detail Multi-Tab Inspector)
   - Overview
   - Temporal Behaviour (Dual-axis Timeline, Diurnal Matrix, Day/Night Donut)
   - Nearby Facilities (Satellite Buffer Map with Concentric Rings, Asset Lists)
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

    // Nearby facilities dataset for reference detail view
    const NEARBY_FACILITIES_DATA = [
        { name: "Gujarat Refinery", type: "Petroleum Refinery", dist: "0.22 km", icon: "factory", latOffset: 0.002, lonOffset: -0.001 },
        { name: "Reliance Petrochemicals", type: "Chemical Plant", dist: "1.4 km", icon: "flask-conical", latOffset: -0.009, lonOffset: 0.008 },
        { name: "Essar Oil Terminal", type: "Oil Terminal", dist: "2.8 km", icon: "container", latOffset: 0.018, lonOffset: -0.015 },
        { name: "Mundra Industrial Area", type: "Industrial Zone", dist: "3.6 km", icon: "warehouse", latOffset: -0.024, lonOffset: -0.022 },
        { name: "Adani Port Complex", type: "Port / Industrial", dist: "4.9 km", icon: "anchor", latOffset: 0.035, lonOffset: 0.028 }
    ];

    // Nearby quarries dataset for reference detail view
    const NEARBY_QUARRIES_DATA = [
        { name: "Kutch Quarry", type: "Stone Quarry", dist: "5.8 km", icon: "mountain", latOffset: -0.042, lonOffset: -0.038 },
        { name: "Banni Mining Area", type: "Limestone Quarry", dist: "7.2 km", icon: "pickaxe", latOffset: 0.052, lonOffset: -0.048 },
        { name: "Rapar Quarry", type: "Stone Quarry", dist: "9.1 km", icon: "mountain", latOffset: -0.065, lonOffset: 0.058 }
    ];

    // Standalone Mock Dataset matching reference design
    const MOCK_EVENTS = [
        {
            "event_id": "FIRMS-IND-2025-001",
            "latitude": 22.3087,
            "longitude": 73.1826,
            "acq_date": "12 May 2025",
            "acq_time": "13:30",
            "satellite": "VIIRS_SNPP",
            "frp": 64.2,
            "brightness_temperature": 358.4,
            "confidence": "high",
            "daynight": "N",
            "classification": "INDUSTRIAL",
            "prediction_probability": 0.942,
            "risk_level": "High Risk",
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Gujarat Refinery",
            "facility_full": "Gujarat Refinery Petrochemical Complex",
            "region": "Gujarat, Western India",
            "industrial_distance_km": 0.22,
            "industrial_nearby": true,
            "hotspot_count_7d": 5,
            "hotspot_count_30d": 24,
            "hotspot_count_90d": 71,
            "land_cover": "Built-up / Industrial",
            "reasons": [
                "Within 300 m of industrial facility",
                "High temporal persistence (24 detections in 30 days)",
                "Elevated FRP thermal signature (64.2 MW)",
                "Located in built-up / industrial area"
            ]
        },
        {
            "event_id": "FIRMS-IND-2025-002",
            "latitude": 22.4717,
            "longitude": 69.8388,
            "acq_date": "12 May 2025",
            "acq_time": "11:20",
            "satellite": "VIIRS_SNPP",
            "frp": 52.6,
            "brightness_temperature": 348.1,
            "confidence": "high",
            "daynight": "D",
            "classification": "INDUSTRIAL",
            "prediction_probability": 0.895,
            "risk_level": "Medium Risk",
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Near Industrial Area",
            "facility_full": "Jamnagar Petroleum Refinery (RIL)",
            "region": "Jamnagar, Gujarat",
            "industrial_distance_km": 1.1,
            "industrial_nearby": true,
            "hotspot_count_7d": 4,
            "hotspot_count_30d": 16,
            "hotspot_count_90d": 45,
            "land_cover": "Industrial Buffer Zone",
            "reasons": [
                "Within 1.1 km of mega refinery complex",
                "Moderate temporal recurrence (16 detections in 30 days)",
                "Stable elevated thermal signature",
                "Proximity to petrochemical processing units"
            ]
        },
        {
            "event_id": "FIRMS-NAT-2025-003",
            "latitude": 30.0668,
            "longitude": 79.0193,
            "acq_date": "12 May 2025",
            "acq_time": "09:15",
            "satellite": "VIIRS_SNPP",
            "frp": 14.2,
            "brightness_temperature": 322.1,
            "confidence": "nominal",
            "daynight": "D",
            "classification": "NATURAL",
            "prediction_probability": 0.965,
            "risk_level": "Low Risk",
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Garhwal Hydro Station",
            "facility_full": "Garhwal Hydro Station",
            "region": "Garhwal Himalayas, Uttarakhand",
            "industrial_distance_km": 14.85,
            "industrial_nearby": false,
            "hotspot_count_7d": 1,
            "hotspot_count_30d": 2,
            "hotspot_count_90d": 3,
            "land_cover": "Forest Area",
            "reasons": [
                "No industrial infrastructure within 5 km (nearest 14.85 km)",
                "Transient wildfire signature with low persistence",
                "High NDVI dense tree cover classification",
                "Nominal FRP radiative output"
            ]
        },
        {
            "event_id": "FIRMS-IND-2025-004",
            "latitude": 20.8908,
            "longitude": 85.1538,
            "acq_date": "12 May 2025",
            "acq_time": "08:40",
            "satellite": "VIIRS_SNPP",
            "frp": 48.0,
            "brightness_temperature": 342.5,
            "confidence": "high",
            "daynight": "D",
            "classification": "INDUSTRIAL",
            "prediction_probability": 0.880,
            "risk_level": "Medium Risk",
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Quarry Region",
            "facility_full": "Angul Steel & Thermal Power Hub",
            "region": "Angul, Odisha",
            "industrial_distance_km": 0.8,
            "industrial_nearby": true,
            "hotspot_count_7d": 3,
            "hotspot_count_30d": 14,
            "hotspot_count_90d": 38,
            "land_cover": "Mining & Industrial Zone",
            "reasons": [
                "Within 800 m of heavy metallurgical steel works",
                "Consistent cluster detections over 30 days",
                "High radiative flux in slag cooling area",
                "Confirmed active industrial zoning"
            ]
        },
        {
            "event_id": "FIRMS-NAT-2025-005",
            "latitude": 30.9010,
            "longitude": 75.8573,
            "acq_date": "12 May 2025",
            "acq_time": "07:15",
            "satellite": "VIIRS_SNPP",
            "frp": 22.1,
            "brightness_temperature": 331.0,
            "confidence": "nominal",
            "daynight": "D",
            "classification": "NATURAL",
            "prediction_probability": 0.912,
            "risk_level": "Low Risk",
            "model_version": "xgboost_v1_prototype",
            "nearest_industrial_facility": "Ludhiana Textile Zone",
            "facility_full": "Ludhiana Textile Industrial Area",
            "region": "Punjab Agrarian Basin",
            "industrial_distance_km": 8.12,
            "industrial_nearby": false,
            "hotspot_count_7d": 2,
            "hotspot_count_30d": 3,
            "hotspot_count_90d": 4,
            "land_cover": "Cropland / Agrarian",
            "reasons": [
                "Seasonal crop residue burning profile",
                "Greater than 8 km from industrial facility",
                "Non-persistent short-duration thermal flare",
                "Open agricultural parcel land cover"
            ]
        }
    ];

    let appState = {
        events: [],
        filteredEvents: [],
        stats: null,
        selectedEventId: null,
        activeScreen: 'map', // 'map', 'detail', 'analytics', 'data'
        activeDetailTab: 'overview', // 'overview', 'temporal', 'nearby', 'data'
        activeTileLayer: 'street',
        detailTileLayer: 'street',
        filters: {
            search: '',
            classification: 'ALL'
        },
        currentSort: 'risk', // 'risk', 'frp', 'distance'
        alerts: [],
        selectedAlertId: 'FIRMS-IND-2025-001',
        alertsFilters: {
            status: 'active', // 'active', 'acknowledged', 'resolved'
            risk: 'ALL',      // 'ALL', 'High', 'Medium', 'Low'
            search: '',
            type: 'ALL',
            source: 'ALL',
            state: 'ALL',
            sort: 'latest'
        }
    };

    let mainMap = null;
    let detailMap = null;
    let nearbyBufferMap = null;
    let mainTileLayers = {};
    let detailTileLayers = {};
    let nearbyTileLayers = {};
    let mainMarkersLayer = null;
    let mainFacilitiesLayer = null;
    let detailMarkerLayer = null;
    let alertInspectorMarkerLayer = null;
    let charts = {};

    // ----------------------------------------------------------------------
    // 2. INITIALIZATION
    // ----------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        initLucideIcons();
        initSidebarCollapse();
        initMainMap();
        initEventListeners();
        initAlertsData();
        initAlertsEventListeners();
        initTheme();
        loadDashboardData();
    });

    function initLucideIcons() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // ----------------------------------------------------------------------
    // 2.1 SIDEBAR MINIMIZE / COLLAPSE CONTROLLER
    // ----------------------------------------------------------------------
    function initSidebarCollapse() {
        const sidebar = document.getElementById('appSidebar');
        const toggleBtn = document.getElementById('btnToggleSidebar');
        const themeToggle = document.querySelector('.sidebar-theme-toggle');
        const isCollapsed = localStorage.getItem('thermasight_sidebar_collapsed') === 'true';

        if (sidebar && isCollapsed) {
            setSidebarCollapsed(true, false);
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const willCollapse = !sidebar.classList.contains('collapsed');
                setSidebarCollapsed(willCollapse, true);
            });
        }

        // Allow clicking theme toggle in collapsed mode to switch themes
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                if (sidebar && sidebar.classList.contains('collapsed')) {
                    const checkbox = document.getElementById('themeToggleCheckbox');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                }
            });
        }

        // Keyboard shortcut: Ctrl + B / Cmd + B
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                const target = e.target;
                if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                    return;
                }
                e.preventDefault();
                if (sidebar) {
                    const willCollapse = !sidebar.classList.contains('collapsed');
                    setSidebarCollapsed(willCollapse, true);
                }
            }
        });
    }

    function setSidebarCollapsed(collapsed, notify = false) {
        const sidebar = document.getElementById('appSidebar');
        const toggleBtn = document.getElementById('btnToggleSidebar');
        if (!sidebar) return;

        if (collapsed) {
            sidebar.classList.add('collapsed');
            if (toggleBtn) {
                toggleBtn.setAttribute('title', 'Expand sidebar (Ctrl+B)');
                toggleBtn.innerHTML = '<i data-lucide="panel-left-open" class="w-4 h-4"></i>';
            }
            localStorage.setItem('thermasight_sidebar_collapsed', 'true');
            if (notify) showToast('Sidebar minimized (Press Ctrl+B to expand)', 'info');
        } else {
            sidebar.classList.remove('collapsed');
            if (toggleBtn) {
                toggleBtn.setAttribute('title', 'Collapse sidebar (Ctrl+B)');
                toggleBtn.innerHTML = '<i data-lucide="panel-left-close" class="w-4 h-4"></i>';
            }
            localStorage.setItem('thermasight_sidebar_collapsed', 'false');
        }

        initLucideIcons();

        // Invalidate map sizes after transition completes so maps smoothly fill full width
        setTimeout(() => {
            if (mainMap) mainMap.invalidateSize();
            if (detailMap) detailMap.invalidateSize();
            if (nearbyBufferMap) nearbyBufferMap.invalidateSize();
            if (alertInspectorMap) alertInspectorMap.invalidateSize();
            window.dispatchEvent(new Event('resize'));
        }, 240);
    }

    // ----------------------------------------------------------------------
    // 3. MAIN MAP (LEAFLET)
    // ----------------------------------------------------------------------
    function initMainMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        mainMap = L.map('map', {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true
        });

        // 100% Free OpenStreetMap Standard Street Basemap (No API key required, no watermarks, no hover notices)
        mainTileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c'],
            maxZoom: 19
        });

        // Dark Matter Basemap
        mainTileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19
        });

        // Satellite Basemap
        mainTileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 18
        });

        mainTileLayers.street.addTo(mainMap);

        mainMarkersLayer = L.layerGroup().addTo(mainMap);
        mainFacilitiesLayer = L.layerGroup().addTo(mainMap);

        renderIndustrialFacilities();

        setTimeout(() => {
            if (mainMap) mainMap.invalidateSize();
        }, 150);
    }

    function renderIndustrialFacilities() {
        if (!mainFacilitiesLayer) return;
        mainFacilitiesLayer.clearLayers();

        KNOWN_INDUSTRIAL_HUBS.forEach((hub) => {
            const iconHtml = `
                <div style="background:#0b132b; border:1.8px solid #ffffff; border-radius:6px; width:22px; height:22px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.35);">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.2">
                        <path d="M2 20V8l6 4V8l6 4V4l8-2v18H2Z"/>
                    </svg>
                </div>
            `;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'facility-marker',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });

            const marker = L.marker([hub.lat, hub.lon], { icon: customIcon });
            marker.bindTooltip(`<strong>${hub.name}</strong><br><span style="font-size:10px; color:#64748b;">${hub.type}</span>`, {
                direction: 'top',
                offset: [0, -12]
            });
            mainFacilitiesLayer.addLayer(marker);
        });
    }

    // ----------------------------------------------------------------------
    // 4. DATA LOADING & FILTERING
    // ----------------------------------------------------------------------
    async function loadDashboardData() {
        try {
            const resp = await fetch(`${API_BASE_URL}/events`).catch(() => null);
            if (resp && resp.ok) {
                const backendEvents = await resp.json();
                appState.events = backendEvents.length > 0 ? backendEvents : MOCK_EVENTS;
            } else {
                appState.events = MOCK_EVENTS;
            }
        } catch (e) {
            appState.events = MOCK_EVENTS;
        }

        appState.events.forEach(e => {
            if (!e.risk_level) {
                if (e.classification === 'INDUSTRIAL' && e.frp >= 40) e.risk_level = 'High Risk';
                else if (e.classification === 'INDUSTRIAL' || e.frp >= 30) e.risk_level = 'Medium Risk';
                else e.risk_level = 'Low Risk';
            }
            if (!e.facility_full) e.facility_full = e.nearest_industrial_facility || 'Industrial Facility';
            if (!e.region) e.region = 'India National Territory';
        });

        applyFilters();

        if (appState.filteredEvents.length > 0 && !appState.selectedEventId) {
            selectEvent(appState.filteredEvents[0].event_id, false);
        }
    }

    function applyFilters() {
        const { search, classification } = appState.filters;

        appState.filteredEvents = appState.events.filter(e => {
            if (search) {
                const q = search.toLowerCase();
                const mId = e.event_id.toLowerCase().includes(q);
                const mFac = (e.nearest_industrial_facility || '').toLowerCase().includes(q);
                const mLand = (e.land_cover || '').toLowerCase().includes(q);
                if (!mId && !mFac && !mLand) return false;
            }
            if (classification !== 'ALL' && e.classification !== classification) {
                return false;
            }
            return true;
        });

        // Apply sorting based on currentSort state
        if (appState.currentSort === 'frp') {
            appState.filteredEvents.sort((a, b) => b.frp - a.frp);
        } else if (appState.currentSort === 'distance') {
            appState.filteredEvents.sort((a, b) => a.industrial_distance_km - b.industrial_distance_km);
        } else {
            const riskOrder = { 'High Risk': 3, 'Medium Risk': 2, 'Low Risk': 1 };
            appState.filteredEvents.sort((a, b) => (riskOrder[b.risk_level] || 0) - (riskOrder[a.risk_level] || 0));
        }

        renderMainMarkers();
        renderEventsDrawer();
        renderTable();
        renderAnalyticsCharts();

        const countHeader = document.getElementById('eventsCountHeader');
        if (countHeader) countHeader.textContent = appState.filteredEvents.length.toLocaleString();
    }

    function renderMainMarkers() {
        if (!mainMarkersLayer) return;
        mainMarkersLayer.clearLayers();

        appState.filteredEvents.forEach(event => {
            const isSelected = event.event_id === appState.selectedEventId;
            let color = '#10b981';
            if (event.risk_level === 'High Risk') color = '#ef4444';
            else if (event.risk_level === 'Medium Risk') color = '#f97316';

            const size = isSelected ? 18 : 12;
            const beaconHtml = isSelected ? `<div class="pin-focal-beacon" style="border-color:${color}; box-shadow:0 0 12px ${color};"></div>` : '';

            const iconHtml = `
                <div class="pin-marker-container ${isSelected ? 'pin-selected' : ''}" style="width:${size}px; height:${size}px;">
                    ${beaconHtml}
                    <div style="width:${size}px; height:${size}px; border-radius:50%; background:${color}; border:2.5px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
                </div>
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'custom-risk-dot',
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2]
            });

            const marker = L.marker([event.latitude, event.longitude], {
                icon: icon,
                zIndexOffset: isSelected ? 1200 : 0
            });
            marker._eventId = event.event_id;

            marker.bindTooltip(`
                <div style="font-weight:700; color:${color}; font-size:11px;">${event.risk_level} &bull; ${event.event_id}</div>
                <div style="font-size:11px; color:#334155; margin-top:2px;">${event.nearest_industrial_facility || event.land_cover}</div>
                <div style="font-size:10px; color:#64748b;">${event.frp} MW FRP &bull; ${event.acq_date}</div>
            `, { direction: 'top', offset: [0, -10] });

            marker.on('click', () => {
                selectEvent(event.event_id, true);
                showEventDetail(event.event_id);
            });

            mainMarkersLayer.addLayer(marker);
        });
    }

    function renderEventsDrawer() {
        const container = document.getElementById('eventsListContainer');
        if (!container) return;

        if (appState.filteredEvents.length === 0) {
            container.innerHTML = `<div class="text-center p-6 text-slate-400 text-xs">No thermal anomalies match current filter criteria.</div>`;
            return;
        }

        container.innerHTML = appState.filteredEvents.map(event => {
            const isSelected = event.event_id === appState.selectedEventId ? 'selected' : '';
            let riskClass = 'low';
            if (event.risk_level === 'High Risk') riskClass = 'high';
            else if (event.risk_level === 'Medium Risk') riskClass = 'medium';

            const flareColor = riskClass === 'high' ? '#ff3b30' : (riskClass === 'medium' ? '#ff9500' : '#34c759');

            return `
                <div class="event-card-item ${isSelected}" data-id="${event.event_id}">
                    <div class="event-thumb-crop">
                        <svg width="48" height="48" viewBox="0 0 48 48">
                            <rect width="48" height="48" fill="#182234"/>
                            <path d="M4 14h40M4 28h40M16 4v40M32 4v40" stroke="#25354e" stroke-width="1.2"/>
                            <circle cx="24" cy="24" r="9" fill="${flareColor}" opacity="0.35"/>
                            <circle cx="24" cy="24" r="5" fill="${flareColor}" opacity="0.85"/>
                            <circle cx="24" cy="24" r="2" fill="#ffffff"/>
                        </svg>
                    </div>

                    <div class="event-card-info">
                        <div class="event-card-title-row">
                            <span class="event-card-id">${event.event_id}</span>
                            <span class="risk-badge ${riskClass}">${event.risk_level}</span>
                        </div>
                        <div class="event-card-sub" title="${event.nearest_industrial_facility || event.land_cover}">
                            ${event.nearest_industrial_facility || event.land_cover} (${event.industrial_distance_km} km)
                        </div>
                        <div class="event-card-time">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            <span>${event.acq_date}, ${event.acq_time} UTC</span>
                        </div>
                    </div>

                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-400 shrink-0"></i>
                </div>
            `;
        }).join('');

        initLucideIcons();

        container.querySelectorAll('.event-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                selectEvent(id, true);
                showEventDetail(id);
            });
        });
    }

    // ----------------------------------------------------------------------
    // 5. EVENT SELECTION & MULTI-TAB DISPATCHER
    // ----------------------------------------------------------------------
    function selectEvent(eventId, flyMainMap = false) {
        appState.selectedEventId = eventId;
        const event = appState.events.find(e => e.event_id === eventId);
        if (!event) return;

        document.querySelectorAll('.event-card-item').forEach(c => {
            if (c.getAttribute('data-id') === eventId) c.classList.add('selected');
            else c.classList.remove('selected');
        });

        renderMainMarkers();

        if (flyMainMap && mainMap) {
            mainMap.flyTo([event.latitude, event.longitude], 12, { duration: 1.2 });
        }

        populateOverviewTab(event);
        populateTemporalTab(event);
        populateNearbyTab(event);
    }

    // ----------------------------------------------------------------------
    // 6. TAB 1: OVERVIEW POPULATION
    // ----------------------------------------------------------------------
    function populateOverviewTab(event) {
        const detEventId = document.getElementById('detEventId');
        const detRiskBadge = document.getElementById('detRiskBadge');
        const detPersistentTag = document.getElementById('detPersistentTag');
        const detFacilitySub = document.getElementById('detFacilitySubtitle');
        const detTimeSub = document.getElementById('detTimestampSubtitle');

        if (detEventId) detEventId.textContent = event.event_id;
        if (detRiskBadge) {
            detRiskBadge.textContent = event.risk_level;
            detRiskBadge.className = `risk-badge ${event.risk_level === 'High Risk' ? 'high' : (event.risk_level === 'Medium Risk' ? 'medium' : 'low')}`;
        }
        if (detPersistentTag) {
            detPersistentTag.textContent = event.classification === 'INDUSTRIAL' ? 'Industrial / Persistent' : 'Natural / Transient';
        }
        if (detFacilitySub) detFacilitySub.textContent = `${event.nearest_industrial_facility || event.land_cover} (${event.industrial_distance_km} km)`;
        if (detTimeSub) detTimeSub.textContent = `${event.acq_date}, ${event.acq_time} UTC`;

        document.getElementById('detFrpMetric').textContent = event.frp.toFixed(1);
        document.getElementById('detDetectionsMetric').textContent = event.hotspot_count_30d;
        document.getElementById('detConfidenceMetric').textContent = `${Math.round(event.prediction_probability * 100)}%`;
        document.getElementById('detDistanceMetric').textContent = `${event.industrial_distance_km} km`;

        const reasonsContainer = document.getElementById('detFlagReasonsList');
        if (reasonsContainer) {
            const reasons = event.reasons && event.reasons.length > 0 ? event.reasons : [
                `Proximity: ${event.industrial_distance_km} km to nearest facility`,
                `Temporal recurrence: ${event.hotspot_count_30d} detections in 30 days`,
                `FRP Radiative Intensity: ${event.frp} MW`,
                `Zoned land cover: ${event.land_cover}`
            ];

            const iconMap = ['factory', 'repeat', 'flame', 'building'];
            reasonsContainer.innerHTML = reasons.map((r, i) => `
                <div class="flag-reason-row">
                    <div class="flag-icon-dot bg-orange-50 text-orange-600 border border-orange-100">
                        <i data-lucide="${iconMap[i % iconMap.length]}" class="w-3.5 h-3.5"></i>
                    </div>
                    <span>${r}</span>
                </div>
            `).join('');
            initLucideIcons();
        }

        const callout = document.getElementById('detCalloutText');
        if (callout) {
            callout.textContent = event.classification === 'INDUSTRIAL'
                ? "This source shows persistent thermal activity in close proximity to an industrial facility. Analyst verification recommended."
                : "This source indicates a non-persistent natural wildfire or crop burn event located outside industrial buffer zones.";
        }

        document.getElementById('detCoordsText').textContent = `${event.latitude.toFixed(4)}° N, ${event.longitude.toFixed(4)}° E`;
        document.getElementById('detFacilityNameText').textContent = event.nearest_industrial_facility || 'None in 5km';
        document.getElementById('detFacilityDistText').textContent = `${event.industrial_distance_km} km`;
        document.getElementById('detRegionText').textContent = event.region || 'Western India';

        updateDetailMap(event);
    }

    function updateDetailMap(event) {
        const detailContainer = document.getElementById('detailMap');
        if (!detailContainer) return;

        if (!detailMap) {
            detailMap = L.map('detailMap', {
                center: [event.latitude, event.longitude],
                zoom: 15,
                zoomControl: false,
                dragging: true,
                scrollWheelZoom: true,
                attributionControl: false
            });

            detailTileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { subdomains: ['a', 'b', 'c'], maxZoom: 19 });
            detailTileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 });

            // Street View as default
            detailTileLayers.street.addTo(detailMap);
            L.control.zoom({ position: 'bottomright' }).addTo(detailMap);
            L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(detailMap);
        } else {
            detailMap.setView([event.latitude, event.longitude], 15);
        }

        // Stick pulsing marker to exact coordinates on the detail map
        if (!detailMarkerLayer) {
            detailMarkerLayer = L.layerGroup().addTo(detailMap);
        }
        detailMarkerLayer.clearLayers();

        let color = '#10b981';
        if (event.risk_level === 'High Risk') color = '#ef4444';
        else if (event.risk_level === 'Medium Risk') color = '#f97316';

        const iconHtml = `
            <div class="pin-marker-container pin-selected" style="width:20px; height:20px;">
                <div class="pin-focal-beacon" style="border-color:${color}; box-shadow:0 0 14px ${color};"></div>
                <div style="width:20px; height:20px; border-radius:50%; background:${color}; border:2.5px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
            </div>
        `;
        const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-risk-dot',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });

        const marker = L.marker([event.latitude, event.longitude], { icon: customIcon });
        marker.bindTooltip(`
            <div style="font-weight:700; color:${color}; font-size:11px;">${event.risk_level} &bull; ${event.event_id}</div>
            <div style="font-size:11px; color:#334155; margin-top:2px;">${event.nearest_industrial_facility || event.land_cover}</div>
            <div style="font-size:10px; color:#64748b;">${event.frp} MW FRP &bull; ${event.acq_date}</div>
        `, { direction: 'top', offset: [0, -10] });

        detailMarkerLayer.addLayer(marker);

        setTimeout(() => {
            if (detailMap) detailMap.invalidateSize();
        }, 120);
    }

    // ----------------------------------------------------------------------
    // 7. TAB 2: TEMPORAL BEHAVIOUR POPULATION & CHARTS
    // ----------------------------------------------------------------------
    function populateTemporalTab(event) {
        // Header
        const tId = document.getElementById('temporalEventId');
        const tBadge = document.getElementById('temporalRiskBadge');
        const tFac = document.getElementById('temporalFacilitySub');
        const tTime = document.getElementById('temporalTimeSub');

        if (tId) tId.textContent = event.event_id;
        if (tBadge) {
            tBadge.textContent = event.risk_level;
            tBadge.className = `risk-badge ${event.risk_level === 'High Risk' ? 'high' : (event.risk_level === 'Medium Risk' ? 'medium' : 'low')}`;
        }
        if (tFac) tFac.textContent = `${event.nearest_industrial_facility || event.land_cover} (${event.industrial_distance_km} km)`;
        if (tTime) tTime.textContent = `${event.acq_date}, ${event.acq_time} UTC`;

        // KPIs
        document.getElementById('kpiTemporalTotal').textContent = event.hotspot_count_30d;
        document.getElementById('kpiTemporalMean').innerHTML = `${event.frp.toFixed(1)} <span class="text-xs font-normal text-slate-500">MW</span>`;
        document.getElementById('kpiTemporalMax').innerHTML = `${(event.frp * 1.58).toFixed(1)} <span class="text-xs font-normal text-slate-500">MW</span>`;
        document.getElementById('kpiTemporalPersist').innerHTML = `${event.hotspot_count_30d} <span class="text-xs font-normal text-slate-500">days</span>`;

        // Render Combo Timeline Chart
        renderTemporalTimelineChart(event);

        // Render Diurnal Matrix
        renderDiurnalMatrix(event);

        // Render Day/Night Donut
        renderDayNightDonut(event);
    }

    function renderTemporalTimelineChart(event) {
        const canvas = document.getElementById('chartTemporalTimeline');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Dynamic 30-day simulated curve matching the reference design
        const labels = ['12 Apr', '14 Apr', '16 Apr', '18 Apr', '20 Apr', '22 Apr', '24 Apr', '26 Apr', '28 Apr', '30 Apr', '02 May', '04 May', '06 May', '08 May', '10 May', '12 May'];
        const frpData = [12, 16, 28, 22, 34, 42, 41, 58, 62, 54, 82, 78, 98, 72, 81, event.frp];
        const detectionsData = [1, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 5, 7, 6];
        const nightDetections = [null, 18, null, 24, null, 40, null, 56, null, 50, null, 75, null, 70, null, 62];

        if (charts.temporalTimeline) charts.temporalTimeline.destroy();

        charts.temporalTimeline = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        type: 'line',
                        label: 'FRP (MW)',
                        data: frpData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2.2,
                        tension: 0.35,
                        pointBackgroundColor: '#ef4444',
                        pointRadius: 3,
                        yAxisID: 'y'
                    },
                    {
                        type: 'bar',
                        label: 'Detections',
                        data: detectionsData,
                        backgroundColor: 'rgba(249, 115, 22, 0.75)',
                        borderRadius: 3,
                        barThickness: 6,
                        yAxisID: 'y1'
                    },
                    {
                        type: 'scatter',
                        label: 'Night Detections',
                        data: nightDetections.map((v, i) => v !== null ? { x: labels[i], y: v } : null).filter(p => p !== null),
                        backgroundColor: '#6366f1',
                        borderColor: '#ffffff',
                        borderWidth: 1.5,
                        pointRadius: 4.5,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 }, color: '#64748b' }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'FRP (MW)', color: '#64748b', font: { size: 10 } },
                        ticks: { font: { size: 10 }, color: '#64748b' },
                        grid: { color: 'rgba(226, 232, 240, 0.6)' },
                        min: 0,
                        max: 120
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Number of Detections', color: '#64748b', font: { size: 10 } },
                        ticks: { font: { size: 10 }, color: '#64748b', stepSize: 2 },
                        grid: { drawOnChartArea: false },
                        min: 0,
                        max: 10
                    }
                }
            }
        });
    }

    function renderDiurnalMatrix() {
        const container = document.getElementById('diurnalMatrixContainer');
        if (!container) return;

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];

        let html = '<table class="diurnal-matrix-table"><tbody>';
        days.forEach(d => {
            html += `<tr><td style="width:26px; text-align:left; font-weight:600;">${d}</td>`;
            hours.forEach((h, hi) => {
                let lvl = 0;
                // High activity cluster during midday/flare cycles matching reference
                if (hi >= 5 && hi <= 8) lvl = Math.floor(Math.random() * 3) + 3;
                else if (hi >= 4 && hi <= 9) lvl = Math.floor(Math.random() * 2) + 1;
                else lvl = Math.random() > 0.7 ? 1 : 0;
                html += `<td><div class="diurnal-block lvl-${lvl}" title="${d} ${h}:00 - Activity Lvl ${lvl}"></div></td>`;
            });
            html += '</tr>';
        });
        html += '<tr><td></td>';
        hours.forEach(h => html += `<td style="font-size:8px; color:#94a3b8;">${h}</td>`);
        html += '</tr></tbody></table>';

        container.innerHTML = html;
    }

    function renderDayNightDonut(event) {
        const canvas = document.getElementById('chartDayNightDonut');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const dayCount = Math.round(event.hotspot_count_30d * 0.67);
        const nightCount = Math.max(event.hotspot_count_30d - dayCount, 1);

        document.getElementById('donutTotalText').textContent = event.hotspot_count_30d;
        document.getElementById('donutDayCount').textContent = `${dayCount} (67%)`;
        document.getElementById('donutNightCount').textContent = `${nightCount} (33%)`;

        if (charts.dayNightDonut) charts.dayNightDonut.destroy();

        charts.dayNightDonut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Day-time', 'Night-time'],
                datasets: [{
                    data: [dayCount, nightCount],
                    backgroundColor: ['#f59e0b', '#4f46e5'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // ----------------------------------------------------------------------
    // 8. TAB 3: NEARBY FACILITIES POPULATION & BUFFER MAP
    // ----------------------------------------------------------------------
    function populateNearbyTab(event) {
        const nId = document.getElementById('nearbyEventId');
        const nBadge = document.getElementById('nearbyRiskBadge');
        const nFac = document.getElementById('nearbyFacilitySub');
        const nTime = document.getElementById('nearbyTimeSub');

        if (nId) nId.textContent = event.event_id;
        if (nBadge) {
            nBadge.textContent = event.risk_level;
            nBadge.className = `risk-badge ${event.risk_level === 'High Risk' ? 'high' : (event.risk_level === 'Medium Risk' ? 'medium' : 'low')}`;
        }
        if (nFac) nFac.textContent = `${event.nearest_industrial_facility || event.land_cover} (${event.industrial_distance_km} km)`;
        if (nTime) nTime.textContent = `${event.acq_date}, ${event.acq_time} UTC`;

        document.getElementById('nearbyCardNearestDist').textContent = `${event.industrial_distance_km} km`;
        document.getElementById('nearbyCardNearestName').textContent = event.nearest_industrial_facility || 'Gujarat Refinery';

        // Render Satellite Buffer Map
        updateNearbyBufferMap(event);

        // Render Ranked Asset Lists
        renderRankedAssetLists(event);
    }

    function updateNearbyBufferMap(event) {
        const container = document.getElementById('nearbyBufferMap');
        if (!container) return;

        if (!nearbyBufferMap) {
            nearbyBufferMap = L.map('nearbyBufferMap', {
                center: [event.latitude, event.longitude],
                zoom: 12,
                zoomControl: false,
                attributionControl: false
            });

            nearbyTileLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                subdomains: ['a', 'b', 'c'],
                maxZoom: 19
            }).addTo(nearbyBufferMap);

            L.control.zoom({ position: 'topright' }).addTo(nearbyBufferMap);
        } else {
            nearbyBufferMap.setView([event.latitude, event.longitude], 12);
        }

        // Clear existing buffer layers if any
        if (nearbyBufferMap._bufferLayerGroup) {
            nearbyBufferMap.removeLayer(nearbyBufferMap._bufferLayerGroup);
        }

        const bufferGroup = L.layerGroup().addTo(nearbyBufferMap);
        nearbyBufferMap._bufferLayerGroup = bufferGroup;

        // Concentric Range Rings (1 km, 2 km, 5 km)
        [1000, 2000, 5000].forEach((r, idx) => {
            const circle = L.circle([event.latitude, event.longitude], {
                radius: r,
                color: '#22d3ee',
                weight: 1.6,
                dashArray: '6, 6',
                fillColor: '#22d3ee',
                fillOpacity: 0.04
            });
            bufferGroup.addLayer(circle);

            // Ring label
            const labelPos = [event.latitude + (r / 111320), event.longitude];
            const badge = L.marker(labelPos, {
                icon: L.divIcon({
                    html: `<span style="font-size:9px; color:#22d3ee; font-weight:700; background:rgba(11,19,43,0.7); padding:1px 4px; border-radius:3px;">${r / 1000} km</span>`,
                    className: 'ring-dist-label',
                    iconSize: [36, 14],
                    iconAnchor: [18, 7]
                }),
                interactive: false
            });
            bufferGroup.addLayer(badge);
        });

        // Focal Source Pin in Center with Radar Ping
        const focalIcon = L.divIcon({
            html: `
                <div style="position:relative; width:22px; height:22px;">
                    <div style="position:absolute; inset:-8px; border:2px solid #ef4444; border-radius:50%; animation:focalBeaconPing 1.8s infinite;"></div>
                    <div style="width:22px; height:22px; border-radius:50%; background:#ef4444; border:3px solid #ffffff; box-shadow:0 0 16px #ef4444;"></div>
                </div>
            `,
            className: 'focal-buffer-pin',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        const focalMarker = L.marker([event.latitude, event.longitude], { icon: focalIcon, zIndexOffset: 1000 });
        bufferGroup.addLayer(focalMarker);

        // Nearby Facility Pins
        NEARBY_FACILITIES_DATA.forEach(fac => {
            const facLat = event.latitude + fac.latOffset;
            const facLon = event.longitude + fac.lonOffset;
            const icon = L.divIcon({
                html: `
                    <div style="width:20px; height:20px; background:#0284c7; border:2px solid #ffffff; border-radius:4px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2"><path d="M2 20V8l6 4V8l6 4V4l8-2v18H2Z"/></svg>
                    </div>
                `,
                className: 'nearby-fac-pin',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            const m = L.marker([facLat, facLon], { icon: icon });
            m.bindTooltip(`<strong>${fac.name}</strong><br><span style="font-size:10px; color:#38bdf8;">${fac.dist}</span>`, { direction: 'top', offset: [0, -10] });
            bufferGroup.addLayer(m);
        });

        // Nearby Quarry Pins
        NEARBY_QUARRIES_DATA.forEach(q => {
            const qLat = event.latitude + q.latOffset;
            const qLon = event.longitude + q.lonOffset;
            const icon = L.divIcon({
                html: `
                    <div style="width:18px; height:18px; background:#d97706; border:2px solid #ffffff; border-radius:4px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.5);">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
                    </div>
                `,
                className: 'nearby-quarry-pin',
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });
            const m = L.marker([qLat, qLon], { icon: icon });
            m.bindTooltip(`<strong>${q.name}</strong><br><span style="font-size:10px; color:#f59e0b;">${q.dist}</span>`, { direction: 'top', offset: [0, -9] });
            bufferGroup.addLayer(m);
        });

        setTimeout(() => {
            if (nearbyBufferMap) nearbyBufferMap.invalidateSize();
        }, 120);
    }

    function renderRankedAssetLists() {
        const facList = document.getElementById('nearbyFacilitiesList');
        if (facList) {
            facList.innerHTML = NEARBY_FACILITIES_DATA.map((fac, idx) => `
                <div class="asset-item-row">
                    <span class="asset-rank-num">${idx + 1}</span>
                    <div class="asset-icon-box bg-blue-100 text-blue-600">
                        <i data-lucide="${fac.icon}" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="asset-info">
                        <div class="asset-name" title="${fac.name}">${fac.name}</div>
                        <div class="asset-type">${fac.type}</div>
                    </div>
                    <span class="asset-distance-pill dist-industrial">${fac.dist}</span>
                </div>
            `).join('');
        }

        const qList = document.getElementById('nearbyQuarriesList');
        if (qList) {
            qList.innerHTML = NEARBY_QUARRIES_DATA.map((q, idx) => `
                <div class="asset-item-row">
                    <span class="asset-rank-num">${idx + 1}</span>
                    <div class="asset-icon-box bg-amber-100 text-amber-600">
                        <i data-lucide="${q.icon}" class="w-3.5 h-3.5"></i>
                    </div>
                    <div class="asset-info">
                        <div class="asset-name" title="${q.name}">${q.name}</div>
                        <div class="asset-type">${q.type}</div>
                    </div>
                    <span class="asset-distance-pill dist-quarry">${q.dist}</span>
                </div>
            `).join('');
        }

        initLucideIcons();
    }

    // ----------------------------------------------------------------------
    // 9. SCREEN & DETAIL TAB SWITCHER
    // ----------------------------------------------------------------------
    function showScreen(screenId) {
        document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');

        // Toggle Sidebar menus between Explorer and Detail modes
        const mainNav = document.getElementById('mainNavList');
        const detailNav = document.getElementById('detailNavList');

        if (screenId === 'screenDetail') {
            if (mainNav) mainNav.classList.add('hidden');
            if (detailNav) detailNav.classList.remove('hidden');
        } else {
            if (mainNav) mainNav.classList.remove('hidden');
            if (detailNav) detailNav.classList.add('hidden');
        }
        if (screenId === 'screenMap') {
            setTimeout(() => { if (mainMap) mainMap.invalidateSize(); }, 100);
        } else if (screenId === 'screenDetail') {
            switchDetailTab(appState.activeDetailTab || 'overview');
        } else if (screenId === 'screenAnalytics') {
            renderAnalyticsCharts();
        } else if (screenId === 'screenAlerts') {
            renderAlertsView();
        }
    }

    function switchDetailTab(tabId) {
        appState.activeDetailTab = tabId;

        // Sync tab strip in Overview
        document.querySelectorAll('.detail-tab-item').forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) tab.classList.add('active');
            else tab.classList.remove('active');
        });

        // Sync left sidebar sub-navigation
        document.querySelectorAll('#detailNavList .sidebar-nav-item').forEach(item => {
            if (item.getAttribute('data-tab') === tabId) item.classList.add('active');
            else item.classList.remove('active');
        });

        // Hide all detail tab contents
        document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));

        const event = appState.events.find(e => e.event_id === appState.selectedEventId);

        if (tabId === 'temporal') {
            const target = document.getElementById('tabContentTemporal');
            if (target) target.classList.add('active');
            if (event) populateTemporalTab(event);
        } else if (tabId === 'nearby') {
            const target = document.getElementById('tabContentNearby');
            if (target) target.classList.add('active');
            if (event) populateNearbyTab(event);
            setTimeout(() => { if (nearbyBufferMap) nearbyBufferMap.invalidateSize(); }, 120);
        } else if (tabId === 'data') {
            showScreen('screenData');
        } else {
            // Overview default
            const target = document.getElementById('tabContentOverview');
            if (target) target.classList.add('active');
            if (event) populateOverviewTab(event);
            setTimeout(() => { if (detailMap) detailMap.invalidateSize(); }, 120);
        }
    }

    function showEventDetail(eventId) {
        selectEvent(eventId, false);
        showScreen('screenDetail');
    }

    function showMapExplorer() {
        showScreen('screenMap');
        document.querySelectorAll('#mainNavList .sidebar-nav-item').forEach(i => i.classList.remove('active'));
        document.getElementById('navMap')?.classList.add('active');
    }

    function navigateAdjacentEvent(direction) {
        if (!appState.filteredEvents || appState.filteredEvents.length === 0) return;
        const currentIndex = appState.filteredEvents.findIndex(e => e.event_id === appState.selectedEventId);
        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = appState.filteredEvents.length - 1;
        if (nextIndex >= appState.filteredEvents.length) nextIndex = 0;
        selectEvent(appState.filteredEvents[nextIndex].event_id, false);
    }

    // ----------------------------------------------------------------------
    // 10. EVENT LISTENERS
    // ----------------------------------------------------------------------
    function initEventListeners() {
        // Main Sidebar Navigation
        document.querySelectorAll('#mainNavList .sidebar-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('#mainNavList .sidebar-nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const view = item.getAttribute('data-view');
                if (view === 'map') showScreen('screenMap');
                else if (view === 'analytics') showScreen('screenAnalytics');
                else if (view === 'data') showScreen('screenData');
                else if (view === 'alerts') showScreen('screenAlerts');
                else {
                    showToast(`Switched to ${view.toUpperCase()} view.`, 'info');
                }
            });
        });

        // Detail Sidebar Sub-Navigation
        document.querySelectorAll('#detailNavList .sidebar-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (item.id === 'sidebarBackToMap') {
                    showMapExplorer();
                    return;
                }
                const tab = item.getAttribute('data-tab');
                if (tab) switchDetailTab(tab);
            });
        });

        // Detail Tab Strip Items
        document.querySelectorAll('.detail-tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                if (tabId) switchDetailTab(tabId);
            });
        });

        // Search Input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                appState.filters.search = e.target.value;
                applyFilters();
            });
        }

        // Category Filter Pills (In Events Subhead adjacent to events name)
        document.querySelectorAll('#classFilterGroup .filter-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#classFilterGroup .filter-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                appState.filters.classification = btn.getAttribute('data-class');
                applyFilters();
            });
        });

        // Sort by Dropdown Menu Controller
        const sortBtn = document.getElementById('sortDropdownBtn');
        const sortMenu = document.getElementById('sortDropdownMenu');
        const sortChevron = document.getElementById('sortChevron');

        if (sortBtn && sortMenu) {
            sortBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isClosed = sortMenu.classList.contains('hidden');
                if (isClosed) {
                    sortMenu.classList.remove('hidden');
                    sortChevron?.classList.add('rotate-180');
                } else {
                    sortMenu.classList.add('hidden');
                    sortChevron?.classList.remove('rotate-180');
                }
            });

            document.querySelectorAll('.sort-option-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const sortKey = item.getAttribute('data-sort');
                    const sortLabel = item.getAttribute('data-label') || 'Risk';

                    appState.currentSort = sortKey;
                    const labelEl = document.getElementById('sortLabel');
                    if (labelEl) labelEl.textContent = sortLabel;

                    // Update UI active state and checkmarks
                    document.querySelectorAll('.sort-option-item').forEach(i => {
                        i.classList.remove('active', 'font-semibold');
                        i.classList.add('font-medium', 'text-slate-600');
                        i.querySelector('.sort-check')?.classList.add('hidden');
                    });
                    item.classList.add('active', 'font-semibold');
                    item.classList.remove('font-medium', 'text-slate-600');
                    item.querySelector('.sort-check')?.classList.remove('hidden');

                    sortMenu.classList.add('hidden');
                    sortChevron?.classList.remove('rotate-180');

                    applyFilters();
                    showToast(`Sorted by ${sortLabel}`, 'info');
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!sortMenu.contains(e.target) && !sortBtn.contains(e.target)) {
                    sortMenu.classList.add('hidden');
                    sortChevron?.classList.remove('rotate-180');
                }
            });

            // Close on Escape
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !sortMenu.classList.contains('hidden')) {
                    sortMenu.classList.add('hidden');
                    sortChevron?.classList.remove('rotate-180');
                }
            });
        }

        // Drawer Layer Toggles
        document.getElementById('toggleThermalHotspots')?.addEventListener('change', (e) => {
            if (mainMap && mainMarkersLayer) {
                if (e.target.checked) {
                    mainMap.addLayer(mainMarkersLayer);
                } else {
                    mainMap.removeLayer(mainMarkersLayer);
                }
            }
        });

        document.getElementById('toggleIndustrialNodes')?.addEventListener('change', (e) => {
            if (mainMap && mainFacilitiesLayer) {
                if (e.target.checked) {
                    mainMap.addLayer(mainFacilitiesLayer);
                } else {
                    mainMap.removeLayer(mainFacilitiesLayer);
                }
            }
        });

        // Drawer Basemap Buttons
        document.getElementById('btnDrawerStreet')?.addEventListener('click', () => {
            document.getElementById('btnDrawerStreet')?.classList.add('active');
            document.getElementById('btnDrawerSat')?.classList.remove('active');
            if (appState.activeTileLayer !== 'street') {
                document.getElementById('btnToggleLayer')?.click();
            }
        });

        document.getElementById('btnDrawerSat')?.addEventListener('click', () => {
            document.getElementById('btnDrawerSat')?.classList.add('active');
            document.getElementById('btnDrawerStreet')?.classList.remove('active');
            if (appState.activeTileLayer !== 'satellite') {
                document.getElementById('btnToggleLayer')?.click();
            }
        });

        // Main Map Floating Controls
        document.getElementById('btnZoomIn')?.addEventListener('click', () => mainMap?.zoomIn());
        document.getElementById('btnZoomOut')?.addEventListener('click', () => mainMap?.zoomOut());
        document.getElementById('btnRecenter')?.addEventListener('click', () => mainMap?.setView(DEFAULT_CENTER, DEFAULT_ZOOM));
        document.getElementById('btnToggleLayer')?.addEventListener('click', () => {
            if (appState.activeTileLayer === 'street') {
                if (mainMap.hasLayer(mainTileLayers.street)) mainMap.removeLayer(mainTileLayers.street);
                if (mainMap.hasLayer(mainTileLayers.dark)) mainMap.removeLayer(mainTileLayers.dark);
                mainTileLayers.satellite.addTo(mainMap);
                appState.activeTileLayer = 'satellite';
                showToast('Switched to Satellite Imagery', 'info');
            } else {
                mainMap.removeLayer(mainTileLayers.satellite);
                mainTileLayers.street.addTo(mainMap);
                appState.activeTileLayer = 'street';
                showToast('Switched to Street Basemap', 'info');
            }
        });

        // Detail Navigation Controls
        document.getElementById('btnBackToMap')?.addEventListener('click', () => showMapExplorer());
        document.getElementById('btnPrevEvent')?.addEventListener('click', () => navigateAdjacentEvent(-1));
        document.getElementById('btnNextEvent')?.addEventListener('click', () => navigateAdjacentEvent(1));

        // Detail Satellite/Street Toggle
        document.getElementById('btnDetailSat')?.addEventListener('click', () => {
            document.getElementById('btnDetailSat').classList.add('active');
            document.getElementById('btnDetailStreet').classList.remove('active');
            if (detailMap) {
                detailMap.removeLayer(detailTileLayers.street);
                detailTileLayers.satellite.addTo(detailMap);
            }
        });
        document.getElementById('btnDetailStreet')?.addEventListener('click', () => {
            document.getElementById('btnDetailStreet').classList.add('active');
            document.getElementById('btnDetailSat').classList.remove('active');
            if (detailMap) {
                detailMap.removeLayer(detailTileLayers.satellite);
                detailTileLayers.street.addTo(detailMap);
            }
        });

        // Copy Coordinates
        document.getElementById('btnCopyCoords')?.addEventListener('click', () => {
            const text = document.getElementById('detCoordsText').textContent;
            navigator.clipboard.writeText(text).then(() => {
                showToast('Coordinates copied to clipboard!', 'success');
            });
        });

        // Action Buttons
        document.getElementById('btnWatchlist')?.addEventListener('click', () => {
            showToast(`Added ${appState.selectedEventId} to Active Analyst Watchlist`, 'success');
        });
        document.getElementById('btnExportReport')?.addEventListener('click', () => {
            showToast(`Generating PDF Compliance Report for ${appState.selectedEventId}...`, 'info');
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (mainMap) mainMap.invalidateSize();
            if (detailMap) detailMap.invalidateSize();
            if (nearbyBufferMap) nearbyBufferMap.invalidateSize();
        });
    }

    // ----------------------------------------------------------------------
    // 11. ANALYTICS CHARTS (Screen 3)
    // ----------------------------------------------------------------------
    function renderAnalyticsCharts() {
        const events = appState.filteredEvents.length > 0 ? appState.filteredEvents : appState.events;

        const pieCtx = document.getElementById('chartAttributionPie')?.getContext('2d');
        if (pieCtx) {
            const indCount = events.filter(e => e.classification === 'INDUSTRIAL').length;
            const natCount = events.filter(e => e.classification === 'NATURAL').length;

            if (charts.pie) charts.pie.destroy();
            charts.pie = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Industrial Flares', 'Natural Wildfires'],
                    datasets: [{ data: [indCount, natCount], backgroundColor: ['#ea580c', '#10b981'], borderWidth: 2 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
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
                    datasets: [{ data: bins, backgroundColor: '#ea580c', borderRadius: 4 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
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
                        { label: 'Industrial Flares', data: indPoints, backgroundColor: '#ea580c' },
                        { label: 'Natural Wildfires', data: natPoints, backgroundColor: '#10b981' }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Distance to Facility (km)' } },
                        y: { title: { display: true, text: 'FRP Intensity (MW)' } }
                    }
                }
            });
        }
    }

    // ----------------------------------------------------------------------
    // 12. TELEMETRY TABLE (Screen 4)
    // ----------------------------------------------------------------------
    function renderTable() {
        const tbody = document.getElementById('tableBody');
        if (!tbody) return;

        tbody.innerHTML = appState.filteredEvents.map(e => {
            const riskClass = e.risk_level === 'High Risk' ? 'high' : (e.risk_level === 'Medium Risk' ? 'medium' : 'low');

            return `
                <tr class="hover:bg-slate-50 cursor-pointer transition-colors" data-id="${e.event_id}">
                    <td class="p-3 font-mono font-semibold text-slate-800">${e.event_id}</td>
                    <td class="p-3"><span class="risk-badge ${riskClass}">${e.risk_level}</span></td>
                    <td class="p-3 font-mono font-semibold text-emerald-600">${Math.round(e.prediction_probability * 100)}%</td>
                    <td class="p-3 font-mono text-slate-600">${e.latitude.toFixed(4)}°, ${e.longitude.toFixed(4)}°</td>
                    <td class="p-3 font-bold text-slate-800">${e.frp} MW</td>
                    <td class="p-3 text-slate-700">${e.nearest_industrial_facility || 'None in 5km'}</td>
                    <td class="p-3 font-mono">${e.industrial_distance_km} km</td>
                    <td class="p-3 font-semibold text-orange-600">${e.hotspot_count_30d}</td>
                    <td class="p-3 text-slate-600">${e.land_cover || 'Built-up'}</td>
                    <td class="p-3"><button class="px-2.5 py-1 text-[11px] font-semibold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 rounded btn-inspect-row" data-id="${e.event_id}">Inspect</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-inspect-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                showEventDetail(id);
            });
        });

        tbody.querySelectorAll('tr').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.getAttribute('data-id');
                showEventDetail(id);
            });
        });
    }

    // ----------------------------------------------------------------------
    // 13. THEME MANAGEMENT (DARK MODE TOGGLE)
    // ----------------------------------------------------------------------
    function initTheme() {
        const checkbox = document.getElementById('themeToggleCheckbox');
        const savedTheme = localStorage.getItem('thermasight_theme') || 'light';
        const isDark = savedTheme === 'dark';

        if (checkbox) {
            checkbox.checked = isDark;
            applyTheme(isDark);

            checkbox.addEventListener('change', (e) => {
                const dark = e.target.checked;
                applyTheme(dark);
                localStorage.setItem('thermasight_theme', dark ? 'dark' : 'light');
                showToast(dark ? 'Dark Mode Enabled' : 'Light Mode Enabled', 'info');
            });
        }
    }

    function applyTheme(isDark) {
        const moonIcon = document.getElementById('themeIconMoon');
        const sunIcon = document.getElementById('themeIconSun');
        const labelText = document.getElementById('themeLabelText');

        if (isDark) {
            document.body.classList.add('dark-theme');
            if (moonIcon) moonIcon.classList.add('hidden');
            if (sunIcon) sunIcon.classList.remove('hidden');
            if (labelText) labelText.textContent = 'Light Mode';
        } else {
            document.body.classList.remove('dark-theme');
            if (moonIcon) moonIcon.classList.remove('hidden');
            if (sunIcon) sunIcon.classList.add('hidden');
            if (labelText) labelText.textContent = 'Dark Mode';
        }
    }

    // ----------------------------------------------------------------------
    // 15. ALERTS SYSTEM MODULE (LIVE ENGINE)
    // ----------------------------------------------------------------------
    let alertInspectorMap = null;

    function initAlertsData() {
        const generatedAlerts = [
            {
                id: 'FIRMS-IND-2025-001',
                desc: 'High thermal activity near industrial facility',
                facility: 'Gujarat Refinery',
                city: 'Jamnagar',
                state: 'Gujarat',
                risk: 'High',
                classification: 'Industrial / Persistent',
                type: 'Industrial',
                source: 'VIIRS',
                frp: 64.2,
                detections: 24,
                date: '12 May 2025',
                time: '13:30 UTC',
                status: 'New',
                confidence: 94,
                distance: 0.22,
                lat: 22.3872,
                lon: 73.1812,
                reasons: [
                    { icon: 'factory', color: 'emerald', text: 'Within 300 m of industrial facility' },
                    { icon: 'flame', color: 'amber', text: 'High temporal persistence (24 detections in 30 days)' },
                    { icon: 'alert-triangle', color: 'red', text: 'Elevated FRP thermal signature' },
                    { icon: 'building-2', color: 'amber', text: 'Located in built-up / industrial area' }
                ]
            },
            {
                id: 'FIRMS-IND-2025-002',
                desc: 'Persistent thermal source',
                facility: 'Reliance Petrochemicals',
                city: 'Jamnagar',
                state: 'Gujarat',
                risk: 'High',
                classification: 'Industrial / Persistent',
                type: 'Industrial',
                source: 'VIIRS',
                frp: 48.7,
                detections: 19,
                date: '12 May 2025',
                time: '11:20 UTC',
                status: 'New',
                confidence: 91,
                distance: 1.4,
                lat: 22.395,
                lon: 73.195,
                reasons: [
                    { icon: 'factory', color: 'emerald', text: 'Within 1.5 km of major petrochemical cluster' },
                    { icon: 'flame', color: 'amber', text: 'Repetitive flare signature (19 detections in 30 days)' },
                    { icon: 'alert-triangle', color: 'red', text: 'FRP exceeds industrial baseline threshold' }
                ]
            },
            {
                id: 'FIRMS-NAT-2025-003',
                desc: 'Thermal activity in forest area',
                facility: 'Similipal Forest',
                city: 'Mayurbhanj',
                state: 'Odisha',
                risk: 'Medium',
                classification: 'Natural / Biomass',
                type: 'Biomass',
                source: 'MODIS',
                frp: 32.1,
                detections: 12,
                date: '12 May 2025',
                time: '09:15 UTC',
                status: 'Acknowledged',
                confidence: 82,
                distance: 4.8,
                lat: 21.85,
                lon: 86.35,
                reasons: [
                    { icon: 'trees', color: 'emerald', text: 'Located inside national biosphere corridor' },
                    { icon: 'flame', color: 'amber', text: 'Seasonal biomass dry-season fire cluster' }
                ]
            },
            {
                id: 'FIRMS-IND-2025-004',
                desc: 'Quarry area thermal signature',
                facility: 'Kutch Quarry',
                city: 'Kutch',
                state: 'Gujarat',
                risk: 'Medium',
                classification: 'Industrial / Quarry',
                type: 'Quarry',
                source: 'VIIRS',
                frp: 28.4,
                detections: 10,
                date: '12 May 2025',
                time: '08:40 UTC',
                status: 'New',
                confidence: 79,
                distance: 0.8,
                lat: 23.25,
                lon: 69.65,
                reasons: [
                    { icon: 'mountain', color: 'purple', text: 'Located within active open-cast quarry zone' },
                    { icon: 'flame', color: 'amber', text: 'Surface blasting / equipment thermal reflection' }
                ]
            },
            {
                id: 'FIRMS-IND-2025-005',
                desc: 'Clustered thermal activity',
                facility: 'Vedanta Plant',
                city: 'Jharsuguda',
                state: 'Odisha',
                risk: 'Medium',
                classification: 'Industrial / Persistent',
                type: 'Industrial',
                source: 'VIIRS',
                frp: 26.8,
                detections: 9,
                date: '11 May 2025',
                time: '22:10 UTC',
                status: 'New',
                confidence: 76,
                distance: 1.8,
                lat: 21.82,
                lon: 84.05,
                reasons: [
                    { icon: 'factory', color: 'emerald', text: 'Close to smelting furnace exhaust stacks' },
                    { icon: 'flame', color: 'amber', text: 'Consistent night-time heat emissions' }
                ]
            },
            {
                id: 'FIRMS-NAT-2025-006',
                desc: 'Wildfire indication',
                facility: 'Nagarjunsagar Forest',
                city: 'Nalgonda',
                state: 'Telangana',
                risk: 'Low',
                classification: 'Natural / Biomass',
                type: 'Biomass',
                source: 'VIIRS',
                frp: 18.2,
                detections: 6,
                date: '11 May 2025',
                time: '18:45 UTC',
                status: 'Acknowledged',
                confidence: 71,
                distance: 6.2,
                lat: 16.58,
                lon: 79.31,
                reasons: [
                    { icon: 'trees', color: 'emerald', text: 'Scrubland thermal detection away from infrastructure' }
                ]
            },
            {
                id: 'FIRMS-IND-2025-007',
                desc: 'Thermal source near industrial area',
                facility: 'Chennai Port',
                city: 'Chennai',
                state: 'Tamil Nadu',
                risk: 'Low',
                classification: 'Industrial / Port',
                type: 'Industrial',
                source: 'VIIRS',
                frp: 16.9,
                detections: 5,
                date: '11 May 2025',
                time: '16:20 UTC',
                status: 'New',
                confidence: 68,
                distance: 2.1,
                lat: 13.08,
                lon: 80.29,
                reasons: [
                    { icon: 'factory', color: 'emerald', text: 'Port perimeter thermal storage area' }
                ]
            },
            {
                id: 'FIRMS-IND-2025-008',
                desc: 'Elevated thermal signature',
                facility: 'Bengaluru Industrial Area',
                city: 'Bengaluru',
                state: 'Karnataka',
                risk: 'Low',
                classification: 'Industrial / Manufacturing',
                type: 'Industrial',
                source: 'VIIRS',
                frp: 14.6,
                detections: 4,
                date: '11 May 2025',
                time: '14:10 UTC',
                status: 'Resolved',
                confidence: 65,
                distance: 3.4,
                lat: 12.97,
                lon: 77.59,
                reasons: [
                    { icon: 'factory', color: 'emerald', text: 'Verified routine foundry operation' }
                ]
            }
        ];

        // Seed remaining items to precisely total 27 Active (8 High, 12 Med, 7 Low), 5 Ack, 18 Resolved (50 total)
        const additionalMockData = [
            // High Risk Active (6 more to reach 8 total High)
            { id: 'FIRMS-IND-2025-009', desc: 'Continuous petrochemical furnace exhaust', facility: 'Mundra Chemical Complex', city: 'Kutch', state: 'Gujarat', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 58.3, detections: 22, date: '11 May 2025', time: '12:00 UTC', status: 'New', confidence: 93, distance: 0.45, lat: 22.84, lon: 69.71 },
            { id: 'FIRMS-IND-2025-010', desc: 'Critical flare emission alert', facility: 'Essar Oil Terminal', city: 'Jamnagar', state: 'Gujarat', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 54.1, detections: 20, date: '11 May 2025', time: '09:40 UTC', status: 'New', confidence: 90, distance: 0.62, lat: 22.42, lon: 70.02 },
            { id: 'FIRMS-IND-2025-011', desc: 'Unusual blast furnace spike', facility: 'Bhilai Steelworks', city: 'Durg', state: 'Chhattisgarh', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 72.8, detections: 28, date: '10 May 2025', time: '23:15 UTC', status: 'New', confidence: 96, distance: 0.18, lat: 21.19, lon: 81.35 },
            { id: 'FIRMS-IND-2025-012', desc: 'Coke oven elevated temperature', facility: 'Rourkela Steel Plant', city: 'Sundargarh', state: 'Odisha', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 61.4, detections: 25, date: '10 May 2025', time: '20:30 UTC', status: 'New', confidence: 92, distance: 0.35, lat: 22.22, lon: 84.86 },
            { id: 'FIRMS-IND-2025-013', desc: 'Thermal exhaust cluster detected', facility: 'Angul Power Plant', city: 'Angul', state: 'Odisha', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 69.0, detections: 27, date: '10 May 2025', time: '17:10 UTC', status: 'New', confidence: 95, distance: 0.28, lat: 20.88, lon: 85.15 },
            { id: 'FIRMS-IND-2025-014', desc: 'Superthermal cluster violation', facility: 'Singrauli Super Thermal Station', city: 'Singrauli', state: 'Madhya Pradesh', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 85.6, detections: 34, date: '10 May 2025', time: '14:20 UTC', status: 'New', confidence: 98, distance: 0.15, lat: 24.20, lon: 82.66 },

            // Medium Risk Active (9 more to reach 12 total Medium)
            { id: 'FIRMS-IND-2025-015', desc: 'Moderate thermal anomaly', facility: 'Paradeep Phosphate Plant', city: 'Jagatsinghpur', state: 'Odisha', risk: 'Medium', classification: 'Industrial / Chemical', type: 'Industrial', source: 'VIIRS', frp: 29.5, detections: 11, date: '10 May 2025', time: '11:05 UTC', status: 'New', confidence: 80, distance: 1.2, lat: 20.26, lon: 86.66 },
            { id: 'FIRMS-IND-2025-016', desc: 'Kiln heat discharge', facility: 'Ambuja Cement Kiln', city: 'Kodinar', state: 'Gujarat', risk: 'Medium', classification: 'Industrial / Cement', type: 'Industrial', source: 'VIIRS', frp: 31.0, detections: 13, date: '09 May 2025', time: '22:45 UTC', status: 'New', confidence: 83, distance: 1.6, lat: 20.79, lon: 70.70 },
            { id: 'FIRMS-IND-2025-017', desc: 'Quarry operations thermal signature', facility: 'Banni Limestone Quarry', city: 'Kutch', state: 'Gujarat', risk: 'Medium', classification: 'Industrial / Quarry', type: 'Quarry', source: 'VIIRS', frp: 24.5, detections: 8, date: '09 May 2025', time: '19:15 UTC', status: 'New', confidence: 75, distance: 0.9, lat: 23.45, lon: 69.80 },
            { id: 'FIRMS-IND-2025-018', desc: 'Repeated agricultural burn', facility: 'Karnal Agricultural Zone', city: 'Karnal', state: 'Haryana', risk: 'Medium', classification: 'Natural / Biomass', type: 'Biomass', source: 'VIIRS', frp: 33.2, detections: 14, date: '09 May 2025', time: '15:50 UTC', status: 'New', confidence: 84, distance: 5.2, lat: 29.68, lon: 76.98 },
            { id: 'FIRMS-IND-2025-019', desc: 'Stubble burn near highway', facility: 'Sangrur Crop Fields', city: 'Sangrur', state: 'Punjab', risk: 'Medium', classification: 'Natural / Biomass', type: 'Biomass', source: 'MODIS', frp: 27.8, detections: 10, date: '09 May 2025', time: '13:20 UTC', status: 'New', confidence: 78, distance: 4.1, lat: 30.24, lon: 75.84 },
            { id: 'FIRMS-IND-2025-020', desc: 'Industrial foundry exhaust', facility: 'Coimbatore Foundry Estate', city: 'Coimbatore', state: 'Tamil Nadu', risk: 'Medium', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 25.1, detections: 9, date: '08 May 2025', time: '21:40 UTC', status: 'New', confidence: 77, distance: 2.0, lat: 11.01, lon: 76.96 },
            { id: 'FIRMS-IND-2025-021', desc: 'Petroleum refinery flare stack', facility: 'Kochi Refinery', city: 'Ernakulam', state: 'Kerala', risk: 'Medium', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 30.4, detections: 12, date: '08 May 2025', time: '18:10 UTC', status: 'New', confidence: 81, distance: 1.1, lat: 9.98, lon: 76.35 },
            { id: 'FIRMS-IND-2025-022', desc: 'Quarry blasting thermal flare', facility: 'Rapar Quarry', city: 'Kutch', state: 'Gujarat', risk: 'Medium', classification: 'Industrial / Quarry', type: 'Quarry', source: 'VIIRS', frp: 22.9, detections: 8, date: '08 May 2025', time: '14:35 UTC', status: 'New', confidence: 74, distance: 0.7, lat: 23.57, lon: 70.63 },
            { id: 'FIRMS-IND-2025-023', desc: 'Chemical reactor heat plume', facility: 'Dahej Chemical SEZ', city: 'Bharuch', state: 'Gujarat', risk: 'Medium', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 34.6, detections: 15, date: '08 May 2025', time: '10:00 UTC', status: 'New', confidence: 85, distance: 1.3, lat: 21.71, lon: 72.58 },

            // Low Risk Active (5 more to reach 7 total Low)
            { id: 'FIRMS-IND-2025-024', desc: 'Low intensity thermal reflection', facility: 'Nagpur Solar Park', city: 'Nagpur', state: 'Maharashtra', risk: 'Low', classification: 'Natural / Surface', type: 'Biomass', source: 'VIIRS', frp: 12.4, detections: 3, date: '07 May 2025', time: '16:45 UTC', status: 'New', confidence: 62, distance: 7.5, lat: 21.14, lon: 79.08 },
            { id: 'FIRMS-IND-2025-025', desc: 'Transient scrubland thermal hit', facility: 'Jaisalmer Desert Tract', city: 'Jaisalmer', state: 'Rajasthan', risk: 'Low', classification: 'Natural / Biomass', type: 'Biomass', source: 'VIIRS', frp: 15.0, detections: 4, date: '07 May 2025', time: '13:10 UTC', status: 'New', confidence: 66, distance: 8.2, lat: 26.91, lon: 70.91 },
            { id: 'FIRMS-IND-2025-026', desc: 'Dispersed heat trace', facility: 'Guntur Rural Outskirts', city: 'Guntur', state: 'Andhra Pradesh', risk: 'Low', classification: 'Natural / Biomass', type: 'Biomass', source: 'MODIS', frp: 11.8, detections: 3, date: '07 May 2025', time: '09:25 UTC', status: 'New', confidence: 60, distance: 5.9, lat: 16.30, lon: 80.43 },
            { id: 'FIRMS-IND-2025-027', desc: 'Minor furnace chimney hit', facility: 'Kanpur Tannery Cluster', city: 'Kanpur', state: 'Uttar Pradesh', risk: 'Low', classification: 'Industrial / Light', type: 'Industrial', source: 'VIIRS', frp: 13.9, detections: 4, date: '06 May 2025', time: '19:50 UTC', status: 'New', confidence: 64, distance: 2.8, lat: 26.44, lon: 80.33 },
            { id: 'FIRMS-IND-2025-028', desc: 'Small biomass campfire cluster', facility: 'Satpura Tiger Reserve Fringe', city: 'Hoshangabad', state: 'Madhya Pradesh', risk: 'Low', classification: 'Natural / Biomass', type: 'Biomass', source: 'VIIRS', frp: 10.2, detections: 2, date: '06 May 2025', time: '15:15 UTC', status: 'New', confidence: 58, distance: 9.4, lat: 22.45, lon: 78.20 },

            // Acknowledged (3 more to reach 5 total Acknowledged)
            { id: 'FIRMS-IND-2025-029', desc: 'Controlled refinery flaring', facility: 'Visakhapatnam Refinery', city: 'Visakhapatnam', state: 'Andhra Pradesh', risk: 'High', classification: 'Industrial / Persistent', type: 'Industrial', source: 'VIIRS', frp: 45.2, detections: 18, date: '06 May 2025', time: '11:40 UTC', status: 'Acknowledged', confidence: 89, distance: 0.55, lat: 17.68, lon: 83.21 },
            { id: 'FIRMS-IND-2025-030', desc: 'Permitted waste incinerator run', facility: 'Surat Municipal Plant', city: 'Surat', state: 'Gujarat', risk: 'Medium', classification: 'Industrial / Utility', type: 'Industrial', source: 'VIIRS', frp: 26.0, detections: 8, date: '05 May 2025', time: '18:20 UTC', status: 'Acknowledged', confidence: 77, distance: 1.9, lat: 21.17, lon: 72.83 },
            { id: 'FIRMS-IND-2025-031', desc: 'Seasonal controlled burn in forestry parcel', facility: 'Wayand Forest Border', city: 'Wayanad', state: 'Kerala', risk: 'Low', classification: 'Natural / Forestry', type: 'Biomass', source: 'MODIS', frp: 16.5, detections: 5, date: '05 May 2025', time: '12:00 UTC', status: 'Acknowledged', confidence: 69, distance: 6.8, lat: 11.68, lon: 76.13 },

            // Resolved (17 more to reach 18 total Resolved)
            { id: 'FIRMS-IND-2025-032', desc: 'Resolved: Routine pipeline flaring test', facility: 'Barmer Cairn Oil Field', city: 'Barmer', state: 'Rajasthan', risk: 'High', classification: 'Industrial / Oil', type: 'Industrial', source: 'VIIRS', frp: 52.0, detections: 17, date: '05 May 2025', time: '08:30 UTC', status: 'Resolved', confidence: 88, distance: 0.9, lat: 25.75, lon: 71.39 },
            { id: 'FIRMS-IND-2025-033', desc: 'Resolved: Extinguished field burn', facility: 'Patiala Paddy Field', city: 'Patiala', state: 'Punjab', risk: 'Medium', classification: 'Natural / Biomass', type: 'Biomass', source: 'VIIRS', frp: 28.1, detections: 9, date: '04 May 2025', time: '17:15 UTC', status: 'Resolved', confidence: 79, distance: 4.5, lat: 30.33, lon: 76.38 },
            { id: 'FIRMS-IND-2025-034', desc: 'Resolved: Controlled furnace relining', facility: 'Jamshedpur Tata Steel', city: 'Jamshedpur', state: 'Jharkhand', risk: 'High', classification: 'Industrial / Steel', type: 'Industrial', source: 'VIIRS', frp: 60.5, detections: 23, date: '04 May 2025', time: '14:00 UTC', status: 'Resolved', confidence: 91, distance: 0.3, lat: 22.80, lon: 86.20 },
            { id: 'FIRMS-IND-2025-035', desc: 'Resolved: Quarry dust reflection clear', facility: 'Makrana Marble Quarry', city: 'Nagaur', state: 'Rajasthan', risk: 'Low', classification: 'Industrial / Quarry', type: 'Quarry', source: 'VIIRS', frp: 13.2, detections: 3, date: '04 May 2025', time: '10:45 UTC', status: 'Resolved', confidence: 63, distance: 0.8, lat: 27.04, lon: 74.72 },
            { id: 'FIRMS-IND-2025-036', desc: 'Resolved: Forest guard verified campfire', facility: 'Bandipur Buffer', city: 'Chamarajanagar', state: 'Karnataka', risk: 'Low', classification: 'Natural / Biomass', type: 'Biomass', source: 'VIIRS', frp: 12.0, detections: 3, date: '03 May 2025', time: '20:10 UTC', status: 'Resolved', confidence: 61, distance: 7.2, lat: 11.66, lon: 76.63 },
            { id: 'FIRMS-IND-2025-037', desc: 'Resolved: Power station maintenance completed', facility: 'Korba Super Thermal', city: 'Korba', state: 'Chhattisgarh', risk: 'High', classification: 'Industrial / Power', type: 'Industrial', source: 'VIIRS', frp: 55.4, detections: 21, date: '03 May 2025', time: '15:25 UTC', status: 'Resolved', confidence: 90, distance: 0.4, lat: 22.35, lon: 82.68 },
            { id: 'FIRMS-IND-2025-038', desc: 'Resolved: Boiler inspection anomaly resolved', facility: 'Neyveli Lignite Power', city: 'Cuddalore', state: 'Tamil Nadu', risk: 'Medium', classification: 'Industrial / Power', type: 'Industrial', source: 'VIIRS', frp: 27.0, detections: 8, date: '03 May 2025', time: '11:00 UTC', status: 'Resolved', confidence: 78, distance: 1.0, lat: 11.59, lon: 79.48 },
            { id: 'FIRMS-IND-2025-039', desc: 'Resolved: Smelting cycle completed', facility: 'Hindustan Zinc Chanderiya', city: 'Chittorgarh', state: 'Rajasthan', risk: 'Medium', classification: 'Industrial / Smelter', type: 'Industrial', source: 'VIIRS', frp: 30.1, detections: 11, date: '02 May 2025', time: '18:50 UTC', status: 'Resolved', confidence: 82, distance: 0.7, lat: 24.83, lon: 74.63 },
            { id: 'FIRMS-IND-2025-040', desc: 'Resolved: Asphalt plant roadwork cooled down', facility: 'Hubli Roadworks Plant', city: 'Dharwad', state: 'Karnataka', risk: 'Low', classification: 'Industrial / Construction', type: 'Industrial', source: 'VIIRS', frp: 14.0, detections: 4, date: '02 May 2025', time: '14:15 UTC', status: 'Resolved', confidence: 65, distance: 2.5, lat: 15.36, lon: 75.12 },
            { id: 'FIRMS-IND-2025-041', desc: 'Resolved: Crop clearing extinguished', facility: 'Bhatinda Farm Zone', city: 'Bhatinda', state: 'Punjab', risk: 'Medium', classification: 'Natural / Biomass', type: 'Biomass', source: 'VIIRS', frp: 25.4, detections: 7, date: '02 May 2025', time: '09:30 UTC', status: 'Resolved', confidence: 76, distance: 5.0, lat: 30.21, lon: 74.94 },
            { id: 'FIRMS-IND-2025-042', desc: 'Resolved: Fertilizer boiler vent cleared', facility: 'IFFCO Kalol Complex', city: 'Gandhinagar', state: 'Gujarat', risk: 'Medium', classification: 'Industrial / Chemical', type: 'Industrial', source: 'VIIRS', frp: 26.5, detections: 8, date: '01 May 2025', time: '21:00 UTC', status: 'Resolved', confidence: 78, distance: 1.2, lat: 23.23, lon: 72.49 },
            { id: 'FIRMS-IND-2025-043', desc: 'Resolved: Port cargo heat dissipation checked', facility: 'Kandla Port Tank Farm', city: 'Kutch', state: 'Gujarat', risk: 'Low', classification: 'Industrial / Port', type: 'Industrial', source: 'VIIRS', frp: 15.2, detections: 4, date: '01 May 2025', time: '16:40 UTC', status: 'Resolved', confidence: 66, distance: 1.8, lat: 23.00, lon: 70.21 },
            { id: 'FIRMS-IND-2025-044', desc: 'Resolved: Glass furnace regular burn cycle', facility: 'Firozabad Glass Industrial Zone', city: 'Firozabad', state: 'Uttar Pradesh', risk: 'Low', classification: 'Industrial / Glass', type: 'Industrial', source: 'VIIRS', frp: 16.0, detections: 5, date: '01 May 2025', time: '12:15 UTC', status: 'Resolved', confidence: 67, distance: 1.5, lat: 27.15, lon: 78.39 },
            { id: 'FIRMS-IND-2025-045', desc: 'Resolved: Brick kiln seasonal cool down', facility: 'Rohtak Kiln Cluster', city: 'Rohtak', state: 'Haryana', risk: 'Low', classification: 'Industrial / Kiln', type: 'Industrial', source: 'VIIRS', frp: 13.5, detections: 3, date: '01 May 2025', time: '08:50 UTC', status: 'Resolved', confidence: 64, distance: 3.1, lat: 28.89, lon: 76.60 },
            { id: 'FIRMS-IND-2025-046', desc: 'Resolved: Copper smelting chimney checked', facility: 'Sterlite Copper Area', city: 'Thoothukudi', state: 'Tamil Nadu', risk: 'Medium', classification: 'Industrial / Smelter', type: 'Industrial', source: 'VIIRS', frp: 29.8, detections: 10, date: '30 Apr 2025', time: '19:30 UTC', status: 'Resolved', confidence: 81, distance: 1.4, lat: 8.76, lon: 78.13 },
            { id: 'FIRMS-IND-2025-047', desc: 'Resolved: Refractory baking complete', facility: 'Belgaum Industrial Area', city: 'Belagavi', state: 'Karnataka', risk: 'Low', classification: 'Industrial / Manufacturing', type: 'Industrial', source: 'VIIRS', frp: 12.8, detections: 3, date: '30 Apr 2025', time: '14:20 UTC', status: 'Resolved', confidence: 63, distance: 2.2, lat: 15.84, lon: 74.49 },
            { id: 'FIRMS-IND-2025-048', desc: 'Resolved: Alumina calcination cooling', facility: 'Damanjodi NALCO', city: 'Koraput', state: 'Odisha', risk: 'Medium', classification: 'Industrial / Mining', type: 'Industrial', source: 'VIIRS', frp: 31.2, detections: 12, date: '30 Apr 2025', time: '10:10 UTC', status: 'Resolved', confidence: 83, distance: 0.9, lat: 18.77, lon: 82.99 },
            { id: 'FIRMS-IND-2025-049', desc: 'Resolved: Sugar mill bagasse boiler checked', facility: 'Kolhapur Sugar Mill', city: 'Kolhapur', state: 'Maharashtra', risk: 'Low', classification: 'Industrial / Agro', type: 'Industrial', source: 'VIIRS', frp: 14.5, detections: 4, date: '29 Apr 2025', time: '18:10 UTC', status: 'Resolved', confidence: 66, distance: 2.6, lat: 16.70, lon: 74.24 },
            { id: 'FIRMS-IND-2025-050', desc: 'Resolved: Paper mill boiler exhaust clear', facility: 'Bhadravati Paper Mill', city: 'Shivamogga', state: 'Karnataka', risk: 'Low', classification: 'Industrial / Paper', type: 'Industrial', source: 'VIIRS', frp: 15.8, detections: 5, date: '29 Apr 2025', time: '14:00 UTC', status: 'Resolved', confidence: 68, distance: 1.9, lat: 13.84, lon: 75.70 }
        ];

        appState.alerts = [...generatedAlerts, ...additionalMockData];
    }

    function renderAlertsView() {
        if (!appState.alerts || appState.alerts.length === 0) {
            initAlertsData();
        }

        // Calculate counts
        const activeAlerts = appState.alerts.filter(a => a.status === 'New');
        const ackAlerts = appState.alerts.filter(a => a.status === 'Acknowledged');
        const resAlerts = appState.alerts.filter(a => a.status === 'Resolved');

        const activeCount = activeAlerts.length;
        const ackCount = ackAlerts.length;
        const resCount = resAlerts.length;

        const highCount = activeAlerts.filter(a => a.risk === 'High').length;
        const medCount = activeAlerts.filter(a => a.risk === 'Medium').length;
        const lowCount = activeAlerts.filter(a => a.risk === 'Low').length;

        // Update KPI cards
        const kpiActive = document.getElementById('kpiActiveAlertsVal');
        const kpiHigh = document.getElementById('kpiHighRiskVal');
        const kpiMed = document.getElementById('kpiMedRiskVal');
        const kpiLow = document.getElementById('kpiLowRiskVal');
        const badgeSide = document.getElementById('sidebarAlertsBadge');

        if (kpiActive) kpiActive.textContent = activeCount;
        if (kpiHigh) kpiHigh.textContent = highCount;
        if (kpiMed) kpiMed.textContent = medCount;
        if (kpiLow) kpiLow.textContent = lowCount;
        if (badgeSide) badgeSide.textContent = activeCount;

        // Update Status Tab counts
        const cActiveTab = document.getElementById('countActiveTab');
        const cAckTab = document.getElementById('countAckTab');
        const cResTab = document.getElementById('countResolvedTab');

        if (cActiveTab) cActiveTab.textContent = activeCount;
        if (cAckTab) cAckTab.textContent = ackCount;
        if (cResTab) cResTab.textContent = resCount;

        // Filter alerts by status
        let list = [];
        if (appState.alertsFilters.status === 'acknowledged') {
            list = ackAlerts;
        } else if (appState.alertsFilters.status === 'resolved') {
            list = resAlerts;
        } else {
            list = activeAlerts;
        }

        // Apply Risk Filter
        if (appState.alertsFilters.risk !== 'ALL') {
            list = list.filter(a => a.risk.toLowerCase() === appState.alertsFilters.risk.toLowerCase());
        }

        // Apply Search
        if (appState.alertsFilters.search) {
            const q = appState.alertsFilters.search.toLowerCase();
            list = list.filter(a => 
                a.id.toLowerCase().includes(q) ||
                a.facility.toLowerCase().includes(q) ||
                a.city.toLowerCase().includes(q) ||
                a.state.toLowerCase().includes(q) ||
                a.desc.toLowerCase().includes(q)
            );
        }

        // Apply Dropdowns
        if (appState.alertsFilters.type !== 'ALL') {
            list = list.filter(a => a.type === appState.alertsFilters.type);
        }
        if (appState.alertsFilters.source !== 'ALL') {
            list = list.filter(a => a.source === appState.alertsFilters.source);
        }
        if (appState.alertsFilters.state !== 'ALL') {
            list = list.filter(a => a.state === appState.alertsFilters.state);
        }

        // Apply Sort
        if (appState.alertsFilters.sort === 'frp') {
            list.sort((a, b) => b.frp - a.frp);
        } else if (appState.alertsFilters.sort === 'risk') {
            const rMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
            list.sort((a, b) => (rMap[b.risk] || 0) - (rMap[a.risk] || 0));
        } else {
            list.sort((a, b) => b.id.localeCompare(a.id));
        }

        // Render Table Rows
        const tbody = document.getElementById('alertsTableBody');
        if (tbody) {
            if (list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-slate-400 text-xs">No alerts match the selected criteria.</td></tr>`;
            } else {
                tbody.innerHTML = list.map(alert => {
                    const isSelected = alert.id === appState.selectedAlertId ? 'selected' : '';
                    let flareColor = '#ef4444';
                    let riskPill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">High</span>';
                    if (alert.risk === 'Medium') {
                        flareColor = '#f59e0b';
                        riskPill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">Medium</span>';
                    } else if (alert.risk === 'Low') {
                        flareColor = '#10b981';
                        riskPill = '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Low</span>';
                    }

                    let statusBadge = '<span class="alert-status-badge badge-status-new">New</span>';
                    if (alert.status === 'Acknowledged') {
                        statusBadge = '<span class="alert-status-badge badge-status-acknowledged">Acknowledged</span>';
                    } else if (alert.status === 'Resolved') {
                        statusBadge = '<span class="alert-status-badge badge-status-resolved">Resolved</span>';
                    }

                    return `
                        <tr class="alert-table-row ${isSelected}" data-id="${alert.id}">
                            <td class="w-8" onclick="event.stopPropagation()">
                                <input type="checkbox" class="alert-row-check rounded border-slate-300">
                            </td>
                            <td>
                                <div class="flex items-center gap-2.5">
                                    <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-900 flex items-center justify-center relative">
                                        <svg width="40" height="40" viewBox="0 0 40 40">
                                            <rect width="40" height="40" fill="#11192e"/>
                                            <circle cx="20" cy="20" r="14" fill="${flareColor}" opacity="0.3"/>
                                            <circle cx="20" cy="20" r="7" fill="${flareColor}" opacity="0.85"/>
                                            <circle cx="20" cy="20" r="2.5" fill="#ffffff"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div class="font-bold text-slate-800 text-[12px] font-mono">${alert.id}</div>
                                        <div class="text-[10px] text-slate-400 truncate max-w-[180px]">${alert.desc}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="flex items-center gap-1 text-[12px] font-semibold text-slate-800">
                                    <i data-lucide="map-pin" class="w-3 h-3 text-slate-400 shrink-0"></i>
                                    <span>${alert.facility}</span>
                                </div>
                                <div class="text-[10px] text-slate-400 ml-4">${alert.city}, ${alert.state}</div>
                            </td>
                            <td>${riskPill}</td>
                            <td>
                                <div class="text-[11px] font-semibold text-slate-700">FRP: ${alert.frp.toFixed(1)} MW</div>
                                <div class="text-[10px] text-slate-400">Detections: ${alert.detections}</div>
                            </td>
                            <td>
                                <div class="text-[11px] font-semibold text-slate-700">${alert.date}</div>
                                <div class="text-[10px] text-slate-400">${alert.time}</div>
                            </td>
                            <td>${statusBadge}</td>
                            <td class="w-8 text-right text-slate-400">
                                <button class="p-1 hover:text-slate-600 rounded">
                                    <i data-lucide="more-vertical" class="w-3.5 h-3.5"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                // Attach row click listeners
                tbody.querySelectorAll('.alert-table-row').forEach(row => {
                    row.addEventListener('click', () => {
                        const id = row.getAttribute('data-id');
                        selectAlert(id);
                    });
                });
            }
        }

        // Update inspector with selected alert
        const selectedAlert = appState.alerts.find(a => a.id === appState.selectedAlertId) || list[0] || appState.alerts[0];
        if (selectedAlert) {
            renderAlertInspector(selectedAlert);
        }

        initLucideIcons();
    }

    function selectAlert(alertId) {
        appState.selectedAlertId = alertId;
        document.querySelectorAll('.alert-table-row').forEach(r => {
            if (r.getAttribute('data-id') === alertId) r.classList.add('selected');
            else r.classList.remove('selected');
        });

        const alert = appState.alerts.find(a => a.id === alertId);
        if (alert) {
            renderAlertInspector(alert);
        }
    }

    function renderAlertInspector(alert) {
        const idElem = document.getElementById('insAlertEventId');
        const riskElem = document.getElementById('insAlertRiskBadge');
        const classElem = document.getElementById('insAlertClassificationBadge');
        const facElem = document.getElementById('insAlertFacility');
        const locSub = document.getElementById('insAlertLocationSub');
        const timeElem = document.getElementById('insAlertTime');

        if (idElem) idElem.textContent = alert.id;
        if (riskElem) {
            riskElem.textContent = `${alert.risk} Risk`;
            riskElem.className = `risk-badge ${alert.risk === 'High' ? 'high' : (alert.risk === 'Medium' ? 'medium' : 'low')}`;
        }
        if (classElem) classElem.textContent = alert.classification;
        if (facElem) facElem.textContent = alert.facility;
        if (locSub) locSub.textContent = `${alert.city}, ${alert.state} (${alert.distance} km)`;
        if (timeElem) timeElem.textContent = `${alert.date}, ${alert.time}`;

        const frpElem = document.getElementById('insAlertFrp');
        const detElem = document.getElementById('insAlertDetections');
        const confElem = document.getElementById('insAlertConfidence');
        const distElem = document.getElementById('insAlertDistance');

        if (frpElem) frpElem.textContent = `${alert.frp.toFixed(1)} MW`;
        if (detElem) detElem.innerHTML = `${alert.detections} <span class="text-[10px] text-slate-400 font-normal">(30 days)</span>`;
        if (confElem) confElem.textContent = `${alert.confidence || 94}%`;
        if (distElem) distElem.textContent = `${alert.distance} km`;

        // Reasons checklist
        const reasonsElem = document.getElementById('insAlertReasons');
        if (reasonsElem) {
            const reasons = alert.reasons || [
                { icon: 'factory', color: 'emerald', text: `Within ${Math.round(alert.distance * 1000)} m of industrial facility` },
                { icon: 'flame', color: 'amber', text: `High temporal persistence (${alert.detections} detections in 30 days)` },
                { icon: 'alert-triangle', color: 'red', text: 'Elevated FRP thermal signature' },
                { icon: 'building-2', color: 'amber', text: 'Located in built-up / industrial area' }
            ];

            reasonsElem.innerHTML = reasons.map(r => `
                <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span class="w-2 h-2 rounded-full bg-${r.color}-500 shrink-0"></span>
                    <span class="text-[11px] font-medium">${r.text}</span>
                </div>
            `).join('');
        }

        // Sub-map initialization & positioning
        const mapContainer = document.getElementById('alertInspectorMap');
        if (mapContainer && window.L) {
            if (!alertInspectorMap) {
                alertInspectorMap = L.map('alertInspectorMap', {
                    center: [alert.lat, alert.lon],
                    zoom: 15,
                    zoomControl: false,
                    attributionControl: false
                });
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    subdomains: ['a', 'b', 'c'],
                    maxZoom: 19
                }).addTo(alertInspectorMap);
            } else {
                alertInspectorMap.setView([alert.lat, alert.lon], 15);
                setTimeout(() => alertInspectorMap.invalidateSize(), 100);
            }

            // Stick pulsing marker to exact coordinates on the alert sub-map
            if (!alertInspectorMarkerLayer) {
                alertInspectorMarkerLayer = L.layerGroup().addTo(alertInspectorMap);
            }
            alertInspectorMarkerLayer.clearLayers();

            let alertColor = '#10b981';
            if (alert.risk === 'High') alertColor = '#ef4444';
            else if (alert.risk === 'Medium') alertColor = '#f97316';

            const alertIconHtml = `
                <div class="pin-marker-container pin-selected" style="width:20px; height:20px;">
                    <div class="pin-focal-beacon" style="border-color:${alertColor}; box-shadow:0 0 14px ${alertColor};"></div>
                    <div style="width:20px; height:20px; border-radius:50%; background:${alertColor}; border:2.5px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
                </div>
            `;
            const alertCustomIcon = L.divIcon({
                html: alertIconHtml,
                className: 'custom-risk-dot',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            const alertMarker = L.marker([alert.lat, alert.lon], { icon: alertCustomIcon });
            alertMarker.bindTooltip(`
                <div style="font-weight:700; color:${alertColor}; font-size:11px;">${alert.risk} Risk &bull; ${alert.id}</div>
                <div style="font-size:11px; color:#334155; margin-top:2px;">${alert.facility}, ${alert.city}</div>
                <div style="font-size:10px; color:#64748b;">${alert.frp} MW FRP &bull; ${alert.time}</div>
            `, { direction: 'top', offset: [0, -10] });

            alertInspectorMarkerLayer.addLayer(alertMarker);
        }

        initLucideIcons();
    }

    function acknowledgeAlert(alertId) {
        const alert = appState.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'Acknowledged';
            showToast(`Alert ${alert.id} marked as Acknowledged`, 'success');
            renderAlertsView();
        }
    }

    function resolveAlert(alertId) {
        const alert = appState.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'Resolved';
            showToast(`Alert ${alert.id} marked as Resolved`, 'success');
            renderAlertsView();
        }
    }

    function initAlertsEventListeners() {
        // Status filter tabs (Active, Acknowledged, Resolved)
        document.querySelectorAll('.alerts-status-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.alerts-status-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                appState.alertsFilters.status = tab.getAttribute('data-status');
                renderAlertsView();
            });
        });

        // Risk filter pills in topbar
        document.querySelectorAll('#alertsRiskFilterGroup .filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('#alertsRiskFilterGroup .filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                appState.alertsFilters.risk = pill.getAttribute('data-risk');
                renderAlertsView();
            });
        });

        // Search input
        document.getElementById('alertsSearchInput')?.addEventListener('input', (e) => {
            appState.alertsFilters.search = e.target.value.trim();
            renderAlertsView();
        });

        // Dropdown filters
        document.getElementById('selAlertRiskLevel')?.addEventListener('change', (e) => {
            appState.alertsFilters.risk = e.target.value;
            renderAlertsView();
        });
        document.getElementById('selAlertType')?.addEventListener('change', (e) => {
            appState.alertsFilters.type = e.target.value;
            renderAlertsView();
        });
        document.getElementById('selSourceType')?.addEventListener('change', (e) => {
            appState.alertsFilters.source = e.target.value;
            renderAlertsView();
        });
        document.getElementById('selState')?.addEventListener('change', (e) => {
            appState.alertsFilters.state = e.target.value;
            renderAlertsView();
        });

        // Sort toggle
        document.getElementById('alertsSortBtn')?.addEventListener('click', () => {
            const sorts = [
                { key: 'latest', label: 'Latest' },
                { key: 'risk', label: 'Risk' },
                { key: 'frp', label: 'FRP' }
            ];
            const currIdx = sorts.findIndex(s => s.key === appState.alertsFilters.sort);
            const next = sorts[(currIdx + 1) % sorts.length];
            appState.alertsFilters.sort = next.key;
            const lbl = document.getElementById('alertsSortLabel');
            if (lbl) lbl.textContent = next.label;
            renderAlertsView();
            showToast(`Alerts sorted by ${next.label}`, 'info');
        });

        // Acknowledge & Resolve action buttons
        document.getElementById('btnAcknowledgeAlert')?.addEventListener('click', () => {
            if (appState.selectedAlertId) {
                acknowledgeAlert(appState.selectedAlertId);
            }
        });
        document.getElementById('btnResolveAlert')?.addEventListener('click', () => {
            if (appState.selectedAlertId) {
                resolveAlert(appState.selectedAlertId);
            }
        });

        // Select All Checkbox
        document.getElementById('selectAllAlerts')?.addEventListener('change', (e) => {
            document.querySelectorAll('.alert-row-check').forEach(chk => {
                chk.checked = e.target.checked;
            });
        });

        // Create Alert Rule Modal
        const modal = document.getElementById('createAlertModal');
        document.getElementById('btnOpenCreateAlert')?.addEventListener('click', () => {
            modal?.classList.remove('hidden');
        });
        document.getElementById('btnCloseAlertModal')?.addEventListener('click', () => {
            modal?.classList.add('hidden');
        });
        document.getElementById('btnCancelAlertModal')?.addEventListener('click', () => {
            modal?.classList.add('hidden');
        });

        document.getElementById('createAlertForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('alertRuleName')?.value;
            modal?.classList.add('hidden');
            showToast(`Alert rule "${name}" created successfully!`, 'success');
        });
    }

    // ----------------------------------------------------------------------
    // 14. TOAST NOTIFICATION UTILITY
    // ----------------------------------------------------------------------
    function showToast(message, type = 'info') {
        const existing = document.getElementById('toastNotification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold text-white transition-all transform duration-200 ${type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-slate-900')}`;
        toast.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

})();
