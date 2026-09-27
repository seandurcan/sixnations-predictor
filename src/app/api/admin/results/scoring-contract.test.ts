// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
vi.mock('@/lib/auth', () => ({ requireAdmin: async () => ({ id: 1 }) }));
vi.mock('@/lib/competitionStories', () => ({ generateCompletedRoundStory: async () => null }));
vi.mock('@/lib/knockoutBracket', () => ({ advanceKnockoutWinner: async () => null }));
vi.mock('@/lib/prisma', () => {
  const match = { id: 6, tournamentId: 1, completed: false, actualHomeScore: null, actualAwayScore: null, tournament: { firstKickoff: new Date('2027-02-05') } };
  const db = {
    match: { findUnique: vi.fn(async () => match), update: vi.fn(async ({data}) => ({...match,...data})), count: vi.fn(async () => 15) },
    prediction: { findMany: vi.fn(async () => [
      {id: 1, predictedHomeScore: 26, predictedAwayScore: 23},
      {id: 2, predictedHomeScore: 20, predictedAwayScore: 17},
      {id: 3, predictedHomeScore: 20, predictedAwayScore: 10},
    ]), update: vi.fn(async ({data}) => { if (!Number.isInteger(data.pointsAwarded)) throw new Error('Integer database rejected score'); return data; }) },
    scoreAudit: { create: vi.fn(async () => ({id: 1})) },
    systemSetting: { upsert: vi.fn() },
    user: { findMany: vi.fn(async () => []) },
    tournament: { update: vi.fn() },
    tournamentWinner: { deleteMany: vi.fn() },
    leaderboardSnapshot: { findFirst: vi.fn(async () => null) },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  };
  db.$transaction.mockImplementation(async (fn) => fn(db));
  return { prisma: db };
});
it('completes the sixth test game using integer result, margin and exact-score awards', async () => {
  const response = await POST(new Request('http://localhost/api/admin/results', {method:'POST', body:JSON.stringify({matchId:6,homeScore:26,awayScore:23,testMode:true})}));
  expect(response.status).toBe(200);
  expect((await response.json()).success).toBe(true);
  expect(vi.mocked(prisma.prediction.update).mock.calls.map(([arg]) => arg.data.pointsAwarded)).toEqual([6,3,1]);
});
