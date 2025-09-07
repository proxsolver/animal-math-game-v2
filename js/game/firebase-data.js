/**
 * Firebase 데이터베이스 연동 및 멀티플레이어 기능
 */

// Firebase 연결 테스트
export async function testFirebaseConnection() {
    try {
        console.log('🔥 Firebase 연결 테스트 시작...');
        
        if (!window.firebase || !window.firebase.db) {
            console.error('❌ Firebase 초기화되지 않음');
            return false;
        }
        
        const testData = {
            timestamp: new Date().toISOString(),
            test: 'connection_test',
            userId: window.currentUserId || 'anonymous'
        };
        
        // 테스트 문서 쓰기 시도
        const testDocRef = window.firebase.doc(window.firebase.db, 'test', 'connection');
        await window.firebase.setDoc(testDocRef, testData);
        
        console.log('✅ Firebase 쓰기 테스트 성공');
        
        // 테스트 문서 읽기 시도
        const docSnap = await window.firebase.getDoc(testDocRef);
        if (docSnap.exists()) {
            console.log('✅ Firebase 읽기 테스트 성공:', docSnap.data());
            return true;
        } else {
            console.warn('⚠️ Firebase 읽기 실패: 문서가 존재하지 않음');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Firebase 연결 테스트 실패:', error);
        
        // 에러 타입별 상세 분석
        if (error.code === 'permission-denied') {
            console.error('🚫 권한 거부: Firestore 규칙을 확인해주세요');
        } else if (error.code === 'unavailable') {
            console.error('🌐 네트워크 오류: 인터넷 연결을 확인해주세요');
        } else {
            console.error('🔍 기타 오류:', error.message);
        }
        
        return false;
    }
}

// 사용자 프로필 저장 (Firebase)
export async function saveUserProfile(profile) {
    try {
        if (!window.firebase || !profile) return false;
        
        console.log('💾 사용자 프로필 저장 중...', profile.name);
        
        const userDocRef = window.firebase.doc(window.firebase.db, 'players', window.currentUserId);
        
        const profileData = {
            name: profile.name,
            totalScore: profile.totalScore || 0,
            collectedAnimals: profile.collectedAnimals || [],
            speciesCount: (profile.collectedAnimals || []).length,
            subjectProgress: profile.subjectProgress || {},
            lastLogin: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await window.firebase.setDoc(userDocRef, profileData, { merge: true });
        
        console.log('✅ Firebase에 프로필 저장 완료');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase 프로필 저장 실패:', error);
        return false;
    }
}

// 사용자 프로필 로드 (Firebase)
export async function loadUserProfile(userId) {
    try {
        if (!window.firebase || !userId) return null;
        
        console.log('📖 사용자 프로필 로드 중...', userId);
        
        const userDocRef = window.firebase.doc(window.firebase.db, 'players', userId);
        const docSnap = await window.firebase.getDoc(userDocRef);
        
        if (docSnap.exists()) {
            const profileData = docSnap.data();
            console.log('✅ Firebase에서 프로필 로드 완료:', profileData.name);
            return profileData;
        } else {
            console.log('📝 새 사용자: Firebase에 프로필이 없음');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Firebase 프로필 로드 실패:', error);
        return null;
    }
}

// 전체 리더보드 가져오기
export async function getGlobalLeaderboard() {
    try {
        if (!window.firebase) return [];
        
        console.log('🏆 글로벌 리더보드 로드 중...');
        
        const playersRef = window.firebase.collection(window.firebase.db, 'players');
        const querySnapshot = await window.firebase.getDocs(playersRef);
        
        const players = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name && typeof data.totalScore === 'number') {
                players.push({
                    id: doc.id,
                    name: data.name,
                    totalScore: data.totalScore,
                    speciesCount: data.speciesCount || 0,
                    lastLogin: data.lastLogin
                });
            }
        });
        
        // 점수 순으로 정렬
        players.sort((a, b) => b.totalScore - a.totalScore);
        
        console.log('✅ 글로벌 리더보드 로드 완료:', players.length, '명');
        return players;
        
    } catch (error) {
        console.error('❌ 글로벌 리더보드 로드 실패:', error);
        return [];
    }
}

