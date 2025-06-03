export class FakeD1Database {
  searches: any[] = [];
  results: any[] = [];
  clicks: any[] = [];
  users: any[] = [];
  userFeedback: any[] = [];
  trendingMetrics: any[] = [];
  modelRankings: any[] = [];
  modelStats: Record<string, {clickCount: number; searchCount: number; updatedAt: string}>;
  nextSearchId = 1;
  nextResultId = 1;
  nextClickId = 1;
  nextUserId = 1;
  nextFeedbackId = 1;
  nextTrendingId = 1;
  nextRankingId = 1;
  constructor(initialStats: Record<string, {clickCount: number; searchCount: number; updatedAt: string}> = {}) {
    this.modelStats = { ...initialStats };
  }
  prepare(query: string) {
    const db = this;
    return {
      _query: query,
      _args: [] as any[],
      bind(...args: any[]) { this._args = args; return this; },
      async all() {
        const q = this._query;
        const a = this._args;
        if (q.startsWith('INSERT INTO searches')) {
          const row = { id: db.nextSearchId++, query: a[0], created_at: a[1] };
          db.searches.push(row);
          return { results: [row] };
        }
        if (q.startsWith('INSERT INTO results')) {
          const row = { id: db.nextResultId++, searchId: a[0], modelId: a[1], content: a[2], title: a[3], responseTime: a[4], createdAt: a[5] };
          db.results.push(row);
          return { results: [row] };
        }
        if (q.startsWith('INSERT INTO clicks')) {
          const row = { id: db.nextClickId++, resultId: a[0], userId: a[1], createdAt: a[2] };
          db.clicks.push(row);
          return { results: [row] };
        }
        if (q.startsWith('INSERT INTO users')) {
          const row = { id: db.nextUserId++, username: a[0], password: a[1] };
          db.users.push(row);
          return { results: [ { id: row.id, username: row.username } ] };
        }
        if (q.startsWith('SELECT id, username, password FROM users')) {
          const user = db.users.find(u => u.username === a[0]);
          return { results: user ? [user] : [] };
        }
        if (q.startsWith('SELECT model_id as modelId') && q.includes('ORDER BY')) {
          const limit = a[0];
          const arr = Object.entries(db.modelStats)
            .map(([modelId, s]) => ({ modelId, clickCount: s.clickCount, searchCount: s.searchCount, updatedAt: s.updatedAt }))
            .sort((x, y) => y.clickCount - x.clickCount)
            .slice(0, limit);
          return { results: arr };
        }
        if (q.startsWith('SELECT query, COUNT(*) as count FROM searches')) {
          const limit = a[0];
          const counts: Record<string, number> = {};
          for (const s of db.searches) {
            counts[s.query] = (counts[s.query] || 0) + 1;
          }
          const arr = Object.entries(counts)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
          return { results: arr };
        }
        if (q.startsWith('SELECT query, created_at as createdAt FROM searches')) {
          const limit = a[0];
          const arr = [...db.searches]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit)
            .map((s) => ({ query: s.query, createdAt: s.created_at }));
          return { results: arr };
        }
        if (q.startsWith('SELECT model_id as modelId')) {
          const arr = Object.entries(db.modelStats)
            .map(([modelId, s]) => ({ modelId, clickCount: s.clickCount, searchCount: s.searchCount, updatedAt: s.updatedAt }));
          return { results: arr };
        }
        if (q.includes('INSERT') && q.includes('user_feedback')) {
          const row = { 
            id: db.nextFeedbackId++, 
            resultId: a[0], 
            userId: a[1], 
            feedbackType: a[2], 
            createdAt: a[3] 
          };
          db.userFeedback.push(row);
          return { results: [row] };
        }
        if (q.includes('INSERT') && q.includes('trending_metrics')) {
          const row = { 
            id: db.nextTrendingId++,
            modelId: a[0],
            timePeriod: a[1],
            positiveFeedback: a[2],
            negativeFeedback: a[3],
            totalSearches: a[4],
            totalClicks: a[5],
            trendScore: a[6],
            periodStart: a[7],
            periodEnd: a[8],
            createdAt: a[9]
          };
          db.trendingMetrics.push(row);
          return { results: [row] };
        }
        if (q.includes('SELECT') && q.includes('trending_metrics')) {
          const period = a[0];
          const limit = a[1];
          const filtered = db.trendingMetrics
            .filter(m => m.timePeriod === period)
            .sort((a, b) => b.trendScore - a.trendScore)
            .slice(0, limit);
          return {
            results: filtered.map(m => ({
              modelId: m.modelId,
              trendScore: m.trendScore,
              positiveFeedback: m.positiveFeedback,
              negativeFeedback: m.negativeFeedback,
              totalSearches: m.totalSearches,
              totalClicks: m.totalClicks,
              periodStart: m.periodStart,
              periodEnd: m.periodEnd
            }))
          };
        }
        return { results: [] };
      },
      async run() {
        const q = this._query;
        const a = this._args;
        if (q.startsWith('INSERT INTO model_stats')) {
          const modelId = a[0];
          const updated = a[1];
          if (!db.modelStats[modelId]) {
            db.modelStats[modelId] = { clickCount: 0, searchCount: 0, updatedAt: updated };
          }
          return {};
        }
        if (q.startsWith('UPDATE model_stats SET search_count')) {
          const now = a[0];
          const modelId = a[1];
          const s = db.modelStats[modelId] || { clickCount: 0, searchCount: 0, updatedAt: now };
          s.searchCount += 1;
          s.updatedAt = now;
          db.modelStats[modelId] = s;
          return {};
        }
        if (q.startsWith('UPDATE model_stats SET click_count')) {
          const now = a[0];
          const resultId = a[1];
          const res = db.results.find(r => r.id === resultId);
          if (res) {
            const s = db.modelStats[res.modelId] || { clickCount: 0, searchCount: 0, updatedAt: now };
            s.clickCount += 1;
            s.updatedAt = now;
            db.modelStats[res.modelId] = s;
          }
          return {};
        }
        return {};
      }
    };
  }
}
