import type { DeviceDef, DeviceLibraryItem, PortType } from "../types";

export const TYPE_COLOR: Record<PortType, string> = {
  ETH: "#2563eb",
  LNET: "#059669",
  KB: "#ef4444",
  POWER: "#f59e0b",
  AC: "#6b7280",
};

export const DEVICE_DEFS: Record<string, DeviceDef> = {
  R5KMSC: {
    part: "R5KMSC", label: "R5KMSC", w: 90, h: 120,
    ports: [
      { id: "AC", label: "AC", type: "AC", x: 0.04, y: 0.28, limit: 1 },
      { id: "36V", label: "36V", type: "POWER", x: 0.04, y: 0.65, limit: 1 },
      { id: "ETH1", label: "ETH1", type: "ETH", x: 0.42, y: 0.96, limit: 1 },
      { id: "ETH2", label: "ETH2", type: "ETH", x: 0.50, y: 0.96, limit: 1 },
      { id: "ETH3", label: "ETH3", type: "ETH", x: 0.58, y: 0.96, limit: 1 },
      { id: "ETH4", label: "ETH4", type: "ETH", x: 0.66, y: 0.96, limit: 1 },
      { id: "L1", label: "L1", type: "LNET", x: 0.96, y: 0.28, limit: 22 },
      { id: "L2", label: "L2", type: "LNET", x: 0.96, y: 0.43, limit: 22 },
      { id: "L3", label: "L3", type: "LNET", x: 0.96, y: 0.58, limit: 22 },
      { id: "L4", label: "L4", type: "LNET", x: 0.96, y: 0.73, limit: 22 },
    ],
  },
  R5KMTRM: {
    part: "R5KMTRM", label: "R5KMTRM", w: 90, h: 120, // match the standard device height so alignments behave consistently
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.50, limit: 1 },
      { id: "PWR-A", label: "PWR-A", type: "POWER", x: 0.28, y: 0.96, limit: 1 },
      { id: "PWR-B", label: "PWR-B", type: "POWER", x: 0.72, y: 0.96, limit: 1 },
      { id: "KB1", label: "KB1", type: "KB", x: 0.94, y: 0.10, powerSource: "PWR-A" },
      { id: "KB2", label: "KB2", type: "KB", x: 0.94, y: 0.24, powerSource: "PWR-A" },
      { id: "KB3", label: "KB3", type: "KB", x: 0.94, y: 0.38, powerSource: "PWR-A" },
      { id: "KB4", label: "KB4", type: "KB", x: 0.94, y: 0.52, powerSource: "PWR-B" },
      { id: "KB5", label: "KB5", type: "KB", x: 0.94, y: 0.66, powerSource: "PWR-B" },
      { id: "KB6", label: "KB6", type: "KB", x: 0.94, y: 0.80, powerSource: "PWR-B" },
    ],
  },
  R5KL2KA: {
    part: "R5KL2KA", label: "R5KL2KA", w: 90, h: 120,
    ports: [
      { id: "L1", label: "L1", type: "LNET", x: 0.08, y: 0.50, limit: 1 },
      { id: "K1", label: "K1", type: "KB", x: 0.92, y: 0.50, limit: 1 },
    ],
  },
  R5KMPR36: {
    part: "R5KMPR36", label: "R5KMPR36", w: 90, h: 120,
    ports: [
      { id: "AC", label: "AC", type: "AC", x: 0.12, y: 0.28, limit: 1 },
      { id: "DC1", label: "DC1", type: "POWER", x: 0.88, y: 0.40, limit: 1 },
      { id: "DC2", label: "DC2", type: "POWER", x: 0.88, y: 0.58, limit: 1 },
      { id: "DC3", label: "DC3", type: "POWER", x: 0.88, y: 0.76, limit: 1 },
    ],
  },
  R5KMPR15: {
    part: "R5KMPR15", label: "R5KMPR15", w: 90, h: 120,
    ports: [
      { id: "AC", label: "AC", type: "AC", x: 0.12, y: 0.28, limit: 1 },
      { id: "DC1", label: "DC1", type: "POWER", x: 0.88, y: 0.40, limit: 1 },
      { id: "DC2", label: "DC2", type: "POWER", x: 0.88, y: 0.58, limit: 1 },
      { id: "DC3", label: "DC3", type: "POWER", x: 0.88, y: 0.76, limit: 1 },
    ],
  },
  R5K8PRT: {
    part: "R5K8PRT", label: "R5K8PRT", w: 110, h: 120,
    ports: [
      { id: "UP1", label: "UP1", type: "ETH", x: 0.06, y: 0.50, limit: 1 },
      { id: "UP2", label: "UP2", type: "ETH", x: 0.14, y: 0.50, limit: 1 },
      { id: "1", label: "1", type: "ETH", x: 0.26, y: 0.50, limit: 1 },
      { id: "2", label: "2", type: "ETH", x: 0.34, y: 0.50, limit: 1 },
      { id: "3", label: "3", type: "ETH", x: 0.42, y: 0.50, limit: 1 },
      { id: "4", label: "4", type: "ETH", x: 0.50, y: 0.50, limit: 1 },
      { id: "5", label: "5", type: "ETH", x: 0.58, y: 0.50, limit: 1 },
      { id: "6", label: "6", type: "ETH", x: 0.66, y: 0.50, limit: 1 },
      { id: "7", label: "7", type: "ETH", x: 0.74, y: 0.50, limit: 1 },
      { id: "8", label: "8", type: "ETH", x: 0.82, y: 0.50, limit: 1 },
    ],
  },
  R5KCONS: {
    part: "R5KCONS", label: "R5KCONS", w: 90, h: 120,
    ports: [{ id: "ETH", label: "ETH", type: "ETH", x: 0.10, y: 0.50, limit: 1 }],
  },
  R5KPS1EA: {
    part: "R5KPS1EA", label: "R5KPS1EA", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KCL546: {
    part: "R5KCL546", label: "R5KCL546", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R5KCL516: {
    part: "R5KCL516", label: "R5KCL516", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R5KCL506: {
    part: "R5KCL506", label: "R5KCL506", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  CLA246: {
    part: "CLA246", label: "CLA246", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  "351010": {
    part: "351010", label: "351010", w: 90, h: 120,
    ports: [
      { id: "ETH1", label: "ETH1", type: "ETH", x: 0.15, y: 0.50, limit: 1 },
      { id: "ETH2", label: "ETH2", type: "ETH", x: 0.85, y: 0.50, limit: 1 },
    ],
  },
  "351006": {
    part: "351006", label: "351006", w: 90, h: 120,
    ports: [
      { id: "ETH1", label: "ETH1", type: "ETH", x: 0.15, y: 0.50, limit: 1 },
      { id: "ETH2", label: "ETH2", type: "ETH", x: 0.85, y: 0.50, limit: 1 },
    ],
  },
  R4KPA25: {
    part: "R4KPA25", label: "R4KPA25", w: 90, h: 120,
    ports: [
      { id: "KBUS", label: "K-Bus", type: "KB", x: 0.10, y: 0.50 },
      { id: "PWR", label: "PWR", type: "POWER", x: 0.90, y: 0.50, limit: 1 },
    ],
  },
  R4KANNV2: {
    part: "R4KANNV2", label: "R4KANNV2", w: 90, h: 120,
    ports: [
      { id: "KBUS", label: "K-Bus", type: "KB", x: 0.10, y: 0.50 },
      { id: "PWR", label: "PWR", type: "POWER", x: 0.90, y: 0.50, limit: 1 },
    ],
  },
  R4KMQCV2: {
    part: "R4KMQCV2", label: "R4KMQCV2", w: 90, h: 120,
    ports: [
      { id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.35 },
      { id: "PWR", label: "PWR", type: "POWER", x: 0.90, y: 0.65, limit: 1 },
    ],
  },
  R5KDC06: {
    part: "R5KDC06", label: "R5KDC06", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R5KDC46: {
    part: "R5KDC46", label: "R5KDC46", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R5KDC016: {
    part: "R5KDC016", label: "R5KDC016", w: 90, h: 160,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.06 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.94 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.06 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.12 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.18 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.24 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.30 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS7", label: "RS7", type: "KB", x: 0.94, y: 0.42 },
      { id: "RS8", label: "RS8", type: "KB", x: 0.94, y: 0.48 },
      { id: "RS9", label: "RS9", type: "KB", x: 0.94, y: 0.54 },
      { id: "RS10", label: "RS10", type: "KB", x: 0.94, y: 0.60 },
      { id: "RS11", label: "RS11", type: "KB", x: 0.94, y: 0.66 },
      { id: "RS12", label: "RS12", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS13", label: "RS13", type: "KB", x: 0.94, y: 0.78 },
      { id: "RS14", label: "RS14", type: "KB", x: 0.94, y: 0.84 },
      { id: "RS15", label: "RS15", type: "KB", x: 0.94, y: 0.90 },
      { id: "RS16", label: "RS16", type: "KB", x: 0.94, y: 0.94 },
    ],
  },
  R5KDC16D: {
    part: "R5KDC16D", label: "R5KDC16D", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R5KPS1A: {
    part: "R5KPS1A", label: "R5KPS1A", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPS1V: {
    part: "R5KPS1V", label: "R5KPS1V", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPD2A: {
    part: "R5KPD2A", label: "R5KPD2A", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPD2EA: {
    part: "R5KPD2EA", label: "R5KPD2EA", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPS1LCA: {
    part: "R5KPS1LCA", label: "R5KPS1LCA", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  HSS400: {
    part: "HSS400", label: "HSS400", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  HSS401: {
    part: "HSS401", label: "HSS401", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  HSS433: {
    part: "HSS433", label: "HSS433", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPB4: {
    part: "R5KPB4", label: "R5KPB4", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPB4CNF: {
    part: "R5KPB4CNF", label: "R5KPB4CNF", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KSSTF: {
    part: "R5KSSTF", label: "R5KSSTF", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KSDTY: {
    part: "R5KSDTY", label: "R5KSDTY", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPPS: {
    part: "R5KPPS", label: "R5KPPS", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KAUDPC: {
    part: "R5KAUDPC", label: "R5KAUDPC", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KCANCEL: {
    part: "R5KCANCEL", label: "R5KCANCEL", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KPC11WP: {
    part: "R5KPC11WP", label: "R5KPC11WP", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R5KDCRC4: {
    part: "R5KDCRC4", label: "R5KDCRC4", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  R5KDCRC4S: {
    part: "R5KDCRC4S", label: "R5KDCRC4S", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  R4K11V: {
    part: "R4K11V", label: "R4K11V", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K12A: {
    part: "R4K12A", label: "R4K12A", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K12AHZ: {
    part: "R4K12AHZ", label: "R4K12AHZ", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K13VA: {
    part: "R4K13VA", label: "R4K13VA", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K13VAH: {
    part: "R4K13VAH", label: "R4K13VAH", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K14SA: {
    part: "R4K14SA", label: "R4K14SA", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K15V: {
    part: "R4K15V", label: "R4K15V", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K16LV: {
    part: "R4K16LV", label: "R4K16LV", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K17V: {
    part: "R4K17V", label: "R4K17V", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K21V: {
    part: "R4K21V", label: "R4K21V", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K22A: {
    part: "R4K22A", label: "R4K22A", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K2JACK: {
    part: "R4K2JACK", label: "R4K2JACK", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4K23VA: {
    part: "R4K23VA", label: "R4K23VA", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KCB10: {
    part: "R4KCB10", label: "R4KCB10", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KCB12: {
    part: "R4KCB12", label: "R4KCB12", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KCB13: {
    part: "R4KCB13", label: "R4KCB13", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KCNCL: {
    part: "R4KCNCL", label: "R4KCNCL", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KDLC2: {
    part: "R4KDLC2", label: "R4KDLC2", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KDY: {
    part: "R4KDY", label: "R4KDY", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KDTY2: {
    part: "R4KDTY2", label: "R4KDTY2", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KESR: {
    part: "R4KESR", label: "R4KESR", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KFAM: {
    part: "R4KFAM", label: "R4KFAM", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KFB1: {
    part: "R4KFB1", label: "R4KFB1", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KMST: {
    part: "R4KMST", label: "R4KMST", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPB11: {
    part: "R4KPB11", label: "R4KPB11", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPB12: {
    part: "R4KPB12", label: "R4KPB12", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPB22: {
    part: "R4KPB22", label: "R4KPB22", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPB23: {
    part: "R4KPB23", label: "R4KPB23", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPB44: {
    part: "R4KPB44", label: "R4KPB44", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPC10: {
    part: "R4KPC10", label: "R4KPC10", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KPC11: {
    part: "R4KPC11", label: "R4KPC11", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KRA1: {
    part: "R4KRA1", label: "R4KRA1", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KSLC1: {
    part: "R4KSLC1", label: "R4KSLC1", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KSR1: {
    part: "R4KSR1", label: "R4KSR1", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  R4KTVR1: {
    part: "R4KTVR1", label: "R4KTVR1", w: 90, h: 120,
    ports: [{ id: "KB", label: "KB", type: "KB", x: 0.10, y: 0.50 }],
  },
  DCV100: {
    part: "DCV100", label: "DCV100", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R4KOUT4R: {
    part: "R4KOUT4R", label: "R4KOUT4R", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  DCV116: {
    part: "DCV116", label: "DCV116", w: 90, h: 160,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.06 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.94 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.06 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.12 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.18 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.24 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.30 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS7", label: "RS7", type: "KB", x: 0.94, y: 0.42 },
      { id: "RS8", label: "RS8", type: "KB", x: 0.94, y: 0.48 },
      { id: "RS9", label: "RS9", type: "KB", x: 0.94, y: 0.54 },
      { id: "RS10", label: "RS10", type: "KB", x: 0.94, y: 0.60 },
      { id: "RS11", label: "RS11", type: "KB", x: 0.94, y: 0.66 },
      { id: "RS12", label: "RS12", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS13", label: "RS13", type: "KB", x: 0.94, y: 0.78 },
      { id: "RS14", label: "RS14", type: "KB", x: 0.94, y: 0.84 },
      { id: "RS15", label: "RS15", type: "KB", x: 0.94, y: 0.90 },
      { id: "RS16", label: "RS16", type: "KB", x: 0.94, y: 0.94 },
    ],
  },
  CLV122: {
    part: "CLV122", label: "CLV122", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.50 },
    ],
  },
  CLV144: {
    part: "CLV144", label: "CLV144", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  DCA200: {
    part: "DCA200", label: "DCA200", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  R4KOUT4S: {
    part: "R4KOUT4S", label: "R4KOUT4S", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  DCA216: {
    part: "DCA216", label: "DCA216", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  CLA214D: {
    part: "CLA214D", label: "CLA214D", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  DCA214D: {
    part: "DCA214D", label: "DCA214D", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
  CLA222: {
    part: "CLA222", label: "CLA222", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.50 },
    ],
  },
  CLA244: {
    part: "CLA244", label: "CLA244", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  CLAR4: {
    part: "CLAR4", label: "CLAR4", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.36 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.79 },
    ],
  },
  CLAR46: {
    part: "CLAR46", label: "CLAR46", w: 90, h: 120,
    ports: [
      { id: "KB_IN", label: "KB-In", type: "KB", x: 0.06, y: 0.14 },
      { id: "KB_OUT", label: "KB-Out", type: "KB", x: 0.06, y: 0.86 },
      { id: "RS1", label: "RS1", type: "KB", x: 0.94, y: 0.14 },
      { id: "RS2", label: "RS2", type: "KB", x: 0.94, y: 0.28 },
      { id: "RS3", label: "RS3", type: "KB", x: 0.94, y: 0.43 },
      { id: "RS4", label: "RS4", type: "KB", x: 0.94, y: 0.57 },
      { id: "RS5", label: "RS5", type: "KB", x: 0.94, y: 0.72 },
      { id: "RS6", label: "RS6", type: "KB", x: 0.94, y: 0.86 },
    ],
  },
};

export const DEVICE_LIBRARY: DeviceLibraryItem[] = [
  // Head End
  { part: "R5KMSC", label: "R5KMSC -- Main System Controller", category: "Head End", power_mA: 350, power_A: 0.350, laborMinutes: 120, generation: "R5K" },
  { part: "R5KL2KA", label: "R5KL2KA -- L-Net to KB Adapter", category: "Head End", power_mA: 130, power_A: 0.130, laborMinutes: 30, generation: "NEUTRAL" },
  { part: "R5KMTRM", label: "R5KMTRM -- Termination Board", category: "Head End", power_mA: 0, power_A: 0, laborMinutes: 45, generation: "R5K" },
  { part: "R5KMPR15", label: "R5KMPR15 -- 15v Power Supply", category: "Head End", power_mA: 0, power_A: 0, laborMinutes: 30, generation: "R5K" },
  { part: "R5KMPR36", label: "R5KMPR36 -- 36v Power Supply", category: "Head End", power_mA: 0, power_A: 0, laborMinutes: 30, generation: "R5K" },
  { part: "R5K8PRT", label: "R5K8PRT -- 8-port POE Ethernet Switch", category: "Head End", power_mA: 2400, power_A: 2.400, laborMinutes: 30, generation: "R5K" },
  { part: "R4KPA25", label: "R4KPA25 -- 25W Paging Amplifier", category: "Head End", power_mA: 2500, power_A: 2.500, laborMinutes: 45, generation: "R4K" },
  { part: "351010", label: "351010 -- Network Concentrator", category: "Head End", power_mA: 300, power_A: 0.300, laborMinutes: 120, generation: "NEUTRAL" },
  { part: "351006", label: "351006 -- Fiber Optic Adapter", category: "Head End", power_mA: 75, power_A: 0.075, laborMinutes: 30, generation: "NEUTRAL" },

  // Consoles & Annunciators
  { part: "R5KCONS", label: "R5KCONS -- VoIP Nurse Console", category: "Console", power_mA: 328, power_A: 0.328, laborMinutes: 120, network: "Ethernet", generation: "R5K" },
  { part: "R4KANNV2", label: "R4KANNV2 -- Annunciator Panel", category: "Console", power_mA: 375, power_A: 0.375, laborMinutes: 60, generation: "R4K" },
  { part: "R4KMQCV2", label: "R4KMQCV2 -- Marquee Controller", category: "Console", power_mA: 300, power_A: 0.300, laborMinutes: 60, generation: "R4K" },

  // R5K Corridor Lights
  { part: "R5KCL506", label: "R5KCL506 -- CL 6 Stations", category: "Corridor Light", power_mA: 36, power_A: 0.036, laborMinutes: 45, generation: "R5K" },
  { part: "R5KCL516", label: "R5KCL516 -- CL 1 Audio 6 Stations", category: "Corridor Light", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "R5K" },
  { part: "R5KCL546", label: "R5KCL546 -- CL 4 Audio 6 Stations", category: "Corridor Light", power_mA: 58, power_A: 0.058, laborMinutes: 45, generation: "R5K", preferred: true },

  // R4K/Neutral Corridor Lights
  { part: "CLA246", label: "CLA246 -- 4-bulb Audio Corridor Light", category: "Corridor Light", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "CLA222", label: "CLA222 -- 2-bulb Audio Corridor Light", category: "Corridor Light", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "CLA244", label: "CLA244 -- 4-bulb Audio Corridor Light", category: "Corridor Light", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "CLA214D", label: "CLA214D -- Duty Corridor Light", category: "Corridor Light", power_mA: 58, power_A: 0.058, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "CLAR4", label: "CLAR4 -- Corridor Light Audio Relay Add-on", category: "Corridor Light", power_mA: 32, power_A: 0.032, laborMinutes: 30, generation: "NEUTRAL" },
  { part: "CLAR46", label: "CLAR46 -- Corridor Light Audio Relay Add-on", category: "Corridor Light", power_mA: 32, power_A: 0.032, laborMinutes: 30, generation: "NEUTRAL" },
  { part: "CLV122", label: "CLV122 -- 2-bulb Visual Corridor Light", category: "Corridor Light", power_mA: 12, power_A: 0.012, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "CLV144", label: "CLV144 -- 4-bulb Visual Corridor Light", category: "Corridor Light", power_mA: 12, power_A: 0.012, laborMinutes: 45, generation: "NEUTRAL" },

  // R5K Domeless Controllers
  { part: "R5KDC06", label: "R5KDC06 -- Domeless 6 Stations", category: "Domeless", power_mA: 16, power_A: 0.016, laborMinutes: 45, generation: "R5K" },
  { part: "R5KDC46", label: "R5KDC46 -- Domeless 4 Audio 6 Stations", category: "Domeless", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "R5K" },
  { part: "R5KDC016", label: "R5KDC016 -- Domeless 16 Stations", category: "Domeless", power_mA: 17, power_A: 0.017, laborMinutes: 45, generation: "R5K" },
  { part: "R5KDC16D", label: "R5KDC16D -- Domeless Duty 1 Audio 6 Stations", category: "Domeless", power_mA: 58, power_A: 0.058, laborMinutes: 45, generation: "R5K" },

  // R4K/Neutral Domeless Controllers
  { part: "DCV100", label: "DCV100 -- 6-point Visual Domeless Controller", category: "Domeless", power_mA: 12, power_A: 0.012, laborMinutes: 45, generation: "R4K" },
  { part: "DCV116", label: "DCV116 -- 16-point Domeless Controller", category: "Domeless", power_mA: 12, power_A: 0.012, laborMinutes: 45, generation: "R4K" },
  { part: "DCA200", label: "DCA200 -- 6-point Audio Domeless Controller", category: "Domeless", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "R4K" },
  { part: "DCA216", label: "DCA216 -- 6-point Audio Domeless Controller", category: "Domeless", power_mA: 38, power_A: 0.038, laborMinutes: 45, generation: "R4K" },
  { part: "DCA214D", label: "DCA214D -- Duty Domeless Controller", category: "Domeless", power_mA: 58, power_A: 0.058, laborMinutes: 45, generation: "R4K" },
  { part: "R5KDCRC4", label: "R5KDCRC4 -- Relay Output Controller", category: "Domeless", power_mA: 32, power_A: 0.032, laborMinutes: 15, generation: "R5K" },
  { part: "R5KDCRC4S", label: "R5KDCRC4S -- Solid State Relay Output Controller", category: "Domeless", power_mA: 21, power_A: 0.021, laborMinutes: 15, generation: "R5K" },
  { part: "R4KOUT4R", label: "R4KOUT4R -- Visual Output Controller", category: "Domeless", power_mA: 32, power_A: 0.032, laborMinutes: 15, generation: "R4K" },
  { part: "R4KOUT4S", label: "R4KOUT4S -- Audio Output Controller", category: "Domeless", power_mA: 21, power_A: 0.021, laborMinutes: 15, generation: "R4K" },

  // R5K Room Stations
  { part: "R5KPS1A", label: "R5KPS1A -- Single Audio Patient Station", category: "Room Station", power_mA: 8, power_A: 0.008, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPS1EA", label: "R5KPS1EA -- Enhanced Single Audio Patient Station", category: "Room Station", power_mA: 11, power_A: 0.011, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPS1V", label: "R5KPS1V -- Single Pat Visual", category: "Room Station", power_mA: 3, power_A: 0.003, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPD2A", label: "R5KPD2A -- Dual Audio Patient Station", category: "Room Station", power_mA: 10, power_A: 0.010, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPD2EA", label: "R5KPD2EA -- Enhanced Dual Audio Patient Station", category: "Room Station", power_mA: 15, power_A: 0.015, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPS1LCA", label: "R5KPS1LCA -- Single Audio Patient Station with Button and Light Control", category: "Room Station", power_mA: 31, power_A: 0.031, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPPS", label: "R5KPPS -- Pull Push Station", category: "Room Station", power_mA: 18, power_A: 0.018, laborMinutes: 30, generation: "R5K" },
  { part: "R5KAUDPC", label: "R5KAUDPC -- Audio Pull Cord", category: "Room Station", power_mA: 20, power_A: 0.020, laborMinutes: 30, generation: "R5K" },
  { part: "R5KCANCEL", label: "R5KCANCEL -- Cancel Station", category: "Room Station", power_mA: 2, power_A: 0.002, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPC11WP", label: "R5KPC11WP -- Waterproof Pull Cord Station", category: "Room Station", power_mA: 16, power_A: 0.016, laborMinutes: 30, generation: "R5K" },

  // R5K Staff/Duty Stations
  { part: "R5KSSTF", label: "R5KSSTF -- Staff Station", category: "Staff Station", power_mA: 16, power_A: 0.016, laborMinutes: 30, generation: "R5K" },
  { part: "R5KSDTY", label: "R5KSDTY -- Duty Station", category: "Staff Station", power_mA: 27, power_A: 0.027, laborMinutes: 30, generation: "R5K" },

  // R5K Pushbutton / Workflow
  { part: "R5KPB4", label: "R5KPB4 -- Four Button Station", category: "Pushbutton", power_mA: 11, power_A: 0.011, laborMinutes: 30, generation: "R5K" },
  { part: "R5KPB4CNF", label: "R5KPB4CNF -- 4-button CNF Workflow Station", category: "Pushbutton", power_mA: 11, power_A: 0.011, laborMinutes: 30, generation: "R5K" },

  // High Security
  { part: "HSS400", label: "HSS400 -- High Security Bed Station", category: "High Security", power_mA: 10, power_A: 0.010, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "HSS401", label: "HSS401 -- High Security Staff Station", category: "High Security", power_mA: 8, power_A: 0.008, laborMinutes: 45, generation: "NEUTRAL" },
  { part: "HSS433", label: "HSS433 -- High Security Push Button Station", category: "High Security", power_mA: 15, power_A: 0.015, laborMinutes: 45, generation: "NEUTRAL" },

  // R4K Bed Stations
  { part: "R4K11V", label: "R4K11V -- Single Bed Visual Station", category: "Room Station", power_mA: 2, power_A: 0.002, laborMinutes: 30, generation: "R4K" },
  { part: "R4K12A", label: "R4K12A -- Single Bed Audio Station", category: "Room Station", power_mA: 5, power_A: 0.005, laborMinutes: 30, generation: "R4K" },
  { part: "R4K12AHZ", label: "R4K12AHZ -- Horizontal Single Bed Audio Station", category: "Room Station", power_mA: 5, power_A: 0.005, laborMinutes: 30, generation: "R4K" },
  { part: "R4K13VA", label: "R4K13VA -- Single Bed Enhanced Audio Station", category: "Room Station", power_mA: 25, power_A: 0.025, laborMinutes: 30, generation: "R4K" },
  { part: "R4K13VAH", label: "R4K13VAH -- Horiz. Single Bed Enhanced Audio Stn", category: "Room Station", power_mA: 25, power_A: 0.025, laborMinutes: 30, generation: "R4K" },
  { part: "R4K14SA", label: "R4K14SA -- Staff Assist Bed Station", category: "Room Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4K15V", label: "R4K15V -- SLIM 1/4\" Jack Button Station", category: "Room Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4K16LV", label: "R4K16LV -- Single Bed Enhanced Visual Station", category: "Room Station", power_mA: 15, power_A: 0.015, laborMinutes: 30, generation: "R4K" },
  { part: "R4K17V", label: "R4K17V -- SLIM Single Bed Enhanced Audio St", category: "Room Station", power_mA: 25, power_A: 0.025, laborMinutes: 30, generation: "R4K" },
  { part: "R4K21V", label: "R4K21V -- Dual Bed Visual Station", category: "Room Station", power_mA: 4, power_A: 0.004, laborMinutes: 30, generation: "R4K" },
  { part: "R4K22A", label: "R4K22A -- Dual Bed Audio Station", category: "Room Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4K2JACK", label: "R4K2JACK -- SLIM Dual 1/4\" Jack Audio Station", category: "Room Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4K23VA", label: "R4K23VA -- Dual Bed Enhanced Audio Station", category: "Room Station", power_mA: 30, power_A: 0.030, laborMinutes: 30, generation: "R4K" },

  // R4K Code/Special Stations
  { part: "R4KCB10", label: "R4KCB10 -- Code Station", category: "Code Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4KCB12", label: "R4KCB12 -- Code Station w/Timer", category: "Code Station", power_mA: 17, power_A: 0.017, laborMinutes: 30, generation: "R4K" },
  { part: "R4KCB13", label: "R4KCB13 -- SLIM Code Station w/Timer", category: "Code Station", power_mA: 17, power_A: 0.017, laborMinutes: 30, generation: "R4K" },
  { part: "R4KCNCL", label: "R4KCNCL -- Cancel Station", category: "Room Station", power_mA: 2, power_A: 0.002, laborMinutes: 30, generation: "R4K" },
  { part: "R4KDLC2", label: "R4KDLC2 -- Dual Lighting Controller", category: "Room Station", power_mA: 23, power_A: 0.023, laborMinutes: 30, generation: "R4K" },
  { part: "R4KDY", label: "R4KDY -- Duty Station", category: "Staff Station", power_mA: 12, power_A: 0.012, laborMinutes: 30, generation: "R4K" },
  { part: "R4KDTY2", label: "R4KDTY2 -- SLIM Duty Station", category: "Staff Station", power_mA: 12, power_A: 0.012, laborMinutes: 30, generation: "R4K" },
  { part: "R4KESR", label: "R4KESR -- Emergency Staff Reg. Station", category: "Room Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4KSAR", label: "R4KSAR -- SLIM Dual Push w/Staff Reg Station", category: "Pushbutton", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4KFAM", label: "R4KFAM -- Fire/Auxiliary Module", category: "Room Station", power_mA: 30, power_A: 0.030, laborMinutes: 30, generation: "R4K" },
  { part: "R4KFB1", label: "R4KFB1 -- Feature Bed Interface", category: "Room Station", power_mA: 75, power_A: 0.075, laborMinutes: 30, generation: "R4K" },
  { part: "R4KMST", label: "R4KMST -- Marquee Speaker", category: "Console", power_mA: 5, power_A: 0.005, laborMinutes: 30, generation: "R4K" },

  // R4K Push Button Stations
  { part: "R4KPB11", label: "R4KPB11 -- Push For Help Station", category: "Pushbutton", power_mA: 4, power_A: 0.004, laborMinutes: 30, generation: "R4K" },
  { part: "R4KPB12", label: "R4KPB12 -- SLIM Push For Help Station", category: "Pushbutton", power_mA: 4, power_A: 0.004, laborMinutes: 30, generation: "R4K" },
  { part: "R4KPB22", label: "R4KPB22 -- Dual Push Button Station", category: "Pushbutton", power_mA: 17, power_A: 0.017, laborMinutes: 30, generation: "R4K" },
  { part: "R4KPB23", label: "R4KPB23 -- SLIM Dual Push Button Station", category: "Pushbutton", power_mA: 17, power_A: 0.017, laborMinutes: 30, generation: "R4K" },
  { part: "R4KPB44", label: "R4KPB44 -- Four Button Station", category: "Pushbutton", power_mA: 14, power_A: 0.014, laborMinutes: 30, generation: "R4K" },
  { part: "R4KPC10", label: "R4KPC10 -- Pull Cord Station", category: "Pushbutton", power_mA: 2, power_A: 0.002, laborMinutes: 30, generation: "R4K" },
  { part: "R4KPC11", label: "R4KPC11 -- SLIM Pull Cord Station", category: "Pushbutton", power_mA: 2, power_A: 0.002, laborMinutes: 30, generation: "R4K" },
  { part: "R4KRA1", label: "R4KRA1 -- Residence Assist Station", category: "Room Station", power_mA: 7, power_A: 0.007, laborMinutes: 30, generation: "R4K" },
  { part: "R4KSLC1", label: "R4KSLC1 -- Single Lighting Controller", category: "Room Station", power_mA: 13, power_A: 0.013, laborMinutes: 30, generation: "R4K" },
  { part: "R4KSR1", label: "R4KSR1 -- Staff Registration Station", category: "Room Station", power_mA: 2, power_A: 0.002, laborMinutes: 30, generation: "R4K" },
  { part: "R4KSS", label: "R4KSS -- Staff Station", category: "Staff Station", power_mA: 5, power_A: 0.005, laborMinutes: 30, generation: "R4K" },
  { part: "R4KTVR1", label: "R4KTVR1 -- Digital TV Isolation Module", category: "Room Station", power_mA: 15, power_A: 0.015, laborMinutes: 30, generation: "R4K" },
];
