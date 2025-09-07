/**
 * 게임 로직 및 학습 시스템 (과목별 구조 복원)
 */

import { 
    loadSubjectData, 
    getCurrentSubjectData, 
    setCurrentSubject, 
    setCurrentLevel,
    getCurrentSubject,
    getCurrentLevel,
    getRandomQuestions,
    normalizeQuestion,
    calculateSubjectScore,
    SUBJECTS 
} from './subject-data.js';

// 게임 상태 관리
let currentGameState = {
    isPlaying: false,
    currentLevel: 1,
    currentSubject: 'math',  // 기본 과목을 수학으로 변경
    currentQuestionIndex: 0,
    questions: [],
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    timer: null,
    startTime: null
};

// 게임 시작 함수
export async function startGame(subject = null, level = null) {
    console.log('🎮 게임 시작:', { subject, level });
    
    // 과목과 레벨 설정
    if (subject) {
        setCurrentSubject(subject);
        currentGameState.currentSubject = subject;
    }
    if (level) {
        setCurrentLevel(level);
        currentGameState.currentLevel = level;
    }
    
    // 데이터 로드
    await loadQuestionData();
    
    if (!currentGameState.questions || currentGameState.questions.length === 0) {
        console.error('❌ 질문 데이터를 로드할 수 없습니다.');
        return false;
    }
    
    // 게임 상태 초기화
    currentGameState.isPlaying = true;
    currentGameState.currentQuestionIndex = 0;
    currentGameState.score = 0;
    currentGameState.correctAnswers = 0;
    currentGameState.startTime = Date.now();
    
    // 첫 번째 문제 로드
    loadNextQuestion();
    
    console.log(`✅ ${SUBJECTS[currentGameState.currentSubject].name} Level ${currentGameState.currentLevel} 게임 시작!`);
    return true;
}

// 질문 데이터 로딩 (과목별 구조)
async function loadQuestionData() {
    try {
        const subject = currentGameState.currentSubject;
        const level = currentGameState.currentLevel;
        
        console.log(`📚 질문 데이터 로딩: ${SUBJECTS[subject].name} Level ${level}`);
        
        // 과목별 데이터 로드
        const rawData = await loadSubjectData(subject, level);
        
        if (!rawData || rawData.length === 0) {
            throw new Error('데이터를 로드할 수 없습니다');
        }
        
        // 랜덤 문제 10개 선택
        const selectedQuestions = getRandomQuestions(subject, level, 10);
        
        // 문제 형식 정규화
        currentGameState.questions = selectedQuestions.map(q => normalizeQuestion(q, subject));
        currentGameState.totalQuestions = currentGameState.questions.length;
        
        console.log(`✅ ${SUBJECTS[subject].name} Level ${level} 데이터 로드 완료: ${currentGameState.questions.length}개 문제`);
        
        // 게임 UI 업데이트
        updateGameUI();
        
        return true;
        
    } catch (error) {
        console.error('❌ 질문 데이터 로딩 실패:', error);
        return false;
    }
}

// 과목별 정답 처리
function checkAnswer(selectedAnswer, question) {
    const subject = currentGameState.currentSubject;
    let isCorrect = false;
    
    switch (subject) {
        case 'english':
            // 영어 과목: 한국어 뜻에 대한 영어 단어 선택
            isCorrect = selectedAnswer === question.english;
            break;
            
        case 'math':
        case 'social':
        case 'general':
            // 나머지 과목: 객관식 문제
            isCorrect = selectedAnswer === question.options[question.answer];
            break;
            
        default:
            isCorrect = false;
    }
    
    return isCorrect;
}
// 과목별 점수 및 성취도 관리
function updateSubjectAchievements() {
    const subject = currentGameState.currentSubject;
    const level = currentGameState.currentLevel;
    const accuracy = currentGameState.totalQuestions > 0 ? 
        (currentGameState.correctAnswers / currentGameState.totalQuestions) : 0;
    
    // 과목별 성취도 저장
    if (window.currentUserProfile) {
        if (!window.currentUserProfile.subjectProgress) {
            window.currentUserProfile.subjectProgress = {};
        }
        
        if (!window.currentUserProfile.subjectProgress[subject]) {
            window.currentUserProfile.subjectProgress[subject] = {};
        }
        
        // 최고 점수 업데이트
        const currentBest = window.currentUserProfile.subjectProgress[subject][`level${level}`] || 0;
        const newScore = calculateSubjectScore(subject, level, currentGameState.correctAnswers, currentGameState.totalQuestions);
        
        if (newScore > currentBest) {
            window.currentUserProfile.subjectProgress[subject][`level${level}`] = newScore;
            console.log(`🏆 ${SUBJECTS[subject].name} Level ${level} 최고 기록 달성: ${newScore}점!`);
        }
        
        // 로컬 저장
        localStorage.setItem(`${window.currentUserProfile.name}_subjectProgress`, 
            JSON.stringify(window.currentUserProfile.subjectProgress));
    }
}

