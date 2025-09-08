# Gemini로 분석한 Animal Math Game v2 프로젝트

이 문서는 `animal-math-game-v2` 프로젝트의 소스 코드를 분석하고, 이를 기반으로 재구축 전략 및 향후 발전 방향을 제시합니다.

## 1. 프로젝트 개요 (Project Overview)

`animal-math-game-v2`는 사용자가 다양한 과목(영어, 사회, 수학, 상식)의 퀴즈를 풀고 보상으로 동물을 수집하여 자신만의 동물원과 농장을 꾸미는 웹 기반 교육용 게임입니다.

**주요 기능:**
-   **다양한 과목의 학습 퀴즈:** 레벨별, 과목별로 분리된 JSON 데이터를 활용한 퀴즈 시스템.
-   **동물 수집 및 성장:** 퀴즈 정답 시 다양한 희귀도의 동물을 획득하고, 레벨업 시킬 수 있음.
-   **동물 합성 및 도감:** 수집한 동물을 조합하여 새로운 전설의 동물을 만드는 합성 시스템과 도감 기능.
-   **소셜 및 경제 시스템:** 사용자 간 동물을 거래할 수 있는 시장, 다른 유저의 농장 방문, 랭킹 시스템.
-   **개인화 및 꾸미기:** 자신만의 농장을 아이템으로 꾸미는 기능.
-   **AI 기반 콘텐츠 생성:** Gemini API를 활용하여 수집한 동물의 특별한 이야기를 생성.
-   **강력한 보상 시스템:** 일일 미션, 연속 로그인 보상, 학습 시간 보상 등 다채로운 동기부여 장치.

## 2. 기술 스택 및 아키텍처 분석 (Tech Stack & Architecture)

이 프로젝트는 순수 JavaScript(Vanilla JS)를 기반으로 Firebase의 강력한 백엔드 서비스를 적극 활용하는 현대적인 웹 애플리케이션 구조를 가집니다.

-   **Frontend:**
    -   `HTML`, `CSS`, `JavaScript (ES6+)`
    -   별도의 프레임워크 없이 순수 JS로 구현되었으며, 페이지 전환은 `div`의 표시/숨김으로 처리하는 SPA(Single Page Application) 패턴을 사용합니다.

-   **Backend & Database:**
    -   **Firebase Firestore:** 사용자 데이터(게임 상태, 동물, 농장 정보), 시장 매물, 랭킹 등 핵심 데이터를 저장하는 NoSQL 데이터베이스로 활용됩니다. 실시간 동기화를 위해 `onSnapshot`을 사용합니다.
    -   **Firebase Authentication:** 익명 로그인을 기반으로 각 사용자를 식별하고 데이터를 관리합니다.
    -   **Firebase Cloud Functions:** `backend.js`에 정의된 서버리스 함수. Node.js 환경에서 실행되며, Gemini API와 연동하여 AI 이야기를 생성하는 역할을 합니다.
    -   **Gemini API:** Google의 생성형 AI 모델을 사용하여 게임 내 동물의 동화를 동적으로 생성합니다.

-   **Static File Server:**
    -   `web_server.py` & `supervisord.conf`: 경량 Python 웹 서버를 사용하여 HTML, CSS, JS, JSON 등 정적 파일을 호스팅합니다. `supervisord` 설정은 이 서버가 안정적으로 백그라운드에서 실행되도록 관리하는 역할을 합니다. 이는 Firebase Hosting의 대안으로 선택된 배포 전략으로 보입니다.

-   **Data Format:**
    -   `JSON`: 동물 목록(`animals.json`), 과목별/레벨별 문제(`subjects/**/*.json`) 등 게임의 핵심 정적 데이터를 관리합니다.

### 아키텍처 다이어그램 (개념)

```
[ 사용자 (Browser) ]
       |
       |--- [ HTML / CSS / JS (Vanilla JS) ] --- (정적 파일 by Python Server or Firebase Hosting)
       |      |
       |      |--- [ Firebase Auth ] (인증)
       |      |
       |      |--- [ Firestore DB ] (유저 데이터, 시장, 랭킹 등 실시간 동기화)
       |      |
       |      +--- [ Firebase Cloud Functions (Node.js) ]
       |                   |
       |                   +--- [ Google Gemini API ] (AI 이야기 생성)
       |
       +--- [ animals.json / subjects/*.json ] (게임 콘텐츠 데이터)
```

## 3. 소스 코드 상세 분석 (Detailed Source Code Analysis)

-   **`index.html`**:
    -   모든 UI 요소(로그인, 대시보드, 퀴즈, 동물원, 시장, 농장 등)가 `div`로 구현된 SPA의 뼈대입니다.
    -   Firebase SDK를 동적으로 로드하고 초기화하는 로직이 포함되어 있습니다.

