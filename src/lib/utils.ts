import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanMermaidCode(code: string): string {
  // Remove ```mermaid from the start and ``` from the end
  let cleaned = code.trim();
  
  // Remove opening fence if present
  if (cleaned.startsWith('```mermaid')) {
    cleaned = cleaned.substring('```mermaid'.length);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring('```'.length);
  }
  
  // Remove closing fence if present
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  
  return cleaned.trim();
}
