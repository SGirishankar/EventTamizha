import {
  Armchair, Cake, Columns3, CookingPot, Crown, DoorOpen, Fan, Flag, Flame, Flashlight, Flower2, Grid3x3, Heart, House,
  Lamp, LampCeiling, Landmark, Layers, Leaf, Lightbulb, RectangleHorizontal, Signpost, Sparkle, Sparkles, Speaker,
  Theater, TreePalm, Tv, Utensils, UtensilsCrossed, Waves, Wrench, Zap, type LucideIcon,
} from 'lucide-react';

export const ITEM_ICONS = {
  TreePalm, Leaf, DoorOpen, Sparkle, Waves, Flower2, Flame, Sparkles, Lightbulb, LampCeiling, Flashlight, Lamp, House,
  Landmark, Heart, Signpost, Cake, Tv, Flag, Armchair, Layers, Crown, UtensilsCrossed, Utensils, Theater,
  RectangleHorizontal, Grid3x3, Columns3, Fan, Speaker, Zap, CookingPot, Wrench,
} satisfies Record<string, LucideIcon>;

export type ItemIconName = keyof typeof ITEM_ICONS;

/** A catalogue item's icon in a gold-tinted tile. */
export function ItemIcon({ name, className = 'h-12 w-12', size = 22 }: { name: ItemIconName; className?: string; size?: number }) {
  const I = ITEM_ICONS[name];
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-primary ring-1 ring-primary/10 ${className}`} aria-hidden>
      <I size={size} strokeWidth={1.75} />
    </span>
  );
}

/** Small inline icon that inherits the text colour. */
export function InlineIcon({ icon: I, size = 16, className = '' }: { icon: LucideIcon; size?: number; className?: string }) {
  return <I size={size} strokeWidth={2} className={`inline-block shrink-0 ${className}`} aria-hidden />;
}
