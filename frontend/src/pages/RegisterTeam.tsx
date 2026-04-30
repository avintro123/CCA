import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router";
import { Loader2, Plus, Save, Trash, Trophy } from "lucide-react";
import GlassCard from "../components/GlassCard";
import NeonButton from "../components/NeonButton";

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

  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Player[]>([
    { name: "", role: PlayerRole.BATSMAN, isCaptain: true },
  ]);
  const [statusMsg, setStatusMsg] = useState<{
    type: "error" | "success" | "loading" | null;
    text: string;
  }>({ type: null, text: "" });

  const handleAddPlayer = () => {
    setPlayers([
      ...players,
      { name: "", role: PlayerRole.BATSMAN, isCaptain: false },
    ]);
  };

  const handleRemovePlayer = (idx: number) => {
    if (players.length <= 1) return; // Prevent removing the last slot
    const newPlayers = [...players];
    newPlayers.splice(idx, 1);
    setPlayers(newPlayers);
  };

  const handlePlayerChange = (idx: number, field: keyof Player, value: any) => {
    const newPlayers = [...players];

    // Logic to enforce exclusively one Captain per team
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

    // Safety filter to rip out accidentally empty player slots
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
        text: "Submitting Roaster to backend...",
      });

      const response = await fetch("http://localhost:3000/tournament/teams", {
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

  if (!token) {
    return (
      <div className="py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Trophy className="w-20 h-20 text-gray-600 mb-6" />
        <h1 className="text-4xl text-white font-heading font-bold mb-4">
          Login Required
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Please log in using your Google account to register a team for the
          tournament.
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-10">
        <Trophy className="text-neon w-10 h-10" />
        <h1 className="text-4xl font-bold font-heading text-white">
          Register <span className="text-glow text-neon">Your Squad</span>
        </h1>
      </div>
      <GlassCard padding="p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* TEAM NAME */}
          <div className="flex flex-col">
            <label className="text-gray-400 font-bold mb-2 uppercase tracking-widest text-sm">
              Franchise / Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Royal Challengers"
              className="bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white text-2xl font-heading focus:outline-none focus:border-neon transition-colors"
            />
          </div>
          <hr className="border-white/10 my-4" />
          {/* DYNAMIC ROSTER */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end mb-2">
              <label className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                Squad Roster
              </label>
              <span className="text-neon/70 text-xs">
                At least 1 player required
              </span>
            </div>
            {players.map((player, idx) => (
              <div
                key={idx}
                className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                {/* 1. Player Name */}
                <input
                  type="text"
                  required
                  value={player.name}
                  onChange={(e) =>
                    handlePlayerChange(idx, "name", e.target.value)
                  }
                  placeholder={`Player ${idx + 1} Name`}
                  className="flex-1 w-full bg-black/40 border border-transparent rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon/50"
                />
                {/* 2. Player Role */}
                <select
                  value={player.role}
                  onChange={(e) =>
                    handlePlayerChange(idx, "role", e.target.value)
                  }
                  className="w-full md:w-auto bg-black/80 border border-transparent rounded-lg px-4 py-3 text-gray-300 focus:outline-none focus:border-neon/50 cursor-pointer"
                >
                  <option value={PlayerRole.BATSMAN}>Batsman</option>
                  <option value={PlayerRole.BOWLER}>Bowler</option>
                  <option value={PlayerRole.ALL_ROUNDER}>All Rounder</option>
                  <option value={PlayerRole.WICKET_KEEPER}>
                    Wicket Keeper
                  </option>
                </select>
                {/* 3. Captain Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    handlePlayerChange(idx, "isCaptain", !player.isCaptain)
                  }
                  className={`w-full md:w-32 py-3 rounded-lg font-bold text-sm tracking-widest transition-all ${
                    player.isCaptain
                      ? "bg-neon text-black shadow-[0_0_15px_rgba(178,255,5,0.4)]"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  {player.isCaptain ? "CAPTAIN" : "MAKE CAP"}
                </button>
                {/* 4. Delete Row (Hides if only 1 exists) */}
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(idx)}
                  disabled={players.length <= 1}
                  className="w-full md:w-auto p-3 bg-red-100 text-red-600 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed hover:bg-red-600/40 transition-colors"
                >
                  <Trash className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={handleAddPlayer}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-neon border border-neon hover:bg-neon/10 transition-colors text-sm font-bold tracking-widest uppercase"
            >
              <Plus className="w-5 h-5" /> Add Another Player
            </button>
          </div>
          {/* STATUS ALERTS */}
          {statusMsg.type && (
            <div
              className={`p-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm tracking-wider ${
                statusMsg.type === "error"
                  ? "bg-red-500/20 text-red-400 border border-red-500/50"
                  : statusMsg.type === "loading"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                    : "bg-neon/20 text-neon border border-neon/50"
              }`}
            >
              {statusMsg.type === "loading" && (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
              {statusMsg.text}
            </div>
          )}
          {/* SUBMIT */}
          <div className="mt-8 flex justify-end">
            <NeonButton
              type="submit"
              variant="primary"
              className="px-12 py-4 text-xl flex items-center gap-3"
            >
              <Save className="w-6 h-6" /> SUBMIT ROSTER
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
