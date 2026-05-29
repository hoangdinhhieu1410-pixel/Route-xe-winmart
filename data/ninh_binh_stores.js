// ============================================
// 🏪 CỬA HÀNG WINMART - NINH BÌNH + HOÀ BÌNH (60 cửa hàng)
// ============================================

const NINH_BINH_STORES = [
  // ===== TP. Ninh Bình (7) =====
  { id: 1, name: 'WM+ NBH 106 Đường 30/6', lat: 20.246748, lng: 105.972567, district: 'TP. Ninh Bình', address: '106 Đường 30/6, P. Nam Thành', demand: 50 },
  { id: 2, name: 'WM+ NBH 126 Xuân Thành', lat: 20.2603, lng: 105.965, district: 'TP. Ninh Bình', address: '126 Xuân Thành, P. Tân Thành', demand: 50 },
  { id: 3, name: 'WM+ NBH 278 Hải Thượng Lãn Ông', lat: 20.2499, lng: 105.966, district: 'TP. Ninh Bình', address: '278 Hải Thượng Lãn Ông, P. Phúc Thành', demand: 50 },
  { id: 4, name: 'WM+ NBH 28 Hoàng Hoa Thám', lat: 20.2517, lng: 105.978, district: 'TP. Ninh Bình', address: '28 Hoàng Hoa Thám, P. Thanh Bình', demand: 50 },
  { id: 5, name: 'WM+ NBH 518 Nguyễn Công Trứ', lat: 20.2456, lng: 105.9896, district: 'TP. Ninh Bình', address: '518 Nguyễn Công Trứ, P. Ninh Sơn', demand: 50 },
  { id: 6, name: 'WM+ NBH 263 Trần Hưng Đạo', lat: 20.280623, lng: 105.961346, district: 'TP. Ninh Bình', address: '263 Trần Hưng Đạo, P. Ninh Khánh', demand: 50 },
  { id: 7, name: 'WM+ NBH 52 Vân Giang', lat: 20.254646, lng: 105.974252, district: 'TP. Ninh Bình', address: '52 Vân Giang, P. Vân Giang', demand: 50 },
  { id: 8, name: 'WM+ NBH Phố 10, Đông Thành', lat: 20.261938, lng: 105.970038, district: 'TP. Ninh Bình', address: 'Phố 10, P. Đông Thành', demand: 50 },

  // ===== TP. Tam Điệp (5) =====
  { id: 9, name: 'WM+ NBH 93 Đồng Giao', lat: 20.1570, lng: 105.9105, district: 'TP. Tam Điệp', address: '93 Đồng Giao, P. Bắc Sơn', demand: 50 },
  { id: 10, name: 'WM+ NBH 832 Quang Trung', lat: 20.15067, lng: 105.901777, district: 'TP. Tam Điệp', address: '832 Quang Trung, P. Tây Sơn', demand: 50 },
  { id: 11, name: 'WM+ NBH 73 Ngô Thì Nhậm', lat: 20.1534, lng: 105.92, district: 'TP. Tam Điệp', address: '73 Ngô Thì Nhậm, P. Trung Sơn', demand: 50 },
  { id: 12, name: 'WM+ NBH 105 Trần Phú', lat: 20.160257, lng: 105.918168, district: 'TP. Tam Điệp', address: '105 Trần Phú, P. Bắc Sơn', demand: 50 },
  { id: 13, name: 'WM+ NBH 10 Núi Vàng', lat: 20.1539, lng: 105.9140, district: 'TP. Tam Điệp', address: '10 Núi Vàng, P. Trung Sơn', demand: 50 },
  { id: 14, name: 'WM+ NBH 62 Thiên Quan', lat: 20.1632, lng: 105.9282, district: 'TP. Tam Điệp', address: '62 Thiên Quan, P. Yên Sơn', demand: 50 },

  // ===== TP. Hoa Lư (2) =====
  { id: 15, name: 'WM+ NBH 69 Nguyễn Huệ', lat: 20.2481, lng: 105.9748, district: 'TP. Hoa Lư', address: '69 Nguyễn Huệ, P. Nam Bình', demand: 50 },
  { id: 16, name: 'WM+ NBH 178 Xuân Thành, Hoa Lư', lat: 20.2595, lng: 105.9627, district: 'TP. Hoa Lư', address: '178 Xuân Thành, P. Hoa Lư', demand: 50 },

  // ===== H. Hoa Lư (4) =====
  { id: 17, name: 'WM+ NBH Văn Lâm, Hoa Lư', lat: 20.214677, lng: 105.935277, district: 'H. Hoa Lư', address: 'Thôn Văn Lâm, Xã Ninh Hải', demand: 50 },
  { id: 18, name: 'WM+ NBH Thôn Trung, Trường Yên', lat: 20.2909, lng: 105.9068, district: 'H. Hoa Lư', address: 'Thôn Trung, Xã Trường Yên', demand: 50 },
  { id: 19, name: 'WM+ NBH Khê Hạ, Hoa Lư', lat: 20.236101, lng: 105.940711, district: 'H. Hoa Lư', address: 'TDP Khê Hạ, P. Hoa Lư', demand: 50 },
  { id: 20, name: 'WM+ NBH Quỳnh Phong 3, Tây Hoa Lư', lat: 20.2226, lng: 105.8432, district: 'H. Nho Quan', address: 'TDP Quỳnh Phong 3, P. Tây Hoa Lư', demand: 50 },

  // ===== H. Yên Khánh (5) =====
  { id: 21, name: 'WM+ NBH Phố 3, TT Yên Ninh', lat: 20.180922, lng: 106.064212, district: 'H. Yên Khánh', address: 'Phố 3, TT Yên Ninh', demand: 50 },
  { id: 22, name: 'WM+ NBH Phú Tân, Yên Khánh', lat: 20.229787, lng: 106.025509, district: 'H. Yên Khánh', address: 'Phố Phú Tân, P. Đông Hoa Lư', demand: 50 },
  { id: 23, name: 'WM+ NBH Xóm 2, Khánh Hội', lat: 20.1808, lng: 106.0952, district: 'H. Yên Khánh', address: 'Xóm 2, Xã Khánh Hội', demand: 50 },
  { id: 24, name: 'WM+ NBH Xóm 1, Khánh Thiện', lat: 20.2135, lng: 106.1008, district: 'H. Yên Khánh', address: 'Xóm 1, Xã Khánh Thiện', demand: 50 },
  { id: 25, name: 'WM+ NBH 132 Thôn Bàng Lân', lat: 20.1786, lng: 106.0606, district: 'H. Yên Khánh', address: '132 Thôn Bàng Lân, Xã Yên Khánh', demand: 50 },
  { id: 26, name: 'WM+ NBH TDP Xuân, Đông Hoa Lư', lat: 20.2227, lng: 106.0076, district: 'H. Yên Khánh', address: 'TDP Xuân, P. Đông Hoa Lư', demand: 50 },

  // ===== H. Yên Mô (7) =====
  { id: 27, name: 'WM+ NBH Phú Mỹ, Yên Mô', lat: 20.1432, lng: 106.0278, district: 'H. Yên Mô', address: 'Xóm Phú Mỹ, Xã Yên Phong', demand: 50 },
  { id: 28, name: 'WM+ NBH 399 Phạm Thận Duật, Yên Mô', lat: 20.1522, lng: 106.0183, district: 'H. Yên Mô', address: 'Đường 480, Xã Yên Mô', demand: 50 },
  { id: 29, name: 'WM+ NBH Đông Đoài, Yên Mạc', lat: 20.0889, lng: 106.0213, district: 'H. Yên Mô', address: 'Thôn Đông Đoài, Xã Yên Mạc', demand: 50 },
  { id: 30, name: 'WM+ NBH Xóm 1 Đông Thôn', lat: 20.090169, lng: 106.00675, district: 'H. Yên Mô', address: 'Xóm 1, Xã Đồng Thái', demand: 50 },
  { id: 31, name: 'WM+ NBH Xóm Nam Lộc, Yên Từ', lat: 20.112921, lng: 106.032086, district: 'H. Yên Mô', address: 'Xóm Nam Lộc, Xã Yên Từ', demand: 50 },
  { id: 32, name: 'WM+ NBH Xóm 3 Đông Sơn', lat: 20.1057, lng: 106.0181, district: 'H. Yên Mô', address: 'Xóm 3, Xã Yên Mạc', demand: 50 },

  // ===== H. Kim Sơn (8) =====
  { id: 33, name: 'WM+ NBH Số 8 Trì Chính', lat: 20.0932, lng: 106.0896, district: 'H. Kim Sơn', address: 'Phố Trì Chính, TT Phát Diệm', demand: 50 },
  { id: 34, name: 'WM+ NBH Xóm 5, Cồn Thoi', lat: 19.9946, lng: 106.0708, district: 'H. Kim Sơn', address: 'Xóm 5, Xã Cồn Thoi', demand: 50 },
  { id: 35, name: 'WM+ NBH 09 Năm Dân', lat: 20.090828, lng: 106.08651, district: 'H. Kim Sơn', address: 'Phố Năm Dân, Xã Phát Diệm', demand: 50 },
  { id: 36, name: 'WM+ NBH Xóm 3 Như Hoà, Quang Thiện', lat: 20.101823, lng: 106.109313, district: 'H. Kim Sơn', address: 'Xóm 3, Xã Quang Thiện', demand: 50 },
  { id: 37, name: 'WM+ NBH Xóm 11, Bình Minh', lat: 19.9649, lng: 106.0745, district: 'H. Kim Sơn', address: 'Xóm 11, Xã Bình Minh', demand: 50 },
  { id: 38, name: 'WM+ NBH Đường 481, Bình Minh', lat: 19.9911, lng: 106.0659, district: 'H. Kim Sơn', address: 'Đường 481, Xã Bình Minh', demand: 50 },
  { id: 39, name: 'WM+ NBH Xóm 11, Lai Thành', lat: 20.062635, lng: 106.042182, district: 'H. Kim Sơn', address: 'Xóm 11, Xã Lai Thành', demand: 50 },
  { id: 40, name: 'WM+ NBH Xóm 9 Bình Minh', lat: 19.9771, lng: 106.0744, district: 'H. Kim Sơn', address: 'Xóm 9, Xã Bình Minh', demand: 50 },
  { id: 41, name: 'WM+ NBH Xóm 3, Bình Minh', lat: 20.0098, lng: 106.0712, district: 'H. Kim Sơn', address: 'Xóm 3, Xã Bình Minh', demand: 50 },

  // ===== H. Nho Quan (10) =====
  { id: 42, name: 'WM+ NBH Phú Lộc, Nho Quan', lat: 20.237089, lng: 105.799826, district: 'H. Nho Quan', address: 'Ngã 3 Rịa, Xã Phú Lộc', demand: 50 },
  { id: 43, name: 'WM+ NBH 34 Lương Văn Thăng', lat: 20.321612, lng: 105.74995, district: 'H. Nho Quan', address: '34 Lương Văn Thăng, TT Nho Quan', demand: 50 },
  { id: 44, name: 'WM+ NBH Phong Lai 1, Đồng Phong', lat: 20.325979, lng: 105.737018, district: 'H. Nho Quan', address: 'Xóm Phong Lai 1, Xã Đồng Phong', demand: 50 },
  { id: 45, name: 'WM+ NBH Sào Lâm, Thanh Sơn', lat: 20.266616, lng: 105.771974, district: 'H. Nho Quan', address: 'Thôn Sào Lâm, Xã Thanh Sơn', demand: 50 },
  { id: 46, name: 'WM+ NBH Thôn 3, Phú Long', lat: 20.211772, lng: 105.796499, district: 'H. Nho Quan', address: 'Thôn 3, Xã Phú Long', demand: 50 },
  { id: 47, name: 'WM+ NBH Thôn Mỹ Lộc', lat: 20.381944, lng: 105.800583, district: 'H. Nho Quan', address: 'Thôn Mỹ Lộc, Xã Gia Tường', demand: 50 },
  { id: 48, name: 'WM+ NBH Lạc Long, Gia Lâm', lat: 20.4254, lng: 105.7826, district: 'H. Nho Quan', address: 'Xóm Lạc Long, Xã Gia Lâm', demand: 50 },
  { id: 49, name: 'WM+ NBH Thôn Trung Chính, Gia Lâm', lat: 20.412425, lng: 105.782099, district: 'H. Nho Quan', address: 'Thôn Trung Chính, Xã Gia Lâm', demand: 50 },
  { id: 50, name: 'WM+ NBH Thôn Liên Phương, Phú Sơn', lat: 20.3640, lng: 105.7333, district: 'H. Nho Quan', address: 'Thôn Liên Phương, Xã Phú Sơn', demand: 50 },

  // ===== H. Gia Viễn (8) =====
  { id: 51, name: 'WM+ NBH Phố Me, Gia Viễn', lat: 20.347408, lng: 105.835814, district: 'H. Gia Viễn', address: 'Phố Me, TT Me', demand: 50 },
  { id: 52, name: 'WM+ NBH Gia Sinh, Gia Viễn', lat: 20.285807, lng: 105.862309, district: 'H. Gia Viễn', address: 'TDP4, P. Tây Hoa Lư', demand: 50 },
  { id: 53, name: 'WM+ NBH Phố Thống Nhất, Gia Viễn', lat: 20.346768, lng: 105.843224, district: 'H. Gia Viễn', address: 'Đường ĐT 477, Xã Gia Viễn', demand: 50 },
  { id: 54, name: 'WM+ NBH Đồng Chưa, Gia Viễn', lat: 20.3335, lng: 105.8325, district: 'H. Gia Viễn', address: 'Đ. ĐT477C, Xã Gia Viễn', demand: 50 },
  { id: 55, name: 'WM+ NBH Thôn Mới, Gia Viễn', lat: 20.3484, lng: 105.8298, district: 'H. Gia Viễn', address: 'Thôn Mới, Xã Gia Viễn', demand: 50 },
  { id: 56, name: 'WM+ NBH Phù Long, Gia Vân', lat: 20.3472, lng: 105.8792, district: 'H. Gia Viễn', address: 'Thôn Phù Long, Xã Gia Vân', demand: 50 },
  { id: 57, name: 'WM+ NBH Thôn Tùy Hối, Gia Vân', lat: 20.3248, lng: 105.9143, district: 'H. Gia Viễn', address: 'Thôn Tùy Hối, Xã Gia Vân', demand: 50 },

  // ===== HOÀ BÌNH — H. Lạc Thủy (2) + H. Yên Thủy (1) → Kho Nho Quan =====
  { id: 58, name: 'WM+ HBH Khu 3, Lạc Thủy', lat: 20.4910, lng: 105.7773, district: 'H. Lạc Thủy (HB)', address: 'Khu 3, TT Chi Nê, H. Lạc Thủy', demand: 50 },
  { id: 59, name: 'WM+ PTO 423A Trần Hưng Đạo, Lạc Thủy', lat: 20.4845, lng: 105.7953, district: 'H. Lạc Thủy (HB)', address: '423A Trần Hưng Đạo, Xã Lạc Thuỷ', demand: 50 },
  { id: 60, name: 'WM+ HBH 474 Trần Hưng Đạo, Yên Thủy', lat: 20.3952, lng: 105.6223, district: 'H. Yên Thủy (HB)', address: '474 Trần Hưng Đạo, TT Hàng Trầm, H. Yên Thủy', demand: 50 },
];
