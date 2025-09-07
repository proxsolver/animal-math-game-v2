// ==================== 게임 데이터 ====================

let gameState = {
    score: 0,
    coins: 0,
    level: 1,
    currentQuestion: {},
    animals: {},
    totalAnimals: 0,
    speciesCount: 0,
    farm: {
        layout: Array(48).fill(null),
        items: {}
    },
    // 매일 로그인 보상 시스템 데이터
    dailyRewards: {
        lastLoginDate: null,
        consecutiveDays: 0,
        hasClaimedToday: false,
        totalDaysLogged: 0
    },
    // 과목별 독립적인 데이터
    subjects: {
        english: { 
            progress: {}, 
            level: 1, 
            score: 0, 
            currentDifficulty: 1,
            totalCorrect: 0,
            totalIncorrect: 0 
        },
        social: { 
            progress: {}, 
            level: 1, 
            score: 0, 
            currentDifficulty: 1,
            totalCorrect: 0,
            totalIncorrect: 0 
        },
        math: { 
            progress: {}, 
            level: 1, 
            score: 0, 
            currentDifficulty: 1,
            totalCorrect: 0,
            totalIncorrect: 0 
        },
        general: { 
            progress: {}, 
            level: 1, 
            score: 0, 
            currentDifficulty: 1,
            totalCorrect: 0,
            totalIncorrect: 0 
        }
    },
    // 현재 선택된 과목
    currentSubject: 'english',
    // 최근 출제된 문제들을 추적하여 중복 방지
    recentQuestions: []
};

// 플레이 시간 추적 변수들
let sessionStartTime = null;
let totalPlayTimeMinutes = 0;

let currentUserId = null;
let currentUserProfile = {};
let selectedItemToPlace = null;
let currentEnglishQuiz = {};
let marketListener = null;

// 새로운 학습 시스템 변수
let currentDifficulty = 1;
let currentWordData = null;
let isLoadingWord = false;
let userProgress = {}; // 사용자 학습 진행도

// 동물 데이터를 저장할 전역 변수
let animalTypes = [];

// JSON 파일에서 동물 데이터 로드
window.loadAnimalsFromJSON = async function() {
    try {
        console.log('동물 JSON 파일 로딩 시작...');
        
        const response = await fetch('./animals.json');
        
        if (!response.ok) {
            throw new Error(`동물 JSON 파일 로드 실패: ${response.status}`);
        }
        
        const data = await response.json();
        animalTypes = data.animals;
        
        console.log(`동물 데이터 로드 완료: ${animalTypes.length}마리`);
        return true;
        
    } catch (error) {
        console.error('동물 JSON 로드 실패, 기본 데이터 사용:', error);
        
        // 폴백: 기본 동물 몇 마리
        animalTypes = [
            {emoji: '🐶', name: '강아지', specialName: '멍멍왕자', rarity: 1},
            {emoji: '🐱', name: '고양이', specialName: '야옹공주', rarity: 1},
            {emoji: '🐰', name: '토끼', specialName: '깡총대장', rarity: 1},
            {emoji: '🦁', name: '사자', specialName: '황금갈기왕', rarity: 4},
            {emoji: '🦄', name: '유니콘', specialName: '순수의 뿔', rarity: 5}
        ];
        
        return false;
    }
}

