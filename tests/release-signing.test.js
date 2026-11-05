import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scripts/prepare-android-signing.mjs', import.meta.url))
const originalGradle = `android {
    defaultConfig {
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
        }
    }
}
`

function runSigning(input = originalGradle, env = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'string-sort-signing-test-'))
  const path = join(dir, 'android', 'app', 'build.gradle')
  mkdirSync(join(dir, 'android', 'app'), { recursive: true })
  writeFileSync(path, input)
  try {
    const result = spawnSync(process.execPath, [script], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        RELEASE_VERSION_CODE: '42',
        RELEASE_VERSION_NAME: '1.2.3',
        ...env,
      },
    })
    return { result, output: readFileSync(path, 'utf8') }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('Android release signing preparation', () => {
  it('sets exactly the reviewed version and injects release signing', () => {
    const { result, output } = runSigning()
    expect(result.status).toBe(0)
    expect(output).toContain('versionCode 42')
    expect(output).toContain('versionName "1.2.3"')
    expect(output).toContain('signingConfig signingConfigs.release')
    expect(output).toContain('// STRING_SORT_RELEASE_SIGNING')
    expect(output).not.toContain('versionCode 1\n')
  })

  it('rejects invalid Play version codes without modifying Gradle', () => {
    for (const code of [undefined, '', '0', '01', '-1', '1.1', '1e2', ' 42', '2100000001', 'NaN', '9007199254740992']) {
      const { result, output } = runSigning(originalGradle, {
        RELEASE_VERSION_CODE: code,
      })
      expect(result.status, code).not.toBe(0)
      expect(output).toBe(originalGradle)
    }
  })

  it('refuses missing or invalid version names without modifying Gradle', () => {
    for (const name of [undefined, '', 'latest', '1.0\\nmalicious']) {
      const { result, output } = runSigning(originalGradle, {
        RELEASE_VERSION_NAME: name,
      })
      expect(result.status, String(name)).not.toBe(0)
      expect(output).toBe(originalGradle)
    }
  })

  it('refuses missing, ambiguous or already configured version declarations', () => {
    const broken = [
      originalGradle.replace('versionCode 1', ''),
      originalGradle.replace('versionName "1.0"', ''),
      originalGradle.replace('versionCode 1', 'versionCode 1\n versionCode 2'),
      originalGradle.replace('android {', 'android {\n // STRING_SORT_RELEASE_SIGNING'),
    ]
    for (const input of broken) {
      const { result, output } = runSigning(input)
      expect(result.status).not.toBe(0)
      expect(output).toBe(input)
    }
  })
})
