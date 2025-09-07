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

// 전역에서 접근 가능하도록 함수들을 window에 등록
window.createNotification = createNotification;
window.loadNotifications = loadNotifications;
window.changeSubject = changeSubject;
window.saveCurrentSubjectProgress = saveCurrentSubjectProgress;
window.loadCurrentSubjectProgress = loadCurrentSubjectProgress;
window.updateSubjectUI = updateSubjectUI;
window.getTodayString = getTodayString;
window.checkDailyLoginReward = checkDailyLoginReward;