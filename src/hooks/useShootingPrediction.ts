import { useQuery } from "@tanstack/react-query";
import { nbaApi, ShootingPrediction } from "@/services/nbaApi";

// Fallback example data for when API is not available
const getExampleShootingPrediction = (
  homeTeamId: string,
  awayTeamId: string
): ShootingPrediction => {
  const exampleData: Record<string, ShootingPrediction> = {
    default: {
      matchup: `${awayTeamId} @ ${homeTeamId}`,
      pace_context: "Rythme Rapide: 100.8",
      home: {
        team: homeTeamId,
        FG2M: 25.6,
        FG2M_Range: "20-31",
        FG3M: 12.4,
        FG3M_Range: "10-15",
        Total_FG: 38.0,
      },
      away: {
        team: awayTeamId,
        FG2M: 31.9,
        FG2M_Range: "27-37",
        FG3M: 9.8,
        FG3M_Range: "8-12",
        Total_FG: 41.7,
      },
      analysis: {
        "2pt_winner": awayTeamId,
        "3pt_winner": homeTeamId,
        "fatigue_impact": "Oui",
      },
    },
  };

  return exampleData.default;
};

export function useShootingPrediction(
  homeTeamId: string,
  awayTeamId: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["shooting-prediction", homeTeamId, awayTeamId],
    queryFn: async () => {
      try {
        return await nbaApi.getShootingPrediction(homeTeamId, awayTeamId);
      } catch (error) {
        // Fallback to example data if API is not available
        console.warn(
          "Shooting prediction API not available, using example data",
          error
        );
        return getExampleShootingPrediction(homeTeamId, awayTeamId);
      }
    },
    enabled: enabled && !!homeTeamId && !!awayTeamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
