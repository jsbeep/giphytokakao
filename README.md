# Old and Sick Kakao — giphy to kakao

GIPHY에서 GIF를 검색하고, 탭 한 번으로 카카오톡에 공유하는 웹 앱입니다.

**데모: https://giphytokakao.vercel.app**

> 개인 비영리 프로젝트입니다. GIPHY의 공식 앱이 아니며, GIPHY·Kakao Corp.과 제휴 관계가 없습니다.

## 기능

- 트렌딩 GIF와 검색. 한 번 탭하면 빠른 공유, 꾹 누르면 원본 크기로 공유
- 최근 공유·즐겨찾기 목록(이 기기의 브라우저에만 저장)
- 공유받은 링크를 열면 해당 GIF를 크게 보여줌
- **설정 → GIPHY API 키**: 내 키를 등록하면 기본 키 사용량과 상관없이 계속 사용 가능

## API 키는 이렇게 동작해요

키를 등록하지 않으면 서버의 기본 키를 쓰고, 내 키를 등록하면 브라우저가 GIPHY에 직접 요청합니다.

```
기본 키:  브라우저 ──▶ /api/giphy (IP당 사용량 제한) ──▶ GIPHY   (서버 env의 GIPHY_API_KEY)
내 키:    브라우저 ─────────────────────────────────────▶ GIPHY   (localStorage의 키, 서버를 거치지 않음)
```

| | 기본 키 | 내 키 |
|---|---|---|
| 키 보관 위치 | 서버 환경변수 | 사용자 브라우저(localStorage) |
| 요청 경로 | `/api/giphy` 프록시 | 브라우저 → `api.giphy.com` |
| 사용량 제한 | 같은 IP에서 `DEFAULT_KEY_RATE_WINDOW_SEC` 동안 `DEFAULT_KEY_RATE_LIMIT`회(기본 24시간 30회) | GIPHY 정책(베타 키는 시간당 100회) |

- 기본 키 사용량을 다 쓰면 검색 화면에 "내 API 키 등록" 버튼이 나오고, 키를 저장하면 실패했던 요청을 바로 다시 시도합니다.
- 키는 저장하기 전에 GIPHY에 한 번 요청해서 유효한지 확인합니다.
- 기본 키를 아예 제공하지 않으려면 `GIPHY_API_KEY`를 비우거나 `DEFAULT_KEY_RATE_LIMIT=0`으로 설정하세요. 이 경우 모든 방문자가 자기 키를 등록해야 합니다.

### IP 사용량 제한

- 횟수는 IP 주소를 해시한 값으로 셉니다. IP 원문은 저장하지 않고, 제한 주기가 끝나면 카운터가 만료됩니다.
- `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`(또는 Vercel Upstash 연동이 넣어주는 `KV_REST_API_URL`/`KV_REST_API_TOKEN`)이 있으면 Redis에 카운터를 둬서 서버리스 인스턴스끼리 공유합니다.
- 없으면 함수 인스턴스 메모리에 카운터를 둡니다. 로컬 개발에는 충분하지만, Vercel에서는 인스턴스마다 따로 세고 콜드 스타트 때 초기화되므로 배포 환경에서는 Redis를 권장합니다.
- 클라이언트 IP는 `x-real-ip` → `x-forwarded-for` 순으로 읽습니다. Vercel은 이 헤더를 직접 덮어써서 위조할 수 없지만, 다른 곳에 배포한다면 이 헤더를 덮어쓰는 프록시 뒤에 두세요.
- 모바일 통신사망처럼 여러 사람이 IP 하나를 공유하면 사용량도 같이 차감됩니다. 그래서 내 키 등록 경로를 함께 제공합니다.

## 로컬 실행

```bash
npm install
cp .env.example .env   # 값 채우기
npm run dev            # http://localhost:31500
```

`npm run dev`는 Vite 미들웨어로 `/api/*`를 함께 띄우므로, 서버를 따로 실행할 필요가 없습니다.

## 환경 변수

자세한 설명은 [.env.example](.env.example)에 있습니다. `VITE_`로 시작하는 값은 브라우저 번들에 들어가므로 공개돼도 되는 값만 넣으세요.

