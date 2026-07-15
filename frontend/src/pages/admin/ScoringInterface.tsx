import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../../store/useAuthStore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  CheckCircle,
  Plus,
  ShieldAlert,
  Target,
  Trophy,
  Wifi,
} from "lucide-react";
import GlassCard from "../../components/GlassCard";
import NeonButton from "../../components/NeonButton";
import PageEntrance from "../../components/PageEntrance";
import { useToastStore } from "../../store/useToastStore";
import { useNavigate } from "react-router";
import { API_URL } from "../../services/api";

export default function ScoringInterface() {
  const { token, user } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [totalOvers, setTotalOvers] = useState(20);
  const [matchDate, setMatchDate] = useState("");
  const [tossWinnerId, setTossWinnerId] = useState("");
  const [tossDecision, setTossDecision] = useState<"BAT" | "BOWL" | "">("");

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

  // Visual effect states
  const [flashClass, setFlashClass] = useState("");
  const [shakeActive, setShakeActive] = useState(false);
  const scorecardRef = useRef<HTMLDivElement>(null);

  // Ripple effect handler
  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  // Boundary flash effect
  const triggerBoundaryFlash = useCallback((runs: number) => {
    if (runs === 4) {
      setFlashClass("boundary-flash");
      setTimeout(() => setFlashClass(""), 650);
    } else if (runs === 6) {
      setFlashClass("boundary-flash-six");
      setTimeout(() => setFlashClass(""), 750);
    }
  }, []);

  // Wicket shake effect
  const triggerWicketShake = useCallback(() => {
    setFlashClass("wicket-flash");
    setShakeActive(true);
    setTimeout(() => {
      setShakeActive(false);
      setFlashClass("");
    }, 500);
  }, []);

  // fetch tournament data
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          fetch(`${API_URL}/match`),
          fetch(`${API_URL}/tournament/teams`, {
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

    const newSocket = io(API_URL, {
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
      addToast("error", `Scoring Error: ${msg}`);
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
      const res = await fetch(`${API_URL}/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamA: teamAId,
          teamB: teamBId,
          totalOvers,
          date: matchDate || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatches([data.data, ...matches]);
        addToast("success", "Match scheduled successfully!");
      }
    } catch (err) {
      addToast("error", "Failed to schedule match");
    }
  };

  // record a ball
  const handleScore = (runs: number, wicket = false, extraType?: string) => {
    if (!socket || !isConnected || !striker || !bowler) {
      addToast("warning", "Please select Striker and Bowler first");
      return;
    }

    // Trigger visual effects
    if (wicket) {
      triggerWicketShake();
    } else if (runs === 4 || runs === 6) {
      triggerBoundaryFlash(runs);
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

  const handleCompleteMatch=async()=>{
    if(!activeMatch || !token){
      return;
    }

    const resultSummary=window.prompt("Enter match result summary (e.g., 'Tema A won by 10 runs'):");
    if(!resultSummary){
      return;
    }

    const team1Score=activeMatch.innings1?.score || 0;
    const team2Score=activeMatch.innings2?.score || 0;

    let winnerId=team1Score>team2Score?activeMatch.teamA._id:activeMatch.teamB._id;

    if(team1Score==team2Score){
      winnerId=activeMatch.teamA._id;
    }

    try{
      const res=await fetch(`${API_URL}/match/${activeMatch._id}/complete`,{
        method:'PUT',
        headers:{
           "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body:JSON.stringify({
          winnerId,
          resultSummary
        })
      })

      if(res.ok){
        addToast("success", "Match completed successfully");
        setActiveMatch(null);
      } else {
         const errorData = await res.json();
        addToast("error", `Failed to complete match: ${errorData.message}`);
      }
    } catch(err){
      addToast("error", "Error completing match.");

    }
  }

  const handleStartMatchWithToss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !tossWinnerId || !tossDecision) {
      addToast("warning", "Please select toss winner and decision.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/match/${activeMatch._id}/toss`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tossWinner: tossWinnerId,
          tossDecision,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addToast("success", "Toss details recorded! Match is now LIVE.");
        setActiveMatch(data.data); // Status will now be LIVE
        setTossWinnerId("");
        setTossDecision("");
      } else {
        addToast("error", `Failed to set toss: ${data.message}`);
      }
    } catch (err) {
      addToast("error", "Error setting toss details.");
    }
  };

  const handleWicket = () => {
    if (!socket || !activeMatch) return;

    triggerWicketShake();

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
      <PageEntrance className="py-12 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
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
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon cursor-pointer"
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
              >
                <option value="">Select Team A</option>
                {teams.filter(t => t && t._id).map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <div className="text-center text-neon font-black">VS</div>

              <select
                required
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon cursor-pointer"
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
              >
                <option value="">Select Team B</option>
                {teams.filter(t => t && t._id).map((t) => (
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

              <input
                type="datetime-local"
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon cursor-pointer"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
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
            {matches.map((m) => {
              const isCompleted = m.status === "COMPLETED";
              return (
                <div
                  key={m._id}
                  className={`bg-white/5 border p-6 rounded-2xl flex justify-between items-center group transition-all ${
                    isCompleted
                      ? "border-white/5 opacity-70 hover:opacity-100 hover:border-white/20"
                      : "border-white/10 hover:border-neon/50"
                  }`}
                >
                  <div>
                    <div className="text-white font-bold text-lg">
                      {m.teamA?.name} vs {m.teamB?.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                          isCompleted
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : m.status === "LIVE"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        {m.status === "LIVE" && <span className="live-pulse-dot" style={{ width: 6, height: 6 }} />}
                        {m.status}
                      </span>
                      {isCompleted && m.resultSummary && (
                        <span className="text-gray-500 text-xs">
                          {m.resultSummary}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (isCompleted) {
                        navigate(`/match/${m._id}`);
                      } else {
                        setActiveMatch(m);
                      }
                    }}
                    className={`px-6 py-2 rounded-lg font-bold border transition-colors ${
                      isCompleted
                        ? "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                        : "bg-neon/20 text-neon border-neon/30 hover:bg-neon hover:text-black"
                    }`}
                  >
                    {isCompleted ? "VIEW RESULT" : "START SCORING"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </PageEntrance>
    );
  }

  // --- VIEW 1.5: TOSS SETUP INTERFACE ---
  if (activeMatch.status === "SCHEDULED") {
    return (
      <PageEntrance className="py-12 max-w-2xl mx-auto min-h-screen">
        <button
          onClick={() => setActiveMatch(null)}
          className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer mb-8"
        >
          ← Back to Match List
        </button>

        <h1 className="text-3xl font-bold font-display text-white mb-8">
          Match Setup & <span className="text-glow text-neon">Toss Control</span>
        </h1>

        <GlassCard padding="p-8" className="gradient-mesh-hero border-neon/30">
          <form onSubmit={handleStartMatchWithToss} className="flex flex-col gap-6">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 block">
                Who won the toss?
              </label>
              <select
                required
                className="bg-black/50 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-neon cursor-pointer w-full"
                value={tossWinnerId}
                onChange={(e) => setTossWinnerId(e.target.value)}
              >
                <option value="">Select Toss Winner Team</option>
                <option value={activeMatch.teamA?._id}>{activeMatch.teamA?.name}</option>
                <option value={activeMatch.teamB?._id}>{activeMatch.teamB?.name}</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3 block">
                Toss Decision
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTossDecision("BAT")}
                  className={`py-4 rounded-xl font-bold border tracking-wider transition-colors cursor-pointer text-center ${
                    tossDecision === "BAT"
                      ? "bg-neon text-black border-neon shadow-[0_0_15px_rgba(178,255,5,0.3)]"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  ELECTED TO BAT
                </button>
                <button
                  type="button"
                  onClick={() => setTossDecision("BOWL")}
                  className={`py-4 rounded-xl font-bold border tracking-wider transition-colors cursor-pointer text-center ${
                    tossDecision === "BOWL"
                      ? "bg-neon text-black border-neon shadow-[0_0_15px_rgba(178,255,5,0.3)]"
                      : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                  }`}
                >
                  ELECTED TO BOWL
                </button>
              </div>
            </div>

            <div className="mt-4 pt-6 border-t border-white/5 flex flex-col gap-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                First innings batting team:
              </span>
              <span className="text-white font-bold text-lg">
                {tossWinnerId && tossDecision ? (
                  tossDecision === "BAT" ? (
                    tossWinnerId === activeMatch.teamA?._id ? activeMatch.teamA?.name : activeMatch.teamB?.name
                  ) : (
                    tossWinnerId === activeMatch.teamA?._id ? activeMatch.teamB?.name : activeMatch.teamA?.name
                  )
                ) : (
                  <span className="text-gray-500 italic">Select winner and decision</span>
                )}
              </span>
            </div>

            <NeonButton type="submit" className="w-full mt-4">
              Initialize Innings & Start Match
            </NeonButton>
          </form>
        </GlassCard>
      </PageEntrance>
    );
  }

  // --- VIEW 2: LIVE SCORING CONSOLE ---

  const isMatchCompleted = activeMatch.status === "COMPLETED";

  const battingTeam =
    activeMatch.currentInnings === 1 ? activeMatch.teamA : activeMatch.teamB;
  const bowlingTeam =
    activeMatch.currentInnings === 1 ? activeMatch.teamB : activeMatch.teamA;

  return (
    <div className={`py-8 max-w-4xl mx-auto ${shakeActive ? "screen-shake" : ""}`}>
      <div className="flex justify-between items-end mb-8">
        <button
          onClick={() => setActiveMatch(null)}
          className="text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest cursor-pointer"
        >
          ← View All Matches
        </button>
        {!isMatchCompleted && (
          <div
            className={`px-4 py-1 rounded-full text-xs font-black flex items-center gap-2 ${isConnected ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
          >
            <Wifi className="w-3 h-3" />
            {isConnected ? "SOCKET LIVE" : "DISCONNECTED"}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-8">
        {isMatchCompleted ? (
          <Trophy className="text-yellow-400 w-8 h-8" />
        ) : (
          <ShieldAlert className="text-neon w-8 h-8" />
        )}
        <h1 className="text-3xl font-bold font-heading text-white">
          {isMatchCompleted ? (
            <span className="text-glow text-yellow-400">Match Result</span>
          ) : (
            <>
              Admin <span className="text-glow text-neon">Scoring Control</span>
            </>
          )}
        </h1>
      </div>

      {/* ===== COMPLETED MATCH RESULT BANNER ===== */}
      {isMatchCompleted && (
        <GlassCard padding="p-8" className="mb-8 border-yellow-500/20">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-black text-white mb-2">
              Match Completed
            </h2>
            {activeMatch.resultSummary && (
              <p className="text-gray-400 text-lg mb-6">
                {activeMatch.resultSummary}
              </p>
            )}
            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                  1st Innings
                </div>
                <div className="text-3xl font-heading font-black text-white">
                  {activeMatch.innings1?.score ?? 0}
                  <span className="text-lg text-gray-500">
                    /{activeMatch.innings1?.wickets ?? 0}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  ({activeMatch.innings1?.overs ?? 0}.
                  {activeMatch.innings1?.ballsInCurrentOver ?? 0} ov)
                </div>
              </div>
              <div className="text-gray-600 text-2xl font-bold self-center">
                vs
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                  2nd Innings
                </div>
                <div className="text-3xl font-heading font-black text-white">
                  {activeMatch.innings2?.score ?? 0}
                  <span className="text-lg text-gray-500">
                    /{activeMatch.innings2?.wickets ?? 0}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  ({activeMatch.innings2?.overs ?? 0}.
                  {activeMatch.innings2?.ballsInCurrentOver ?? 0} ov)
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ===== LIVE MINI SCORECARD (hidden for completed matches) ===== */}
      {!isMatchCompleted && (
        <GlassCard padding="p-0" className={`mb-8 overflow-hidden transition-shadow duration-300 ${flashClass}`}>
          <div className="relative" ref={scorecardRef}>
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
                  {liveScore?.overs ?? 0}.{liveScore?.ballsInCurrentOver ?? 0}{" "}
                  ov
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
      )}

      {/* Lineup Selectors — only for active matches */}
      {!isMatchCompleted && (
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
      )}

      {/* Scoring Buttons — only for active matches */}
      {!isMatchCompleted && (
        <div className="mt-8 flex justify-end">
           <button
             onClick={handleCompleteMatch}
             className="bg-green-600 hover:bg-green-500 text-white font-black py-4 px-10 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all active:scale-95 uppercase tracking-widest"
           >
             Complete Match
           </button>
        </div>
      )}

      {!isMatchCompleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <GlassCard>
            <h2 className="text-xl font-bold text-gray-400 mb-6">
              Runs (Click per ball)
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                <button
                  key={run}
                  onClick={(e) => {
                    createRipple(e);
                    handleScore(run);
                  }}
                  className={`ripple-container py-8 rounded-xl font-black text-3xl transition-transform active:scale-95 cursor-pointer ${run === 4 || run === 6 ? "bg-neon hover:bg-neon-hover text-black shadow-[0_0_15px_rgba(178,255,5,0.3)]" : "bg-dark-bg border border-dark-border text-white hover:bg-white/10"}`}
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
                onClick={(e) => {
                  createRipple(e);
                  handleWicket();
                }}
                className="ripple-container w-full bg-red-600 hover:bg-red-500 text-white font-black text-4xl tracking-widest py-8 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all active:scale-95 cursor-pointer"
              >
                WICKET!
              </button>
            </GlassCard>
          </div>
        </div>
      )}

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

              // Fly-in animation on the last 3 balls only (to avoid animating all on mount)
              const isRecent = idx >= ballLog.length - 1;

              return (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  {showOverSep && (
                    <div className="w-px h-8 bg-white/20 mx-1"></div>
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border ${chipClass} transition-transform hover:scale-110 ${isRecent ? "chip-fly-in" : ""}`}
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
