// Inline syntax for the add bar: "Buy milk #errands !high".
// `#word` adds a tag (created if new); `!low` `!med` `!high` or `!1` `!2` `!3`
// (or `!!!`) sets the priority. Everything else is the title.

import type { Priority } from '../data'

const PRIORITY_WORDS: Record<string, Priority> = {
  low: 1,
  '1': 1,
  med: 2,
  medium: 2,
  '2': 2,
  high: 3,
  '3': 3,
}

export function parseQuickAdd(input: string): { title: string; tags: string[]; priority: Priority | null } {
  const tags: string[] = []
  let priority: Priority | null = null
  const words = input.split(/\s+/).filter((w) => {
    const tag = /^#([\p{L}\p{N}_-]{1,24})$/u.exec(w)
    if (tag) {
      if (!tags.some((t) => t.toLowerCase() === tag[1].toLowerCase())) tags.push(tag[1])
      return false
    }
    const bang = /^!(low|med|medium|high|[123])$/i.exec(w)
    if (bang) {
      priority = PRIORITY_WORDS[bang[1].toLowerCase()]
      return false
    }
    if (/^!{1,3}$/.test(w)) {
      priority = w.length as Priority
      return false
    }
    return true
  })
  return { title: words.join(' ').trim(), tags, priority }
}
