const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Service using Google Gemini for generating summaries and analyzing submissions
 */

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Generate AI summary and analyze contribution balance using Gemini
 * @param {string} text - The submission text to analyze
 * @returns {Promise<Object>} - Summary and contribution analysis
 */
async function generateAISummary(text) {
  try {
    if (!genAI) {
      console.warn('⚠️ GEMINI_API_KEY not configured. Returning mock summary.');
      return generateMockSummary(text);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const maxLength = 12000;
    const truncatedText = text.length > maxLength
      ? text.substring(0, maxLength) + '...[truncated]'
      : text;

    console.log('🤖 Generating AI summary using Google Gemini...');

    // Use gemini-1.5-flash and explicitly force v1 stable endpoint via RequestOptions
    const model = genAI.getGenerativeModel(
      { model: 'gemini-1.5-flash' },
      { apiVersion: 'v1' }
    );

    const prompt = `You are an academic evaluator analyzing a student team project submission.

SUBMISSION TEXT:
${truncatedText}

Please analyze this submission and respond ONLY with valid JSON in exactly this format:
{
  "summary": "A concise 2-3 sentence summary of what the submission covers",
  "contribution_analysis": "Assessment of writing consistency and contribution balance across the team",
  "red_flags": ["list of specific concerns, or empty array if none"],
  "balance_score": 7
}

The balance_score should be 0-10 where 10 = perfectly balanced contributions, 0 = severely imbalanced.
Respond ONLY with the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse JSON - strip markdown code fences if present
    let cleaned = responseText;
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse Gemini JSON response, using fallback extraction');
      analysis = {
        summary: responseText.substring(0, 400),
        contribution_analysis: 'Automated balance analysis unavailable.',
        red_flags: [],
        balance_score: 5
      };
    }

    console.log('✅ Gemini AI summary generated successfully');

    return {
      summary: analysis.summary,
      contributionAnalysis: analysis.contribution_analysis,
      redFlags: analysis.red_flags || [],
      balanceScore: analysis.balance_score ?? 5,
      fullAnalysis: analysis
    };

  } catch (error) {
    console.error('❌ Gemini AI error:', error.message);
    return generateMockSummary(text);
  }
}

/**
 * Generate a mock summary when AI service is unavailable
 */
function generateMockSummary(text) {
  const wordCount = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / Math.max(sentences.length, 1);

  return {
    summary: `This submission contains approximately ${wordCount} words across ${sentences.length} sentences. ` +
             `The content appears ${wordCount > 500 ? 'comprehensive' : 'concise'} with ` +
             `${avgSentenceLength > 15 ? 'detailed' : 'brief'} explanations.`,
    contributionAnalysis: 'AI analysis unavailable — configure GEMINI_API_KEY in .env for full analysis.',
    redFlags: [],
    balanceScore: 5,
    fullAnalysis: {
      note: 'Mock summary — GEMINI_API_KEY not set',
      wordCount,
      sentenceCount: sentences.length
    }
  };
}

module.exports = { generateAISummary };
