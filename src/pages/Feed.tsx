import { useEffect, useState, useCallback } from "react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { useToast } from "../components/ui/Toast";
import { TimerDisplay } from "../components/Timer";
import {
  cn,
  formatDuration,
  formatRelativeDay,
  formatTime,
  formatTimeSince,
  getToday,
} from "../lib/utils";
import * as api from "../lib/api";
import { Baby, Milk } from "lucide-react";
import { EditFeedModal } from "../components/EditEntryModals";

interface FeedEntry {
  id: number;
  type: string;
  status: string;
  side: string | null;
  started_at: string;
  ended_at: string | null;
  pauses: string;
  duration_seconds: number | null;
  amount_ml: number | null;
  is_tracked: boolean;
  notes: string | null;
}

export default function Feed() {
  const [active, setActive] = useState<FeedEntry | null>(null);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amountMl, setAmountMl] = useState("");
  const [notes, setNotes] = useState("");
  const [editingEntry, setEditingEntry] = useState<FeedEntry | null>(null);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const [activeRes, listRes] = await Promise.all([
      api.getActiveFeed(),
      api.getFeedEntries(),
    ]);
    setActive((activeRes.data?.entry as unknown as FeedEntry) ?? null);
    setEntries(
      (listRes.data?.entries as unknown as unknown as FeedEntry[]) ?? [],
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePause = async () => {
    if (!active) return;
    const res = await api.pauseFeed(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleResume = async () => {
    if (!active) return;
    const res = await api.resumeFeed(active.id);
    if (res.error) showToast("error", res.error);
    else refresh();
  };

  const handleStop = async () => {
    if (!active) return;
    const res = await api.stopFeed(active.id);
    if (res.error) showToast("error", res.error);
    else {
      showToast("success", "Breast feed recorded");
      refresh();
    }
  };

  const handleLogAmount = async () => {
    const amount = parseInt(amountMl);
    if (!amount || amount <= 0) {
      showToast("error", "Enter a valid amount");
      return;
    }

    const res = await api.logFormulaFeed(amount, notes || undefined);

    if (res.error) {
      showToast("error", res.error);
    } else {
      showToast("success", `formula feed logged (${amount}ml)`);
      setShowAmountModal(false);
      setAmountMl("");
      setNotes("");
      refresh();
    }
  };

  const today = getToday();
  const todayFeeds = entries.filter(
    (e) => e.started_at.slice(0, 10) === today && e.status === "completed",
  );
  const FEED_INTERVAL_TARGET = 4;
  const lastCompleted = todayFeeds[0];
  const hoursSinceLast = lastCompleted
    ? (Date.now() - new Date(lastCompleted.started_at).getTime()) / 3600000
    : null;

  const filteredEntries = entries;

  return (
    <PageContainer>
      <PageHeader title="Feed" subtitle="Track feeding sessions" />

      {/* Today's stats */}
      <Card padding="sm" className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] text-[var(--color-text-secondary)]">
              Today: {todayFeeds.length} feeds
            </p>
          </div>
          <p
            className={cn(
              "text-[14px] font-semibold",
              hoursSinceLast === null
                ? "text-[var(--color-text-tertiary)]"
                : hoursSinceLast <= FEED_INTERVAL_TARGET
                  ? "text-[var(--color-success)]"
                  : hoursSinceLast <= FEED_INTERVAL_TARGET * 1.5
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-danger)]",
            )}
          >
            {hoursSinceLast !== null
              ? `Last: ${formatTimeSince(lastCompleted.started_at)}`
              : "No feeds yet"}
          </p>
        </div>
      </Card>

      {/* Active breast feed timer */}
      {active && (
        <Card variant="elevated" padding="lg" className="mb-6">
          <TimerDisplay
            startedAt={active.started_at}
            pauses={JSON.parse(active.pauses)}
            status={active.status as "active" | "paused"}
            label={`Breast feed (${active.side})`}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        </Card>
      )}

      <Button
        size="lg"
        fullWidth
        className="mb-6"
        onClick={() => setShowAmountModal(true)}
      >
        <Milk className="w-5 h-5" />
        Log Formula Feed
      </Button>

      {/* Recent entries */}
      <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        Recent
      </h2>

      {filteredEntries.length === 0 && !isLoading ? (
        <EmptyState icon={<Baby className="w-6 h-6" />} title="No feeds yet" />
      ) : (
        <div className="space-y-2">
          {filteredEntries
            .filter((e) => e.status === "completed")
            .slice(0, 20)
            .map((entry) => (
              <Card
                key={entry.id}
                padding="sm"
                className="cursor-pointer press-effect"
                onClick={() => setEditingEntry(entry)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
                      {formatRelativeDay(entry.started_at) && (
                        <span className="text-[var(--color-text-secondary)]">
                          {formatRelativeDay(entry.started_at)}{" "}
                        </span>
                      )}
                      {formatTime(entry.started_at)}
                      {entry.side && (
                        <span className="text-[var(--color-text-secondary)]">
                          {" "}
                          ({entry.side})
                        </span>
                      )}
                    </p>
                    {entry.notes && (
                      <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[15px] font-semibold tabular-nums",
                      entry.is_tracked
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-tertiary)]",
                    )}
                  >
                    {entry.duration_seconds
                      ? formatDuration(entry.duration_seconds)
                      : entry.amount_ml
                        ? `${entry.amount_ml}ml`
                        : "-"}
                  </span>
                </div>
              </Card>
            ))}
        </div>
      )}

      <EditFeedModal
        entry={editingEntry}
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        onSaved={() => {
          setEditingEntry(null);
          refresh();
        }}
        onDeleted={() => {
          setEditingEntry(null);
          refresh();
        }}
      />

      {/* Amount Modal */}
      <Modal
        isOpen={showAmountModal}
        onClose={() => setShowAmountModal(false)}
        title="Log formula feed"
      >
        <div className="space-y-4">
          <Input
            label="Amount (ml)"
            type="number"
            inputMode="numeric"
            value={amountMl}
            onChange={(e) => setAmountMl(e.target.value)}
            placeholder="e.g. 120"
            autoFocus
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
          />
          <Button size="lg" fullWidth onClick={handleLogAmount}>
            Log Feed
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
