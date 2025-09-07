/**
 * 명예의 전당 관리
 */

// getAllProfiles 함수
export async function getAllProfiles() {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const profilesColRef = window.firebase.collection(window.firebase.db, "artifacts", appId, "public/data/profiles");
    const querySnapshot = await window.firebase.getDocs(profilesColRef);
    const profiles = [];
    querySnapshot.forEach((doc) => {
        profiles.push(doc.data());
    });
    return profiles;
}

// updateHallOfFame 함수
export async function updateHallOfFame() {
    try {
        const profiles = await getAllProfiles();
        if (profiles.length === 0) {
            console.log("프로필이 없어서 명예의 전당을 업데이트하지 않습니다.");
            return;
        }
        
        // 점수별로 정렬
        profiles.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        
        const hallContainer = document.getElementById('hall-of-fame-list');
        if (!hallContainer) return;
        
        hallContainer.innerHTML = '';
        
        profiles.slice(0, 10).forEach((profile, index) => {
            const item = document.createElement('div');
            item.className = 'hall-item';
            
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            else medal = `${index + 1}위`;
            
            item.innerHTML = `
                <div class="rank">${medal}</div>
                <div class="player-info">
                    <div class="name">${profile.name || '익명'}</div>
                    <div class="score">${profile.totalScore || 0}점</div>
                </div>
                <div class="animals-count">${(profile.collectedAnimals || []).length}마리</div>
            `;
            
            hallContainer.appendChild(item);
        });
        
    } catch (error) {
        console.error('명예의 전당 업데이트 실패:', error);
    }
}

// 전역 함수로 등록
window.getAllProfiles = getAllProfiles;
window.updateHallOfFame = updateHallOfFame;