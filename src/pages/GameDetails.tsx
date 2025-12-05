import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, TodayGame, Player } from "@/services/nbaApi";
import { MatchSimulator } from "@/components/MatchSimulator";
import { BlowoutBar } from "@/components/BlowoutBar";
import { ShootingBattleCard } from "@/components/ShootingBattleCard";
import { PlayerPopupModal } from "@/components/PlayerPopupModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertTriangle, ArrowLeft, Trophy, Brain, ChevronsUpDown, X, AlertCircle } from "lucide-react";
import { getTeamCode } from "@/lib/teamMapping";
import { getFatigueFactor, getRestBadge } from "@/lib/fatigueUtils";

const GameDetails = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [homeAbsentPlayerIds, setHomeAbsentPlayerIds] = useState<number[]>([]);
  const [awayAbsentPlayerIds, setAwayAbsentPlayerIds] = useState<number[]>([]);
  const [homeMissingPlayers, setHomeMissingPlayers] = useState<Player[]>([]);
  const [awayMissingPlayers, setAwayMissingPlayers] = useState<Player[]>([]);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [awaySearchQuery, setAwaySearchQuery] = useState("");
  const [homePopoverOpen, setHomePopoverOpen] = useState(false);
  const [awayPopoverOpen, setAwayPopoverOpen] = useState(false);
  const [selectedPlayerForPopup, setSelectedPlayerForPopup] = useState<{ player: Player; isHome: boolean } | null>(null);
  const [playerPopupOpen, setPlayerPopupOpen] = useState(false);

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ["48h-games"],
    queryFn: () => nbaApi.get48hGames(),
  });

  const currentGame = games?.find((g) => g.gameId === gameId);
  const homeTeamId = currentGame?.homeTeamId || (currentGame ? getTeamCode(currentGame.homeTeam) : "");
  const awayTeamId = currentGame?.awayTeamId || (currentGame ? getTeamCode(currentGame.awayTeam) : "");

  const { data: homeRoster = [] } = useQuery({
    queryKey: ["team-roster", homeTeamId],
    queryFn: () => nbaApi.getTeamRoster(homeTeamId),
    enabled: !!homeTeamId,
  });

  const { data: awayRoster = [] } = useQuery({
    queryKey: ["team-roster", awayTeamId],
    queryFn: () => nbaApi.getTeamRoster(awayTeamId),
    enabled: !!awayTeamId,
  });

  const { data: prediction, isLoading: predictionLoading, refetch } = useQuery({
    queryKey: [
      "match-prediction",
      homeTeamId,
      awayTeamId,
      homeMissingPlayers.map((p) => p.id).join(","),
      awayMissingPlayers.map((p) => p.id).join(","),
    ],
    queryFn: () =>
      nbaApi.predictMatch(
        homeTeamId,
        awayTeamId,
        homeMissingPlayers.map((p) => p.id),
        awayMissingPlayers.map((p) => p.id)
      ),
    enabled: !!homeTeamId && !!awayTeamId,
  });

  const { data: fullMatchPrediction } = useQuery({
    queryKey: [
      "full-match-prediction",
      homeTeamId,
      awayTeamId,
      homeMissingPlayers.map((p) => p.id).join(","),
      awayMissingPlayers.map((p) => p.id).join(","),
    ],
    queryFn: () =>
      nbaApi.getFullMatchPredictionWithAbsents(
        homeTeamId,
        awayTeamId,
        homeMissingPlayers.map((p) => p.id),
        awayMissingPlayers.map((p) => p.id)
      ),
    enabled: !!homeTeamId && !!awayTeamId,
  });

  const homePlayerSearchResults = homeRoster.filter((player) =>
    player.full_name.toLowerCase().includes(homeSearchQuery.toLowerCase())
  );

  const awayPlayerSearchResults = awayRoster.filter((player) =>
    player.full_name.toLowerCase().includes(awaySearchQuery.toLowerCase())
  );

  const addHomeMissingPlayer = useCallback(
    (player: Player) => {
      if (!homeMissingPlayers.find((p) => p.id === player.id)) {
        setHomeMissingPlayers([...homeMissingPlayers, player]);
      }
      setHomeSearchQuery("");
      setHomePopoverOpen(false);
    },
    [homeMissingPlayers]
  );

  const addAwayMissingPlayer = useCallback(
    (player: Player) => {
      if (!awayMissingPlayers.find((p) => p.id === player.id)) {
        setAwayMissingPlayers([...awayMissingPlayers, player]);
      }
      setAwaySearchQuery("");
      setAwayPopoverOpen(false);
    },
    [awayMissingPlayers]
  );

  const removeHomeMissingPlayer = useCallback(
    (playerId: number) => {
      setHomeMissingPlayers(homeMissingPlayers.filter((p) => p.id !== playerId));
    },
    [homeMissingPlayers]
  );

  const removeAwayMissingPlayer = useCallback(
    (playerId: number) => {
      setAwayMissingPlayers(awayMissingPlayers.filter((p) => p.id !== playerId));
    },
    [awayMissingPlayers]
  );

  const handlePlayerClick = useCallback(
    (player: Player, isHome: boolean) => {
      setSelectedPlayerForPopup({ player, isHome });
      setPlayerPopupOpen(true);
    },
    []
  );

  const getConfidenceBadgeColor = (level: string | undefined | null) => {
    if (!level) return "bg-gray-500 text-white border-gray-600";
    const lower = level.toLowerCase();
    if (lower.includes("indécis") || lower.includes("tight") || lower.includes("serré"))
      return "bg-amber-500/20 text-amber-700 border-amber-500/30";
    if (lower.includes("solid") || lower.includes("solide"))
      return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
    if (lower.includes("blowout"))
      return "bg-red-500/20 text-red-700 border-red-500/30";
    return "bg-primary/20";
  };

  const getWinnerColor = (winner: string) => {
    return winner === currentGame?.homeTeam
      ? "text-purple-600 dark:text-purple-400"
      : "text-amber-600 dark:text-amber-400";
  };

  const renderFatigueSection = (
    teamName: string | undefined,
    factors: string[] | undefined,
    position: "home" | "away"
  ) => {
    const factorsList = factors || [];
    const hasFactors = factorsList.length > 0;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{teamName}</h3>
          {position === "home" && (
            <span className="text-xs text-muted-foreground">(Domicile)</span>
          )}
          {position === "away" && (
            <span className="text-xs text-muted-foreground">(Extérieur)</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasFactors ? (
            factorsList.map((factor, idx) => {
              const fatigueInfo = getFatigueFactor(factor);
              return (
                <Badge
                  key={idx}
                  className={`text-xs py-1 px-2 border ${fatigueInfo.bgColor} ${fatigueInfo.color}`}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {fatigueInfo.icon} {fatigueInfo.name}
                </Badge>
              );
            })
          ) : (
            <Badge
              className={`text-xs py-1 px-2 border ${
                getRestBadge().bgColor
              } ${getRestBadge().color}`}
            >
              {getRestBadge().icon} {getRestBadge().name}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  const isLoading = gamesLoading || predictionLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
            </div>
            <p className="text-muted-foreground">Advanced player statistics and trend analysis for sports betting</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-muted-foreground mt-4 text-center">
              Analysing Matchups & Rotations...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
            </div>
            <p className="text-muted-foreground">Advanced player statistics and trend analysis for sports betting</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          <Card className="bg-destructive/10 border-destructive/50">
            <CardContent className="pt-6">
              <p className="text-destructive">Match not found.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-gradient">NBA Betting Insights</h1>
          </div>
          <p className="text-muted-foreground">Advanced player statistics and trend analysis for sports betting</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* Match Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {currentGame.awayTeam} @ {currentGame.homeTeam}
              </h2>
              <p className="text-muted-foreground mt-1">{currentGame.gameDate} • {currentGame.time}</p>
            </div>
            {currentGame.isLive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-500">LIVE</span>
              </div>
            )}
          </div>

        </div>


        {/* Blowout Risk Bar */}
        {currentGame.homeTeam && currentGame.awayTeam && (
          <BlowoutBar
            homeTeamName={currentGame.homeTeam}
            awayTeamName={currentGame.awayTeam}
            absentHomePlayerIds={homeAbsentPlayerIds}
            absentAwayPlayerIds={awayAbsentPlayerIds}
          />
        )}

        {/* Interactive Match Simulator */}
        {homeTeamId && awayTeamId && (
          <MatchSimulator
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            homeTeamName={currentGame.homeTeam}
            awayTeamName={currentGame.awayTeam}
            homeAbsentPlayerIds={homeAbsentPlayerIds}
            awayAbsentPlayerIds={awayAbsentPlayerIds}
            onHomeAbsentPlayersChange={setHomeAbsentPlayerIds}
            onAwayAbsentPlayersChange={setAwayAbsentPlayerIds}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>NBA Betting Insights Dashboard • Data from NBA Stats API</p>
        </div>
      </footer>
    </div>
  );
};

export default GameDetails;
