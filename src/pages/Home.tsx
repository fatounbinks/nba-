import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Player } from "@/services/nbaApi";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerDashboard } from "@/components/PlayerDashboard";
import { Activity, BrainCircuit, Search, TrendingUp, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { nbaApi, TodayGame } from "@/services/nbaApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MatchPredictionModal } from "@/components/MatchPredictionModal";

const Home = () => {
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<TodayGame | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const { data: games, isLoading } = useQuery({
    queryKey: ["games-data"],
    queryFn: () => nbaApi.get48hGames(),
    refetchInterval: 60000,
  });

  useEffect(() => {
    const handleScroll = () => {
      if (searchRef.current && headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setIsSearchSticky(headerBottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAnalyzeClick = (game: TodayGame) => {
    setSelectedGame(game);
    setModalOpen(true);
  };

  const filteredGames = games?.filter(
    (game) =>
      game.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const gamesByDate = filteredGames.reduce((acc, game) => {
    if (!acc[game.gameDate]) {
      acc[game.gameDate] = [];
    }
    acc[game.gameDate].push(game);
    return acc;
  }, {} as Record<string, typeof filteredGames>);

  if (selectedPlayer) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-display font-bold text-gradient">NBA Data AI</h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedPlayer(undefined)}
                className="mb-4"
              >
                ← Back to Dashboard
              </Button>
              <PlayerSearch onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
            </div>
            <PlayerDashboard player={selectedPlayer} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header
        ref={headerRef}
        className="border-b border-border/30 bg-card/40 backdrop-blur-md sticky top-0 z-40"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gradient">NBA Data AI</h1>
                <p className="text-xs text-muted-foreground">Advanced Performance Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Zap className="h-3 w-3 mr-1" />
                v1.7 Expert Model
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <Card className="border-border/40 overflow-hidden">
            <div className="relative p-8 md:p-12 bg-gradient-to-br from-slate-800/50 via-indigo-900/30 to-slate-900/50 border-t border-primary/20">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(25,95,211,0.1),rgba(255,255,255,0))]" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    v1.7 Expert Model Active
                  </Badge>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient leading-tight">
                  Advanced Artificial Intelligence for Sports Performance
                </h2>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Analyze matchups with our latest algorithms: Real Volatility Detection, Fatigue Assessment, and Defensive Profiles. Get comprehensive insights powered by machine learning.
                </p>
                <div className="flex flex-wrap gap-3 pt-4">
                  <div className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{games?.length || 0}</span> Games Scheduled
                    </span>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-secondary/50 border border-border/50 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-sm text-muted-foreground">Live Data</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Floating Search Bar */}
        <div
          ref={searchRef}
          className={`space-y-2 transition-all duration-300 ${
            isSearchSticky ? "fixed top-24 left-0 right-0 z-30 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/30" : ""
          }`}
        >
          <div className={isSearchSticky ? "container mx-auto" : ""}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search team (e.g., Lakers, Boston)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-secondary/50 border-border/50 text-foreground placeholder-muted-foreground focus:border-primary/50 transition-colors h-11"
              />
            </div>
          </div>
        </div>

        {/* Games Grid Section */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-secondary/30 border border-border/30 rounded-lg p-4 animate-pulse h-40"
                />
              ))}
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No games found</p>
              <p className="text-muted-foreground">Try adjusting your search criteria or check back later</p>
            </div>
          ) : (
            Object.entries(gamesByDate).map(([date, dateGames]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dateGames.map((game) => (
                    <div
                      key={game.gameId}
                      className="group relative bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/40 rounded-xl p-5 overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
                    >
                      {/* Background glow effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-300" />

                      {/* Live indicator */}
                      {game.isLive && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                          </span>
                          <span className="text-xs font-bold text-primary">LIVE</span>
                        </div>
                      )}

                      <div className="relative space-y-4">
                        {/* Teams and Score - Clickable */}
                        <div className="space-y-3 cursor-pointer transition-opacity hover:opacity-80" onClick={() => navigate(`/game/${game.gameId}`)}>
                          {/* Away Team */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-semibold text-foreground text-sm flex-1 truncate" title={game.awayTeam}>
                              {game.awayTeam}
                            </span>
                            {game.awayScore !== undefined ? (
                              <span className="text-2xl font-display font-bold text-primary flex-shrink-0">
                                {game.awayScore}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex-shrink-0">—</span>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex-1 h-px bg-border/30" />
                            <span className="px-2">VS</span>
                            <div className="flex-1 h-px bg-border/30" />
                          </div>

                          {/* Home Team */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-semibold text-foreground text-sm flex-1 truncate" title={game.homeTeam}>
                              {game.homeTeam}
                            </span>
                            {game.homeScore !== undefined ? (
                              <span className="text-2xl font-display font-bold text-primary flex-shrink-0">
                                {game.homeScore}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex-shrink-0">—</span>
                            )}
                          </div>
                        </div>

                        {/* Game Status and Time */}
                        <div className="pt-2 border-t border-border/30 space-y-2">
                          <div className="text-xs text-muted-foreground text-center font-medium">
                            {game.status}
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {game.time}
                          </div>
                        </div>

                        {/* View Analysis Button */}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            className="w-full h-9 text-xs font-semibold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 gap-1.5 group/btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeClick(game);
                            }}
                          >
                            <BrainCircuit className="h-3.5 w-3.5 group-hover/btn:scale-110 transition-transform" />
                            <span>View Analysis</span>
                            <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity">→</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Player Search Section */}
        <div className="space-y-6 py-8 border-t border-border/30">
          <div className="text-center space-y-2 mb-4">
            <h2 className="text-2xl font-display font-bold text-foreground">Player Performance Analysis</h2>
            <p className="text-muted-foreground">Search for any NBA player to view their detailed analytics and projections</p>
          </div>
          <PlayerSearch onSelectPlayer={setSelectedPlayer} selectedPlayer={selectedPlayer} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground space-y-2">
          <p>NBA Data AI • Advanced Sports Performance Analytics</p>
          <p>Data powered by NBA Stats API • Machine Learning v1.7</p>
        </div>
      </footer>

      {/* Match Prediction Modal */}
      <MatchPredictionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        game={selectedGame}
      />
    </div>
  );
};

export default Home;
