/**
 * Firebase 인증 관련 함수들
 */

// Firebase 인증 상태 관리
let auth, db, functions;

// Firebase 초기화 함수
export async function initializeFirebase() {
    try {
        // Firebase 모듈 동적 import
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
        const { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        const { getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch, runTransaction, deleteDoc, onSnapshot } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
        const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js");

        const firebaseConfig = {
            apiKey: "AIzaSyC2JV9KsIZ-M1crdnnxLfxyaRtGS1Brtcc",
            authDomain: "animal-math-game-6eec2.firebaseapp.com",
            projectId: "animal-math-game-6eec2",
            storageBucket: "animal-math-game-6eec2.firebasestorage.app",
            messagingSenderId: "1095874983652",
            appId: "1:1095874983652:web:315b20a4e5d877b543ecf2"
        };

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        functions = getFunctions(app);

        // Firebase 모듈들을 전역으로 설정
        window.firebase = {
            auth,
            db,
            functions,
            doc,
            getDoc,
            setDoc,
            collection,
            getDocs,
            writeBatch,
            runTransaction,
            deleteDoc,
            onSnapshot
        };

        console.log("Firebase 초기화 성공");
        
        // 인증 상태 변경 리스너 설정
        onAuthStateChanged(auth, handleAuthStateChanged);
        
        return true;
    } catch (error) {
        console.error("Firebase 초기화 실패:", error);
        return false;
    }
}

// 인증 상태 변경 처리
function handleAuthStateChanged(user) {
    if (user) {
        console.log("Auth 상태 변경: 로그인됨");
        console.log("Firebase Auth User:", user.uid);
        window.onFirebaseReady(user);
    } else {
        console.log("Auth 상태 변경: 로그아웃됨");
        attemptAnonymousLogin();
    }
}

// 익명 로그인 시도
async function attemptAnonymousLogin() {
    try {
        console.log("익명 로그인 시도...");
        const { signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        const userCredential = await signInAnonymously(auth);
        console.log("익명 로그인 성공:", userCredential.user.uid);
        return userCredential.user;
    } catch (error) {
        console.error("익명 로그인 실패:", error);
        alert("Firebase 인증 실패: " + error.message);
        window.onFirebaseReady(null);
        return null;
    }
}

// 사용자 데이터베이스 (실제 서비스에서는 서버나 암호화된 저장소 사용)
const USER_DATABASE = {
    "아빠": "9329",
    "admin": "1234",
    "test": "0000"
};

// 로그인 처리 함수 (handleLogin 오류 해결)
export async function handleLogin() {
    console.log("로그인 처리 시작");
    
    const nameInput = document.getElementById('player-name-input');
    const pinInput = document.getElementById('player-pin-input');
    const feedbackEl = document.getElementById('login-feedback');
    
    const playerName = nameInput ? nameInput.value.trim() : '';
    const playerPin = pinInput ? pinInput.value.trim() : '';
    
    // 입력 검증
    if (!playerName) {
        showLoginFeedback('플레이어 이름을 입력해주세요!', 'error');
        nameInput.focus();
        return;
    }
    
    if (!playerPin) {
        showLoginFeedback('4자리 PIN을 입력해주세요!', 'error');
        pinInput.focus();
        return;
    }
    
    if (playerPin.length !== 4 || !/^\d{4}$/.test(playerPin)) {
        showLoginFeedback('PIN은 정확히 4자리 숫자여야 합니다!', 'error');
        pinInput.focus();
        return;
    }
    
    // 로그인 검증
    if (USER_DATABASE[playerName] && USER_DATABASE[playerName] === playerPin) {
        // 로그인 성공
        showLoginFeedback('로그인 성공! 게임을 시작합니다...', 'success');
        
        // Firebase에서 사용자 프로필 로드 시도
        let firebaseProfile = null;
        try {
            if (window.loadUserProfile) {
                firebaseProfile = await window.loadUserProfile(window.currentUserId);
            }
        } catch (error) {
            console.log('Firebase 프로필 로드 실패, 로컬 데이터 사용');
        }
        
        // 사용자 프로필 설정 (Firebase 우선, 로컬 백업)
        window.currentUserProfile = firebaseProfile || {
            name: playerName,
            totalScore: parseInt(localStorage.getItem(`${playerName}_totalScore`)) || 0,
            collectedAnimals: JSON.parse(localStorage.getItem(`${playerName}_collectedAnimals`)) || [],
            speciesCount: JSON.parse(localStorage.getItem(`${playerName}_collectedAnimals`))?.length || 0,
            lastLogin: new Date().toISOString()
        };
        
        // 이름 업데이트 (로그인한 이름으로)
        window.currentUserProfile.name = playerName;
        
        // 로컬 스토리지에 현재 사용자 저장
        localStorage.setItem('currentUser', playerName);
        
        // Firebase에 프로필 저장 (백그라운드)
        if (window.saveUserProfile) {
            window.saveUserProfile(window.currentUserProfile).catch(err => 
                console.log('Firebase 프로필 저장 실패:', err.message)
            );
        }
        
        // 1초 후 로그인 오버레이 숨기고 게임 시작
        setTimeout(() => {
            const overlay = document.getElementById('login-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
            
            // 기본 게임 페이지로 이동
            if (window.showPage) {
                const firstNavBtn = document.querySelector('.nav-btn');
                window.showPage('game', firstNavBtn);
                console.log("✅ 게임 페이지로 이동 완료");
            }
            
            // UI 업데이트
            if (window.updateUI) {
                window.updateUI();
            }
            
            console.log("🎮 게임 시작 준비 완료!");
        }, 1000);
        
        console.log("로그인 완료:", playerName);
        
    } else {
        // 로그인 실패
        showLoginFeedback('아이디 또는 PIN이 일치하지 않습니다!', 'error');
        pinInput.value = '';
        pinInput.focus();
    }
}

// 회원가입 처리 함수
export function handleSignup() {
    console.log("회원가입 처리 시작");
    
    const nameInput = document.getElementById('player-name-input');
    const pinInput = document.getElementById('player-pin-input');
    
    const playerName = nameInput ? nameInput.value.trim() : '';
    const playerPin = pinInput ? pinInput.value.trim() : '';
    
    // 입력 검증
    if (!playerName) {
        showLoginFeedback('플레이어 이름을 입력해주세요!', 'error');
        nameInput.focus();
        return;
    }
    
    if (!playerPin) {
        showLoginFeedback('4자리 PIN을 입력해주세요!', 'error');
        pinInput.focus();
        return;
    }
    
    if (playerPin.length !== 4 || !/^\d{4}$/.test(playerPin)) {
        showLoginFeedback('PIN은 정확히 4자리 숫자여야 합니다!', 'error');
        pinInput.focus();
        return;
    }
    
    // 기존 사용자 확인
    if (USER_DATABASE[playerName]) {
        showLoginFeedback('이미 존재하는 플레이어 이름입니다!', 'error');
        nameInput.focus();
        return;
    }
    
    // 회원가입 성공 (실제 서비스에서는 서버에 저장)
    showLoginFeedback(`환영합니다, ${playerName}님! 새 계정이 생성되었습니다.`, 'success');
    
    // 임시로 로컬 데이터베이스에 추가 (실제로는 서버 API 호출)
    USER_DATABASE[playerName] = playerPin;
    
    // 자동 로그인
    setTimeout(() => {
        handleLogin();
    }, 1500);
}

// 로그인 피드백 메시지 표시 함수
function showLoginFeedback(message, type = 'error') {
    const feedbackEl = document.getElementById('login-feedback');
    if (feedbackEl) {
        feedbackEl.textContent = message;
        feedbackEl.style.color = type === 'success' ? '#28a745' : '#dc3545';
        feedbackEl.style.fontWeight = 'bold';
    }
}

// Firebase가 준비되었을 때 호출되는 함수
window.onFirebaseReady = async function(user) {
    console.log("onFirebaseReady 호출됨, user:", user);
    
    if (!user) {
        const feedbackEl = document.getElementById('feedback');
        if (feedbackEl) {
            feedbackEl.textContent = "클라우드 연결 실패! 오프라인 모드로 실행합니다.";
        }
        return;
    }
    
    window.currentUserId = user.uid;
    console.log("현재 사용자 ID 설정:", window.currentUserId);
    
    try {
        console.log("과목별 데이터 로딩 완료됨 (이미 앱에서 로드됨)");
        console.log("명예의 전당 업데이트 시작...");
        if (window.updateHallOfFame) {
            await window.updateHallOfFame();
        }
        console.log("초기화 완료");
    } catch (error) {
        console.log('초기화 완료 (일부 기능 건너뜀):', error.message);
    }
    
    console.log("로그인 오버레이 표시");
    const overlayEl = document.getElementById('login-overlay');
    if (overlayEl) {
        overlayEl.style.display = 'flex';
    }
};