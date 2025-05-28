export class FakeD1Database {
  searches: any[] = [];
  results: any[] = [];
  clicks: any[] = [];
  modelStats: Record<string, {clickCount: number; searchCount: number; updatedAt: string}>;
  nextSearchId = 1;
  nextResultId = 1;
  nextClickId = 1;
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
          const row = { id: db.nextSearchId++, query: a[0], createdAt: a[1] };
          db.searches.push(row);
          return { results: [row] };
        }
        if (q.startsWith('INSERT INTO results')) {
          const row = { id: db.nextResultId++, searchId: a[0], modelId: a[1], content: a[2], title: a[3], responseTime: a[4], createdAt: a[5] };
          db.results.push(row);
          return { results: [row] };
        }
        if (q.startsWith('INSERT INTO clicks')) {
          const row = { id: db.nextClickId++, resultId: a[0], createdAt: a[1] };
          db.clicks.push(row);
          return { results: [row] };
        }
        if (q.startsWith('SELECT model_id as modelId') && q.includes('ORDER BY')) {
          const limit = a[0];
          const arr = Object.entries(db.modelStats)
            .map(([modelId, s]) => ({ modelId, clickCount: s.clickCount, searchCount: s.searchCount, updatedAt: s.updatedAt }))
            .sort((x, y) => y.clickCount - x.clickCount)
            .slice(0, limit);
          return { results: arr };
        }
        if (q.startsWith('SELECT model_id as modelId')) {
          const arr = Object.entries(db.modelStats)
            .map(([modelId, s]) => ({ modelId, clickCount: s.clickCount, searchCount: s.searchCount, updatedAt: s.updatedAt }));
          return { results: arr };
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
