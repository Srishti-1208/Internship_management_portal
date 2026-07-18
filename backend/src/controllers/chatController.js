const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash"
    });

    const result = await model.generateContent(message);

    const response = result.response.text();

    res.json({
      success: true,
      reply: response
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "AI Error"
    });
  }
};