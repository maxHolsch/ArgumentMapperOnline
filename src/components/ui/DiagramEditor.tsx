'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import GitHubButton from 'react-github-btn'
import Editor from "@monaco-editor/react";
import mermaid from "mermaid";
import { Toaster, toast } from 'react-hot-toast';

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ZoomIn, ZoomOut, Share2, Download, Palette, Mic } from 'lucide-react';
import { TranscriptAnalyzer } from '@/lib/TranscriptAnalyzer';
import { cleanMermaidCode } from '@/lib/utils';


export default function DiagramEditor() {
  const [mounted, setMounted] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'config'>('code');
  const [code, setCode] = useState(`graph TD
    A[Example: How do sugar-coated stories in children's media affect their understanding of life?]
    
    B[Positive Effects on Learning]
    C[Possible Drawbacks]
    
    B1[Helps children learn basic right from wrong through simple stories]
    B2[Gives children hope and dreams for the future]
    B3[Makes difficult topics easier for kids to understand]
    
    C1[Makes everything seem black and white without middle ground]
    C2[Can lead to disappointment when real life is different]
    C3[Might delay learning about life's complexities]
    
    S1[Kids need clear boundaries before learning exceptions]
    S2[Big dreams help move society forward]
    S3[Complex topics need simple starting points]
    
    O1[Real life has many gray areas]
    O2[Finding out truth can be emotionally hard]
    O3[May take longer to understand real world]

    A --> B
    A --> C
    
    B --> B1
    B --> B2
    B --> B3
    
    C --> C1
    C --> C2
    C --> C3
    
    B1 --- S1
    B2 --- S2
    B3 --- S3
    
    C1 --- O1
    C2 --- O2
    C3 --- O3

    style A fill:#e6ffe6,stroke:#006600,stroke-width:2px
    style B fill:#e6f3ff,stroke:#0066cc,stroke-width:2px
    style C fill:#ffe6e6,stroke:#cc0000,stroke-width:2px
    style B1 fill:#e6f3ff,stroke:#0066cc
    style B2 fill:#e6f3ff,stroke:#0066cc
    style B3 fill:#e6f3ff,stroke:#0066cc
    style C1 fill:#ffe6e6,stroke:#cc0000
    style C2 fill:#ffe6e6,stroke:#cc0000
    style C3 fill:#ffe6e6,stroke:#cc0000
    style S1 fill:#f0f9ff,stroke:#0066cc
    style S2 fill:#f0f9ff,stroke:#0066cc
    style S3 fill:#f0f9ff,stroke:#0066cc
    style O1 fill:#fff0f0,stroke:#cc0000
    style O2 fill:#fff0f0,stroke:#cc0000
    style O3 fill:#fff0f0,stroke:#cc0000`);
  const [config, setConfig] = useState(`{
  "theme": "default",
  "logLevel": 1,
  "securityLevel": "loose",
  "startOnLoad": true
}`);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isPanning, setIsPanning] = useState(false);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  if (!process.env.NEXT_PUBLIC_ASSEMBLY_AI_API_KEY) {
    console.error('ASSEMBLY_AI_API_KEY is not set in environment variables');
  }

  const ASSEMBLY_AI_API_KEY = process.env.NEXT_PUBLIC_ASSEMBLY_AI_API_KEY;
  const [editorView, setEditorView] = useState<'code' | 'transcript'>('transcript');
  const [uploadedTranscript, setUploadedTranscript] = useState<string>('');
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [voiceInstruction, setVoiceInstruction] = useState<string>('');
  const [voiceEditRecorder, setVoiceEditRecorder] = useState<MediaRecorder | null>(null);
  const [voiceEditChunks, setVoiceEditChunks] = useState<Blob[]>([]);

  // Initialize mermaid once
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        useMaxWidth: false
      },
      loadOnDemand: false
    });
    setMounted(true);
  }, []);

  // Render diagram with error handling
  const renderDiagram = useCallback(async () => {
    if (!mounted || !diagramRef.current) return;

    try {
      diagramRef.current.innerHTML = '';
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add error handling for module loading
      try {
        const { svg } = await mermaid.render(id, code);
        diagramRef.current.innerHTML = svg;

        // Add click handlers to both text elements and nodes
        const svgElement = diagramRef.current.querySelector('svg');
        if (svgElement) {
          // Handle text elements
          const textElements = svgElement.querySelectorAll('text');
          textElements.forEach(textElement => {
            textElement.style.cursor = 'pointer';
            textElement.addEventListener('click', createEditHandler(textElement));
          });

          // Handle nodes (rectangles with text)
          const nodeElements = svgElement.querySelectorAll('.node');
          nodeElements.forEach(node => {
            const textElement = node.querySelector('text, .nodeLabel');
            if (textElement) {
              node.style.cursor = 'pointer';
              node.addEventListener('click', createEditHandler(textElement));
            }
          });
        }
      } catch (renderError) {
        console.error('Mermaid render error:', renderError);
        // Try re-initializing mermaid
        await mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            useMaxWidth: false
          }
        });
        // Try rendering again
        const { svg } = await mermaid.render(id, code);
        diagramRef.current.innerHTML = svg;
      }
    } catch (error) {
      console.error('Failed to render diagram:', error);
      if (diagramRef.current) {
        diagramRef.current.innerHTML = `<div class="text-red-500">Failed to render diagram: ${error.message}</div>`;
      }
    }
  }, [code, mounted]);

  // Separate the edit handler creation into its own function
  const createEditHandler = (element: Element) => (e: MouseEvent) => {
    if (isPanning) return; // Don't edit text if we're panning
    
    e.stopPropagation();
    const text = element.textContent || '';
    setEditingNode(text);
    setEditingText(text);
    
    // Create and position input element
    const rect = element.getBoundingClientRect();
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed'; // Change to fixed positioning
    input.style.left = `${rect.left}px`;
    input.style.top = `${rect.top}px`;
    input.style.width = `${Math.max(rect.width + 50, 100)}px`;
    input.style.height = `${rect.height}px`;
    input.style.zIndex = '1000';
    input.style.backgroundColor = 'white';
    input.style.border = '1px solid #ccc';
    input.style.padding = '2px 4px';
    input.style.fontSize = window.getComputedStyle(element).fontSize;

    // Handle input events
    input.onblur = () => {
      if (input.value !== text) {
        updateNodeText(text, input.value);
      }
      input.remove();
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = text;
        input.blur();
      }
    };

    document.body.appendChild(input);
    input.focus();
    input.select();
  };

  // Re-render on code changes
  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram();
    }, 300);

    return () => clearTimeout(timer);
  }, [code, renderDiagram]);

  // Handle config changes
  const handleConfigChange = (value: string | undefined) => {
    setConfig(value || '');
    try {
      const configObj = JSON.parse(value || '{}');
      mermaid.initialize(configObj);
      renderDiagram();
    } catch (error) {
      console.error('Invalid config JSON:', error);
    }
  };

  // Add near the top of the component
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get('code');
    if (sharedCode) {
      try {
        const decodedCode = atob(sharedCode);
        setCode(decodedCode);
      } catch (e) {
        console.error('Failed to decode shared URL');
      }
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      const target = e.target as Element;
      // Only start panning if we're not clicking text or a node
      if (!target.closest('text') && !target.closest('.node')) {
        setIsPanning(true);
        setStartPanPosition({
          x: e.clientX - panPosition.x,
          y: e.clientY - panPosition.y
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanPosition({
        x: e.clientX - startPanPosition.x,
        y: e.clientY - startPanPosition.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/mp3'
      });
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      // If MP3 is not supported, fallback to WebM
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.start(1000);
        setMediaRecorder(recorder);
        setAudioChunks(chunks);
        setIsRecording(true);
        toast.success('Recording started');
      } catch (fallbackError) {
        console.error('Error accessing microphone:', fallbackError);
        toast.error('Could not access microphone');
      }
    }
  };

  const stopRecording = useCallback(async () => {
    if (!mediaRecorder) return;

    return new Promise<void>((resolve) => {
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { 
          type: mediaRecorder.mimeType 
        });
        await uploadToAssemblyAI(audioBlob);
        setAudioChunks([]);
        resolve();
      };

      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    });
  }, [mediaRecorder, audioChunks]);

  const uploadToAssemblyAI = async (audioBlob: Blob) => {
    try {
      const loadingToast = toast.loading('Processing audio...');

      // Convert to base64
      const buffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // First, upload the audio file
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY,
          'content-type': 'application/octet-stream',
        },
        body: audioBlob
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.upload_url;

      // Then, request the transcript
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en',
          format_text: true
        })
      });

      if (!transcriptResponse.ok) {
        const errorText = await transcriptResponse.text();
        throw new Error(`Transcript request failed: ${errorText}`);
      }

      const transcriptResult = await transcriptResponse.json();
      const transcriptId = transcriptResult.id;

      // Poll for the result
      let transcript = await pollTranscriptResult(transcriptId);
      setUploadedTranscript(transcript);
      setLastTranscript(transcript);
      toast.dismiss(loadingToast);
      toast.success('Transcription completed!');
      
    } catch (error) {
      console.error('Error in AssemblyAI pipeline:', error);
      toast.error(`Transcription failed: ${error.message}`);
    }
  };

  const pollTranscriptResult = async (transcriptId: string): Promise<string> => {
    const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
    
    while (true) {
      const response = await fetch(pollingEndpoint, {
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY
        }
      });

      const result = await response.json();

      if (result.status === 'completed') {
        return result.text;
      } else if (result.status === 'error') {
        throw new Error(`Transcription failed: ${result.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  };

  const checkSimilarity = async (transcript: string, diagram: string) => {
    const analyzer = new TranscriptAnalyzer();
    const similarity = await analyzer.checkSemanticSimilarity(transcript, diagram);
    console.log(`Semantic Similarity Score: ${(similarity * 100).toFixed(1)}%`);
    if (similarity < 0.7) {
        console.warn('Warning: Low semantic similarity between transcript and diagram');
    }
  };

  const processTranscript = async (transcript: string) => {
    try {
        const loadingToast = toast.loading('Processing transcript...');
        const analyzer = new TranscriptAnalyzer();

        // Log the initial transcript
        console.log('Processing Transcript:', transcript);

        // Run the analysis pipeline
        const mainClaim = await analyzer.getMainClaim(transcript);
        const initialDiagram = await analyzer.generateMermaidDiagram(transcript, mainClaim);
        const improvedDiagram = await analyzer.improveDiagram(initialDiagram);
        const finalDiagram = await analyzer.makeMoreDescriptive(improvedDiagram, transcript);

        setCode(cleanMermaidCode(finalDiagram));
        
        // Add delay to ensure diagram is updated
        setTimeout(async () => {
            // Check similarity with the final diagram
            const similarity = await analyzer.checkSemanticSimilarity(transcript, finalDiagram);
            console.log('Similarity Score:', similarity);
            
            if (similarity === 0) {
                console.warn('Zero similarity detected - Debug Info:');
                console.log('Final Transcript:', transcript);
                console.log('Final Diagram:', finalDiagram);
            }
        }, 1000);
        
        toast.dismiss(loadingToast);
        toast.success('Transcript processed successfully!');
    } catch (error) {
        console.error('Error processing transcript:', error);
        toast.error('Failed to process transcript');
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const loadingToast = toast.loading('Processing uploaded file...');
      
      if (file.type.includes('audio/')) {
        // Handle audio file - still use AssemblyAI for transcription
        await uploadToAssemblyAI(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        // Handle text file - just store the text without processing
        const text = await file.text();
        setUploadedTranscript(text);
        setLastTranscript(text); // Store in lastTranscript so it can be processed later
        toast.success('Transcript uploaded successfully');
      } else {
        toast.error('Please upload an audio file (.mp3) or text file (.txt)');
      }
      
      toast.dismiss(loadingToast);
    } catch (error) {
      console.error('Error processing uploaded file:', error);
      toast.error('Failed to process file');
    }
  };

  const getTranscriptFromRecording = async (): Promise<string | null> => {
    if (audioChunks.length === 0) return null;
    
    const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
    
    try {
      // Upload to AssemblyAI
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY
        },
        body: audioBlob
      });

      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.upload_url;

      // Request transcription
      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en'
        })
      });

      const transcriptResult = await transcriptResponse.json();
      const instruction = await pollTranscriptResult(transcriptResult.id);
      setVoiceInstruction(instruction); // Store in separate state
      return instruction;
    } catch (error) {
      console.error('Error getting voice instruction:', error);
      toast.error('Failed to transcribe voice instruction');
      return null;
    }
  };

  const editGraphWithVoice = async (instruction: string, currentDiagram: string) => {
    try {
      const loadingToast = toast.loading('Processing voice edit...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'editGraph',
          instruction, // Use instruction instead of transcript
          diagram: currentDiagram
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process voice edit');
      }

      const { result } = await response.json();
      setCode(cleanMermaidCode(result));
      toast.dismiss(loadingToast);
      toast.success('Graph updated based on voice instructions!');
    } catch (error) {
      console.error('Error processing voice edit:', error);
      toast.error('Failed to edit graph with voice instructions');
    }
  };

  const updateNodeText = (oldText: string, newText: string) => {
    // Update the mermaid code by replacing the old text with new text
    const updatedCode = code.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
    setCode(updatedCode);
    setEditingNode(null);
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) { // Only zoom when Ctrl/Cmd is pressed
      e.preventDefault();
      
      const diagram = diagramRef.current;
      if (!diagram) return;

      // Get mouse position relative to the diagram container
      const rect = diagram.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new zoom level
      const delta = -e.deltaY;
      const zoomFactor = 0.1;
      const newZoom = delta > 0 
        ? Math.min(zoomLevel + zoomFactor, 3) 
        : Math.max(zoomLevel - zoomFactor, 0.5);

      if (newZoom !== zoomLevel) {
        // Calculate new pan position to keep mouse point fixed
        const scale = newZoom / zoomLevel;
        const newX = mouseX - (mouseX - panPosition.x) * scale;
        const newY = mouseY - (mouseY - panPosition.y) * scale;

        setZoomLevel(newZoom);
        setPanPosition({ x: newX, y: newY });
      }
    }
  };

  // Add this useEffect to handle wheel events
  useEffect(() => {
    const diagram = diagramRef.current;
    if (!diagram) return;

    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleWheel(e);
      }
    };

    diagram.addEventListener('wheel', wheelHandler, { passive: false });
    return () => {
      diagram.removeEventListener('wheel', wheelHandler);
    };
  }, [zoomLevel, panPosition, handleWheel]);

  const startVoiceEditRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      try {
        // Try MP3 first
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/mp3'
        });
        
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        recorder.start(1000);
        setVoiceEditRecorder(recorder);
        setVoiceEditChunks(chunks);
        setIsRecording(true);
      } catch (mp3Error) {
        // Fallback to WebM if MP3 is not supported
        try {
          const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm'
          });
          
          const chunks: Blob[] = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };
          
          recorder.start(1000);
          setVoiceEditRecorder(recorder);
          setVoiceEditChunks(chunks);
          setIsRecording(true);
        } catch (webmError) {
          console.error('Error setting up recorder:', webmError);
          toast.error('Could not initialize audio recording');
        }
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopVoiceEditRecording = async () => {
    if (voiceEditRecorder && voiceEditRecorder.state !== 'inactive') {
      voiceEditRecorder.stop();
      setIsRecording(false);
      voiceEditRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const getVoiceEditInstructions = async (): Promise<string | null> => {
    if (voiceEditChunks.length === 0) return null;
    
    const audioBlob = new Blob(voiceEditChunks, { type: 'audio/mp3' });
    
    try {
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY
        },
        body: audioBlob
      });

      const uploadResult = await uploadResponse.json();
      const audioUrl = uploadResult.upload_url;

      const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'authorization': ASSEMBLY_AI_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en'
        })
      });

      const transcriptResult = await transcriptResponse.json();
      const instruction = await pollTranscriptResult(transcriptResult.id);
      return instruction;
    } catch (error) {
      console.error('Error getting voice instruction:', error);
      toast.error('Failed to transcribe voice instruction');
      return null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-[#d2b48c]/90 text-white p-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold">Argument Mapper</span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={activeTab === 'code' ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab('code')}
            >
              Code
            </Button>
            <Button 
              variant={activeTab === 'config' ? "secondary" : "ghost"} 
              size="sm"
              onClick={() => setActiveTab('config')}
            >
              Config
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const params = new URLSearchParams();
                params.set('code', btoa(code));
                const url = `${window.location.origin}?${params.toString()}`;
                navigator.clipboard.writeText(url);
                toast.success('Share URL copied to clipboard!');
              }}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const svg = diagramRef.current?.querySelector('svg');
                if (svg) {
                  // Get original dimensions
                  const bbox = svg.getBBox();
                  const scaleFactor = 4; // Increase this for even higher resolution
                  
                  // Create a copy of the SVG with higher resolution
                  const svgCopy = svg.cloneNode(true) as SVGElement;
                  svgCopy.setAttribute('width', (bbox.width * scaleFactor).toString());
                  svgCopy.setAttribute('height', (bbox.height * scaleFactor).toString());
                  svgCopy.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
                  
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  
                  // Set canvas size to the scaled dimensions
                  canvas.width = bbox.width * scaleFactor;
                  canvas.height = bbox.height * scaleFactor;
                  
                  const data = new XMLSerializer().serializeToString(svgCopy);
                  const img = new Image();
                  
                  img.onload = () => {
                    if (ctx) {
                      ctx.fillStyle = bgColor;
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                    const a = document.createElement('a');
                    a.download = 'argument-map.png';
                    a.href = canvas.toDataURL('image/png');
                    a.click();
                    toast.success('High-resolution diagram downloaded!');
                  };
                  
                  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
                }
              }}
            >
              <Download className="h-4 w-4" />
            </Button>
            <GitHubButton
              href="https://github.com/maxHolsch"
              data-color-scheme="no-preference: light; light: light; dark: light;"
              data-size="large"
              aria-label="Follow @maxHolsch on GitHub"
            >
              @maxHolsch
            </GitHubButton>

            <div className="flex items-center gap-2 border border-white/20 rounded-full px-3 py-1 ml-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                className={isRecording ? "text-red-500" : ""}
              >
                <Mic className="h-4 w-4 mr-1" />
                {isRecording ? "Stop" : "Record"}
              </Button>

              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Create an invisible file input
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = 'audio/*,.txt'; // Accept audio files and .txt files
                  fileInput.style.display = 'none';
                  
                  fileInput.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      await uploadFile(file);
                    }
                  };
                  
                  fileInput.click();
                }}
              >
                Upload File
              </Button>

              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (lastTranscript) {
                    processTranscript(lastTranscript);
                    toast.success('Processing transcript...');
                  } else {
                    toast.error('Please record or upload a transcript first');
                  }
                }}
              >
                Process Transcript
              </Button>

              <Button 
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (isRecording) {
                    await stopVoiceEditRecording();
                    const currentInstructions = await getVoiceEditInstructions();
                    if (currentInstructions) {
                      await editGraphWithVoice(currentInstructions, code);
                      setVoiceEditChunks([]); // Clear chunks for next recording
                    }
                  } else {
                    toast.success('Recording started - describe your changes');
                    await startVoiceEditRecording();
                  }
                }}
              >
                <Mic className="h-4 w-4 mr-1" />
                Edit Graph with Voice
              </Button>
            </div>
          </div>
        </div>

   
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={50}>
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-center gap-4 p-2 border-b">
              <div className="flex items-center space-x-2">
                <Button
                  variant={editorView === 'code' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setEditorView('code')}
                >
                  Code View
                </Button>
                <Button
                  variant={editorView === 'transcript' ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setEditorView('transcript')}
                >
                  Transcript View
                </Button>
              </div>
            </div>
            
            {editorView === 'code' ? (
              <Editor
                height="100%"
                defaultLanguage={activeTab === 'code' ? 'markdown' : 'json'}
                language={activeTab === 'code' ? 'markdown' : 'json'}
                theme="vs-dark"
                value={activeTab === 'code' ? code : config}
                onChange={activeTab === 'code' ? 
                  (value: string | undefined) => setCode(value || '') : 
                  (value: string | undefined) => handleConfigChange(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div className="h-full p-4 bg-[#1e1e1e] text-white overflow-auto">
                <h2 className="text-lg font-semibold mb-4">Uploaded Transcript</h2>
                {uploadedTranscript ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {uploadedTranscript}
                  </pre>
                ) : (
                  <p className="text-gray-400 italic">
                    No transcript uploaded yet. Upload an audio or text file to see the transcript here.
                  </p>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>
          <div 
            className="h-full p-4 relative overflow-hidden"
            style={{ 
              backgroundColor: bgColor,
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
              }
            }}
          >
            <div className="absolute z-10 top-10 right-10 flex gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                title="Change background color"
              />
              <Button 
                variant="secondary" 
                size="icon"
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button 
                variant="secondary" 
                size="icon"
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
            <div 
              style={{ 
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                transformOrigin: 'top left',
                transition: isPanning ? 'none' : 'transform 0.2s'
              }}
            >
              <div ref={diagramRef} className="mermaid" />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <Toaster position="bottom-right" />
    </div>
  );
}
