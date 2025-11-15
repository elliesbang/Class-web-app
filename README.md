# 엘리의방 클래스 웹앱

이 저장소는 Cloudflare Pages 배포를 위해 구성된 모바일 웹앱 스타일의 "엘리의방 클래스" Vite + React + TailwindCSS 프로젝트입니다.

## 프로젝트 구조

- `class-web-app/`
  - `index.html`, `manifest.webmanifest`
  - `src/`
    - `components/` – 공통 UI 컴포넌트(NavbarTop, AccordionCategory, CourseCard)
    - `pages/` – 홈, 내부 강의실, VOD, 공지, 마이페이지 화면
    - `App.tsx`, `main.tsx`, `index.css`
  - `tailwind.config.js`, `postcss.config.js`, `vite.config.js`
  - `package.json`
- `package.json` (루트) – Cloudflare Pages용 workspace 및 빌드 스크립트 정의
- `wrangler.toml` – Pages 빌드 설정 및 출력 디렉터리 지정

## Cloudflare Pages 빌드 설정

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `class-web-app`

Cloudflare Pages는 루트 `package.json`의 workspace 스크립트를 통해 하위 프로젝트에서 `npm run build`를 실행하며, 빌드 결과는 `class-web-app/dist`에 생성됩니다.
