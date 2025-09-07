/**
 * 게임 로직 및 학습 시스템
 */

// 게임 상태 관리
let currentGameState = {
    isPlaying: false,
    currentLevel: 1,
    currentSubject: 'english',
    currentQuestionIndex: 0,
    questions: [],
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    timer: null
};

// 과목별 데이터 URL
const SUBJECT_DATA_URLS = {
    english: './subjects/english/level1.json',
    math: './subjects/math/level1.json',
    social: './subjects/social/level1.json',
    general: './subjects/general/level1.json'
};

// 게임 시작 함수
export function startGame() {
    console.log('게임 시작:', currentGameState);
    
    if (!currentGameState.questions || currentGameState.questions.length === 0) {
        console.log('질문 데이터가 없어서 로딩합니다.');
        return; // 무한 루프 방지: loadQuestionData 호출하지 않음
    }
    
    currentGameState.isPlaying = true;
    currentGameState.currentQuestionIndex = 0;
    currentGameState.score = window.currentUserProfile?.totalScore || 0;
    currentGameState.correctAnswers = 0;
    
    loadNextQuestion();
}

// 질문 데이터 로딩
async function loadQuestionData() {
    try {
        const level = currentGameState.currentLevel;
        const subject = currentGameState.currentSubject;
        
        console.log(`질문 데이터 로딩: ${subject} Level ${level}`);
        
        // 기본 질문 데이터 (실제 파일이 없을 경우)
        const fallbackQuestions = generateFallbackQuestions(subject, level);
        currentGameState.questions = fallbackQuestions;
        currentGameState.totalQuestions = fallbackQuestions.length;
        
        console.log(`질문 데이터 로드 완료: ${fallbackQuestions.length}개`);
        
        // 게임 UI 업데이트
        updateGameUI();
        
        // 게임 UI만 업데이트 (자동 시작 방지)
        console.log('질문 데이터 준비 완료. 난이도를 선택하면 게임이 시작됩니다.');
        
    } catch (error) {
        console.error('질문 데이터 로딩 실패:', error);
        
        // 폴백 데이터 사용
        const fallbackQuestions = generateFallbackQuestions(currentGameState.currentSubject, currentGameState.currentLevel);
        currentGameState.questions = fallbackQuestions;
        updateGameUI();
    }
}

// 폴백 질문 생성
function generateFallbackQuestions(subject, level) {
    const questions = [];
    
    if (subject === 'english') {
        const animalData = window.animalTypes && window.animalTypes.length > 0 ? window.animalTypes : [
            {emoji: '🐶', name: '강아지', englishName: 'Dog', rarity: 1},
            {emoji: '🐱', name: '고양이', englishName: 'Cat', rarity: 1},
            {emoji: '🐰', name: '토끼', englishName: 'Rabbit', rarity: 1},
            {emoji: '🦁', name: '사자', englishName: 'Lion', rarity: 3},
            {emoji: '🐻', name: '곰', englishName: 'Bear', rarity: 2},
            {emoji: '🐸', name: '개구리', englishName: 'Frog', rarity: 1},
            {emoji: '🐧', name: '펭귄', englishName: 'Penguin', rarity: 2},
            {emoji: '🦄', name: '유니콘', englishName: 'Unicorn', rarity: 5},
            {emoji: '🐨', name: '코알라', englishName: 'Koala', rarity: 3},
            {emoji: '🦘', name: '캥거루', englishName: 'Kangaroo', rarity: 3}
        ];
        
        console.log('사용할 동물 데이터:', animalData.length, '마리');
        
        // 영어 단어 문제 생성
        for (let i = 0; i < Math.min(10, animalData.length); i++) {
            const animal = animalData[i];
            const correctAnswer = animal.englishName || animal.name;
            const wrongAnswers = generateWrongAnswers(animalData, correctAnswer, 3);
            
            questions.push({
                question: `${animal.emoji} 이 동물의 영어 이름은?`,
                options: shuffleArray([correctAnswer, ...wrongAnswers]),
                correct: correctAnswer,
                animal: animal,
                subject: 'english',
                level: level
            });
        }
    } else if (subject === 'math') {
        // 수학 문제 생성
        for (let i = 0; i < 10; i++) {
            const num1 = Math.floor(Math.random() * 10) + 1;
            const num2 = Math.floor(Math.random() * 10) + 1;
            const operator = level === 1 ? '+' : (Math.random() > 0.5 ? '+' : '-');
            const correct = operator === '+' ? num1 + num2 : num1 - num2;
            
            if (correct < 0) continue; // 음수 제외
            
            const wrongAnswers = [correct + 1, correct - 1, correct + 2].filter(n => n >= 0);
            
            questions.push({
                question: `${num1} ${operator} ${num2} = ?`,
                options: shuffleArray([correct.toString(), ...wrongAnswers.map(n => n.toString())]),
                correct: correct.toString(),
                subject: 'math',
                level: level
            });
        }
    }
    
    return questions;
}

