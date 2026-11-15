import { WATER_POINTS, STOICHIOMETRIC_RATIOS, WEATHER_DEGRADATION_RULES } from './data.js';

export class JalDurbinMapEngine {
  constructor(containerId, statsCallback) {
    this.containerId = containerId;
    this.statsCallback = statsCallback;
    this.map = null;
    this.markers = [];
    this.routePolyline = null;
    this.haversinePolyline = null;
    
    // User / Mother Origin (Munshiganj Village cluster, Shyamnagar)
    this.userOrigin = {
      name: "Parul Begum's Household (Expectant Mother, Week 28)",
      lat: 22.2280,
      lng: 89.1820
    };

    // Engine States
    this.maternalSafeMode = true;
    this.pumpDecaySimulated = false;
    this.weatherMode = 'clear'; // 'clear' | 'monsoon'
    this.selectedSubdistrict = 'Shyamnagar';

    this.init();
  }

  init() {
    const mapElement = document.getElementById(this.containerId);
    if (!mapElement) return;

    // Check if Leaflet is loaded
    if (typeof L !== 'undefined') {
      try {
        this.map = L.map(this.containerId, {
          center: [22.25, 89.23],
          zoom: 12,
          zoomControl: true,
          attributionControl: false
        });

        // OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          opacity: 0.95
        }).addTo(this.map);

        // Add Leaflet attribution manually in bottom right
        L.control.attribution({ position: 'bottomright' })
          .addAttribution('&copy; OpenStreetMap &bull; JalDurbin GIS')
          .addTo(this.map);

        this.renderMarkers();
        this.calculateAndDrawRoute();
      } catch (err) {
        console.warn("Leaflet initialization fallback:", err);
        this.renderSvgFallback(mapElement);
      }
    } else {
      this.renderSvgFallback(mapElement);
    }
  }

  renderMarkers() {
    if (!this.map || typeof L === 'undefined') return;

    // Clear previous markers
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    // Origin Marker (Mother's Home)
    const motherIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <span class="absolute -bottom-5 text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap">Mother's Home</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const motherMarker = L.marker([this.userOrigin.lat, this.userOrigin.lng], { icon: motherIcon })
      .addTo(this.map)
      .bindPopup(`
        <div class="p-1 font-sans">
          <div class="text-xs font-semibold text-amber-700 uppercase tracking-wider">Starting Location</div>
          <div class="font-bold text-slate-800 text-sm">${this.userOrigin.name}</div>
          <p class="text-xs text-slate-600 mt-1">Gestation: 28 weeks &bull; Blood Pressure: 135/88 mmHg. Needs sodium-restricted freshwater.</p>
        </div>
      `);
    this.markers.push(motherMarker);

    // Render Water Points
    WATER_POINTS.forEach(wp => {
      // Modify status if pump breakdown simulation is active
      const isSimulatedBroken = this.pumpDecaySimulated && wp.id === "WP-SHY-01";
      const effectiveStatus = isSimulatedBroken ? "Broken Down (Simulated Decay)" : wp.status;
      const isSafe = wp.maternalSafe && effectiveStatus === "Functional";

      let pinColor = '#059669'; // Emerald
      let pulseClass = 'radar-pulse';

      if (!isSafe) {
        if (!wp.maternalSafe) {
          pinColor = '#DC2626'; // Red high salinity
          pulseClass = 'hazard-pulse';
        } else {
          pinColor = '#D97706'; // Amber broken down
          pulseClass = '';
        }
      }

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center ${pulseClass}">
            <div style="background-color: ${pinColor}" class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              ${isSafe ? '✓' : (effectiveStatus !== 'Functional' ? '!' : '✕')}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([wp.lat, wp.lng], { icon })
        .addTo(this.map)
        .bindPopup(`
          <div class="p-2 font-sans max-w-xs">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
                ${isSafe ? 'Maternal Safe' : (effectiveStatus !== 'Functional' ? 'Decayed / Down' : 'High Salinity Danger')}
              </span>
              <span class="text-xs font-semibold text-slate-500">${wp.type}</span>
            </div>
            <div class="font-bold text-slate-900 text-sm mt-1">${wp.name}</div>
            <div class="text-xs text-slate-600 mt-0.5">${wp.upazila}, ${wp.district}</div>
            
            <div class="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span class="text-slate-400 block text-[10px]">Sodium (Na+):</span>
                <span class="font-bold ${wp.sodium > 300 ? 'text-red-600' : 'text-emerald-700'}">${wp.sodium} mg/L</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Queue Time:</span>
                <span class="font-bold text-slate-800">${this.pumpDecaySimulated && wp.id === "WP-SHY-02" ? wp.congestedQueueMin + " min (Surged!)" : wp.normalQueueMin + " min"}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Embankment Path:</span>
                <span class="font-bold text-slate-800">${wp.embankmentDistanceKm} km</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">TDS:</span>
                <span class="font-bold text-slate-800">${wp.tds} mg/L</span>
              </div>
            </div>

            <p class="text-[11px] text-slate-500 mt-2 bg-slate-50 p-1.5 rounded">${wp.notes}</p>
          </div>
        `);

      this.markers.push(marker);
    });
  }

  calculateAndDrawRoute() {
    if (!this.map || typeof L === 'undefined') return;

    if (this.routePolyline) this.map.removeLayer(this.routePolyline);
    if (this.haversinePolyline) this.map.removeLayer(this.haversinePolyline);

    let targetPoint = null;

    if (this.maternalSafeMode) {
      // Find nearest safe functional water point
      const safePoints = WATER_POINTS.filter(p => {
        const isSimBroken = this.pumpDecaySimulated && p.id === "WP-SHY-01";
        return p.maternalSafe && p.status === "Functional" && !isSimBroken;
      });

      // Sort by embankment distance
      safePoints.sort((a, b) => a.embankmentDistanceKm - b.embankmentDistanceKm);
      targetPoint = safePoints[0] || WATER_POINTS[0];
    } else {
      // Unsafe mode: Pick closest source regardless of salinity
      const allPoints = [...WATER_POINTS].sort((a, b) => a.embankmentDistanceKm - b.embankmentDistanceKm);
      targetPoint = allPoints.find(p => !p.maternalSafe) || allPoints[0];
    }

    // Walking speed based on weather mode
    const speedConfig = this.weatherMode === 'monsoon' 
      ? WEATHER_DEGRADATION_RULES.heavyMonsoonTidalMud 
      : WEATHER_DEGRADATION_RULES.clearConditions;

    const walkHours = targetPoint.embankmentDistanceKm / speedConfig.speedKmh;
    const walkMinutes = Math.round(walkHours * 60);

    // Calculate queue time (spikes if primary pump is decayed)
    let queueMin = targetPoint.normalQueueMin;
    if (this.pumpDecaySimulated && (targetPoint.id === "WP-SHY-02" || targetPoint.id === "WP-KOY-01")) {
      queueMin = targetPoint.congestedQueueMin; // Surges from 15/20 min to 45/55 min!
    }

    const totalTripMinutes = (walkMinutes * 2) + queueMin; // Round trip + queue

    // Realistic Embankment Winding Waypoints (avoiding tidal river crossing)
    const p1 = [this.userOrigin.lat, this.userOrigin.lng];
    const p4 = [targetPoint.lat, targetPoint.lng];
    
    // Intermediate embankment bends simulating coastal dykes
    const midLat = (p1[0] + p4[0]) / 2;
    const midLng = (p1[1] + p4[1]) / 2;
    const p2 = [midLat + 0.003, p1[1] + 0.006];
    const p3 = [p4[0] - 0.002, midLng + 0.004];

    const embankmentRoute = [p1, p2, p3, p4];

    // Draw Embankment Route
    this.routePolyline = L.polyline(embankmentRoute, {
      color: targetPoint.maternalSafe ? '#059669' : '#DC2626',
      weight: 5,
      opacity: 0.9,
      dashArray: targetPoint.maternalSafe ? null : '6, 6'
    }).addTo(this.map);

    // Draw Naive Haversine Line (dashed grey/red straight line crossing river)
    const naiveHaversineLine = [p1, p4];
    this.haversinePolyline = L.polyline(naiveHaversineLine, {
      color: '#94A3B8',
      weight: 2,
      dashArray: '4, 8',
      opacity: 0.6
    }).addTo(this.map);

    // Fit bounds smoothly
    this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });

    // Inform parent callback
    if (this.statsCallback) {
      this.statsCallback({
        targetPoint,
        walkMinutes,
        walkMinutesRoundTrip: walkMinutes * 2,
        queueMin,
        totalTripMinutes,
        speedKmh: speedConfig.speedKmh,
        speedLabel: speedConfig.label,
        haversineDistanceKm: (targetPoint.embankmentDistanceKm * 0.58).toFixed(2), // Straight-line illusion
        actualFootpathDistanceKm: targetPoint.embankmentDistanceKm,
        isSafe: targetPoint.maternalSafe,
        pumpDecayActive: this.pumpDecaySimulated,
        weatherMode: this.weatherMode
      });
    }
  }

  setMaternalSafeMode(active) {
    this.maternalSafeMode = active;
    this.renderMarkers();
    this.calculateAndDrawRoute();
  }

  setPumpDecaySimulation(active) {
    this.pumpDecaySimulated = active;
    this.renderMarkers();
    this.calculateAndDrawRoute();
  }

  setWeatherMode(mode) {
    this.weatherMode = mode;
    this.calculateAndDrawRoute();
  }

  renderSvgFallback(container) {
    container.innerHTML = `
      <div class="relative w-full h-full min-h-[460px] bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-white border border-slate-700">
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div class="relative z-10 text-center max-w-lg">
          <div class="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
          </div>
          <h3 class="text-xl font-bold mb-2">Interactive GIS Embankment Topology</h3>
          <p class="text-sm text-slate-300 mb-4">Displaying Satkhira & Khulna Coastal Polders: Live OSM walking path routing across mud embankments avoiding unbridged tidal rivers.</p>
          <div class="grid grid-cols-2 gap-3 text-left text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div><span class="text-slate-400">Current Polder:</span> <strong class="text-white">Polder 15 (Munshiganj)</strong></div>
            <div><span class="text-slate-400">Target Station:</span> <strong class="text-emerald-400">Solar RO Unit (142 mg/L Na+)</strong></div>
            <div><span class="text-slate-400">Embankment Path:</span> <strong class="text-white">1.4 km (Footpath)</strong></div>
            <div><span class="text-slate-400">Unbridged River Gap:</span> <strong class="text-terracotta">Avoided 800m Hazard</strong></div>
          </div>
        </div>
      </div>
    `;
  }
}

