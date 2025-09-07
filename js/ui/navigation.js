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
    
    // 게임 로직에 난이도 변경 알림
    if (window.onDifficultyChange) {
        window.onDifficultyChange(level);
    }
    
    // 게임 자동 시작
    setTimeout(() => {
        if (window.startGame) {
            window.startGame();
        }
    }, 500);
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
    if (!collectionContainer) {
        console.log('animal-collection 컨테이너를 찾을 수 없습니다.');
        return;
    }
    
    const collectedAnimals = window.currentUserProfile?.collectedAnimals || [];
    
    console.log('동물 컬렉션 업데이트:', collectedAnimals.length, '마리');
    
    collectionContainer.innerHTML = '';
    
    if (collectedAnimals.length === 0) {
        collectionContainer.innerHTML = `
            <div class="no-animals" style="
                text-align: center; padding: 30px; 
                background: rgba(255,255,255,0.9); 
                border-radius: 15px; margin: 20px 0;
            ">
                <div style="font-size: 3rem; margin-bottom: 15px;">🎮</div>
                <h3 style="color: #2C5530;">아직 동물을 수집하지 않았습니다</h3>
                <p style="color: #666; margin: 10px 0;">영어 퀴즈를 플레이해서 동물을 잡아보세요!</p>
                <button onclick="window.startGame()" style="
                    background: linear-gradient(45deg, #4169E1, #1E90FF); 
                    color: white; border: none; padding: 12px 24px; 
                    border-radius: 10px; cursor: pointer; margin-top: 10px;
                ">게임 시작하기</button>
            </div>
        `;
        return;
    }
    
    // 동물 카드 생성
    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
        gap: 15px; 
        margin: 20px 0;
    `;
    
    collectedAnimals.forEach(animal => {
        const animalCard = document.createElement('div');
        animalCard.className = 'animal-card';
        animalCard.style.cssText = `
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 20px; 
            text-align: center; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        `;
        
        animalCard.innerHTML = `
            <div class="animal-emoji" style="font-size: 3rem; margin-bottom: 10px;">${animal.emoji}</div>
            <div class="animal-info">
                <div class="animal-name" style="font-weight: bold; color: #2C5530; margin-bottom: 5px;">${animal.name}</div>
                <div class="special-name" style="color: #4169E1; font-style: italic; margin-bottom: 8px;">${animal.specialName || animal.name}</div>
                <div class="rarity" style="color: #FFD700; margin-bottom: 5px;">
                    희귀도: ${'★'.repeat(animal.rarity || 1)}
                </div>
                <div class="level" style="color: #28a745; margin-bottom: 5px;">
                    레벨 ${animal.level || 1} ${animal.experience ? `(${animal.experience}/100 EXP)` : ''}
                </div>
                <div class="catch-time" style="font-size: 0.8rem; color: #666;">
                    획득: ${animal.caughtAt ? new Date(animal.caughtAt).toLocaleDateString() : '알 수 없음'}
                </div>
            </div>
        `;
        
        // 호버 효과
        animalCard.addEventListener('mouseenter', () => {
            animalCard.style.transform = 'translateY(-5px)';
        });
        
        animalCard.addEventListener('mouseleave', () => {
            animalCard.style.transform = 'translateY(0)';
        });
        
        grid.appendChild(animalCard);
    });
    
    collectionContainer.appendChild(grid);
    
    // 컬렉션 통계
    const stats = document.createElement('div');
    stats.style.cssText = `
        background: rgba(255,255,255,0.9); 
        padding: 15px; 
        border-radius: 10px; 
        margin-bottom: 15px; 
        text-align: center;
    `;
    
    stats.innerHTML = `
        <h4 style="color: #2C5530; margin-bottom: 10px;">📊 컬렉션 통계</h4>
        <p><strong>보유 동물:</strong> ${collectedAnimals.length}마리</p>
        <p><strong>총 레벨:</strong> ${collectedAnimals.reduce((sum, animal) => sum + (animal.level || 1), 0)}</p>
        <p><strong>평균 희귀도:</strong> ${(collectedAnimals.reduce((sum, animal) => sum + (animal.rarity || 1), 0) / collectedAnimals.length).toFixed(1)}★</p>
    `;
    
    collectionContainer.insertBefore(stats, grid);
}

// 전역 함수로 등록
window.showPage = showPage;
window.selectDifficulty = selectDifficulty;
window.updateUI = updateUI;
window.updateAnimalCollection = updateAnimalCollection;