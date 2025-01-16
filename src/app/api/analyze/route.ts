import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(request: Request) {
  try {
    const { action, transcript, mainClaim, diagram, instruction } = await request.json();

    switch (action) {
      case 'getMainClaim': {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          temperature: 0,
          messages: [{
            role: "user",
            content: `given the following transcript, in one sentence what is the main claim of the debate around?\n\n${transcript}`
          }]
        });
        return NextResponse.json({ result: message.content[0].text });
      }

      case 'generateDiagram': {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          temperature: 0,
          messages: [{
            role: "user",
            content: `Given the following debate and transcript, please in a mermaid diagram write out the main points centered around this main claim below.
If subclaims have counter arguments, please make sure that these are mentioned
The style of writing should be concise and informative, such that someone reading this for the first time could easily understand it
*Map out your evidential relationships using Wigmore's symbols *
* Connect them with arrows showing logical relationships * *
* *Use green lines for supporting evidence *
* Use red lines for opposing evidence
(Main point of debate here taken from run 1)

Transcript:
${transcript}`
          }]
        });
        return NextResponse.json({ result: message.content[0].text });
      }

      case 'improveDiagram': {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          temperature: 0,
          messages: [{
            role: "user",
            content: `please make this diagram more easily visible. use colors that work well together. Also, make sure to structure counter-arguments as opposing main subpoints. please keep it in a tree format

Original diagram:
${diagram}`
          }]
        });
        return NextResponse.json({ result: message.content[0].text });
      }

      case 'makeMoreDescriptive': {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          temperature: 0,
          messages: [{
            role: "user",
            content: `given the following graph (run 3) and transcript (transcript.txt), please make the graph text more descriptive and explanatory to the argument. It should be that you can read this argument easily from the main claim. Use simple language, avoid ai jargon Please also make the main claim a question. Include only the code, nothing else

Original diagram:
${diagram}

Original transcript:
${transcript}`
          }]
        });
        return NextResponse.json({ result: message.content[0].text });
      }

      case 'editGraph': {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2048,
          temperature: 0,
          messages: [{
            role: "user",
            content: `Please modify the following Mermaid diagram based on these voice instructions. Keep the same style and format, but implement the requested changes.

Current Mermaid diagram:
${diagram}

Voice instructions:
${instruction}

Please provide only the modified Mermaid diagram code, nothing else.`
          }]
        });
        return NextResponse.json({ result: message.content[0].text });
      }

      case 'checkSimilarity': {
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          temperature: 0,
          messages: [{
            role: "user",
            content: `Compare the semantic similarity between this transcript and the mermaid diagram that represents it. 
            Return only a number between 0 and 1, where 1 means perfect semantic similarity and 0 means completely different.
            Consider the main ideas, supporting points, and relationships between concepts.

            Transcript:
            ${transcript}

            Mermaid Diagram:
            ${diagram}

            Return only the number, no other text.`
          }]
        });

        const similarity = parseFloat(message.content[0].text);
        return NextResponse.json({ result: similarity });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 