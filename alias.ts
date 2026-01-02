import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'pathe'

const root /**__dirname */ = fileURLToPath(new URL('.', import.meta.url))

export const r = (p = '.', base = root) => resolve(base, p)

export const ROOT_DIR = r()
export const DEMO_DIR = r('demos')

export const viteAlias = [
  { find: /^~\//, replacement: `${ROOT_DIR}/` },
  ...globSubDirAlias(DEMO_DIR),
]

// console.log(viteAlias)

function globSubDirAlias(
  dir: string,
  prefix = '@',
): Array<{ find: string; replacement: string }> {
  const cleanPrefix = prefix.replace(/\/$/, '')

  try {
    const aliases: Array<{ find: string; replacement: string }> = []
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        aliases.push({
          find: `${cleanPrefix}/${entry.name}`,
          replacement: `${dir}/${entry.name}`,
        })
      }
    }

    return aliases
  } catch (error) {
    console.error(`[globSubDirAlias] Error reading directory ${dir}:`, error)
    return []
  }
}
