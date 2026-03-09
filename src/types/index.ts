export type PortType = "ETH" | "LNET" | "KB" | "POWER" | "AC";

export type PortDef = {
  id: string;
  label: string;
  type: PortType;
  x: number;
  y: number;
  limit?: number;
  powerSource?: string;
  restrictedTo?: string[];
};

export type DrawElement = {
  type: string;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  color: string;
  strokeWidth: number;
};

export type DeviceDef = {
  part: string;
  label: string;
  w: number;
  h: number;
  ports: PortDef[];
  customSchematic?: string;
  drawElements?: DrawElement[];
};

export type Device = {
  id: string;
  part: string;
  name: string;
  x: number;
  y: number;
  lnet?: string;
  zone?: string;
  psuId?: string;
  kitId?: string;
  preferred?: boolean;
  floorPlanId?: string;
  // Marshall Nurse Call Labeling Standard
  roomNumber?: string;
  serialNumber?: string;
  vlan?: number;
  switchPort?: string;
  floor?: string;
  building?: string;
  busType?: string;
  connectionType?: string;
};

export type Connection = {
  id: string;
  fromId: string;
  fromPort: string;
  toId: string;
  toPort: string;
  type: PortType;
};

export type DeviceLibraryItem = {
  part: string;
  label: string;
  category: string;
  power_mA: number;
  power_A?: number;
  laborMinutes?: number;
  network?: string;
  generation?: "R4K" | "R5K" | "NEUTRAL";
  preferred?: boolean;
};

export type PSU = {
  id: string;
  name: string;
  maxPower_mA: number;
};

export type KitConnection = {
  from: string;
  to: string;
  type: "ETH" | "LNET" | "AUDIO" | "POWER";
};

export type DeviceKit = {
  id: string;
  name: string;
  parts: string[];
  connections?: KitConnection[];
};

export type FloorPlan = {
  id: string;
  name: string;
  imageUrl: string;
  opacity: number;
  naturalWidth?: number;
  naturalHeight?: number;
};

export type ProjectType = "new-r5k" | "upgrade-r4k-to-r5k" | "new-r4k" | "mixed";

export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";

export type Wall = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Project = {
  id: string;
  customer_name: string;
  site_name: string;
  project_name?: string;
  status: ProjectStatus;
  project_type: ProjectType;
  devices: Device[];
  connections: Connection[];
  walls: Wall[];
  background_image_url?: string | null;
  background_opacity: number;
  floor_plans: FloorPlan[];
  active_floor_plan_id?: string | null;
  device_scale: number;
  device_opacity: number;
  walls_opacity: number;
  floorplan_scale?: number | null;
  show_device_names: boolean;
  show_ports: boolean;
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  project_id: string;
  quote_number: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired";
  labor_rate_per_hour: number;
  markup_percent: number;
  tax_percent: number;
  discount_percent: number;
  notes: string;
  scope_of_work: string;
  valid_until?: string | null;
  subtotal_materials: number;
  subtotal_labor: number;
  total: number;
  created_at: string;
  updated_at: string;
};

export type QuoteLineItem = {
  id: string;
  quote_id: string;
  part_number: string;
  description: string;
  category: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  labor_minutes: number;
  cable_length_feet: number;
  cable_cost: number;
  line_total: number;
  sort_order: number;
};

export type DevicePricing = {
  id: string;
  part_number: string;
  unit_cost: number;
  unit_price: number;
  labor_minutes: number;
  cable_type?: string | null;
  cable_cost_per_foot: number;
};

export type RoomLoadClassification = "light" | "medium" | "heavy";

export type PowerDomain = "lnet" | "kbus";

export type PowerIssueSeverity = "pass" | "warning" | "error" | "critical";

export type PowerIssue = {
  id: string;
  severity: PowerIssueSeverity;
  domain: PowerDomain;
  rule: string;
  title: string;
  detail: string;
  deviceIds?: string[];
};

export type LNetSupplyCalc = {
  supplyCapacity_A: number;
  designLimit_A: number;
  designLimitPercent: number;
  totalLoad_A: number;
  utilization: number;
  mscId: string;
  mscName: string;
  l2kaCount: number;
  maxL2KA: number;
  roomBreakdown: RoomCalcEntry[];
  status: PowerIssueSeverity;
};

export type RoomCalcEntry = {
  deviceId: string;
  deviceName: string;
  part: string;
  classification: RoomLoadClassification;
  estimatedCurrent_A: number;
  hasAudio: boolean;
  connectedDeviceCount: number;
};

export type KBusSupplyCalc = {
  supplyCapacity_A: number;
  designLimit_A: number;
  designLimitPercent: number;
  totalLoad_A: number;
  utilization: number;
  termBoardId: string;
  termBoardName: string;
  psuId?: string;
  psuName?: string;
  psuPart?: string;
  deviceBreakdown: KBusDeviceEntry[];
  legBreakdown: KBusLegEntry[];
  status: PowerIssueSeverity;
};

export type KBusDeviceEntry = {
  deviceId: string;
  deviceName: string;
  part: string;
  category: string;
  current_A: number;
};

export type KBusLegEntry = {
  portId: string;
  portLabel: string;
  deviceCount: number;
  totalCurrent_A: number;
  estimatedCableLength_ft: number | null;
  voltageDropConcern: boolean;
};

export type PowerCalculationResult = {
  lnetSupplies: LNetSupplyCalc[];
  kbusSupplies: KBusSupplyCalc[];
  issues: PowerIssue[];
  headendChecklist: HeadendCheckItem[];
  redFlags: PowerIssue[];
  summary: PowerSummary;
};

export type HeadendCheckItem = {
  label: string;
  passed: boolean;
  detail: string;
  rule: string;
};

export type PowerSummary = {
  totalLNetCurrent_A: number;
  totalKBusCurrent_A: number;
  totalDevices: number;
  totalKBusDevices: number;
  mscCount: number;
  l2kaCount: number;
  termBoardCount: number;
  psuCount: number;
  corridorLightCount: number;
  patientStationCount: number;
};
