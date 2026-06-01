// ============================================
// 🧮 VRP SOLVER v4 - Multi-Province
// Nam Định + Hà Nam
// ============================================

const VRPSolver = {

  // Khoảng cách Haversine (km)
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  roadDistance(lat1, lon1, lat2, lon2) {
    return this.haversineDistance(lat1, lon1, lat2, lon2) * 1.35;
  },

  estimateSpeed(fromDistrict, toDistrict, urbanDistricts) {
    const urbanList = urbanDistricts || ['TP. Nam Định'];
    const isUrban = (d) => urbanList.includes(d);
    if (isUrban(fromDistrict) && isUrban(toDistrict)) return CONFIG.speed.urban;
    if (isUrban(fromDistrict) || isUrban(toDistrict)) return CONFIG.speed.suburban;
    if (fromDistrict === toDistrict) return CONFIG.speed.suburban;
    return CONFIG.speed.rural;
  },

  travelTimeMinutes(distanceKm, speedKmh) {
    return (distanceKm / speedKmh) * 60;
  },

  // ==============================
  // 🏭 Phân bổ kho (tổng quát)
  // ==============================
  assignStoresToWarehouses(stores, provinceConfig) {
    const assignments = {};
    provinceConfig.warehouses.forEach(w => { assignments[w.id] = []; });

    stores.forEach(store => {
      let assignedTo = null;

      // Tìm kho theo district mapping
      for (const [whId, districts] of Object.entries(provinceConfig.warehouseAssignment)) {
        if (districts.includes(store.district)) {
          assignedTo = whId;
          break;
        }
      }

      // Xử lý đặc biệt: Nghĩa Hưng chia đôi (chỉ cho Nam Định)
      if (!assignedTo && store.district === 'H. Nghĩa Hưng' && provinceConfig.nghiaHungSplit) {
        if (provinceConfig.nghiaHungSplit.north.includes(store.id)) {
          assignedTo = 'kho_tp_nam_dinh';
        } else {
          assignedTo = 'kho_hai_hau';
        }
      }

      // Fallback: kho gần nhất
      if (!assignedTo) {
        let minDist = Infinity;
        provinceConfig.warehouses.forEach(w => {
          const d = this.haversineDistance(store.lat, store.lng, w.lat, w.lng);
          if (d < minDist) { minDist = d; assignedTo = w.id; }
        });
      }

      store.assignedWarehouse = assignedTo;
      const wh = provinceConfig.warehouses.find(w => w.id === assignedTo);
      store.distanceToWarehouse = this.haversineDistance(store.lat, store.lng, wh.lat, wh.lng);
      assignments[assignedTo].push(store);
    });

    return assignments;
  },

  // ==============================
  // 📦 GOM CỤM THEO HUYỆN — District-First Clustering
  // ==============================

  // Tính tâm (centroid) của 1 nhóm stores
  _centroid(stores) {
    const lat = stores.reduce((s, st) => s + st.lat, 0) / stores.length;
    const lng = stores.reduce((s, st) => s + st.lng, 0) / stores.length;
    return { lat, lng };
  },

  // Gom stores theo huyện
  _groupByDistrict(stores) {
    const groups = {};
    stores.forEach(s => {
      if (!groups[s.district]) groups[s.district] = [];
      groups[s.district].push(s);
    });
    return groups;
  },

  // Gộp huyện nhỏ (< minSize) vào huyện gần nhất
  _mergeSmallDistricts(districtGroups, minSize) {
    const keys = Object.keys(districtGroups);
    const centroids = {};
    keys.forEach(k => { centroids[k] = this._centroid(districtGroups[k]); });

    let merged = true;
    while (merged) {
      merged = false;
      const currentKeys = Object.keys(districtGroups);
      for (const key of currentKeys) {
        if (!districtGroups[key] || districtGroups[key].length >= minSize) continue;
        // Tìm huyện gần nhất để gộp
        let bestKey = null, bestDist = Infinity;
        for (const other of currentKeys) {
          if (other === key || !districtGroups[other]) continue;
          const c1 = centroids[key], c2 = centroids[other];
          const d = this.haversineDistance(c1.lat, c1.lng, c2.lat, c2.lng);
          if (d < bestDist) { bestDist = d; bestKey = other; }
        }
        if (bestKey) {
          districtGroups[bestKey] = districtGroups[bestKey].concat(districtGroups[key]);
          centroids[bestKey] = this._centroid(districtGroups[bestKey]);
          delete districtGroups[key];
          delete centroids[key];
          merged = true;
          break; // restart loop
        }
      }
    }
    return districtGroups;
  },

  // Kiểm tra 1 nhóm có vượt giới hạn xe không
  _exceedsLimits(stores, warehouse) {
    const MAX_KM = 110;
    const totalWeight = stores.reduce((s, st) => s + st.demand, 0);
    if (totalWeight > CONFIG.vehicle.maxWinmartWeight) return true;

    // Ước tính km: kho → tâm → vòng quanh → kho
    const centroid = this._centroid(stores);
    const toCenter = this.roadDistance(warehouse.lat, warehouse.lng, centroid.lat, centroid.lng);
    // Ước tính quãng đường nội vùng: ~2km mỗi điểm
    const internalKm = stores.length * 2;
    if ((toCenter * 2 + internalKm) > MAX_KM) return true;

    // Ước tính thời gian
    const avgSpeed = CONFIG.speed.suburban;
    const travelTime = ((toCenter * 2 + internalKm) / avgSpeed) * 60;
    const stopTime = stores.length * CONFIG.delivery.avgTimePerStop;
    if ((travelTime + stopTime) > CONFIG.workday.winmartMinutes) return true;

    return false;
  },

  // Chia 1 cụm lớn thành sub-zones theo góc từ tâm
  _splitCluster(stores, warehouse, maxPerSplit) {
    const centroid = this._centroid(stores);
    const withAngle = stores.map(s => ({
      ...s,
      _angle: Math.atan2(s.lng - centroid.lng, s.lat - centroid.lat)
    }));
    withAngle.sort((a, b) => a._angle - b._angle);

    const numSplits = Math.ceil(stores.length / maxPerSplit);
    const perSplit = Math.ceil(stores.length / numSplits);
    const splits = [];
    for (let i = 0; i < numSplits; i++) {
      const chunk = withAngle.slice(i * perSplit, Math.min((i + 1) * perSplit, stores.length));
      if (chunk.length > 0) splits.push(chunk);
    }
    return splits;
  },

  // ===== ENTRY POINT: Chia chuyến theo huyện =====
  buildTrips(stores, warehouse) {
    const MIN_MERGE = 3;     // Huyện < 3 stores → gộp
    const MAX_PER_VEHICLE = 12; // Tối đa ~12 điểm/xe

    // Bước 1: Gom theo huyện
    let districtGroups = this._groupByDistrict(stores);

    // Bước 1.5: Chia huyện rộng (spread > 15km) thành sub-zones
    const refined = {};
    Object.entries(districtGroups).forEach(([name, group]) => {
      const lats = group.map(s => s.lat), lngs = group.map(s => s.lng);
      const spreadKm = Math.max(
        (Math.max(...lats) - Math.min(...lats)) * 111,
        (Math.max(...lngs) - Math.min(...lngs)) * 104
      );
      if (spreadKm > 15 && group.length > 4) {
        const splits = this._splitCluster(group, warehouse, Math.ceil(group.length / 2));
        splits.forEach((s, i) => { refined[`${name}_${i+1}`] = s; });
      } else {
        refined[name] = group;
      }
    });
    districtGroups = refined;

    // Bước 2: Gộp huyện nhỏ
    districtGroups = this._mergeSmallDistricts(districtGroups, MIN_MERGE);

    // Bước 3: Chia cụm lớn + kiểm tra giới hạn
    const trips = [];
    Object.values(districtGroups).forEach(group => {
      if (group.length <= MAX_PER_VEHICLE && !this._exceedsLimits(group, warehouse)) {
        trips.push(group);
      } else {
        // Chia nhỏ hơn
        const maxPer = Math.min(MAX_PER_VEHICLE, Math.ceil(group.length / 2));
        const splits = this._splitCluster(group, warehouse, maxPer);
        splits.forEach(s => trips.push(s));
      }
    });

    // Sắp xếp trips theo khoảng cách tâm cụm đến kho (gần trước)
    trips.sort((a, b) => {
      const ca = this._centroid(a), cb = this._centroid(b);
      return this.haversineDistance(ca.lat, ca.lng, warehouse.lat, warehouse.lng)
           - this.haversineDistance(cb.lat, cb.lng, warehouse.lat, warehouse.lng);
    });

    return trips;
  },

  // Ước tính tổng km của 1 trip (kho → route → kho)
  _estimateTripKm(stores, warehouse) {
    if (stores.length === 0) return 0;
    // Sắp xếp tạm theo nearest neighbor để ước tính
    const route = this.nearestNeighborRoute([...stores], warehouse);
    let km = this.roadDistance(warehouse.lat, warehouse.lng, route[0].lat, route[0].lng);
    for (let i = 0; i < route.length - 1; i++) {
      km += this.roadDistance(route[i].lat, route[i].lng, route[i+1].lat, route[i+1].lng);
    }
    km += this.roadDistance(route[route.length-1].lat, route[route.length-1].lng, warehouse.lat, warehouse.lng);
    return km;
  },

  // Chia cố định N xe — Angular Sweep + Cân bằng km
  buildFixedTrips(stores, warehouse, numVehicles) {

    // ====== ANGULAR SWEEP: sắp stores theo góc từ kho, chia N phần ======
    const withAngle = stores.map(s => ({
      ...s,
      _angle: Math.atan2(s.lng - warehouse.lng, s.lat - warehouse.lat)
    }));
    withAngle.sort((a, b) => a._angle - b._angle);

    // Chia ban đầu: ưu tiên giữ cùng huyện trong 1 xe
    const trips = Array.from({ length: numVehicles }, () => []);
    const perVehicle = Math.ceil(stores.length / numVehicles);

    // Gom theo huyện trước, sắp theo góc trung bình
    const districtGroups = {};
    withAngle.forEach(s => {
      if (!districtGroups[s.district]) districtGroups[s.district] = [];
      districtGroups[s.district].push(s);
    });

    // Sắp huyện theo góc trung bình
    const sortedDistricts = Object.entries(districtGroups).map(([name, group]) => {
      const avgAngle = group.reduce((s, st) => s + st._angle, 0) / group.length;
      return { name, stores: group, avgAngle };
    });
    sortedDistricts.sort((a, b) => a.avgAngle - b.avgAngle);

    // Phân bổ huyện vào xe — xe đầy nhất sẽ không nhận thêm
    let vehicleIdx = 0;
    sortedDistricts.forEach(district => {
      // Nếu xe hiện tại đã đầy, chuyển sang xe tiếp
      while (vehicleIdx < numVehicles - 1 && trips[vehicleIdx].length >= perVehicle) {
        vehicleIdx++;
      }
      trips[vehicleIdx] = trips[vehicleIdx].concat(district.stores);
    });

    // ====== CÂN BẰNG: swap stores giữa xe liền kề để giảm max km ======
    for (let iter = 0; iter < 10; iter++) {
      let improved = false;

      for (let i = 0; i < trips.length; i++) {
        if (trips[i].length <= 1) continue;
        const kmI = this._estimateTripKm(trips[i], warehouse);

        // Thử chuyển store xa nhất sang xe liền kề có km thấp hơn
        if (kmI > 85) {
          // Tìm store xa nhất từ tâm xe i
          const centroid = this._centroid(trips[i]);
          let worstIdx = 0, worstDist = 0;
          trips[i].forEach((s, idx) => {
            const d = this.haversineDistance(s.lat, s.lng, centroid.lat, centroid.lng);
            if (d > worstDist) { worstDist = d; worstIdx = idx; }
          });

          // Thử chuyển sang xe có km thấp nhất VÀ gần nhất
          let bestTarget = -1, bestScore = Infinity;
          for (let j = 0; j < trips.length; j++) {
            if (j === i) continue;
            const kmJ = this._estimateTripKm(trips[j], warehouse);
            if (kmJ >= kmI) continue; // Chỉ chuyển sang xe có km thấp hơn

            const jCentroid = trips[j].length > 0 ? this._centroid(trips[j]) : warehouse;
            const distToStore = this.haversineDistance(
              trips[i][worstIdx].lat, trips[i][worstIdx].lng,
              jCentroid.lat, jCentroid.lng
            );
            const newKmJ = kmJ + distToStore * 2.5; // Ước tính km mới
            if (newKmJ < 95 && newKmJ < bestScore) {
              bestScore = newKmJ;
              bestTarget = j;
            }
          }

          if (bestTarget >= 0) {
            const moved = trips[i].splice(worstIdx, 1)[0];
            trips[bestTarget].push(moved);
            improved = true;
          }
        }
      }
      if (!improved) break;
    }

    return trips.filter(t => t.length > 0);
  },

  nearestNeighborRoute(stores, warehouse) {
    const route = [];
    const unvisited = [...stores];
    let current = { lat: warehouse.lat, lng: warehouse.lng, district: warehouse.name };
    while (unvisited.length > 0) {
      let minDist = Infinity, nearestIdx = 0;
      for (let i = 0; i < unvisited.length; i++) {
        const d = this.roadDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
        if (d < minDist) { minDist = d; nearestIdx = i; }
      }
      current = unvisited[nearestIdx];
      route.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    return route;
  },

  twoOptImprove(route, warehouse) {
    let improved = true, bestRoute = [...route];
    const totalDist = (r) => {
      let d = this.roadDistance(warehouse.lat, warehouse.lng, r[0].lat, r[0].lng);
      for (let i = 0; i < r.length - 1; i++)
        d += this.roadDistance(r[i].lat, r[i].lng, r[i + 1].lat, r[i + 1].lng);
      d += this.roadDistance(r[r.length - 1].lat, r[r.length - 1].lng, warehouse.lat, warehouse.lng);
      return d;
    };
    let bestDist = totalDist(bestRoute), iterations = 0;
    while (improved && iterations < 100) {
      improved = false; iterations++;
      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          const newRoute = [...bestRoute];
          newRoute.splice(i + 1, j - i, ...newRoute.slice(i + 1, j + 1).reverse());
          const newDist = totalDist(newRoute);
          if (newDist < bestDist - 0.01) {
            bestRoute = newRoute; bestDist = newDist; improved = true;
          }
        }
      }
    }
    return bestRoute;
  },

  calculateRouteDetails(route, warehouse, vehicleId, color, urbanDistricts) {
    const details = [];
    let cumulativeDistance = 0, currentTime = CONFIG.workday.startHour * 60;
    let totalWeight = 0;
    const districts = new Set();
    const urbanList = urbanDistricts || ['TP. Nam Định'];

    for (let i = 0; i < route.length; i++) {
      const store = route[i];
      let distFromPrev, speed;
      if (i === 0) {
        distFromPrev = this.roadDistance(warehouse.lat, warehouse.lng, store.lat, store.lng);
        speed = this.estimateSpeed(urbanList[0], store.district, urbanList);
      } else {
        distFromPrev = this.roadDistance(route[i - 1].lat, route[i - 1].lng, store.lat, store.lng);
        speed = this.estimateSpeed(route[i - 1].district, store.district, urbanList);
      }
      const travelTime = this.travelTimeMinutes(distFromPrev, speed);
      cumulativeDistance += distFromPrev;
      currentTime += travelTime;
      totalWeight += store.demand;
      districts.add(store.district);

      const arrH = Math.floor(currentTime / 60), arrM = Math.round(currentTime % 60);
      const depTime = currentTime + CONFIG.delivery.avgTimePerStop;
      const depH = Math.floor(depTime / 60), depM = Math.round(depTime % 60);

      details.push({
        store, distanceFromPrev: Math.round(distFromPrev * 10) / 10,
        cumulativeDistance: Math.round(cumulativeDistance * 10) / 10,
        travelTimeMin: Math.round(travelTime * 10) / 10,
        arrivalTime: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
        departureTime: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
        speed
      });
      currentTime = depTime;
    }

    const lastStore = route[route.length - 1];
    const returnDist = this.roadDistance(lastStore.lat, lastStore.lng, warehouse.lat, warehouse.lng);
    const returnSpeed = this.estimateSpeed(lastStore.district, urbanList[0], urbanList);
    const returnTravelTime = this.travelTimeMinutes(returnDist, returnSpeed);
    const returnTime = currentTime + returnTravelTime;
    const retH = Math.floor(returnTime / 60), retM = Math.round(returnTime % 60);

    return {
      id: vehicleId, warehouseId: warehouse.id, warehouseName: warehouse.name,
      warehouseColor: warehouse.color, color,
      stores: details,
      totalDistance: Math.round((cumulativeDistance + returnDist) * 10) / 10,
      routeDistance: Math.round(cumulativeDistance * 10) / 10,
      returnDistance: Math.round(returnDist * 10) / 10,
      totalTime: Math.round(currentTime - CONFIG.workday.startHour * 60 + returnTravelTime),
      totalWeight, totalStops: route.length,
      districts: [...districts],
      returnTime: `${String(retH).padStart(2, '0')}:${String(retM).padStart(2, '0')}`,
      startTime: `${String(CONFIG.workday.startHour).padStart(2, '0')}:00`
    };
  },

  // ==============================
  // 🚛 GIẢI BÀI TOÁN CHÍNH (multi-province)
  // ==============================
  solve(provinceKey) {
    const pKey = provinceKey || 'nam_dinh';
    const pConfig = CONFIG.provinces[pKey];
    const stores = pConfig.getStores();
    const urbanDistricts = pConfig.urbanDistricts;

    console.time(`⏱️ VRP Solver - ${pConfig.name}`);
    console.log(`🚛 Tối ưu lộ trình: ${pConfig.name} (${stores.length} cửa hàng)...`);

    const assignments = this.assignStoresToWarehouses(stores, pConfig);

    const vehicles = [];
    let vehicleId = 1, colorIdx = 0, totalDistance = 0;

    pConfig.warehouses.forEach(warehouse => {
      const warehouseStores = assignments[warehouse.id];
      if (warehouseStores.length === 0) return;

      let trips;
      const fixedCount = pConfig.fixedVehicles?.[warehouse.id];
      if (fixedCount) {
        trips = this.buildFixedTrips(warehouseStores, warehouse, fixedCount);
        console.log(`🏭 ${warehouse.name}: ${fixedCount} xe (cố định), ${warehouseStores.length} cửa hàng`);
      } else {
        trips = this.buildTrips(warehouseStores, warehouse);
        console.log(`🏭 ${warehouse.name}: ${trips.length} chuyến, ${warehouseStores.length} cửa hàng`);
      }

      trips.forEach(trip => {
        let route = this.nearestNeighborRoute(trip, warehouse);
        route = this.twoOptImprove(route, warehouse);
        const color = CONFIG.routeColors[colorIdx % CONFIG.routeColors.length];
        const details = this.calculateRouteDetails(route, warehouse, vehicleId, color, urbanDistricts);
        vehicles.push(details);
        totalDistance += details.totalDistance;
        vehicleId++; colorIdx++;
      });
    });

    const summary = {
      totalVehicles: vehicles.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalStores: stores.length,
      avgDistancePerVehicle: Math.round(totalDistance / vehicles.length * 10) / 10,
      avgStopsPerVehicle: Math.round(stores.length / vehicles.length * 10) / 10,
      provinceName: pConfig.name,
      warehouseBreakdown: {}
    };

    pConfig.warehouses.forEach(w => {
      const wv = vehicles.filter(v => v.warehouseId === w.id);
      summary.warehouseBreakdown[w.id] = {
        name: w.name, color: w.color, vehicles: wv.length,
        stores: wv.reduce((s, v) => s + v.totalStops, 0),
        distance: Math.round(wv.reduce((s, v) => s + v.totalDistance, 0) * 10) / 10
      };
    });

    console.log(`✅ ${pConfig.name}: ${summary.totalVehicles} xe, ${summary.totalDistance} km`);
    console.timeEnd(`⏱️ VRP Solver - ${pConfig.name}`);
    return { vehicles, summary, provinceKey: pKey, provinceConfig: pConfig };
  }
};