-   **`style.css`**:
    -   게임의 시각적 디자인과 사용자 경험을 책임집니다.
    -   Flexbox와 Grid를 활용한 레이아웃, 그라데이션 배경, 다양한 애니메이션(모달 팝업, 버튼 호버, 정답/오답 효과) 등 풍부한 스타일이 정의되어 있습니다.

-   **`function/game-data.js`**:
    -   클라이언트 측의 모든 상태를 관리하는 `gameState` 전역 객체를 정의합니다.
    -   상점 아이템, 동물 합성 레시피 등 정적 데이터를 포함하며, `animals.json`을 로드하는 함수가 있습니다.

-   **`function/game-functions.js`**:
    -   게임의 핵심 로직 중 재사용 가능한 함수들을 모아놓은 모듈입니다.
    -   일일 미션, 학습 타이머, 보상 시스템, Firebase 데이터 동기화(`saveCurrentUserData`, `loadCurrentUserData`) 등 중요한 기능들이 포함됩니다.

-   **`function/main.js`**:
    -   사실상의 메인 컨트롤러(Controller) 역할을 합니다.
    -   사용자의 모든 입력(버튼 클릭 등)을 처리하고, 페이지를 전환하며, `game-data.js`의 상태를 변경하고, `game-functions.js`의 함수를 호출하여 게임을 진행시킵니다.
    -   퀴즈 생성, 정답 확인, 동물 획득, UI 업데이트 등 게임의 핵심 흐름이 모두 이 파일에 집중되어 있습니다.

-   **`backend.js`**:
    -   유일한 서버리스 백엔드 로직입니다.
    -   `generateStory` 함수는 클라이언트로부터 동물 정보를 받아 Gemini API에 요청을 보내고, 생성된 이야기를 다시 클라이언트로 반환하는 명확한 역할을 수행합니다.

-   **`animals.json` / `subjects/**/*.json`**:
    -   게임의 모든 콘텐츠를 담고 있는 정적 데이터베이스입니다.
    -   이 파일들을 수정하는 것만으로 게임의 동물이나 문제를 쉽게 추가/변경할 수 있는 확장성 있는 구조입니다.

## 4. 앱 재구축을 위한 프롬프트 구성 전략

이 애플리케이션을 처음부터 다시 만든다고 가정할 때, 다음과 같은 단계별 프롬프트를 구성할 수 있습니다.

**1단계: 프로젝트 구조 및 데이터 모델링**
> "학습 게임을 위한 웹 프로젝트를 시작하겠습니다. `index.html`, `style.css` 파일을 만들고, JavaScript 로직을 담을 `function` 폴더와 문제 데이터를 담을 `subjects` 폴더를 생성해주세요.
> `animals.json` 파일을 만들고, `emoji`, `name`, `specialName`, `rarity` 필드를 가진 동물 객체 5개를 샘플로 추가해주세요.
> `subjects/math/level1.json` 파일을 만들고, `question`, `options`, `answer`(정답 인덱스), `explanation` 필드를 가진 수학 문제 객체 3개를 샘플로 추가해주세요."

**2단계: 기본 HTML 구조 및 CSS 스타일링**
> "`index.html`에 SPA(Single Page Application) 구조를 만들어주세요. 로그인, 메인 대시보드, 퀴즈, 동물원 페이지에 해당하는 `div`들을 만들고, 초기에는 로그인 페이지만 보이게 설정합니다. 헤더에는 게임 제목과 점수, 코인 등 상태를 표시할 영역을 만들어주세요.
> `style.css`에 게임의 기본 디자인을 적용합니다. 그라데이션 배경, 버튼 스타일, 동물 카드를 위한 그리드 레이아웃을 만들고, 모바일 반응형 디자인을 고려해주세요."

**3단계: 클라이언트 상태 관리 및 핵심 로직 구현**
> "`function/game-data.js` 파일에 게임의 모든 상태를 관리할 `gameState` 객체를 정의해주세요. 여기에는 `score`, `coins`, `level`, `collectedAnimals` 같은 기본 정보가 포함되어야 합니다.
> `function/main.js`에서 핵심 로직을 구현합니다. `showPage` 함수로 페이지 전환을 처리하고, `animals.json`과 `subjects`의 문제 데이터를 fetch하여 퀴즈를 생성하는 `generateQuiz` 함수를 만들어주세요. 사용자가 답을 선택하면 정답을 확인하고 `gameState`를 업데이트하는 로직을 추가합니다."