// 틀린 답변 생성
function generateWrongAnswers(animalData, correctAnswer, count) {
    const wrongAnswers = [];
    const otherAnimals = animalData.filter(a => (a.englishName || a.name) !== correctAnswer);
    
    for (let i = 0; i < count && i < otherAnimals.length; i++) {
        wrongAnswers.push(otherAnimals[i].englishName || otherAnimals[i].name);
    }
    
    return wrongAnswers;
}

// 배열 섞기
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 다음 질문 로드
function loadNextQuestion() {
    if (currentGameState.currentQuestionIndex >= currentGameState.questions.length) {
        endGame();
        return;
    }
    
    const question = currentGameState.questions[currentGameState.currentQuestionIndex];
    displayQuestion(question);
}

// 질문 표시
function displayQuestion(question) {
    const questionEl = document.getElementById('english-question');
    const optionsEl = document.getElementById('english-options');
    const feedbackEl = document.getElementById('feedback');
    
    if (questionEl) {
        questionEl.textContent = question.question;
    }
    
    if (optionsEl) {
        optionsEl.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.onclick = () => selectAnswer(option, question.correct);
            optionsEl.appendChild(button);
        });
    }
    
    if (feedbackEl) {
        feedbackEl.textContent = '';
    }
    
    console.log('질문 표시:', question.question);
}

// 답변 선택
export function selectAnswer(selected, correct) {
    const feedbackEl = document.getElementById('feedback');
    const isCorrect = selected === correct;
    
    if (isCorrect) {
        currentGameState.correctAnswers++;
        currentGameState.score += currentGameState.currentLevel * 10;
        
        if (feedbackEl) {
            feedbackEl.innerHTML = `<span style="color: green;">✅ 정답!</span>`;
        }
        
        // 동물 획득 시뮬레이션
        if (Math.random() < 0.3) { // 30% 확률로 동물 획득
            const question = currentGameState.questions[currentGameState.currentQuestionIndex];
            if (question.animal) {
                catchAnimal(question.animal);
            }
        }
        
    } else {
        if (feedbackEl) {
            feedbackEl.innerHTML = `<span style="color: red;">❌ 틀렸습니다. 정답: ${correct}</span>`;
        }
    }
    
    // 버튼 비활성화
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct) {
            btn.style.backgroundColor = '#28a745';
            btn.style.color = 'white';
        } else if (btn.textContent === selected && !isCorrect) {
            btn.style.backgroundColor = '#dc3545';
            btn.style.color = 'white';
        }
    });
    
    // 1.5초 후 다음 질문
    setTimeout(() => {
        currentGameState.currentQuestionIndex++;
        loadNextQuestion();
    }, 1500);
    
    updateGameStats();
}

// 동물 획득
function catchAnimal(animal) {
    if (!window.currentUserProfile) return;
    
    // 이미 보유한 동물인지 확인
    const existingAnimal = window.currentUserProfile.collectedAnimals.find(a => a.name === animal.name);
    
    if (!existingAnimal) {
        // 새 동물 추가
        const newAnimal = {
            ...animal,
            caughtAt: new Date().toISOString(),
            level: 1,
            experience: 0
        };
        
        window.currentUserProfile.collectedAnimals.push(newAnimal);
        window.currentUserProfile.speciesCount = window.currentUserProfile.collectedAnimals.length;
        
        // 로컬 스토리지에 저장
        localStorage.setItem(`${window.currentUserProfile.name}_collectedAnimals`, JSON.stringify(window.currentUserProfile.collectedAnimals));
        
        showNewAnimalAlert(newAnimal);
        console.log('새 동물 획득:', newAnimal);
    } else {
        // 기존 동물 경험치 증가
        existingAnimal.experience += 10;
        if (existingAnimal.experience >= 100) {
            existingAnimal.level++;
            existingAnimal.experience = 0;
        }
    }
    
    // UI 업데이트
    if (window.updateAnimalCollection) {
        window.updateAnimalCollection();
    }
}

