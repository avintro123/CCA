import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../../store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { Activity, Plus, ShieldAlert, Target, Wifi } from "lucide-react";
import GlassCard from "../../components/GlassCard";
import NeonButton from "../../components/NeonButton";

export default function ScoringInterface() {
  const { token, user } = useAuthStore();
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [totalOvers, setTotalOvers] = useState(20);

  // Lineup State (Who is at the crease?)
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Live scorecard state (fed by WebSocket)
  const [liveScore, setLiveScore] = useState<any>(null);
  const [ballLog, setBallLog] = useState<any[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);

  // fetch tournament data
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          fetch("http://localhost:3000/match"),
          fetch("http://localhost:3000/tournament/teams", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const mData = await mRes.json();
        const tData = await tRes.json();

        setMatches(mData.data || []);
        setTeams(tData.data || []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [token]);

  useEffect(() => {
    if (!activeMatch || !token) {
      return;
    }

    const newSocket = io("http://localhost:3000", {
      auth: { token },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      newSocket.emit("joinMatch", { matchId: activeMatch._id });
    });

    // Listen for full ball update (includes ball event + scorecard)
    newSocket.on("ballUpdate", (data: any) => {
      // Append the new ball to our local timeline
      if (data.ball) {
        setBallLog((prev) => [...prev, data.ball]);
      }
      // Update live scorecard from the response
      if (data.liveScorecard) {
        setLiveScore(data.liveScorecard);
        // Auto-sync striker/non-striker/bowler from backend
        if (data.liveScorecard.striker) setStriker(data.liveScorecard.striker);
        if (data.liveScorecard.nonStriker)
          setNonStriker(data.liveScorecard.nonStriker);
        if (data.liveScorecard.bowler) setBowler(data.liveScorecard.bowler);
      }
    });

    // Backward-compat listener (lightweight scorecard-only update)
    newSocket.on("scoreUpdated", (data: any) => {
      setLiveScore(data);
    });

    newSocket.on("error", (msg: string) => {
      alert(`Scoring Error: ${msg}`);
    });

    return () => {
      newSocket.disconnect();
      setIsConnected(false);
      setLiveScore(null);
      setBallLog([]);
    };
  }, [activeMatch, token]);

  // Auto-scroll ball timeline to latest ball
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
    }
  }, [ballLog]);

  // handle match creation
  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamA: teamAId,
          teamB: teamBId,
          totalOvers,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatches([data.data, ...matches]);
        alert("Match scheduled successfully!");
      }
    } catch (err) {
      alert("Failed to schedule match");
    }
  };

  // record a ball
  const handleScore = (runs: number, wicket = false, extraType?: string) => {
    if (!socket || !isConnected || !striker || !bowler) {
      alert("Please select Striker and Bowler first");
      return;
    }

    socket.emit("recordBall", {
      matchId: activeMatch._id,
      batsmanName: striker,
      bowlerName: bowler,
      runs: runs,
      extras: extraType ? 1 : 0,
      extraType,
      isWicket: wicket,
      dismissedPlayer: wicket ? striker : undefined,
    });

    if (wicket) {
      setStriker(""); // Clear striker on wicket to force selection
    }
  };

  const handleWicket = () => {
    if (!socket || !activeMatch) return;
    socket.emit("recordBall", {
      matchId: activeMatch._id,
      runs: 0,
      isWicket: true,
      batsmanName: striker,
      bowlerName: bowler,
      wicketType: "BOWLED",
    });
    setStriker("");
  };

  // Permission Guard
  if (!token || (user?.role !== "admin" && user?.role !== "scorer")) {
    return (
      <div className="py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-4xl text-white font-heading font-bold mb-4">
          RESTRICTED AREA
        </h1>
        <p className="text-gray-400">
          Only authorized Admins and Scorers can access this dashboard.
        </p>
      </div>
    );
  }

  // --- VIEW 1: SELECT OR CREATE MATCH ---
  if (!activeMatch) {
    return (
      <div className="py-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Scheduler */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Plus className="text-neon" />
            Schedule Match
          </h2>
          <GlassCard padding="p-6">
            <form
              onSubmit={handleScheduleMatch}
              className="flex flex-col gap-4"
            >
              <select
                required
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon"
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
              >
                <option value="">Select Team A</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="text-center text-neon font-black">VS</div>

              <select
                required
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon"
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
              >
                <option value="">Select Team B</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Total Overs"
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none"
                value={totalOvers}
                onChange={(e) => setTotalOvers(Number(e.target.value))}
              />
              <NeonButton type="submit">Initialize Match</NeonButton>
            </form>
          </GlassCard>
        </div>

        {/* Match List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
            <Target className="text-neon" />
            Active Matches
          </h2>
          <div className="flex flex-col gap-4">
            {matches.map((m) => (
              <div
                key={m._id}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl flex justify-between items-center group hover:border-neon/50 transition-all"
              >
                <div>
                  <div className="text-white font-bold text-lg">
                    {m.teamA?.name} vs {m.teamB?.name}
                  </div>
                  <div className="text-gray-500 text-xs">
                    STATUS: {m.status}
                  </div>
                </div>
                <button
                  onClick={() => setActiveMatch(m)}
                  className="bg-neon/20 text-neon px-6 py-2 rounded-lg font-bold border border-neon/30 hover:bg-neon hover:text-black transition-colors"
                >
                  START SCORING
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: LIVE SCORING CONSOLE ---

  const battingTeam =
    activeMatch.currentInnings === 1 ? activeMatch.teamA : activeMatch.teamB;
  const bowlingTeam =
    activeMatch.currentInnings === 1 ? activeMatch.teamB : activeMatch.teamA;

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <button
          onClick={() => setActiveMatch(null)}
          className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer"
        >
          ← View All Matches
        </button>
        <div
          className={`px-4 py-1 rounded-full text-xs font-black flex items-center gap-2 ${isConnected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
        >
          <Wifi className="w-3 h-3" />
          {isConnected ? "SOCKET LIVE" : "DISCONNECTED"}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <ShieldAlert className="text-neon w-8 h-8" />
        <h1 className="text-3xl font-bold font-heading text-white">
          Admin <span className="text-glow text-neon">Scoring Control</span>
        </h1>
      </div>

      {/* ===== LIVE MINI SCORECARD ===== */}
      <GlassCard padding="p-0" className="mb-8 overflow-hidden">
        <div className="relative">
          {/* Glowing background accent */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-neon/10 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="relative z-10 p-8">
            {/* Innings indicator */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black tracking-[4px] uppercase text-gray-500">
                {liveScore?.currentInnings === 2
                  ? "2nd Innings"
                  : "1st Innings"}
              </span>
              {liveScore?.inningsComplete && (
                <span className="text-[10px] font-black tracking-widest uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full">
                  Innings Complete
                </span>
              )}
            </div>

            {/* Big score display */}
            <div className="flex items-end gap-4 mb-8">
              <span className="text-7xl font-heading font-black text-glow text-neon leading-none">
                {liveScore?.score ?? 0}
              </span>
              <span className="text-3xl text-white/40 font-heading font-bold leading-none pb-1">
                / {liveScore?.wickets ?? 0}
              </span>
              <span className="text-lg text-gray-500 font-heading ml-auto leading-none pb-2">
                {liveScore?.overs ?? 0}.{liveScore?.ballsInCurrentOver ?? 0} ov
              </span>
            </div>

            {/* Striker / Non-Striker / Bowler status chips */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neon/5 border border-neon/20 rounded-xl p-4">
                <div className="text-[9px] font-black tracking-[3px] uppercase text-neon/60 mb-2">
                  Striker
                </div>
                <div className="text-white font-bold text-sm truncate">
                  {liveScore?.striker || (
                    <span className="text-gray-600 italic">—</span>
                  )}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-[9px] font-black tracking-[3px] uppercase text-gray-600 mb-2">
                  Non-Striker
                </div>
                <div className="text-white font-bold text-sm truncate">
                  {liveScore?.nonStriker || (
                    <span className="text-gray-600 italic">—</span>
                  )}
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <div className="text-[9px] font-black tracking-[3px] uppercase text-red-500/60 mb-2">
                  Bowler
                </div>
                <div className="text-white font-bold text-sm truncate">
                  {liveScore?.bowler || (
                    <span className="text-gray-600 italic">—</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lineup Selectors */}
      <GlassCard padding="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 border-b border-white/5 pb-10">
          {/* Striker Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Striker
            </label>
            <select
              value={striker}
              onChange={(e) => setStriker(e.target.value)}
              className="bg-black/50 border border-neon/30 p-4 rounded-xl text-white text-sm outline-none"
            >
              <option value="">Select Batsman</option>
              {battingTeam?.players?.map((p: any) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Non-Striker Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Non-Striker
            </label>
            <select
              value={nonStriker}
              onChange={(e) => setNonStriker(e.target.value)}
              className="bg-black/50 border border-white/10 p-4 rounded-xl text-white text-sm outline-none"
            >
              <option value="">Select Batsman</option>
              {battingTeam?.players?.map((p: any) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bowler Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
              Bowler
            </label>
            <select
              value={bowler}
              onChange={(e) => setBowler(e.target.value)}
              className="bg-black/50 border border-red-500/30 p-4 rounded-xl text-white text-sm outline-none"
            >
              <option value="">Select Bowler</option>
              {bowlingTeam?.players?.map((p: any) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Scoring Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <GlassCard>
          <h2 className="text-xl font-bold text-gray-400 mb-6">
            Runs (Click per ball)
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map((run) => (
              <button
                key={run}
                onClick={() => handleScore(run)}
                className={`py-8 rounded-xl font-black text-3xl transition-transform active:scale-95 ${run === 4 || run === 6 ? "bg-neon hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(178,255,5,0.3)]" : "bg-dark-bg border border-dark-border text-white hover:bg-white/10"}`}
              >
                {run}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* extras and wickets */}
        <div className="flex flex-col gap-8">
          <GlassCard padding="p-6 h-full flex flex-col justify-between">
            <h2 className="text-xl font-bold text-gray-400 mb-6">Extras</h2>
            <div className="grid grid-cols-2 gap-4 h-full">
              <NeonButton
                variant="secondary"
                onClick={() => handleScore(1, false, "wide")}
                className="h-full py-4 text-xl"
              >
                Wide (Wd)
              </NeonButton>
              <NeonButton
                variant="secondary"
                onClick={() => handleScore(1, false, "noBall")}
                className="h-full py-4 text-xl"
              >
                No Ball (Nb)
              </NeonButton>
              <NeonButton
                variant="secondary"
                onClick={() => handleScore(1, false, "legBye")}
                className="col-span-2 py-4 text-xl"
              >
                Leg Bye (Lb)
              </NeonButton>
            </div>
          </GlassCard>

          <GlassCard padding="p-6">
            <button
              onClick={handleWicket}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-4xl tracking-widest py-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95"
            >
              WICKET!
            </button>
          </GlassCard>
        </div>
      </div>

      {/* ===== BALL-BY-BALL TIMELINE ===== */}
      <GlassCard padding="p-6" className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black tracking-[3px] uppercase text-gray-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon" />
            Ball Timeline
          </h2>
          <span className="text-[10px] text-gray-600 font-bold tracking-widest">
            {ballLog.length} BALLS
          </span>
        </div>

        {ballLog.length === 0 ? (
          <div className="text-center text-gray-600 py-8 text-sm italic">
            No balls recorded yet. Start scoring to see the timeline.
          </div>
        ) : (
          <div
            ref={timelineRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10"
          >
            {ballLog.map((ball, idx) => {
              // Determine chip style based on the ball event
              let chipClass = "bg-white/10 text-white border-white/10";
              let label = String(ball.runs);

              if (ball.isWicket) {
                chipClass = "bg-red-600/30 text-red-400 border-red-500/40";
                label = "W";
              } else if (ball.extraType) {
                chipClass =
                  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
                const extraAbbr: Record<string, string> = {
                  wide: "Wd",
                  WIDE: "Wd",
                  noBall: "Nb",
                  NO_BALL: "Nb",
                  legBye: "Lb",
                  LEG_BYE: "Lb",
                  bye: "B",
                  BYE: "B",
                };
                label = `${ball.runs}${extraAbbr[ball.extraType] || "e"}`;
              } else if (ball.runs === 4) {
                chipClass = "bg-neon/20 text-neon border-neon/40";
              } else if (ball.runs === 6) {
                chipClass =
                  "bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]";
              } else if (ball.runs === 0) {
                chipClass = "bg-white/5 text-gray-500 border-white/5";
              }

              // Show over separator
              const showOverSep =
                idx > 0 && ball.over !== ballLog[idx - 1].over;

              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  {showOverSep && (
                    <div className="w-px h-8 bg-white/20 mx-1"></div>
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border ${chipClass} transition-transform hover:scale-110`}
                    title={`Over ${ball.over}.${ball.ball} — ${ball.batsmanName} vs ${ball.bowlerName}`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
