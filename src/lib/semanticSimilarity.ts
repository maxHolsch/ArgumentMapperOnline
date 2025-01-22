interface Vector {
  [key: string]: number;
}

function tokenize(text: string): string[] {
  // Clean and normalize text first
  const cleanText = text
    .toLowerCase()
    // Remove speaker labels and timestamps
    .replace(/speaker [a-z]:/gi, '')
    // Remove Mermaid syntax
    .replace(/graph TD|style.*|[-]+>|[[\]]/g, '')
    // Extract text from nodes
    .replace(/[A-Z]\d*\[([^\]]+)\]/g, '$1')
    // Remove punctuation and extra whitespace
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out very short words

  return cleanText;
}

function calculateTF(tokens: string[]): Vector {
  const tf: Vector = {};
  const totalWords = tokens.length;

  tokens.forEach(token => {
    tf[token] = (tf[token] || 0) + 1;
  });

  // Normalize term frequencies
  Object.keys(tf).forEach(token => {
    tf[token] = tf[token] / totalWords;
  });

  return tf;
}

function calculateIDF(allTokens: string[][], uniqueTokens: Set<string>): Vector {
  const idf: Vector = {};
  const N = allTokens.length;

  uniqueTokens.forEach(token => {
    const docsWithTerm = allTokens.filter(doc => doc.includes(token)).length;
    idf[token] = Math.log(N / (docsWithTerm + 1)) + 1; // Add smoothing
  });

  return idf;
}

function calculateTFIDF(tf: Vector, idf: Vector): Vector {
  const tfidf: Vector = {};
  Object.keys(tf).forEach(token => {
    if (idf[token]) {
      tfidf[token] = tf[token] * idf[token];
    }
  });
  return tfidf;
}

export function cosineSimilarity(vec1: Vector, vec2: Vector): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  // Calculate dot product and norms
  const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
  
  allKeys.forEach(key => {
    const val1 = vec1[key] || 0;
    const val2 = vec2[key] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) return 0;
  
  const similarity = dotProduct / (norm1 * norm2);
  return Math.max(0, Math.min(1, similarity)); // Ensure result is between 0 and 1
}

export function compareTexts(text1: string, text2: string): number {
  // Clean and tokenize texts
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);
  
  // Get unique tokens
  const uniqueTokens = new Set([...tokens1, ...tokens2]);
  
  // Calculate TF for both texts
  const tf1 = calculateTF(tokens1);
  const tf2 = calculateTF(tokens2);
  
  // Calculate IDF using both texts
  const idf = calculateIDF([tokens1, tokens2], uniqueTokens);
  
  // Calculate TF-IDF vectors
  const tfidf1 = calculateTFIDF(tf1, idf);
  const tfidf2 = calculateTFIDF(tf2, idf);
  
  // Calculate cosine similarity
  return cosineSimilarity(tfidf1, tfidf2);
}

export function getCosineSimilarity(text1: string, text2: string): number {
  // Convert texts to word vectors
  const vector1 = textToVector(text1);
  const vector2 = textToVector(text2);

  // Calculate cosine similarity
  const dotProduct = getDotProduct(vector1, vector2);
  const magnitude1 = getMagnitude(vector1);
  const magnitude2 = getMagnitude(vector2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
}

function textToVector(text: string): Vector {
  const words = text.toLowerCase().split(/\W+/);
  const vector: Vector = {};
  
  words.forEach(word => {
    if (word) {
      vector[word] = (vector[word] || 0) + 1;
    }
  });
  
  return vector;
}

function getDotProduct(vector1: Vector, vector2: Vector): number {
  let dotProduct = 0;
  
  Object.keys(vector1).forEach(key => {
    if (vector2[key]) {
      dotProduct += vector1[key] * vector2[key];
    }
  });
  
  return dotProduct;
}

function getMagnitude(vector: Vector): number {
  return Math.sqrt(
    Object.values(vector).reduce((sum, value) => sum + value * value, 0)
  );
} 