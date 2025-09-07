/**
 * 메인 앱 초기화 및 모듈 로더
 */

// 모든 필요한 모듈 import
import { initializeFirebase, handleLogin, handleSignup } from './auth/firebase-auth.js';
import { loadAnimalsFromJSON } from './game/animal-data.js';
import { getAllProfiles, updateHallOfFame } from './game/hall-of-fame.js';
import { showPage, selectDifficulty, updateUI, updateAnimalCollection } from './ui/navigation.js';
import './game/game-logic.js'; // 게임 로직 모듈 로드
import { testFirebaseConnection, saveUserProfile, loadUserProfile, updateLeaderboardUI } from './game/firebase-data.js';

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
        
        // 기본 페이지 설정 및 게임 초기화
        setTimeout(() => {
            if (window.showPage && !window.currentUserProfile) {
                const firstNavBtn = document.querySelector('.nav-btn');
                if (firstNavBtn) {
                    window.showPage('game', firstNavBtn);
                    console.log("🎮 기본 게임 페이지 설정 완료");
                }
            }
            
            // 동물 데이터가 로드된 후 게임 시스템 초기화
            if (window.animalTypes && window.animalTypes.length > 0) {
                console.log('🎯 동물 데이터 기반 게임 시스템 초기화');
                // 게임 로직에서 사용할 수 있도록 데이터 준비 완료 알림
                if (window.onDifficultyChange) {
                    window.onDifficultyChange(1); // 기본 난이도로 초기화
                }
            }
        }, 1000);
        
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