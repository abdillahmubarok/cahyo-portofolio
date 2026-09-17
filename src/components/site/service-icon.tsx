import {
  Building2, Palette, Home, Store, Hammer, Eye,
  Ruler, PenTool, Layers, Box, Compass, LayoutGrid,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  building: Building2,
  palette: Palette,
  home: Home,
  store: Store,
  hammer: Hammer,
  eye: Eye,
  ruler: Ruler,
  pen: PenTool,
  layers: Layers,
  box: Box,
  compass: Compass,
  grid: LayoutGrid,
}

type ServiceIconProps = {
  name: string | null
  size?: number
}

export function ServiceIcon({ name, size = 28 }: ServiceIconProps) {
  const Icon = name ? iconMap[name] || Building2 : Building2
  return <Icon size={size} />
}
