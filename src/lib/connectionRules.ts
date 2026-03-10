import type { Device, Connection, PortType } from "../types";
import { DEVICE_DEFS, DEVICE_LIBRARY } from "../data/devices";

const CORRIDOR_LIGHTS = new Set([
  "R5KCL506", "R5KCL516", "R5KCL546",
  "CLA246", "CLA222", "CLA244", "CLA214D", "CLAR4", "CLAR46",
  "CLV122", "CLV144",
]);

const DOMELESS_CONTROLLERS = new Set([
  "R5KDC06", "R5KDC46", "R5KDC016", "R5KDC16D",
  "R5KDCRC4", "R5KDCRC4S",
  "DCV100", "DCV116", "DCA200", "DCA216", "DCA214D",
  "R4KOUT4R", "R4KOUT4S",
]);

const PATIENT_STATIONS = new Set([
  "R5KPS1A", "R5KPS1EA", "R5KPS1V", "R5KPD2A", "R5KPD2EA", "R5KPS1LCA",
  "R5KPPS", "R5KAUDPC", "R5KCANCEL", "R5KPC11WP",
  "R4K11V", "R4K12A", "R4K12AHZ", "R4K13VA", "R4K13VAH",
  "R4K14SA", "R4K15V", "R4K16LV", "R4K17V",
  "R4K21V", "R4K22A", "R4K2JACK", "R4K23VA",
  "R4KCNCL", "R4KDLC2", "R4KESR", "R4KFAM", "R4KFB1",
  "R4KRA1", "R4KSLC1", "R4KSR1", "R4KTVR1",
]);

const HIGH_SECURITY = new Set([
  "HSS400", "HSS401", "HSS433",
]);

const PUSHBUTTON_STATIONS = new Set([
  "R5KPB4", "R5KPB4CNF", "R5KSSTF", "R5KSDTY",
  "R4KSAR", "R4KSS",
  "R4KPB11", "R4KPB12", "R4KPB22", "R4KPB23", "R4KPB44",
  "R4KPC10", "R4KPC11",
  "R4KCB10", "R4KCB12", "R4KCB13",
  "R4KDY", "R4KDTY2", "R4KMST",
]);

const ROOM_DEVICES = new Set([
  ...PATIENT_STATIONS,
  ...HIGH_SECURITY,
  ...PUSHBUTTON_STATIONS,
]);

const KB_FIELD_DEVICES = new Set([
  ...CORRIDOR_LIGHTS,
  ...DOMELESS_CONTROLLERS,
  ...ROOM_DEVICES,
  "R4KPA25", "R4KANNV2", "R4KMQCV2",
]);

const ETHERNET_DEVICES = new Set([
  "R5KMSC", "R5K8PRT", "351010", "351006", "R5KCONS",
]);

const LNET_DEVICES = new Set([
  "R5KMSC", "R5KL2KA",
]);

const KB_PORT_COMPATIBILITY: Record<string, string[]> = {
  R5KL2KA: ["R5KMTRM"],
  R5KMTRM: [
    ...CORRIDOR_LIGHTS,
    ...DOMELESS_CONTROLLERS,
    ...ROOM_DEVICES,
    "R5KL2KA",
  ],
};

for (const part of CORRIDOR_LIGHTS) {
  KB_PORT_COMPATIBILITY[part] = [
    "R5KMTRM",
    ...CORRIDOR_LIGHTS,
    ...DOMELESS_CONTROLLERS,
    ...ROOM_DEVICES,
  ];
}

for (const part of DOMELESS_CONTROLLERS) {
  KB_PORT_COMPATIBILITY[part] = [
    "R5KMTRM",
    ...CORRIDOR_LIGHTS,
    ...DOMELESS_CONTROLLERS,
    ...ROOM_DEVICES,
  ];
}

for (const part of ROOM_DEVICES) {
  KB_PORT_COMPATIBILITY[part] = [
    ...CORRIDOR_LIGHTS,
    ...DOMELESS_CONTROLLERS,
    ...ROOM_DEVICES,
    "R5KMTRM",
  ];
}

KB_PORT_COMPATIBILITY["R4KPA25"] = ["R5KMTRM", ...CORRIDOR_LIGHTS];
KB_PORT_COMPATIBILITY["R4KANNV2"] = ["R5KMTRM", ...CORRIDOR_LIGHTS];
KB_PORT_COMPATIBILITY["R4KMQCV2"] = ["R5KMTRM", ...CORRIDOR_LIGHTS];

const POWER_PORT_COMPATIBILITY: Record<string, string[]> = {
  R5KMPR15: ["R5KMTRM"],
  R5KMPR36: ["R5KMSC", "R5KMTRM"],
  R5KMTRM: ["R5KMPR15", "R5KMPR36"],
  R5KMSC: ["R5KMPR36"],
  R4KPA25: ["R5KMPR15", "R5KMPR36"],
  R4KANNV2: ["R5KMPR15", "R5KMPR36"],
  R4KMQCV2: ["R5KMPR15", "R5KMPR36"],
};

