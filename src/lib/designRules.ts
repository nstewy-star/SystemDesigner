import type { Device, Connection, DeviceLibraryItem } from "../types";
import { DEVICE_DEFS, DEVICE_LIBRARY } from "../data/devices";
import { validateConnection } from "./connectionRules";

export type Severity = "error" | "warning" | "info";

export interface DesignIssue {
  id: string;
  severity: Severity;
  category: string;
  title: string;
  detail: string;
  deviceIds?: string[];
}

const KBUS_CATEGORIES = new Set([
  "Corridor Light", "Domeless", "Room Station", "High Security", "Pushbutton",
]);

const NON_KBUS_PARTS = new Set([
  "R5KCONS", "R5K8PRT", "351010", "351006",
]);

const CORRIDOR_LIGHT_PARTS = new Set([
  "R5KCL506", "R5KCL516", "R5KCL546", "CLA246",
]);

const PATIENT_STATION_PARTS = new Set([
  "R5KPS1A", "R5KPS1EA", "R5KPS1V", "R5KPD2A", "R5KPD2EA", "R5KPS1LCA",
]);

const DUTY_DOMELESS_PARTS = new Set(["R5KDC16D"]);

const DUTY_STATION_PARTS = new Set(["R5KSDTY"]);

const PAIRED_DEVICES: Array<{ dependent: Set<string>; requires: Set<string>; label: string; requiresLabel: string }> = [
  { dependent: DUTY_DOMELESS_PARTS, requires: DUTY_STATION_PARTS, label: "Duty Domeless Controller", requiresLabel: "Duty Station" },
  { dependent: new Set(["R5KPS1LCA"]), requires: PATIENT_STATION_PARTS, label: "LC050 Low Voltage Lighting Relay", requiresLabel: "Patient Station" },
];

const MSC_LIMITS = {
  maxL2Ks: 4,
  maxKBusDevices: 92,
};

const L2K_LIMITS = {
  maxKBusDevices: 46,
  marshallRecommended: 40,
};

const DAISY_CHAIN_LIMITS = {
  manufacturer: 22,
  marshallRecommended: 17,
};

function isKBusDevice(device: Device): boolean {
  if (NON_KBUS_PARTS.has(device.part)) return false;
  const lib = DEVICE_LIBRARY.find(d => d.part === device.part);
  return lib ? KBUS_CATEGORIES.has(lib.category) : false;
}

function isL2K(device: Device): boolean {
  return device.part === "R5KL2KA";
}

function isMSC(device: Device): boolean {
  return device.part === "R5KMSC";
}

function isTermBoard(device: Device): boolean {
  return device.part === "R5KMTRM";
}

function isPowerSupply(device: Device): boolean {
  return device.part === "R5KMPR15" || device.part === "R5KMPR36";
}

function isCorridorLight(device: Device): boolean {
  return CORRIDOR_LIGHT_PARTS.has(device.part);
}

function getConnectedDevices(deviceId: string, connections: Connection[], devices: Device[]): Device[] {
  const ids = new Set<string>();
  connections.forEach(c => {
    if (c.fromId === deviceId) ids.add(c.toId);
    if (c.toId === deviceId) ids.add(c.fromId);
  });
  return devices.filter(d => ids.has(d.id));
}

function getLNetConnections(mscId: string, connections: Connection[]): Connection[] {
  return connections.filter(c =>
    c.type === "LNET" && (c.fromId === mscId || c.toId === mscId)
  );
}

function getKBusChain(startId: string, connections: Connection[], devices: Device[], visited = new Set<string>()): Device[] {
  visited.add(startId);
  const chain: Device[] = [];
  const startDev = devices.find(d => d.id === startId);
  if (startDev) chain.push(startDev);

  const kbConns = connections.filter(c =>
    c.type === "KB" && (c.fromId === startId || c.toId === startId)
  );

  for (const conn of kbConns) {
    const nextId = conn.fromId === startId ? conn.toId : conn.fromId;
    if (visited.has(nextId)) continue;
    chain.push(...getKBusChain(nextId, connections, devices, visited));
  }
  return chain;
}

