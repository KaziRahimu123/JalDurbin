# JalDurbin (জলদূরবীন) | Women's Collection-Time & Maternal-Health Routing Engine
> **Track 3: Water Access Innovation** &bull; Coastal Southwest Bangladesh (Khulna & Satkhira)

JalDurbin is an AI and GIS routing platform designed to solve the dual crisis of **women's time poverty** and **salinity-induced maternal risk** across 66,234 coastal households in Bangladesh.

Inspired by modern disaster-intelligence platforms like FloodSense, JalDurbin is tailored to the Bengal Delta vernacular with a modern, high-contrast aesthetic and scientific rigor.

---

## 🌟 Key Features

1. **Maternal / Hypertension Safe Mode Filter**
   - Strictly filters out groundwater sources exceeding **$300\text{ mg/L}$ sodium ($Na^+$)**.
   - Prevents gestational hypertension and shields pregnant mothers against a **3.3x to 5.5x higher preeclampsia hazard**.
2. **Embankment Footpath Routing (OpenStreetMap vs. Naive Haversine)**
   - Replaces naive straight-line Haversine circles (which dangerously route women across unbridged 800m tidal rivers) with actual walkable polder dyke paths extracted from Geofabrik OSM Bangladesh.
3. **Dynamic Queue Times & Infrastructure Decay Engine**
   - Models what happens when a primary solar RO pump breaks down: women are rerouted to alternate stations while queue wait times dynamically surge from **15 mins to 45 mins** as pumps absorb neighbouring populations.
4. **Live Weather & Mud Slip Hazard Simulation**
   - Integrates with Open-Meteo logic to dynamically degrade pedestrian walking speed from **5 km/h to 2 km/h** during heavy coastal rains in Satkhira.
5. **Seawater-Intrusion Stoichiometric Conversion**
   - Bridges field data gaps in UNICEF MICS and DPHE-BGS surveys using peer-reviewed stoichiometric ratios:
     $$Na^+ \approx 0.55 \times Cl^- \quad \text{or} \quad Na^+ \approx 0.31 \times TDS$$
6. **Hybrid Field Worker Architecture (Blind Spot Fix)**
   - Designed for local community healthcare workers (BRAC Shasthya Kormis, NGO field officers) to query routes on behalf of rural mothers without smartphones, with offline PWA caching and automated SMS alerts.
7. **Humanitarian WASH CSR Alignment**
   - Aligned with the **Xylem Watermark & Americares** initiative supporting WASH infrastructure at 174 coastal healthcare facilities reaching 2.4M+ beneficiaries.

---

## 🔗 How to Connect Your Real Project App

When you are ready to link your actual project (e.g. deployed Streamlit dashboard, Vercel web app, or GitHub repository):

1. Open `index.html`.
2. Locate the project modal input at **Line 580**:
   ```html
   <input type="text" id="project-url-input" value="https://your-real-project-url.com" ...>
   ```
3. Update the value to your live URL.
4. You can also update the navigation button CTA in the header and hero buttons:
   ```html
   <a href="https://your-real-project-url.com" target="_blank" ...>Launch Project App</a>
   ```

---

## 🚀 How to Run Locally

You can open `index.html` directly in any web browser, or serve it with Python:

```bash
# Start local server
python3 -m http.server 3000

# Open in browser
open http://localhost:3000
```

---

## 📊 Ground-Truth Datasets Used

| Layer | Dataset | Source |
|---|---|---|
| **Water Points** | WPDX Bangladesh / REACH Initiative | [humdata.org/dataset/wpdx_bgd](https://data.humdata.org/dataset/wpdx_bgd) |
| **Lab Chemistry** | DPHE-BGS Survey & UNICEF MICS 2025 | [bgs.ac.uk](https://www.bgs.ac.uk/groundwater/download/dphe-bgs-national-hydrochemical-survey/) |
| **Salinity Grid** | High-Res Coastal Salinity Grid | [zenodo.org/records/14560019](https://zenodo.org/records/14560019) |
| **Climatology** | Historical Precipitation & Dry Windows | [climateknowledgeportal.worldbank.org](https://climateknowledgeportal.worldbank.org/) |
| **Footpaths** | OpenStreetMap Bangladesh Extracts | [download.geofabrik.de/asia/bangladesh.html](https://download.geofabrik.de/asia/bangladesh.html) |

---

## 🎨 Delta Vernacular Design System

- **Primary**: Deep Delta Teal (`#0B4F6C`)
- **Foliage Accent**: Riverine Emerald (`#14532D`, `#059669`)
- **Safety / Alerts**: Terracotta & Clay (`#C2410C`, `#DD6B20`)
- **Backgrounds**: Warm Sand & Off-White (`#FDFBF7`, `#F8FAFC`)
- **Typography**: Plus Jakarta Sans & Inter

