# ArgumentMapperOnline

An AI-assisted argument mapping tool that converts audio recordings or text into structured, compelling, and intuitive visual maps of discussions.

## Overview

ArgumentMapperOnline is an open-source tool designed to improve communal deliberation through automated argument mapping. It helps transform complex group discussions into clear, visual representations that make it easier to understand different viewpoints and reach consensus.

## Features

- **Audio to Visual Maps**: Convert audio recordings into structured argument maps
- **Text-based Input**: Process written discussions and transcripts
- **Speaker Identification**: Automatically attribute arguments to specific speakers
- **Interactive Visualization**: Edit and refine generated maps through an intuitive interface
- **Voice Commands**: Modify maps using natural language commands
- **Logical Fallacy Detection**: Automated identification of common argumentative flaws
- **Real-time Updates**: Immediate visualization of changes and edits

## Technology Stack

- **Frontend**: React with Tailwind CSS
- **Transcription**: Assembly.ai API
- **Visualization**: Mermaid.js
- **Language Models**: Claude 3.5 Sonnet
- **Graph Management**: LangGraph

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- Assembly.ai API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/maxHolsch/ArgumentMapperOnline.git
cd ArgumentMapperOnline
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
# Add your Assembly.ai API key to .env
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. **Input**: Upload an audio recording or paste text from a discussion
2. **Processing**: The system will automatically:
   - Transcribe audio (if applicable)
   - Identify speakers
   - Extract key arguments
   - Generate an initial argument map

3. **Refinement**: Use the interactive interface to:
   - Edit argument connections
   - Adjust node positions
   - Add or remove elements
   - Refine argument descriptions

4. **Export**: Save or share your argument maps in various formats

## Key Features in Detail

### Argument Mapping Process

The system follows a four-stage process:
1. Main claim extraction
2. Initial diagram generation
3. Visual enhancement
4. Semantic refinement

### Quality Control

- Semantic similarity analysis
- Embedding space diversity checks
- Automated validation and verification
- Human-in-the-loop refinement options

### Fallacy Detection

Currently detects:
- Strawman arguments
- Red herrings
- Non-sequitur statements


## Limitations

- Currently optimized for small to medium-sized group discussions
- Requires good quality audio for accurate transcription
- May need human verification for complex argument structures
- Limited to English language content currently

## Future Directions

- Enhanced rationality analysis
- Improved scaling for larger groups
- Integration with other collaboration tools
- Multi-language support
- Advanced fallacy detection

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Citation

If you use this tool in your research, please cite:
```
Holschneider, M. (2025). Solve Deliberation and Solve Everything Else. 
Viterbi School of Engineering, University of Southern California.
```

## Contact

- Project Lead: Max Holschneider
- Demo: [www.argumentmapper.xyz](http://www.argumentmapper.xyz)

## Acknowledgments

- Viterbi School of Engineering, USC
- Assembly.ai for their transcription API
- The open-source community behind Mermaid.js