const shopItems = [
    { name: '빨간 벽', emoji: '🟥', price: 15 }, { name: '파란 벽', emoji: '🟦', price: 15 }, { name: '초록 벽', emoji: '🟩', price: 15 }, { name: '노란 벽', emoji: '🟨', price: 15 }, { name: '하얀 벽', emoji: '⬜', price: 15 }, { name: '검은 벽', emoji: '⬛', price: 15 }, { name: '주황 벽', emoji: '🟧', price: 15 }, { name: '보라 벽', emoji: '🟪', price: 15 }, { name: '갈색 벽', emoji: '🟫', price: 15 },
    { name: '새싹', emoji: '🌱', price: 25 }, { name: '자갈길', emoji: '🪨', price: 35 }, { name: '해바라기', emoji: '🌻', price: 40 }, { name: '튤립', emoji: '🌷', price: 45 }, { name: '꽃', emoji: '🌸', price: 50 }, { name: '덤불', emoji: '🌿', price: 55 }, { name: '버섯', emoji: '🍄', price: 60 }, { name: '밀', emoji: '🌾', price: 65 }, { name: '네잎클로버', emoji: '🍀', price: 75 }, { name: '선인장', emoji: '🌵', price: 80 },
    { name: '길', emoji: '🛤️', price: 80 }, { name: '꽃밭', emoji: '💐', price: 90 }, { name: '나무', emoji: '🌳', price: 100 }, { name: '우체통', emoji: '📮', price: 110 }, { name: '채소밭', emoji: '🥕', price: 120 }, { name: '허수아비', emoji: '🧍', price: 130 }, { name: '상록수', emoji: '🌲', price: 150 }, { name: '울타리', emoji: '🚧', price: 150 }, { name: '벌집', emoji: '🐝', price: 160 }, { name: '벚나무', emoji: '🌸', price: 180 }, { name: '캠프파이어', emoji: '🔥', price: 180 }, { name: '단풍나무', emoji: '🍁', price: 190 }, { name: '야자수', emoji: '🌴', price: 200 }, { name: '가로등', emoji: '💡', price: 220 }, { name: '벤치', emoji: '🪑', price: 250 }, { name: '우물', emoji: '🕳️', price: 280 }, { name: '연못', emoji: '💧', price: 300 },
    { name: '보물상자', emoji: '🎁', price: 350 }, { name: '분수', emoji: '⛲', price: 400 }, { name: '천막', emoji: '⛺', price: 450 }, { name: '집', emoji: '🏠', price: 500 }, { name: '온실', emoji: '🏡', price: 600 }, { name: '다리', emoji: '🌉', price: 800 }, { name: '성', emoji: '🏰', price: 1000 }, { name: '회전목마', emoji: '🎠', price: 1200 }, { name: '무지개', emoji: '🌈', price: 1500 }, { name: '별똥별', emoji: '🌠', price: 2000 }
];

const synthesisRecipes = [
    { result: '그리핀', ingredients: ['사자', '독수리'] },
    { result: '페가수스', ingredients: ['말', '백조'] },
    { result: '키메라', ingredients: ['염소', '사자'] },
    { result: '히드라', ingredients: ['뱀', '용'] },
    { result: '유니콘', ingredients: ['말', '사슴'] },
    { result: '불사조', ingredients: ['독수리', '용'] },
    { result: '동양용', ingredients: ['뱀', '물고기'] },
    { result: '펜리르', ingredients: ['늑대', '곰'] },
    { result: '인어', ingredients: ['돌고래', '원숭이'] },
    { result: '하피', ingredients: ['새', '박쥐'] },
    { result: '대왕오징어', ingredients: ['오징어', '문어'] },
    { result: '백호', ingredients: ['호랑이', '북극곰'] },
    { result: '흑표범', ingredients: ['표범', '늑대'] },
    { result: '매머드', ingredients: ['코끼리', '멧돼지'] },
    { result: '티라노사우루스', ingredients: ['악어', '닭'] },
    { result: '브라키오사우루스', ingredients: ['기린', '소'] },
    { result: '보석 골렘', ingredients: ['거북이', '게'] },
    { result: '별의 정령', ingredients: ['나비', '올빼미'] },
    { result: '은하룡', ingredients: ['용', '고래'] },
    { result: '궁극의 로봇', ingredients: ['거미', '전갈'] }
];

// 전역 변수들을 window 객체에 등록하여 다른 파일에서 접근 가능하도록 함
window.gameState = gameState;
window.sessionStartTime = sessionStartTime;
window.totalPlayTimeMinutes = totalPlayTimeMinutes;
window.currentUserId = currentUserId;
window.currentUserProfile = currentUserProfile;
window.selectedItemToPlace = selectedItemToPlace;
window.currentEnglishQuiz = currentEnglishQuiz;
window.marketListener = marketListener;
window.currentDifficulty = currentDifficulty;
window.currentWordData = currentWordData;
window.isLoadingWord = isLoadingWord;
window.userProgress = userProgress;
window.animalTypes = animalTypes;
window.shopItems = shopItems;
window.synthesisRecipes = synthesisRecipes;