// 다음 질문 로드
function loadNextQuestion() {
    if (currentGameState.currentQuestionIndex >= currentGameState.questions.length) {
        endGame();
        return;
    }
    
    const question = currentGameState.questions[currentGameState.currentQuestionIndex];
    displayQuestion(question);
    
    // 진행도 업데이트
    updateProgressBar();
}

// 진행도 바 업데이트
function updateProgressBar() {
    const progressEl = document.getElementById('progress-bar');
    if (progressEl) {
        const progress = (currentGameState.currentQuestionIndex / currentGameState.totalQuestions) * 100;
        progressEl.style.width = `${progress}%`;
    }
    
    const progressTextEl = document.getElementById('progress-text');
    if (progressTextEl) {
        progressTextEl.textContent = `${currentGameState.currentQuestionIndex + 1} / ${currentGameState.totalQuestions}`;
    }
}

// 질문 표시 (과목별 대응)
function displayQuestion(question) {
    const questionEl = document.getElementById('english-question');
    const optionsEl = document.getElementById('english-options');
    const feedbackEl = document.getElementById('feedback');
    const subject = currentGameState.currentSubject;
    
    if (questionEl) {
        // 과목별 질문 텍스트 설정
        if (subject === 'english') {
            questionEl.textContent = question.korean || question.questionText;
        } else {
            questionEl.textContent = question.question || question.questionText;
        }
    }
    
    if (optionsEl) {
        optionsEl.innerHTML = '';
        
        if (question.options && Array.isArray(question.options)) {
            question.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                button.textContent = option;
                button.onclick = () => selectAnswer(option, question);
                optionsEl.appendChild(button);
            });
        }
    }
    
    if (feedbackEl) {
        feedbackEl.textContent = '';
    }
    
    // 과목 아이콘 표시
    const subjectIconEl = document.getElementById('current-subject-icon');
    if (subjectIconEl) {
        subjectIconEl.textContent = `${SUBJECTS[subject].icon} ${SUBJECTS[subject].name}`;
    }
    
    console.log(`📝 ${SUBJECTS[subject].name} 문제 표시:`, question.question || question.korean);
}

// 답변 선택 (과목별 처리)
export function selectAnswer(selectedAnswer, question) {
    const feedbackEl = document.getElementById('feedback');
    const isCorrect = checkAnswer(selectedAnswer, question);
    const subject = currentGameState.currentSubject;
    
    // 정답 확인 및 점수 계산
    if (isCorrect) {
        currentGameState.correctAnswers++;
        const points = calculateQuestionPoints(subject, currentGameState.currentLevel);
        currentGameState.score += points;
        
        if (feedbackEl) {
            let correctText = '';
            if (subject === 'english') {
                correctText = question.english;
            } else {
                correctText = question.options[question.answer];
            }
            
            feedbackEl.innerHTML = `<span style="color: green;">✅ 정답! (+${points}점)</span>`;
            
            // 설명이 있으면 표시
            if (question.explanation) {
                feedbackEl.innerHTML += `<div style="margin-top: 10px; font-size: 0.9rem; color: #666;">${question.explanation}</div>`;
            }
        }
        
    } else {
        if (feedbackEl) {
            let correctText = '';
            if (subject === 'english') {
                correctText = question.english;
            } else {
                correctText = question.options[question.answer];
            }
            
            feedbackEl.innerHTML = `<span style="color: red;">❌ 틀렸습니다.</span>`;
            feedbackEl.innerHTML += `<div style="color: #28a745; margin-top: 5px;">정답: <strong>${correctText}</strong></div>`;
            
            // 설명이 있으면 표시
            if (question.explanation) {
                feedbackEl.innerHTML += `<div style="margin-top: 10px; font-size: 0.9rem; color: #666;">${question.explanation}</div>`;
            }
        }
    }
    
    // 버튼 상태 업데이트
    updateAnswerButtons(selectedAnswer, question);
    
    // 1.5초 후 다음 질문
    setTimeout(() => {
        currentGameState.currentQuestionIndex++;
        loadNextQuestion();
    }, 2000); // 설명을 읽을 시간을 위해 2초로 연장
    
    updateGameStats();
}

