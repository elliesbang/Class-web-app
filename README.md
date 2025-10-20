# 엘리의방 클래스 웹앱

이 저장소는 Cloudflare Pages 배포를 위해 구성된 모바일 웹앱 스타일의 "엘리의방 클래스" Vite + React + TailwindCSS 프로젝트입니다.

## 프로젝트 구조

- `elliesroom-class/`
  - `index.html`, `manifest.webmanifest`
  - `src/`
    - `components/` – 공통 UI 컴포넌트(NavbarTop, AccordionCategory, CourseCard)
    - `pages/` – 홈, 내부 강의실, VOD, 공지, 마이페이지 화면
    - `App.jsx`, `main.jsx`, `index.css`
  - `tailwind.config.js`, `postcss.config.js`, `vite.config.js`
  - `package.json`

## 주요 라우트

- `/` – 홈
- `/internal` – 내부 강의실 (카테고리 아코디언 포함)
- `/vod` – VOD
- `/notices` – 공지
- `/mypage` – 마이페이지

## 빌드

Cloudflare Pages 빌드 명령어는 `npm run build`, 출력 디렉터리는 `dist` 입니다.