| 변수 | 범위 | 설명 |
|---|---|---|
| `GIPHY_API_KEY` | 서버 | 기본 키. 쉼표로 여러 개를 넣으면 한도에 걸린 키에서 다음 키로 넘어감. 비우면 기본 키 없음 |
| `GIPHY_TREND_LIMIT` / `GIPHY_SEARCH_LIMIT` | 서버·빌드 | 트렌딩/검색 결과 개수(기본 15/8). 내 키로 직접 호출할 때도 같은 값을 씀 |
| `DEFAULT_KEY_RATE_LIMIT` | 서버 | 제한 주기당 IP별 기본 키 요청 수(기본 30, `0`이면 기본 키 비활성화) |
| `DEFAULT_KEY_RATE_WINDOW_SEC` | 서버 | 제한 주기(초, 기본 86400) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 서버 | 선택. 사용량 카운터 저장소 |
| `VITE_KAKAO_APP_KEY` | 공개 | 카카오 JavaScript 키 |
| `VITE_KAKAO_TEMPLATE_IDS` | 공개 | 카카오 메시지 템플릿 ID. 1개 또는 5개(비율 1:2, 3:4, 1:1, 4:3, 2:1 순) |
| `VITE_SITE_URL` | 공개 | 배포 주소(끝 `/` 없이). canonical, og:url, robots.txt, sitemap.xml, llms.txt에 들어감 |
| `VITE_GITHUB_URL` | 공개 | 선택. 홈 화면 GitHub 버튼 링크 |
| `VITE_CONTACT_EMAIL` | 공개 | 선택. 설정 화면의 문의 이메일 |
| `VITE_GOOGLE_SITE_VERIFICATION` | 공개 | 선택. Google Search Console 인증 메타 태그 |
| `VITE_SEARCH_CACHE_LIMIT` | 공개 | 브라우저에 캐시할 최근 검색 수(5분 유지) |

## 카카오 설정

1. [Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 **JavaScript 키**를 `VITE_KAKAO_APP_KEY`에 넣습니다.
2. **플랫폼 → Web**에 배포 도메인과 `http://localhost:31500`을 등록합니다. JavaScript 키는 번들에 그대로 노출되므로, 이 도메인 제한이 실제 보호 수단입니다.
3. **메시지 템플릿** 도구에서 템플릿을 만듭니다. 앱은 다음 사용자 인자를 보냅니다.
   - `THU`: GIF 원본 URL(이미지에 사용)
   - `web_mobile`, `web_PC`: `?send=<gifId>`(링크 경로 뒤에 붙이면 받는 사람이 그 GIF를 바로 봄)
4. GIF 비율에 맞춰 템플릿을 5개(1:2, 3:4, 1:1, 4:3, 2:1) 만들거나, 하나만 만들어서 `VITE_KAKAO_TEMPLATE_IDS`에 넣습니다.

## 배포(Vercel)

1. 저장소를 Vercel에 import합니다. `api/` 폴더가 서버리스 함수로 배포됩니다.
2. 위 환경 변수를 Project Settings → Environment Variables에 등록합니다. `VITE_*`와 `GIPHY_*_LIMIT`은 빌드 때 읽히므로, 바꾼 뒤에는 다시 배포해야 반영됩니다.
3. (권장) Vercel Marketplace에서 Upstash Redis를 연결하면 `KV_REST_API_URL`/`KV_REST_API_TOKEN`이 자동으로 들어가고, IP 사용량 제한이 모든 인스턴스에서 공유됩니다.

## 구조

```
api/
  giphy.ts            GIPHY 프록시(기본 키) + 사용량 조회(?type=quota)
  share.ts            공유 횟수 집계(어떤 GIF인지는 기록하지 않음)
  _rateLimit.ts       IP별 사용량 제한(Upstash REST 또는 메모리)
  _config.ts          env → 핸들러 설정(Vercel 함수와 Vite 개발 서버가 공유)
seo/                  robots.txt / sitemap.xml / llms.txt 템플릿(빌드 때 VITE_SITE_URL로 채움)
src/
  utils/giphyClient.ts    내 키면 GIPHY 직접 호출, 아니면 /api/giphy
  utils/apiKeyStorage.ts  내 키 localStorage 저장/삭제
  components/SettingsPage.tsx  API 키 설정, 개인정보처리방침, 이용약관
```

## 개인정보

- 수집: 공유 성공 횟수, 서비스 운영 로그(요청 종류·응답 상태·시각), 기본 키 사용량 제한용 IP 해시
- 저장하지 않음: 검색어, 공유한 GIF 정보, API 키(브라우저에만 저장)
- 외부 서비스: GIPHY, Kakao, Vercel

## 출처

<a href="https://giphy.com"><img src="public/powered-by-giphy.png" alt="Powered by GIPHY" width="200"></a>

GIF 콘텐츠는 [GIPHY API](https://developers.giphy.com)로 제공되며, 저작권은 GIPHY와 각 원저작자에게 있습니다. 카카오톡 공유는 Kakao JavaScript SDK를 사용합니다.