export function validateDesign(
  devices: Device[],
  connections: Connection[],
  _allDevices?: DeviceLibraryItem[]
): DesignIssue[] {
  const issues: DesignIssue[] = [];
  let issueId = 0;
  const id = () => `issue-${issueId++}`;

  const mscs = devices.filter(isMSC);
  const l2ks = devices.filter(isL2K);
  const termBoards = devices.filter(isTermBoard);
  const powerSupplies = devices.filter(isPowerSupply);
  const corridorLights = devices.filter(isCorridorLight);
  const kbusDevices = devices.filter(isKBusDevice);

  if (mscs.length === 0 && devices.length > 0) {
    issues.push({
      id: id(), severity: "error", category: "Architecture",
      title: "No MSC in design",
      detail: "Every system requires an MSC (R5KMSC) as the core processor.",
    });
  }

  for (const msc of mscs) {
    const lnetConns = getLNetConnections(msc.id, connections);
    const connectedL2Ks = lnetConns
      .map(c => c.fromId === msc.id ? c.toId : c.fromId)
      .filter(lid => devices.find(d => d.id === lid)?.part === "R5KL2KA");

    if (connectedL2Ks.length > MSC_LIMITS.maxL2Ks) {
      issues.push({
        id: id(), severity: "error", category: "MSC Capacity",
        title: `MSC "${msc.name}" exceeds L2K limit`,
        detail: `Connected to ${connectedL2Ks.length} L2Ks. Maximum is ${MSC_LIMITS.maxL2Ks} per MSC.`,
        deviceIds: [msc.id],
      });
    }

    const totalKbus = kbusDevices.length;
    if (totalKbus > MSC_LIMITS.maxKBusDevices) {
      issues.push({
        id: id(), severity: "error", category: "MSC Capacity",
        title: `Total K-Bus devices (${totalKbus}) exceeds MSC limit`,
        detail: `Marshall practical limit is ${MSC_LIMITS.maxKBusDevices} K-Bus devices per MSC. Current count: ${totalKbus}.`,
        deviceIds: [msc.id],
      });
    }
  }

  for (const l2k of l2ks) {
    const chain = getKBusChain(l2k.id, connections, devices);
    const kbusOnL2K = chain.filter(d => d.id !== l2k.id && isKBusDevice(d));

    if (kbusOnL2K.length > L2K_LIMITS.maxKBusDevices) {
      issues.push({
        id: id(), severity: "error", category: "L2K Capacity",
        title: `L2K "${l2k.name}" exceeds K-Bus limit`,
        detail: `${kbusOnL2K.length} K-Bus devices connected. Maximum is ${L2K_LIMITS.maxKBusDevices}.`,
        deviceIds: [l2k.id, ...kbusOnL2K.map(d => d.id)],
      });
    } else if (kbusOnL2K.length > L2K_LIMITS.marshallRecommended) {
      issues.push({
        id: id(), severity: "warning", category: "L2K Capacity",
        title: `L2K "${l2k.name}" exceeds Marshall recommended limit`,
        detail: `${kbusOnL2K.length} K-Bus devices. Marshall recommends ${L2K_LIMITS.marshallRecommended} or fewer per L2K.`,
        deviceIds: [l2k.id],
      });
    }
  }

  if (l2ks.length > 0 && termBoards.length < l2ks.length) {
    issues.push({
      id: id(), severity: "warning", category: "Termination",
      title: "Not enough termination boards",
      detail: `Marshall standard: 1 termination board per L2K. Found ${termBoards.length} boards for ${l2ks.length} L2Ks.`,
    });
  }

  if (termBoards.length > 0 && powerSupplies.length < termBoards.length) {
    issues.push({
      id: id(), severity: "warning", category: "Power",
      title: "Not enough power supplies",
      detail: `Marshall standard: 1 power supply per termination board. Found ${powerSupplies.length} supplies for ${termBoards.length} boards.`,
    });
  }

  const clStandard = corridorLights.filter(d => d.part === "R5KCL546");
  const clOther = corridorLights.filter(d => d.part !== "R5KCL546");
  if (clStandard.length > 0 && clOther.length > 0) {
    issues.push({
      id: id(), severity: "warning", category: "Standardization",
      title: "Mixed corridor light families",
      detail: `Design contains ${clStandard.length} CL546 (standard) and ${clOther.length} other corridor lights. Marshall recommends standardizing on audio-capable CL546.`,
      deviceIds: clOther.map(d => d.id),
    });
  }

  if (clOther.length > 0 && clStandard.length === 0) {
    issues.push({
      id: id(), severity: "info", category: "Standardization",
      title: "Non-standard corridor lights used",
      detail: `Design uses ${clOther.map(d => d.part).join(", ")} instead of the Marshall standard R5KCL546 (5-bulb 4-Audio).`,
      deviceIds: clOther.map(d => d.id),
    });
  }

  for (const rule of PAIRED_DEVICES) {
    const dependents = devices.filter(d => rule.dependent.has(d.part));
    const requireds = devices.filter(d => rule.requires.has(d.part));

    for (const dep of dependents) {
      const connectedParts = getConnectedDevices(dep.id, connections, devices).map(d => d.part);
      const hasPair = connectedParts.some(p => rule.requires.has(p));
      if (!hasPair && requireds.length === 0) {
        issues.push({
          id: id(), severity: "error", category: "Paired Devices",
          title: `${rule.label} "${dep.name}" has no paired ${rule.requiresLabel}`,
          detail: `${rule.label} must always be paired with a ${rule.requiresLabel}. This device cannot be quoted standalone.`,
          deviceIds: [dep.id],
        });
      }
    }
  }

  for (const cl of corridorLights) {
    const connected = getConnectedDevices(cl.id, connections, devices);
    const roomDevices = connected.filter(d => {
      const lib = DEVICE_LIBRARY.find(l => l.part === d.part);
      return lib && (lib.category === "Room Station" || lib.category === "High Security" || lib.category === "Pushbutton");
    });

    const maxPorts = cl.part === "R5KCL546" ? 6 : cl.part === "R5KCL516" ? 6 : cl.part === "R5KCL506" ? 6 : 6;
    if (roomDevices.length > maxPorts) {
      issues.push({
        id: id(), severity: "error", category: "Room Device Limits",
        title: `Corridor light "${cl.name}" has too many room devices`,
        detail: `${roomDevices.length} room devices connected. Maximum is ${maxPorts} per corridor light.`,
        deviceIds: [cl.id, ...roomDevices.map(d => d.id)],
      });
    }
  }

  const termBoardsWithDevices = termBoards.map(tb => {
    const chain = getKBusChain(tb.id, connections, devices);
    return { board: tb, kbusCount: chain.filter(d => d.id !== tb.id && isKBusDevice(d)).length };
  });

  for (const { board, kbusCount } of termBoardsWithDevices) {
    const connectedPSUs = getConnectedDevices(board.id, connections, devices).filter(isPowerSupply);
    if (kbusCount > 40 && connectedPSUs.length <= 1) {
      issues.push({
        id: id(), severity: "warning", category: "Power",
        title: `Termination board "${board.name}" may need additional power`,
        detail: `${kbusCount} devices on board with ${connectedPSUs.length} power supply. Consider adding additional power supply for 40+ devices.`,
        deviceIds: [board.id],
      });
    }
  }

  const visited = new Set<string>();
  for (const l2k of l2ks) {
    const kbDef = DEVICE_DEFS[l2k.part];
    if (!kbDef) continue;
    const kbPorts = kbDef.ports.filter(p => p.type === "KB");
    for (const port of kbPorts) {
      const kbConns = connections.filter(c =>
        c.type === "KB" &&
        ((c.fromId === l2k.id && c.fromPort === port.id) || (c.toId === l2k.id && c.toPort === port.id))
      );
      for (const conn of kbConns) {
        const nextId = conn.fromId === l2k.id ? conn.toId : conn.fromId;
        if (visited.has(nextId)) continue;
        const chain = getKBusChain(nextId, connections, devices, new Set([l2k.id]));
        chain.forEach(d => visited.add(d.id));

        if (chain.length > DAISY_CHAIN_LIMITS.manufacturer) {
          issues.push({
            id: id(), severity: "error", category: "Daisy Chain",
            title: `K-Bus daisy chain exceeds manufacturer limit`,
            detail: `Chain from "${l2k.name}" port ${port.id} has ${chain.length} devices. Manufacturer max is ${DAISY_CHAIN_LIMITS.manufacturer}.`,
            deviceIds: [l2k.id, ...chain.map(d => d.id)],
          });
        } else if (chain.length > DAISY_CHAIN_LIMITS.marshallRecommended) {
          issues.push({
            id: id(), severity: "warning", category: "Daisy Chain",
            title: `K-Bus daisy chain exceeds Marshall recommended limit`,
            detail: `Chain from "${l2k.name}" port ${port.id} has ${chain.length} devices. Marshall recommends ${DAISY_CHAIN_LIMITS.marshallRecommended} or fewer.`,
            deviceIds: [l2k.id, ...chain.map(d => d.id)],
          });
        }
      }
    }
  }

  if (l2ks.length > 1) {
    const l2kLoads = l2ks.map(l2k => {
      const chain = getKBusChain(l2k.id, connections, devices);
      return { l2k, count: chain.filter(d => d.id !== l2k.id && isKBusDevice(d)).length };
    });
    const maxLoad = Math.max(...l2kLoads.map(l => l.count));
    const minLoad = Math.min(...l2kLoads.map(l => l.count));
    if (maxLoad > 0 && minLoad > 0 && maxLoad > minLoad * 2.5) {
      issues.push({
        id: id(), severity: "warning", category: "Load Balance",
        title: "Unbalanced L2K load distribution",
        detail: `L2K loads range from ${minLoad} to ${maxLoad} devices. Distribute load more evenly across L2Ks.`,
        deviceIds: l2kLoads.map(l => l.l2k.id),
      });
    }
  }

  for (const msc of mscs) {
    const lnetConns = getLNetConnections(msc.id, connections);
    if (lnetConns.length > 0) {
      const utilizations = lnetConns.map(c => {
        const l2kId = c.fromId === msc.id ? c.toId : c.fromId;
        const chain = getKBusChain(l2kId, connections, devices);
        return chain.filter(d => d.id !== l2kId && isKBusDevice(d)).length;
      });
      const maxUtil = Math.max(...utilizations, 0);
      if (maxUtil >= L2K_LIMITS.maxKBusDevices &&
          lnetConns.length >= MSC_LIMITS.maxL2Ks) {
        issues.push({
          id: id(), severity: "error", category: "Bottleneck",
          title: "System at capacity - no room for expansion",
          detail: "All L2Ks are at or near capacity and MSC has maximum L2K connections. No room for expansion.",
          deviceIds: [msc.id],
        });
      }
    }
  }

  for (const conn of connections) {
    const fromDev = devices.find(d => d.id === conn.fromId);
    const toDev = devices.find(d => d.id === conn.toId);
    if (!fromDev || !toDev) continue;
    const result = validateConnection(fromDev, conn.type, toDev, conn.type, connections);
    if (!result.valid) {
      issues.push({
        id: id(), severity: "error", category: "Illegal Connection",
        title: `Invalid ${conn.type} connection: ${fromDev.name} to ${toDev.name}`,
        detail: result.reason || "This connection violates the system hierarchy rules.",
        deviceIds: [fromDev.id, toDev.id],
      });
    }
  }

  return issues;
}

