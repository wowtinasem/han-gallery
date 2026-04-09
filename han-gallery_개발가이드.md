# han-gallery 프로젝트 개발 가이드
## 한콘연 AI이미지 콘테스트 투표 웹앱

---

## 1단계: 프로젝트 초기 세팅

터미널에서 아래 명령어를 순서대로 실행하세요:

```bash
# Next.js 프로젝트 생성
npx create-next-app@latest han-gallery --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 프로젝트 폴더로 이동
cd han-gallery

# 필요한 패키지 설치
npm install firebase @fingerprintjs/fingerprintjs cloudinary next-cloudinary react-dropzone date-fns

# 개발용 패키지
npm install -D @types/node
```

---

## 2단계: Firebase 설정

1. https://console.firebase.google.com 에서 프로젝트 생성
2. Firestore Database 활성화
3. Blaze 요금제로 업그레이드 (무료 할당 내 0원)
4. 프로젝트 설정 > 웹 앱 추가 > config 복사

---

## 3단계: Cloudinary 설정

1. https://cloudinary.com 가입
2. Dashboard에서 Cloud Name, API Key, API Secret 복사

---

## 4단계: 환경변수 파일 생성

`.env.local` 파일:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin
ADMIN_PASSWORD=your_admin_password
```

---

## 5단계: Claude Code 개발 프롬프트

아래 프롬프트를 Claude Code에 붙여넣으세요:

---

### 프롬프트 시작 ###

한콘연 AI이미지 콘테스트 투표 웹앱을 개발해줘. 프로젝트명은 han-gallery이고 Next.js + TypeScript + Tailwind CSS를 사용해.

## 프로젝트 구조

```
han-gallery/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 메인 (히어로 + 갤러리 + 투표)
│   │   ├── result/page.tsx       # 결과/순위 페이지
│   │   ├── archive/page.tsx      # 아카이브 (1년 보관)
│   │   ├── admin/page.tsx        # 관리자 페이지
│   │   ├── api/
│   │   │   ├── upload/route.ts   # 이미지 업로드 API
│   │   │   └── admin/route.ts    # 관리자 인증 API
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Hero.tsx              # 히어로 영역
│   │   ├── ImageGallery.tsx      # 이미지 갤러리 그리드
│   │   ├── ImageCard.tsx         # 이미지 카드 (번호 + 닉네임 + 투표버튼)
│   │   ├── VoteTimer.tsx         # 투표 카운트다운 타이머
│   │   ├── ResultBoard.tsx       # 결과/순위 보드
│   │   ├── ArchiveList.tsx       # 아카이브 날짜 목록
│   │   ├── AdminUploader.tsx     # 관리자 이미지 업로드
│   │   ├── AdminSettings.tsx     # 투표 시간 설정
│   │   └── Navigation.tsx        # 네비게이션
│   ├── lib/
│   │   ├── firebase.ts           # Firebase 초기화
│   │   ├── firestore.ts          # Firestore CRUD 함수
│   │   ├── cloudinary.ts         # Cloudinary 업로드 함수
│   │   └── fingerprint.ts        # FingerprintJS 초기화
│   └── types/
│       └── index.ts              # TypeScript 타입 정의
├── public/
│   └── hero-bg.jpg               # 히어로 배경 (한콘연 브랜드 이미지 자리)
├── .env.local
└── firestore.rules
```

## Firestore 데이터 모델

```
contests (컬렉션)
  └── {date} (문서, 예: "2026-04-09")
      ├── date: string           // "2026-04-09"
      ├── status: string         // "pending" | "active" | "ended"
      ├── startTime: timestamp   // 투표 시작 시간
      ├── endTime: timestamp     // 투표 종료 시간
      ├── createdAt: timestamp   // TTL 기준 (1년 후 자동 삭제)
      │
      ├── images (서브컬렉션)
      │   └── {imageId}
      │       ├── number: number      // 자동 배정 번호 (1, 2, 3...)
      │       ├── nickname: string    // 저자 닉네임
      │       ├── imageUrl: string    // Cloudinary URL
      │       └── voteCount: number   // 투표 수
      │
      └── votes (서브컬렉션)
          └── {fingerprint}
              ├── fingerprint: string // 브라우저 지문
              ├── imageId: string     // 투표한 이미지 ID
              └── votedAt: timestamp  // 투표 시간
```

## Firestore 보안 규칙 (firestore.rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 콘테스트 정보 - 누구나 읽기 가능
    match /contests/{date} {
      allow read: if true;
      allow write: if false; // 서버(Admin SDK)에서만 쓰기
      
      // 이미지 - 누구나 읽기 가능
      match /images/{imageId} {
        allow read: if true;
        allow write: if false; // 서버에서만 쓰기
      }
      
      // 투표 - 읽기 가능, 쓰기는 1인 1표
      match /votes/{visitorId} {
        allow read: if true;
        allow create: if !exists(/databases/$(database)/documents/contests/$(date)/votes/$(visitorId));
        allow update, delete: if false;
      }
    }
  }
}
```

## 핵심 기능 상세