// 과목별 문제당 점수 계산
function calculateQuestionPoints(subject, level) {
    const basePoints = {
        'math': 15,
        'english': 10,
        'social': 12,
        'general': 12
    };
    
    const levelMultiplier = { 1: 1.0, 2: 1.5, 3: 2.0 };
    
    return Math.round(basePoints[subject] * levelMultiplier[level]);
}

// 답변 버튼 상태 업데이트
function updateAnswerButtons(selectedAnswer, question) {
    const subject = currentGameState.currentSubject;
    let correctAnswer = '';
    
    if (subject === 'english') {
        correctAnswer = question.english;
    } else {
        correctAnswer = question.options[question.answer];
    }
    
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        
        if (btn.textContent === correctAnswer) {
            btn.style.backgroundColor = '#28a745';
            btn.style.color = 'white';
            btn.style.border = '2px solid #1e7e34';
        } else if (btn.textContent === selectedAnswer && selectedAnswer !== correctAnswer) {
            btn.style.backgroundColor = '#dc3545';
            btn.style.color = 'white';
            btn.style.border = '2px solid #c82333';
        }
    });
}

// 성취도 뱃지 표시
function showAchievementBadge(achievement) {
    const alertHtml = `
        <div class="achievement-alert" style="
            position: fixed; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 30px; 
            border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 3000; text-align: center;
            animation: popIn 0.5s ease-out;
        ">
            <div style="font-size: 3rem; margin-bottom: 15px;">${achievement.icon}</div>
            <h3 style="margin-bottom: 10px;">🎉 성취도 달성!</h3>
            <p style="font-weight: bold; font-size: 1.1rem;">${achievement.title}</p>
            <p style="font-size: 0.9rem; opacity: 0.9;">${achievement.description}</p>
        </div>
    `;
    
    const alertEl = document.createElement('div');
    alertEl.innerHTML = alertHtml;
    document.body.appendChild(alertEl);
    
    setTimeout(() => {
        alertEl.remove();
    }, 3000);
}