export interface QuoteChecklist {
  label: string;
  passed: boolean;
  detail: string;
}

export function runQuoteChecklist(
  devices: Device[],
  connections: Connection[]
): QuoteChecklist[] {
  const l2ks = devices.filter(isL2K);
  const mscs = devices.filter(isMSC);
  const termBoards = devices.filter(isTermBoard);
  const powerSupplies = devices.filter(isPowerSupply);
  const kbusDevices = devices.filter(isKBusDevice);

  const checks: QuoteChecklist[] = [];

  const maxPerL2K = l2ks.reduce((max, l2k) => {
    const chain = getKBusChain(l2k.id, connections, devices);
    return Math.max(max, chain.filter(d => d.id !== l2k.id && isKBusDevice(d)).length);
  }, 0);
  checks.push({
    label: "K-Bus devices per L2K <= 46",
    passed: maxPerL2K <= L2K_LIMITS.maxKBusDevices,
    detail: `Max per L2K: ${maxPerL2K}`,
  });

  checks.push({
    label: "Total devices per MSC <= 92",
    passed: kbusDevices.length <= MSC_LIMITS.maxKBusDevices,
    detail: `Total K-Bus: ${kbusDevices.length}`,
  });

  checks.push({
    label: "Power supplies match board count",
    passed: powerSupplies.length >= termBoards.length,
    detail: `${powerSupplies.length} PSU for ${termBoards.length} boards`,
  });

  const designIssues = validateDesign(devices, connections);
  const hasPairedIssues = designIssues.some(i => i.category === "Paired Devices");
  checks.push({
    label: "Paired devices validated",
    passed: !hasPairedIssues,
    detail: hasPairedIssues ? "Some devices missing required pairs" : "All pairs valid",
  });

  const hasAudioIssues = designIssues.some(i =>
    i.category === "Room Device Limits" && i.severity === "error"
  );
  checks.push({
    label: "Audio paths confirmed",
    passed: !hasAudioIssues,
    detail: hasAudioIssues ? "Some corridor lights overloaded" : "Audio paths OK",
  });

  const totalLabor = devices.reduce((sum, d) => {
    const lib = DEVICE_LIBRARY.find(l => l.part === d.part);
    return sum + (lib?.laborMinutes || 0);
  }, 0);
  checks.push({
    label: "Labor calculated via minutes-per-device",
    passed: totalLabor > 0,
    detail: totalLabor > 0
      ? `${Math.floor(totalLabor / 60)}h ${totalLabor % 60}m (before 30% contingency)`
      : "No labor data",
  });

  checks.push({
    label: "Cable labor calculated (8 hrs / 1000 ft standard)",
    passed: false,
    detail: "Verify cable runs are documented with footage",
  });

  checks.push({
    label: "Freight applied",
    passed: false,
    detail: "Verify freight charges are included in quote",
  });

  if (mscs.length > 0) {
    const lnetConns = getLNetConnections(mscs[0].id, connections);
    const l2kCount = lnetConns.filter(c => {
      const otherId = c.fromId === mscs[0].id ? c.toId : c.fromId;
      return devices.find(d => d.id === otherId)?.part === "R5KL2KA";
    }).length;

    checks.push({
      label: "MSC not at 100% capacity",
      passed: l2kCount < MSC_LIMITS.maxL2Ks && kbusDevices.length < MSC_LIMITS.maxKBusDevices,
      detail: `${l2kCount}/${MSC_LIMITS.maxL2Ks} L2Ks, ${kbusDevices.length}/${MSC_LIMITS.maxKBusDevices} devices`,
    });
  }

  return checks;
}

export const LABOR_CONTINGENCY_PERCENT = 30;
export const CABLE_LABOR_HOURS_PER_1000FT = 8;
