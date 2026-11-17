import {
  BookOpen,
  Briefcase,
  Code2,
  Dumbbell,
  Gift,
  Heart,
  Home,
  Leaf,
  ListTodo,
  Music,
  Plane,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'

import type { ListIconId } from '../data'

export const LIST_ICONS: Record<ListIconId, { icon: LucideIcon; name: string }> = {
  list: { icon: ListTodo, name: 'List' },
  briefcase: { icon: Briefcase, name: 'Work' },
  home: { icon: Home, name: 'Home' },
  cart: { icon: ShoppingCart, name: 'Shopping' },
  plane: { icon: Plane, name: 'Travel' },
  heart: { icon: Heart, name: 'Health' },
  book: { icon: BookOpen, name: 'Reading' },
  dumbbell: { icon: Dumbbell, name: 'Fitness' },
  code: { icon: Code2, name: 'Code' },
  music: { icon: Music, name: 'Music' },
  gift: { icon: Gift, name: 'Gifts' },
  leaf: { icon: Leaf, name: 'Garden' },
}
