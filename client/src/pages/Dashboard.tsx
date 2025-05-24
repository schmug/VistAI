import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModelStats } from "@/lib/openrouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts";
import { getModelInfo } from "@/lib/utils";

export default function Dashboard() {
  
  // Get model statistics
  const { data: modelStats, isLoading, error } = useQuery({
    queryKey: ['/api/model-stats'],
    queryFn: getModelStats
  });
  
  // Colors for the chart
  const COLORS = ['hsl(var(--model-gpt))', 'hsl(var(--model-claude))', 'hsl(var(--model-llama))', 'hsl(var(--model-mistral))', 'hsl(var(--secondary))'];

  // Format data for the pie chart
  const chartData = modelStats?.map(stat => ({
    name: getModelInfo(stat.displayName).name,
    value: stat.clickCount,
    percentage: stat.percentage
  })) || [];
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track model performance and user preferences</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <i className="ri-search-line text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 skeleton rounded"></div>
              ) : (
                modelStats?.reduce((total, stat) => total + stat.searchCount, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Across all models</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <i className="ri-cursor-line text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 skeleton rounded"></div>
              ) : (
                modelStats?.reduce((total, stat) => total + stat.clickCount, 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">User result interactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Model</CardTitle>
            <i className="ri-trophy-line text-muted-foreground"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-24 skeleton rounded"></div>
              ) : modelStats && modelStats.length > 0 ? (
                getModelInfo(modelStats.sort((a, b) => b.clickCount - a.clickCount)[0].displayName).name
              ) : (
                "No data"
              )}
            </div>
            <p className="text-xs text-muted-foreground">Most clicked AI model</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Model Preference Distribution</CardTitle>
            <CardDescription>
              Breakdown of user clicks by AI model
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="h-40 w-40 rounded-full skeleton"></div>
              </div>
            ) : error ? (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Error loading chart data
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip formatter={(value, name) => [`${value} clicks`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                No data available yet. Start searching to generate statistics.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Model Rankings</CardTitle>
            <CardDescription>
              Based on user click preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 skeleton rounded"></div>
                    <div className="h-2 w-full skeleton rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-muted-foreground">
                Error loading model rankings
              </div>
            ) : modelStats && modelStats.length > 0 ? (
              <div className="space-y-4">
                {modelStats
                  .sort((a, b) => b.clickCount - a.clickCount)
                  .map((stat) => {
                    const model = getModelInfo(stat.displayName);
                    return (
                      <div key={stat.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <i className={`${model.icon} ${model.color}`}></i>
                            <span className="font-medium text-sm">{model.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{stat.percentage}%</span>
                        </div>
                        <Progress value={stat.percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-muted-foreground">
                No data available yet. Start searching to generate statistics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Subscription feature coming soon */}
    </div>
  );
}