### 1. 메인 페이지 (/)
- **히어로 영역**: 상단에 한콘연 브랜드 이미지 + "한콘연 AI이미지 콘테스트" 타이틀. 풀 너비. 아래에 투표 상태 표시 (투표중 / 투표 종료 / 준비중).
- **카운트다운 타이머**: 투표 진행 중이면 남은 시간 표시 (시:분:초). endTime 기준으로 실시간 카운트다운. 시간 종료 시 자동으로 status를 "ended"로 변경하고 결과 페이지로 리다이렉트.
- **이미지 갤러리**: 반응형 그리드 (모바일 2열, 태블릿 3열, PC 4~5열). 각 카드에 번호(#01), 닉네임, 이미지, 투표 버튼. 무한 스크롤 또는 "더보기" 버튼으로 이미지 로딩. 투표한 이미지는 파란 테두리 + "투표함" 표시.
- **중복 투표 방지**: FingerprintJS로 브라우저 고유 해시 생성. Firestore votes 서브컬렉션에 fingerprint를 문서 ID로 저장. 이미 투표한 fingerprint면 투표 차단. localStorage에도 백업 저장.

### 2. 결과 페이지 (/result)
- 투표 종료 후 자동 이동 또는 직접 접속.
- 1등/2등/3등은 트로피 아이콘 + 크게 강조 표시.
- 전체 순위 리스트 (번호, 닉네임, 이미지 썸네일, 투표수).
- voteCount 내림차순 정렬.

### 3. 아카이브 페이지 (/archive)
- 지난 1년간 콘테스트 날짜 목록 (최신순).
- 날짜 클릭 시 해당일 이미지 갤러리 + 최종 순위 표시.
- Firestore에서 contests 컬렉션을 createdAt 내림차순으로 쿼리.

### 4. 관리자 페이지 (/admin)
- **인증**: 페이지 진입 시 비밀번호 입력 (환경변수 ADMIN_PASSWORD와 비교). sessionStorage에 인증 상태 저장.
- **이미지 업로드**: react-dropzone으로 드래그 앤 드롭 또는 파일 선택. 다중 파일 선택 가능. 파일명 "닉네임_작품명.png" 형식에서 언더스코어(_) 앞부분을 닉네임으로 자동 파싱. 파싱 실패 시 수동 입력 필드 표시. 업로드 시 Cloudinary에 이미지 저장 (서버 API Route 경유) → Firestore images 서브컬렉션에 문서 생성 → 번호 자동 배정 (기존 이미지 수 + 1).
- **개별 추가 업로드**: 이미 업로드된 이미지 목록 하단에 "추가 업로드" 버튼. 다음 번호 자동 배정.
- **투표 시간 설정**: 시작 시간, 종료 시간을 datetime-local input으로 설정. "투표 시작" 버튼 → status를 "active"로 변경. "투표 종료" 버튼 → status를 "ended"로 수동 변경 가능.
- **미리보기**: 업로드된 이미지 그리드 미리보기 + 개별 삭제 버튼.

### 5. 이미지 업로드 API (/api/upload)
- POST 요청. multipart/form-data로 이미지 파일 + 닉네임 수신.
- Cloudinary에 업로드 (자동 리사이즈 1024px).
- Firestore에 이미지 문서 생성.
- 응답: { imageUrl, number, nickname }

### 6. 관리자 인증 API (/api/admin)
- POST 요청. password 필드 비교.
- 환경변수 ADMIN_PASSWORD와 일치하면 성공 응답.

## UI/UX 요구사항

- Tailwind CSS로 스타일링. 다크모드 지원 불필요 (라이트 모드만).
- 모바일 우선 설계. 카카오톡에서 링크 공유 → 모바일 접속이 대부분.
- 이미지 lazy loading 적용.
- 히어로 영역 배경: 그라데이션 또는 한콘연 브랜드 이미지 (public/hero-bg.jpg). 아직 이미지가 없으면 그라데이션 플레이스홀더.
- 색상 테마: 네이비(#1B3A5C) + 블루(#2E75B6) + 화이트. 깔끔하고 전문적인 느낌.
- 투표 버튼은 눈에 잘 띄게 파란색 계열.
- 1등 금색, 2등 은색, 3등 동색 트로피.
- OG 태그 적용 (카카오톡 공유 시 미리보기).

## 개발 순서

1. Firebase 초기화 (lib/firebase.ts) + 타입 정의 (types/index.ts)
2. 관리자 페이지 (/admin) - 업로드 + 투표 설정
3. 메인 페이지 (/) - 히어로 + 갤러리 + 투표 + 타이머
4. 결과 페이지 (/result) - 순위 표시
5. 아카이브 페이지 (/archive) - 날짜별 기록
6. Cloudinary 업로드 API Route
7. FingerprintJS 중복 투표 방지
8. 반응형 + 모바일 최적화
9. OG 태그 + 메타데이터

모든 파일을 한꺼번에 만들어줘. 실제 동작하는 완전한 코드로.

### 프롬프트 끝 ###

---

## 6단계: Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 환경변수 설정 (Vercel 대시보드에서도 가능)
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
vercel env add CLOUDINARY_API_KEY
vercel env add CLOUDINARY_API_SECRET
vercel env add ADMIN_PASSWORD
```

---

## 7단계: Firestore TTL 설정 (1년 자동 삭제)

Firebase Console > Firestore > TTL policies에서:
- 컬렉션: `contests`
- 필드: `createdAt`
- TTL: 365일

---

## 체크리스트

- [ ] Firebase 프로젝트 생성 + Blaze 업그레이드
- [ ] Cloudinary 계정 생성
- [ ] .env.local 환경변수 설정
- [ ] Claude Code로 전체 코드 생성
- [ ] 로컬 테스트 (npm run dev)
- [ ] 관리자 페이지에서 이미지 업로드 테스트
- [ ] 투표 기능 테스트
- [ ] 중복 투표 방지 테스트
- [ ] 모바일 반응형 테스트
- [ ] Vercel 배포
- [ ] Firestore 보안 규칙 적용
- [ ] Firestore TTL 정책 설정
- [ ] Firebase 예산 알림 설정
- [ ] 카카오톡 공유 테스트 (OG 태그)
