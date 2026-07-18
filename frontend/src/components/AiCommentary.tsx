import { useEffect, useRef, useState } from "react";
import GlassCard from "./GlassCard";
import { Sparkles, MessageSquare } from "lucide-react";

interface CommentaryLine {
  commentary: string;
  timestamp: string;
}

interface AiCommentaryProps {
  commentaryList: CommentaryLine[];
}

export default function AiCommentary({ commentaryList }: AiCommentaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [typedLatestText, setTypedLatestText] = useState("");
  const latestCommentary = commentaryList[commentaryList.length - 1]?.commentary || "";

    // Typewriter effect for the latest commentary line
    useEffect(() => {
      if (!latestCommentary) {
        setTypedLatestText("");
        return;
      }
  
      setTypedLatestText("");
      const chars = Array.from(latestCommentary);
      let i = 0;
      const speed = 25; // ms per character
      const interval = setInterval(() => {
        const charToAppend = chars[i];
        setTypedLatestText((prev) => prev + charToAppend);
        i++;
        if (i >= chars.length) {
          clearInterval(interval);
        }
      }, speed);
  
      return () => clearInterval(interval);
    }, [latestCommentary]);

  // Auto-scroll to the bottom when new commentary arrives
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [commentaryList, typedLatestText]);

  return (
    <GlassCard className="mt-8 border-neon/20 overflow-hidden" padding="p-6">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
        <h3 className="text-neon font-heading font-black text-lg tracking-widest flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-neon animate-pulse" />
          AI LIVE COMMENTARY
        </h3>
        <span className="text-[10px] font-black tracking-wider text-gray-500 uppercase px-2 py-0.5 bg-neon/10 rounded-full border border-neon/20">
          GEMINI 2.0 FLASH
        </span>
      </div>

      {commentaryList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
          <MessageSquare className="w-10 h-10 opacity-30 animate-bounce" />
          <p className="font-heading text-sm font-bold tracking-wider">
            WAITING FOR DELIVERIES...
          </p>
          <p className="text-xs text-gray-600">
            AI commentary will start streaming once the scorer records a ball.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Latest commentary with typewriter effect */}
          {typedLatestText && (
            <div className="p-4 bg-neon/5 border border-neon/30 rounded-xl relative overflow-hidden group shadow-[0_0_15px_rgba(178,255,5,0.05)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon"></div>
              <span className="text-[9px] font-bold tracking-widest text-neon uppercase block mb-1">
                Latest Delivery
              </span>
              <p className="text-white font-heading font-bold text-base leading-relaxed">
                {typedLatestText}
                <span className="inline-block w-1.5 h-4 bg-neon ml-1 animate-ping" />
              </p>
            </div>
          )}

          {/* Scrolling history of past commentary lines */}
          <div
            ref={containerRef}
            className="max-h-60 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar divide-y divide-white/5"
          >
            {commentaryList
              .slice(0, -1) // Exclude the latest line as it's highlighted above
              .reverse() // Show newest first in history
              .map((item, index) => (
                <div key={index} className="pt-3 first:pt-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">
                      Ball {commentaryList.length - 1 - index}
                    </span>
                    <span className="text-[9px] text-gray-600">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed font-heading font-medium">
                    {item.commentary}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
