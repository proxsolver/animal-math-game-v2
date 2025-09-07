/**
 * UI 네비게이션 및 페이지 관리
 */

// showPage 함수
export function showPage(pageName, element) {
    console.log('showPage 호출:', pageName);
    
    // 게임 컨테이너 표시 (중요!)
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.style.display = 'block';
        console.log('✅ 게임 컨테이너 표시됨');
    }
    
    // 모든 페이지 비활성화
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // 모든 네비 버튼 비활성화
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택된 페이지 활성화
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
        
        console.log('페이지 활성화:', pageName);
        
    } else {
        console.error('페이지를 찾을 수 없음:', pageName + '-page');
    }
    
    // 선택된 버튼 활성화
    if (element) {
        element.classList.add('active');
    }
    
    // 게임 통계와 사용자 정보 표시 관리
    const gameStats = document.getElementById('game-stats');
    const userInfo = document.getElementById('user-info');
    
    if (gameStats && userInfo) {
        if (pageName === 'game' || pageName === 'farm') {
            gameStats.style.display = 'flex';
            userInfo.style.display = 'block';
        } else {
            gameStats.style.display = 'none';
            userInfo.style.display = 'block';
        }
    }
    
    // 특정 페이지별 초기화
    if (pageName === 'battle') {
        setTimeout(() => {
            if (window.showBattleMenu) {
                showBattleMenu();
            }
        }, 100);
    }
}

// selectDifficulty 함수
export function selectDifficulty(level) {
    console.log('난이도 선택:', level);
    
    // 난이도 버튼 상태 업데이트
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const selectedBtn = document.querySelector(`[data-level="${level}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('active');
    }
    
    // 현재 난이도 저장
    window.currentDifficulty = level;
}

// updateUI 함수
export function updateUI() {
    try {
        if (!window.currentUserProfile) return;
        
        // 사용자 이름 업데이트
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = window.currentUserProfile.name;
        });
        
        // 총점 업데이트
        const scoreElements = document.querySelectorAll('.total-score');
        scoreElements.forEach(el => {
            el.textContent = window.currentUserProfile.totalScore || 0;
        });
        
        // 수집한 동물 수 업데이트
        const animalCountElements = document.querySelectorAll('.animal-count');
        animalCountElements.forEach(el => {
            el.textContent = (window.currentUserProfile.collectedAnimals || []).length;
        });
        
        // 동물 컬렉션 업데이트
        updateAnimalCollection();
        
        console.log('UI 업데이트 완료');
    } catch (error) {
        console.error('UI 업데이트 오류:', error);
    }
}

// updateAnimalCollection 함수
export function updateAnimalCollection() {
    const collectionContainer = document.getElementById('animal-collection');
    if (!collectionContainer || !window.currentUserProfile) return;
    
    collectionContainer.innerHTML = '';
    
    const collectedAnimals = window.currentUserProfile.collectedAnimals || [];
    
    if (collectedAnimals.length === 0) {
        collectionContainer.innerHTML = '<p class="no-animals">아직 동물을 수집하지 않았습니다. 게임을 플레이해서 동물을 잡아보세요!</p>';
        return;
    }
    
    collectedAnimals.forEach(animal => {
        const animalCard = document.createElement('div');
        animalCard.className = 'animal-card';
        animalCard.innerHTML = `
            <div class="animal-emoji">${animal.emoji}</div>
            <div class="animal-info">
                <div class="animal-name">${animal.name}</div>
                <div class="special-name">${animal.specialName || animal.name}</div>
                <div class="rarity">희귀도: ${animal.rarity}★</div>
                <div class="catch-time">획득: ${new Date(animal.caughtAt).toLocaleDateString()}</div>
            </div>
        `;
        collectionContainer.appendChild(animalCard);
    });
}

// 전역 함수로 등록
window.showPage = showPage;
window.selectDifficulty = selectDifficulty;
window.updateUI = updateUI;
window.updateAnimalCollection = updateAnimalCollection;