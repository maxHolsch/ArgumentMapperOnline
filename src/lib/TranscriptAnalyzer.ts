import { Anthropic } from '@anthropic-ai/sdk';
import { compareTexts } from './semanticSimilarity';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 50000; // 50 seconds

export class TranscriptAnalyzer {
    private async fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response;
        } catch (error) {
            if (retries > 0) {
                // Add exponential backoff
                const delay = Math.pow(2, MAX_RETRIES - retries) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
    }

    private chunkText(text: string, maxChunkSize = 4000): string[] {
        const words = text.split(' ');
        const chunks: string[] = [];
        let currentChunk = '';

        for (const word of words) {
            if ((currentChunk + ' ' + word).length <= maxChunkSize) {
                currentChunk += (currentChunk ? ' ' : '') + word;
            } else {
                chunks.push(currentChunk);
                currentChunk = word;
            }
        }
        
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    async getMainClaim(transcript: string): Promise<string> {
        try {
            const response = await this.fetchWithRetry('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getMainClaim',
                    transcript
                })
            });

            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('Error getting main claim:', error);
            throw error;
        }
    }

    async generateMermaidDiagram(transcript: string, mainClaim: string): Promise<string> {
        try {
            // Split long transcripts into chunks
            const chunks = this.chunkText(transcript);
            let combinedResult = '';

            for (const chunk of chunks) {
                const response = await this.fetchWithRetry('/api/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'generateDiagram',
                        transcript: chunk,
                        mainClaim,
                        previousResult: combinedResult
                    })
                });

                const data = await response.json();
                combinedResult = data.result;
            }

            return combinedResult;
        } catch (error) {
            console.error('Error generating diagram:', error);
            throw error;
        }
    }

    async improveDiagram(diagram: string): Promise<string> {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'improveDiagram',
                    diagram
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.result;
        } catch (e) {
            throw new Error(`Error in improving diagram: ${e}`);
        }
    }

    async makeMoreDescriptive(diagram: string, transcript: string): Promise<string> {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'makeMoreDescriptive',
                    diagram,
                    transcript
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.result;
        } catch (e) {
            throw new Error(`Error in making diagram more descriptive: ${e}`);
        }
    }

    async checkSemanticSimilarity(transcript: string, diagram: string): Promise<number> {
        try {
            // Extract text content from diagram (remove Mermaid syntax)
            const diagramText = diagram
                .replace(/graph TD|style.*|[-]+>|[[\]]/g, '') // Remove Mermaid syntax
                .replace(/[A-Z]\d*\[([^\]]+)\]/g, '$1')      // Extract text from nodes
                .trim();

            // Log the actual texts being compared
            console.log('Original Transcript:', transcript);
            console.log('Extracted Diagram Text:', diagramText);
            
            // Calculate similarity
            const similarity = compareTexts(transcript, diagramText);
            
            return similarity;
        } catch (e) {
            console.error(`Error checking semantic similarity: ${e}`);
            return 0;
        }
    }
} 