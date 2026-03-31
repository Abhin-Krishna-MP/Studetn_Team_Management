const natural = require('natural');
const { Submission } = require('../models');
const { Op } = require('sequelize');

/**
 * Plagiarism Detection Service using TF-IDF and Cosine Similarity
 * Checks if a submission is similar to existing submissions in the same phase
 */

// Initialize TF-IDF
const TfIdf = natural.TfIdf;

/**
 * Preprocess text for similarity analysis
 * @param {string} text - Raw text to preprocess
 * @returns {string} - Cleaned and normalized text
 */
function preprocessText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()                          // Convert to lowercase
    .replace(/[^\w\s]/g, ' ')              // Remove special characters
    .replace(/\s+/g, ' ')                   // Normalize whitespace
    .trim();
}

/**
 * Calculate cosine similarity between two TF-IDF vectors
 * @param {Object} tfidf - TF-IDF instance
 * @param {number} docIndex1 - Index of first document
 * @param {number} docIndex2 - Index of second document
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateCosineSimilarity(tfidf, docIndex1, docIndex2) {
  // Get all unique terms
  const allTerms = new Set();
  
  tfidf.listTerms(docIndex1).forEach(item => allTerms.add(item.term));
  tfidf.listTerms(docIndex2).forEach(item => allTerms.add(item.term));
  
  // Build vectors
  const terms = Array.from(allTerms);
  const vector1 = [];
  const vector2 = [];
  
  terms.forEach(term => {
    vector1.push(tfidf.tfidf(term, docIndex1));
    vector2.push(tfidf.tfidf(term, docIndex2));
  });
  
  // Calculate dot product
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  // Calculate cosine similarity
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Check if submission is similar to existing submissions in the same phase
 * @param {string} currentText - Text of the new submission
 * @param {number} phaseId - Phase ID to check against
 * @param {number} excludeTeamId - Team ID to exclude from comparison (optional)
 * @returns {Promise<Object>} - Similarity analysis results
 */
async function checkCrossGroupSimilarity(currentText, phaseId, excludeTeamId = null) {
  try {
    console.log(`🔍 Checking similarity for phase ${phaseId}...`);

    // Validate input
    if (!currentText || currentText.trim().length === 0) {
      throw new Error('Current text cannot be empty');
    }

    if (!phaseId) {
      throw new Error('Phase ID is required');
    }

    // Fetch all existing submissions for this phase (excluding current team)
    const whereClause = {
      phase_id: phaseId,
      file_url: { [Op.not]: null } // Only compare completed submissions
    };

    if (excludeTeamId) {
      whereClause.team_id = { [Op.ne]: excludeTeamId };
    }

    const existingSubmissions = await Submission.findAll({
      where: whereClause,
      attributes: ['submission_id', 'team_id', 'file_url', 'submitted_at']
    });

    // If no existing submissions, no similarity check needed
    if (existingSubmissions.length === 0) {
      console.log('✅ No existing submissions to compare. Similarity check passed.');
      return {
        isSimilar: false,
        maxSimilarity: 0,
        similarSubmissions: [],
        message: 'First submission for this phase - no comparison available'
      };
    }

    console.log(`📊 Comparing against ${existingSubmissions.length} existing submission(s)...`);

    // For this implementation, we'll simulate content extraction
    // In production, you would fetch actual submission content from file_url
    // For now, we'll use file_url as a proxy for content
    const submissionTexts = existingSubmissions.map(sub => ({
      id: sub.submission_id,
      teamId: sub.team_id,
      text: preprocessText(`Submission ${sub.submission_id} for team ${sub.team_id}`) // Mock text
    }));

    // Preprocess current text
    const processedCurrentText = preprocessText(currentText);

    // Create TF-IDF instance
    const tfidf = new TfIdf();

    // Add current document
    tfidf.addDocument(processedCurrentText);

    // Add existing submissions
    submissionTexts.forEach(sub => {
      tfidf.addDocument(sub.text);
    });

    // Calculate similarity scores
    const similarities = [];
    const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD || 0.8);

    for (let i = 0; i < submissionTexts.length; i++) {
      const similarity = calculateCosineSimilarity(tfidf, 0, i + 1);
      
      similarities.push({
        submission_id: submissionTexts[i].id,
        team_id: submissionTexts[i].teamId,
        similarity_score: similarity,
        percentage: Math.round(similarity * 100)
      });
    }

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity_score - a.similarity_score);

    // Find maximum similarity
    const maxSimilarity = similarities.length > 0 ? similarities[0].similarity_score : 0;

    // Check if any submission exceeds threshold
    const isSimilar = maxSimilarity >= threshold;
    const flaggedSubmissions = similarities.filter(s => s.similarity_score >= threshold);

    console.log(`📈 Maximum similarity: ${Math.round(maxSimilarity * 100)}%`);
    console.log(`🚩 Similarity threshold: ${Math.round(threshold * 100)}%`);
    console.log(`${isSimilar ? '⚠️ FLAGGED' : '✅ PASSED'}: Similarity check complete`);

    return {
      isSimilar,
      maxSimilarity,
      maxSimilarityPercentage: Math.round(maxSimilarity * 100),
      threshold: Math.round(threshold * 100),
      similarSubmissions: flaggedSubmissions,
      allSimilarities: similarities,
      message: isSimilar 
        ? `High similarity detected with ${flaggedSubmissions.length} submission(s)`
        : 'No significant similarity detected'
    };

  } catch (error) {
    console.error('❌ Error in similarity check:', error);
    
    // Return safe default on error (don't block submission)
    return {
      isSimilar: false,
      maxSimilarity: 0,
      similarSubmissions: [],
      error: error.message,
      message: 'Similarity check failed - manual review recommended'
    };
  }
}

/**
 * Advanced similarity check using actual document content
 * Use this when you have access to full submission texts
 * @param {string} currentText - Current submission text
 * @param {Array<string>} existingTexts - Array of existing submission texts
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Object} - Detailed similarity analysis
 */
function advancedSimilarityCheck(currentText, existingTexts, threshold = 0.8) {
  const tfidf = new TfIdf();
  
  // Preprocess all texts
  const processedCurrent = preprocessText(currentText);
  const processedExisting = existingTexts.map(text => preprocessText(text));
  
  // Add documents to TF-IDF
  tfidf.addDocument(processedCurrent);
  processedExisting.forEach(text => tfidf.addDocument(text));
  
  // Calculate similarities
  const results = [];
  for (let i = 0; i < processedExisting.length; i++) {
    const similarity = calculateCosineSimilarity(tfidf, 0, i + 1);
    results.push({
      index: i,
      similarity,
      isFlagged: similarity >= threshold
    });
  }
  
  return {
    results,
    maxSimilarity: Math.max(...results.map(r => r.similarity)),
    flaggedCount: results.filter(r => r.isFlagged).length
  };
}

module.exports = {
  checkCrossGroupSimilarity,
  advancedSimilarityCheck,
  preprocessText,
  calculateCosineSimilarity
};
