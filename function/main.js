        // ==================== 메인 게임 로직 ====================
        // 게임 데이터는 game-data.js에서 로드됨

        // ==================== 알림 시스템 관련 함수 ====================
        
        // 알림 생성
        async function createNotification(recipientName, type, message, animalData = null) {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const notificationsRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/notifications");
                
                const notificationData = {
                    recipient: recipientName,
                    type: type,
                    message: message,
                    animalData: animalData,
                    createdAt: new Date().toISOString(),
                    read: false
                };
                
                await window.firebase.setDoc(window.firebase.doc(notificationsRef, `${recipientName}_${Date.now()}`), notificationData);
                console.log(`알림 생성 완료: ${recipientName}에게 ${type} 알림`);
                
            } catch (error) {
                console.error('알림 생성 오류:', error);
            }
        }
        
        // 사용자 알림 로드
        async function loadNotifications(userName) {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const notificationsRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/notifications");
                const querySnapshot = await window.firebase.getDocs(notificationsRef);
                
                const userNotifications = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.recipient === userName && !data.read) {
                        userNotifications.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                
                // 최신순 정렬
                userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                return userNotifications;
                
            } catch (error) {
                console.error('알림 로드 오류:', error);
                return [];
            }
        }
        
        // 알림 읽음 처리 (전역 함수로 변경)
        window.markNotificationAsRead = async function(notificationId) {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const notificationRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/notifications", notificationId);
                
                await window.firebase.setDoc(notificationRef, { read: true }, { merge: true });
                
            } catch (error) {
                console.error('알림 읽음 처리 오류:', error);
            }
        }
        
        // 알림 표시
        async function showNotifications(notifications) {
            if (notifications.length === 0) return;
            
            for (const notification of notifications) {
                let alertStyle = 'background: linear-gradient(45deg, #4169E1, #1E90FF);';
                let emoji = '📢';
                
                if (notification.type === 'sale_success') {
                    alertStyle = 'background: linear-gradient(45deg, #32CD32, #90EE90);';
                    emoji = '💰';
                } else if (notification.type === 'sale_expired') {
                    alertStyle = 'background: linear-gradient(45deg, #FF6B6B, #FFB6C1);';
                    emoji = '⏰';
                } else if (notification.type === 'purchase_success') {
                    alertStyle = 'background: linear-gradient(45deg, #9370DB, #DDA0DD);';
                    emoji = '🎉';
                } else if (notification.type === 'sale_cancelled') {
                    alertStyle = 'background: linear-gradient(45deg, #FFA500, #FFD700);';
                    emoji = '🔄';
                }
                
                const alert = document.createElement('div');
                alert.className = 'new-animal-alert';
                alert.style.cssText = alertStyle;
                alert.innerHTML = `
                    <span class="new-animal-emoji">${emoji}</span>
                    <h3>알림 📬</h3>
                    <p>${notification.message}</p>
                    <button onclick="this.parentElement.remove(); markNotificationAsRead('${notification.id}')" 
                            style="background: rgba(255,255,255,0.3); border: none; padding: 8px 16px; border-radius: 10px; margin-top: 10px; cursor: pointer; color: inherit; font-weight: bold;">
                        확인
                    </button>
                `;
                
                document.body.appendChild(alert);
                
                // 5초 후 자동 제거
                setTimeout(() => {
                    if (alert.parentElement) {
                        alert.remove();
                        markNotificationAsRead(notification.id);
                    }
                }, 5000);
                
                // 알림 간 간격
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // 알림 확인 및 표시
        async function checkAndShowNotifications() {
            if (!currentUserProfile.name) return;
            
            try {
                const notifications = await loadNotifications(currentUserProfile.name);
                if (notifications.length > 0) {
                    console.log(`${notifications.length}개의 새로운 알림이 있습니다.`);
                    await showNotifications(notifications);
                }
            } catch (error) {
                console.error('알림 확인 오류:', error);
            }
        }

        // ==================== 매일 로그인 보상 시스템 ====================
        
        // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
        function getTodayString() {
            return new Date().toISOString().split('T')[0];
        }
        
        // 매일 로그인 체크 및 보상
        function checkDailyLoginReward() {
            const today = getTodayString();
            const lastLogin = gameState.dailyRewards.lastLoginDate;
            
            // 오늘 이미 보상을 받았다면 리턴
            if (gameState.dailyRewards.hasClaimedToday && lastLogin === today) {
                return;
            }
            
            // 연속 로그인 계산
            if (lastLogin) {
                const lastLoginDate = new Date(lastLogin);
                const todayDate = new Date(today);
                const dayDiff = Math.floor((todayDate - lastLoginDate) / (1000 * 60 * 60 * 24));
                
                if (dayDiff === 1) {
                    // 연속 로그인
                    gameState.dailyRewards.consecutiveDays++;
                } else if (dayDiff > 1) {
                    // 연속성 끊김
                    gameState.dailyRewards.consecutiveDays = 1;
                } else if (dayDiff === 0 && gameState.dailyRewards.hasClaimedToday) {
                    // 같은 날 재접속
                    return;
                }
            } else {
                // 첫 로그인
                gameState.dailyRewards.consecutiveDays = 1;
            }
            
            // 로그인 정보 업데이트
            gameState.dailyRewards.lastLoginDate = today;
            gameState.dailyRewards.hasClaimedToday = true;
            gameState.dailyRewards.totalDaysLogged++;
            
            // 보상 지급
            showDailyRewardModal();
        }
        
        // 일일 보상 계산
        function calculateDailyReward() {
            const consecutiveDays = gameState.dailyRewards.consecutiveDays;
            let baseCoins = 50;
            let bonus = 0;
            let specialReward = null;
            
            // 연속 로그인에 따른 보상 증가
            if (consecutiveDays >= 7) {
                bonus = Math.min(consecutiveDays * 10, 200); // 최대 200 보너스
                if (consecutiveDays % 7 === 0) {
                    specialReward = {
                        type: 'rare_animal_chance',
                        description: '🌟 희귀 동물 등장 확률 2배!'
                    };
                }
            }
            
            return {
                coins: baseCoins + bonus,
                specialReward: specialReward,
                consecutiveDays: consecutiveDays
            };
        }
        
        // 일일 보상 모달 표시
        function showDailyRewardModal() {
            const reward = calculateDailyReward();
            
            // 코인 지급
            gameState.coins += reward.coins;
            
            // 모달 HTML 동적 생성
            const modalHtml = `
                <div id="daily-reward-modal" class="modal" style="display: flex; z-index: 2000;">
                    <div class="modal-content" style="background: linear-gradient(135deg, #FFD700, #FFA500, #FF69B4); color: white; text-align: center; animation: rewardPulse 0.6s ease-out;">
                        <span class="close-btn" onclick="closeDailyRewardModal()">&times;</span>
                        <h2 style="margin-bottom: 20px; font-size: 2rem;">🎉 매일 로그인 보상! 🎉</h2>
                        <div style="font-size: 1.5rem; margin-bottom: 15px;">
                            연속 접속: <strong>${reward.consecutiveDays}일</strong>
                        </div>
                        <div style="font-size: 3rem; margin: 20px 0;">
                            💰 +${reward.coins} 코인!
                        </div>
                        ${reward.specialReward ? `
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 15px; margin: 15px 0;">
                                <div style="font-size: 1.2rem; font-weight: bold;">특별 보상!</div>
                                <div style="font-size: 1rem;">${reward.specialReward.description}</div>
                            </div>
                        ` : ''}
                        <div style="margin-top: 25px;">
                            <button onclick="closeDailyRewardModal()" style="background: white; color: #FF69B4; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                                감사합니다! 🎮
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            // 보상 애니메이션 효과
            setTimeout(() => {
                playRewardSound();
                showCoinAnimation(reward.coins);
            }, 300);
            
            // 특별 보상 적용
            if (reward.specialReward) {
                applySpecialReward(reward.specialReward);
            }
            
            // 데이터 저장
            saveCurrentUserData();
        }
        
        // 일일 보상 모달 닫기
        window.closeDailyRewardModal = function() {
            const modal = document.getElementById('daily-reward-modal');
            if (modal) {
                modal.remove();
            }
        }
        
        // 코인 애니메이션 효과
        function showCoinAnimation(amount) {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const coin = document.createElement('div');
                    coin.innerHTML = '🪙';
                    coin.style.cssText = `
                        position: fixed;
                        font-size: 2rem;
                        z-index: 3000;
                        pointer-events: none;
                        left: ${Math.random() * window.innerWidth}px;
                        top: 20px;
                        animation: coinFall 2s ease-out forwards;
                    `;
                    document.body.appendChild(coin);
                    
                    setTimeout(() => coin.remove(), 2000);
                }, i * 200);
            }
        }
        
        // 보상 사운드 효과 (Web Audio API 사용)
        function playRewardSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // 상승하는 멜로디 생성
                const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
                
                frequencies.forEach((freq, index) => {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.3);
                    }, index * 100);
                });
            } catch (error) {
                console.log('오디오 재생 불가:', error);
            }
        }
        
        // 특별 보상 적용
        function applySpecialReward(specialReward) {
            if (specialReward.type === 'rare_animal_chance') {
                // 희귀 동물 등장 확률 2배 버프를 24시간 적용
                const buffEndTime = Date.now() + (24 * 60 * 60 * 1000);
                gameState.activeBuffs = gameState.activeBuffs || [];
                gameState.activeBuffs.push({
                    type: 'rare_animal_chance_2x',
                    endTime: buffEndTime
                });
            }
        }

        // ==================== 과목 관리 시스템 ====================
        
        // 과목 변경
        function changeSubject() {
            const selectElement = document.getElementById('subject-select');
            const newSubject = selectElement.value;
            
            if (newSubject !== gameState.currentSubject) {
                // 현재 과목 데이터 저장
                saveCurrentSubjectProgress();
                
                // 새 과목으로 변경
                gameState.currentSubject = newSubject;
                
                // 새 과목 데이터 로드
                loadCurrentSubjectProgress();
                
                // UI 업데이트
                updateSubjectUI();
                
                // 새 문제 생성
                setTimeout(() => {
                    generatePersonalizedQuiz();
                }, 500);
                
                console.log(`과목이 ${newSubject}로 변경되었습니다.`);
            }
        }
        
        // 현재 과목 진행도 저장
        function saveCurrentSubjectProgress() {
            const currentSubject = gameState.currentSubject;
            if (!gameState.subjects[currentSubject]) {
                gameState.subjects[currentSubject] = {
                    progress: {},
                    level: 1,
                    score: 0,
                    currentDifficulty: 1,
                    totalCorrect: 0,
                    totalIncorrect: 0
                };
            }
            
            // 현재 학습 진행도를 과목별로 저장
            gameState.subjects[currentSubject].progress = { ...userProgress };
            gameState.subjects[currentSubject].currentDifficulty = currentDifficulty;
            
            console.log(`${currentSubject} 과목 진행도 저장됨:`, gameState.subjects[currentSubject]);
        }
        
        // 현재 과목 진행도 로드
        function loadCurrentSubjectProgress() {
            const currentSubject = gameState.currentSubject;
            
            // 과목 데이터가 없으면 초기화
            if (!gameState.subjects[currentSubject]) {
                gameState.subjects[currentSubject] = {
                    progress: {},
                    level: 1,
                    score: 0,
                    currentDifficulty: 1,
                    totalCorrect: 0,
                    totalIncorrect: 0
                };
            }
            
            // 과목별 진행도 로드
            userProgress = { ...gameState.subjects[currentSubject].progress };
            currentDifficulty = gameState.subjects[currentSubject].currentDifficulty || 1;
            
            console.log(`${currentSubject} 과목 진행도 로드됨:`, gameState.subjects[currentSubject]);
        }
        
        // 과목별 UI 업데이트
        function updateSubjectUI() {
            const currentSubject = gameState.currentSubject;
            const subjectData = gameState.subjects[currentSubject];
            
            // 과목 이름 표시
            const gameTitle = document.querySelector('#game-page h2');
            if (gameTitle) {
                const subjectNames = {
                    'english': '영어 학습 🇬🇧',
                    'social': '사회 학습 🏛️'
                };
                gameTitle.textContent = subjectNames[currentSubject] || '학습 게임';
            }
            
            // 과목별 통계 업데이트
            if (subjectData) {
                document.getElementById('word-correct').textContent = subjectData.totalCorrect || 0;
                document.getElementById('word-incorrect').textContent = subjectData.totalIncorrect || 0;
                
                const total = (subjectData.totalCorrect || 0) + (subjectData.totalIncorrect || 0);
                const accuracy = total > 0 ? Math.round(((subjectData.totalCorrect || 0) / total) * 100) : 0;
                document.getElementById('word-accuracy').textContent = accuracy;
            }
        }
        
        // 과목별 파일 경로 생성
        function getSubjectFilePath(level) {
            const currentSubject = gameState.currentSubject;
            return `./subjects/${currentSubject}/level${level}.json`;
        }
        
        // 과목별 단어 ID 생성
        function generateSubjectWordId(korean, english) {
            const currentSubject = gameState.currentSubject;
            const cleanKorean = korean.replace(/[^가-힣a-zA-Z]/g, '');
            return `${currentSubject}_${cleanKorean}-${english.toLowerCase()}`;
        }

        // ==================== 랜덤 이벤트 시스템 ====================
        
        // 랜덤 이벤트 체크 (정답 후 5% 확률로 발생)
        function checkRandomEvent() {
            // 활성 버프 정리 (만료된 것들 제거)
            if (gameState.activeBuffs) {
                gameState.activeBuffs = gameState.activeBuffs.filter(buff => buff.endTime > Date.now());
            }
            
            const eventChance = Math.random();
            
            if (eventChance < 0.05) { // 5% 확률
                triggerRandomEvent();
            }
        }
        
        // 랜덤 이벤트 실행
        function triggerRandomEvent() {
            const events = [
                {
                    type: 'golden_animal',
                    chance: 0.3,
                    execute: () => showGoldenAnimalEvent()
                },
                {
                    type: 'coin_rain',
                    chance: 0.4,
                    execute: () => showCoinRainEvent()
                },
                {
                    type: 'super_rare_encounter',
                    chance: 0.2,
                    execute: () => showSuperRareEncounter()
                },
                {
                    type: 'mystery_box',
                    chance: 0.1,
                    execute: () => showMysteryBoxEvent()
                }
            ];
            
            const rand = Math.random();
            let cumulative = 0;
            
            for (const event of events) {
                cumulative += event.chance;
                if (rand <= cumulative) {
                    event.execute();
                    break;
                }
            }
        }
        
        // 황금 동물 등장 이벤트
        function showGoldenAnimalEvent() {
            // 랜덤 동물 선택
            const randomAnimal = animalTypes[Math.floor(Math.random() * animalTypes.length)];
            
            const modalHtml = `
                <div id="event-modal" class="modal" style="display: flex; z-index: 2500;">
                    <div class="modal-content" style="background: linear-gradient(135deg, #FFD700, #FFA500); color: #8B4513; text-align: center; animation: sparkleEffect 0.8s ease-out;">
                        <span class="close-btn" onclick="closeEventModal()" style="color: #8B4513;">&times;</span>
                        <h2 style="margin-bottom: 20px; font-size: 2rem;">✨ 황금 동물 발견! ✨</h2>
                        <div style="font-size: 6rem; margin: 20px 0; filter: drop-shadow(0 0 10px gold);">
                            ${randomAnimal.emoji}
                        </div>
                        <div style="font-size: 1.5rem; margin-bottom: 15px;">
                            황금빛으로 빛나는 <strong>${randomAnimal.name}</strong>을(를) 발견했습니다!
                        </div>
                        <div style="font-size: 1.2rem; margin-bottom: 25px;">
                            특별한 이름: "<strong>${randomAnimal.specialName}</strong>"
                        </div>
                        <div style="margin-top: 25px;">
                            <button onclick="claimGoldenAnimal('${randomAnimal.name}')" style="background: white; color: #FF69B4; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer; margin: 5px;">
                                💖 수집하기 (+100 보너스 코인!)
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            playMagicSound();
            createSparkleEffect();
        }
        
        // 코인 비 이벤트
        function showCoinRainEvent() {
            const bonusCoins = Math.floor(Math.random() * 100) + 50; // 50-150 코인
            
            const modalHtml = `
                <div id="event-modal" class="modal" style="display: flex; z-index: 2500;">
                    <div class="modal-content" style="background: linear-gradient(135deg, #87CEEB, #98FB98); color: #2C5530; text-align: center; animation: rewardPulse 0.6s ease-out;">
                        <span class="close-btn" onclick="closeEventModal()" style="color: #2C5530;">&times;</span>
                        <h2 style="margin-bottom: 20px; font-size: 2rem;">🌧️ 코인비가 내려요! 🌧️</h2>
                        <div style="font-size: 4rem; margin: 20px 0;">
                            💰🪙💰
                        </div>
                        <div style="font-size: 1.5rem; margin-bottom: 25px;">
                            하늘에서 코인이 쏟아집니다!<br>
                            <strong>+${bonusCoins}</strong> 코인을 획득했어요!
                        </div>
                        <div style="margin-top: 25px;">
                            <button onclick="claimCoinRain(${bonusCoins})" style="background: #32CD32; color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                                💰 코인 수집하기!
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            showCoinAnimation(bonusCoins);
        }
        
        // 초희귀 동물 조우 이벤트
        function showSuperRareEncounter() {
            // 희귀도 5 이상인 동물만 선택
            const rareAnimals = animalTypes.filter(animal => animal.rarity >= 5);
            const superRareAnimal = rareAnimals[Math.floor(Math.random() * rareAnimals.length)] || animalTypes[0];
            
            const modalHtml = `
                <div id="event-modal" class="modal" style="display: flex; z-index: 2500;">
                    <div class="modal-content" style="background: linear-gradient(135deg, #9370DB, #8A2BE2); color: white; text-align: center; animation: mysticalGlow 1s ease-out;">
                        <span class="close-btn" onclick="closeEventModal()">&times;</span>
                        <h2 style="margin-bottom: 20px; font-size: 2rem;">🔮 신비한 만남 🔮</h2>
                        <div style="font-size: 5rem; margin: 20px 0; text-shadow: 0 0 20px purple;">
                            ${superRareAnimal.emoji}
                        </div>
                        <div style="font-size: 1.5rem; margin-bottom: 15px;">
                            전설의 <strong>${superRareAnimal.name}</strong>이(가) 나타났습니다!
                        </div>
                        <div style="font-size: 1.1rem; margin-bottom: 20px; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 10px;">
                            희귀도: ⭐${superRareAnimal.rarity}<br>
                            특별한 이름: "${superRareAnimal.specialName}"
                        </div>
                        <div style="margin-top: 25px;">
                            <button onclick="claimSuperRareAnimal('${superRareAnimal.name}')" style="background: gold; color: purple; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                                🌟 전설의 동물 수집하기!
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            playMysticalSound();
        }
        
        // 신비한 상자 이벤트
        function showMysteryBoxEvent() {
            const modalHtml = `
                <div id="event-modal" class="modal" style="display: flex; z-index: 2500;">
                    <div class="modal-content" style="background: linear-gradient(135deg, #4B0082, #663399); color: white; text-align: center; animation: mysteryBox 1s ease-out;">
                        <span class="close-btn" onclick="closeEventModal()">&times;</span>
                        <h2 style="margin-bottom: 20px; font-size: 2rem;">📦 신비한 상자 발견! 📦</h2>
                        <div style="font-size: 4rem; margin: 20px 0; cursor: pointer;" onclick="openMysteryBox()">
                            📦✨
                        </div>
                        <div style="font-size: 1.3rem; margin-bottom: 25px;">
                            무엇이 들어있을까요?<br>
                            상자를 클릭해서 열어보세요!
                        </div>
                        <div style="margin-top: 25px;">
                            <button onclick="openMysteryBox()" style="background: #FF69B4; color: white; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.2rem; font-weight: bold; cursor: pointer;">
                                🔓 상자 열기!
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // 이벤트 모달 닫기
        window.closeEventModal = function() {
            const modal = document.getElementById('event-modal');
            if (modal) {
                modal.remove();
            }
        }
        
        // 황금 동물 수집하기
        window.claimGoldenAnimal = function(animalName) {
            addAnimal(animalName, 2); // 레벨 2로 추가
            gameState.coins += 100; // 보너스 코인
            updateUI();
            updateAnimalCollection();
            saveCurrentUserData();
            closeEventModal();
            
            showSuccessMessage(`✨ 황금 ${animalName}을(를) 수집했습니다! (+100 코인)`);
        }
        
        // 코인비 수집하기
        window.claimCoinRain = function(amount) {
            gameState.coins += amount;
            updateUI();
            saveCurrentUserData();
            closeEventModal();
            
            showSuccessMessage(`🌧️ ${amount} 코인을 수집했습니다!`);
        }
        
        // 초희귀 동물 수집하기
        window.claimSuperRareAnimal = function(animalName) {
            addAnimal(animalName, 3); // 레벨 3으로 추가
            updateUI();
            updateAnimalCollection();
            saveCurrentUserData();
            closeEventModal();
            
            showSuccessMessage(`🔮 전설의 ${animalName}을(를) 수집했습니다!`);
        }
        
        // 신비한 상자 열기
        window.openMysteryBox = function() {
            const rewards = [
                { type: 'coins', amount: 200, message: '💰 200 코인!' },
                { type: 'random_animal', message: '🐾 랜덤 동물!' },
                { type: 'level_boost', message: '⬆️ 모든 동물 레벨업!' },
                { type: 'rare_buff', message: '🌟 희귀 동물 확률 증가 버프!' }
            ];
            
            const reward = rewards[Math.floor(Math.random() * rewards.length)];
            
            // 보상 적용
            if (reward.type === 'coins') {
                gameState.coins += reward.amount;
            } else if (reward.type === 'random_animal') {
                const randomAnimal = animalTypes[Math.floor(Math.random() * animalTypes.length)];
                addAnimal(randomAnimal.name, 1);
            } else if (reward.type === 'level_boost') {
                Object.keys(gameState.animals).forEach(animalName => {
                    if (gameState.animals[animalName].animalLevel < 5) {
                        gameState.animals[animalName].animalLevel++;
                    }
                });
            } else if (reward.type === 'rare_buff') {
                const buffEndTime = Date.now() + (6 * 60 * 60 * 1000); // 6시간
                gameState.activeBuffs = gameState.activeBuffs || [];
                gameState.activeBuffs.push({
                    type: 'rare_animal_chance_3x',
                    endTime: buffEndTime
                });
            }
            
            updateUI();
            updateAnimalCollection();
            saveCurrentUserData();
            closeEventModal();
            
            showSuccessMessage(`📦 ${reward.message}`);
        }
        
        // 성공 메시지 표시
        function showSuccessMessage(message) {
            const alert = document.createElement('div');
            alert.className = 'new-animal-alert';
            alert.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 3000;
                background: linear-gradient(45deg, #32CD32, #228B22);
                color: white; padding: 20px; border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: slideInRight 0.5s ease-out;
                max-width: 300px; text-align: center; font-weight: bold;
            `;
            alert.innerHTML = message;
            document.body.appendChild(alert);
            
            setTimeout(() => alert.remove(), 3000);
        }
        
        // 반짝이는 효과 생성
        function createSparkleEffect() {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'sparkle-particle';
                    sparkle.style.left = Math.random() * window.innerWidth + 'px';
                    sparkle.style.top = Math.random() * window.innerHeight + 'px';
                    sparkle.style.background = ['gold', 'silver', 'orange', 'yellow'][Math.floor(Math.random() * 4)];
                    document.body.appendChild(sparkle);
                    
                    setTimeout(() => sparkle.remove(), 1500);
                }, i * 100);
            }
        }
        
        // 마법 소리 효과
        function playMagicSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const frequencies = [523, 659, 784, 1047, 1319]; // 마법같은 멜로디
                
                frequencies.forEach((freq, index) => {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                        oscillator.type = 'triangle';
                        
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.4);
                    }, index * 150);
                });
            } catch (error) {
                console.log('마법 소리 재생 불가:', error);
            }
        }
        
        // 신비한 소리 효과
        function playMysticalSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const frequencies = [220, 277, 330, 440]; // 신비로운 화음
                
                frequencies.forEach((freq, index) => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
                    oscillator.type = 'sawtooth';
                    
                    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime + index * 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
                    
                    oscillator.start(audioContext.currentTime + index * 0.1);
                    oscillator.stop(audioContext.currentTime + 2);
                });
            } catch (error) {
                console.log('신비한 소리 재생 불가:', error);
            }
        }

        // ==================== 향상된 시각적 피드백 시스템 ====================
        
        // 정답 시 화려한 효과
        function showCorrectAnswerEffects() {
            // 파티클 버스트
            createParticleBurst('correct');
            
            // 성공 사운드
            playSuccessSound();
            
            // 화면 진동 효과 (모바일)
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        }
        
        // 오답 시 피드백 효과
        function showIncorrectAnswerEffects() {
            // 화면 흔들림 효과
            document.body.style.animation = 'incorrectShake 0.6s ease-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 600);
            
            // 오답 사운드
            playErrorSound();
            
            // 약간의 진동 (모바일)
            if (navigator.vibrate) {
                navigator.vibrate([200]);
            }
        }
        
        // 파티클 버스트 생성
        function createParticleBurst(type = 'correct') {
            const colors = type === 'correct' 
                ? ['#32CD32', '#90EE90', '#00FF00', '#ADFF2F']
                : ['#FF6B6B', '#FF69B4', '#FF4500', '#FFB6C1'];
            
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.style.cssText = `
                        position: fixed;
                        width: 8px; height: 8px;
                        background: ${colors[Math.floor(Math.random() * colors.length)]};
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 4000;
                        left: ${window.innerWidth / 2}px;
                        top: ${window.innerHeight / 2}px;
                        animation: particleBurst ${1 + Math.random()}s ease-out forwards;
                    `;
                    
                    // 랜덤 방향으로 움직이는 CSS 애니메이션 동적 생성
                    const angle = (Math.PI * 2 * i) / 15;
                    const distance = 100 + Math.random() * 100;
                    const endX = Math.cos(angle) * distance;
                    const endY = Math.sin(angle) * distance;
                    
                    const keyframes = `
                        @keyframes particleBurst {
                            to { 
                                transform: translate(${endX}px, ${endY}px) scale(0); 
                                opacity: 0;
                            }
                        }
                    `;
                    
                    // 동적 스타일 추가
                    const style = document.createElement('style');
                    style.textContent = keyframes;
                    document.head.appendChild(style);
                    
                    document.body.appendChild(particle);
                    
                    setTimeout(() => {
                        particle.remove();
                        style.remove();
                    }, 2000);
                }, i * 50);
            }
        }
        
        // 성공 사운드
        function playSuccessSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // 상승하는 멜로디
                const melody = [
                    { freq: 523.25, time: 0 },      // C
                    { freq: 659.25, time: 0.1 },    // E  
                    { freq: 783.99, time: 0.2 },    // G
                    { freq: 1046.50, time: 0.3 }    // High C
                ];
                
                melody.forEach(note => {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                        oscillator.type = 'sine';
                        
                        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.2);
                    }, note.time * 1000);
                });
            } catch (error) {
                console.log('성공 사운드 재생 불가:', error);
            }
        }
        
        // 오답 사운드
        function playErrorSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // 하강하는 불협화음
                const frequencies = [400, 350, 300]; 
                
                frequencies.forEach((freq, index) => {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                        oscillator.type = 'sawtooth';
                        
                        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.3);
                    }, index * 100);
                });
            } catch (error) {
                console.log('오답 사운드 재생 불가:', error);
            }
        }
        
        // 레벨업 축하 효과
        function showLevelUpEffects() {
            // 황금 파티클 폭발
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.style.cssText = `
                        position: fixed;
                        width: 12px; height: 12px;
                        background: linear-gradient(45deg, #FFD700, #FFA500);
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 5000;
                        left: ${Math.random() * window.innerWidth}px;
                        top: 20px;
                        animation: levelUpBurst 2s ease-out forwards;
                        box-shadow: 0 0 10px gold;
                    `;
                    document.body.appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 2000);
                }, i * 100);
            }
            
            // 레벨업 사운드
            playLevelUpSound();
            
            // 강한 진동 (모바일)
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        }
        
        // 레벨업 사운드
        function playLevelUpSound() {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // 팡파르 같은 멜로디
                const fanfare = [
                    { freq: 523.25, time: 0, duration: 0.2 },
                    { freq: 659.25, time: 0.1, duration: 0.2 },
                    { freq: 783.99, time: 0.2, duration: 0.2 },
                    { freq: 1046.50, time: 0.3, duration: 0.4 },
                    { freq: 1318.51, time: 0.5, duration: 0.6 }
                ];
                
                fanfare.forEach(note => {
                    setTimeout(() => {
                        const oscillator = audioContext.createOscillator();
                        const gainNode = audioContext.createGain();
                        
                        oscillator.connect(gainNode);
                        gainNode.connect(audioContext.destination);
                        
                        oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
                        oscillator.type = 'triangle';
                        
                        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.duration);
                        
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + note.duration);
                    }, note.time * 1000);
                });
            } catch (error) {
                console.log('레벨업 사운드 재생 불가:', error);
            }
        }
        
        // ==================== 개인화된 학습 시스템 ====================
        
        // 사용자 약점 분석
        function analyzeUserWeaknesses() {
            const weaknesses = [];
            const strengths = [];
            
            Object.keys(userProgress).forEach(wordId => {
                const progress = userProgress[wordId];
                const totalAttempts = progress.correct + progress.incorrect;
                
                if (totalAttempts >= 3) { // 최소 3번 이상 시도한 단어만 분석
                    const accuracy = progress.correct / totalAttempts;
                    
                    if (accuracy < 0.6) { // 정답률 60% 미만은 약점
                        weaknesses.push({
                            wordId: wordId,
                            accuracy: accuracy,
                            attempts: totalAttempts,
                            lastSeen: progress.lastSeen
                        });
                    } else if (accuracy > 0.8) { // 정답률 80% 이상은 강점
                        strengths.push({
                            wordId: wordId,
                            accuracy: accuracy,
                            attempts: totalAttempts
                        });
                    }
                }
            });
            
            // 약점 단어를 정답률 순으로 정렬
            weaknesses.sort((a, b) => a.accuracy - b.accuracy);
            
            return { weaknesses, strengths };
        }
        
        // 맞춤형 문제 생성
        function generatePersonalizedQuiz() {
            // 현재 과목의 미션이 완료되었는지 확인
            if (window.gameState.dailyMissions[window.gameState.currentSubject] && 
                window.gameState.dailyMissions[window.gameState.currentSubject].completed) {
                
                // 자유 학습 모드인지 확인
                if (!window.gameState.freeStudyMode) {
                    // 미션 완료 메시지 및 선택 옵션 표시
                    const questionElement = document.getElementById('quiz-question') || document.getElementById('english-question');
                    const optionsContainer = document.getElementById('quiz-options') || document.getElementById('english-options');
                    const feedbackElement = document.getElementById('quiz-feedback') || document.getElementById('feedback');
                    
                    if (questionElement) questionElement.textContent = '🎉 오늘의 미션을 완료했습니다!';
                    if (optionsContainer) {
                        optionsContainer.innerHTML = `
                            <div style="display: flex; flex-direction: column; gap: 15px; max-width: 400px; margin: 0 auto;">
                                <button class="continue-study-btn" onclick="enableFreeStudyMode()" 
                                    style="background: linear-gradient(45deg, #32CD32, #228B22); color: white; border: none; padding: 15px 25px; border-radius: 15px; font-size: 1.1em; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                                    📚 계속 공부하기 (자유 학습)
                                </button>
                                <button class="back-btn" onclick="showPage('game', null)" 
                                    style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; padding: 15px 25px; border-radius: 15px; font-size: 1.1em; font-weight: bold; cursor: pointer; transition: all 0.3s ease;">
                                    🏠 대시보드로 돌아가기
                                </button>
                            </div>
                        `;
                    }
                    if (feedbackElement) {
                        feedbackElement.textContent = '미션을 완료했어요! 더 공부하거나 다른 과목에 도전해보세요! 💪';
                        feedbackElement.className = 'feedback success';
                    }
                    
                    return;
                }
                // 자유 학습 모드에서는 계속 진행
            }
            
            const analysis = analyzeUserWeaknesses();
            
            // 70% 확률로 약점 단어 출제, 30% 확률로 새 단어
            const shouldUseWeakness = Math.random() < 0.7 && analysis.weaknesses.length > 0;
            
            if (shouldUseWeakness) {
                generateWeaknessQuiz(analysis.weaknesses);
            } else {
                generateRegularQuiz();
            }
        }
        
        // 약점 문제 생성
        async function generateWeaknessQuiz(weaknesses) {
            // 가장 약한 단어 3개 중에서 랜덤 선택
            const topWeaknesses = weaknesses.slice(0, Math.min(3, weaknesses.length));
            const selectedWeakness = topWeaknesses[Math.floor(Math.random() * topWeaknesses.length)];
            
            // 해당 단어 정보 찾기
            const wordData = await findWordById(selectedWeakness.wordId);
            if (!wordData) {
                generateRegularQuiz();
                return;
            }
            
            // currentWordData 설정 (개인화 학습을 위함)
            currentWordData = {
                id: selectedWeakness.wordId,
                korean: wordData.korean,
                english: wordData.english,
                options: wordData.options,
                difficulty: 'weakness_review',
                source: 'weakness'
            };
            
            currentEnglishQuiz = {
                korean: wordData.korean,
                answer: wordData.english,
                options: wordData.options,
                isWeakness: true,
                accuracy: selectedWeakness.accuracy
            };
            
            displayQuiz();
            
            // 약점 문제임을 사용자에게 알림
            showWeaknessHint(selectedWeakness.accuracy);
        }
        
        // 단어 ID로 단어 찾기
        async function findWordById(wordId) {
            for (let level = 1; level <= 3; level++) {
                try {
                    const response = await fetch(getSubjectFilePath(level));
                    const data = await response.json();
                    
                    const word = data.words.find(w => {
                        // 과목별 ID 생성 방식에 맞춰 검색
                        let expectedId;
                        if (gameState.currentSubject === 'social') {
                            const cleanQuestion = (w.question || '').replace(/[^가-힣a-zA-Z]/g, '');
                            const answer = w.options ? w.options[w.answer] : '';
                            expectedId = generateSubjectWordId(w.question, answer);
                        } else {
                            expectedId = generateSubjectWordId(w.korean, w.english);
                        }
                        return expectedId === wordId;
                    });
                    
                    if (word) return word;
                } catch (error) {
                    console.error(`Level ${level} 단어 파일 로드 실패:`, error);
                }
            }
            return null;
        }
        
        // 일반 문제 생성 (기존 로직)
        function generateRegularQuiz() {
            generateEnglishQuiz(); // 기존 함수 호출 (모든 과목 호환)
        }
        
        // 약점 힌트 표시
        function showWeaknessHint(accuracy) {
            const accuracyPercent = Math.round(accuracy * 100);
            
            const hint = document.createElement('div');
            hint.style.cssText = `
                position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
                background: linear-gradient(45deg, #FF6B6B, #FF8E8E);
                color: white; padding: 10px 20px; border-radius: 20px;
                font-weight: bold; z-index: 3000;
                animation: slideInDown 0.5s ease-out;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            hint.innerHTML = `🎯 약점 연습: 정답률 ${accuracyPercent}% | 집중해서 풀어보세요!`;
            
            document.body.appendChild(hint);
            
            setTimeout(() => hint.remove(), 3000);
        }
        
        // 학습 성과 분석 리포트
        function generateLearningReport() {
            const analysis = analyzeUserWeaknesses();
            const totalWords = Object.keys(userProgress).length;
            
            if (totalWords < 5) {
                return "더 많은 단어를 학습한 후 분석이 가능합니다.";
            }
            
            const averageAccuracy = Object.values(userProgress).reduce((sum, progress) => {
                const total = progress.correct + progress.incorrect;
                return sum + (total > 0 ? progress.correct / total : 0);
            }, 0) / totalWords;
            
            const report = {
                totalWords: totalWords,
                averageAccuracy: Math.round(averageAccuracy * 100),
                weaknesses: analysis.weaknesses.length,
                strengths: analysis.strengths.length,
                recommendations: generateRecommendations(analysis)
            };
            
            return report;
        }
        
        // 단어 ID 생성 (일관성 있는 ID 생성)
        function generateWordId(korean, english) {
            const cleanKorean = korean.replace(/[^가-힣a-zA-Z]/g, '');
            return `${cleanKorean}-${english.toLowerCase()}`;
        }
        
        // 개인화된 추천 생성
        function generateRecommendations(analysis) {
            const recommendations = [];
            
            if (analysis.weaknesses.length > 5) {
                recommendations.push("🔍 약점 단어가 많습니다. 매일 조금씩 복습해보세요!");
            }
            
            if (analysis.strengths.length > analysis.weaknesses.length) {
                recommendations.push("👏 잘하고 있어요! 새로운 단어에 도전해보세요!");
            }
            
            const recentWeaknesses = analysis.weaknesses.filter(w => {
                const daysDiff = (new Date() - new Date(w.lastSeen)) / (1000 * 60 * 60 * 24);
                return daysDiff <= 7;
            });
            
            if (recentWeaknesses.length > 0) {
                recommendations.push("📚 최근에 틀린 단어들을 집중 복습하세요!");
            }
            
            return recommendations;
        }
        
        // 학습 리포트 모달 표시
        function showLearningReport() {
            const report = generateLearningReport();
            
            if (typeof report === 'string') {
                alert(report);
                return;
            }
            
            const modalHtml = `
                <div id="learning-report-modal" class="modal" style="display: flex; z-index: 2000;">
                    <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; max-width: 500px;">
                        <span class="close-btn" onclick="closeLearningReportModal()">&times;</span>
                        <h2 style="margin-bottom: 25px; font-size: 2rem;">📊 나의 학습 분석 📊</h2>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 15px;">
                                <div style="font-size: 2rem; font-weight: bold;">${report.totalWords}</div>
                                <div>학습한 단어</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 15px;">
                                <div style="font-size: 2rem; font-weight: bold;">${report.averageAccuracy}%</div>
                                <div>평균 정답률</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 15px;">
                                <div style="font-size: 2rem; font-weight: bold; color: #FFB6C1;">${report.weaknesses}</div>
                                <div>약점 단어</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 15px;">
                                <div style="font-size: 2rem; font-weight: bold; color: #90EE90;">${report.strengths}</div>
                                <div>완벽한 단어</div>
                            </div>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 15px; margin: 20px 0; text-align: left;">
                            <h3 style="margin-bottom: 15px; text-align: center;">💡 맞춤 추천</h3>
                            ${report.recommendations.map(rec => `<p style="margin: 10px 0;">${rec}</p>`).join('')}
                        </div>
                        
                        <button onclick="closeLearningReportModal()" style="background: white; color: #667eea; border: none; padding: 15px 30px; border-radius: 25px; font-size: 1.1rem; font-weight: bold; cursor: pointer;">
                            확인
                        </button>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
        
        // 학습 리포트 모달 닫기
        window.closeLearningReportModal = function() {
            const modal = document.getElementById('learning-report-modal');
            if (modal) {
                modal.remove();
            }
        }
        
        // 동물 수집 시 특별 효과
        function showAnimalCollectedEffects(animal) {
            // 동물별 색상 파티클
            const animalColors = {
                '🐶': ['#8B4513', '#DEB887'],
                '🐱': ['#FF69B4', '#FFB6C1'], 
                '🐰': ['#FFFFFF', '#F5F5F5'],
                '기본': ['#32CD32', '#90EE90']
            };
            
            const colors = animalColors[animal.emoji] || animalColors['기본'];
            
            // 특별한 파티클 효과
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.innerHTML = animal.emoji;
                    particle.style.cssText = `
                        position: fixed;
                        font-size: 2rem;
                        pointer-events: none;
                        z-index: 4500;
                        left: ${window.innerWidth / 2 - 20}px;
                        top: ${window.innerHeight / 2 - 20}px;
                        animation: animalCollectEffect 1.5s ease-out forwards;
                        filter: drop-shadow(0 0 10px ${colors[0]});
                    `;
                    
                    // 동물 수집 애니메이션
                    const collectKeyframes = `
                        @keyframes animalCollectEffect {
                            0% { 
                                transform: scale(0) rotate(0deg); 
                                opacity: 1; 
                            }
                            50% { 
                                transform: scale(1.5) rotate(180deg); 
                                opacity: 0.8; 
                            }
                            100% { 
                                transform: scale(0.5) rotate(360deg) translateY(-100px); 
                                opacity: 0; 
                            }
                        }
                    `;
                    
                    const style = document.createElement('style');
                    style.textContent = collectKeyframes;
                    document.head.appendChild(style);
                    
                    document.body.appendChild(particle);
                    
                    setTimeout(() => {
                        particle.remove();
                        style.remove();
                    }, 1500);
                }, i * 100);
            }
        }

        // ==================== 플레이 시간 및 농장 방문 함수 ====================
        
        // 플레이 시간을 사람이 읽기 쉬운 형태로 변환
        function formatPlayTime(minutes) {
            if (minutes < 60) {
                return `${Math.floor(minutes)}분`;
            } else if (minutes < 1440) {
                const hours = Math.floor(minutes / 60);
                const mins = Math.floor(minutes % 60);
                return `${hours}시간 ${mins}분`;
            } else {
                const days = Math.floor(minutes / 1440);
                const hours = Math.floor((minutes % 1440) / 60);
                return `${days}일 ${hours}시간`;
            }
        }
        
        // 현재 세션 플레이 시간 계산
        function updateSessionPlayTime() {
            if (sessionStartTime) {
                const sessionMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
                return totalPlayTimeMinutes + sessionMinutes;
            }
            return totalPlayTimeMinutes;
        }
        
        // 농장 방문 모달 열기
        window.visitUserFarm = async function(userName) {
            try {
                const userData = await loadUserData(userName);
                if (!userData) {
                    alert('사용자 데이터를 불러올 수 없습니다.');
                    return;
                }
                
                document.getElementById('farm-owner-info').textContent = `${userName}님의 농장`;
                
                const visitFarmGrid = document.getElementById('visit-farm-grid');
                visitFarmGrid.innerHTML = '';
                
                // 48개 셀 생성
                for (let i = 0; i < 48; i++) {
                    const cell = document.createElement('div');
                    cell.className = 'farm-cell';
                    
                    const farmItem = userData.farm?.layout?.[i];
                    if (farmItem) {
                        cell.innerHTML = `<span class="${farmItem.isAnimal ? 'placed-animal' : ''}">${farmItem.emoji}</span>`;
                    }
                    
                    visitFarmGrid.appendChild(cell);
                }
                
                document.getElementById('farm-visit-modal').style.display = 'flex';
                
            } catch (error) {
                console.error('농장 방문 오류:', error);
                alert('농장을 불러오는 중 오류가 발생했습니다.');
            }
        }
        
        // 농장 방문 모달 닫기
        window.closeFarmVisitModal = function() {
            document.getElementById('farm-visit-modal').style.display = 'none';
        }

        // ==================== 핵심 게임 함수 ====================
        
        // 난이도 선택 함수
        window.selectDifficulty = function(level) {
            currentDifficulty = level;
            
            // 모든 버튼에서 active 클래스 제거
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 선택된 버튼에 active 클래스 추가
            const selectedBtn = document.querySelector(`[data-level="${level}"]`);
            if (selectedBtn) {
                selectedBtn.classList.add('active');
            }
            
            // 복습 모드 스타일 적용/제거
            const gameContainer = document.querySelector('.game-container');
            if (level === 'review') {
                gameContainer.classList.add('review-mode');
            } else {
                gameContainer.classList.remove('review-mode');
            }
            
            // 새로운 문제 생성
            generateEnglishQuiz();
        }

        // 단어 발음 재생 함수
        function speakWord(word) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(word);
                const voices = window.speechSynthesis.getVoices();
                let englishVoice = voices.find(voice => voice.lang.startsWith('en-US')) || voices.find(voice => voice.lang.startsWith('en'));
                if (englishVoice) {
                    utterance.voice = englishVoice;
                }
                utterance.pitch = 1;
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
            } else {
                alert("죄송합니다. 사용 중인 브라우저에서는 음성 재생을 지원하지 않습니다.");
            }
        }

        // 영어 퀴즈 생성 (새로운 시스템)
        async function generateEnglishQuiz() {
            console.log('generateEnglishQuiz 호출됨, 현재 과목:', window.gameState.currentSubject);
            
            if (isLoadingWord) return;
            
            isLoadingWord = true;
            
            // UI 초기화 - 퀴즈 페이지와 메인 페이지 모두 지원
            const questionElement = document.getElementById('quiz-question') || document.getElementById('english-question');
            const optionsContainer = document.getElementById('quiz-options') || document.getElementById('english-options');
            const speakButton = document.getElementById('speak-button');
            const feedbackElement = document.getElementById('quiz-feedback') || document.getElementById('feedback');
            
            questionElement.textContent = '단어를 불러오는 중...';
            optionsContainer.innerHTML = '';
            speakButton.style.display = 'none';
            feedbackElement.textContent = '';
            feedbackElement.className = 'feedback';
            
            try {
                if (currentDifficulty === 'review') {
                    await loadReviewWord();
                } else {
                    await loadWordForDifficulty(currentDifficulty);
                }
                
                console.log('단어 로드 완료:', currentWordData);
                displayCurrentWord();
                updateWordStats();
                
            } catch (error) {
                console.error('Error generating quiz:', error);
                questionElement.textContent = '단어를 불러오는 중 오류가 발생했습니다.';
                
                // 최종 폴백: 하드코딩된 단어 사용
                const fallbackWords = [
                    { question: '사과', answer: 'apple', options: ['apple', 'banana', 'orange', 'grape'] },
                    { question: '고양이', answer: 'cat', options: ['cat', 'dog', 'bird', 'fish'] },
                    { question: '책', answer: 'book', options: ['book', 'pen', 'paper', 'desk'] }
                ];
                const fallbackQuiz = fallbackWords[0];
                
                currentWordData = {
                    id: 'emergency_fallback',
                    korean: fallbackQuiz.question,
                    english: fallbackQuiz.answer,
                    options: fallbackQuiz.options,
                    difficulty: currentDifficulty,
                    source: 'fallback'
                };
                currentEnglishQuiz = {
                    answer: currentWordData.english,
                    wordId: currentWordData.id
                };
                
                console.log('긴급 폴백 단어 사용:', currentWordData);
                displayCurrentWord();
            } finally {
                isLoadingWord = false;
            }
        }

        // 난이도별 단어 로드
        async function loadWordForDifficulty(difficulty) {
            try {
                const filePath = getSubjectFilePath(difficulty);
                console.log(`레벨 ${difficulty} 단어 JSON 파일 로딩 시작... 파일 경로: ${filePath}`);
                
                const response = await fetch(filePath);
                
                if (!response.ok) {
                    throw new Error(`JSON 파일 로드 실패: ${response.status}`);
                }
                
                const data = await response.json();
                const words = data.words;
                
                if (!words || words.length === 0) {
                    throw new Error('JSON 파일에 단어가 없습니다');
                }
                
                // 최근 출제된 문제를 피하면서 랜덤으로 단어 선택
                const recentQuestions = gameState.recentQuestions || [];
                const maxRecentQuestions = Math.min(words.length - 1, 5); // 최대 5개까지 기억
                
                let availableWords = words;
                
                // 충분한 문제가 있고 최근 문제가 있다면 제외
                if (words.length > maxRecentQuestions && recentQuestions.length > 0) {
                    availableWords = words.filter((word, index) => {
                        const questionId = word.question || word.korean || index;
                        return !recentQuestions.includes(questionId);
                    });
                    
                    // 모든 문제가 최근 출제되었다면 최근 기록 초기화
                    if (availableWords.length === 0) {
                        gameState.recentQuestions = [];
                        availableWords = words;
                    }
                }
                
                // 개선된 랜덤 선택 (시간 기반 시드 사용)
                const now = Date.now();
                const randomSeed = (now % 1000) * Math.random();
                const randomIndex = Math.floor(randomSeed * availableWords.length / 1000);
                const randomWord = availableWords[randomIndex];
                
                // 선택된 문제를 최근 문제 목록에 추가
                if (!gameState.recentQuestions) gameState.recentQuestions = [];
                const questionId = randomWord.question || randomWord.korean || words.indexOf(randomWord);
                gameState.recentQuestions.push(questionId);
                
                // 최근 문제 목록 크기 제한
                if (gameState.recentQuestions.length > maxRecentQuestions) {
                    gameState.recentQuestions.shift(); // 가장 오래된 것 제거
                }
                
                currentWordData = {
                    id: generateSubjectWordId(randomWord.korean || randomWord.question, randomWord.english || randomWord.options[randomWord.answer]),
                    korean: randomWord.korean || randomWord.question,
                    english: randomWord.english || randomWord.options[randomWord.answer],
                    options: randomWord.options,
                    difficulty: difficulty,
                    source: 'json',
                    answer: randomWord.answer,
                    explanation: randomWord.explanation
                };
                
                currentEnglishQuiz = {
                    answer: currentWordData.english,
                    wordId: currentWordData.id
                };
                
                console.log('JSON에서 단어 로드 성공:', currentWordData);
                
            } catch (error) {
                console.error('JSON 단어 로드 실패, 폴백 사용:', error);
                
                // 폴백: 기존 하드코딩된 단어 사용
                const fallbackWords = [
                    { question: '사과', answer: 'apple', options: ['apple', 'banana', 'orange', 'grape'] },
                    { question: '고양이', answer: 'cat', options: ['cat', 'dog', 'bird', 'fish'] },
                    { question: '책', answer: 'book', options: ['book', 'pen', 'paper', 'desk'] },
                    { question: '집', answer: 'house', options: ['house', 'school', 'park', 'store'] },
                    { question: '물', answer: 'water', options: ['water', 'juice', 'milk', 'tea'] }
                ];
                
                const fallbackQuiz = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
                
                currentWordData = {
                    id: 'fallback_' + Date.now(),
                    korean: fallbackQuiz.question,
                    english: fallbackQuiz.answer,
                    options: fallbackQuiz.options,
                    difficulty: difficulty,
                    source: 'fallback'
                };
                
                currentEnglishQuiz = {
                    answer: currentWordData.english,
                    wordId: currentWordData.id
                };
                
                console.log('폴백 단어 사용:', currentWordData);
            }
        }

        // 복습용 단어 로드
        async function loadReviewWord() {
            // 로컬 진행도에서 틀린 단어들 찾기
            const strugglingWords = [];
            
            for (const [wordId, progress] of Object.entries(userProgress)) {
                const total = progress.correct + progress.incorrect;
                if (total >= 3 && progress.incorrect > progress.correct) {
                    strugglingWords.push(wordId);
                }
            }
            
            if (strugglingWords.length === 0) {
                alert('복습할 단어가 없습니다! 더 많은 문제를 풀어보세요.');
                await loadWordForDifficulty(1);
                return;
            }
            
            // 복습 단어가 있으면 쉬운 레벨부터 JSON에서 로드
            console.log('복습 모드: JSON 파일에서 단어 로드');
            await loadWordForDifficulty(1); // 복습할 때는 쉬운 단어부터
        }
    
        // 현재 단어 표시
        function displayCurrentWord() {
            if (!currentWordData) return;
            
            const questionElement = document.getElementById('quiz-question') || document.getElementById('english-question');
            const optionsContainer = document.getElementById('quiz-options') || document.getElementById('english-options');
            const speakButton = document.getElementById('speak-button');
            const wordSourceElement = document.getElementById('word-source');
            const sourceBadge = document.getElementById('source-badge');
            
            // 질문 표시 (과목에 따라 다름)
            if (gameState.currentSubject === 'english') {
                questionElement.textContent = `"${currentWordData.korean}"`; // 영어 과목
                speakButton.style.display = 'inline';
                speakButton.onclick = () => speakWord(currentEnglishQuiz.answer);
            } else {
                // 사회, 수학, 상식 과목: 직접 질문 표시
                questionElement.textContent = currentWordData.korean; 
                speakButton.style.display = 'none'; // 음성 기능 없음
            }
            
            // 단어 출처 표시
            wordSourceElement.style.display = 'block';
            
            if (currentWordData.source === 'json') {
                sourceBadge.className = 'source-badge json-file';
                sourceBadge.innerHTML = '📁 JSON 파일';
                sourceBadge.title = 'GitHub Pages JSON 파일에서 로드된 단어입니다';
            } else if (currentWordData.source === 'ai') {
                sourceBadge.className = 'source-badge ai-generated';
                sourceBadge.innerHTML = '🤖 AI 생성';
                sourceBadge.title = 'Gemini AI가 생성한 단어입니다';
            } else if (currentWordData.source === 'fallback') {
                sourceBadge.className = 'source-badge fallback';
                sourceBadge.innerHTML = '🔄 대체 단어';
                sourceBadge.title = 'JSON 로드 실패로 대체된 단어입니다';
            } else {
                sourceBadge.className = 'source-badge hardcoded';
                sourceBadge.innerHTML = '📝 기본 단어';
                sourceBadge.title = '미리 준비된 단어입니다';
            }
            
            // 옵션 생성
            let finalOptions = [];
            
            if (currentWordData.options && currentWordData.options.length >= 4) {
                const correctAnswer = currentWordData.english;
                const wrongOptions = currentWordData.options.filter(opt => opt !== correctAnswer);
                const shuffledWrong = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3);
                finalOptions = [correctAnswer, ...shuffledWrong].sort(() => Math.random() - 0.5);
            } else {
                finalOptions = [...currentWordData.options].sort(() => Math.random() - 0.5);
            }
            
            console.log('표시할 옵션들:', finalOptions);
            
            optionsContainer.innerHTML = '';
            finalOptions.forEach(option => {
                const button = document.createElement('button');
                // 퀴즈 페이지에서는 기본 버튼 스타일, 메인 페이지에서는 영어 옵션 스타일 사용
                const isQuizPage = document.getElementById('quiz-page') && document.getElementById('quiz-page').classList.contains('active');
                button.className = isQuizPage ? 'quiz-option-btn' : 'english-option-btn';
                button.innerText = option;
                button.onclick = () => checkEnglishQuizAnswer(option);
                optionsContainer.appendChild(button);
            });
        }

        // 단어 통계 업데이트
        function updateWordStats() {
            if (!currentWordData || !currentWordData.id) return;
            
            const progress = userProgress[currentWordData.id] || { correct: 0, incorrect: 0 };
            const total = progress.correct + progress.incorrect;
            const accuracy = total > 0 ? Math.round((progress.correct / total) * 100) : 0;
            
            document.getElementById('word-correct').textContent = progress.correct;
            document.getElementById('word-incorrect').textContent = progress.incorrect;
            document.getElementById('word-accuracy').textContent = accuracy;
            document.getElementById('learning-stats').style.display = 'block';
        }

        // 영어 퀴즈 정답 확인 (새로운 시스템)
        async function checkEnglishQuizAnswer(selectedOption) {
            const optionsContainer = document.getElementById('quiz-options') || document.getElementById('english-options');
            optionsContainer.querySelectorAll('button').forEach(btn => {
                btn.disabled = true;
            });

            const feedback = document.getElementById('quiz-feedback') || document.getElementById('feedback');
            
            // 정답 체크 (과목에 따라 다름)
            let isCorrect = false;
            if (gameState.currentSubject === 'english') {
                // 영어 과목: 기존 방식 (텍스트 매칭)
                isCorrect = selectedOption === currentEnglishQuiz.answer;
            } else {
                // 사회, 수학, 상식 과목: selectedOption이 선택지 텍스트, answer는 인덱스
                const selectedIndex = currentWordData.options.indexOf(selectedOption);
                isCorrect = selectedIndex === currentWordData.answer;
            }
            
            // 학습 기록 업데이트
            if (currentWordData && currentWordData.id) {
                if (!userProgress[currentWordData.id]) {
                    userProgress[currentWordData.id] = { correct: 0, incorrect: 0, lastSeen: new Date() };
                }
                
                if (isCorrect) {
                    userProgress[currentWordData.id].correct++;
                    // 과목별 통계 업데이트
                    gameState.subjects[gameState.currentSubject].totalCorrect++;
                } else {
                    userProgress[currentWordData.id].incorrect++;
                    // 과목별 통계 업데이트
                    gameState.subjects[gameState.currentSubject].totalIncorrect++;
                }
                userProgress[currentWordData.id].lastSeen = new Date();
                
                // Firebase에 학습 기록 저장
                await saveUserProgress();
            }
            
            if (isCorrect) {
                // 영어 과목만 음성 재생
                if (gameState.currentSubject === 'english') {
                    speakWord(currentEnglishQuiz.answer);
                }
                
                // 난이도별 점수 계산
                let baseScore = 10;
                if (currentDifficulty === 2) baseScore = 20;
                else if (currentDifficulty === 3) baseScore = 30;
                else if (currentDifficulty === 'review') baseScore = 15; // 복습 보너스
                
                const earnedScore = baseScore * gameState.level;
                gameState.score += earnedScore;
                
                // 과목별 피드백 메시지 (자유 학습 모드 고려)
                let correctMessage = '';
                const modeText = window.gameState.freeStudyMode ? ' (자유 학습)' : '';
                
                if (gameState.currentSubject === 'english') {
                    correctMessage = `정답! +${earnedScore}점! 동물을 잡았어요!${modeText} 🎉`;
                } else {
                    // 사회, 수학, 상식 과목: 해설 포함
                    correctMessage = `정답! +${earnedScore}점! 동물을 잡았어요!${modeText} 🎉`;
                    if (currentWordData.explanation) {
                        correctMessage += ` ${currentWordData.explanation}`;
                    }
                }
                
                feedback.textContent = correctMessage;
                feedback.className = 'feedback correct';
                
                // 정답 시 화려한 효과
                showCorrectAnswerEffects();
                
                const newAnimal = getRandomAnimal();
                addAnimal(newAnimal);
                
                // 동물 수집 특별 효과
                setTimeout(() => {
                    const animalData = animalTypes.find(a => a.name === newAnimal);
                    if (animalData) {
                        showAnimalCollectedEffects(animalData);
                    }
                }, 500);
                
                // 레벨업 조건 체크
                if (gameState.score >= Math.pow(gameState.level, 2) * 2000) { 
                    gameState.level++;
                    showLevelUp();
                }
                
                // 랜덤 이벤트 체크
                checkRandomEvent();
                
                // 일일 미션 진행도 업데이트 (정답일 때만, 자유 학습 모드가 아닐 때만)
                if (!window.gameState.freeStudyMode) {
                    window.updateMissionProgress(gameState.currentSubject);
                }
                
                // 매 문제마다 저장하지 않음 - 미션 완료 시에만 저장
                setTimeout(() => generatePersonalizedQuiz(), 1500);
            } else {
                // 과목별 오답 피드백
                let incorrectMessage = '';
                if (gameState.currentSubject === 'english') {
                    incorrectMessage = `아! 정답은 "${currentEnglishQuiz.answer}"였어요. 다시 도전하세요!`;
                } else {
                    // 사회, 수학, 상식 과목: 정답과 해설 표시
                    const correctAnswer = currentWordData.options[currentWordData.answer];
                    incorrectMessage = `아! 정답은 "${correctAnswer}"였어요.`;
                    if (currentWordData.explanation) {
                        incorrectMessage += ` ${currentWordData.explanation}`;
                    }
                }
                
                feedback.textContent = incorrectMessage;
                feedback.className = 'feedback incorrect';
                
                // 오답 시 피드백 효과
                showIncorrectAnswerEffects();
                setTimeout(() => generatePersonalizedQuiz(), 2500);
            }
            
            updateUI();
            updateWordStats();
        }

        // 사용자 학습 진행도 저장
        async function saveUserProgress() {
            if (!currentUserProfile.name) return;
            
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const progressDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/progress", currentUserProfile.name);
                
                await window.firebase.setDoc(progressDocRef, {
                    userId: currentUserProfile.name,
                    progress: userProgress,
                    lastUpdated: new Date().toISOString()
                }, { merge: true });
                
                console.log("User progress saved");
            } catch (error) {
                console.error("Error saving user progress:", error);
            }
        }

        // 사용자 학습 진행도 로드
        async function loadUserProgress() {
            if (!currentUserProfile.name) return;
            
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const progressDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/progress", currentUserProfile.name);
                const docSnap = await window.firebase.getDoc(progressDocRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    userProgress = data.progress || {};
                    console.log("User progress loaded");
                } else {
                    userProgress = {};
                }
            } catch (error) {
                console.error("Error loading user progress:", error);
                userProgress = {};
            }
        }

        // 동물 레벨업을 위한 수학 문제 생성
        function generateMathProblemForLevelUp(animalLevel) {
            const difficulty = Math.min(Math.floor(animalLevel / 5) + 1, 4);
            let question = {};
            
            switch(difficulty) {
                case 1:
                    const a1 = Math.floor(Math.random() * 10) + 1;
                    const b1 = Math.floor(Math.random() * 10) + 1;
                    if (Math.random() > 0.5) { question = {text: `${a1} + ${b1}`, answer: a1 + b1}; } 
                    else { const l = Math.max(a1, b1), s = Math.min(a1, b1); question = {text: `${l} - ${s}`, answer: l - s}; }
                    break;
                case 2:
                    const a2 = Math.floor(Math.random() * 90) + 10;
                    const b2 = Math.floor(Math.random() * 90) + 10;
                    if (Math.random() > 0.5) { question = {text: `${a2} + ${b2}`, answer: a2 + b2}; }
                    else { const l = Math.max(a2, b2), s = Math.min(a2, b2); question = {text: `${l} - ${s}`, answer: l - s}; }
                    break;
                case 3:
                    const a3 = Math.floor(Math.random() * 8) + 2;
                    const b3 = Math.floor(Math.random() * 8) + 2;
                    question = {text: `${a3} × ${b3}`, answer: a3 * b3};
                    break;
                case 4:
                    const a4 = Math.floor(Math.random() * 900) + 100;
                    const b4 = Math.floor(Math.random() * 900) + 100;
                    if (Math.random() > 0.5) { question = {text: `${a4} + ${b4}`, answer: a4 + b4}; }
                    else { const l = Math.max(a4, b4), s = Math.min(a4, b4); question = {text: `${l} - ${s}`, answer: l - s}; }
                    break;
            }
            gameState.currentQuestion = question;
            document.getElementById('math-question').textContent = `${question.text} = ?`;
        }

        // 수학 문제 모달 열기
        function startMathProblem(animalName) {
            const animal = gameState.animals[animalName];
            generateMathProblemForLevelUp(animal.animalLevel);
            
            const answerInput = document.getElementById('math-answer-input');
            const submitBtn = document.getElementById('math-submit-btn');
            
            answerInput.value = '';
            document.getElementById('math-feedback').textContent = '';
            
            answerInput.disabled = false;
            submitBtn.disabled = false;

            submitBtn.onclick = () => checkMathAnswer(animalName);
            document.getElementById('math-modal').style.display = 'flex';
            answerInput.focus();
        }

        // 수학 문제 정답 확인
        function checkMathAnswer(animalName) {
            const answerInput = document.getElementById('math-answer-input');
            const submitBtn = document.getElementById('math-submit-btn');
            const userAnswer = parseInt(answerInput.value);
            const feedback = document.getElementById('math-feedback');
            
            if (isNaN(userAnswer)) {
                feedback.textContent = '숫자를 입력해주세요!';
                feedback.style.color = 'red';
                return;
            }
            
            answerInput.disabled = true;
            submitBtn.disabled = true;

            if (userAnswer === gameState.currentQuestion.answer) {
                const animal = gameState.animals[animalName];
                gameState.score += 15 * animal.animalLevel;
                animal.animalLevel++;
                
                feedback.textContent = `정답! ${animal.name}의 레벨이 ${animal.animalLevel}이 되었어요!`;
                feedback.style.color = 'green';

                // 랜덤 이벤트 체크
                checkRandomEvent();

                updateUI();
                updateAnimalCollection();
                // 매 문제마다 저장하지 않음
                setTimeout(closeMathModal, 1500);
            } else {
                feedback.textContent = `땡! 다시 생각해보세요.`;
                feedback.style.color = 'red';
                setTimeout(() => {
                    answerInput.disabled = false;
                    submitBtn.disabled = false;
                    answerInput.focus();
                }, 1000);
            }
        }

        function closeMathModal() {
            document.getElementById('math-modal').style.display = 'none';
        }

        function getRandomAnimal() {
            const maxRarity = Math.min(Math.floor(gameState.level / 2) + 1, 6);
            const availableAnimals = animalTypes.filter(animal => animal.rarity <= maxRarity);
            const weights = availableAnimals.map(animal => Math.pow(0.7, animal.rarity - 1));
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let random = Math.random() * totalWeight;
            for (let i = 0; i < availableAnimals.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    return availableAnimals[i];
                }
            }
            return availableAnimals[0];
        }

        function addAnimal(animal) {
            const key = animal.name;
            if (!gameState.animals[key]) {
                gameState.animals[key] = {
                    ...animal,
                    count: 0,
                    animalLevel: 1,
                    story: ""
                };
                gameState.speciesCount++;
                showNewAnimalAlert(animal);
            }
            
            gameState.animals[key].count++;
            gameState.totalAnimals++;
            
            updateAnimalCollection();
        }

        // ==================== 학습 통계 관련 함수 ====================
        
        async function updateLearningStats() {
            // userProgress가 비어있거나 로드되지 않았다면 다시 로드 시도
            if (!currentUserProfile || Object.keys(userProgress).length === 0) {
                await loadUserProgress();
            }

            const progressEntries = Object.entries(userProgress);

            // 전체 통계 계산
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let masteredCount = 0;

            progressEntries.forEach(([wordId, progress]) => {
                totalCorrect += progress.correct;
                totalIncorrect += progress.incorrect;
                const total = progress.correct + progress.incorrect;
                if (total >= 3 && (progress.correct / total) >= 0.8) {
                    masteredCount++;
                }
            });

            const totalAttempts = totalCorrect + totalIncorrect;
            const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

            // 전체 통계 표시
            const totalLearnedEl = document.getElementById('total-words-learned');
            const totalCorrectEl = document.getElementById('total-correct');
            const totalAccuracyEl = document.getElementById('total-accuracy');
            const masteredWordsEl = document.getElementById('mastered-words');

            if (totalLearnedEl) totalLearnedEl.textContent = progressEntries.length;
            if (totalCorrectEl) totalCorrectEl.textContent = totalCorrect;
            if (totalAccuracyEl) totalAccuracyEl.textContent = overallAccuracy + '%';
            if (masteredWordsEl) masteredWordsEl.textContent = masteredCount;

            // 취약/우수 단어 표시
            updateWeakWords(progressEntries);
            updateStrongWords(progressEntries);
        }

        function updateWeakWords(progressEntries) {
            console.log("updateWeakWords 호출됨", progressEntries);

            const weakWordsGrid = document.getElementById('weak-words-grid');
            if (!weakWordsGrid) {
                console.error("weak-words-grid 요소를 찾을 수 없음");
                return;
            }

            const weakWords = progressEntries.filter(([wordId, progress]) => {
                const total = progress.correct + progress.incorrect;
                console.log(`[필터링] 단어 ID: ${wordId}, 정답: ${progress.correct}, 오답: ${progress.incorrect}, 합계: ${total}`);
                return total >= 3 && progress.incorrect > progress.correct;
            });

            console.log("취약 단어 후보:", weakWords);

            if (weakWords.length === 0) {
                weakWordsGrid.innerHTML = '<p class="no-data">복습이 필요한 단어가 없습니다. 더 많은 문제를 풀어보세요!</p>';
                return;
            }

            weakWords.sort(([,a], [,b]) => {
                const aAccuracy = a.correct / (a.correct + a.incorrect);
                const bAccuracy = b.correct / (b.correct + b.incorrect);
                return aAccuracy - bAccuracy;
            });

            weakWordsGrid.innerHTML = '';
            weakWords.slice(0, 12).forEach(([wordId, progress]) => {
                const total = progress.correct + progress.incorrect;
                const accuracy = Math.round((progress.correct / total) * 100);
                const card = document.createElement('div');
                card.className = 'word-progress-card';
                card.innerHTML = `
                    <div class="word-pair">단어 ID: ${wordId}</div>
                    <div class="progress-stats">
                        <span>정답: ${progress.correct}</span>
                        <span>오답: ${progress.incorrect}</span>
                    </div>
                    <div class="accuracy-bar">
                        <div class="accuracy-fill" style="width: ${accuracy}%"></div>
                    </div>
                    <div style="text-align: center; font-size: 0.9rem; color: #FF6B6B;">정답률: ${accuracy}%</div>`;
                weakWordsGrid.appendChild(card);
            });
        }
        
        function updateStrongWords(progressEntries) {
            console.log("updateStrongWords 호출됨", progressEntries);

            const strongWordsGrid = document.getElementById('strong-words-grid');
            if (!strongWordsGrid) {
                console.error("strong-words-grid 요소를 찾을 수 없음");
                return;
            }

            const strongWords = progressEntries.filter(([wordId, progress]) => {
                const total = progress.correct + progress.incorrect;
                console.log(`[필터링] 단어 ID: ${wordId}, 정답: ${progress.correct}, 오답: ${progress.incorrect}, 합계: ${total}`);
                return total >= 3 && (progress.correct / total) >= 0.8;
            });

            console.log("우수 단어 후보:", strongWords);

            if (strongWords.length === 0) {
                strongWordsGrid.innerHTML = '<p class="no-data">아직 완전히 학습한 단어가 없습니다.</p>';
                return;
            }

            strongWords.sort(([,a], [,b]) => {
                const aAccuracy = a.correct / (a.correct + a.incorrect);
                const bAccuracy = b.correct / (b.correct + b.incorrect);
                return bAccuracy - aAccuracy;
            });

            strongWordsGrid.innerHTML = '';
            strongWords.slice(0, 12).forEach(([wordId, progress]) => {
                const total = progress.correct + progress.incorrect;
                const accuracy = Math.round((progress.correct / total) * 100);
                const card = document.createElement('div');
                card.className = 'word-progress-card strong';
                card.innerHTML = `
                    <div class="word-pair">단어 ID: ${wordId}</div>
                    <div class="progress-stats">
                        <span>정답: ${progress.correct}</span>
                        <span>오답: ${progress.incorrect}</span>
                    </div>
                    <div class="accuracy-bar">
                        <div class="accuracy-fill" style="width: ${accuracy}%"></div>
                    </div>
                    <div style="text-align: center; font-size: 0.9rem; color: #4CAF50;">정답률: ${accuracy}%</div>`;
                strongWordsGrid.appendChild(card);
            });
        }

        // ==================== UI 업데이트 함수 ====================

        function updateUI() {
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('coins').textContent = gameState.coins;
            document.getElementById('level').textContent = gameState.level;
            document.getElementById('species-count').textContent = gameState.speciesCount;
            document.getElementById('total-animals').textContent = gameState.totalAnimals;
        }

        function updateAnimalCollection() {
            const collection = document.getElementById('animal-collection');
            if (!collection) return;
            collection.innerHTML = '';
            
            const sortedAnimals = Object.values(gameState.animals).sort((a, b) => b.rarity - a.rarity);
            
            sortedAnimals.forEach(animal => {
                if (animal.count === 0) return;

                const card = document.createElement('div');
                card.className = 'animal-card';
                
                let borderColor = '#87CEEB';
                if (animal.rarity >= 5) borderColor = '#FFD700';
                else if (animal.rarity >= 4) borderColor = '#9370DB';
                else if (animal.rarity >= 3) borderColor = '#32CD32';
                
                card.style.borderColor = borderColor;
                card.style.boxShadow = `0 6px 20px ${borderColor}40`;
                
                // 판매가 계산
                const sellPrice = (animal.animalLevel * 10) + (animal.rarity * 5);
                
                card.innerHTML = `
                    <span class="animal-emoji">${animal.emoji}</span>
                    <div class="animal-name">${animal.name} (${animal.count}마리)</div>
                    <div class="animal-level">Lv. ${animal.animalLevel || 1}</div>
                    <div class="special-name">"${animal.specialName}"</div>
                    <div class="rarity-badge">★${animal.rarity}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 5px;">판매가: ${sellPrice}🪙</div>
                    <div style="font-size: 0.7rem; color: #999; text-align: center; margin-top: 3px;">📖 클릭하면 이야기를 들을 수 있어요</div>
                    <div style="margin-top: 10px; display: flex; gap: 5px; justify-content: center;">
                        <button onclick="event.stopPropagation(); startMathProblem('${animal.name}')" style="background: #4169E1; color: white; border: none; padding: 8px 12px; border-radius: 10px; font-size: 0.8rem; cursor: pointer;">레벨업</button>
                        <button onclick="event.stopPropagation(); quickSellAnimal('${animal.name}')" style="background: #FF6B6B; color: white; border: none; padding: 8px 12px; border-radius: 10px; font-size: 0.8rem; cursor: pointer;">💰판매</button>
                    </div>
                `;

                // 카드 클릭시 스토리 표시
                card.onclick = () => {
                    generateAnimalStory(animal);
                };
                
                collection.appendChild(card);
            });
        }

        // 바로 판매 시스템
        window.quickSellAnimal = function(animalName) {
            const animal = gameState.animals[animalName];
            if (!animal || animal.count <= 0) {
                alert('판매할 동물이 없습니다.');
                return;
            }
            
            // 레벨별 판매가 계산
            const basePrice = animal.animalLevel * 10;
            const rarityBonus = animal.rarity * 5;
            const finalPrice = basePrice + rarityBonus;
            
            const confirmMessage = `${animal.name} (Lv.${animal.animalLevel}, ★${animal.rarity})을(를) ${finalPrice}🪙에 판매하시겠습니까?\n\n💡 계산법: (레벨 ${animal.animalLevel} × 10) + (희귀도 ${animal.rarity} × 5) = ${finalPrice}🪙`;
            
            if (confirm(confirmMessage)) {
                // 동물 제거
                animal.count--;
                gameState.totalAnimals--;
                
                // 동물이 0마리가 되면 종류에서도 제거
                if (animal.count <= 0) {
                    gameState.speciesCount--;
                    delete gameState.animals[animalName];
                }
                
                // 코인 추가
                gameState.coins += finalPrice;
                
                // 판매 완료 알림
                const sellAlert = document.createElement('div');
                sellAlert.className = 'new-animal-alert';
                sellAlert.style.background = 'linear-gradient(45deg, #32CD32, #90EE90)';
                sellAlert.innerHTML = `
                    <span class="new-animal-emoji">💰</span>
                    <h3>판매 완료! 🎉</h3>
                    <p><strong>${animal.name}</strong>을(를) <strong>${finalPrice}🪙</strong>에 판매했습니다!</p>
                `;
                document.body.appendChild(sellAlert);
                setTimeout(() => { sellAlert.remove(); }, 3000);
                
                // UI 업데이트
                updateUI();
                updateAnimalCollection();
                saveCurrentUserData();
                
                console.log(`${animalName} 판매 완료: +${finalPrice}🪙`);
            }
        }
        
        function updateEncyclopedia() {
            const grid = document.getElementById('encyclopedia-grid');
            grid.innerHTML = '';

            const collectedCount = gameState.speciesCount;
            const totalCount = animalTypes.length;
            document.getElementById('collection-progress').textContent = `${collectedCount} / ${totalCount}`;
            
            const progressPercent = totalCount > 0 ? (collectedCount / totalCount) * 100 : 0;
            document.getElementById('progress-bar').style.width = `${progressPercent}%`;

            animalTypes.forEach(animal => {
                const collectedAnimal = gameState.animals[animal.name];
                const card = document.createElement('div');
                card.className = 'encyclopedia-card';
                
                if (collectedAnimal && collectedAnimal.count > 0) {
                    card.innerHTML = `
                        <span class="animal-emoji">${animal.emoji}</span>
                        <div class="animal-name">${animal.name}</div>
                        <div class="animal-count">${collectedAnimal.count}마리 보유</div>
                        <div class="rarity-badge">★${animal.rarity}</div>
                        <button class="story-btn">이야기 듣기 📖</button>
                    `;
                    card.querySelector('.story-btn').onclick = (event) => {
                        event.stopPropagation();
                        generateAnimalStory(collectedAnimal);
                    };
                } else {
                    card.classList.add('uncollected');
                    card.innerHTML = `
                        <span class="animal-emoji">❓</span>
                        <div class="animal-name">???</div>
                        <div class="animal-count">미발견</div>
                        <div class="rarity-badge">★${animal.rarity}</div>
                    `;
                }
                grid.appendChild(card);
            });
        }

        // ==================== 농장 관련 함수 ====================
        
        function initializeFarm() {
            const farmGrid = document.getElementById('farm-grid');
            if (!farmGrid) return;
            
            farmGrid.innerHTML = '';
            for (let i = 0; i < 48; i++) {
                const cell = document.createElement('div');
                cell.className = 'farm-cell';
                cell.dataset.index = i;
                cell.onclick = (event) => placeItemOnFarm(i, event);
                cell.oncontextmenu = (event) => {
                    event.preventDefault();
                    removeItemFromFarm(i);
                    return false;
                };
                farmGrid.appendChild(cell);
            }
            updateShop();
            updateInventory();
            renderFarm();
        }

        function updateShop() {
            const shopGrid = document.getElementById('shop-grid');
            if (!shopGrid) return;
            
            shopGrid.innerHTML = '';
            shopItems.forEach(item => {
                const shopItemDiv = document.createElement('div');
                shopItemDiv.className = 'shop-item';
                shopItemDiv.innerHTML = `
                    <div class="item-emoji">${item.emoji}</div>
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">🪙 ${item.price}</div>
                `;
                shopItemDiv.onclick = () => buyItem(item.name);
                shopGrid.appendChild(shopItemDiv);
            });
        }

        function buyItem(itemName) {
            const item = shopItems.find(i => i.name === itemName);
            if (gameState.coins >= item.price) {
                gameState.coins -= item.price;
                if (!gameState.farm.items[itemName]) {
                    gameState.farm.items[itemName] = { ...item, count: 0 };
                }
                gameState.farm.items[itemName].count++;
                alert(`${itemName}을(를) 구매했습니다!`);
                updateUI();
                updateInventory();
                saveCurrentUserData();
            } else {
                alert('코인이 부족합니다!');
            }
        }

        function updateInventory() {
            const inventoryGrid = document.getElementById('inventory-grid');
            if (!inventoryGrid) return;
            
            inventoryGrid.innerHTML = '';
            
            // 농장 아이템 표시
            Object.values(gameState.farm.items).forEach(item => {
                if (item.count > 0) {
                    const invItemDiv = document.createElement('div');
                    invItemDiv.className = 'inventory-item';
                    invItemDiv.dataset.itemName = item.name;
                    invItemDiv.innerHTML = `
                        <div class="item-emoji">${item.emoji}</div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-count">x ${item.count}</div>
                    `;
                    invItemDiv.onclick = () => selectItemToPlace(item.name, false);
                    inventoryGrid.appendChild(invItemDiv);
                }
            });
            
            // 동물 표시
            Object.values(gameState.animals).forEach(animal => {
                 if (animal.count > 0) {
                    const invItemDiv = document.createElement('div');
                    invItemDiv.className = 'inventory-item';
                    invItemDiv.dataset.itemName = animal.name;
                    invItemDiv.innerHTML = `
                        <div class="item-emoji">${animal.emoji}</div>
                        <div class="item-name">${animal.name}</div>
                        <div class="item-count">x ${animal.count}</div>
                    `;
                    invItemDiv.onclick = () => selectItemToPlace(animal.name, true);
                    inventoryGrid.appendChild(invItemDiv);
                }
            });
        }

        function selectItemToPlace(itemName, isAnimal) {
            selectedItemToPlace = { name: itemName, isAnimal };
            document.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
            const targetElement = document.querySelector(`.inventory-item[data-item-name="${itemName}"]`);
            if (targetElement) {
                targetElement.classList.add('selected');
            }
        }

        function placeItemOnFarm(index, event) {
            if (!selectedItemToPlace) return;

            const { name, isAnimal } = selectedItemToPlace;
            const currentCellContent = gameState.farm.layout[index];

            // 기존 아이템이 있다면 인벤토리로 돌려보내기
            if (currentCellContent) {
                if (currentCellContent.isAnimal) {
                    if (gameState.animals[currentCellContent.name]) {
                        gameState.animals[currentCellContent.name].count++;
                    }
                } else {
                    if (gameState.farm.items[currentCellContent.name]) {
                        gameState.farm.items[currentCellContent.name].count++;
                    }
                }
            }

            // 새 아이템 배치
            if (isAnimal) {
                if (gameState.animals[name] && gameState.animals[name].count > 0) {
                    gameState.farm.layout[index] = { 
                        name, 
                        isAnimal: true, 
                        emoji: gameState.animals[name].emoji 
                    };
                    gameState.animals[name].count--;
                }
            } else {
                if (gameState.farm.items[name] && gameState.farm.items[name].count > 0) {
                    gameState.farm.layout[index] = { 
                        name, 
                        isAnimal: false, 
                        emoji: gameState.farm.items[name].emoji 
                    };
                    gameState.farm.items[name].count--;
                }
            }
            
            selectedItemToPlace = null;
            document.querySelectorAll('.inventory-item').forEach(el => el.classList.remove('selected'));
            renderFarm();
            updateInventory();
            saveCurrentUserData();
        }

        function removeItemFromFarm(index) {
            const currentCellContent = gameState.farm.layout[index];
            if (currentCellContent) {
                if (currentCellContent.isAnimal) {
                    if (gameState.animals[currentCellContent.name]) {
                        gameState.animals[currentCellContent.name].count++;
                    }
                } else {
                    if (gameState.farm.items[currentCellContent.name]) {
                        gameState.farm.items[currentCellContent.name].count++;
                    }
                }
                gameState.farm.layout[index] = null;
                renderFarm();
                updateInventory();
                saveCurrentUserData();
            }
        }

        function renderFarm() {
            const farmGrid = document.getElementById('farm-grid');
            if (!farmGrid) return;
            
            gameState.farm.layout.forEach((item, index) => {
                const cell = farmGrid.children[index];
                if (cell) {
                    if (item) {
                        cell.innerHTML = `<span class="${item.isAnimal ? 'placed-animal' : ''}">${item.emoji}</span>`;
                    } else {
                        cell.innerHTML = '';
                    }
                }
            });
        }
        
        // ==================== 동물 시장 관련 함수 ====================
        
        function updateMarketPage() {
            updateSellAnimalSelect();
            loadMarketListings();
        }

        function updateSellAnimalSelect() {
            const select = document.getElementById('sell-animal-select');
            if (!select) return;
            
            select.innerHTML = '<option value="">판매할 동물 선택</option>';
            
            Object.values(gameState.animals).forEach(animal => {
                if (animal.count >= 2) { // 2마리 이상 보유한 동물만 판매 가능
                    const option = document.createElement('option');
                    option.value = animal.name;
                    option.textContent = `${animal.emoji} ${animal.name} (${animal.count}마리, Lv.${animal.animalLevel})`;
                    select.appendChild(option);
                }
            });
        }

        window.sellAnimal = async function() {
            const select = document.getElementById('sell-animal-select');
            const priceInput = document.getElementById('sell-price-input');
            
            const animalName = select.value;
            const price = parseInt(priceInput.value);
            
            if (!animalName) {
                alert('판매할 동물을 선택해주세요.');
                return;
            }
            
            if (!price || price <= 0) {
                alert('올바른 가격을 입력해주세요.');
                return;
            }
            
            if (price > gameState.coins * 10 + 1000) { // 합리적인 가격 설정
                alert('가격이 너무 높습니다. 좀 더 합리적인 가격으로 설정해주세요.');
                return;
            }
            
            const animal = gameState.animals[animalName];
            if (animal.count < 2) {
                alert('최소 2마리 이상 보유해야 판매할 수 있습니다.');
                return;
            }
            
            try {
                // Firebase에 판매 등록
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const marketRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/market");
                
                const listingData = {
                    animalName: animalName,
                    animalEmoji: animal.emoji,
                    animalLevel: animal.animalLevel,
                    specialName: animal.specialName,
                    rarity: animal.rarity,
                    price: price,
                    seller: currentUserProfile.name,
                    sellerId: currentUserId,
                    listedAt: new Date().toISOString()
                };
                
                await window.firebase.setDoc(window.firebase.doc(marketRef, `${currentUserId}_${animalName}_${Date.now()}`), listingData);
                
                // 인벤토리에서 동물 제거
                animal.count--;
                gameState.totalAnimals--;
                
                alert(`${animalName}이(가) ${price}점에 판매 등록되었습니다!`);
                
                // UI 업데이트
                updateUI();
                updateAnimalCollection();
                updateSellAnimalSelect();
                loadMarketListings();
                saveCurrentUserData();
                
                // 입력 초기화
                select.value = '';
                priceInput.value = '';
                
            } catch (error) {
                console.error('Error selling animal:', error);
                alert('판매 등록 중 오류가 발생했습니다.');
            }
        }

        async function loadMarketListings() {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const marketRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/market");
                const querySnapshot = await window.firebase.getDocs(marketRef);
                
                const listings = [];
                const expiredListings = [];
                const currentTime = new Date();
                const threeDaysInMs = 3 * 24 * 60 * 60 * 1000; // 3일을 밀리초로 변환
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const listingTime = new Date(data.listedAt);
                    const timeDiff = currentTime - listingTime;
                    
                    if (timeDiff > threeDaysInMs) {
                        // 3일이 지난 항목은 만료된 목록에 추가
                        expiredListings.push({
                            id: doc.id,
                            ...data
                        });
                    } else {
                        // 3일 이내의 항목만 표시 목록에 추가
                        listings.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                
                // 만료된 항목들 처리
                for (const expiredListing of expiredListings) {
                    await returnExpiredAnimal(expiredListing);
                }
                
                // 최신순으로 정렬
                listings.sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt));
                
                displayMarketListings(listings);
                
            } catch (error) {
                console.error('Error loading market listings:', error);
                document.getElementById('market-body').innerHTML = '<tr><td colspan="7">시장 정보를 불러오는 중 오류가 발생했습니다.</td></tr>';
            }
        }
        
        // 만료된 동물을 판매자에게 반환
        async function returnExpiredAnimal(expiredListing) {
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                
                // 판매자 데이터 로드
                const sellerData = await loadUserData(expiredListing.seller);
                if (!sellerData) {
                    console.log(`판매자 ${expiredListing.seller}의 데이터를 찾을 수 없습니다.`);
                    // 판매자 데이터가 없어도 시장에서는 제거
                    const listingRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/market", expiredListing.id);
                    await window.firebase.deleteDoc(listingRef);
                    return;
                }
                
                // 동물을 판매자에게 반환
                const animalName = expiredListing.animalName;
                if (!sellerData.animals) {
                    sellerData.animals = {};
                }
                
                if (!sellerData.animals[animalName]) {
                    // 해당 동물이 없으면 새로 생성
                    const animalType = animalTypes.find(a => a.name === animalName);
                    if (animalType) {
                        sellerData.animals[animalName] = {
                            ...animalType,
                            count: 0,
                            animalLevel: expiredListing.animalLevel,
                            story: ""
                        };
                        sellerData.speciesCount = (sellerData.speciesCount || 0) + 1;
                    }
                }
                
                if (sellerData.animals[animalName]) {
                    sellerData.animals[animalName].count++;
                    sellerData.totalAnimals = (sellerData.totalAnimals || 0) + 1;
                    sellerData.animals[animalName].animalLevel = Math.max(
                        sellerData.animals[animalName].animalLevel || 1, 
                        expiredListing.animalLevel
                    );
                }
                
                // 판매자 데이터 저장
                const userDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/profiles", expiredListing.seller);
                await window.firebase.setDoc(userDocRef, sellerData, { merge: true });
                
                // 시장에서 제거
                const listingRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/market", expiredListing.id);
                await window.firebase.deleteDoc(listingRef);
                
                // 판매자에게 알림 생성
                const message = `${expiredListing.animalName}(Lv.${expiredListing.animalLevel})이(가) 3일간 판매되지 않아 인벤토리로 돌아왔습니다. 다시 판매하거나 가격을 조정해보세요!`;
                await createNotification(expiredListing.seller, 'sale_expired', message, {
                    name: expiredListing.animalName,
                    emoji: expiredListing.animalEmoji,
                    level: expiredListing.animalLevel,
                    price: expiredListing.price
                });
                
                console.log(`만료된 동물 ${expiredListing.animalName}을(를) ${expiredListing.seller}에게 반환 완료`);
                
            } catch (error) {
                console.error('만료된 동물 반환 오류:', error);
            }
        }

        function displayMarketListings(listings) {
            const tbody = document.getElementById('market-body');
            if (!tbody) return;
            
            if (listings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">현재 판매 중인 동물이 없습니다.</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            
            listings.forEach(listing => {
                const row = document.createElement('tr');
                
                // 자신이 올린 상품은 다른 색상으로 표시
                if (listing.seller === currentUserProfile.name) {
                    row.style.backgroundColor = '#f0f8ff';
                }
                
                // 남은 시간 계산
                const currentTime = new Date();
                const listingTime = new Date(listing.listedAt);
                const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
                const timeLeft = threeDaysInMs - (currentTime - listingTime);
                
                let timeLeftText = '';
                if (timeLeft > 0) {
                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                    const daysLeft = Math.floor(hoursLeft / 24);
                    const remainingHours = hoursLeft % 24;
                    
                    if (daysLeft > 0) {
                        timeLeftText = `${daysLeft}일 ${remainingHours}시간`;
                    } else {
                        timeLeftText = `${hoursLeft}시간`;
                    }
                    
                    // 12시간 이하면 빨간색으로 표시
                    if (hoursLeft <= 12) {
                        timeLeftText = `<span style="color: #ff0000; font-weight: bold;">${timeLeftText}</span>`;
                    }
                } else {
                    timeLeftText = '<span style="color: #ff0000;">만료됨</span>';
                }
                
                row.innerHTML = `
                    <td>${listing.animalEmoji}</td>
                    <td>${listing.animalName}<br><small>"${listing.specialName}"</small></td>
                    <td>Lv. ${listing.animalLevel}<br><small>★${listing.rarity}</small></td>
                    <td>${listing.seller}</td>
                    <td><strong>${listing.price}</strong>🪙</td>
                    <td><small>${timeLeftText}</small></td>
                    <td>
                        ${listing.seller === currentUserProfile.name 
                            ? `<button class="nav-btn" onclick="cancelListing('${listing.id}')" style="background: #ff6b6b;">취소</button>`
                            : `<button class="nav-btn" onclick="buyAnimal('${listing.id}', ${listing.price}, '${listing.animalName}')">구매</button>`
                        }
                    </td>
                `;
                
                tbody.appendChild(row);
            });
        }

        window.buyAnimal = async function(listingId, price, animalName) {
            if (gameState.coins < price) {
                alert('코인이 부족합니다!');
                return;
            }

            if (!confirm(`${animalName}을(를) ${price}코인에 구매하시겠습니까?`)) {
                return;
            }
            
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const listingRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/market", listingId);
                
                // 판매 정보 가져오기
                const listingDoc = await window.firebase.getDoc(listingRef);
                if (!listingDoc.exists()) {
                    alert('이미 판매된 상품입니다.');
                    loadMarketListings();
                    return;
                }
                
                const listingData = listingDoc.data();
                const sellerName = listingData.seller;
                
                // 점수 차감
                gameState.coins -= price;
                
                // 동물 추가
                const animalType = animalTypes.find(a => a.name === animalName);
                if (!gameState.animals[animalName]) {
                    gameState.animals[animalName] = {
                        ...animalType,
                        count: 0,
                        animalLevel: listingData.animalLevel,
                        story: ""
                    };
                    gameState.speciesCount++;
                }
                gameState.animals[animalName].count++;
                gameState.animals[animalName].animalLevel = Math.max(
                    gameState.animals[animalName].animalLevel, 
                    listingData.animalLevel
                );
                gameState.totalAnimals++;
                
                // 판매자에게 코인 지급 및 알림 생성
                try {
                    const sellerData = await loadUserData(sellerName);
                    if (sellerData) {
                        // 판매자에게 코인 지급
                        sellerData.coins = (sellerData.coins || 0) + price;
                        
                        // 판매자 데이터 저장
                        const sellerDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/profiles", sellerName);
                        await window.firebase.setDoc(sellerDocRef, sellerData, { merge: true });
                        
                        // 판매자에게 판매 성공 알림
                        const sellerMessage = `🎉 축하합니다! ${animalName}(Lv.${listingData.animalLevel})이(가) ${price}🪙에 판매되었습니다! 구매자: ${currentUserProfile.name}`;
                        await createNotification(sellerName, 'sale_success', sellerMessage, {
                            name: animalName,
                            emoji: listingData.animalEmoji,
                            level: listingData.animalLevel,
                            price: price,
                            buyer: currentUserProfile.name
                        });
                        
                        console.log(`판매자 ${sellerName}에게 ${price}코인 지급 및 알림 전송 완료`);
                    }
                } catch (error) {
                    console.error('판매자 처리 오류:', error);
                    // 판매자 처리 실패해도 구매는 진행
                }
                
                // 구매자에게 구매 성공 알림 (선택사항)
                const buyerMessage = `🎉 ${animalName}(Lv.${listingData.animalLevel})을(를) 성공적으로 구매했습니다! 인벤토리를 확인해보세요.`;
                await createNotification(currentUserProfile.name, 'purchase_success', buyerMessage, {
                    name: animalName,
                    emoji: listingData.animalEmoji,
                    level: listingData.animalLevel,
                    price: price,
                    seller: sellerName
                });
                
                // 판매 정보 삭제
                await window.firebase.deleteDoc(listingRef);
                
                alert(`${animalName}을(를) 성공적으로 구매했습니다!`);
                
                // UI 업데이트
                updateUI();
                updateAnimalCollection();
                loadMarketListings();
                saveCurrentUserData();
                
            } catch (error) {
                console.error('Error buying animal:', error);
                alert('구매 중 오류가 발생했습니다.');
            }
        }

        window.cancelListing = async function(listingId) {
            if (!confirm('판매를 취소하시겠습니까?')) {
                return;
            }
            
            try {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const listingRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/market", listingId);
                
                // 판매 정보 가져오기
                const listingDoc = await window.firebase.getDoc(listingRef);
                if (!listingDoc.exists()) {
                    alert('이미 처리된 상품입니다.');
                    loadMarketListings();
                    return;
                }
                
                const listingData = listingDoc.data();
                
                // 동물 다시 인벤토리에 추가
                const animalType = animalTypes.find(a => a.name === listingData.animalName);
                if (!gameState.animals[listingData.animalName]) {
                    gameState.animals[listingData.animalName] = {
                        ...animalType,
                        count: 0,
                        animalLevel: listingData.animalLevel,
                        story: ""
                    };
                    gameState.speciesCount++;
                }
                gameState.animals[listingData.animalName].count++;
                gameState.totalAnimals++;
                
                // 판매 정보 삭제
                await window.firebase.deleteDoc(listingRef);
                
                // 사용자에게 취소 알림 생성
                const message = `${listingData.animalName}(Lv.${listingData.animalLevel})의 판매를 취소했습니다. 동물이 인벤토리로 돌아왔습니다.`;
                await createNotification(currentUserProfile.name, 'sale_cancelled', message, {
                    name: listingData.animalName,
                    emoji: listingData.animalEmoji,
                    level: listingData.animalLevel,
                    price: listingData.price
                });
                
                alert('판매가 취소되었습니다. 동물이 인벤토리로 돌아왔습니다.');
                
                // UI 업데이트
                updateUI();
                updateAnimalCollection();
                updateSellAnimalSelect();
                loadMarketListings();
                saveCurrentUserData();
                
            } catch (error) {
                console.error('Error canceling listing:', error);
                alert('판매 취소 중 오류가 발생했습니다.');
            }
        }

        // ==================== 동물 합성 함수 ====================
        
        function updateSynthesisPage() {
            const grid = document.getElementById('synthesis-grid');
            if (!grid) return;
            
            grid.innerHTML = '';

            synthesisRecipes.forEach(recipe => {
                const [ing1, ing2] = recipe.ingredients;
                const result = animalTypes.find(a => a.name === recipe.result);
                
                // 동물 데이터가 없으면 건너뛰기
                if (!result) {
                    console.log(`결과 동물 '${recipe.result}' 데이터가 없습니다.`);
                    return;
                }

                const hasIng1 = gameState.animals[ing1] && gameState.animals[ing1].count > 0;
                const hasIng2 = gameState.animals[ing2] && gameState.animals[ing2].count > 0;
                const canSynthesize = hasIng1 && hasIng2;

                const ing1Data = animalTypes.find(a => a.name === ing1);
                const ing2Data = animalTypes.find(a => a.name === ing2);
                
                // 재료 동물 데이터가 없으면 건너뛰기
                if (!ing1Data || !ing2Data) {
                    console.log(`재료 동물 '${ing1}' 또는 '${ing2}' 데이터가 없습니다.`);
                    return;
                }

                const card = document.createElement('div');
                card.className = 'synthesis-card';
                card.innerHTML = `
                    <div class="synthesis-ingredient ${hasIng1 ? 'owned' : 'not-owned'}">
                        <span class="animal-emoji">${ing1Data.emoji}</span>
                        <div>${ing1}</div>
                    </div>
                    <div class="synthesis-symbol">+</div>
                    <div class="synthesis-ingredient ${hasIng2 ? 'owned' : 'not-owned'}">
                        <span class="animal-emoji">${ing2Data.emoji}</span>
                        <div>${ing2}</div>
                    </div>
                    <div class="synthesis-symbol">=</div>
                    <div class="synthesis-result">
                        <span class="animal-emoji">${result.emoji}</span>
                        <div>${result.name}</div>
                    </div>
                    <button class="synthesis-btn" onclick="performSynthesis('${recipe.result}')" ${!canSynthesize ? 'disabled' : ''}>합성</button>
                `;
                grid.appendChild(card);
            });
        }

        window.performSynthesis = function(resultName) {
            const recipe = synthesisRecipes.find(r => r.result === resultName);
            if (!recipe) return;

            const [ing1, ing2] = recipe.ingredients;
            const hasIng1 = gameState.animals[ing1] && gameState.animals[ing1].count > 0;
            const hasIng2 = gameState.animals[ing2] && gameState.animals[ing2].count > 0;

            if (hasIng1 && hasIng2) {
                if (confirm(`'${ing1}'와(과) '${ing2}'를 사용해 '${resultName}'을(를) 만드시겠습니까?\n재료로 사용된 동물은 사라집니다!`)) {
                    gameState.animals[ing1].count--;
                    gameState.animals[ing2].count--;
                    gameState.totalAnimals -= 2;

                    const resultAnimalData = animalTypes.find(a => a.name === resultName);
                    addAnimal(resultAnimalData);

                    alert(`합성 성공! 전설적인 동물 '${resultName}'을(를) 획득했습니다!`);
                    
                    updateSynthesisPage();
                    updateAnimalCollection();
                    saveCurrentUserData();
                }
            } else {
                alert('재료가 부족합니다!');
            }
        }

        // ==================== AI 스토리텔러 함수 ====================

        function openStoryModal(title) {
            document.getElementById('story-modal-title').textContent = `"${title}" 이야기`;
            document.getElementById('story-text').textContent = '';
            document.getElementById('story-loading').style.display = 'block';
            document.getElementById('story-modal').style.display = 'flex';
        }

        window.closeStoryModal = function() {
            document.getElementById('story-modal').style.display = 'none';
        }

        async function generateAnimalStory(animal) {
            openStoryModal(animal.specialName);
            const storyTextElement = document.getElementById('story-text');
            const loadingElement = document.getElementById('story-loading');

            // 이미 저장된 이야기가 있는지 확인
            if (animal.story) {
                storyTextElement.textContent = animal.story;
                loadingElement.style.display = 'none';
                console.log("저장된 이야기 불러오기 완료!");
                return;
            }

            try {
                // Firebase Cloud Function 호출
                const generateStoryFunction = window.firebase.httpsCallable(window.firebase.functions, 'generateStory');
                const result = await generateStoryFunction({ 
                    animal: {
                        name: animal.name,
                        specialName: animal.specialName,
                        emoji: animal.emoji,
                        rarity: animal.rarity
                    }
                });
                
                const text = result.data.story;
                storyTextElement.textContent = text;
                
                // 생성된 이야기를 gameState에 저장하고, Firebase에 업데이트
                gameState.animals[animal.name].story = text;
                await saveCurrentUserData();
                console.log("새로운 이야기 생성 및 Firebase에 저장 완료!");

            } catch (error) {
                console.error("Error generating story via Cloud Function:", error);
                storyTextElement.textContent = "이야기를 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
            } finally {
                loadingElement.style.display = 'none';
            }
        }

        // ==================== 특수 효과 함수 ====================
        function showNewAnimalAlert(animal) {
            const alert = document.createElement('div');
            alert.className = 'new-animal-alert';
            alert.innerHTML = `
                <span class="new-animal-emoji">${animal.emoji}</span>
                <h3>새로운 동물 발견! 🎉</h3>
                <p><strong>${animal.specialName}</strong> (${animal.name})을(를) 획득했습니다!</p>
            `;
            document.body.appendChild(alert);
            setTimeout(() => { alert.remove(); }, 1500);
        }

        function showLevelUp() {
            // 레벨업 화려한 효과
            showLevelUpEffects();
            
            const alert = document.createElement('div');
            alert.className = 'new-animal-alert';
            alert.style.cssText += `
                animation: levelUpBurst 1s ease-out;
                background: linear-gradient(135deg, #FFD700, #FFA500, #FF69B4);
                color: white;
                border: 3px solid gold;
                box-shadow: 0 0 30px rgba(255, 215, 0, 0.7);
            `;
            alert.innerHTML = `
                <span class="new-animal-emoji" style="font-size: 3rem; animation: animalHop 1s infinite;">⭐</span>
                <h3 style="font-size: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">레벨 업! 🎉</h3>
                <p style="font-size: 1.3rem;">레벨 ${gameState.level}이 되었습니다!</p>
                <p style="font-size: 1.1rem;">더 희귀한 동물을 만날 수 있어요!</p>
            `;
            document.body.appendChild(alert);
            setTimeout(() => { alert.remove(); }, 2000);
        }

        // ==================== 사용자 관리 및 데이터 함수 (Firebase) ====================

        async function saveCurrentUserData() {
            if (!currentUserProfile.name) return;
            
            // 현재 세션 플레이 시간 업데이트
            const currentTotalPlayTime = updateSessionPlayTime();
            
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const userDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/profiles", currentUserProfile.name);
            
            const dataToSave = {
                ...currentUserProfile,
                score: gameState.score,
                coins: gameState.coins,
                level: gameState.level,
                animals: gameState.animals,
                totalAnimals: gameState.totalAnimals,
                speciesCount: gameState.speciesCount,
                farm: gameState.farm,
                totalPlayTimeMinutes: currentTotalPlayTime,
                lastPlayed: new Date().toISOString(),
                // 매일 로그인 보상 데이터 저장
                dailyRewards: gameState.dailyRewards,
                activeBuffs: gameState.activeBuffs,
                // 과목별 데이터 저장
                subjects: gameState.subjects,
                currentSubject: gameState.currentSubject
            };

            try {
                await window.firebase.setDoc(userDocRef, dataToSave, { merge: true });
                console.log("Data saved for", currentUserProfile.name);
            } catch (error) {
                console.error("Error saving data:", error);
            }
        }

        async function loadUserData(userName) {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const userDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/profiles", userName);
            const docSnap = await window.firebase.getDoc(userDocRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return null;
            }
        }

        async function hashPin(pin, salt) {
            const encoder = new TextEncoder();
            const data = encoder.encode(pin + salt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        async function handleSignup() {
            const nameInput = document.getElementById('player-name-input');
            const pinInput = document.getElementById('player-pin-input');
            const feedback = document.getElementById('login-feedback');
            const name = nameInput.value.trim();
            const pin = pinInput.value;

            if (!name || !pin) {
                feedback.textContent = "이름과 PIN을 모두 입력해주세요.";
                return;
            }
            if (!/^\d{4}$/.test(pin)) {
                feedback.textContent = "PIN은 4자리 숫자여야 합니다.";
                return;
            }

            feedback.textContent = "확인 중...";
            const existingProfile = await loadUserData(name);
            if (existingProfile) {
                feedback.textContent = "이미 사용 중인 이름입니다.";
                return;
            }

            const hashedPin = await hashPin(pin, name);
            const newProfile = {
                name: name,
                pinHash: hashedPin,
                score: 0,
                coins: 0,
                level: 1,
                animals: {},
                totalAnimals: 0,
                speciesCount: 0,
                farm: { layout: Array(48).fill(null), items: {} },
                totalPlayTimeMinutes: 0,
                createdAt: new Date().toISOString(),
                lastPlayed: new Date().toISOString()
            };

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const userDocRef = window.firebase.doc(window.firebase.db, "artifacts", appId, "public/data/profiles", newProfile.name);
            await window.firebase.setDoc(userDocRef, newProfile);

            alert(`🎉 ${name} 플레이어 생성 완료!`);
            await startGameWithProfile(newProfile);
        }

        async function handleLogin() {
            const nameInput = document.getElementById('player-name-input');
            const pinInput = document.getElementById('player-pin-input');
            const feedback = document.getElementById('login-feedback');
            const name = nameInput.value.trim();
            const pin = pinInput.value;

            if (!name || !pin) {
                feedback.textContent = "이름과 PIN을 모두 입력해주세요.";
                return;
            }

            feedback.textContent = "로그인 중...";
            const profileData = await loadUserData(name);

            if (!profileData) {
                feedback.textContent = "존재하지 않는 플레이어입니다.";
                return;
            }

            const hashedPin = await hashPin(pin, name);
            if (hashedPin === profileData.pinHash) {
                await startGameWithProfile(profileData);
            } else {
                feedback.textContent = "PIN이 일치하지 않습니다.";
            }
        }

        async function startGameWithProfile(profileData) {
            currentUserProfile = profileData;
            
            // 플레이 시간 초기화
            totalPlayTimeMinutes = profileData.totalPlayTimeMinutes || 0;
            sessionStartTime = Date.now();
            
            gameState = {
                score: profileData.score || 0,
                coins: profileData.coins || 0,
                level: profileData.level || 1,
                animals: profileData.animals || {},
                totalAnimals: profileData.totalAnimals || 0,
                speciesCount: profileData.speciesCount || 0,
                farm: profileData.farm || { layout: Array(48).fill(null), items: {} },
                currentQuestion: {},
                // 매일 로그인 보상 시스템 데이터
                dailyRewards: profileData.dailyRewards || {
                    lastLoginDate: null,
                    consecutiveDays: 0,
                    hasClaimedToday: false,
                    totalDaysLogged: 0
                },
                // 활성 버프 시스템
                activeBuffs: profileData.activeBuffs || [],
                // 과목별 독립적인 데이터
                subjects: profileData.subjects || {
                    english: { 
                        progress: {}, 
                        level: 1, 
                        score: 0, 
                        currentDifficulty: 1,
                        totalCorrect: 0,
                        totalIncorrect: 0 
                    },
                    social: { 
                        progress: {}, 
                        level: 1, 
                        score: 0, 
                        currentDifficulty: 1,
                        totalCorrect: 0,
                        totalIncorrect: 0 
                    }
                },
                // 현재 선택된 과목 (기본값: 영어)
                currentSubject: profileData.currentSubject || 'english'
            };

            document.getElementById('login-overlay').style.display = 'none';
            document.querySelector('.game-container').style.display = 'block';
            document.getElementById('current-user-name').textContent = currentUserProfile.name;
            
            // 동물 데이터가 로드되지 않았으면 로드
            if (animalTypes.length === 0) {
                await window.loadAnimalsFromJSON();
            }
            
            updateUI();
            updateAnimalCollection();
            
            // 과목별 데이터 초기화
            loadCurrentSubjectProgress();
            updateSubjectUI();
            
            // 과목 선택 드롭다운 초기화
            document.getElementById('subject-select').value = gameState.currentSubject;
            
            // 매일 로그인 보상 체크 (약간의 딜레이 후 실행)
            setTimeout(() => {
                checkDailyLoginReward();
            }, 1000);
            initializeFarm();
            
            // 사용자 학습 진행도 로드 후 퀴즈 시작
            try {
                await loadUserProgress();
                selectDifficulty(1);
            } catch (error) {
                console.error('사용자 진행도 로드 실패:', error);
                selectDifficulty(1);
            }
            
            showPage('game', document.querySelector('.nav-btn'));
            // 알람 확인 (3초 후)
            setTimeout(() => {
                checkAndShowNotifications();
            }, 3000);
        }

        window.logout = function() {
            // 로그아웃 전에 플레이 시간 저장
            if (sessionStartTime) {
                const sessionMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
                totalPlayTimeMinutes += sessionMinutes;
                sessionStartTime = null;
            }
            
            saveCurrentUserData();
            currentUserProfile = {};
            gameState = {};
            totalPlayTimeMinutes = 0;
            
            document.getElementById('login-overlay').style.display = 'flex';
            document.querySelector('.game-container').style.display = 'none';
            document.getElementById('player-name-input').value = '';
            document.getElementById('player-pin-input').value = '';
            document.getElementById('login-feedback').textContent = '';
            window.updateHallOfFame();
        }

        async function getAllProfiles() {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const profilesColRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/profiles");
            const querySnapshot = await window.firebase.getDocs(profilesColRef);
            const profiles = [];
            querySnapshot.forEach((doc) => {
                profiles.push(doc.data());
            });
            return profiles;
        }

        window.updateHallOfFame = async function() {
            try {
                const profiles = await getAllProfiles();
                if (profiles.length === 0) {
                     document.querySelector('#fame-species .player-name').textContent = `아직 플레이어가 없습니다.`;
                     document.querySelector('#fame-level .player-name').textContent = `새로운 플레이어가 되어보세요!`;
                    return;
                }

                let mostSpecies = { name: '-', count: -1 };
                let highestLevel = { name: '-', animal: '-', level: 0 };

                profiles.forEach(p => {
                    if ((p.speciesCount || 0) > mostSpecies.count) {
                        mostSpecies = { name: p.name, count: p.speciesCount };
                    }
                    if (p.animals) {
                        Object.values(p.animals).forEach(a => {
                            if ((a.animalLevel || 1) > highestLevel.level) {
                                highestLevel = { name: p.name, animal: a.name, level: a.animalLevel };
                            }
                        });
                    }
                });

                document.querySelector('#fame-species .player-name').textContent = `${mostSpecies.name} (${mostSpecies.count}종)`;
                document.querySelector('#fame-level .player-name').textContent = `${highestLevel.name} (Lv.${highestLevel.level} ${highestLevel.animal})`;
            } catch (error) {
                console.error('명예의 전당 업데이트 오류:', error);
            }
        }

        async function updateRankingPage() {
            const profiles = await getAllProfiles();
            const sortedProfiles = profiles.sort((a, b) => (b.score || 0) - (a.score || 0));
            const rankingBody = document.getElementById('ranking-body');
            rankingBody.innerHTML = '';

            sortedProfiles.forEach((p, index) => {
                const row = document.createElement('tr');
                if (p.name === currentUserProfile.name) {
                    row.className = 'my-rank';
                }
                
                // 플레이 시간 계산 (현재 로그인한 사용자의 경우 현재 세션 포함)
                let displayPlayTime = p.totalPlayTimeMinutes || 0;
                if (p.name === currentUserProfile.name && sessionStartTime) {
                    const sessionMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
                    displayPlayTime += sessionMinutes;
                }
                
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td><span class="clickable-user-name" onclick="visitUserFarm('${p.name}')" style="color: #4169E1; cursor: pointer; text-decoration: underline;">${p.name}</span></td>
                    <td>${p.score || 0}</td>
                    <td>${p.level || 1}</td>
                    <td>${p.speciesCount || 0}</td>
                    <td>${formatPlayTime(displayPlayTime)}</td>
                    <td><button class="nav-btn" onclick="visitUserFarm('${p.name}')" style="font-size: 0.8rem; padding: 6px 12px;">🏡 방문</button></td>
                `;
                rankingBody.appendChild(row);
            });
        }

        // ==================== 페이지 관리 및 초기화 ====================

        window.showPage = function(pageName, element) {
            document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            
            document.getElementById(pageName + '-page').classList.add('active');
            if (element) {
                element.classList.add('active');
            }
            
            const gameStats = document.getElementById('game-stats');
            const userInfo = document.getElementById('user-info');
            
            if (pageName === 'game') {
                gameStats.style.display = 'flex';
                userInfo.style.display = 'block';
                // 대시보드 업데이트
                if (typeof window.updateMissionUI === 'function') {
                    window.updateMissionUI();
                }
                if (typeof window.updateStudyTimerDisplay === 'function') {
                    window.updateStudyTimerDisplay();
                }
            } else if (pageName === 'quiz') {
                gameStats.style.display = 'flex';
                userInfo.style.display = 'block';
                // 퀴즈 페이지에서는 이전 퀴즈 상태 유지
            } else if (pageName === 'zoo') {
                gameStats.style.display = 'flex';
                userInfo.style.display = 'block';
                updateAnimalCollection(); // 동물 컬렉션 업데이트
            } else if (pageName === 'learning') {
                gameStats.style.display = 'none';
                userInfo.style.display = 'block';
                updateLearningStats();
            } else if (pageName === 'market') {
                gameStats.style.display = 'none';
                userInfo.style.display = 'block';
                updateMarketPage();
            } else if (pageName === 'encyclopedia') {
                gameStats.style.display = 'none';
                userInfo.style.display = 'block';
                updateEncyclopedia();
            } else if (pageName === 'farm') {
                gameStats.style.display = 'flex';
                userInfo.style.display = 'block';
                initializeFarm();
            } else if (pageName === 'synthesis') {
                gameStats.style.display = 'none';
                userInfo.style.display = 'block';
                updateSynthesisPage();
            } else if (pageName === 'ranking') {
                gameStats.style.display = 'none';
                userInfo.style.display = 'block';
                updateRankingPage();
            } else {
                gameStats.style.display = 'none';
                userInfo.style.display = 'none';
            }
        }
        
        // ==================== 이벤트 리스너 ====================
        
        document.getElementById('login-btn').addEventListener('click', async () => {
            try {
                await handleLogin();
            } catch (error) {
                console.error('로그인 오류:', error);
                document.getElementById('login-feedback').textContent = "로그인 중 오류가 발생했습니다.";
            }
        });

        document.getElementById('signup-btn').addEventListener('click', async () => {
            try {
                await handleSignup();
            } catch (error) {
                console.error('회원가입 오류:', error);
                document.getElementById('login-feedback').textContent = "회원가입 중 오류가 발생했습니다.";
            }
        });

        document.getElementById('player-pin-input').addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                try {
                    await handleLogin();
                } catch (error) {
                    console.error('로그인 오류:', error);
                    document.getElementById('login-feedback').textContent = "로그인 중 오류가 발생했습니다.";
                }
            }
        });

        // 음성 합성 준비
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };

        // 페이지 숨김/표시 시 플레이 시간 저장
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && currentUserProfile.name) {
                saveCurrentUserData();
            } else if (document.visibilityState === 'visible' && currentUserProfile.name) {
                sessionStartTime = Date.now(); // 다시 돌아왔을 때 세션 재시작
            }
        });

        // 페이지 종료 시 플레이 시간 저장
        window.addEventListener('beforeunload', () => {
            if (currentUserProfile.name && sessionStartTime) {
                const sessionMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
                totalPlayTimeMinutes += sessionMinutes;
                // beforeunload에서는 비동기 작업이 제한적이므로 localStorage 사용
                localStorage.setItem(`playTime_${currentUserProfile.name}`, totalPlayTimeMinutes.toString());
            }
        });

        // 앱 종료 시 데이터 저장
        window.addEventListener('beforeunload', () => {
            if (window.currentUserId && typeof window.saveCurrentUserData === 'function') {
                console.log('[앱 종료] Firebase에 최종 데이터 저장');
                // 동기적으로 저장 시도
                window.saveCurrentUserData();
            }
        });

        // 일일 미션 및 타이머 초기화
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (typeof window.initializeDailyMissions === 'function') {
                    window.initializeDailyMissions();
                }
                if (typeof window.checkDailyTimerReset === 'function') {
                    window.checkDailyTimerReset();
                }
                if (typeof window.updateStudyTimerDisplay === 'function') {
                    window.updateStudyTimerDisplay();
                }
                
                // Firebase 로그인 후 사용자 데이터 로드 시도
                if (window.currentUserId && typeof window.loadCurrentUserData === 'function') {
                    console.log('[DOMContentLoaded] 사용자 데이터 로드 시도');
                    window.loadCurrentUserData();
                } else {
                    console.log('[DOMContentLoaded] Firebase 아직 미준비, 3초 후 재시도');
                    // Firebase 로그인이 완료될 때까지 3초 후 재시도
                    setTimeout(() => {
                        if (window.currentUserId && typeof window.loadCurrentUserData === 'function') {
                            console.log('[DOMContentLoaded 재시도] 사용자 데이터 로드 시도');
                            window.loadCurrentUserData();
                        }
                    }, 3000);
                }
            }, 1000);
        });

        console.log('🐾 동물 수집 학습 게임이 로드되었습니다! (v10.0 - 일일 미션 & 학습 타이머 시스템 추가)');
