// Firebase Cloud Functions SDK를 가져옵니다.
const { onCall } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { GenerativeModel } = require("@google/generative-ai");

// Gemini API 키를 안전하게 가져옵니다. (아래 'API 키 설정' 참고)
const GEMINI_API_KEY = process.env.GEMINI_KEY;

// Gemini AI 모델을 초기화합니다.
const genAI = new GenerativeModel(GEMINI_API_KEY, { model: "gemini-1.5-flash" });

// 'generateStory'라는 이름의 함수를 클라우드에 만듭니다.
exports.generateStory = onCall(async (request) => {
  // 게임에서 보낸 동물 정보를 받습니다.
  const animal = request.data.animal;
  logger.info("이야기 생성 요청:", animal.name);

  if (!animal || !animal.name || !animal.specialName || !animal.emoji) {
    throw new functions.https.HttpsError('invalid-argument', '동물 정보가 올바르지 않습니다.');
  }

  const prompt = `"${animal.specialName}"이라는 특별한 이름을 가진 ${animal.name}(${animal.emoji})가 주인공인 짧고 재미있는 동화를 한글로 5문장 내외로 만들어줘. 10살 아이가 이해하기 쉽고, 약간의 교훈이 담겨 있으면 좋겠어.`;

  try {
    // Gemini AI에게 이야기를 생성하도록 요청합니다.
    const result = await genAI.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    logger.info("이야기 생성 성공:", text);
    return { story: text }; // 생성된 이야기를 게임으로 돌려보냅니다.

  } catch (error) {
    logger.error("Gemini API 호출 오류:", error);
    throw new functions.https.HttpsError('internal', '이야기를 만드는 데 실패했습니다.');
  }
});