// 리더보드 UI 업데이트
export async function updateLeaderboardUI() {
    const players = await getGlobalLeaderboard();
    
    const leaderboardHtml = `
        <div style="
            background: rgba(255,255,255,0.95); 
            padding: 20px; 
            border-radius: 15px; 
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        ">
            <h3 style="color: #2C5530; text-align: center; margin-bottom: 15px;">
                🏆 글로벌 리더보드 🏆
            </h3>
            <div style="max-height: 300px; overflow-y: auto;">
                ${players.length === 0 ? 
                    '<p style="text-align: center; color: #666;">아직 등록된 플레이어가 없습니다.</p>' :
                    players.slice(0, 10).map((player, index) => {
                        let medal = '';
                        if (index === 0) medal = '🥇';
                        else if (index === 1) medal = '🥈';
                        else if (index === 2) medal = '🥉';
                        else medal = `${index + 1}위`;
                        
                        const isCurrentUser = player.id === window.currentUserId;
                        
                        return `
                            <div style="
                                display: flex; 
                                justify-content: space-between; 
                                align-items: center;
                                padding: 10px; 
                                margin: 5px 0; 
                                border-radius: 8px;
                                background: ${isCurrentUser ? '#fff3cd' : '#f8f9fa'};
                                border: ${isCurrentUser ? '2px solid #ffc107' : '1px solid #dee2e6'};
                            ">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 1.2rem; min-width: 40px;">${medal}</span>
                                    <strong style="color: ${isCurrentUser ? '#856404' : '#2C5530'};">
                                        ${player.name} ${isCurrentUser ? '(나)' : ''}
                                    </strong>
                                </div>
                                <div style="text-align: right;">
                                    <div style="color: #4169E1; font-weight: bold;">${player.totalScore}점</div>
                                    <div style="font-size: 0.8rem; color: #666;">${player.speciesCount}마리</div>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
            <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                <button onclick="window.refreshLeaderboard()" style="
                    background: linear-gradient(45deg, #28a745, #20c997); 
                    color: white; border: none; padding: 8px 16px; 
                    border-radius: 8px; cursor: pointer;
                ">🔄 새로고침</button>
            </div>
        </div>
    `;
    
    // 리더보드를 명예의 전당 근처에 표시
    const hallOfFame = document.getElementById('hall-of-fame');
    if (hallOfFame) {
        // 기존 리더보드 제거
        const existingLeaderboard = document.getElementById('global-leaderboard');
        if (existingLeaderboard) {
            existingLeaderboard.remove();
        }
        
        // 새 리더보드 추가
        const leaderboardDiv = document.createElement('div');
        leaderboardDiv.id = 'global-leaderboard';
        leaderboardDiv.innerHTML = leaderboardHtml;
        hallOfFame.appendChild(leaderboardDiv);
    }
}

// 게임 점수 업데이트 (로컬 + Firebase)
export async function updateGameScore(score) {
    if (!window.currentUserProfile) return;
    
    // 로컬 업데이트
    window.currentUserProfile.totalScore = score;
    localStorage.setItem(`${window.currentUserProfile.name}_totalScore`, score);
    
    // Firebase 업데이트 (백그라운드)
    try {
        await saveUserProfile(window.currentUserProfile);
        console.log('📊 점수 업데이트: Firebase 동기화 완료');
    } catch (error) {
        console.log('📊 점수 업데이트: 로컬만 저장 (Firebase 오프라인)');
    }
}

// 동물 수집 업데이트 (로컬 + Firebase)
export async function updateAnimalCollection(newAnimal) {
    if (!window.currentUserProfile) return;
    
    // 로컬 업데이트
    if (newAnimal) {
        window.currentUserProfile.collectedAnimals.push(newAnimal);
        window.currentUserProfile.speciesCount = window.currentUserProfile.collectedAnimals.length;
        localStorage.setItem(
            `${window.currentUserProfile.name}_collectedAnimals`, 
            JSON.stringify(window.currentUserProfile.collectedAnimals)
        );
    }
    
    // Firebase 업데이트 (백그라운드)
    try {
        await saveUserProfile(window.currentUserProfile);
        console.log('🐾 동물 컬렉션: Firebase 동기화 완료');
        
        // 리더보드 새로고침
        updateLeaderboardUI();
    } catch (error) {
        console.log('🐾 동물 컬렉션: 로컬만 저장 (Firebase 오프라인)');
    }
}

// 리더보드 새로고침
export async function refreshLeaderboard() {
    console.log('🔄 리더보드 새로고침...');
    await updateLeaderboardUI();
}

// 전역 함수 등록
window.refreshLeaderboard = refreshLeaderboard;
window.updateGameScore = updateGameScore;
window.updateAnimalCollection = updateAnimalCollection;

// 모듈 로드 시 Firebase 연결 테스트
setTimeout(async () => {
    const isConnected = await testFirebaseConnection();
    if (isConnected) {
        console.log('🌐 Firebase 완전 연결됨 - 멀티플레이어 기능 활성화');
        // 리더보드 표시
        await updateLeaderboardUI();
    } else {
        console.log('📱 오프라인 모드 - 로컬 저장소만 사용');
    }
}, 3000);