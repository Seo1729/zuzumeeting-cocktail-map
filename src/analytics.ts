/*
  사용량 집계 — Cloudflare Web Analytics.

  "부원들이 이 앱을 얼마나 여는가"만 센다. 결과는 Cloudflare 대시보드
  (Analytics & Logs → Web Analytics)에서 계정 주인만 볼 수 있다. 앱에 보여주는 화면은 없다.

  무엇을 세지 않는가 — 이게 더 중요하다.
  쿠키를 쓰지 않고 사람을 식별하지 않는 집계라, "누가" 썼는지는 남지 않는다.
  이 앱에는 실시간 위치 기능이 있지만 그 값은 여기로 절대 보내지 않는다.
  위치나 식별값을 더 모으고 싶어지면 그건 익명 통계가 아니라 개인정보 수집이 되고,
  고지·동의 없이는 할 수 없다.

  spa: false 가 꼭 필요하다. 실제로 켜고 재보니 두 가지가 깨졌다.
  · 이 앱은 화면 주소가 '#/menu'처럼 # 뒤에 붙는데, 비콘은 # 뒤를 버리고 전부 '/'로 적는다.
    그래서 화면별 통계는 어차피 나오지 않는다.
  · 화면 전환뿐 아니라 검색창에 한 글자 칠 때마다(검색어가 주소에 실리므로) 새 페이지뷰로 셌다.
    '진토닉' 세 글자에 페이지뷰가 몇 개씩 붙어 숫자가 의미를 잃는다.
  끄면 앱을 처음 열 때 딱 한 번만 기록된다. 페이지뷰 = 앱을 연 횟수가 된다.
*/

const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js'

export function loadAnalytics(): void {
  const token = import.meta.env.VITE_CF_BEACON_TOKEN

  /*
    배포된 빌드에서만 켠다. 개발 중에 화면을 수십 번 새로고침한 것이
    부원들의 사용량에 섞이면 숫자를 믿을 수 없게 된다.
    토큰은 .env.local에 넣지 말고 Cloudflare 빌드 변수에만 넣는다 —
    로컬에서 npm run build 후 미리보기를 띄워도 집계되지 않게 하기 위해서다.
  */
  if (!import.meta.env.PROD || !token) return

  const script = document.createElement('script')
  script.defer = true
  script.src = BEACON_SRC
  script.setAttribute('data-cf-beacon', JSON.stringify({ token, spa: false }))
  // 차단·오프라인으로 못 불러와도 앱에는 아무 영향이 없어야 한다. 실패는 조용히 지나간다.
  document.head.appendChild(script)
}
