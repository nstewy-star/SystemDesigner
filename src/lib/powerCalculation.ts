import type {
  Device, Connection, DeviceLibraryItem,
  PowerCalculationResult, PowerIssue, PowerIssueSeverity,
  LNetSupplyCalc, KBusSupplyCalc, RoomCalcEntry, RoomLoadClassification,
  KBusDeviceEntry, KBusLegEntry, HeadendCheckItem, PowerSummary,
} from "../types";
import { DEVICE_DEFS, DEVICE_LIBRARY } from "../data/devices";

const LNET_SUPPLY_CAPACITY_A = 2.4;
const LNET_DESIGN_LIMIT_PERCENT = 80;
const LNET_DESIGN_LIMIT_A = LNET_SUPPLY_CAPACITY_A * (LNET_DESIGN_LIMIT_PERCENT / 100);

const KBUS_SUPPLY_CAPACITY_A = 4.65;
const KBUS_DESIGN_LIMIT_PERCENT = 60;
const KBUS_DESIGN_LIMIT_A = KBUS_SUPPLY_CAPACITY_A * (KBUS_DESIGN_LIMIT_PERCENT / 100);

const MAX_L2KA_PER_MSC = 4;
const MAX_KBUS_DEVICES_PER_L2KA = 46;
const MARSHALL_KBUS_PER_L2KA = 40;
const MAX_DEVICES_PER_MSC = 90;
const MAX_DAISY_CHAIN = 22;
const VOLTAGE_DROP_CABLE_THRESHOLD_FT = 300;
const MAX_DEVICES_PER_KBUS_LEG = 16;
const MAX_DEVICES_PER_L2KA_ABSOLUTE = 40;

const AUDIO_PARTS = new Set([
  "R5KPS1A", "R5KPS1EA", "R5KPD2A", "R5KPD2EA", "R5KPS1LCA",
  "R5KCL516", "R5KCL546", "CLA246",
  "R5KDC46", "R5KDC16D",
  "R5KSSTF", "R5KSDTY",
  "HSS401",
]);

const KBUS_DEVICE_CATEGORIES = new Set([
  "Corridor Light", "Domeless", "Room Station", "High Security", "Pushbutton",
]);

const CORRIDOR_LIGHT_PARTS = new Set([
  "R5KCL506", "R5KCL516", "R5KCL546", "CLA246",
]);

const PATIENT_STATION_PARTS = new Set([
  "R5KPS1A", "R5KPS1EA", "R5KPS1V", "R5KPD2A", "R5KPD2EA", "R5KPS1LCA",
]);

const NON_KBUS_PARTS = new Set([
  "R5KCONS", "R5K8PRT", "351010", "351006",
  "R5KMSC", "R5KL2KA", "R5KMTRM", "R5KMPR15", "R5KMPR36",
]);

function getLib(part: string, allDevices: DeviceLibraryItem[]): DeviceLibraryItem | undefined {
  return allDevices.find(d => d.part === part) || DEVICE_LIBRARY.find(d => d.part === part);
}

function isKBusDevice(device: Device, allDevices: DeviceLibraryItem[]): boolean {
  if (NON_KBUS_PARTS.has(device.part)) return false;
  const lib = getLib(device.part, allDevices);
  return lib ? KBUS_DEVICE_CATEGORIES.has(lib.category) : false;
}

function isAudioDevice(part: string): boolean {
  return AUDIO_PARTS.has(part);
}

function getConnectedDevices(deviceId: string, connections: Connection[], devices: Device[]): Device[] {
  const ids = new Set<string>();
  connections.forEach(c => {
    if (c.fromId === deviceId) ids.add(c.toId);
    if (c.toId === deviceId) ids.add(c.fromId);
  });
  return devices.filter(d => ids.has(d.id));
}

