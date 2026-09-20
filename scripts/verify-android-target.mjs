import { readFileSync } from 'node:fs'

const variablesPath = 'android/variables.gradle'
const content = readFileSync(variablesPath, 'utf8')

function readVersion(name) {
  const match = content.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))
  return match ? Number(match[1]) : null
}

const compileSdk = readVersion('compileSdkVersion')
const targetSdk = readVersion('targetSdkVersion')

if (compileSdk !== 36 || targetSdk !== 36) {
  throw new Error(
    `Android API mismatch: compileSdk=${compileSdk}, targetSdk=${targetSdk}. Expected API 36.`,
  )
}

console.log('Verified Android compileSdkVersion=36 and targetSdkVersion=36')
