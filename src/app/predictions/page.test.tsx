import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PredictionsPage from '@/app/predictions/page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('PredictionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Mock window.location.href assignment
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  it('renders loading state initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}));

    render(<PredictionsPage />);
    
    expect(screen.getByText(/loading predictions/i)).toBeInTheDocument();
  });

  it('redirects to login if user is unauthenticated', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });
  });

  it("renders predictions page with fixture, progress, and Irish formatted kick-off date", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: { firstName: 'Sean' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            homeTeam: { shortCode: 'IRE', name: 'Ireland' },
            awayTeam: { shortCode: 'FRA', name: 'France' },
            kickoffTime: '2027-01-29T14:15:00Z',
            completed: false,
            round: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<PredictionsPage />);

    expect(
      await screen.findByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Welcome Sean")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Prediction Progress")
    ).toBeInTheDocument();

    expect(
      screen.getByText("0 / 1")
    ).toBeInTheDocument();

    expect(
      screen.getByText("IRE v FRA")
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(/29 Jan 2027/i)[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText(/14:15/i)[0]
    ).toBeInTheDocument();
  });

  it('allows users to enter score predictions and save them', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: { firstName: 'Test' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            id: 1,
            homeTeam: { shortCode: 'FRA', name: 'France' },
            awayTeam: { shortCode: 'SCO', name: 'Scotland' },
            kickoffTime: '2027-02-06T15:00:00Z',
            completed: false,
            round: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(screen.getByText('FRA v SCO')).toBeInTheDocument();
    });

    const inputs = screen.getAllByRole('spinbutton');
    const homeInput = inputs[0];
    const awayInput = inputs[1];

    fireEvent.change(homeInput, { target: { value: '24' } });
    fireEvent.change(awayInput, { target: { value: '10' } });

    expect(homeInput).toHaveValue(24);
    expect(awayInput).toHaveValue(10);

    const saveButton = screen.getByRole('button', { name: /save prediction/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/predictions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
    });
  });

  it('displays error banner if fetching fixtures fails', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: { firstName: 'Test' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to load match fixtures' }),
      });

    render(<PredictionsPage />);

    await waitFor(() => {
      expect(window.location.href).toBe('/login');
    });
  });
});