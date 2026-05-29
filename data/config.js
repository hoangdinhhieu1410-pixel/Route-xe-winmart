// ============================================
// 📊 CẤU HÌNH HỆ THỐNG - ROUTE OPTIMIZER
// Hỗ trợ multi-province: Nam Định + Hà Nam
// ============================================

const CONFIG = {
  // 🚛 Thông số xe tải (dùng chung)
  vehicle: {
    maxWeight: 1900,         // kg tổng tải trọng
    maxVolume: 15,           // khối
    winmartRatio: 0.7,       // 70% hàng Winmart
    otherShopRatio: 0.3,     // 30% hàng shop khác
    maxWinmartWeight: 1330,  // 1900 * 0.7 = 1330 kg
    otherShopTime: 180,      // 3 giờ = 180 phút cho hàng shop khác
  },

  // 📦 Thông số giao hàng (dùng chung)
  delivery: {
    avgWeightPerStop: 50,    // kg/điểm Winmart
    minTimePerStop: 30,      // phút tối thiểu
    maxTimePerStop: 45,      // phút tối đa
    avgTimePerStop: 37.5,    // phút trung bình
  },

  // ⏰ Thời gian làm việc (dùng chung)
  workday: {
    startHour: 7,            // 7:00 sáng
    endHour: 19,             // 19:00 tối
    totalMinutes: 720,       // 12 tiếng
    winmartMinutes: 540,     // 9 tiếng cho Winmart (trừ 3h shop khác)
  },

  // 🚗 Vận tốc ước tính theo khu vực (dùng chung)
  speed: {
    urban: 25,        // km/h nội thành
    suburban: 35,     // km/h vùng ven / thị trấn
    rural: 45,        // km/h nông thôn / liên huyện
    highway: 55,      // km/h quốc lộ
  },

  // 🎨 Màu sắc cho từng xe (tối đa 10 xe)
  routeColors: [
    '#667eea', '#f093fb', '#4fd1c5', '#f6ad55', '#fc8181',
    '#68d391', '#63b3ed', '#d53f8c', '#9f7aea', '#ed8936'
  ],

  // ============================================
  // 🗺️ CẤU HÌNH THEO TỈNH
  // ============================================
  provinces: {
    // ---- NAM ĐỊNH ----
    nam_dinh: {
      name: 'Nam Định',
      icon: '🏗️',
      mapCenter: [20.30, 106.20],
      mapZoom: 10,
      warehouses: [
        {
          id: 'kho_tp_nam_dinh',
          name: 'Kho TP Nam Định',
          lat: 20.4045748,
          lng: 106.147727,
          color: '#667eea',
          icon: '🏭'
        },
        {
          id: 'kho_hai_hau',
          name: 'Kho Hải Hậu',
          lat: 20.1065,
          lng: 106.255,
          color: '#f093fb',
          icon: '🏭'
        }
      ],
      urbanDistricts: ['TP. Nam Định'],
      // Kho Hải Hậu cố định 5 xe
      fixedVehicles: { 'kho_hai_hau': 5 },
      // Phân vùng kho thủ công
      warehouseAssignment: {
        'kho_tp_nam_dinh': ['TP. Nam Định', 'H. Nam Trực', 'H. Ý Yên', 'H. Vụ Bản'],
        'kho_hai_hau': ['H. Hải Hậu', 'H. Giao Thủy', 'H. Xuân Trường', 'H. Trực Ninh']
      },
      nghiaHungSplit: {
        north: [30, 56, 20, 42],  // → Kho TP NĐ
        south: [33, 34, 35, 36]   // → Kho Hải Hậu
      },
      getStores: () => STORES
    },

    // ---- HÀ NAM ----
    ha_nam: {
      name: 'Hà Nam',
      icon: '🏛️',
      mapCenter: [20.54, 105.95],
      mapZoom: 11,
      warehouses: [
        {
          id: 'kho_phu_ly',
          name: 'Kho TP Phủ Lý',
          lat: 20.534,
          lng: 105.912,
          color: '#4fd1c5',
          icon: '🏭'
        }
      ],
      urbanDistricts: ['TP. Phủ Lý'],
      fixedVehicles: {},      // Để thuật toán tự tính
      warehouseAssignment: {
        'kho_phu_ly': ['TP. Phủ Lý', 'H. Kim Bảng', 'TX. Duy Tiên', 'H. Thanh Liêm', 'H. Lý Nhân', 'H. Bình Lục']
      },
      getStores: () => HA_NAM_STORES
    },

    // ---- NINH BÌNH ----
    ninh_binh: {
      name: 'Ninh Bình',
      icon: '🏔️',
      mapCenter: [20.22, 105.92],
      mapZoom: 10,
      warehouses: [
        {
          id: 'kho_nho_quan',
          name: 'Kho Nho Quan',
          lat: 20.353386,
          lng: 105.794403,
          color: '#f6ad55',
          icon: '🏭'
        },
        {
          id: 'kho_yen_khanh',
          name: 'Kho Yên Khánh',
          lat: 20.180,
          lng: 106.050,
          color: '#fc8181',
          icon: '🏭'
        }
      ],
      urbanDistricts: ['TP. Ninh Bình', 'TP. Tam Điệp'],
      fixedVehicles: { 'kho_nho_quan': 5 },  // Nho Quan 5 xe cố định, Yên Khánh tự tính
      // Phân vùng theo yêu cầu
      warehouseAssignment: {
        'kho_nho_quan': ['H. Nho Quan', 'H. Gia Viễn', 'TP. Tam Điệp', 'TP. Hoa Lư', 'H. Hoa Lư', 'H. Lạc Thủy (HB)', 'H. Yên Thủy (HB)'],
        'kho_yen_khanh': ['TP. Ninh Bình', 'H. Yên Khánh', 'H. Yên Mô', 'H. Kim Sơn']
      },
      getStores: () => NINH_BINH_STORES
    },

    // ---- VĨNH PHÚC ----
    vinh_phuc: {
      name: 'Vĩnh Phúc',
      icon: '🏛️',
      mapCenter: [21.32, 105.55],
      mapZoom: 11,
      warehouses: [
        {
          id: 'kho_binh_xuyen',
          name: 'Kho Bình Xuyên',
          lat: 21.3055,
          lng: 105.6525,
          color: '#63b3ed',
          icon: '🏭'
        },
        {
          id: 'kho_tam_duong',
          name: 'Kho Tam Dương',
          lat: 21.360,
          lng: 105.530,
          color: '#9f7aea',
          icon: '🏭'
        }
      ],
      urbanDistricts: ['TP. Vĩnh Yên', 'TP. Phúc Yên'],
      fixedVehicles: { 'kho_binh_xuyen': 5, 'kho_tam_duong': 6 },
      warehouseAssignment: {
        'kho_binh_xuyen': ['H. Bình Xuyên', 'TP. Vĩnh Yên', 'TP. Phúc Yên', 'H. Yên Lạc'],
        'kho_tam_duong': ['H. Vĩnh Tường', 'H. Tam Dương', 'H. Lập Thạch', 'H. Sông Lô', 'H. Tam Đảo']
      },
      getStores: () => VINH_PHUC_STORES
    }
  },

  // Legacy: giữ lại cho backward compatibility
  warehouses: [
    { id: 'kho_tp_nam_dinh', name: 'Kho TP Nam Định', lat: 20.4045748, lng: 106.147727, color: '#667eea', icon: '🏭' },
    { id: 'kho_hai_hau', name: 'Kho Hải Hậu', lat: 20.1065, lng: 106.255, color: '#f093fb', icon: '🏭' }
  ]
};