// 성취도 확인
function checkAchievements() {
    const subject = currentGameState.currentSubject;
    const level = currentGameState.currentLevel;
    const accuracy = currentGameState.totalQuestions > 0 ? 
        (currentGameState.correctAnswers / currentGameState.totalQuestions) : 0;
    
    // 만점 성취도
    if (accuracy === 1.0) {
        showAchievementBadge({
            icon: '🏆',
            title: '완벽한 점수!',
            description: `${SUBJECTS[subject].name} Level ${level} 만점 달성`
        });
    }
    
    // 높은 정확도 성취도
    else if (accuracy >= 0.8) {
        showAchievementBadge({
            icon: '🌟',
            title: '우수한 성과!',
            description: `${SUBJECTS[subject].name} Level ${level}에서 ${Math.round(accuracy * 100)}% 달성`
        });
    }
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
    
    const subject = currentGameState.currentSubject;
    const level = currentGameState.currentLevel;
    const accuracy = currentGameState.totalQuestions > 0 ? 
        Math.round((currentGameState.correctAnswers / currentGameState.totalQuestions) * 100) : 0;
    
    // 과목별 점수 계산
    const finalScore = calculateSubjectScore(subject, level, currentGameState.correctAnswers, currentGameState.totalQuestions);
    
    // 성취도 업데이트
    updateSubjectAchievements();
    
    // 성취도 확인
    checkAchievements();
    
    // 게임 시간 계산
    const gameTime = currentGameState.startTime ? 
        Math.round((Date.now() - currentGameState.startTime) / 1000) : 0;
    
    const feedbackEl = document.getElementById('feedback');
    if (feedbackEl) {
        feedbackEl.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 20px; margin: 20px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <h3 style="margin-bottom: 15px;">🎊 ${SUBJECTS[subject].name} Level ${level} 완료!</h3>
                
                <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>📊 총 점수:</span>
                        <strong>${currentGameState.score}점</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>🎯 정답률:</span>
                        <strong>${accuracy}% (${currentGameState.correctAnswers}/${currentGameState.totalQuestions})</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>⏱️ 소요시간:</span>
                        <strong>${Math.floor(gameTime / 60)}분 ${gameTime % 60}초</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>🏆 과목 점수:</span>
                        <strong>${finalScore}점</strong>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <button onclick="window.startNewGame('${subject}', ${level})" style="
                        background: linear-gradient(45deg, #28a745, #20c997); 
                        color: white; border: none; padding: 12px 20px; 
                        border-radius: 10px; margin: 5px; cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">🔄 다시 도전</button>
                    
                    <button onclick="window.showSubjectSelection()" style="
                        background: linear-gradient(45deg, #4169E1, #1E90FF); 
                        color: white; border: none; padding: 12px 20px; 
                        border-radius: 10px; margin: 5px; cursor: pointer;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    ">📚 다른 과목</button>
                </div>
            </div>
        `;
    }
    
    updateGameStats();
    
    // Firebase에 결과 저장
    if (window.updateGameScore) {
        window.updateGameScore(currentGameState.score);
    }
    
    console.log(`🎮 ${SUBJECTS[subject].name} Level ${level} 게임 완료:`, {
        score: currentGameState.score,
        finalScore: finalScore,
        accuracy: accuracy,
        time: gameTime
    });
}

// 새 게임 시작 (과목별)
export function startNewGame(subject = null, level = null) {
    console.log('🔄 새 게임 시작:', { subject, level });
    
    // 게임 상태 초기화
    currentGameState.currentQuestionIndex = 0;
    currentGameState.correctAnswers = 0;
    currentGameState.score = 0; // 새 게임이므로 0에서 시작
    currentGameState.isPlaying = false;
    
    // 과목과 레벨이 지정되면 바로 시작
    if (subject && level) {
        startGame(subject, level);
    } else {
        // 기존 설정으로 다시 시작
        startGame(currentGameState.currentSubject, currentGameState.currentLevel);
    }
}

// 난이도 변경 시 게임 데이터 재로딩
export function onDifficultyChange(level) {
    console.log(`📊 난이도 변경: Level ${level}`);
    currentGameState.currentLevel = level;
    setCurrentLevel(level);
    
    // 게임이 진행 중이 아닐 때만 데이터 로드
    if (!currentGameState.isPlaying) {
        loadQuestionData();
    }
}

// 과목 변경
export function changeSubject(subject) {
    console.log(`📚 과목 변경: ${SUBJECTS[subject]?.name || subject}`);
    
    if (SUBJECTS[subject]) {
        currentGameState.currentSubject = subject;
        setCurrentSubject(subject);
        
        // 게임이 진행 중이 아닐 때만 데이터 로드
        if (!currentGameState.isPlaying) {
            loadQuestionData();
        }
    }
}

// 과목 선택 UI 표시
export function showSubjectSelection() {
    console.log('📚 과목 선택 화면 표시');
    
    // UI 업데이트는 navigation.js에서 처리
    if (window.showPage) {
        window.showPage('game');
    }
}

// 학습 보고서 표시
export function showLearningReport() {
    console.log('학습 보고서 표시');
    alert('학습 보고서 기능이 곧 업데이트됩니다!');
}

// 전역 함수 등록 (과목별 구조)
window.startGame = startGame;
window.startNewGame = startNewGame;
window.selectAnswer = selectAnswer;
window.showLearningReport = showLearningReport;
window.onDifficultyChange = onDifficultyChange;
window.changeSubject = changeSubject;
window.showSubjectSelection = showSubjectSelection;

// 과목별 게임 상태 접근 함수들
window.getCurrentGameState = () => currentGameState;
window.getSubjectProgress = () => {
    if (window.currentUserProfile && window.currentUserProfile.subjectProgress) {
        return window.currentUserProfile.subjectProgress;
    }
    return {};
};

console.log('🎮 과목별 게임 로직 모듈 로드 완료');