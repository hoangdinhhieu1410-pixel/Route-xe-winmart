// ============================================
// 🗺️ MAP CONTROLLER - Bản đồ tối ưu, dễ nhìn
// ============================================

const MapController = {
  map: null,
  routeLayerGroups: {},  // vehicleId -> LayerGroup
  allRoutesGroup: null,
  activeVehicleId: null,

  // ==============================
  // Khởi tạo bản đồ
  // ==============================
  init(center, zoom) {
    const c = center || [20.30, 106.20];
    const z = zoom || 10;

    // Nếu map đã tồn tại, chỉ cần clear + setView
    if (this.map) {
      this.clearAll();
      // Xóa warehouse markers
      this.map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.LayerGroup) {
          if (layer !== this.allRoutesGroup) {
            this.map.removeLayer(layer);
          }
        }
      });
      this.map.setView(c, z);
      if (!this.allRoutesGroup) {
        this.allRoutesGroup = L.layerGroup().addTo(this.map);
      }
      return;
    }

    this.map = L.map('map', {
      zoomControl: false,
      attributionControl: true
    }).setView(c, z);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // CartoDB Voyager (sáng hơn, rõ ràng hơn)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.map);

    this.allRoutesGroup = L.layerGroup().addTo(this.map);
  },

  // ==============================
  // Đặt view bản đồ
  // ==============================
  setView(lat, lng, zoom) {
    if (this.map) {
      this.map.setView([lat, lng], zoom);
    }
  },

  // ==============================
  // Xóa tất cả
  // ==============================
  clearAll() {
    if (this.allRoutesGroup) this.allRoutesGroup.clearLayers();
    this.routeLayerGroups = {};
    this.activeVehicleId = null;
  },

  // ==============================
  // Vẽ marker kho hàng (luôn hiển thị)
  // ==============================
  addWarehouseMarkers(warehouses) {
    const whs = warehouses || CONFIG.warehouses;
    whs.forEach(w => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="warehouse-marker" style="background:${w.color}">🏭</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -26]
      });

      L.marker([w.lat, w.lng], { icon, zIndexOffset: 2000 })
        .addTo(this.map)
        .bindPopup(`
          <div class="popup-title">🏭 ${w.name}</div>
          <div class="popup-address">Tọa độ: ${w.lat.toFixed(6)}, ${w.lng.toFixed(6)}</div>
        `, { className: 'custom-popup' });
    });
  },

  // ==============================
  // Vẽ thêm Bưu Cục + Winmart lên bản đồ route
  // ==============================
  extraMarkersGroup: null,

  addExtraMarkers(provinceName) {
    // Remove old extra markers
    if (this.extraMarkersGroup) {
      this.map.removeLayer(this.extraMarkersGroup);
    }
    this.extraMarkersGroup = L.layerGroup().addTo(this.map);

    const provName = provinceName; // e.g. "Nam Định"

    // --- Bưu Cục markers (from GHN_WAREHOUSES) ---
    if (typeof GHN_WAREHOUSES !== 'undefined') {
      const bcList = GHN_WAREHOUSES.filter(w =>
        w.type === 'BC' && w.province === provName
      );
      bcList.forEach(bc => {
        const icon = L.divIcon({
          className: 'wh-marker-bc-route',
          html: `<div style="
            width:14px; height:14px; border-radius:50%;
            background:#00E5FF; border:2px solid #fff;
            box-shadow: 0 0 8px #00E5FF90;
            display:flex; align-items:center; justify-content:center;
          "><div style="width:4px;height:4px;border-radius:50%;background:#fff"></div></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker([bc.lat, bc.lng], { icon, zIndexOffset: 500 })
          .addTo(this.extraMarkersGroup)
          .bindPopup(`
            <div class="popup-title">📮 ${bc.name}</div>
            <div class="popup-address">Bưu Cục • ${bc.district}</div>
          `, { className: 'custom-popup' });
      });
    }

    // --- Winmart store markers ---
    const wmSource = (typeof WINMART_STORES_ROUTE !== 'undefined') ? WINMART_STORES_ROUTE
                   : (typeof WINMART_STORES !== 'undefined') ? WINMART_STORES : [];
    if (wmSource.length) {
      const wmList = wmSource.filter(s => s.province === provName);
      wmList.forEach(wm => {
        const icon = L.divIcon({
          className: 'wh-marker-wm-route',
          html: `<div style="width:14px;height:14px;">
            <svg viewBox="0 0 14 14" width="14" height="14">
              <polygon points="7,0.5 9,4.5 13.5,5 10,8 11,12.5 7,10.5 3,12.5 4,8 0.5,5 5,4.5"
                fill="#FF1493" stroke="#fff" stroke-width="0.8"/>
            </svg></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker([wm.lat, wm.lng], { icon, zIndexOffset: 400 })
          .addTo(this.extraMarkersGroup)
          .bindPopup(`
            <div class="popup-title">🏪 ${wm.name.replace(/,$/, '')}</div>
            <div class="popup-address">Cửa hàng Winmart</div>
          `, { className: 'custom-popup' });
      });
    }
  },


  // ==============================
  drawRoutes(solution) {
    this.clearAll();
    this._currentSolution = solution;

    const pConfig = solution.provinceConfig || CONFIG.provinces['nam_dinh'];

    solution.vehicles.forEach((vehicle) => {
      const warehouse = pConfig.warehouses.find(w => w.id === vehicle.warehouseId);
      if (!warehouse) return;

      const group = L.layerGroup();

      // ---- Polyline route ----
      const latlngs = [
        [warehouse.lat, warehouse.lng],
        ...vehicle.stores.map(s => [s.store.lat, s.store.lng]),
        [warehouse.lat, warehouse.lng]
      ];

      const polyline = L.polyline(latlngs, {
        color: vehicle.color,
        weight: 4,
        opacity: 0.85,
        smoothFactor: 1.5,
        lineCap: 'round',
        lineJoin: 'round'
      });
      group.addLayer(polyline);

      // ---- Mũi tên chỉ hướng (chỉ khi có plugin) ----
      if (typeof L.polylineDecorator === 'function') {
        try {
          const arrowHead = L.polylineDecorator(polyline, {
            patterns: [{
              offset: '30%',
              repeat: 120,
              symbol: L.Symbol.arrowHead({
                pixelSize: 10,
                polygon: false,
                pathOptions: { color: vehicle.color, weight: 2, opacity: 0.7 }
              })
            }]
          });
          group.addLayer(arrowHead);
        } catch(e) { /* plugin not available */ }
      }


      // ---- Store markers (nhỏ gọn, rõ ràng) ----
      vehicle.stores.forEach((stop, idx) => {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="store-marker-clean" style="--clr:${vehicle.color}">${idx + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          popupAnchor: [0, -14]
        });

        const marker = L.marker([stop.store.lat, stop.store.lng], { icon, zIndexOffset: 500 })
          .bindPopup(`
            <div class="popup-title">🛒 ${stop.store.name}</div>
            <div class="popup-address">${stop.store.address}, ${stop.store.district}</div>
            <div class="popup-meta">
              <span>🚛 Xe ${vehicle.id}</span>
              <span>📍 ${stop.cumulativeDistance} km</span>
              <span>⏰ Đến: ${stop.arrivalTime} | Rời: ${stop.departureTime}</span>
            </div>
          `, { className: 'custom-popup', maxWidth: 320 });

        group.addLayer(marker);
      });

      // ---- Nhãn xe ở giữa route ----
      const midIdx = Math.floor(vehicle.stores.length / 2);
      if (vehicle.stores[midIdx]) {
        const labelIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div class="route-label" style="background:${vehicle.color}">Xe ${vehicle.id}</div>`,
          iconSize: [50, 20],
          iconAnchor: [25, 10]
        });
        const labelMarker = L.marker(
          [vehicle.stores[midIdx].store.lat, vehicle.stores[midIdx].store.lng],
          { icon: labelIcon, zIndexOffset: 1500, interactive: false }
        );
        group.addLayer(labelMarker);
      }

      this.routeLayerGroups[vehicle.id] = group;
      this.allRoutesGroup.addLayer(group);
    });
  },

  // ==============================
  // Hiển thị CHỈ 1 xe (ẩn các xe khác)
  // ==============================
  showOnlyVehicle(vehicleId) {
    this.activeVehicleId = vehicleId;
    Object.keys(this.routeLayerGroups).forEach(id => {
      const vid = parseInt(id);
      const group = this.routeLayerGroups[vid];
      if (vid === vehicleId) {
        if (!this.allRoutesGroup.hasLayer(group)) {
          this.allRoutesGroup.addLayer(group);
        }
        // Bold route
        group.eachLayer(layer => {
          if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            layer.setStyle({ weight: 5, opacity: 1 });
          }
        });
      } else {
        if (this.allRoutesGroup.hasLayer(group)) {
          this.allRoutesGroup.removeLayer(group);
        }
      }
    });

    // Zoom vào xe đó
    const group = this.routeLayerGroups[vehicleId];
    if (group) {
      const bounds = L.latLngBounds([]);
      group.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          bounds.extend(layer.getLatLng());
        } else if (layer instanceof L.Polyline) {
          bounds.extend(layer.getBounds());
        }
      });
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    }
  },

  // ==============================
  // Hiển thị TẤT CẢ xe
  // ==============================
  showAllVehicles() {
    this.activeVehicleId = null;
    Object.keys(this.routeLayerGroups).forEach(id => {
      const group = this.routeLayerGroups[parseInt(id)];
      if (!this.allRoutesGroup.hasLayer(group)) {
        this.allRoutesGroup.addLayer(group);
      }
      group.eachLayer(layer => {
        if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          layer.setStyle({ weight: 4, opacity: 0.85 });
        }
      });
    });
  },

  // ==============================
  // Toggle 1 xe (click lần 2 thì show all)
  // ==============================
  toggleVehicle(vehicleId) {
    if (this.activeVehicleId === vehicleId) {
      this.showAllVehicles();
      this.fitAll();
      return false; // deselected
    } else {
      this.showOnlyVehicle(vehicleId);
      return true; // selected
    }
  },

  // ==============================
  // Hiển thị NHIỀU xe (ẩn các xe khác)
  // ==============================
  showSelectedVehicles(vehicleIds) {
    if (!vehicleIds || vehicleIds.length === 0) {
      this.showAllVehicles();
      return;
    }
    const idSet = new Set(vehicleIds);
    this.activeVehicleId = null;
    const bounds = L.latLngBounds([]);

    Object.keys(this.routeLayerGroups).forEach(id => {
      const vid = parseInt(id);
      const group = this.routeLayerGroups[vid];
      if (idSet.has(vid)) {
        if (!this.allRoutesGroup.hasLayer(group)) {
          this.allRoutesGroup.addLayer(group);
        }
        group.eachLayer(layer => {
          if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
            layer.setStyle({ weight: 5, opacity: 1 });
          }
          if (layer instanceof L.Marker) bounds.extend(layer.getLatLng());
          else if (layer instanceof L.Polyline) bounds.extend(layer.getBounds());
        });
      } else {
        if (this.allRoutesGroup.hasLayer(group)) {
          this.allRoutesGroup.removeLayer(group);
        }
      }
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  },

  // ==============================
  // Fit toàn bộ
  // ==============================
  fitAll(stores, warehouses) {
    const allPoints = [];
    const whs = warehouses || CONFIG.warehouses;
    const sts = stores || STORES;
    whs.forEach(w => allPoints.push([w.lat, w.lng]));
    sts.forEach(s => allPoints.push([s.lat, s.lng]));
    if (allPoints.length > 0) {
      this.map.fitBounds(allPoints, { padding: [30, 30] });
    }
  }
};
