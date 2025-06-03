import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboard, getTrendingModels, getPersonalizedRankings } from "@/lib/openrouter";
import ModelBadge from "@/components/ModelBadge";
import { useAuth } from "@/contexts/AuthContext";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("overall");
  const { user } = useAuth();

  const { data: overallLeaderboard, isLoading: overallLoading } = useQuery({
    queryKey: ["/api/leaderboard", "overall"],
    queryFn: () => getLeaderboard("overall", 20),
  });

  const { data: trendingLeaderboard, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/leaderboard", "trending"],
    queryFn: () => getLeaderboard("trending", 20),
  });

  const { data: trendingModels, isLoading: trendingModelsLoading } = useQuery({
    queryKey: ["/api/trending-models"],
    queryFn: () => getTrendingModels("day", 15),
  });

  const { data: personalizedRankings, isLoading: personalizedLoading } = useQuery({
    queryKey: ["/api/personalized-rankings"],
    queryFn: () => getPersonalizedRankings(15),
    enabled: !!user,
  });

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case "up":
        return <i className="ri-arrow-up-line text-green-500"></i>;
      case "down":
        return <i className="ri-arrow-down-line text-red-500"></i>;
      default:
        return <i className="ri-subtract-line text-gray-500"></i>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Model Leaderboards</h1>
        <p className="text-muted-foreground">
          Discover the top-performing AI models based on user feedback and engagement
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="live-trending">Live Trends</TabsTrigger>
          <TabsTrigger value="personalized" disabled={!user}>
            {user ? "Personal" : "Login Required"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Model Rankings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Based on clicks, positive feedback, and overall performance
              </p>
            </CardHeader>
            <CardContent>
              {overallLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Searches</TableHead>
                      <TableHead>👍</TableHead>
                      <TableHead>👎</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overallLeaderboard?.map((entry) => (
                      <TableRow key={entry.modelId}>
                        <TableCell>
                          <Badge variant={getRankBadgeVariant(entry.rankPosition)}>
                            #{entry.rankPosition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ModelBadge modelId={entry.modelId} />
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.score.toFixed(1)}
                        </TableCell>
                        <TableCell>{entry.clickCount || 0}</TableCell>
                        <TableCell>{entry.searchCount || 0}</TableCell>
                        <TableCell className="text-green-600">
                          {entry.positiveFeedback || 0}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {entry.negativeFeedback || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Models</CardTitle>
              <p className="text-sm text-muted-foreground">
                Models with highest trend scores in the last 24 hours
              </p>
            </CardHeader>
            <CardContent>
              {trendingLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }, (_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Trend Score</TableHead>
                      <TableHead>Searches</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>👍</TableHead>
                      <TableHead>👎</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trendingLeaderboard?.map((entry) => (
                      <TableRow key={entry.modelId}>
                        <TableCell>
                          <Badge variant={getRankBadgeVariant(entry.rankPosition)}>
                            #{entry.rankPosition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ModelBadge modelId={entry.modelId} />
                        </TableCell>
                        <TableCell className="font-mono">
                          {entry.trendScore?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell>{entry.searchCount || 0}</TableCell>
                        <TableCell>{entry.clickCount || 0}</TableCell>
                        <TableCell className="text-green-600">
                          {entry.positiveFeedback || 0}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {entry.negativeFeedback || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-trending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trendingModelsLoading ? (
              Array.from({ length: 6 }, (_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))
            ) : (
              trendingModels?.map((model) => (
                <Card key={model.modelId} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <ModelBadge modelId={model.modelId} />
                      <div className="flex items-center gap-1">
                        {getTrendingIcon(model.trending)}
                        <span className="text-sm font-mono">
                          {model.trendScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Searches: {model.totalSearches}</div>
                      <div>Clicks: {model.totalClicks}</div>
                      <div className="flex justify-between">
                        <span className="text-green-600">👍 {model.positiveFeedback}</span>
                        <span className="text-red-600">👎 {model.negativeFeedback}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="personalized" className="space-y-4">
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Personal Rankings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Models ranked based on your usage and feedback history
                </p>
              </CardHeader>
              <CardContent>
                {personalizedLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 10 }, (_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Your Clicks</TableHead>
                        <TableHead>Your 👍</TableHead>
                        <TableHead>Your 👎</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personalizedRankings?.map((entry) => (
                        <TableRow key={entry.modelId}>
                          <TableCell>
                            <Badge variant={getRankBadgeVariant(entry.rankPosition)}>
                              #{entry.rankPosition}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ModelBadge modelId={entry.modelId} />
                          </TableCell>
                          <TableCell className="font-mono">
                            {entry.personalScore}
                          </TableCell>
                          <TableCell>{entry.userClicks}</TableCell>
                          <TableCell className="text-green-600">
                            {entry.userLikes}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {entry.userDislikes}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Sign in to see your personal rankings</h3>
                <p className="text-muted-foreground mb-4">
                  Get personalized model recommendations based on your usage patterns and feedback
                </p>
                <Button onClick={() => window.location.href = "/login"}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}