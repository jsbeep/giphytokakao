import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronDown, Eye, EyeOff, LoaderCircle, Lock, Trash2, X } from 'lucide-react'

import GithubMark from './GithubMark'
import { maskApiKey } from '../utils/apiKeyStorage'
import { checkGiphyKey, fetchDefaultKeyQuota, type DefaultKeyQuota } from '../utils/giphyClient'

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL
const GITHUB_REPO_URL = import.meta.env.VITE_GITHUB_REPO_URL
const GIPHY_DASHBOARD_URL = 'https://developers.giphy.com/dashboard/'
const GIPHY_API_TERMS_URL = 'https://support.giphy.com/hc/en-us/articles/360028134111-GIPHY-API-Terms-of-Service-'
const LAST_UPDATED = '2026-11-21'

type Notice = { tone: 'ok' | 'error'; message: string } | null
type QuotaState = DefaultKeyQuota | 'loading' | 'unavailable'

const formatWindow = (windowSec: number) =>
  windowSec % 3600 === 0 ? `${windowSec / 3600}시간` : `${Math.round(windowSec / 60)}분`

const formatResetAt = (resetAt: number) =>
  new Date(resetAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

const linkClass = 'font-semibold text-(--ink) underline underline-offset-2'

/** "owner/repo" from a GitHub URL, for the link label */
const repoLabel = (url: string) => {
  try {
    return new URL(url).pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '') || 'GitHub'
  } catch {
    return 'GitHub'
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** a long policy text, folded so it doesn't push the rest of Settings down; looks like a Section heading */
function PolicyDetails({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
        <h2 className="m-0 text-base font-semibold">{title}</h2>
        <ChevronDown size={18} aria-hidden="true" className="shrink-0 text-(--muted) transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}

function BulletList({ children }: { children: ReactNode }) {
  return (
    <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-(--muted)">
      {children}
    </ul>
  )
}

function KeyStatus({ apiKey, quota }: { apiKey: string | null; quota: QuotaState }) {
  let label: string
  let detail: string

  if (apiKey) {
    label = '내 키 사용 중'
    detail = '검색 요청이 이 브라우저에서 GIPHY로 바로 가요.'
  } else if (quota === 'loading') {
    label = '기본 키 사용 중'
    detail = '남은 횟수를 확인하고 있어요…'
  } else if (quota === 'unavailable') {
    label = '기본 키 사용 중'
    detail = '남은 횟수를 불러오지 못했어요.'
  } else if (!quota.enabled) {
    label = '키 미등록'
    detail = '이 사이트는 기본 키를 제공하지 않아요. 내 키를 등록해야 검색할 수 있어요.'
  } else {
    label = '기본 키 사용 중'
    detail = `${formatWindow(quota.windowSec)} 동안 ${quota.limit}회 중 ${quota.remaining}회 남음 · ${formatResetAt(quota.resetAt)} 초기화`
  }

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-(--border) bg-(--bg) px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span
          className={`h-2 w-2 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-(--muted)'}`}
          aria-hidden="true"
        />
        {label}
      </span>
      <span className="text-xs leading-relaxed text-(--muted)">{detail}</span>
    </div>
  )
}

interface SettingsPageProps {
  apiKey: string | null
  onSaveApiKey: (key: string) => void
  onClearApiKey: () => void
  onClose: () => void
}

export default function SettingsPage({ apiKey, onSaveApiKey, onClearApiKey, onClose }: SettingsPageProps) {
  const [draft, setDraft] = useState('')
  const [showDraft, setShowDraft] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [quota, setQuota] = useState<QuotaState>('loading')

  // the default key's remaining quota only matters while no personal key is set
  useEffect(() => {
    if (apiKey) {
      return
    }
    let cancelled = false
    void fetchDefaultKeyQuota().then((result) => {
      if (!cancelled) {
        setQuota(result ?? 'unavailable')
      }
    })
    return () => {
      cancelled = true
    }
  }, [apiKey])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const key = draft.trim()
    if (!key || isChecking) {
      return
    }

    setIsChecking(true)
    setNotice(null)
    const result = await checkGiphyKey(key)
    setIsChecking(false)

    if (result === 'invalid') {
      setNotice({ tone: 'error', message: 'GIPHY가 이 키를 거부했어요. 키를 다시 확인해주세요.' })
      return
    }
    if (result === 'network') {
      setNotice({ tone: 'error', message: 'GIPHY에 연결하지 못했어요. 네트워크를 확인한 뒤 다시 시도해주세요.' })
      return
    }

    onSaveApiKey(key)
    setDraft('')
    setShowDraft(false)
    setNotice({
      tone: 'ok',
      message:
        result === 'rate_limited'
          ? '저장했어요. 다만 이 키는 지금 GIPHY 사용량 한도에 걸려 있어서 잠시 후부터 검색돼요.'
          : '저장했어요. 이제 이 기기에서는 내 키로 검색해요.',
    })
  }

  const handleClear = () => {
    onClearApiKey()
    setQuota('loading')
    setNotice({ tone: 'ok', message: '키를 삭제했어요. 이 기기에 저장된 키가 없어요.' })
  }

  const defaultQuotaText =
    typeof quota === 'object' && quota.enabled
      ? `같은 IP에서 ${formatWindow(quota.windowSec)} 동안 ${quota.limit}회까지 쓸 수 있어요.`
      : typeof quota === 'object'
        ? '이 사이트는 기본 키를 제공하지 않아요.'
        : '같은 IP에서 쓸 수 있는 횟수가 정해져 있어요.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-[5%] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="설정"
      onClick={onClose}
    >
      {/* the outer card clips to the rounded corners; the inner box scrolls, with its track kept clear of the corners */}
      <div
        className="flex max-h-[85dvh] w-[min(560px,100%)] flex-col overflow-hidden rounded-3xl border border-(--border) bg-(--surface-strong) text-(--ink) shadow-(--box-shadow)"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex min-h-0 flex-col gap-5 overflow-y-auto p-6 sm:p-8 [&::-webkit-scrollbar-track]:my-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-(--border) bg-(--bg) text-(--ink) shadow-(--sharp-shadow) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          >
            <X size={16} />
          </button>

          <h1 className="m-0 pr-10 font-(--heading-font) text-2xl tracking-[-0.02em]">설정</h1>

          <Section title="GIPHY API 키">
            <p className="m-0 text-sm leading-relaxed text-(--muted)">
              키 없이도 기본 키로 바로 써볼 수 있어요. 기본 키 사용량을 다 쓰면 내 GIPHY API 키를 등록해서 계속 쓸 수 있어요.
            </p>

            <KeyStatus apiKey={apiKey} quota={quota} />

            {apiKey ? (
              <div className="flex items-center gap-2">
                <code className="flex h-11 min-w-0 flex-1 items-center truncate rounded-full bg-(--input-bg) px-4 text-sm">
                  {maskApiKey(apiKey)}
                </code>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-(--border) bg-(--bg) px-4 text-sm font-semibold shadow-(--sharp-shadow)"
                >
                  <Trash2 size={16} />
                  삭제
                </button>
              </div>
            ) : (
              <form className="flex items-center gap-2" onSubmit={handleSubmit}>
                <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full bg-(--input-bg) pl-4 pr-2">
                  <input
                    type={showDraft ? 'text' : 'password'}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="GIPHY API 키 붙여넣기"
                    aria-label="GIPHY API 키"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDraft((value) => !value)}
                    aria-label={showDraft ? '키 숨기기' : '키 보기'}
                    className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-(--muted)"
                  >
                    {showDraft ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!draft.trim() || isChecking}
                  className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-(--ink) px-5 text-sm font-semibold text-(--bg) disabled:cursor-default disabled:opacity-40"
                >
                  {isChecking && <LoaderCircle size={16} className="animate-spin" />}
                  {isChecking ? '확인 중' : '저장'}
                </button>
              </form>
            )}

            {notice && (
              <p
                role="status"
                className={`m-0 text-xs leading-relaxed ${notice.tone === 'error' ? 'text-(--alert)' : 'text-(--muted)'}`}
              >
                {notice.message}
              </p>
            )}

            <div className="flex gap-3 rounded-2xl bg-(--input-bg) p-4">
              <Lock size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs leading-relaxed text-(--ink)">
                <li>키는 이 기기의 브라우저 저장소(localStorage)에만 저장돼요.</li>
                <li>운영자 서버로는 전송되지 않고, 검색 요청은 브라우저에서 GIPHY로 직접 보내져요.</li>
                <li>언제든 삭제할 수 있어요. 공용 기기라면 다 쓴 뒤 꼭 삭제해 주세요.</li>
              </ul>
            </div>

            <details className="rounded-2xl border border-(--border) px-4 py-3 text-sm">
              <summary className="cursor-pointer font-semibold">API 키 발급 방법</summary>
              <ol className="m-0 mt-2 flex list-decimal flex-col gap-1.5 pl-5 leading-relaxed text-(--muted)">
                <li>
                  <a href={GIPHY_DASHBOARD_URL} target="_blank" rel="noreferrer" className={linkClass}>
                    GIPHY Developers
                  </a>
                  에 로그인해요. 계정이 없으면 무료로 가입할 수 있어요.
                </li>
                <li>Dashboard에서 새 앱(API Key)을 만들고, 유형은 <b className="text-(--ink)">API</b>를 골라요.</li>
                <li>앱 이름과 설명을 적고 약관에 동의해요.</li>
                <li>발급된 키를 복사해서 위 입력칸에 붙여넣으면 끝이에요.</li>
              </ol>
            </details>

            <details className="rounded-2xl border border-(--border) px-4 py-3 text-sm">
              <summary className="cursor-pointer font-semibold">사용량 제한</summary>
              <ul className="m-0 mt-2 flex list-disc flex-col gap-1.5 pl-5 leading-relaxed text-(--muted)">
                <li>
                  <b className="text-(--ink)">내 키</b>: 새로 발급한 키는 베타 키라서 GIPHY 정책상 시간당 100회까지 요청할 수
                  있어요. 더 필요하면 GIPHY 대시보드에서 프로덕션 키를 신청해야 해요.
                </li>
                <li>
                  <b className="text-(--ink)">기본 키</b>: {defaultQuotaText}
                </li>
                <li>같은 검색 결과는 이 기기에 5분 동안 저장돼서, 다시 불러와도 횟수가 줄지 않아요.</li>
                <li>주사위는 GIF 50개를 한 번에 받아 이 기기에 저장해 두고 하나씩 꺼내 써서, 약 50번 뽑을 때 1회만 줄어요.</li>
              </ul>
            </details>
          </Section>

          <Section title="서비스 소개">
            <p className="m-0 text-sm leading-relaxed text-(--muted)">
              giphy to kakao는 GIPHY API로 GIF를 검색하고 카카오톡으로 바로 공유할 수 있게 돕는 개인 비영리 프로젝트입니다.
              <b className="text-(--ink)"> 본 서비스는 GIPHY의 공식 앱이 아니며</b>, GIPHY 및 Kakao Corp.과 제휴·제공 계약
              관계가 없습니다. 각 사의 공개 API를 이용해 만들었습니다.
            </p>
          </Section>

          <Section title="제공 정보 / 저작권">
            <a href="https://giphy.com" target="_blank" rel="noreferrer" className="w-fit" aria-label="Powered by GIPHY">
              <img src="/powered-by-giphy.png" alt="Powered by GIPHY" width={160} height={34} className="block h-auto w-40" />
            </a>
            <p className="m-0 text-sm leading-relaxed text-(--muted)">
              GIF 검색과 콘텐츠는 GIPHY API로 제공됩니다. 카카오톡 공유 기능은 Kakao Corp.이 제공하는 카카오 JavaScript SDK를
              사용합니다. GIPHY, Kakao 로고와 상표권은 각 권리자에게 있습니다.
            </p>
          </Section>

          <PolicyDetails title="개인정보처리방침">
            <BulletList>
              <li>이 서비스에는 자체 회원가입·로그인이 없으며, 이름·연락처 등 개인을 식별하는 정보를 수집하지 않습니다.</li>
              <li>
                <b className="text-(--ink)">수집 항목</b>: 공유 성공 횟수, 서비스 운영 로그(요청 종류·응답 상태·시각)
              </li>
              <li>
                <b className="text-(--ink)">수집 목적</b>: 서비스 이용 통계 및 오류 분석
              </li>
              <li>
                <b className="text-(--ink)">기본 키 사용량 제한</b>: 같은 IP의 요청 횟수를 세기 위해 IP 주소 원문이 아닌
                해시값을 보관하며, 제한 주기가 끝나면 자동으로 삭제됩니다.
              </li>
              <li>
                <b className="text-(--ink)">API 키</b>: 사용자 브라우저에만 저장되며 운영자 서버로 전송하지 않습니다.
              </li>
              <li>
                <b className="text-(--ink)">카카오톡 공유</b>: 공유할 때 카카오 로그인 화면이 나올 수 있습니다. 이 로그인과 받는
                사람 선택은 카카오가 직접 처리하며, 이 서비스는 카카오 계정 정보·친구 목록·받는 사람을 전달받지 않습니다. 공유
                준비를 위해 페이지를 열 때 카카오 SDK를 불러옵니다.
              </li>
              <li>
                <b className="text-(--ink)">GIF 검색 및 공유 내용</b>: 검색어와 공유한 GIF 정보는 별도로 저장하지 않습니다.
              </li>
              <li>최근 공유·즐겨찾기 목록과 주사위용 GIF 목록은 이 기기의 브라우저 저장소(localStorage)에만 저장됩니다.</li>
              <li>
                <b className="text-(--ink)">외부 서비스</b>: GIPHY(GIF 검색·제공), Kakao(카카오톡 공유·공유 시 카카오
                로그인), Vercel(호스팅·익명 방문 통계). 각 서비스에서 일어나는 정보 처리는 해당 회사의 개인정보처리방침을
                따릅니다.
              </li>
              {CONTACT_EMAIL && <li>개인정보 관련 문의나 삭제 요청은 아래 이메일로 연락해 주세요.</li>}
            </BulletList>
          </PolicyDetails>

          <PolicyDetails title="이용약관">
            <BulletList>
              <li>본 서비스는 무료로 제공되며, 운영자의 사정에 따라 사전 고지 없이 내용이 변경되거나 중단될 수 있습니다.</li>
              <li>GIF 콘텐츠의 저작권은 GIPHY 및 각 원저작자에게 있으며, 본 서비스는 검색·공유를 중개하는 도구일 뿐 콘텐츠를 직접 제작·소유하지 않습니다.</li>
              <li>이용자는 공유 기능을 개인적·비상업적 목적으로 사용해야 하며, 타인의 권리를 침해하거나 관계 법령을 위반하는 방식으로 이용해서는 안 됩니다.</li>
              <li>
                내 API 키를 등록해 쓰는 경우{' '}
                <a href={GIPHY_API_TERMS_URL} target="_blank" rel="noreferrer" className={linkClass}>
                  GIPHY API 이용약관
                </a>
                이 적용되며, 키 관리 책임은 이용자에게 있습니다.
              </li>
              <li>검색 결과는 GIPHY의 정책에 따라 전체 이용가(rating: g) 콘텐츠로 제한되어 있으나, 운영자는 제3자가 제공하는 콘텐츠의 정확성·적법성을 보증하지 않습니다.</li>
              <li>운영자는 관계 법령이 허용하는 범위 내에서 서비스 이용 또는 이용 불능으로 발생하는 손해에 대해 책임을 지지 않습니다.</li>
            </BulletList>
          </PolicyDetails>

          {GITHUB_REPO_URL && (
            <Section title="소스 코드">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-2 rounded-full border border-(--border) bg-(--bg) px-3.5 py-2 text-sm font-semibold text-(--ink) shadow-(--sharp-shadow) -translate-x-1"
              >
                <GithubMark size={16} />
                {repoLabel(GITHUB_REPO_URL)}
              </a>
              <p className="m-0 text-sm leading-relaxed text-(--muted)">
                소스 코드는 MIT 라이선스로 공개되어 있습니다. 버그 제보나 제안은 GitHub 이슈로 남겨 주세요.
              </p>
            </Section>
          )}

          <p className="m-0 text-xs text-(--muted) opacity-80">
            {CONTACT_EMAIL ? `문의: ${CONTACT_EMAIL} · ` : ''}최종 수정일 {LAST_UPDATED}
          </p>
        </div>
      </div>
    </div>
  )
}
