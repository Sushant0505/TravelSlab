import {
  Backpack,
  Bike,
  Mountain,
  Waves,
  Users,
  Heart,
  Compass,
  Sparkles,
  Crown,
  Tent,
  Camera,
  Plane,
  Ship,
  Snowflake,
  Sun,
  MapPin,
  type LucideIcon,
} from "lucide-react";

/** Icon names an admin can choose for a trip type (all exist in lucide-react). */
export const TRIP_TYPE_ICONS: Record<string, LucideIcon> = {
  Backpack,
  Bike,
  Mountain,
  Waves,
  Users,
  Heart,
  Compass,
  Sparkles,
  Crown,
  Tent,
  Camera,
  Plane,
  Ship,
  Snowflake,
  Sun,
  MapPin,
};

export const TRIP_TYPE_ICON_NAMES = Object.keys(TRIP_TYPE_ICONS);

export function TripTypeIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = TRIP_TYPE_ICONS[name] ?? Compass;
  return <Icon className={className} />;
}
