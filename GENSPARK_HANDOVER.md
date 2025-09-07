# 🎮 동물 수집 학습 게임 - GenSpark AI 개발자 핸드오버 문서

## 📋 프로젝트 개요

**프로젝트명**: 동물 수집 학습 게임 (Animal Math Game V2)
**저장소**: https://github.com/proxsolver/animal-math-game-v2
**현재 브랜치**: `genspark_ai_developer`
**작업 디렉토리**: `/home/user/webapp`

## 🚨 현재 발견된 중요 오류

### ❌ 주요 JavaScript 오류
```
TypeError: window.loadAnimalsFromJSON is not a function
at window.onFirebaseReady (line:2180:30)
```

**문제 원인**: 
- 함수가 상단에 정의되었지만 여전히 호출 시점에 undefined 상태
- JavaScript 함수 호이스팅과 스크립트 실행 순서 문제
- Firebase 초기화 후 즉시 호출되는데 함수가 아직 로드되지 않음

## 🔧 현재 프로젝트 상태

### ✅ 정상 작동하는 기능들
- Firebase 인증 및 데이터베이스 연결
- 기본 UI 렌더링
- 페이지 구조 로드
- 로그인 오버레이 표시

### ❌ 현재 문제가 있는 기능들
- `loadAnimalsFromJSON()` 함수 호출 실패
- 동물 데이터 로딩 중단
- 게임 초기화 프로세스 실패
- showPage 네비게이션 (간헐적 오류)

## 📁 프로젝트 구조

```
/home/user/webapp/
├── index.html              # 메인 게임 파일 (345KB, 모든 코드 포함)
├── animals.json           # 동물 데이터 (47KB)
├── subjects/              # 과목별 문제 데이터
│   ├── math/level1.json
│   ├── social/level1.json
│   └── general/level1.json
├── backend.js            # 백엔드 로직 (사용 안함)
├── supervisord.conf      # Python 서버 데몬 설정
├── webserver.log         # 서버 로그
└── webserver_error.log   # 서버 오류 로그
```

## 🌐 서버 정보

**현재 실행 중인 서버**: 
- URL: https://8000-ie5ro0ffkkuuklvtnj79d-6532622b.e2b.dev/
- 포트: 8000
- 상태: RUNNING (PID: 36477)
- 데몬 관리: supervisor

**서버 관리 명령어**:
```bash
cd /home/user/webapp
supervisorctl -c supervisord.conf status
supervisorctl -c supervisord.conf restart webserver
supervisorctl -c supervisord.conf stop webserver
```

## 🔍 주요 기술 스택

- **Frontend**: Pure HTML + CSS + JavaScript (바닐라)
- **Database**: Firebase Firestore + Realtime Database  
- **Authentication**: Firebase Anonymous Auth
- **Server**: Python HTTP Server (Supervisor 데몬)
- **Version Control**: Git (GitHub)

## 🎯 구현된 주요 기능들

### ✅ 완료된 기능
1. **Multi-Subject System**: English, Math, Social Studies, General Knowledge
2. **Level System**: Level 1-3 난이도별 문제
3. **Battle Mode System**: 실시간 멀티플레이어 대전 (구현 완료)
4. **Firebase Integration**: 데이터베이스 연동
5. **Animal Collection**: 동물 수집 및 컬렉션 관리
6. **UI/UX**: 반응형 게이밍 테마 디자인

### 🚧 부분 완료/문제 있는 기능
1. **Core Game Functions**: 함수 로딩 타이밍 이슈
2. **Animal Data Loading**: loadAnimalsFromJSON 오류
3. **Page Navigation**: showPage 간헐적 오류
4. **Game Initialization**: 초기화 프로세스 실패

## 🐛 해결해야 할 우선순위 작업

### 🔴 높음 (Critical)
1. **loadAnimalsFromJSON 함수 오류 해결**
   - 현재 위치: 스크립트 상단 (line ~2350)
   - 호출 위치: onFirebaseReady (line 2180)
   - 해결 필요: 함수 정의 순서 또는 비동기 로딩 이슈

2. **JavaScript 함수 호이스팅 완전 해결**
   - showPage, updateUI, updateAnimalCollection 함수들
   - 현재 일부는 상단으로 이동했지만 여전히 문제

3. **게임 초기화 프로세스 재구성**
   - Firebase 준비 → 함수 정의 → 데이터 로딩 순서 보장

### 🟡 중간 (Important)
1. **배틀모드 실시간 기능 테스트**
2. **과목별 문제 데이터 검증** 
3. **사용자 인터페이스 반응성 개선**

## 💻 개발 환경 설정

### Git 워크플로우
```bash
# 현재 브랜치 확인
git branch
# > * genspark_ai_developer

# 최신 상태 동기화
git fetch origin main
git rebase origin/main

# 작업 후 커밋 (필수!)
git add .
git commit -m "설명적인 메시지"

# PR 전 커밋 스쿼시 (필수!)
git reset --soft HEAD~N
git commit -m "통합 메시지"

# 푸시 및 PR 생성 (필수!)
git push origin genspark_ai_developer
```