function getConnectedByType(deviceId: string, portType: string, connections: Connection[], devices: Device[]): Device[] {
  const ids = new Set<string>();
  connections.filter(c => c.type === portType).forEach(c => {
    if (c.fromId === deviceId) ids.add(c.toId);
    if (c.toId === deviceId) ids.add(c.fromId);
  });
  return devices.filter(d => ids.has(d.id));
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

function getKBusLegChain(
  startId: string,
  portId: string,
  connections: Connection[],
  devices: Device[],
  parentId: string
): Device[] {
  const firstConns = connections.filter(c =>
    c.type === "KB" &&
    ((c.fromId === startId && c.fromPort === portId) ||
     (c.toId === startId && c.toPort === portId))
  );

  const chain: Device[] = [];
  for (const conn of firstConns) {
    const nextId = conn.fromId === startId ? conn.toId : conn.fromId;
    if (nextId === parentId) continue;
    chain.push(...getKBusChain(nextId, connections, devices, new Set([startId, parentId])));
  }
  return chain;
}

function classifyRoom(
  device: Device,
  connections: Connection[],
  devices: Device[],
  allDevices: DeviceLibraryItem[]
): RoomLoadClassification {
  const connected = getConnectedDevices(device.id, connections, devices);
  const nonAudioStations = connected.filter(d => !isAudioDevice(d.part) && isKBusDevice(d, allDevices));
  const audioStations = connected.filter(d => isAudioDevice(d.part) && isKBusDevice(d, allDevices));

  if (audioStations.length >= 2 || (audioStations.length === 1 && nonAudioStations.length >= 4)) {
    return "heavy";
  }
  if (audioStations.length === 1 && nonAudioStations.length <= 3) {
    return "medium";
  }
  if (audioStations.length === 0 && nonAudioStations.length <= 3) {
    return "light";
  }
  return "medium";
}

function getRoomEstimatedCurrent(classification: RoomLoadClassification): number {
  switch (classification) {
    case "light": return 0.020;
    case "medium": return 0.050;
    case "heavy": return 0.100;
  }
}

export function calculatePower(
  devices: Device[],
  connections: Connection[],
  allDevices: DeviceLibraryItem[] = DEVICE_LIBRARY,
  floorplanScale: number | null = null
): PowerCalculationResult {
  const issues: PowerIssue[] = [];
  let issueId = 0;
  const id = () => `power-issue-${issueId++}`;

  const mscs = devices.filter(d => d.part === "R5KMSC");
  const l2kas = devices.filter(d => d.part === "R5KL2KA");
  const termBoards = devices.filter(d => d.part === "R5KMTRM");
  const psus15 = devices.filter(d => d.part === "R5KMPR15");
  const psus36 = devices.filter(d => d.part === "R5KMPR36");
  const allPSUs = [...psus15, ...psus36];
  const kbusDevices = devices.filter(d => isKBusDevice(d, allDevices));
  const corridorLights = devices.filter(d => CORRIDOR_LIGHT_PARTS.has(d.part));
  const patientStations = devices.filter(d => PATIENT_STATION_PARTS.has(d.part));

  const LNET_DEVICE_PARTS = new Set(["R5KMSC", "R5KL2KA"]);

  const lnetSupplies: LNetSupplyCalc[] = [];
  for (const msc of mscs) {
    const connectedL2KAs = getConnectedByType(msc.id, "LNET", connections, devices)
      .filter(d => d.part === "R5KL2KA");

    const roomBreakdown: RoomCalcEntry[] = [];
    let totalLNetLoad = 0;

    const mscLib = getLib("R5KMSC", allDevices);
    if (mscLib) totalLNetLoad += (mscLib.power_mA || 0) / 1000;

    for (const l2ka of connectedL2KAs) {
      const l2kaLib = getLib("R5KL2KA", allDevices);
      if (l2kaLib) totalLNetLoad += (l2kaLib.power_mA || 0) / 1000;

      const chain = getKBusChain(l2ka.id, connections, devices);
      const kbDevicesOnL2K = chain.filter(d =>
        d.id !== l2ka.id && !LNET_DEVICE_PARTS.has(d.part) && isKBusDevice(d, allDevices)
      );

      for (const kbDev of kbDevicesOnL2K) {
        const hasAudio = isAudioDevice(kbDev.part);
        const connectedCount = getConnectedDevices(kbDev.id, connections, devices).length;
        const classification = classifyRoom(kbDev, connections, devices, allDevices);
        const estimatedCurrent = getRoomEstimatedCurrent(classification);

        roomBreakdown.push({
          deviceId: kbDev.id,
          deviceName: kbDev.name,
          part: kbDev.part,
          classification,
          estimatedCurrent_A: estimatedCurrent,
          hasAudio,
          connectedDeviceCount: connectedCount,
        });
      }
    }

    const utilization = (totalLNetLoad / LNET_SUPPLY_CAPACITY_A) * 100;
    let status: PowerIssueSeverity = "pass";
    if (utilization > 100) status = "critical";
    else if (utilization > LNET_DESIGN_LIMIT_PERCENT) status = "error";
    else if (utilization > LNET_DESIGN_LIMIT_PERCENT * 0.9) status = "warning";

    lnetSupplies.push({
      supplyCapacity_A: LNET_SUPPLY_CAPACITY_A,
      designLimit_A: LNET_DESIGN_LIMIT_A,
      designLimitPercent: LNET_DESIGN_LIMIT_PERCENT,
      totalLoad_A: totalLNetLoad,
      utilization,
      mscId: msc.id,
      mscName: msc.name,
      l2kaCount: connectedL2KAs.length,
      maxL2KA: MAX_L2KA_PER_MSC,
      roomBreakdown,
      status,
    });

    if (connectedL2KAs.length > MAX_L2KA_PER_MSC) {
      issues.push({
        id: id(), severity: "critical", domain: "lnet", rule: "2.2",
        title: `MSC "${msc.name}" exceeds L2KA limit`,
        detail: `${connectedL2KAs.length} L2KAs connected. Maximum is ${MAX_L2KA_PER_MSC} per MSC.`,
        deviceIds: [msc.id],
      });
    }

    if (utilization > LNET_DESIGN_LIMIT_PERCENT) {
      issues.push({
        id: id(), severity: "error", domain: "lnet", rule: "2.1",
        title: `L-Net supply exceeds 80% design limit on MSC "${msc.name}"`,
        detail: `Total L-Net load: ${totalLNetLoad.toFixed(3)}A (${utilization.toFixed(1)}%). Marshall design limit is ${LNET_DESIGN_LIMIT_PERCENT}% of ${LNET_SUPPLY_CAPACITY_A}A = ${LNET_DESIGN_LIMIT_A.toFixed(2)}A.`,
        deviceIds: [msc.id],
      });
    }
  }

  const kbusSupplies: KBusSupplyCalc[] = [];
  for (const tb of termBoards) {
    const connectedPSUs = getConnectedByType(tb.id, "POWER", connections, devices)
      .filter(d => d.part === "R5KMPR15" || d.part === "R5KMPR36");

    const psu = connectedPSUs.find(p => p.part === "R5KMPR15") || connectedPSUs[0];
    const def = DEVICE_DEFS["R5KMTRM"];
    const kbPorts = def ? def.ports.filter(p => p.type === "KB") : [];

    const deviceBreakdown: KBusDeviceEntry[] = [];
    const legBreakdown: KBusLegEntry[] = [];
    let totalKBusLoad = 0;

    const parentL2KA = getConnectedByType(tb.id, "KB", connections, devices)
      .find(d => d.part === "R5KL2KA");

    for (const port of kbPorts) {
      const legDevices = getKBusLegChain(tb.id, port.id, connections, devices, parentL2KA?.id || "");
      const kbLegDevices = legDevices.filter(d => isKBusDevice(d, allDevices));

      let legCurrent = 0;
      for (const dev of kbLegDevices) {
        const lib = getLib(dev.part, allDevices);
        const current = lib?.power_A || (lib?.power_mA || 0) / 1000;
        legCurrent += current;
        deviceBreakdown.push({
          deviceId: dev.id,
          deviceName: dev.name,
          part: dev.part,
          category: lib?.category || "Unknown",
          current_A: current,
        });
      }

      totalKBusLoad += legCurrent;

      let estimatedCableLength: number | null = null;
      if (floorplanScale && kbLegDevices.length > 0) {
        let totalPixelDist = 0;
        let prevDev: Device = tb as unknown as Device;
        for (const dev of kbLegDevices) {
          totalPixelDist += Math.sqrt((dev.x - prevDev.x) ** 2 + (dev.y - prevDev.y) ** 2);
          prevDev = dev;
        }
        estimatedCableLength = totalPixelDist * floorplanScale;
      }

      legBreakdown.push({
        portId: port.id,
        portLabel: port.label,
        deviceCount: kbLegDevices.length,
        totalCurrent_A: legCurrent,
        estimatedCableLength_ft: estimatedCableLength,
        voltageDropConcern: estimatedCableLength !== null && estimatedCableLength > VOLTAGE_DROP_CABLE_THRESHOLD_FT,
      });

      if (kbLegDevices.length > MAX_DEVICES_PER_KBUS_LEG) {
        issues.push({
          id: id(), severity: "critical", domain: "kbus", rule: "8",
          title: `K-Bus leg ${port.label} on "${tb.name}" exceeds 16 devices`,
          detail: `${kbLegDevices.length} devices on single K-Bus leg. Red flag: mandatory redesign.`,
          deviceIds: [tb.id, ...kbLegDevices.map(d => d.id)],
        });
      }

      if (estimatedCableLength !== null && estimatedCableLength > VOLTAGE_DROP_CABLE_THRESHOLD_FT) {
        issues.push({
          id: id(), severity: "warning", domain: "kbus", rule: "3.4",
          title: `Voltage drop concern on leg ${port.label} of "${tb.name}"`,
          detail: `Estimated cable run: ${estimatedCableLength.toFixed(0)}ft exceeds ${VOLTAGE_DROP_CABLE_THRESHOLD_FT}ft threshold. Evaluate voltage drop.`,
          deviceIds: [tb.id],
        });
      }
    }

    const utilization = (totalKBusLoad / KBUS_SUPPLY_CAPACITY_A) * 100;
    let status: PowerIssueSeverity = "pass";
    if (utilization > 100) status = "critical";
    else if (utilization > KBUS_DESIGN_LIMIT_PERCENT) status = "error";
    else if (utilization > KBUS_DESIGN_LIMIT_PERCENT * 0.9) status = "warning";

    kbusSupplies.push({
      supplyCapacity_A: KBUS_SUPPLY_CAPACITY_A,
      designLimit_A: KBUS_DESIGN_LIMIT_A,
      designLimitPercent: KBUS_DESIGN_LIMIT_PERCENT,
      totalLoad_A: totalKBusLoad,
      utilization,
      termBoardId: tb.id,
      termBoardName: tb.name,
      psuId: psu?.id,
      psuName: psu?.name,
      psuPart: psu?.part,
      deviceBreakdown,
      legBreakdown,
      status,
    });

    if (utilization > KBUS_DESIGN_LIMIT_PERCENT) {
      issues.push({
        id: id(), severity: "error", domain: "kbus", rule: "3.1",
        title: `K-Bus supply exceeds 60% design limit on "${tb.name}"`,
        detail: `Total K-Bus load: ${totalKBusLoad.toFixed(3)}A (${utilization.toFixed(1)}%). Marshall design limit is ${KBUS_DESIGN_LIMIT_PERCENT}% of ${KBUS_SUPPLY_CAPACITY_A}A = ${KBUS_DESIGN_LIMIT_A.toFixed(2)}A.`,
        deviceIds: [tb.id],
      });
    }

    if (connectedPSUs.length === 0) {
      issues.push({
        id: id(), severity: "error", domain: "kbus", rule: "3.3",
        title: `Termination board "${tb.name}" has no power supply`,
        detail: `Marshall standard: 1 K-Bus power supply per termination board.`,
        deviceIds: [tb.id],
      });
    }
  }

  if (termBoards.length > 0 && allPSUs.filter(p => p.part === "R5KMPR15").length < termBoards.length) {
    issues.push({
      id: id(), severity: "warning", domain: "kbus", rule: "3.3",
      title: "Insufficient K-Bus power supplies",
      detail: `${psus15.length} 15V PSUs for ${termBoards.length} termination boards. Standard is 1:1.`,
    });
  }

  for (const l2ka of l2kas) {
    const chain = getKBusChain(l2ka.id, connections, devices);
    const kbOnL2K = chain.filter(d => d.id !== l2ka.id && isKBusDevice(d, allDevices));

    if (kbOnL2K.length > MAX_DEVICES_PER_L2KA_ABSOLUTE) {
      issues.push({
        id: id(), severity: "critical", domain: "kbus", rule: "8",
        title: `L2KA "${l2ka.name}" has ${kbOnL2K.length} devices`,
        detail: `Red flag: exceeds ${MAX_DEVICES_PER_L2KA_ABSOLUTE} devices per L2KA. Mandatory redesign.`,
        deviceIds: [l2ka.id],
      });
    } else if (kbOnL2K.length > MARSHALL_KBUS_PER_L2KA) {
      issues.push({
        id: id(), severity: "warning", domain: "kbus", rule: "3.2",
        title: `L2KA "${l2ka.name}" exceeds Marshall recommended limit`,
        detail: `${kbOnL2K.length} K-Bus devices. Recommend ${MARSHALL_KBUS_PER_L2KA} or fewer.`,
        deviceIds: [l2ka.id],
      });
    }
  }

  const totalKBusDeviceCount = kbusDevices.length;
  for (const msc of mscs) {
    if (totalKBusDeviceCount > MAX_DEVICES_PER_MSC) {
      issues.push({
        id: id(), severity: "critical", domain: "kbus", rule: "8",
        title: `Total devices (${totalKBusDeviceCount}) exceeds ${MAX_DEVICES_PER_MSC} per MSC`,
        detail: `Red flag: mandatory redesign required.`,
        deviceIds: [msc.id],
      });
    }
  }

  validatePairing(devices, connections, issues, id);

  if (l2kas.length > 1) {
    const loads = l2kas.map(l2ka => {
      const chain = getKBusChain(l2ka.id, connections, devices);
      return chain.filter(d => d.id !== l2ka.id && isKBusDevice(d, allDevices)).length;
    });
    const heavyRooms = devices.filter(d => {
      const c = classifyRoom(d, connections, devices, allDevices);
      return c === "heavy";
    });
    if (heavyRooms.length > 0 && l2kas.length > 1) {
      const heavyPerL2K = l2kas.map(l2ka => {
        const chain = getKBusChain(l2ka.id, connections, devices);
        return chain.filter(d => heavyRooms.some(hr => hr.id === d.id)).length;
      });
      const maxHeavy = Math.max(...heavyPerL2K);
      const totalHeavy = heavyPerL2K.reduce((a, b) => a + b, 0);
      if (totalHeavy > 0 && maxHeavy > totalHeavy * 0.6) {
        issues.push({
          id: id(), severity: "warning", domain: "kbus", rule: "7",
          title: "Heavy rooms concentrated on single L2KA",
          detail: `One L2KA has ${maxHeavy} of ${totalHeavy} heavy rooms. Distribute evenly.`,
        });
      }
    }

    const maxLoad = Math.max(...loads);
    const minLoad = Math.min(...loads.filter(l => l > 0));
    if (maxLoad > 0 && minLoad > 0 && maxLoad > minLoad * 2.5) {
      issues.push({
        id: id(), severity: "warning", domain: "kbus", rule: "7",
        title: "Unbalanced L2KA load distribution",
        detail: `L2KA loads range from ${minLoad} to ${maxLoad} devices. Distribute more evenly.`,
      });
    }
  }

  const headendChecklist = buildHeadendChecklist(
    lnetSupplies, kbusSupplies, issues,
    mscs, l2kas, termBoards, allPSUs, kbusDevices, allDevices, devices, connections
  );

  const redFlags = issues.filter(i => i.severity === "critical");

  const summary: PowerSummary = {
    totalLNetCurrent_A: lnetSupplies.reduce((s, l) => s + l.totalLoad_A, 0),
    totalKBusCurrent_A: kbusSupplies.reduce((s, k) => s + k.totalLoad_A, 0),
    totalDevices: devices.length,
    totalKBusDevices: kbusDevices.length,
    mscCount: mscs.length,
    l2kaCount: l2kas.length,
    termBoardCount: termBoards.length,
    psuCount: allPSUs.length,
    corridorLightCount: corridorLights.length,
    patientStationCount: patientStations.length,
  };

  return {
    lnetSupplies,
    kbusSupplies,
    issues,
    headendChecklist,
    redFlags,
    summary,
  };
}

function validatePairing(
  devices: Device[],
  connections: Connection[],
  issues: PowerIssue[],
  id: () => string
) {
  const dutyDomeless = devices.filter(d => d.part === "R5KDC16D");
  const dutyStations = devices.filter(d => d.part === "R5KSDTY");
  for (const dd of dutyDomeless) {
    const connected = getConnectedDevices(dd.id, connections, devices);
    const hasPair = connected.some(d => d.part === "R5KSDTY");
    if (!hasPair && dutyStations.length === 0) {
      issues.push({
        id: id(), severity: "error", domain: "kbus", rule: "5",
        title: `Duty Domeless "${dd.name}" has no paired Duty Station`,
        detail: `Every duty domeless must have a duty station. Improper pairing causes field failures.`,
        deviceIds: [dd.id],
      });
    }
  }

  const lightingRelays = devices.filter(d => d.part === "R5KPS1LCA");
  for (const lr of lightingRelays) {
    const connected = getConnectedDevices(lr.id, connections, devices);
    const hasPair = connected.some(d => PATIENT_STATION_PARTS.has(d.part));
    if (!hasPair) {
      issues.push({
        id: id(), severity: "error", domain: "kbus", rule: "5",
        title: `Lighting relay "${lr.name}" has no paired patient station`,
        detail: `Every lighting relay must have a patient station. Orphan high-current device.`,
        deviceIds: [lr.id],
      });
    }
  }

  const clParts = devices.filter(d => CORRIDOR_LIGHT_PARTS.has(d.part));
  for (const cl of clParts) {
    const connected = getConnectedDevices(cl.id, connections, devices);
    const hasPS = connected.some(d => PATIENT_STATION_PARTS.has(d.part));
    if (!hasPS) {
      issues.push({
        id: id(), severity: "warning", domain: "kbus", rule: "5",
        title: `Corridor light "${cl.name}" has no patient station`,
        detail: `Verify pairing: every lighting relay should have a patient station.`,
        deviceIds: [cl.id],
      });
    }
  }
}

function buildHeadendChecklist(
  lnetSupplies: LNetSupplyCalc[],
  kbusSupplies: KBusSupplyCalc[],
  issues: PowerIssue[],
  mscs: Device[],
  _l2kas: Device[],
  termBoards: Device[],
  allPSUs: Device[],
  kbusDevices: Device[],
  _allDevices: DeviceLibraryItem[],
  devices: Device[],
  connections: Connection[]
): HeadendCheckItem[] {
  const checks: HeadendCheckItem[] = [];

  const lnetPass = lnetSupplies.every(l => l.utilization <= l.designLimitPercent);
  checks.push({
    label: "Total L-Net current <= 80% of supply",
    passed: lnetPass,
    detail: lnetSupplies.map(l => `${l.mscName}: ${l.totalLoad_A.toFixed(3)}A / ${l.designLimit_A.toFixed(2)}A (${l.utilization.toFixed(1)}%)`).join("; ") || "No MSC found",
    rule: "6.1",
  });

  const kbusPass = kbusSupplies.every(k => k.utilization <= k.designLimitPercent);
  checks.push({
    label: "Total K-Bus current <= 60% of supply",
    passed: kbusPass,
    detail: kbusSupplies.map(k => `${k.termBoardName}: ${k.totalLoad_A.toFixed(3)}A / ${k.designLimit_A.toFixed(2)}A (${k.utilization.toFixed(1)}%)`).join("; ") || "No term boards found",
    rule: "6.2",
  });

  const l2kaPerMSC = mscs.map(msc => {
    return getConnectedByType(msc.id, "LNET", connections, devices)
      .filter(d => d.part === "R5KL2KA").length;
  });
  const l2kaPass = l2kaPerMSC.every(c => c <= MAX_L2KA_PER_MSC);
  checks.push({
    label: "<= 4 L2KA per MSC",
    passed: l2kaPass,
    detail: mscs.map((m, i) => `${m.name}: ${l2kaPerMSC[i]}/${MAX_L2KA_PER_MSC}`).join("; ") || "No MSC found",
    rule: "6.3",
  });

  const psu15Count = allPSUs.filter(p => p.part === "R5KMPR15").length;
  const onePerBoard = psu15Count >= termBoards.length;
  checks.push({
    label: "One supply per termination board",
    passed: onePerBoard,
    detail: `${psu15Count} PSUs for ${termBoards.length} boards`,
    rule: "6.4",
  });

  const hasSharedSupplies = !onePerBoard;
  checks.push({
    label: "No shared K-Bus supplies without calc",
    passed: !hasSharedSupplies,
    detail: hasSharedSupplies ? "Some boards may share supplies - verify with current calc" : "Each board has dedicated supply",
    rule: "6.5",
  });

  const hasRoomClassification = lnetSupplies.some(l => l.roomBreakdown.length > 0);
  checks.push({
    label: "Room load classification completed",
    passed: hasRoomClassification || kbusDevices.length === 0,
    detail: hasRoomClassification ? `${lnetSupplies.reduce((s, l) => s + l.roomBreakdown.length, 0)} rooms classified` : "No rooms to classify",
    rule: "6.6",
  });

  const heavyRoomsDistributed = !issues.some(i => i.rule === "7" && i.title.includes("Heavy rooms"));
  checks.push({
    label: "Heavy rooms distributed across L2KA modules",
    passed: heavyRoomsDistributed,
    detail: heavyRoomsDistributed ? "Heavy rooms are distributed" : "Heavy rooms concentrated - redistribute",
    rule: "6.7",
  });

  return checks;
}

export const POWER_CONSTANTS = {
  LNET_SUPPLY_CAPACITY_A,
  LNET_DESIGN_LIMIT_PERCENT,
  LNET_DESIGN_LIMIT_A,
  KBUS_SUPPLY_CAPACITY_A,
  KBUS_DESIGN_LIMIT_PERCENT,
  KBUS_DESIGN_LIMIT_A,
  MAX_L2KA_PER_MSC,
  MAX_KBUS_DEVICES_PER_L2KA,
  MARSHALL_KBUS_PER_L2KA,
  MAX_DEVICES_PER_MSC,
  MAX_DAISY_CHAIN,
  VOLTAGE_DROP_CABLE_THRESHOLD_FT,
  MAX_DEVICES_PER_KBUS_LEG,
};
