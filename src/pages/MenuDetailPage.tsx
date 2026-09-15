import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ALL_MENU_GROUPS } from '../domain/bars'
import {
  barCount,
  findMenuGroup,
  offeringsByDistrict,
  priceSpread,
  type MenuOffering,
} from '../domain/menus'
import { BASE_SPIRIT_LABEL, DISTRICT_DOT, type District } from '../domain/schema'
import { formatPrice } from '../domain/selectors'

/*
  칵테일 하나를 파는 바들이 각각 얼마인지 보여주는 화면.

  이 앱에만 있는 정보다. 카카오맵에도 네이버에도 각 바의 메뉴판이 모여 있지 않아서,
  "네그로니가 여기는 12,000원이고 저기는 18,000원"이라는 말을 할 수 있는 곳이 없다.

  다만 줄 세우지는 않는다. 값의 폭과 매장별 값만 보여주고 고르는 것은 부원에게 맡긴다.
*/
export default function MenuDetailPage() {
  const { key } = useParams<{ key: string }>()
  const group = key ? findMenuGroup(ALL_MENU_GROUPS, key) : undefined

  if (!group) return <NotFound />

  const bars = barCount(group)
  const spread = priceSpread(group)

  /*
    상권별로 나눈 목록. offeringsByDistrict가 이미 상권 순서로 정렬해 두므로
    앞에서부터 같은 상권끼리 이어 담기만 하면 된다.
  */
  const byDistrict: [District, MenuOffering[]][] = []
  for (const offering of offeringsByDistrict(group)) {
    const last = byDistrict[byDistrict.length - 1]
    if (last && last[0] === offering.district) last[1].push(offering)
    else byDistrict.push([offering.district, [offering]])
  }

  return (
    <article className="pb-8">
      <TopBar />

      <header className="px-4 pt-1">
        <p className="text-[15px] font-semibold tracking-[0.04em] text-muted">
          {BASE_SPIRIT_LABEL[group.base]}
          {group.serving === 'bottle' && ' · 보틀'}
        </p>
        <h1 className="mt-1.5 text-[30px] leading-[1.12] font-extrabold tracking-[-0.035em]">
          {group.name}
        </h1>
      </header>

      {/*
        값의 폭만 알린다. '가장 싼 곳'을 짚지 않는다.

        칵테일 값에는 술의 급과 잔의 양, 만드는 손이 같이 들어 있어서 싼 쪽이 나은
        쪽이라는 뜻이 아니다. 여기 실린 가게들은 동아리가 실제로 드나드는 곳이라,
        순위를 매겨 보여줄 자리가 아니다. 얼마인지만 알려주고 고르는 것은 부원이 한다.
      */}
      {bars > 1 && (
        <section className="mx-4 mt-4 rounded-2xl border border-line bg-surface px-4 py-3.5">
          <p className="text-[15px] text-muted">
            <span className="font-bold text-text">{bars}곳</span>에서 팝니다
          </p>
          <p className="mt-1 text-[17px] font-bold text-text">
            {spread > 0
              ? `${formatPrice(group.minPrice)} ~ ${formatPrice(group.maxPrice)}`
              : `어디서 마시든 ${formatPrice(group.minPrice)}`}
          </p>
        </section>
      )}

      {/*
        상권으로 묶어 보여준다. 한 줄로 죽 세우면 순서가 곧 순위로 읽히기 때문이다.
        상권이 하나뿐이면 묶음 제목을 생략한다 — 나눌 것이 없는데 제목만 붙으면 군더더기다.
      */}
      <section className="mt-5 px-4">
        <h2 className="text-[15px] font-semibold text-muted">매장별 가격</h2>
        <div className="mt-2 flex flex-col gap-5">
          {byDistrict.map(([district, offerings]) => (
            <div key={district}>
              {byDistrict.length > 1 && (
                <div className="mb-2 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: DISTRICT_DOT[district] }}
                  />
                  <p className="text-[15px] font-semibold text-text/85">{district}</p>
                </div>
              )}
              <ul className="flex flex-col gap-2.5">
                {offerings.map((offering, index) => (
                  <li key={`${offering.barId}-${offering.displayName}-${index}`}>
                    <OfferingRow offering={offering} groupName={group.name} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="px-4 pt-7 text-[15px] leading-relaxed text-muted">
        가격은 각 바의 메뉴판을 옮긴 것이라 변경되었을 수 있습니다.
      </p>
    </article>
  )
}

/*
  한 바의 값 한 줄. 누르면 그 바 상세로 간다 — 가격을 보고 나면 다음에 궁금한 것이
  "그래서 거기가 어떤 곳인데"이기 때문이다.
*/
function OfferingRow({ offering, groupName }: { offering: MenuOffering; groupName: string }) {
  return (
    <Link
      to={`/bar/${offering.barId}`}
      className="block rounded-2xl border border-line bg-surface p-4 active:bg-surface-2"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: DISTRICT_DOT[offering.district] }}
          />
          <span className="truncate text-[17px] font-bold text-text">{offering.barName}</span>
        </div>
        <span className="shrink-0 text-[17px] font-bold text-text">
          {formatPrice(offering.price)}
        </span>
      </div>

      {/*
        그 바가 메뉴판에 적은 이름이 대표 표기와 다를 때만 보여준다.
        '라가불린 16년'을 찾아왔는데 가게에서는 '라가불린 16Y'로 적혀 있으면,
        미리 알고 가야 메뉴판에서 헤매지 않는다.
      */}
      {offering.displayName !== groupName && (
        <p className="mt-1.5 text-[15px] text-muted">메뉴판 표기: {offering.displayName}</p>
      )}

      {offering.desc && (
        <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{offering.desc}</p>
      )}
    </Link>
  )
}

function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()

  // 링크로 바로 들어온 경우 뒤로가기가 앱 밖으로 나간다. BarDetailPage와 같은 처리다.
  const goBack = () => {
    if (location.key === 'default') navigate('/menu', { replace: true })
    else navigate(-1)
  }

  return (
    <div className="sticky top-0 z-20 bg-ink/95 px-2 pt-[calc(8px+env(safe-area-inset-top))] pb-2 backdrop-blur">
      <button
        type="button"
        onClick={goBack}
        className="rounded-lg px-3 py-2 text-[15px] text-muted active:bg-surface-2"
      >
        ← 칵테일
      </button>
    </div>
  )
}

function NotFound() {
  return (
    <div className="px-4 py-20 text-center">
      <p className="text-[16px] text-muted">찾을 수 없는 칵테일입니다.</p>
      <Link
        to="/menu"
        className="mt-4 inline-block rounded-full border border-line px-5 py-2.5 text-[15px] text-text active:bg-surface-2"
      >
        칵테일 목록으로
      </Link>
    </div>
  )
}