## 🔧 디버깅 도구 및 방법

### 1. 브라우저 콘솔 확인
- 개발자 도구 → Console 탭
- 현재 오류: `TypeError: window.loadAnimalsFromJSON is not a function`

### 2. 서버 로그 확인
```bash
cd /home/user/webapp
tail -f webserver_error.log
supervisorctl -c supervisord.conf tail webserver
```

### 3. JavaScript 함수 존재 확인
브라우저 콘솔에서:
```javascript
typeof window.showPage
typeof window.loadAnimalsFromJSON
typeof window.updateUI
```

## 📚 주요 파일별 설명

### index.html (345KB)
- **라인 1-1000**: CSS 스타일링 
- **라인 1000-2316**: HTML 구조 + Firebase 초기화
- **라인 2318-**: JavaScript 게임 로직 (문제 발생 구간)
- **핵심 함수들**: showPage, loadAnimalsFromJSON, updateUI 등

### animals.json (47KB)
```json
{
  "animals": [
    {
      "emoji": "🐶",
      "name": "강아지", 
      "specialName": "멍멍왕자",
      "rarity": 1
    }
    // ... 총 100+ 동물 데이터
  ]
}
```

## ⚡ 즉시 해결이 필요한 문제

### 🚨 Critical Issue: loadAnimalsFromJSON 함수 오류

**현상**: Firebase 초기화 후 `window.loadAnimalsFromJSON is not a function` 오류 발생

**추정 원인**:
1. 함수 정의가 호출 시점보다 늦게 실행됨
2. Script 태그 내부의 실행 순서 문제
3. Firebase onReady 콜백이 너무 빨리 실행됨

**제안 해결방안**:
1. **함수를 HTML head 섹션에 즉시 정의**
2. **DOMContentLoaded 이벤트 활용**
3. **함수 존재 확인 후 호출하는 안전장치 추가**

## 🎯 새 개발자를 위한 첫 번째 작업 가이드

### Step 1: 환경 확인
```bash
cd /home/user/webapp
pwd  # /home/user/webapp 확인
git status  # genspark_ai_developer 브랜치 확인
supervisorctl -c supervisord.conf status  # 서버 실행 확인
```

### Step 2: 현재 오류 재현
1. 브라우저에서 https://8000-ie5ro0ffkkuuklvtnj79d-6532622b.e2b.dev/ 접속
2. 개발자 도구 Console 열기
3. `TypeError: window.loadAnimalsFromJSON is not a function` 오류 확인

### Step 3: 함수 정의 상태 확인
```bash
cd /home/user/webapp
grep -n "window.loadAnimalsFromJSON" index.html
grep -n "loadAnimalsFromJSON" index.html
```

### Step 4: 오류 해결 작업
1. loadAnimalsFromJSON 함수를 더 앞쪽으로 이동
2. 또는 DOMContentLoaded 이벤트 활용
3. 함수 존재 확인 후 호출하는 안전장치 추가

## 📞 이전 개발자 작업 내역

### 최근 완료된 작업 (커밋 이력)
- `8b9ad56`: 핵심 함수 통합으로 showPage 오류 해결 시도
- `d7057bb`: 완전한 배틀 모드 시스템 구현
- `d1bd466`: JavaScript 오류 수정으로 배틀모드 구현

### 시도했지만 아직 해결되지 않은 문제
1. **함수 호이스팅 이슈**: 상단으로 이동했지만 여전히 오류
2. **스크립트 실행 순서**: Firebase 초기화와 함수 정의 타이밍
3. **완전한 개발자 콘솔 통합**: 아직 일부 수동 입력 필요

## 🎯 성공 기준

새 개발자가 성공적으로 해결해야 할 목표:

1. ✅ **브라우저 콘솔에서 JavaScript 오류 0개**
2. ✅ **페이지 로드 시 모든 네비게이션 버튼 정상 작동**  
3. ✅ **동물 잡기 게임 즉시 플레이 가능**
4. ✅ **개발자 콘솔 수동 입력 완전히 불필요**
5. ✅ **배틀모드 정상 작동 확인**

---

## 💡 개발자 팁

### 유용한 명령어들
```bash
# 실시간 로그 모니터링
tail -f webserver_error.log

# 함수 검색
grep -n "function.*functionName" index.html

# JavaScript 오류 패턴 찾기
grep -n "window\." index.html | head -20

# 서버 재시작 (변경사항 반영)
supervisorctl -c supervisord.conf restart webserver
```

### 브라우저 디버깅
```javascript
// 함수 존재 확인
console.log('showPage:', typeof window.showPage);
console.log('loadAnimalsFromJSON:', typeof window.loadAnimalsFromJSON);

// 수동 함수 호출 테스트  
if (typeof window.showPage === 'function') {
    window.showPage('game', document.querySelector('.nav-btn'));
}
```

---

**새 GenSpark AI 개발자님, 이 문서를 기반으로 프로젝트를 이어받아 주세요!** 🚀

현재 가장 우선순위가 높은 작업은 `loadAnimalsFromJSON` 함수 오류 해결입니다.