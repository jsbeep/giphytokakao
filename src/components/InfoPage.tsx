import { X } from 'lucide-react'

interface InfoPageProps {
  onClose: () => void
}

export default function InfoPage({ onClose }: InfoPageProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-[5%] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="안내"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85dvh] w-[min(560px,100%)] flex-col gap-5 overflow-y-auto rounded-3xl border border-(--border) bg-(--surface-strong) p-6 text-(--ink) shadow-(--box-shadow) sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-(--border) bg-(--bg) text-(--ink) shadow-(--sharp-shadow) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        >
          <X size={16} />
        </button>

        <h1 className="m-0 pr-10 font-(--heading-font) text-2xl tracking-[-0.02em]">안내</h1>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-base font-semibold">서비스 소개</h2>
          <p className="m-0 text-sm leading-relaxed text-(--muted)">
            giphy to kakao는 GIPHY API로 GIF를 검색하고 카카오톡으로 바로 공유할 수 있게
            돕는 개인 비영리 프로젝트입니다. GIPHY, Kakao Corp.과 별도의 제휴·제공 계약 관계는 없으며,
            각 사의 공식 API를 이용해 제작되었습니다.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-base font-semibold">개인정보처리방침</h2>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-(--muted)">
            <li>본 서비스는 회원가입 및 로그인이 없으며, 이름·연락처 등 개인정보를 별도로 수집하지 않습니다.</li>
            <li>최근 본 GIF·즐겨찾기 목록은 이용 중인 기기의 브라우저 저장소(localStorage)에만 저장되며, 서버로 전송되거나 외부에 공유되지 않습니다.</li>
            <li>검색 및 공유 횟수, 접속 시간 등은 오류 분석과 서비스 안정성 점검을 위해 서버 로그에 익명으로 기록될 수 있으며, 개인을 특정할 수 있는 정보와 검색한 GIF 로그는 포함되지 않습니다.</li>
            <li>Vercel Analytics를 통해 방문 수 등 익명화된 통계를 수집하며, 이를 이용해 개인을 식별하지 않습니다.</li>
            <li>카카오톡 공유 기능은 카카오 JavaScript SDK를 통해 제공되며, 공유 과정에서 발생하는 정보 처리는 카카오의 개인정보처리방침을 따릅니다.</li>
            <li>GIF 콘텐츠는 GIPHY API를 통해 제공되며, 검색 과정에서 발생하는 정보 처리는 GIPHY의 개인정보처리방침을 따릅니다.</li>
            <li>개인정보 관련 문의나 삭제 요청은 아래 이메일로 연락해 주세요.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-base font-semibold">이용약관</h2>
          <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-(--muted)">
            <li>본 서비스는 무료로 제공되며, 운영자의 사정에 따라 사전 고지 없이 내용이 변경되거나 중단될 수 있습니다.</li>
            <li>GIF 콘텐츠의 저작권은 GIPHY 및 각 원저작자에게 있으며, 본 서비스는 검색·공유를 중개하는 도구일 뿐 콘텐츠를 직접 제작·소유하지 않습니다.</li>
            <li>이용자는 공유 기능을 개인적·비상업적 목적으로 사용해야 하며, 타인의 권리를 침해하거나 관계 법령을 위반하는 방식으로 이용해서는 안 됩니다.</li>
            <li>검색 결과는 GIPHY의 정책에 따라 전체 이용가(rating: g) 콘텐츠로 제한되어 있으나, 운영자는 제3자가 제공하는 콘텐츠의 정확성·적법성을 보증하지 않습니다.</li>
            <li>운영자는 관계 법령이 허용하는 범위 내에서 서비스 이용 또는 이용 불능으로 발생하는 손해에 대해 책임을 지지 않습니다.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="m-0 text-base font-semibold">제공 정보 / 저작권</h2>
          <p className="m-0 text-sm leading-relaxed text-(--muted)">
            Powered by{' '}
            <a
              href="https://giphy.com"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-(--ink) underline"
            >
              GIPHY
            </a>
            . 카카오톡 공유 기능은 Kakao Corp.이 제공하는 카카오 오픈빌더 SDK를 사용합니다. GIPHY, Kakao 로고와
            상표권은 각 권리자에게 있습니다.
          </p>
        </section>

        <p className="m-0 text-xs text-(--muted) opacity-80">
          문의: jsbeep500@gmail.com · 최종 수정일 2026-06-24
        </p>
      </div>
    </div>
  )
}
