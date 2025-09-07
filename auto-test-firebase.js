/**
 * Automated Firebase functionality test
 * This script tests Firebase integration and reports results
 */

console.log('🧪 Firebase 자동 테스트 시작...');

// Test results collector
const testResults = {
    firebaseConnection: false,
    authentication: false,
    profileSync: false,
    leaderboard: false,
    gameplaySync: false
};

// Wait for Firebase to initialize
async function waitForFirebase(maxWait = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
        if (window.firebase && window.currentUserId) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
}

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        if (!window.firebase) {
            throw new Error('Firebase not initialized');
        }
        
        const testData = {
            timestamp: new Date().toISOString(),
            test: 'automated_connection_test'
        };
        
        const testDocRef = window.firebase.doc(window.firebase.db, 'test', 'auto_test');
        await window.firebase.setDoc(testDocRef, testData);
        
        const docSnap = await window.firebase.getDoc(testDocRef);
        if (docSnap.exists()) {
            console.log('✅ Firebase 연결 테스트: 성공');
            testResults.firebaseConnection = true;
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Firebase 연결 테스트: 실패 -', error.message);
        return false;
    }
}

// Test authentication with provided credentials
async function testAuthentication() {
    try {
        // Simulate login with the provided credentials
        const testName = "아빠";
        const testPin = "9329";
        
        // Create temporary DOM elements for login
        const nameInput = document.createElement('input');
        nameInput.id = 'player-name-input';
        nameInput.value = testName;
        document.body.appendChild(nameInput);
        
        const pinInput = document.createElement('input');
        pinInput.id = 'player-pin-input';
        pinInput.value = testPin;
        document.body.appendChild(pinInput);
        
        const feedback = document.createElement('div');
        feedback.id = 'login-feedback';
        document.body.appendChild(feedback);
        
        // Attempt login
        if (window.handleLogin) {
            await window.handleLogin();
            
            // Check if profile was created
            if (window.currentUserProfile && window.currentUserProfile.name === testName) {
                console.log('✅ 인증 테스트: 성공 -', window.currentUserProfile.name);
                testResults.authentication = true;
                
                // Clean up DOM elements
                document.body.removeChild(nameInput);
                document.body.removeChild(pinInput);
                document.body.removeChild(feedback);
                
                return true;
            }
        }
        
        // Clean up DOM elements
        document.body.removeChild(nameInput);
        document.body.removeChild(pinInput);
        document.body.removeChild(feedback);
        
        console.error('❌ 인증 테스트: 실패 - 프로필이 생성되지 않음');
        return false;
        
    } catch (error) {
        console.error('❌ 인증 테스트: 실패 -', error.message);
        return false;
    }
}

// Test profile synchronization
async function testProfileSync() {
    try {
        if (!window.currentUserProfile || !window.saveUserProfile) {
            throw new Error('Profile or save function not available');
        }
        
        const result = await window.saveUserProfile(window.currentUserProfile);
        if (result) {
            console.log('✅ 프로필 동기화 테스트: 성공');
            testResults.profileSync = true;
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ 프로필 동기화 테스트: 실패 -', error.message);
        return false;
    }
}

// Test leaderboard functionality
async function testLeaderboard() {
    try {
        if (!window.getGlobalLeaderboard) {
            throw new Error('Leaderboard function not available');
        }
        
        const players = await window.getGlobalLeaderboard();
        console.log('✅ 리더보드 테스트: 성공 -', players.length, '명 로드됨');
        testResults.leaderboard = true;
        return true;
    } catch (error) {
        console.error('❌ 리더보드 테스트: 실패 -', error.message);
        return false;
    }
}

// Test gameplay synchronization
async function testGameplaySync() {
    try {
        if (!window.currentUserProfile || !window.updateGameScore || !window.updateAnimalCollection) {
            throw new Error('Gameplay sync functions not available');
        }
        
        const originalScore = window.currentUserProfile.totalScore || 0;
        const newScore = originalScore + 100;
        
        // Test score update
        await window.updateGameScore(newScore);
        
        // Test animal collection update
        const newAnimal = `테스트동물_${Date.now()}`;
        await window.updateAnimalCollection(newAnimal);
        
        console.log('✅ 게임플레이 동기화 테스트: 성공 - 점수:', newScore, '동물:', newAnimal);
        testResults.gameplaySync = true;
        return true;
    } catch (error) {
        console.error('❌ 게임플레이 동기화 테스트: 실패 -', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🔥 Firebase 초기화 대기 중...');
    
    const firebaseReady = await waitForFirebase();
    if (!firebaseReady) {
        console.error('❌ Firebase 초기화 타임아웃');
        return testResults;
    }
    
    console.log('🧪 테스트 실행 시작...');
    
    // Run tests in sequence
    await testFirebaseConnection();
    await testAuthentication();
    await testProfileSync();
    await testLeaderboard();
    await testGameplaySync();
    
    // Report results
    const totalTests = Object.keys(testResults).length;
    const passedTests = Object.values(testResults).filter(Boolean).length;
    
    console.log('🎯 테스트 결과 요약:');
    console.log(`   총 테스트: ${totalTests}개`);
    console.log(`   성공: ${passedTests}개`);
    console.log(`   실패: ${totalTests - passedTests}개`);
    console.log(`   성공률: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 모든 Firebase 기능이 정상 작동합니다!');
    } else {
        console.log('⚠️ 일부 기능에 문제가 있습니다.');
    }
    
    return testResults;
}

// Export for manual execution
window.runFirebaseTests = runAllTests;

// Auto-run after page load
window.addEventListener('load', () => {
    setTimeout(runAllTests, 3000);
});

console.log('🧪 Firebase 자동 테스트 스크립트 로드 완료');