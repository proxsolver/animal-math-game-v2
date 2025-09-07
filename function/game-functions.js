// ==================== 메인 게임 함수들 ====================

// 알림 시스템 관련 함수
async function createNotification(recipientName, type, message, animalData = null) {
    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const notificationsRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/notifications");
        
        const notificationData = {
            recipient: recipientName,
            type: type,
            message: message,
            animalData: animalData,
            createdAt: new Date().toISOString(),
            read: false
        };
        
        await window.firebase.setDoc(window.firebase.doc(notificationsRef, `${recipientName}_${Date.now()}`), notificationData);
        console.log(`알림 생성 완료: ${recipientName}에게 ${type} 알림`);
        
    } catch (error) {
        console.error('알림 생성 오류:', error);
    }
}

// 사용자 알림 로드
async function loadNotifications(userName) {
    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const notificationsRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/notifications");
        const querySnapshot = await window.firebase.getDocs(notificationsRef);
        
        const userNotifications = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.recipient === userName && !data.read) {
                userNotifications.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        // 최신순 정렬
        userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return userNotifications;
        
    } catch (error) {
        console.error('알림 로드 오류:', error);
        return [];
    }
}

// 알림 읽음 처리
window.markNotificationAsRead = async function(notificationId) {
    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const notificationRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/notifications", notificationId);
        
        await window.firebase.setDoc(notificationRef, { read: true }, { merge: true });
        
    } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
    }
}

// 과목 변경
function changeSubject() {
    const selectElement = document.getElementById('subject-select');
    const newSubject = selectElement.value;
    
    if (newSubject !== window.gameState.currentSubject) {
        // 현재 과목 데이터 저장
        saveCurrentSubjectProgress();
        
        // 새 과목으로 변경
        window.gameState.currentSubject = newSubject;
        
        // 새 과목 데이터 로드
        loadCurrentSubjectProgress();
        
        // UI 업데이트
        updateSubjectUI();
        
        // 새 문제 생성
        setTimeout(() => {
            generatePersonalizedQuiz();
        }, 500);
        
        console.log(`과목이 ${newSubject}로 변경되었습니다.`);
    }
}

// 현재 과목 진행도 저장
function saveCurrentSubjectProgress() {
    const currentSubject = window.gameState.currentSubject;
    if (!window.gameState.subjects[currentSubject]) {
        window.gameState.subjects[currentSubject] = {
            progress: {},
            level: 1,
            score: 0,
            currentDifficulty: 1,
            totalCorrect: 0,
            totalIncorrect: 0
        };
    }
    
    // 현재 학습 진행도를 과목별로 저장
    window.gameState.subjects[currentSubject].progress = { ...window.userProgress };
    window.gameState.subjects[currentSubject].currentDifficulty = window.currentDifficulty;
    
    console.log(`${currentSubject} 과목 진행도 저장됨:`, window.gameState.subjects[currentSubject]);
}

// 현재 과목 진행도 로드
function loadCurrentSubjectProgress() {
    const currentSubject = window.gameState.currentSubject;
    
    // 과목 데이터가 없으면 초기화
    if (!window.gameState.subjects[currentSubject]) {
        window.gameState.subjects[currentSubject] = {
            progress: {},
            level: 1,
            score: 0,
            currentDifficulty: 1,
            totalCorrect: 0,
            totalIncorrect: 0
        };
    }
    
    // 과목별 진행도 로드
    window.userProgress = { ...window.gameState.subjects[currentSubject].progress };
    window.currentDifficulty = window.gameState.subjects[currentSubject].currentDifficulty || 1;
    
    console.log(`${currentSubject} 과목 진행도 로드됨:`, window.gameState.subjects[currentSubject]);
}