export function getCompatibleDevices(
  devicePart: string,
  portType: string,
  excludeSelf: boolean = false
): string[] {
  let result: string[] = [];

  if (portType === "KB") {
    result = KB_PORT_COMPATIBILITY[devicePart] || [];
  } else if (portType === "LNET") {
    if (devicePart === "R5KMSC") result = ["R5KL2KA"];
    else if (devicePart === "R5KL2KA") result = ["R5KMSC"];
    else result = [];
  } else if (portType === "ETH") {
    result = [...ETHERNET_DEVICES].filter(p => p !== devicePart);
  } else if (portType === "POWER") {
    result = POWER_PORT_COMPATIBILITY[devicePart] || [];
  } else if (portType === "AC") {
    result = [];
  } else {
    const allParts = DEVICE_LIBRARY
      .filter(d => DEVICE_DEFS[d.part]?.ports.some(p => p.type === portType))
      .map(d => d.part);
    result = allParts;
  }

  if (excludeSelf) {
    result = result.filter(p => p !== devicePart);
  }

  return [...new Set(result)];
}

export function validateConnection(
  fromDevice: Device,
  fromPortType: string,
  toDevice: Device,
  toPortType: string,
  _connections: Connection[]
): { valid: boolean; reason?: string } {
  if (fromPortType !== toPortType) {
    return { valid: false, reason: `Cannot connect ${fromPortType} port to ${toPortType} port` };
  }

  if (fromDevice.id === toDevice.id) {
    return { valid: false, reason: "Cannot connect a device to itself" };
  }

  const type = fromPortType as PortType;
  const a = fromDevice.part;
  const b = toDevice.part;

  if (type === "KB") {
    const aCompat = KB_PORT_COMPATIBILITY[a];
    const bCompat = KB_PORT_COMPATIBILITY[b];
    if (aCompat && !aCompat.includes(b)) {
      return { valid: false, reason: `${a} cannot connect to ${b} via K-Bus` };
    }
    if (bCompat && !bCompat.includes(a)) {
      return { valid: false, reason: `${b} cannot connect to ${a} via K-Bus` };
    }
  }

  if (type === "LNET") {
    if (!LNET_DEVICES.has(a) || !LNET_DEVICES.has(b)) {
      return { valid: false, reason: "L-Net connections are only between MSC and L2KA" };
    }
    if (a === b) {
      return { valid: false, reason: "Cannot daisy-chain L-Net (home run only)" };
    }
  }

  if (type === "ETH") {
    if (!ETHERNET_DEVICES.has(a) && !ETHERNET_DEVICES.has(b)) {
      return { valid: false, reason: "At least one device must be an Ethernet network device" };
    }
  }

  if (type === "POWER") {
    const aCompat = POWER_PORT_COMPATIBILITY[a];
    if (aCompat && !aCompat.includes(b)) {
      return { valid: false, reason: `${a} power port cannot connect to ${b}` };
    }
    const bCompat = POWER_PORT_COMPATIBILITY[b];
    if (bCompat && !bCompat.includes(a)) {
      return { valid: false, reason: `${b} power port cannot connect to ${a}` };
    }
  }

  return { valid: true };
}

export function isDuplicateConnection(
  fromId: string,
  fromPort: string,
  toId: string,
  toPort: string,
  connections: Connection[]
): boolean {
  return connections.some(
    c =>
      (c.fromId === fromId && c.fromPort === fromPort && c.toId === toId && c.toPort === toPort) ||
      (c.fromId === toId && c.fromPort === toPort && c.toId === fromId && c.toPort === fromPort)
  );
}

export function checkMissingRequirements(
  devices: Device[],
  connections: Connection[]
): Array<{ device: Device; missing: Array<{ part: string; reason: string }> }> {
  const results: Array<{ device: Device; missing: Array<{ part: string; reason: string }> }> = [];

  const mscs = devices.filter(d => d.part === "R5KMSC");
  const l2ks = devices.filter(d => d.part === "R5KL2KA");

  for (const msc of mscs) {
    const missing: Array<{ part: string; reason: string }> = [];
    const hasL2K = connections.some(c =>
      c.type === "LNET" && (
        (c.fromId === msc.id && l2ks.some(l => l.id === c.toId)) ||
        (c.toId === msc.id && l2ks.some(l => l.id === c.fromId))
      )
    );
    if (!hasL2K && l2ks.length === 0) {
      missing.push({ part: "R5KL2KA", reason: "MSC needs at least one L2K for field devices" });
    }
    if (missing.length > 0) results.push({ device: msc, missing });
  }

  for (const l2k of l2ks) {
    const missing: Array<{ part: string; reason: string }> = [];
    const hasTermBoard = connections.some(c =>
      c.type === "KB" && (
        (c.fromId === l2k.id && devices.some(d => d.id === c.toId && d.part === "R5KMTRM")) ||
        (c.toId === l2k.id && devices.some(d => d.id === c.fromId && d.part === "R5KMTRM"))
      )
    );
    if (!hasTermBoard) {
      missing.push({ part: "R5KMTRM", reason: "L2K always feeds a termination board" });
    }
    if (missing.length > 0) results.push({ device: l2k, missing });
  }

  return results;
}