// 새 동물 알림
function showNewAnimalAlert(animal) {
    const alertHtml = `
        <div class="new-animal-alert" style="
            position: fixed; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); 
            background: white; padding: 30px; 
            border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 3000; text-align: center;
            animation: popIn 0.5s ease-out;
        ">
            <div style="font-size: 4rem; margin-bottom: 15px;">${animal.emoji}</div>
            <h3 style="color: #2C5530; margin-bottom: 10px;">새 동물 획득!</h3>
            <p style="color: #4169E1; font-weight: bold;">${animal.name} (${animal.specialName || animal.name})</p>
            <p style="color: #666;">희귀도: ${animal.rarity}★</p>
        </div>
    `;
    
    const alertEl = document.createElement('div');
    alertEl.innerHTML = alertHtml;
    document.body.appendChild(alertEl);
    
    setTimeout(() => {
        alertEl.remove();
    }, 3000);
}

// 게임 통계 업데이트
function updateGameStats() {
    const scoreEl = document.getElementById('score');
    const levelEl = document.getElementById('level');
    
    if (scoreEl) {
        scoreEl.textContent = currentGameState.score;
    }
    
    if (levelEl) {
        levelEl.textContent = currentGameState.currentLevel;
    }
    
    // 사용자 프로필 업데이트 (로컬 + Firebase)
    if (window.currentUserProfile) {
        window.currentUserProfile.totalScore = currentGameState.score;
        localStorage.setItem(`${window.currentUserProfile.name}_totalScore`, currentGameState.score);
        
        // Firebase 동기화
        if (window.updateGameScore) {
            window.updateGameScore(currentGameState.score);
        }
    }
}

// 게임 UI 업데이트
function updateGameUI() {
    const questionEl = document.getElementById('english-question');
    if (questionEl && currentGameState.questions.length > 0) {
        questionEl.textContent = '게임을 시작하세요! 난이도를 선택하고 문제를 풀어보세요.';
    }
}

// 게임 종료
function endGame() {
    currentGameState.isPlaying = false;
    
    const accuracy = currentGameState.totalQuestions > 0 ? 
        Math.round((currentGameState.correctAnswers / currentGameState.totalQuestions) * 100) : 0;
    
    const feedbackEl = document.getElementById('feedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = `
            <div style="background: #d4edda; padding: 20px; border-radius: 15px; margin: 20px 0;">
                <h3 style="color: #155724;">🎉 게임 완료!</h3>
                <p><strong>총 점수:</strong> ${currentGameState.score}점</p>
                <p><strong>정답률:</strong> ${accuracy}% (${currentGameState.correctAnswers}/${currentGameState.totalQuestions})</p>
                <button onclick="window.startNewGame()" style="
                    background: linear-gradient(45deg, #28a745, #20c997); 
                    color: white; border: none; padding: 10px 20px; 
                    border-radius: 10px; margin-top: 10px; cursor: pointer;
                ">다시 시작</button>
            </div>
        `;
    }
    
    updateGameStats();
    console.log('게임 완료:', currentGameState);
}

// 새 게임 시작
export function startNewGame() {
    currentGameState.currentQuestionIndex = 0;
    currentGameState.correctAnswers = 0;
    currentGameState.score = window.currentUserProfile?.totalScore || 0;
    
    loadQuestionData();
}

// 난이도 변경 시 게임 데이터 재로딩
export function onDifficultyChange(level) {
    currentGameState.currentLevel = level;
    loadQuestionData();
}

// 과목 변경
export function changeSubject(subject) {
    currentGameState.currentSubject = subject;
    loadQuestionData();
}

// 학습 보고서 표시
export function showLearningReport() {
    console.log('학습 보고서 표시');
    alert('학습 보고서 기능이 곧 업데이트됩니다!');
}

// 전역 함수 등록
window.startGame = startGame;
window.startNewGame = startNewGame;
window.selectAnswer = selectAnswer;
window.showLearningReport = showLearningReport;
window.onDifficultyChange = onDifficultyChange;
window.changeSubject = changeSubject;

// 초기화는 동물 데이터가 로드된 후에 수행
console.log('게임 로직 모듈 로드 완료');