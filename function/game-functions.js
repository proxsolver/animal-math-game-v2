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
async function updateMissionProgress(subject) {
    const mission = window.gameState.dailyMissions[subject];
    if (mission.completed) return; // 이미 완료된 미션이면 실행하지 않음

    mission.solvedQuestions++;
    mission.stamps[mission.solvedQuestions - 1] = true;

    // 대시보드의 미션 UI를 실시간으로 업데이트
    updateMissionUI();
    
    // 퀴즈 페이지의 실시간 진행도도 업데이트
    updateQuizProgressDisplay(subject);

    // 미션 완료 조건 체크
    if (mission.solvedQuestions >= mission.targetQuestions) {
        mission.completed = true;
        
        console.log(`%c[MISSION] ${subject} 미션 완료!`, 'color: #2a9d8f; font-weight: bold;');
        
        // 1. 미션 완료 시각적 알림 표시
        showMissionCompleteNotification(subject);
        
        // 2. 보상 지급 및 UI 업데이트 (수정된 함수 호출)
        giveCompletionReward(subject);
        
        // 3. 모든 상태 변경이 끝난 후, 최종 데이터를 Firebase에 저장
        console.log('[MISSION] 모든 상태 업데이트 완료, Firebase 저장을 시작합니다.');
        await saveCurrentUserData(); // 이전 답변에서 제안한 강화된 저장 함수
    }
}


// 퀴즈 페이지의 진행도 실시간 업데이트
function updateQuizProgressDisplay(subject) {
    // 현재 퀴즈 페이지에서 해당 과목을 학습 중인 경우에만 업데이트
    if (window.gameState.currentSubject === subject) {
        const mission = window.gameState.dailyMissions[subject];
        
        // 퀴즈 페이지의 진행도 텍스트 업데이트
        const currentProgressEl = document.getElementById('quiz-current-progress');
        if (currentProgressEl && !window.gameState.freeStudyMode) {
            currentProgressEl.textContent = mission.solvedQuestions;
            
            // 진행도 애니메이션 효과
            currentProgressEl.style.transform = 'scale(1.2)';
            currentProgressEl.style.color = '#4CAF50';
            setTimeout(() => {
                currentProgressEl.style.transform = 'scale(1)';
                currentProgressEl.style.color = '';
            }, 500);
        }
        
        // 진행률 바 업데이트 (있다면)
        const progressBar = document.getElementById('quiz-progress-bar');
        if (progressBar && !window.gameState.freeStudyMode) {
            const percentage = (mission.solvedQuestions / mission.targetQuestions) * 100;
            progressBar.style.width = `${percentage}%`;
            
            // 진행률 바 애니메이션
            progressBar.style.transition = 'width 0.5s ease-in-out';
        }
        
        // 완료 시 특별 효과
        if (mission.completed) {
            const titleEl = document.getElementById('quiz-subject-title');
            if (titleEl) {
                const originalText = titleEl.textContent;
                titleEl.textContent = '🎉 미션 완료! 축하합니다!';
                titleEl.style.color = '#FF6B35';
                
                setTimeout(() => {
                    titleEl.textContent = originalText;
                    titleEl.style.color = '';
                }, 3000);
            }
        }
    }
}