export function validateKBusCapacity(
  devices: Device[],
  connections: Connection[]
): Array<{ device: Device; count: number; warning: string; severity: "warning" | "error" }> {
  const warnings: Array<{ device: Device; count: number; warning: string; severity: "warning" | "error" }> = [];

  const l2ks = devices.filter(d => d.part === "R5KL2KA");
  for (const l2k of l2ks) {
    const visited = new Set<string>([l2k.id]);
    const queue = [l2k.id];
    let count = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      const kbConns = connections.filter(c =>
        c.type === "KB" && (c.fromId === current || c.toId === current)
      );
      for (const conn of kbConns) {
        const nextId = conn.fromId === current ? conn.toId : conn.fromId;
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        queue.push(nextId);
        const dev = devices.find(d => d.id === nextId);
        if (dev && KB_FIELD_DEVICES.has(dev.part)) count++;
      }
    }

    if (count > 46) {
      warnings.push({
        device: l2k, count,
        warning: `${count} K-Bus devices on L2K "${l2k.name}" exceeds maximum of 46`,
        severity: "error",
      });
    } else if (count > 40) {
      warnings.push({
        device: l2k, count,
        warning: `${count} K-Bus devices on L2K "${l2k.name}" exceeds Marshall recommended limit of 40`,
        severity: "warning",
      });
    }
  }

  return warnings;
}

export function getDeviceRequirements(part: string): { requires: string[]; notes: string[] } {
  const requires: string[] = [];
  const notes: string[] = [];

  switch (part) {
    case "R5KMSC":
      requires.push("R5KL2KA");
      requires.push("R5KMPR36");
      notes.push("Max 4 L2Ks, ~92 K-Bus devices");
      notes.push("Connects to L2KA via L-Net, consoles/switches via Ethernet");
      notes.push("Cannot connect directly to corridor lights, patient stations, or K-Bus devices");
      break;
    case "R5KL2KA":
      requires.push("R5KMTRM");
      requires.push("R5KMPR15");
      notes.push("Max 46 K-Bus devices, Marshall target 40");
      notes.push("Digital-to-analog gateway: L-Net in, K-Bus out");
      notes.push("Always feeds a termination board, not field devices directly");
      notes.push("Cannot connect to consoles, patient stations, or corridor lights directly");
      break;
    case "R5KMTRM":
      requires.push("R5KMPR15");
      notes.push("1 power supply per board (Marshall standard)");
      notes.push("Field distribution point: K-Bus power injects here");
      notes.push("Daisy chains start from this board");
      break;
    case "R5KDC16D":
      requires.push("R5KSDTY");
      notes.push("Duty domeless must be paired with duty station");
      break;
    case "R5KPS1LCA":
      notes.push("Lighting control must be paired with patient station");
      notes.push("LC050 relay connects to patient station, controlled via pillow speaker");
      break;
    case "R5KCONS":
      notes.push("Connects via Ethernet to network only");
      notes.push("Cannot connect to K-Bus, L2KA, or termination board");
      break;
    case "R5KMPR15":
      notes.push("15V K-Bus power supply");
      notes.push("Injects power onto K-Bus via termination board");
      notes.push("Must not create power loops or feed backwards");
      break;
    case "R5KMPR36":
      notes.push("36V L-Net power supply");
      notes.push("Powers MSC and L-Net devices");
      break;
    case "R5KSDTY":
      notes.push("Connects to K-Bus, counts toward L2KA capacity");
      notes.push("Must be paired with duty domeless controller (R5KDC16D)");
      break;
  }

  if (CORRIDOR_LIGHTS.has(part)) {
    notes.push("Room controller: K-Bus in/out for daisy chain");
    notes.push("Room device ports connect patient stations, pull cords, code buttons");
    notes.push("Cannot connect to Ethernet, L-Net, consoles, or MSC");
  }

  if (PATIENT_STATIONS.has(part) && part !== "R5KPS1LCA") {
    notes.push("Connects to corridor light or K-Bus line only");
    notes.push("Cannot connect directly to MSC or L2KA");
  }

  return { requires, notes };
}

export { CORRIDOR_LIGHTS, ROOM_DEVICES, KB_FIELD_DEVICES, DOMELESS_CONTROLLERS, PATIENT_STATIONS, HIGH_SECURITY, PUSHBUTTON_STATIONS, ETHERNET_DEVICES };