**4단계: Firebase 연동 (인증 및 데이터베이스)**
> "`index.html`에 Firebase SDK를 추가하고 초기화 코드를 작성해주세요.
> `function/game-functions.js`에서 Firebase와 연동하는 함수들을 만듭니다. 익명 인증으로 사용자를 식별하고, `saveCurrentUserData` 함수를 만들어 `gameState` 객체를 Firestore에 저장하고, `loadCurrentUserData` 함수로 불러오는 기능을 구현해주세요. 로그인 성공 시 Firestore에서 데이터를 로드하도록 `main.js`를 수정합니다."

**5단계: 고급 기능 - AI 이야기 생성 (Cloud Function)**
> "Firebase Cloud Function을 사용하여 AI 동물 이야기 생성 기능을 추가합니다. `backend.js` 파일에 `generateStory`라는 이름의 `onCall` 함수를 정의하세요. 이 함수는 클라이언트에서 동물 객체를 인자로 받아, 해당 동물의 `specialName`을 이용해 재미있는 동화를 만들어달라는 프롬프트를 구성합니다. Google Gemini API를 호출하여 이야기를 생성하고, 그 결과를 클라이언트에 반환하도록 코드를 작성해주세요."

**6단계: 고급 기능 - 농장 및 시장 시스템**
> "`gameState`에 `farm: { layout: Array(48).fill(null) }`을 추가하여 농장 데이터를 모델링합니다. `index.html`에 8x6 그리드로 농장 UI를 만들고, 사용자가 상점에서 아이템을 구매하여 배치하는 기능을 `main.js`에 구현해주세요.
> 동물 시장을 위해 Firestore에 `market_listings` 컬렉션을 사용합니다. 동물을 판매 등록하고, 다른 사용자가 올린 매물을 실시간으로 조회(`onSnapshot` 사용)하고 구매하는 기능을 구현해주세요."

## 5. 향후 발전 방향 및 개선 제안

-   **코드 리팩토링 (Refactoring):**
    -   **프레임워크 도입:** 현재 순수 JS와 전역 객체(`gameState`) 기반의 상태 관리는 프로젝트가 커질수록 유지보수가 어렵습니다. React, Vue, Svelte 같은 현대적인 프론트엔드 프레임워크를 도입하여 컴포넌트 기반 아키텍처와 선언적 상태 관리를 적용하는 것을 강력히 추천합니다. 이는 코드의 재사용성과 가독성을 크게 향상시킬 것입니다.
    -   **모듈화:** `main.js` 파일이 너무 비대합니다. 기능별(UI, 퀴즈, 동물원, 시장 등)로 파일을 분리하여 모듈화해야 합니다.

-   **아키텍처 개선:**
    -   **Firebase Hosting 사용:** `web_server.py`를 사용하는 대신 Firebase Hosting으로 정적 파일을 배포하면 전체 인프라를 Firebase 생태계로 통합하여 배포 및 관리를 단순화할 수 있습니다.

-   **UI/UX 향상:**
    -   **사운드 이펙트 추가:** 버튼 클릭, 정답/오답, 동물 획득 등 다양한 상호작용에 효과음을 추가하여 게임의 몰입감을 높일 수 있습니다.
    -   **애니메이션 고도화:** CSS 애니메이션을 더 적극적으로 활용하여 페이지 전환, 동물 레벨업, 아이템 획득 등의 과정에 더 생동감 있는 시각 효과를 줄 수 있습니다.

-   **신규 기능 제안:**
    -   **친구 시스템:** 사용자들이 서로 친구를 맺고, 친구의 농장을 쉽게 방문하거나 선물을 주고받는 기능을 추가합니다.
    -   **도전 과제 시스템:** "수학 문제 100개 풀기", "전설 동물 3마리 합성하기" 등 다양한 도전 과제를 추가하고 보상을 제공하여 장기적인 플레이 동기를 부여합니다.
    -   **오프라인 모드:** Service Worker와 IndexedDB를 사용하여 인터넷 연결이 없을 때도 일부 기능을 (예: 퀴즈 풀기) 즐길 수 있도록 하고, 연결이 복구되면 데이터를 동기화하는 기능을 구현합니다.
    -   **사용자 콘텐츠 생성:** 사용자가 직접 퀴즈 문제를 출제하고 다른 사용자들이 푸는 시스템을 도입하여 콘텐츠를 확장하고 커뮤니티를 활성화시킬 수 있습니다. (관리자의 승인 절차 필요)

-   **코드 품질 관리:**
    -   **Linting & Formatting:** ESLint와 Prettier를 도입하여 일관된 코드 스타일을 유지하고 잠재적인 오류를 사전에 방지합니다.
    -   **테스트 코드 작성:** Jest나 Vitest 같은 테스팅 프레임워크를 사용하여 `game-functions.js`의 핵심 게임 로직에 대한 단위 테스트를 작성하여 안정성을 높입니다.
