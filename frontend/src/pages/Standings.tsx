import { Crown, Medal, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { fetchStandings } from "../services/api";
import GlassCard from "../components/GlassCard";
import PageEntrance from "../components/PageEntrance";
import LightRays from "../components/LightRays";
import gsap from "gsap";

interface TeamStanding {
  teamId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  points: number;
}

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; glow: string; icon: any }> = {
  1: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30 hover:border-yellow-500/60",
    text: "text-yellow-400",
    glow: "text-glow-gold",
    icon: Crown,
  },
  2: {
    bg: "bg-gray-300/5",
    border: "border-gray-400/20 hover:border-gray-400/40",
    text: "text-gray-300",
    glow: "text-glow-silver",
    icon: Medal,
  },
  3: {
    bg: "bg-orange-500/5",
    border: "border-orange-700/20 hover:border-orange-500/40",
    text: "text-orange-400",
    glow: "text-glow-bronze",
    icon: Medal,
  },
};

export default function Standings() {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const barsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStandings()
      .then(setStandings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Animate point bars after data loads
  useEffect(() => {
    if (standings.length === 0 || !barsRef.current) return;

    const bars = barsRef.current.querySelectorAll(".points-bar-fill");
    gsap.fromTo(
      bars,
      { width: "0%" },
      {
        width: (i: number) => {
          const maxPts = standings[0]?.points || 1;
          return `${(standings[i]?.points / maxPts) * 100}%`;
        },
        duration: 1.2,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.5,
      }
    );

    // Stagger row entrance
    const rows = barsRef.current.querySelectorAll(".standing-row");
    gsap.fromTo(
      rows,
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        delay: 0.2,
      }
    );
  }, [standings]);

  const maxPoints = standings[0]?.points || 1;

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
        <LightRays
          raysOrigin="top-center"
          raysColor="#7df9ff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
        />
      </div>
      <PageEntrance className="py-12 relative z-10">
      <div className="flex items-center gap-4 mb-8">
        <Trophy className="text-neon w-10 h-10" />
        <h1 className="text-4xl font-bold font-display text-white">
          Tournament <span className="text-glow text-neon">Standings</span>
        </h1>
      </div>

      <GlassCard padding="p-0" className="overflow-hidden gradient-mesh-subtle">
        <div ref={barsRef}>
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_60px_60px_60px_100px] md:grid-cols-[80px_1fr_80px_80px_80px_140px] items-center bg-white/5 border-b border-dark-border px-4 py-4">
            <span className="font-heading font-medium text-gray-400 text-sm">Pos</span>
            <span className="font-heading font-medium text-gray-400 text-sm">Team</span>
            <span className="font-heading font-medium text-gray-400 text-sm text-center">P</span>
            <span className="font-heading font-medium text-gray-400 text-sm text-center">W</span>
            <span className="font-heading font-medium text-gray-400 text-sm text-center">L</span>
            <span className="font-heading font-medium text-gray-400 text-sm text-right">Points</span>
          </div>

          {loading ? (
            <div className="text-center p-8 text-gray-400">
              {/* Skeleton loading rows */}
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[60px_1fr_60px_60px_60px_100px] md:grid-cols-[80px_1fr_80px_80px_80px_140px] items-center px-4 py-5 border-b border-dark-border/50"
                >
                  <div className="h-4 w-8 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-6 bg-white/5 rounded animate-pulse mx-auto" />
                  <div className="h-4 w-6 bg-white/5 rounded animate-pulse mx-auto" />
                  <div className="h-4 w-6 bg-white/5 rounded animate-pulse mx-auto" />
                  <div className="h-4 w-12 bg-white/5 rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : standings.length === 0 ? (
            <div className="text-center p-8 text-gray-400">
              No teams approved yet.
            </div>
          ) : (
            standings.map((team, index) => {
              const rank = index + 1;
              const rankStyle = RANK_STYLES[rank];
              const RankIcon = rankStyle?.icon;
              const barWidth = `${(team.points / maxPoints) * 100}%`;

              return (
                <div
                  key={team.teamId}
                  className={`standing-row grid grid-cols-[60px_1fr_60px_60px_60px_100px] md:grid-cols-[80px_1fr_80px_80px_80px_140px] items-center px-4 py-5 border-b border-dark-border/50 transition-all duration-300 hover:bg-white/5 relative group opacity-0 ${
                    rankStyle ? `${rankStyle.bg} ${rankStyle.border} border-l-2` : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-2">
                    {rankStyle ? (
                      <div className={`rank-badge-shimmer flex items-center justify-center w-9 h-9 rounded-full ${rankStyle.bg} border ${rankStyle.border}`}>
                        <RankIcon className={`w-4 h-4 ${rankStyle.text}`} />
                      </div>
                    ) : (
                      <span className="font-bold font-heading text-gray-500 text-lg w-9 h-9 flex items-center justify-center">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Team Name */}
                  <div className="flex flex-col">
                    <span
                      onClick={() => navigate(`/team/${team.teamId}`)}
                      className={`font-bold tracking-wide cursor-pointer hover:text-neon transition-colors ${rankStyle ? `${rankStyle.text} ${rankStyle.glow}` : "text-white"} text-base`}
                    >
                      {team.name}
                    </span>
                    {rank === 1 && team.points > 0 && (
                      <span className="text-[10px] text-yellow-500/60 font-black tracking-widest uppercase">
                        Tournament Leader
                      </span>
                    )}
                  </div>

                  {/* Played */}
                  <div className="text-center text-gray-300">{team.played}</div>

                  {/* Won */}
                  <div className="text-center text-green-400 font-bold">{team.won}</div>

                  {/* Lost */}
                  <div className="text-center text-red-400">{team.lost}</div>

                  {/* Points with animated bar */}
                  <div className="text-right relative">
                    <div className="absolute inset-y-0 right-0 flex items-center w-full">
                      <div
                        className={`points-bar-fill h-8 rounded-lg opacity-20 ml-auto ${
                          rank === 1
                            ? "bg-yellow-500"
                            : rank === 2
                              ? "bg-gray-400"
                              : rank === 3
                                ? "bg-orange-500"
                                : "bg-neon"
                        }`}
                        style={{ width: 0 }}
                        data-target-width={barWidth}
                      />
                    </div>
                    <span
                      className={`relative z-10 font-bold text-xl font-heading ${
                        rankStyle ? rankStyle.text : "text-neon"
                      }`}
                    >
                      {team.points}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>
    </PageEntrance>
    </>
  );
}
