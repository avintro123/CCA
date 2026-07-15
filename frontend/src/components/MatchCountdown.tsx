import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import GlassCard from "./GlassCard";
import { Clock, Play } from "lucide-react";

interface CountdownMatch {
  _id: string;
  teamA: { name: string; _id: string };
  teamB: { name: string; _id: string };
  date: string;
}

export default function MatchCountdown() {
  const navigate = useNavigate();
  const [match, setMatch] = useState<CountdownMatch | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("http://localhost:3000/match");
        const data = await res.json();
        if (data.data) {
          // Find closest upcoming SCHEDULED match
          const upcoming = data.data
            .filter((m: any) => m.status === "SCHEDULED" && m.date)
            .map((m: any) => ({
              ...m,
              timeVal: new Date(m.date).getTime(),
            }))
            .filter((m: any) => m.timeVal > Date.now())
            .sort((a: any, b: any) => a.timeVal - b.timeVal)[0];

          if (upcoming) {
            setMatch(upcoming);
          }
        }
      } catch (err) {
        console.error("Failed to load matches for countdown", err);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!match) return;

    const targetTime = new Date(match.date).getTime();

    const updateTimer = () => {
      const difference = targetTime - Date.now();

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, total: difference });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [match]);

  if (!match || timeLeft.total <= 0) return null;

  // Formatting digits to 2-digit format
  const formatDigit = (num: number) => String(num).padStart(2, "0");

  const hStr = formatDigit(timeLeft.hours);
  const mStr = formatDigit(timeLeft.minutes);
  const sStr = formatDigit(timeLeft.seconds);

  return (
    <div className="mb-12">
      <GlassCard padding="p-6 md:p-8" className="gradient-mesh-hero border-neon/30 relative overflow-hidden">
        {/* Soft background accents */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-purple/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Match Info label */}
          <div className="text-center md:text-left flex-1">
            <span className="text-[10px] font-black uppercase tracking-[4px] text-neon flex items-center gap-2 justify-center md:justify-start mb-2">
              <Clock className="w-4 h-4 animate-spin-slow" />
              UPCOMING MATCHDAY COUNTDOWN
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-white mt-1">
              <span className="hover:text-neon cursor-pointer transition-colors" onClick={() => navigate(`/team/${match.teamA._id}`)}>
                {match.teamA.name}
              </span>
              <span className="text-neon/50 text-base font-black mx-3">VS</span>
              <span className="hover:text-neon cursor-pointer transition-colors" onClick={() => navigate(`/team/${match.teamB._id}`)}>
                {match.teamB.name}
              </span>
            </h2>
            <p className="text-gray-400 text-xs mt-2 font-medium tracking-[0.5px]">
              Scheduled: {new Date(match.date).toLocaleString()}
            </p>
          </div>

          {/* Countdown timer */}
          <div className="flex gap-4 items-center">
            {/* Hours card */}
            <div className="flex flex-col items-center">
              <div className="flex gap-[2px]">
                {hStr.split("").map((digit, i) => (
                  <div key={i} className="w-10 md:w-14 h-14 md:h-20 bg-dark-bg border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <span className="text-2xl md:text-5xl font-display font-black text-white">{digit}</span>
                    <div className="absolute w-full h-[1px] bg-black/40 top-1/2 left-0" />
                  </div>
                ))}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-2">Hours</span>
            </div>

            <span className="text-2xl md:text-4xl font-black text-neon leading-none pb-5">:</span>

            {/* Minutes card */}
            <div className="flex flex-col items-center">
              <div className="flex gap-[2px]">
                {mStr.split("").map((digit, i) => (
                  <div key={i} className="w-10 md:w-14 h-14 md:h-20 bg-dark-bg border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <span className="text-2xl md:text-5xl font-display font-black text-accent-purple text-glow-purple">{digit}</span>
                    <div className="absolute w-full h-[1px] bg-black/40 top-1/2 left-0" />
                  </div>
                ))}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-2">Minutes</span>
            </div>

            <span className="text-2xl md:text-4xl font-black text-neon leading-none pb-5">:</span>

            {/* Seconds card */}
            <div className="flex flex-col items-center">
              <div className="flex gap-[2px]">
                {sStr.split("").map((digit, i) => (
                  <div key={i} className="w-10 md:w-14 h-14 md:h-20 bg-dark-bg border border-white/10 rounded-xl flex items-center justify-center relative overflow-hidden shadow-2xl">
                    <span className="text-2xl md:text-5xl font-display font-black text-accent-pink text-glow-pink animate-pulse">{digit}</span>
                    <div className="absolute w-full h-[1px] bg-black/40 top-1/2 left-0" />
                  </div>
                ))}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-2">Seconds</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
