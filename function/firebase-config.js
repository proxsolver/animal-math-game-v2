// Firebase SDK 및 초기화
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch, runTransaction, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

let auth, db, functions;

// Firebase 준비 함수를 먼저 정의
window.onFirebaseReady = async function(user) {
    console.log("onFirebaseReady 호출됨, user:", user);
    
    if (!user) {
        console.log("사용자 없음, 오프라인 모드");
        const feedbackEl = document.getElementById('login-feedback');
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
        
        // 사용자 데이터 로드
        console.log("사용자 데이터 로드 시작...");
        await window.loadCurrentUserData();
        
        console.log("초기화 완료");
    } catch (error) {
        console.error('초기화 오류:', error);
    }
    
    console.log("로그인 오버레이 표시");
    const overlayEl = document.getElementById('login-overlay');
    if (overlayEl) {
        overlayEl.style.display = 'flex';
    }
}

// Firebase 초기화
try {
    const firebaseConfig = {
      apiKey: "AIzaSyC2JV9KsIZ-M1crdnnxLfxyaRtGS1Brtcc",
      authDomain: "animal-math-game-6eec2.firebaseapp.com",
      projectId: "animal-math-game-6eec2",
      storageBucket: "animal-math-game-6eec2.firebasestorage.app",
      messagingSenderId: "104144283045",
      appId: "1:104144283045:web:f0a387d83292a0d508744c",
      measurementId: "G-M63W08193X"
    };
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);

    console.log("Firebase 초기화 성공");

    window.firebase = { auth, db, functions, doc, getDoc, setDoc, collection, getDocs, writeBatch, runTransaction, deleteDoc, onSnapshot, httpsCallable };

    onAuthStateChanged(auth, async (user) => {
        console.log("Auth 상태 변경:", user ? "로그인됨" : "로그아웃됨");
        if (user) {
            console.log("Firebase Auth User:", user.uid);
            window.onFirebaseReady(user);
        } else {
             try {
                console.log("익명 로그인 시도...");
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    const result = await signInAnonymously(auth);
                    console.log("익명 로그인 성공:", result.user.uid);
                }
            } catch (error) {
                console.error("익명 로그인 실패:", error);
                alert("Firebase 인증 실패: " + error.message);
                window.onFirebaseReady(null);
            }
        }
    });
} catch (error) {
    console.error("Firebase 초기화 실패:", error);
    alert("Firebase 초기화 실패: " + error.message);
    window.onFirebaseReady(null);
}