// 간단한 알림 표시 함수
function showNotification(message, type = 'info') {
    console.log(`[알림] ${message}`);
    
    // 화면에 간단한 토스트 알림 표시
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        font-weight: bold;
        transition: all 0.3s ease;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3초 후 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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

// 게임 통계 업데이트 함수
function updateGameStats() {
    // 코인 표시 업데이트
    const coinsEl = document.getElementById('coins-display');
    if (coinsEl) {
        coinsEl.textContent = window.gameState.coins;
    }
    
    // 레벨 표시 업데이트  
    const levelEl = document.getElementById('level-display');
    if (levelEl) {
        levelEl.textContent = window.gameState.level;
    }
    
    console.log('[게임 통계] 코인:', window.gameState.coins, '레벨:', window.gameState.level);
}

// 미션 완료 보상
function giveCompletionReward(subject) {
    const rewardCoins = 100; // 미션 완료 보상 코인
    window.gameState.coins += rewardCoins;
    
    console.log(`%c[REWARD] 미션 완료 보상! +${rewardCoins} 코인 🪙`, 'color: #fca311; font-weight: bold;');
    
    // 알림 표시
    showNotification(`미션 완료 보상: ${rewardCoins} 코인! 🪙`, 'success');
    
    // 중요: 코인 상태가 변경되었으므로 즉시 UI를 업데이트합니다.
    updateGameStats(); 
}

// 미션 UI 업데이트
function updateMissionUI() {
    console.log('[DEBUG] updateMissionUI 시작');
    const subjects = ['english', 'social', 'math', 'general'];
    
    subjects.forEach(subject => {
        const mission = window.gameState.dailyMissions[subject];
        console.log(`[DEBUG] ${subject} 미션:`, mission);
        
        // 진행도 텍스트 업데이트
        const progressEl = document.getElementById(`${subject}-progress`);
        if (progressEl) {
            progressEl.textContent = mission.solvedQuestions;
            console.log(`[DEBUG] ${subject} 진행도 UI 업데이트:`, mission.solvedQuestions);
        }
        
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

// ==================== Firebase 데이터 저장/로드 시스템 ====================

// 사용자 데이터를 Firebase에 저장
async function saveCurrentUserData() {
    console.log('%c[SAVE] saveCurrentUserData 함수 실행 시작', 'color: blue; font-weight: bold;');
    
    if (!window.currentUserId || !window.firebase) {
        console.warn('[SAVE] Firebase 미연결 상태. 저장을 중단합니다.');
        return;
    }

    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const userDataRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "users", window.currentUserId);
        
        // 저장할 핵심 데이터만 선별 (데이터 구조 최적화)
        const minimalGameState = {
            coins: window.gameState.coins,
            level: window.gameState.level,
            dailyMissions: window.gameState.dailyMissions,
            studyTimer: window.gameState.studyTimer,
            subjects: window.gameState.subjects,
            animals: window.gameState.animals,
            farm: window.gameState.farm,
        };

        const userData = {
            gameState: minimalGameState,
            lastSaved: new Date().toISOString()
        };

        console.log('[SAVE] Firestore에 다음 데이터를 저장합니다:', userData);
        
        // Firestore에 데이터 쓰기
        await window.firebase.setDoc(userDataRef, userData, { merge: true });
        
        console.log('%c[SUCCESS] 사용자 데이터가 Firebase에 성공적으로 저장되었습니다!', 'color: green; font-weight: bold;');

        // 저장 후 즉시 검증
        console.log('[VERIFY] 저장된 데이터 검증 시작...');
        const verifyDoc = await window.firebase.getDoc(userDataRef);
        if (verifyDoc.exists()) {
            console.log('%c[VERIFY SUCCESS] Firestore에서 방금 저장된 데이터를 확인했습니다.', 'color: green;');
        } else {
            console.error('%c[VERIFY FAILED] 저장 직후 데이터를 확인했으나 찾을 수 없습니다!', 'color: red; font-weight: bold;');
        }
        
    } catch (error) {
        console.error('%c[ERROR] Firebase 저장 중 심각한 오류 발생:', 'color: red; font-weight: bold;', error);
        // 사용자에게 오류 피드백을 주는 UI 로직을 추가할 수 있습니다.
        // showNotification('클라우드 저장에 실패했습니다. 인터넷 연결을 확인해주세요.', 'error');
    } finally {
        console.log('%c[SAVE] saveCurrentUserData 함수 실행 종료', 'color: blue; font-weight: bold;');
    }
}


// Firebase에서 사용자 데이터 로드
async function loadCurrentUserData() {
    console.log('[DEBUG] loadCurrentUserData 시작');
    console.log('[DEBUG] currentUserId:', window.currentUserId);
    console.log('[DEBUG] firebase 객체:', !!window.firebase);
    
    if (!window.currentUserId || !window.firebase) {
        console.log('[DEBUG] Firebase 미연결 상태, 로컬 데이터 사용');
        return false;
    }
    
    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        console.log('[DEBUG] 사용할 appId:', appId);
        
        const userDataRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "users", window.currentUserId);
        console.log('[DEBUG] Firebase 문서 경로 생성 완료');
        
        const docSnap = await window.firebase.getDoc(userDataRef);
        console.log('[DEBUG] Firebase 문서 읽기 완료, exists:', docSnap.exists());
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log('[DEBUG] Firebase에서 로드된 전체 데이터:', userData);
            console.log('[DEBUG] 저장 시간:', userData.lastSaved);
            
            // 기존 gameState와 병합 (새로운 필드들이 추가되었을 수도 있으므로)
            if (userData.gameState) {
                console.log('[DEBUG] 로드된 gameState:', userData.gameState);
                console.log('[DEBUG] 현재 gameState (병합 전):', window.gameState);
                
                // 깊은 복사로 병합
                window.gameState = JSON.parse(JSON.stringify({ ...window.gameState, ...userData.gameState }));
                console.log('[DEBUG] 병합된 gameState:', window.gameState);
                
                // 일일 미션과 타이머 날짜 체크
                console.log('[DEBUG] 미션 초기화 시작');
                initializeDailyMissions();
                checkDailyTimerReset();
                
                // UI 업데이트
                console.log('[DEBUG] UI 업데이트 시작');
                updateMissionUI();
                updateBonusIndicators();
                
                console.log('[SUCCESS] 사용자 데이터가 성공적으로 로드되었습니다');
                return true;
            } else {
                console.log('[WARNING] userData.gameState가 없습니다');
            }
        } else {
            console.log('[INFO] Firebase에 저장된 사용자 데이터가 없습니다. 새 사용자로 처리합니다.');
            // 새 사용자의 경우 초기 데이터를 저장
            await saveCurrentUserData();
        }
        
        return false;
        
    } catch (error) {
        console.error('[ERROR] Firebase 로드 오류:', error);
        console.error('[ERROR] 오류 상세:', error.message, error.stack);
        return false;
    }
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
    
    // 진행률 바 초기화
    const progressBar = document.getElementById('quiz-progress-bar');
    if (progressBar) {
        const percentage = (mission.solvedQuestions / mission.targetQuestions) * 100;
        progressBar.style.width = `${percentage}%`;
    }
    
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

// Firebase 데이터 함수들
window.saveCurrentUserData = saveCurrentUserData;
window.loadCurrentUserData = loadCurrentUserData;
window.updateQuizProgressDisplay = updateQuizProgressDisplay;
window.showNotification = showNotification;
window.updateGameStats = updateGameStats;

// 테스트 함수들 (개발자 도구에서 사용 가능)
window.testFirebaseSave = async function() {
    console.log('[테스트] 현재 gameState:', window.gameState);
    console.log('[테스트] Firebase 저장 시작...');
    await saveCurrentUserData();
    console.log('[테스트] Firebase 저장 완료');
};

window.testFirebaseLoad = async function() {
    console.log('[테스트] Firebase 로드 시작...');
    const result = await loadCurrentUserData();
    console.log('[테스트] Firebase 로드 결과:', result);
    return result;
};

window.testMissionProgress = function() {
    console.log('[테스트] 영어 미션 진행도 1 증가');
    window.updateMissionProgress('english');
};

window.testMissionComplete = async function() {
    console.log('[테스트] 영어 미션을 완료 상태로 설정');
    const mission = window.gameState.dailyMissions.english;
    mission.solvedQuestions = 9; // 9개로 설정
    await window.updateMissionProgress('english'); // 10개로 완료
};