// 과목별 UI 업데이트
function updateSubjectUI() {
    const currentSubject = window.gameState.currentSubject;
    const subjectData = window.gameState.subjects[currentSubject];
    
    // 과목 이름 표시
    const gameTitle = document.querySelector('#game-page h2');
    if (gameTitle) {
        const subjectNames = {
            'english': '영어 학습 🇬🇧',
            'social': '사회 학습 🏛️'
        };
        gameTitle.textContent = subjectNames[currentSubject] || '학습 게임';
    }
    
    // 과목별 통계 업데이트
    if (subjectData) {
        document.getElementById('word-correct').textContent = subjectData.totalCorrect || 0;
        document.getElementById('word-incorrect').textContent = subjectData.totalIncorrect || 0;
        
        const total = (subjectData.totalCorrect || 0) + (subjectData.totalIncorrect || 0);
        const accuracy = total > 0 ? Math.round(((subjectData.totalCorrect || 0) / total) * 100) : 0;
        document.getElementById('word-accuracy').textContent = accuracy;
    }
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

// 매일 로그인 체크 및 보상
function checkDailyLoginReward() {
    const today = getTodayString();
    const lastLogin = window.gameState.dailyRewards.lastLoginDate;
    
    // 오늘 이미 보상을 받았다면 리턴
    if (window.gameState.dailyRewards.hasClaimedToday && lastLogin === today) {
        return;
    }
    
    // 연속 로그인 계산
    if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const todayDate = new Date(today);
        const dayDiff = Math.floor((todayDate - lastLoginDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
            // 연속 로그인
            window.gameState.dailyRewards.consecutiveDays++;
        } else if (dayDiff > 1) {
            // 연속성 끊김
            window.gameState.dailyRewards.consecutiveDays = 1;
        } else if (dayDiff === 0 && window.gameState.dailyRewards.hasClaimedToday) {
            // 같은 날 재접속
            return;
        }
    } else {
        // 첫 로그인
        window.gameState.dailyRewards.consecutiveDays = 1;
    }
    
    // 로그인 정보 업데이트
    window.gameState.dailyRewards.lastLoginDate = today;
    window.gameState.dailyRewards.hasClaimedToday = true;
    window.gameState.dailyRewards.totalDaysLogged++;
    
    // 보상 지급
    showDailyRewardModal();
}

// ==================== 일일 미션 시스템 ====================

// 일일 미션 초기화
function initializeDailyMissions() {
    const today = getTodayString();
    if (window.gameState.dailyMissions.date !== today) {
        // 새로운 날이면 미션 리셋
        resetDailyMissions(today);
    }
    updateMissionUI();
}

// 일일 미션 리셋
function resetDailyMissions(today) {
    const subjects = ['english', 'social', 'math', 'general'];
    
    window.gameState.dailyMissions.date = today;
    
    subjects.forEach(subject => {
        window.gameState.dailyMissions[subject] = {
            targetQuestions: 10,
            solvedQuestions: 0,
            completed: false,
            stamps: Array(10).fill(false) // 10개의 도장
        };
    });
    
    console.log(`일일 미션이 ${today}로 리셋되었습니다.`);
}

// 미션 진행도 업데이트
function updateMissionProgress(subject) {
    const mission = window.gameState.dailyMissions[subject];
    if (mission.completed) return;
    
    mission.solvedQuestions++;
    mission.stamps[mission.solvedQuestions - 1] = true;
    
    if (mission.solvedQuestions >= mission.targetQuestions) {
        mission.completed = true;
        showMissionCompleteNotification(subject);
        giveCompletionReward(subject);
    }
    
    updateMissionUI();
    saveCurrentUserData();
}

// 미션 완료 알림
function showMissionCompleteNotification(subject) {
    const subjectNames = {
        english: '영어',
        social: '사회', 
        math: '수학',
        general: '상식'
    };
    
    showNotification(`🎉 ${subjectNames[subject]} 미션 완료!`, 'success');
    
    // 완료 효과 표시
    const missionCard = document.querySelector(`[data-subject="${subject}"]`);
    if (missionCard) {
        missionCard.classList.add('completed');
        const statusEl = missionCard.querySelector('.mission-status');
        statusEl.textContent = '완료 ✅';
        statusEl.classList.add('completed');
    }
}

// 미션 완료 보상
function giveCompletionReward(subject) {
    const rewardCoins = 100;
    window.gameState.coins += rewardCoins;
    showNotification(`미션 완료 보상: ${rewardCoins} 코인! 🪙`, 'success');
    updateGameStats();
}

// 미션 UI 업데이트
function updateMissionUI() {
    const subjects = ['english', 'social', 'math', 'general'];
    
    subjects.forEach(subject => {
        const mission = window.gameState.dailyMissions[subject];
        
        // 진행도 텍스트 업데이트
        const progressEl = document.getElementById(`${subject}-progress`);
        if (progressEl) progressEl.textContent = mission.solvedQuestions;
        
        // 진행도 바 업데이트
        const progressBar = document.getElementById(`${subject}-progress-bar`);
        if (progressBar) {
            const percentage = (mission.solvedQuestions / mission.targetQuestions) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        // 도장 업데이트
        updateStamps(subject);
        
        // 상태 업데이트
        const statusEl = document.getElementById(`${subject}-status`);
        if (statusEl) {
            if (mission.completed) {
                statusEl.textContent = '완료 ✅';
                statusEl.classList.add('completed');
                
                // 시작하기 버튼 텍스트도 업데이트
                const missionCard = document.querySelector(`[data-subject="${subject}"]`);
                if (missionCard) {
                    const startBtn = missionCard.querySelector('.mission-start-btn');
                    if (startBtn) {
                        startBtn.textContent = '자유 학습';
                        startBtn.style.background = 'linear-gradient(135deg, #32CD32, #228B22)';
                    }
                }
            } else {
                statusEl.textContent = '미완료';
                statusEl.classList.remove('completed');
                
                // 시작하기 버튼 원상복구
                const missionCard = document.querySelector(`[data-subject="${subject}"]`);
                if (missionCard) {
                    const startBtn = missionCard.querySelector('.mission-start-btn');
                    if (startBtn) {
                        startBtn.textContent = '시작하기';
                        startBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    }
                }
            }
        }
        
        // 미션 카드 상태 업데이트
        const missionCard = document.querySelector(`[data-subject="${subject}"]`);
        if (missionCard) {
            if (mission.completed) {
                missionCard.classList.add('completed');
            } else {
                missionCard.classList.remove('completed');
            }
        }
    });
    
    // 전체 요약 업데이트
    updateDailySummary();
}

// 도장 UI 업데이트
function updateStamps(subject) {
    const stampsContainer = document.getElementById(`${subject}-stamps`);
    if (!stampsContainer) return;
    
    const mission = window.gameState.dailyMissions[subject];
    stampsContainer.innerHTML = '';
    
    for (let i = 0; i < mission.targetQuestions; i++) {
        const stamp = document.createElement('div');
        stamp.className = 'stamp';
        stamp.textContent = mission.stamps[i] ? '✓' : (i + 1);
        
        if (mission.stamps[i]) {
            stamp.classList.add('completed');
        }
        
        stampsContainer.appendChild(stamp);
    }
}

// 일일 요약 업데이트
function updateDailySummary() {
    const subjects = ['english', 'social', 'math', 'general'];
    let completedSubjects = 0;
    let totalQuestions = 0;
    
    subjects.forEach(subject => {
        const mission = window.gameState.dailyMissions[subject];
        if (mission.completed) completedSubjects++;
        totalQuestions += mission.solvedQuestions;
    });
    
    // 완료한 과목 수 업데이트
    const completedEl = document.getElementById('completed-subjects');
    if (completedEl) completedEl.textContent = `${completedSubjects} / 4`;
    
    // 총 문제 수 업데이트
    const totalQuestionsEl = document.getElementById('total-questions');
    if (totalQuestionsEl) totalQuestionsEl.textContent = `${totalQuestions} / 40`;
    
    // 오늘 획득한 코인 (추정)
    const earnedCoinsEl = document.getElementById('earned-coins-today');
    if (earnedCoinsEl) {
        const estimatedCoins = (totalQuestions * 10) + (completedSubjects * 100);
        earnedCoinsEl.textContent = `${estimatedCoins} 🪙`;
    }
}

// ==================== 학습 타이머 시스템 ====================

let studyTimerInterval = null;

// 학습 타이머 시작
function startStudyTimer() {
    const now = Date.now();
    window.gameState.studyTimer.sessionStartTime = now;
    
    // 타이머가 이미 실행 중이면 중지
    if (studyTimerInterval) {
        clearInterval(studyTimerInterval);
    }
    
    // 매초마다 타이머 업데이트
    studyTimerInterval = setInterval(() => {
        updateStudyTimerDisplay();
        checkBonusEligibility();
    }, 1000);
    
    console.log('학습 타이머가 시작되었습니다.');
}

// 학습 타이머 중지
function stopStudyTimer() {
    if (studyTimerInterval) {
        clearInterval(studyTimerInterval);
        studyTimerInterval = null;
    }
    
    // 총 학습 시간 업데이트
    if (window.gameState.studyTimer.sessionStartTime) {
        const sessionTime = (Date.now() - window.gameState.studyTimer.sessionStartTime) / (1000 * 60); // 분 단위
        window.gameState.studyTimer.totalStudyTime += sessionTime;
        window.gameState.studyTimer.sessionStartTime = null;
    }
    
    console.log('학습 타이머가 중지되었습니다.');
}

// 타이머 표시 업데이트
function updateStudyTimerDisplay() {
    if (!window.gameState.studyTimer.sessionStartTime) return;
    
    const currentSessionTime = (Date.now() - window.gameState.studyTimer.sessionStartTime) / (1000 * 60); // 분 단위
    const totalTime = window.gameState.studyTimer.totalStudyTime + currentSessionTime;
    
    const hours = Math.floor(totalTime / 60);
    const minutes = Math.floor(totalTime % 60);
    
    const timerEl = document.getElementById('study-timer');
    if (timerEl) {
        timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    updateNextBonusInfo(totalTime);
}

// 다음 보너스 정보 업데이트
function updateNextBonusInfo(totalTime) {
    const bonusLevels = window.gameState.studyTimer.bonusLevels;
    const bonusCoins = window.gameState.studyTimer.bonusCoins;
    const receivedBonuses = window.gameState.studyTimer.receivedBonuses;
    
    let nextBonusIndex = -1;
    for (let i = 0; i < bonusLevels.length; i++) {
        if (!receivedBonuses.includes(bonusLevels[i])) {
            nextBonusIndex = i;
            break;
        }
    }
    
    const nextBonusTimeEl = document.getElementById('next-bonus-time');
    const nextBonusCoinsEl = document.getElementById('next-bonus-coins');
    
    if (nextBonusIndex !== -1) {
        const timeLeft = bonusLevels[nextBonusIndex] - totalTime;
        if (timeLeft > 0) {
            nextBonusTimeEl.textContent = `${Math.ceil(timeLeft)}분`;
            nextBonusCoinsEl.textContent = bonusCoins[nextBonusIndex];
        } else {
            nextBonusTimeEl.textContent = '보너스 준비됨!';
        }
    } else {
        nextBonusTimeEl.textContent = '모든 보너스 완료!';
        nextBonusCoinsEl.textContent = '0';
    }
}

// 보너스 자격 확인 및 지급
function checkBonusEligibility() {
    if (!window.gameState.studyTimer.sessionStartTime) return;
    
    const currentSessionTime = (Date.now() - window.gameState.studyTimer.sessionStartTime) / (1000 * 60);
    const totalTime = window.gameState.studyTimer.totalStudyTime + currentSessionTime;
    
    const bonusLevels = window.gameState.studyTimer.bonusLevels;
    const bonusCoins = window.gameState.studyTimer.bonusCoins;
    const receivedBonuses = window.gameState.studyTimer.receivedBonuses;
    
    bonusLevels.forEach((level, index) => {
        if (totalTime >= level && !receivedBonuses.includes(level)) {
            giveBonusReward(level, bonusCoins[index]);
            receivedBonuses.push(level);
            updateBonusIndicators();
        }
    });
}

// 보너스 보상 지급
function giveBonusReward(minutes, coins) {
    window.gameState.coins += coins;
    showNotification(`🎉 ${minutes}분 학습 보너스! +${coins} 코인! 🪙`, 'success');
    updateGameStats();
    saveCurrentUserData();
}

// 보너스 인디케이터 업데이트
function updateBonusIndicators() {
    const receivedBonuses = window.gameState.studyTimer.receivedBonuses;
    
    [15, 30, 60].forEach(time => {
        const indicator = document.getElementById(`bonus-${time}`);
        if (indicator) {
            if (receivedBonuses.includes(time)) {
                indicator.textContent = '✅';
                indicator.classList.add('completed');
            } else {
                indicator.textContent = '⭕';
                indicator.classList.remove('completed');
            }
        }
    });
}

// 일일 타이머 리셋 확인
function checkDailyTimerReset() {
    const today = getTodayString();
    if (window.gameState.studyTimer.lastResetDate !== today) {
        resetDailyTimer(today);
    }
}

// 일일 타이머 리셋
function resetDailyTimer(today) {
    window.gameState.studyTimer.totalStudyTime = 0;
    window.gameState.studyTimer.receivedBonuses = [];
    window.gameState.studyTimer.lastResetDate = today;
    
    updateBonusIndicators();
    console.log(`학습 타이머가 ${today}로 리셋되었습니다.`);
}

// 자유 학습 모드 활성화
function enableFreeStudyMode() {
    window.gameState.freeStudyMode = true;
    
    // 퀴즈 제목 업데이트
    const titleEl = document.getElementById('quiz-subject-title');
    if (titleEl) {
        const currentTitle = titleEl.textContent;
        titleEl.textContent = currentTitle + ' (자유 학습 모드)';
    }
    
    // 진행도 표시 업데이트
    const currentProgressEl = document.getElementById('quiz-current-progress');
    const targetProgressEl = document.getElementById('quiz-target-progress');
    
    if (currentProgressEl) currentProgressEl.textContent = '완료';
    if (targetProgressEl) targetProgressEl.textContent = '∞';
    
    // 자유 학습 안내 표시
    const feedbackElement = document.getElementById('quiz-feedback') || document.getElementById('feedback');
    if (feedbackElement) {
        feedbackElement.textContent = '🌟 자유 학습 모드입니다! 원하는 만큼 계속 공부하세요!';
        feedbackElement.className = 'feedback success';
    }
    
    console.log('자유 학습 모드 활성화');
    
    // 새로운 문제 생성
    setTimeout(() => {
        if (typeof window.generatePersonalizedQuiz === 'function') {
            window.generatePersonalizedQuiz();
        }
    }, 1000);
}

// 미션 시작 함수
function startMission(subject) {
    console.log(`미션 시작: ${subject}`);
    
    // 자유 학습 모드 초기화
    window.gameState.freeStudyMode = false;
    
    // 퀴즈 페이지로 이동하고 해당 과목 설정
    window.gameState.currentSubject = subject;
    
    // 과목별 제목 설정
    const titles = {
        english: '🇬🇧 영어 퀴즈',
        social: '🏛️ 사회 퀴즈', 
        math: '🔢 수학 퀴즈',
        general: '🧠 상식 퀴즈'
    };
    
    const titleEl = document.getElementById('quiz-subject-title');
    if (titleEl) titleEl.textContent = titles[subject];
    
    // 진행도 정보 업데이트
    const mission = window.gameState.dailyMissions[subject];
    const currentProgressEl = document.getElementById('quiz-current-progress');
    const targetProgressEl = document.getElementById('quiz-target-progress');
    
    if (currentProgressEl) currentProgressEl.textContent = mission.solvedQuestions;
    if (targetProgressEl) targetProgressEl.textContent = mission.targetQuestions;
    
    // 과목 선택 UI 업데이트
    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) subjectSelect.value = subject;
    
    // 퀴즈 페이지 표시
    showPage('quiz', null);
    
    // 학습 타이머 시작 (아직 시작되지 않았다면)
    if (!studyTimerInterval && !window.gameState.studyTimer.sessionStartTime) {
        startStudyTimer();
    }
    
    // 첫 번째 문제 생성
    console.log(`${subject} 과목의 첫 문제 생성 시작`);
    setTimeout(() => {
        try {
            // 현재 난이도를 1로 설정
            window.currentDifficulty = 1;
            
            // 과목별 선택 UI 업데이트
            window.changeSubject();
            
            // 첫 번째 문제 생성
            if (typeof window.generatePersonalizedQuiz === 'function') {
                window.generatePersonalizedQuiz();
            } else {
                console.error('generatePersonalizedQuiz 함수를 찾을 수 없습니다');
            }
        } catch (error) {
            console.error('문제 생성 중 오류:', error);
        }
    }, 500);
}

// 전역에서 접근 가능하도록 함수들을 window에 등록
window.createNotification = createNotification;
window.loadNotifications = loadNotifications;
window.changeSubject = changeSubject;
window.saveCurrentSubjectProgress = saveCurrentSubjectProgress;
window.loadCurrentSubjectProgress = loadCurrentSubjectProgress;
window.updateSubjectUI = updateSubjectUI;
window.getTodayString = getTodayString;
window.checkDailyLoginReward = checkDailyLoginReward;

// 새로 추가된 함수들
window.initializeDailyMissions = initializeDailyMissions;
window.updateMissionProgress = updateMissionProgress;
window.updateMissionUI = updateMissionUI;
window.startStudyTimer = startStudyTimer;
window.stopStudyTimer = stopStudyTimer;
window.updateStudyTimerDisplay = updateStudyTimerDisplay;
window.checkBonusEligibility = checkBonusEligibility;
window.checkDailyTimerReset = checkDailyTimerReset;
window.startMission = startMission;
window.enableFreeStudyMode = enableFreeStudyMode;