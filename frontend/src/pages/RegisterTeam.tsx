import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Plus,
  Trash,
  Loader2,
  Trophy,
  Crown,
} from "lucide-react";
import { API_URL } from "../services/api";
import LiquidSelect from "../components/LiquidSelect";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_115001_bcdaa3b4-03de-47e7-ad63-ae3e392c32d4.mp4";

const FADE_DURATION = 500; // ms
const FADE_OUT_BUFFER = 0.55; // seconds before video end

const PlayerRole = {
  BATSMAN: "BATSMAN",
  BOWLER: "BOWLER",
  ALL_ROUNDER: "ALL_ROUNDER",
  WICKET_KEEPER: "WICKET_KEEPER",
} as const;

type PlayerRoleType = (typeof PlayerRole)[keyof typeof PlayerRole];

interface Player {
  name: string;
  role: PlayerRoleType;
  isCaptain: boolean;
}

export default function RegisterTeam() {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const fadingOutRef = useRef(false);

  // ── Form State ──
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Player[]>([
    { name: "", role: PlayerRole.BATSMAN, isCaptain: true },
  ]);
  const [statusMsg, setStatusMsg] = useState<{
    type: "error" | "success" | "loading" | null;
    text: string;
  }>({ type: null, text: "" });

  const ROLE_LABELS: Record<PlayerRoleType, string> = {
    BATSMAN: "Batsman",
    BOWLER: "Bowler",
    ALL_ROUNDER: "All Rounder",
    WICKET_KEEPER: "Wicket Keeper",
  };

  // ── Video Fade System ──
  const cancelAnim = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const fade = useCallback(
    (direction: "in" | "out", duration: number, onComplete?: () => void) => {
      cancelAnim();
      const video = videoRef.current;
      if (!video) return;

      const startOpacity = parseFloat(video.style.opacity || "0");
      const targetOpacity = direction === "in" ? 1 : 0;
      const delta = targetOpacity - startOpacity;

      if (Math.abs(delta) < 0.01) {
        video.style.opacity = String(targetOpacity);
        onComplete?.();
        return;
      }

      const startTime = performance.now();
      const adjustedDuration = duration * Math.abs(delta);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / adjustedDuration, 1);
        video.style.opacity = String(startOpacity + delta * progress);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          animFrameRef.current = null;
          onComplete?.();
        }
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    [cancelAnim]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.opacity = "0";
    const handleCanPlay = () => fade("in", FADE_DURATION);
    video.addEventListener("canplay", handleCanPlay, { once: true });
    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      cancelAnim();
    };
  }, [fade, cancelAnim]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || fadingOutRef.current) return;
    const remaining = video.duration - video.currentTime;
    if (remaining <= FADE_OUT_BUFFER && remaining > 0) {
      fadingOutRef.current = true;
      fade("out", FADE_DURATION);
    }
  }, [fade]);

  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    cancelAnim();
    video.style.opacity = "0";
    setTimeout(() => {
      video.currentTime = 0;
      video.play();
      fadingOutRef.current = false;
      fade("in", FADE_DURATION);
    }, 100);
  }, [fade, cancelAnim]);

  // ── Form Handlers ──
  const handleAddPlayer = () => {
    setPlayers([
      ...players,
      { name: "", role: PlayerRole.BATSMAN, isCaptain: false },
    ]);
  };

  const handleRemovePlayer = (idx: number) => {
    if (players.length <= 1) return;
    const newPlayers = [...players];
    newPlayers.splice(idx, 1);
    setPlayers(newPlayers);
  };

  const handlePlayerChange = (idx: number, field: keyof Player, value: any) => {
    const newPlayers = [...players];
    if (field === "isCaptain" && value === true) {
      newPlayers.forEach((p) => (p.isCaptain = false));
    }
    newPlayers[idx] = { ...newPlayers[idx], [field]: value };
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatusMsg({
        type: "error",
        text: "authentication error: please log in first to register a team!",
      });
      return;
    }

    const validPlayers = players.filter((p) => p.name.trim() !== "");

    if (teamName.trim() === "" || validPlayers.length === 0) {
      setStatusMsg({
        type: "error",
        text: "Invalid input: Please provide a Team Name and at least one named player.",
      });
      return;
    }

    try {
      setStatusMsg({
        type: "loading",
        text: "Submitting Roster to backend...",
      });

      const response = await fetch(`${API_URL}/tournament/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: teamName,
          players: validPlayers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMsg({
          type: "error",
          text: data.message || "Failed to register team.",
        });
      } else {
        setStatusMsg({
          type: "success",
          text: "Team registered successfully! Awaiting Admin approval.",
        });
        setTimeout(() => navigate("/standings"), 3000);
      }
    } catch (error) {
      console.error("Registration Error:", error);
      setStatusMsg({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    }
  };

  // ── Unauthenticated View ──
  if (!token) {
    return (
      <div className="min-h-screen bg-black overflow-hidden flex flex-col relative">
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          autoPlay
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="fixed inset-0 w-full h-full object-cover translate-y-[17%]"
          style={{ opacity: 0 }}
        />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <Trophy className="w-20 h-20 text-white/30 mb-6" />
          <h1
            className="text-4xl md:text-5xl text-white mb-4 tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Login Required
          </h1>
          <p className="text-white/60 max-w-md mx-auto text-sm leading-relaxed">
            Please log in using your Google account to register a team for the
            tournament.
          </p>
        </div>

      </div>
    );
  }

  // ── Main Registration View ──
  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col relative">
      {/* Background Video */}
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        muted
        autoPlay
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="fixed inset-0 w-full h-full object-cover translate-y-[17%]"
        style={{ opacity: 0 }}
      />



      {/* Hero + Form */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8">
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight whitespace-nowrap"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Register Your Team
        </h1>

        {/* Registration Form Card */}
        <div className="max-w-2xl w-full">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Team Name */}
            <div className="liquid-glass rounded-2xl p-6">
              <label className="text-white/50 text-xs font-medium uppercase tracking-[0.2em] mb-3 block">
                Franchise / Team Name
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Royal Challengers"
                className="w-full bg-transparent border-none outline-none text-white text-2xl placeholder:text-white/20"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              />
            </div>

            {/* Squad Roster */}
            <div className="liquid-glass rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-white/50 text-xs font-medium uppercase tracking-[0.2em]">
                  Squad Roster
                </label>
                <span className="text-white/30 text-xs">
                  At least 1 player required
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {players.map((player, idx) => (
                  <div
                    key={idx}
                    className="liquid-glass rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center"
                  >
                    {/* Player Name */}
                    <input
                      type="text"
                      required
                      value={player.name}
                      onChange={(e) =>
                        handlePlayerChange(idx, "name", e.target.value)
                      }
                      placeholder={`Player ${idx + 1} Name`}
                      className="flex-1 w-full bg-white/5 rounded-lg px-4 py-3 text-white text-sm border-none outline-none placeholder:text-white/25 focus:bg-white/10 transition-colors"
                    />

                    {/* Role Select */}
                    <div className="w-full md:w-44">
                      <LiquidSelect
                        value={player.role}
                        onChange={(val) =>
                          handlePlayerChange(idx, "role", val)
                        }
                        options={(Object.keys(PlayerRole) as PlayerRoleType[]).map(
                          (r) => ({
                            value: r,
                            label: ROLE_LABELS[r],
                          })
                        )}
                      />
                    </div>

                    {/* Captain Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayerChange(idx, "isCaptain", !player.isCaptain)
                      }
                      className={`w-full md:w-auto px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        player.isCaptain
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      }`}
                    >
                      <Crown size={14} />
                      {player.isCaptain ? "Captain" : "Make Cap"}
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(idx)}
                      disabled={players.length <= 1}
                      className="w-full md:w-auto p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Player */}
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleAddPlayer}
                  className="liquid-glass rounded-full px-6 py-2.5 text-white/70 text-xs font-medium uppercase tracking-widest hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Player
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {statusMsg.type && (
              <div
                className={`liquid-glass rounded-xl p-4 flex items-center justify-center gap-3 text-sm font-medium ${
                  statusMsg.type === "error"
                    ? "!bg-red-500/10 text-red-400"
                    : statusMsg.type === "loading"
                      ? "!bg-blue-500/10 text-blue-400"
                      : "!bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {statusMsg.type === "loading" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {statusMsg.text}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="bg-white text-black rounded-full px-10 py-3.5 font-medium text-sm flex items-center gap-3 hover:bg-white/90 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                Submit Roster
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
