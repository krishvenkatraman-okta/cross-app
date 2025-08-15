export type ClassValue = string | number | boolean | undefined | null | ClassValue[]

function clsx(...inputs: ClassValue[]): string {
  const classes: string[] = []

  for (const input of inputs) {
    if (!input) continue

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      const result = clsx(...input)
      if (result) classes.push(result)
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key)
      }
    }
  }

  return classes.join(" ")
}

function twMerge(input: string): string {
  // Simple deduplication - keeps last occurrence of each class
  const classes = input.split(" ").filter(Boolean)
  const seen = new Set<string>()
  const result: string[] = []

  // Process in reverse to keep last occurrence
  for (let i = classes.length - 1; i >= 0; i--) {
    const cls = classes[i]
    if (!seen.has(cls)) {
      seen.add(cls)
      result.unshift(cls)
    }
  }

  return result.join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
