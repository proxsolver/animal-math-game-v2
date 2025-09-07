/**
 * UI 네비게이션 및 페이지 관리 (과목별 구조 복원)
 */

import { SUBJECTS, LEVELS } from '../game/subject-data.js';

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
        
        // 게임 페이지일 때 과목별 UI 업데이트
        if (pageName === 'game') {
            updateGamePageUI();
        }
        
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

// 게임 페이지 UI 업데이트 (과목별)
function updateGamePageUI() {
    const currentSubject = window.getCurrentSubject ? window.getCurrentSubject() : 'math';
    const currentLevel = window.getCurrentLevel ? window.getCurrentLevel() : 1;
    
    // 퀴즈 섹션 제목 업데이트
    const quizSection = document.querySelector('.english-quiz-section h2');
    if (quizSection) {
        const subjectInfo = SUBJECTS[currentSubject];
        if (subjectInfo) {
            quizSection.textContent = `${subjectInfo.icon} ${subjectInfo.name} 퀴즈: 학습하기!`;
        }
    }
    
    // 과목 드롭다운 동기화
    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        subjectSelect.value = currentSubject;
    }
    
    // 게임 질문 영역 기본 메시지 업데이트
    const questionEl = document.getElementById('english-question');
    if (questionEl) {
        const subjectInfo = SUBJECTS[currentSubject];
        const levelInfo = LEVELS[currentLevel];
        
        if (subjectInfo && levelInfo) {
            questionEl.textContent = `${subjectInfo.name} ${levelInfo.name} 게임을 시작하세요!`;
        }
    }
    
    // 컬렉션 섹션을 성취도 섹션으로 변경
    updateAchievementSection();
}

// 성취도 섹션 업데이트
function updateAchievementSection() {
    const collectionSection = document.querySelector('.collection-section');
    if (!collectionSection) return;
    
    // 섹션 제목 변경
    const title = collectionSection.querySelector('h2');
    if (title) {
        title.textContent = '🏆 학습 성취도';
    }
    
    // 힌트 텍스트 변경
    const hint = collectionSection.querySelector('.collection-hint');
    if (hint) {
        hint.textContent = '💡 각 과목별 성취도를 확인하고 레벨업하세요!';
    }
    
    // 성취도 그리드 업데이트
    const collectionContainer = document.getElementById('animal-collection');
    if (collectionContainer) {
        updateSubjectAchievements(collectionContainer);
    }
}

// 과목별 성취도 표시
function updateSubjectAchievements(container) {
    if (!container) return;
    
    const subjectProgress = window.getSubjectProgress ? window.getSubjectProgress() : {};
    
    container.innerHTML = '';
    
    const achievementsHtml = Object.keys(SUBJECTS).map(subjectKey => {
        const subject = SUBJECTS[subjectKey];
        const progress = subjectProgress[subjectKey] || {};
        
        // 각 레벨별 최고 점수
        const level1Score = progress.level1 || 0;
        const level2Score = progress.level2 || 0;
        const level3Score = progress.level3 || 0;
        const totalScore = level1Score + level2Score + level3Score;
        
        // 완료한 레벨 수
        const completedLevels = [level1Score, level2Score, level3Score].filter(score => score > 0).length;
        
        return `
            <div class="subject-achievement-card" style="
                background: linear-gradient(135deg, ${subject.color}20, ${subject.color}10);
                border: 3px solid ${subject.color}40;
                border-radius: 20px; 
                padding: 20px; 
                text-align: center; 
                transition: all 0.3s ease;
                cursor: pointer;
            " onclick="selectSubjectAndLevel('${subjectKey}', 1)">
                <div style="font-size: 4rem; margin-bottom: 15px;">${subject.icon}</div>
                <h3 style="color: ${subject.color}; margin-bottom: 10px; font-size: 1.3rem;">${subject.name}</h3>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 15px;">${subject.description}</p>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 1.8rem; font-weight: bold; color: ${subject.color}; margin-bottom: 5px;">
                        ${totalScore}점
                    </div>
                    <div style="font-size: 0.9rem; color: #666;">총 획득 점수</div>
                </div>
                
                <div style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                    ${[1, 2, 3].map(level => `
                        <div style="text-align: center; flex: 1;">
                            <div style="
                                width: 40px; height: 40px; 
                                border-radius: 50%; 
                                background: ${(progress[`level${level}`] || 0) > 0 ? subject.color : '#ddd'}; 
                                color: white; 
                                display: flex; align-items: center; justify-content: center; 
                                margin: 0 auto 5px; 
                                font-weight: bold;
                            ">L${level}</div>
                            <div style="font-size: 0.8rem; color: #666;">
                                ${progress[`level${level}`] || 0}점
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="
                    background: ${subject.color}20; 
                    padding: 8px; 
                    border-radius: 10px; 
                    font-size: 0.9rem; 
                    color: ${subject.color};
                ">
                    ${completedLevels}/3 레벨 완료
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div style="
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
            gap: 20px; 
            margin: 20px 0;
        ">
            ${achievementsHtml}
        </div>
    `;
}

// 과목 및 레벨 선택 함수
function selectSubjectAndLevel(subject, level) {
    console.log(`📚 과목 선택: ${SUBJECTS[subject].name} Level ${level}`);
    
    // 과목 드롭다운 업데이트
    const subjectSelect = document.getElementById('subject-select');
    if (subjectSelect) {
        subjectSelect.value = subject;
    }
    
    // 과목 변경
    if (window.changeSubject) {
        window.changeSubject(subject);
    }
    
    // 레벨 변경
    if (window.onDifficultyChange) {
        window.onDifficultyChange(level);
    }
    
    // 난이도 버튼 활성화
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.level == level) {
            btn.classList.add('active');
        }
    });
    
    // UI 업데이트
    updateGamePageUI();
}

// 과목 변경 핸들러
function handleSubjectChange() {
    const subjectSelect = document.getElementById('subject-select');
    if (!subjectSelect) return;
    
    const selectedSubject = subjectSelect.value;
    console.log(`📚 드롭다운에서 과목 변경: ${SUBJECTS[selectedSubject]?.name}`);
    
    if (window.changeSubject) {
        window.changeSubject(selectedSubject);
    }
    
    // UI 업데이트
    updateGamePageUI();
}

// 전역 함수로 등록 (과목별 구조)
window.showPage = showPage;
window.selectDifficulty = selectDifficulty;
window.updateUI = updateUI;
window.updateAnimalCollection = updateAnimalCollection;
window.updateGamePageUI = updateGamePageUI;
window.selectSubjectAndLevel = selectSubjectAndLevel;
window.changeSubject = handleSubjectChange; // HTML에서 호출되는 함수

console.log('📚 과목별 UI 네비게이션 시스템 초기화 완료');