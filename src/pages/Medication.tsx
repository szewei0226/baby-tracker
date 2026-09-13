import { useCallback, useEffect, useState } from "react";
import { Pill, Plus, Check, SkipForward, Trash2, Clock } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  EmptyState,
} from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";
import { FloatingActionButton } from "../components/ui/TabBar";
import * as api from "../lib/api";

const caregivers = ["dad", "mum", "helper", "other"] as const;
type Caregiver = (typeof caregivers)[number];
type Plan = Record<string, unknown> & { id: number };
type Administration = Record<string, unknown> & { id: number };

function displayCaregiver(value: unknown) {
  return typeof value === "string"
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : "";
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export default function Medication() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [lastCaregiver, setLastCaregiver] = useState<Caregiver | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [administrations, setAdministrations] = useState<Administration[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const { showToast } = useToast();

  const refresh = useCallback(async () => {
    const response = await api.getMedications();
    if (response.error) showToast("error", response.error);
    setPlans((response.data?.plans as Plan[]) ?? []);
    const caregiver = response.data?.last_caregiver;
    setLastCaregiver(
      caregiver && caregivers.includes(caregiver as Caregiver)
        ? (caregiver as Caregiver)
        : null,
    );
  }, [showToast]);

  const openPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    const response = await api.getMedication(plan.id);
    if (response.error) showToast("error", response.error);
    setAdministrations(
      (response.data?.administrations as Administration[]) ?? [],
    );
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  const record = async (status: "given" | "skipped", actualAt?: string) => {
    if (!selectedPlan) return;
    if (status === "given" && !lastCaregiver) {
      showToast("error", "Select who gave the medication first");
      return;
    }
    const caregiver = lastCaregiver;
    const response = await api.createMedicationAdministration(selectedPlan.id, {
      scheduled_at: null,
      actual_at:
        status === "given" ? (actualAt ?? new Date().toISOString()) : null,
      dose: String(selectedPlan.dose),
      unit: String(selectedPlan.unit),
      given_by: status === "given" ? caregiver : null,
      status,
    });
    if (response.error) {
      showToast("error", response.error);
      return;
    }
    showToast(
      "success",
      status === "given" ? "Medication recorded" : "Dose skipped",
    );
    await openPlan(selectedPlan);
  };

  const removeAdministration = async (administration: Administration) => {
    if (!selectedPlan || !window.confirm("Delete this medication record?"))
      return;
    const response = await api.deleteMedicationAdministration(
      selectedPlan.id,
      administration.id,
    );
    if (response.error) showToast("error", response.error);
    else await openPlan(selectedPlan);
  };

  const complete = async () => {
    if (
      !selectedPlan ||
      !window.confirm("Mark this medication course as completed?")
    )
      return;
    const response = await api.completeMedication(selectedPlan.id);
    if (response.error) showToast("error", response.error);
    else {
      setSelectedPlan(null);
      await refresh();
    }
  };

  const active = plans.filter((plan) => plan.status === "active");
  const history = plans.filter((plan) => plan.status === "completed");

  return (
    <PageContainer>
      <PageHeader
        title="Medication"
        subtitle="Record what was given, when, and by whom"
      />
      {active.length === 0 && history.length === 0 ? (
        <EmptyState
          icon={<Pill className="w-6 h-6" />}
          title="No medication yet"
          description="Add a medication course to begin tracking."
        />
      ) : (
        <>
          <PlanSection title="Active" plans={active} onSelect={openPlan} />
          <PlanSection
            title="History"
            plans={history}
            onSelect={openPlan}
            muted
          />
        </>
      )}
      <FloatingActionButton
        onClick={() => setShowAdd(true)}
        icon={<Plus className="w-5 h-5" />}
        label="Add medication"
      />
      <AddMedicationModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => {
          setShowAdd(false);
          refresh();
        }}
      />
      <MedicationDetail
        plan={selectedPlan}
        administrations={administrations}
        caregiver={lastCaregiver}
        onClose={() => setSelectedPlan(null)}
        onRecord={record}
        onDelete={removeAdministration}
        onComplete={complete}
        onCaregiverChange={setLastCaregiver}
      />
    </PageContainer>
  );
}

