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

// 로그인 처리 함수 (handleLogin 오류 해결)
export function handleLogin() {
    console.log("로그인 처리 시작");
    
    const nameInput = document.getElementById('player-name');
    const playerName = nameInput ? nameInput.value.trim() : '';
    
    if (!playerName) {
        alert('이름을 입력해주세요!');
        return;
    }
    
    // 사용자 프로필 설정
    window.currentUserProfile = {
        name: playerName,
        totalScore: 0,
        collectedAnimals: [],
        speciesCount: 0,
        lastLogin: new Date().toISOString()
    };
    
    // 로그인 오버레이 숨기기
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    // UI 업데이트
    if (window.updateUI) {
        window.updateUI();
    }
    
    console.log("로그인 완료:", playerName);
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
        console.log("동물 데이터 로딩 시작...");
        await window.loadAnimalsFromJSON();
        console.log("명예의 전당 업데이트 시작...");
        await window.updateHallOfFame();
        console.log("초기화 완료");
    } catch (error) {
        console.error('초기화 오류:', error);
    }
    
    console.log("로그인 오버레이 표시");
    const overlayEl = document.getElementById('login-overlay');
    if (overlayEl) {
        overlayEl.style.display = 'flex';
    }
};