import rawBars from '../data/bars.json'
import { BarList } from './schema'

/*
  bars.json을 앱 전체에서 읽는 단 하나의 통로.
  빌드 전에 `npm run validate`가 이미 통과시킨 데이터지만, 여기서 한 번 더 parse해서
  JSON의 느슨한 타입(district: string)을 스키마 타입(district: "대학로" | ...)으로 좁힌다.
*/
export const ALL_BARS = BarList.parse(rawBars)

export function findBar(id: string) {
  return ALL_BARS.find((bar) => bar.id === id)
}
