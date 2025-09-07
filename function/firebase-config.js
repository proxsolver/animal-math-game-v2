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
        try {
            await window.updateHallOfFame();
            console.log("명예의 전당 업데이트 완료");
        } catch (hallError) {
            console.warn("명예의 전당 업데이트 실패 (계속 진행):", hallError);
        }
        
        // 사용자 데이터 로드 (함수가 로드될 때까지 대기)
        console.log("사용자 데이터 로드 시작...");
        try {
            // loadCurrentUserData 함수가 로드될 때까지 최대 5초 대기
            let attempts = 0;
            while (typeof window.loadCurrentUserData !== 'function' && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            if (typeof window.loadCurrentUserData === 'function') {
                console.log("loadCurrentUserData 함수 발견, 데이터 로드 시작");
                const loaded = await window.loadCurrentUserData();
                console.log("사용자 데이터 로드 결과:", loaded);
            } else {
                console.error("loadCurrentUserData 함수를 찾을 수 없습니다! (5초 대기 후)");
            }
        } catch (loadError) {
            console.error("사용자 데이터 로드 중 오류:", loadError);
        }
        
        console.log("초기화 완료");
    } catch (error) {
        console.error('Firebase 초기화 전체 오류:', error);
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

    // 인증 상태를 한 번만 가져와 처리하여 불필요한 재로그인을 방지합니다.
    try {
        await auth.authStateReady(); // Firebase 인증 상태가 준비될 때까지 기다립니다.
        let user = auth.currentUser;

        if (user) {
            // 이미 로그인된 사용자(익명 포함)가 있는 경우
            console.log("기존 사용자로 로그인:", user.uid);
            window.onFirebaseReady(user);
        } else {
            // 로그인된 사용자가 없는 경우, 새로 익명 로그인을 시도합니다.
            console.log("새로운 익명 로그인 시도...");
            const userCredential = await signInAnonymously(auth);
            console.log("익명 로그인 성공:", userCredential.user.uid);
            window.onFirebaseReady(userCredential.user);
        }
    } catch (error) {
        console.error("Firebase 인증 처리 중 오류 발생:", error);
        alert("Firebase 인증 실패: " + error.message);
        window.onFirebaseReady(null);
    }
