import rawBars from '../data/bars.json'
import { buildMenuGroups } from './menus'
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

/*
  메뉴를 이름별로 묶어둔 것. 모듈이 처음 불릴 때 한 번만 계산한다.

  데이터가 빌드 시점에 고정돼 있어 결과가 바뀔 일이 없는데, 화면에서 useMemo로
  들고 있으면 화면을 오갈 때마다 400개가 넘는 항목을 다시 훑게 된다.
*/
export const ALL_MENU_GROUPS = buildMenuGroups(ALL_BARS)

/*
  키로 그룹을 바로 찾기 위한 색인.

  바 상세는 메뉴가 백 줄 넘는 화면이라, 줄마다 목록을 훑어 찾으면
  화면을 열 때마다 수만 번을 비교하게 된다.
*/
export const MENU_GROUP_BY_KEY = new Map(ALL_MENU_GROUPS.map((group) => [group.key, group]))
