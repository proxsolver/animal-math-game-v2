/**
 * 동물 데이터 로딩 및 관리
 */

// loadAnimalsFromJSON 함수
export async function loadAnimalsFromJSON() {
    try {
        console.log('동물 JSON 파일 로딩 시작...');
        
        const response = await fetch('./animals.json');
        
        if (!response.ok) {
            throw new Error(`동물 JSON 파일 로드 실패: ${response.status}`);
        }
        
        const data = await response.json();
        window.animalTypes = data.animals;
        
        console.log(`동물 데이터 로드 완료: ${window.animalTypes.length}마리`);
        return true;
        
    } catch (error) {
        console.error('동물 JSON 로드 실패, 기본 데이터 사용:', error);
        
        // 폴백: 기본 동물 몇 마리
        window.animalTypes = [
            {emoji: '🐶', name: '강아지', specialName: '멍멍왕자', rarity: 1},
            {emoji: '🐱', name: '고양이', specialName: '야옹공주', rarity: 1},
            {emoji: '🐰', name: '토끼', specialName: '깡총대장', rarity: 1},
            {emoji: '🦁', name: '사자', specialName: '황금갈기왕', rarity: 4},
            {emoji: '🦄', name: '유니콘', specialName: '순수의 뿔', rarity: 5}
        ];
        
        return false;
    }
}

// 전역 함수로 등록
window.loadAnimalsFromJSON = loadAnimalsFromJSON;