function PlanSection({
  title,
  plans,
  onSelect,
  muted = false,
}: {
  title: string;
  plans: Plan[];
  onSelect: (plan: Plan) => void;
  muted?: boolean;
}) {
  if (plans.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="text-[15px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className="space-y-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            padding="sm"
            className={muted ? "opacity-70 cursor-pointer" : "cursor-pointer"}
            onClick={() => onSelect(plan)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)]">
                {plan.thumbnail_data ? (
                  <img
                    src={String(plan.thumbnail_data)}
                    alt=""
                    className="w-full h-full object-cover rounded-[var(--radius-md)]"
                  />
                ) : (
                  <Pill className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--color-text-primary)] truncate">
                  {String(plan.name)}
                </p>
                <p className="text-[13px] text-[var(--color-text-secondary)]">
                  {String(plan.dose)} {String(plan.unit)} ·{" "}
                  {plan.type === "prn" ? "PRN" : "Scheduled"}
                </p>
              </div>
              <span className="text-[13px] text-[var(--color-text-tertiary)]">
                {String(plan.start_date)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function AddMedicationModal({
  isOpen,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mL");
  const [type, setType] = useState<"scheduled" | "prn">("scheduled");
  const [scheduleMode, setScheduleMode] = useState("specific_times");
  const [times, setTimes] = useState("08:00");
  const [intervalHours, setIntervalHours] = useState("6");
  const [anchorTime, setAnchorTime] = useState("08:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDose("");
      setUnit("mL");
      setType("scheduled");
      setScheduleMode("specific_times");
      setTimes("08:00");
      setStartDate("");
      setEndDate("");
      setNotes("");
    }
  }, [isOpen]);

  const save = async () => {
    if (
      !name.trim() ||
      !dose.trim() ||
      !startDate ||
      (type === "scheduled" && !times.trim())
    )
      return;
    setSaving(true);
    const definition =
      type === "prn"
        ? undefined
        : scheduleMode === "interval"
          ? {
              mode: "interval",
              interval_hours: Number(intervalHours),
              anchor_time: anchorTime,
            }
          : {
              mode: scheduleMode,
              times: times
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean),
            };
    const response = await api.createMedication({
      name: name.trim(),
      dose: dose.trim(),
      unit,
      type,
      schedule_mode: type === "prn" ? undefined : scheduleMode,
      schedule_definition: definition,
      start_date: startDate,
      end_date: endDate || null,
      notes: notes || null,
    });
    setSaving(false);
    if (response.error) showToast("error", response.error);
    else {
      showToast("success", "Medication added");
      onSaved();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add medication">
      <div className="space-y-4">
        <Input
          label="Medicine name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Augmentin"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Dose"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="2.5"
          />
          <label className="block">
            <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">
              Unit
            </span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px]"
            >
              <option>mL</option>
              <option>mg</option>
              <option>tablet</option>
              <option>drop</option>
              <option>puff</option>
              <option>Other</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">
            Medication type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "scheduled" | "prn")}
            className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px]"
          >
            <option value="scheduled">Scheduled</option>
            <option value="prn">PRN</option>
          </select>
        </label>
        {type === "scheduled" && (
          <>
            <label className="block">
              <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">
                Schedule
              </span>
              <select
                value={scheduleMode}
                onChange={(e) => setScheduleMode(e.target.value)}
                className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px]"
              >
                <option value="specific_times">Specific times</option>
                <option value="daily_frequency">Daily times</option>
                <option value="interval">Every X hours</option>
              </select>
            </label>
            {scheduleMode === "interval" ? (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Every hours"
                  type="number"
                  value={intervalHours}
                  onChange={(e) => setIntervalHours(e.target.value)}
                />
                <Input
                  label="Anchor time"
                  type="time"
                  value={anchorTime}
                  onChange={(e) => setAnchorTime(e.target.value)}
                />
              </div>
            ) : (
              <Input
                label="Times, comma separated"
                value={times}
                onChange={(e) => setTimes(e.target.value)}
                placeholder="08:00, 16:00, 00:00"
              />
            )}
          </>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End date (optional)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <label className="block">
          <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-20 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        </label>
        <Button fullWidth onClick={save} isLoading={saving}>
          Save medication
        </Button>
      </div>
    </Modal>
  );
}

function MedicationDetail({
  plan,
  administrations,
  caregiver,
  onClose,
  onRecord,
  onDelete,
  onComplete,
  onCaregiverChange,
}: {
  plan: Plan | null;
  administrations: Administration[];
  caregiver: Caregiver | null;
  onClose: () => void;
  onRecord: (status: "given" | "skipped", actualAt?: string) => void;
  onDelete: (administration: Administration) => void;
  onComplete: () => void;
  onCaregiverChange: (caregiver: Caregiver) => void;
}) {
  const [earlier, setEarlier] = useState("");
  if (!plan) return null;
  return (
    <Modal isOpen onClose={onClose} title={String(plan.name)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <Clock className="w-4 h-4" />
          {String(plan.dose)} {String(plan.unit)} ·{" "}
          {plan.type === "prn" ? "PRN" : "Scheduled"}
        </div>
        {plan.type === "scheduled" && (
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Schedule occurrences will be shown here as the schedule engine is
            enabled.
          </p>
        )}
        <label className="block">
          <span className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1">
            Given by
          </span>
          <select
            value={caregiver ?? ""}
            onChange={(e) => onCaregiverChange(e.target.value as Caregiver)}
            className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[15px]"
          >
            <option value="" disabled>
              Select caregiver
            </option>
            {caregivers.map((value) => (
              <option key={value} value={value}>
                {displayCaregiver(value)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onRecord("given")}>
            <Check className="w-4 h-4" />
            Give now
          </Button>
          <Button variant="secondary" onClick={() => onRecord("skipped")}>
            <SkipForward className="w-4 h-4" />
            Skip
          </Button>
        </div>
        <div className="space-y-2">
          <Input
            label="Given earlier"
            type="datetime-local"
            value={earlier}
            onChange={(e) => setEarlier(e.target.value)}
          />
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              if (earlier) {
                onRecord("given", toIso(earlier));
                setEarlier("");
              }
            }}
          >
            Record earlier time
          </Button>
        </div>
        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
            Administration history
          </h3>
          {administrations.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-tertiary)]">
              No records yet.
            </p>
          ) : (
            <div className="space-y-2">
              {administrations.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 text-[13px]"
                >
                  <span className="flex-1">
                    {String(entry.status)}
                    {entry.actual_at
                      ? ` · ${new Date(String(entry.actual_at)).toLocaleString()}`
                      : ""}
                    {entry.given_by
                      ? ` · ${displayCaregiver(entry.given_by)}`
                      : ""}
                  </span>
                  <button
                    aria-label="Delete medication record"
                    onClick={() => onDelete(entry)}
                    className="p-1 text-[var(--color-danger)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <Button variant="ghost" fullWidth onClick={onComplete}>
          Complete course
        </Button>
      </div>
    </Modal>
  );
}
