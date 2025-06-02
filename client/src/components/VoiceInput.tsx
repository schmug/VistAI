import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  compact?: boolean;
  onResult: (text: string) => void;
}

/**
 * Voice input component that uses Web Speech API for speech recognition.
 * 
 * @param compact - Whether to display in compact mode
 * @param onResult - Callback when speech recognition produces text
 */
export function VoiceInput({ compact = false, onResult }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e: any) => {
      const text = Array.from((e as any).results)
        .map((r: any) => r[0].transcript)
        .join("");
      setRecognizedText(text);
      setIsRecording(false);
      onResult(text);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    // Cleanup function to prevent memory leaks
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
        } catch (error) {
          // Ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, [onResult]);

  const toggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
    } else {
      setRecognizedText("");
      setIsRecording(true);
      recognition.start();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      onClick={toggleRecording}
      className={cn(
        "hover:text-primary transition-colors",
        isRecording ? "text-error shadow-glow" : "text-muted-foreground"
      )}
    >
      <i
        className={cn(
          isRecording ? "ri-mic-fill animate-pulse" : "ri-mic-line",
          compact ? "text-base" : "text-xl"
        )}
      ></i>
      <span className="sr-only">Use voice input</span>
    </Button>
  );
}