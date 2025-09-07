/**
 * 메인 앱 초기화 및 모듈 로더
 */

// 모든 필요한 모듈 import
import { initializeFirebase, handleLogin, handleSignup } from './auth/firebase-auth.js';
import { loadAnimalsFromJSON } from './game/animal-data.js';
import { getAllProfiles, updateHallOfFame } from './game/hall-of-fame.js';
import { showPage, selectDifficulty, updateUI, updateAnimalCollection } from './ui/navigation.js';

// 앱 초기화
async function initializeApp() {
    console.log('앱 초기화 시작...');
    
    try {
        // Firebase 초기화
        const firebaseInitialized = await initializeFirebase();
        
        if (firebaseInitialized) {
            console.log('모든 모듈 로드 완료');
        } else {
            console.warn('Firebase 초기화 실패, 오프라인 모드로 실행');
        }
        
        // 전역 함수들 설정 (기존 코드와 호환성을 위해)
        window.handleLogin = handleLogin;
        window.handleSignup = handleSignup;
        
        console.log('앱 초기화 완료');
        
    } catch (error) {
        console.error('앱 초기화 실패:', error);
    }
}

// 중복 실행 방지
let isInitialized = false;

async function safeInitializeApp() {
    if (isInitialized) {
        console.log('앱이 이미 초기화되었습니다.');
        return;
    }
    isInitialized = true;
    await initializeApp();
}

// DOM 로드 완료 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInitializeApp);
} else {
    safeInitializeApp();
}