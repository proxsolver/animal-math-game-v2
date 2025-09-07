/**
 * 과목별 학습 데이터 로더
 * 수학, 영어, 사회, 일반상식 과목 데이터 관리
 */

// 과목 정보 정의
export const SUBJECTS = {
    math: {
        name: '수학',
        icon: '🧮',
        description: '사칙연산과 문장제 학습',
        color: '#4169E1'
    },
    english: {
        name: '영어',
        icon: '🔤',
        description: '기초 영단어 학습',
        color: '#32CD32'
    },
    social: {
        name: '사회',
        icon: '🏛️',
        description: '생활상식과 경제교육',
        color: '#FF6347'
    },
    general: {
        name: '일반상식',
        icon: '🧠',
        description: '과학, 역사, 지리 지식',
        color: '#9370DB'
    }
};

// 난이도 정의
export const LEVELS = {
    1: { name: '쉬움', icon: '⭐', description: '기초 단계' },
    2: { name: '보통', icon: '⭐⭐', description: '중간 단계' },
    3: { name: '어려움', icon: '⭐⭐⭐', description: '고급 단계' }
};

// 전역 데이터 저장소
let subjectData = {};
let currentSubject = 'math';
let currentLevel = 1;

/**
 * 특정 과목과 레벨의 데이터를 로드합니다
 */
export async function loadSubjectData(subject, level) {
    try {
        console.log(`📚 ${subject} Level ${level} 데이터 로딩 시작...`);
        
        const response = await fetch(`subjects/${subject}/level${level}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.words || !Array.isArray(data.words)) {
            throw new Error('잘못된 데이터 형식입니다');
        }
        
        // 데이터 저장
        const key = `${subject}_${level}`;
        subjectData[key] = data.words;
        
        console.log(`✅ ${SUBJECTS[subject].name} Level ${level} 데이터 로드 완료: ${data.words.length}개 문제`);
        return data.words;
        
    } catch (error) {
        console.error(`❌ ${subject} Level ${level} 데이터 로드 실패:`, error);
        return null;
    }
}

/**
 * 모든 과목의 모든 레벨 데이터를 미리 로드합니다
 */
export async function loadAllSubjectData() {
    console.log('📚 전체 과목 데이터 로딩 시작...');
    
    const loadPromises = [];
    
    for (const subject of Object.keys(SUBJECTS)) {
        for (let level = 1; level <= 3; level++) {
            loadPromises.push(loadSubjectData(subject, level));
        }
    }
    
    try {
        const results = await Promise.allSettled(loadPromises);
        const successCount = results.filter(result => result.status === 'fulfilled' && result.value !== null).length;
        
        console.log(`✅ 전체 데이터 로딩 완료: ${successCount}/${results.length} 성공`);
        return true;
    } catch (error) {
        console.error('❌ 전체 데이터 로딩 실패:', error);
        return false;
    }
}

/**
 * 현재 선택된 과목과 레벨의 데이터를 반환합니다
 */
export function getCurrentSubjectData() {
    const key = `${currentSubject}_${currentLevel}`;
    return subjectData[key] || [];
}

/**
 * 특정 과목과 레벨의 데이터를 반환합니다
 */
export function getSubjectData(subject, level) {
    const key = `${subject}_${level}`;
    return subjectData[key] || [];
}

/**
 * 현재 과목을 설정합니다
 */
export function setCurrentSubject(subject) {
    if (SUBJECTS[subject]) {
        currentSubject = subject;
        console.log(`📖 현재 과목 변경: ${SUBJECTS[subject].name}`);
        return true;
    }
    return false;
}

/**
 * 현재 레벨을 설정합니다
 */
export function setCurrentLevel(level) {
    if (LEVELS[level]) {
        currentLevel = level;
        console.log(`📊 현재 레벨 변경: Level ${level} (${LEVELS[level].name})`);
        return true;
    }
    return false;
}

/**
 * 현재 과목을 반환합니다
 */
export function getCurrentSubject() {
    return currentSubject;
}

/**
 * 현재 레벨을 반환합니다
 */
export function getCurrentLevel() {
    return currentLevel;
}

/**
 * 과목별 통계를 반환합니다
 */
export function getSubjectStats() {
    const stats = {};
    
    for (const subject of Object.keys(SUBJECTS)) {
        stats[subject] = {
            name: SUBJECTS[subject].name,
            icon: SUBJECTS[subject].icon,
            levels: {}
        };
        
        for (let level = 1; level <= 3; level++) {
            const key = `${subject}_${level}`;
            const data = subjectData[key];
            stats[subject].levels[level] = {
                loaded: !!data,
                questionCount: data ? data.length : 0
            };
        }
    }
    
    return stats;
}

/**
 * 랜덤 문제를 가져옵니다
 */
export function getRandomQuestions(subject, level, count = 10) {
    const data = getSubjectData(subject, level);
    if (!data || data.length === 0) return [];
    
    // 문제 섞기
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * 문제 형식 정규화 (기존 동물 게임과 호환성을 위해)
 */
export function normalizeQuestion(questionData, subject) {
    const normalized = {
        ...questionData,
        subject: subject,
        id: questionData.id || `${subject}_${Date.now()}_${Math.random()}`,
        type: getQuestionType(subject),
    };
    
    // 영어 과목의 경우 특별 처리
    if (subject === 'english') {
        normalized.questionText = questionData.korean;
        normalized.correctAnswer = questionData.english;
    } else {
        normalized.questionText = questionData.question;
        normalized.correctAnswer = questionData.options[questionData.answer];
    }
    
    return normalized;
}

/**
 * 과목별 문제 타입 반환
 */
function getQuestionType(subject) {
    switch (subject) {
        case 'math': return 'calculation';
        case 'english': return 'vocabulary';
        case 'social': return 'knowledge';
        case 'general': return 'knowledge';
        default: return 'general';
    }
}

/**
 * 점수 계산 (과목별 가중치 적용)
 */
export function calculateSubjectScore(subject, level, correctAnswers, totalQuestions) {
    const baseScore = Math.round((correctAnswers / totalQuestions) * 100);
    
    // 레벨별 보너스
    const levelBonus = {
        1: 1.0,
        2: 1.2,
        3: 1.5
    };
    
    // 과목별 가중치
    const subjectWeight = {
        'math': 1.2,
        'english': 1.1,
        'social': 1.0,
        'general': 1.0
    };
    
    const finalScore = Math.round(baseScore * levelBonus[level] * subjectWeight[subject]);
    
    console.log(`📊 ${SUBJECTS[subject].name} Level ${level} 점수: ${correctAnswers}/${totalQuestions} = ${finalScore}점`);
    
    return finalScore;
}

// 전역 함수로 등록 (기존 코드 호환성)
window.loadSubjectData = loadSubjectData;
window.loadAllSubjectData = loadAllSubjectData;
window.getCurrentSubjectData = getCurrentSubjectData;
window.setCurrentSubject = setCurrentSubject;
window.setCurrentLevel = setCurrentLevel;
window.getCurrentSubject = getCurrentSubject;
window.getCurrentLevel = getCurrentLevel;
window.SUBJECTS = SUBJECTS;
window.LEVELS = LEVELS;

console.log('📚 과목별 학습 데이터 시스템 초기화 완료');