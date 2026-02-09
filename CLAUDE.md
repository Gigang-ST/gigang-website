# Project Guidelines

## Package Manager
- pnpm을 사용한다. npm이나 yarn을 사용하지 않는다.
- 스크립트 실행: `pnpm dev`, `pnpm build` 등

## Cross-Platform
- Windows와 macOS 모두에서 동작해야 한다.
- 쉘 스크립트(`rm -rf` 등) 대신 Node.js 기반의 크로스플랫폼 방식을 사용한다.

## Backend
- 백엔드는 Google Sheets를 사용한다. (Google Apps Script 연동)

## Deployment
- 로컬에서는 pnpm으로 개발/테스트한다.
- 실제 배포는 Vercel에서 한다.
