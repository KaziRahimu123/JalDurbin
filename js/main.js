import { JalDurbinMapEngine } from './map.js';
import { StoichiometryEngine } from './simulator.js';
import { REGIONAL_STATS } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Stoichiometry Calculator
  const stoichiometryCalc = new StoichiometryEngine();

  // 2. Route & Stats Callback handler
  function updateRouteStats(stats) {
    const destEl = document.getElementById('stat-target-name');
    const walkEl = document.getElementById('stat-walk-time');
    const queueEl = document.getElementById('stat-queue-time');
    const totalEl = document.getElementById('stat-total-time');
    const sodiumEl = document.getElementById('stat-sodium-level');
    const safetyBadgeEl = document.getElementById('stat-safety-badge');
    const haversineAlertEl = document.getElementById('stat-haversine-warning');
    const weatherNoticeEl = document.getElementById('stat-weather-notice');

    if (destEl) destEl.innerText = stats.targetPoint.name;
    if (walkEl) walkEl.innerText = `${stats.walkMinutes} min (${stats.actualFootpathDistanceKm} km walk)`;
    if (queueEl) {
      queueEl.innerText = `${stats.queueMin} min`;
      if (stats.pumpDecayActive) {
        queueEl.classList.add('text-red-600');
      } else {
        queueEl.classList.remove('text-red-600');
      }
    }
    if (totalEl) totalEl.innerText = `${stats.totalTripMinutes} min (Round trip + queue)`;
    
    if (sodiumEl) {
      sodiumEl.innerText = `${stats.targetPoint.sodium} mg/L Na+`;
      if (stats.targetPoint.sodium > 300) {
        sodiumEl.className = 'text-lg font-black text-red-600';
      } else {
        sodiumEl.className = 'text-lg font-black text-emerald-600';
      }
    }

    if (safetyBadgeEl) {
      if (stats.isSafe) {
        safetyBadgeEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
        safetyBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> MATERNAL SAFE (&lt; 300 mg/L)`;
      } else {
        safetyBadgeEl.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300';
        safetyBadgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span> DANGEROUS SALINITY (Blocked for Pregnancy)`;
      }
    }

    if (haversineAlertEl) {
      haversineAlertEl.innerHTML = `
        <span class="font-bold text-slate-700">OSM Footpath: ${stats.actualFootpathDistanceKm} km</span> vs. 
        <span class="text-slate-400 line-through">Haversine Straight-line: ${stats.haversineDistanceKm} km</span>
        <span class="block text-[11px] text-amber-700 mt-0.5">Haversine naive radius dangerously ignores the unbridged tidal river channel!</span>
      `;
    }

    if (weatherNoticeEl) {
      if (stats.weatherMode === 'monsoon') {
        weatherNoticeEl.classList.remove('hidden');
        weatherNoticeEl.innerHTML = `⚠️ Heavy rainfall active: Embankment clay mud reduces walk speed from 5.0 to <strong>2.0 km/h</strong> (+${Math.round(stats.walkMinutes * 0.6)} min delay).`;
      } else {
        weatherNoticeEl.classList.add('hidden');
      }
    }
  }

  // 3. Initialize Interactive Map
  const mapEngine = new JalDurbinMapEngine('map', updateRouteStats);

  // 4. Map UI Controls Binding
  const safeModeToggle = document.getElementById('toggle-maternal-safe');
  if (safeModeToggle) {
    safeModeToggle.addEventListener('change', (e) => {
      mapEngine.setMaternalSafeMode(e.target.checked);
    });
  }

  const pumpDecayToggle = document.getElementById('toggle-pump-decay');
  if (pumpDecayToggle) {
    pumpDecayToggle.addEventListener('change', (e) => {
      mapEngine.setPumpDecaySimulation(e.target.checked);
    });
  }

  const weatherSelect = document.getElementById('select-weather-sim');
  if (weatherSelect) {
    weatherSelect.addEventListener('change', (e) => {
      mapEngine.setWeatherMode(e.target.value);
    });
  }

  // 5. Regional Crisis Sub-district Selector
  const subdistrictButtons = document.querySelectorAll('[data-subdistrict]');
  const regionDataDisplay = {
    paikgachha: {
      name: "Paikgachha, Khulna",
      unavailability: "7.15 Months / Year",
      drySeasonSpike: "4,800 mg/L TDS",
      walkTime: "Up to 5.5 hours daily",
      riskNote: "Longest seasonal water deficit across coastal unions. Requires resilient solar RO and deep Pleistocene tapping."
    },
    shyamnagar: {
      name: "Shyamnagar, Satkhira",
      unavailability: "6.20 Months / Year",
      drySeasonSpike: "Up to 6,600 mg/L TDS (Severe)",
      walkTime: "Up to 6.0 hours daily",
      riskNote: "Extreme salinity spikes post-Aila/Amphan. Ingestion causes up to 5.5x higher gestational hypertension rates."
    },
    koyra: {
      name: "Koyra, Khulna",
      unavailability: "5.40 Months / Year",
      drySeasonSpike: "3,900 mg/L TDS",
      walkTime: "4.5 hours daily",
      riskNote: "21.6% of adults over 40 carry moderate-to-high 10-year stroke/cardiovascular risk due to chronic sodium ingestion."
    },
    assasuni: {
      name: "Assasuni, Satkhira",
      unavailability: "4.80 Months / Year",
      drySeasonSpike: "3,400 mg/L TDS",
      walkTime: "3.5 to 5 hours daily",
      riskNote: "Embankment breaches contaminate freshwater ponds. 80% of households rely on women trekking along damaged dykes."
    }
  };

  subdistrictButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-subdistrict');
      subdistrictButtons.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
      });
      btn.classList.add('bg-emerald-600', 'text-white', 'shadow-md');
      btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');

      const data = regionDataDisplay[key];
      if (data) {
        document.getElementById('region-name').innerText = data.name;
        document.getElementById('region-unavailability').innerText = data.unavailability;
        document.getElementById('region-spike').innerText = data.drySeasonSpike;
        document.getElementById('region-walk').innerText = data.walkTime;
        document.getElementById('region-note').innerText = data.riskNote;
      }
    });
  });

  // 6. Project Link Modal Handler (User requested linking real project later)
  const projectLaunchBtns = document.querySelectorAll('.action-launch-project');
  const projectModal = document.getElementById('project-link-modal');
  const closeModalBtn = document.getElementById('btn-close-modal');

  projectLaunchBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (projectModal) {
        projectModal.classList.remove('hidden');
        projectModal.classList.add('flex');
      }
    });
  });

  if (closeModalBtn && projectModal) {
    closeModalBtn.addEventListener('click', () => {
      projectModal.classList.add('hidden');
      projectModal.classList.remove('flex');
    });
  }

  // Close modal when clicking outside
  if (projectModal) {
    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        projectModal.classList.add('hidden');
        projectModal.classList.remove('flex');
      }
    });
  }

  // 7. Mobile Navigation Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Close mobile menu when link is clicked
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu) mobileMenu.classList.add('hidden');
    });
  });

  // 8. Dynamic counter animations
  const counterElements = document.querySelectorAll('[data-counter-target]');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-counter-target'));
        const suffix = el.getAttribute('data-counter-suffix') || '';
        let current = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.innerText = (Number.isInteger(target) ? Math.round(current).toLocaleString() : current.toFixed(1)) + suffix;
        }, 25);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  counterElements.forEach(el => observer.observe(el));
});

