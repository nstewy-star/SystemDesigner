import { Box } from "lucide-react";

interface DeviceIconProps {
  part: string;
  className?: string;
}

export function DeviceIcon({ className }: DeviceIconProps) {
  return <Box className={className} />;
}
