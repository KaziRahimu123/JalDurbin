import { STOICHIOMETRIC_RATIOS, REGIONAL_STATS } from './data.js';

export class StoichiometryEngine {
  constructor() {
    this.chlorideInput = document.getElementById('calc-chloride');
    this.tdsInput = document.getElementById('calc-tds');
    this.modeChlorideRadio = document.getElementById('mode-chloride');
    this.modeTdsRadio = document.getElementById('mode-tds');
    this.resultSodiumEl = document.getElementById('calc-result-sodium');
    this.resultBadgeEl = document.getElementById('calc-result-badge');
    this.resultAdviceEl = document.getElementById('calc-result-advice');
    this.gaugeNeedleEl = document.getElementById('calc-gauge-needle');

    this.activeMode = 'chloride'; // 'chloride' | 'tds'

    this.bindEvents();
    this.calculate();
  }

  bindEvents() {
    if (this.chlorideInput) {
      this.chlorideInput.addEventListener('input', () => this.calculate());
    }
    if (this.tdsInput) {
      this.tdsInput.addEventListener('input', () => this.calculate());
    }
    if (this.modeChlorideRadio) {
      this.modeChlorideRadio.addEventListener('change', () => {
        this.activeMode = 'chloride';
        this.toggleInputFields();
        this.calculate();
      });
    }
    if (this.modeTdsRadio) {
      this.modeTdsRadio.addEventListener('change', () => {
        this.activeMode = 'tds';
        this.toggleInputFields();
        this.calculate();
      });
    }

    // Preset Buttons
    const presetButtons = document.querySelectorAll('[data-preset-type]');
    presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-preset-type');
        const val = parseFloat(btn.getAttribute('data-preset-value'));
        
        if (type === 'chloride') {
          if (this.modeChlorideRadio) this.modeChlorideRadio.checked = true;
          this.activeMode = 'chloride';
          this.toggleInputFields();
          if (this.chlorideInput) this.chlorideInput.value = val;
        } else {
          if (this.modeTdsRadio) this.modeTdsRadio.checked = true;
          this.activeMode = 'tds';
          this.toggleInputFields();
          if (this.tdsInput) this.tdsInput.value = val;
        }
        this.calculate();
      });
    });
  }

  toggleInputFields() {
    const clContainer = document.getElementById('input-group-chloride');
    const tdsContainer = document.getElementById('input-group-tds');

    if (this.activeMode === 'chloride') {
      if (clContainer) clContainer.classList.remove('hidden');
      if (tdsContainer) tdsContainer.classList.add('hidden');
    } else {
      if (clContainer) clContainer.classList.add('hidden');
      if (tdsContainer) tdsContainer.classList.remove('hidden');
    }
  }

  calculate() {
    let estimatedSodium = 0;

    if (this.activeMode === 'chloride') {
      const cl = parseFloat(this.chlorideInput ? this.chlorideInput.value : 0) || 0;
      estimatedSodium = cl * STOICHIOMETRIC_RATIOS.sodiumFromChloride; // Na+ ≈ 0.55 * Cl-
    } else {
      const tds = parseFloat(this.tdsInput ? this.tdsInput.value : 0) || 0;
      estimatedSodium = tds * STOICHIOMETRIC_RATIOS.sodiumFromTDS; // Na+ ≈ 0.31 * TDS
    }

    estimatedSodium = Math.round(estimatedSodium);

    if (this.resultSodiumEl) {
      this.resultSodiumEl.innerText = `${estimatedSodium} mg/L`;
    }

    // Safety threshold assessment
    const isSafe = estimatedSodium < STOICHIOMETRIC_RATIOS.safeThresholdMgL;
    const isCritical = estimatedSodium >= 600;

    if (this.resultBadgeEl) {
      if (isSafe) {
        this.resultBadgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
        this.resultBadgeEl.innerText = 'SAFE FOR MATERNAL CONSUMPTION (< 300 mg/L)';
      } else if (isCritical) {
        this.resultBadgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300';
        this.resultBadgeEl.innerText = 'CRITICAL TOXICITY (≥ 600 mg/L)';
      } else {
        this.resultBadgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300';
        this.resultBadgeEl.innerText = 'HIGH PREGNANCY RISK (300 - 599 mg/L)';
      }
    }

    if (this.resultAdviceEl) {
      if (isSafe) {
        this.resultAdviceEl.innerHTML = `
          <strong class="text-emerald-700">Protected Source:</strong> Sodium is within maternal safety tolerances. Gestational blood pressure remains safeguarded, with virtually zero salinity-induced preeclampsia risk.
        `;
      } else if (isCritical) {
        this.resultAdviceEl.innerHTML = `
          <strong class="text-red-700">Emergency Warning:</strong> Exceeds maternal safety thresholds by over 200%. Regular ingestion triggers severe preeclampsia, placental hypoperfusion, and systemic maternal edema. <span class="underline">Banned by JalDurbin safe routing</span>.
        `;
      } else {
        this.resultAdviceEl.innerHTML = `
          <strong class="text-amber-700">Elevated Risk:</strong> Women consuming this water face a <strong>3.3x to 5.5x higher risk</strong> of developing gestational hypertension and preeclampsia. JalDurbin automatically reroutes users to alternative Solar RO or PSF stations.
        `;
      }
    }

    // Gauge Needle Rotation: 0 mg/L -> -90deg, 300 mg/L -> 0deg, 800+ mg/L -> +90deg
    if (this.gaugeNeedleEl) {
      const clampedVal = Math.min(Math.max(estimatedSodium, 0), 800);
      // Map 0 -> -90 deg, 800 -> 90 deg
      const degrees = ((clampedVal / 800) * 180) - 90;
      this.gaugeNeedleEl.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
    }
  }
}

