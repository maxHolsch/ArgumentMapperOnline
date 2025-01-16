import { Anthropic } from '@anthropic-ai/sdk';
import { compareTexts } from './semanticSimilarity';

export class TranscriptAnalyzer {
    async getMainClaim(transcript: string): Promise<string> {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'getMainClaim',
                    transcript
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.result;
        } catch (e) {
            throw new Error(`Error in getting main claim: ${e}`);
        }
    }

    async generateMermaidDiagram(transcript: string, mainClaim: string): Promise<string> {
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'generateDiagram',
                    transcript,
                    mainClaim
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.result;
        } catch (e) {
            throw new Error(`Error in generating Mermaid diagram: ${e}`);
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