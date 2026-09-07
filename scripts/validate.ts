/*
  bars.json 검증기. `npm run validate`로 실행하고, `npm run build`가 먼저 이걸 돌린다.
  실패하면 몇 번째 바의 어떤 필드가 왜 틀렸는지 출력하고 exit code 1로 끝낸다.
  Node 내장 타입 스트리핑으로 실행되므로 별도 러너(tsx 등)가 필요 없다.
*/
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BarList } from '../src/domain/schema.ts'

const DATA_PATH = fileURLToPath(new URL('../src/data/bars.json', import.meta.url))

function fail(message: string): never {
  console.error(`\n검증 실패: ${message}\n`)
  process.exit(1)
}

/** issue.path를 사람이 읽을 수 있는 위치 문자열로 바꾼다. `[3].menu[1].price` 꼴. */
function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path
    .map((segment) => (typeof segment === 'number' ? `[${segment}]` : `.${String(segment)}`))
    .join('')
    .replace(/^\./, '')
}

let raw: string
try {
  raw = readFileSync(DATA_PATH, 'utf8')
} catch {
  fail(`${DATA_PATH} 파일을 읽을 수 없습니다.`)
}

let json: unknown
try {
  json = JSON.parse(raw)
} catch (error) {
  fail(
    `bars.json이 올바른 JSON이 아닙니다. 쉼표나 따옴표를 확인하세요.\n  ${
      error instanceof Error ? error.message : String(error)
    }`,
  )
}

const result = BarList.safeParse(json)

if (!result.success) {
  console.error('\n검증 실패: bars.json에 잘못된 값이 있습니다.\n')
  for (const issue of result.error.issues) {
    const [index, ...rest] = issue.path
    const where =
      typeof index === 'number'
        ? `${index + 1}번째 바${rest.length > 0 ? ` (${formatPath(rest)})` : ''}`
        : formatPath(issue.path) || '최상위'
    // 어떤 바인지 이름으로도 알려준다. 인덱스만으로는 찾기 힘들다.
    const bars = Array.isArray(json) ? json : []
    const entry = typeof index === 'number' ? bars[index] : undefined
    const name =
      entry && typeof entry === 'object' && 'name' in entry && typeof entry.name === 'string'
        ? ` "${entry.name}"`
        : ''
    console.error(`  - ${where}${name}: ${issue.message}  [${issue.code}]`)
  }
  console.error(`\n총 ${result.error.issues.length}건. 위 항목을 고친 뒤 다시 실행하세요.\n`)
  process.exit(1)
}

const bars = result.data

// --- 스키마로는 잡히지 않지만 앱을 실제로 망가뜨리는 것들 ---

// id 중복: /bar/{id} 라우팅이 어느 쪽을 보여줄지 알 수 없게 된다.
const seen = new Map<string, number>()
const duplicates: string[] = []
bars.forEach((bar, index) => {
  const first = seen.get(bar.id)
  if (first === undefined) {
    seen.set(bar.id, index)
  } else {
    duplicates.push(`  - id "${bar.id}"가 ${first + 1}번째와 ${index + 1}번째에 중복됩니다.`)
  }
})

if (duplicates.length > 0) {
  console.error('\n검증 실패: id가 중복되었습니다.\n')
  console.error(duplicates.join('\n'))
  console.error('')
  process.exit(1)
}

// --- 경고: 빌드를 막지는 않지만 확인해보는 게 좋은 것들 ---

const warnings: string[] = []

bars.forEach((bar, index) => {
  const at = `${index + 1}번째 "${bar.name}"`
  if (!/^\d{4}-\d{2}$/.test(bar.dataAsOf)) {
    warnings.push(`${at}: dataAsOf가 "2026-09" 형식이 아닙니다 (현재 "${bar.dataAsOf}")`)
  }
  if (bar.note.trim() === '') {
    warnings.push(`${at}: 운영진 한 줄 평(note)이 비어 있습니다. 이 앱의 핵심 정보입니다.`)
  }
  if (bar.menu.length === 0) {
    warnings.push(`${at}: 메뉴가 한 개도 없습니다.`)
  }
})

const sampleCount = bars.filter((bar) => bar.name.startsWith('__SAMPLE__')).length
if (sampleCount > 0) {
  warnings.push(`샘플 데이터 ${sampleCount}건이 남아 있습니다. 실제 데이터를 채운 뒤 지우세요.`)
}

if (warnings.length > 0) {
  console.warn('\n경고 (빌드는 계속됩니다):')
  for (const warning of warnings) console.warn(`  - ${warning}`)
}

const menuCount = bars.reduce((sum, bar) => sum + bar.menu.length, 0)
console.log(`\n검증 통과: 바 ${bars.length}곳, 메뉴 ${menuCount}개.\n`)
