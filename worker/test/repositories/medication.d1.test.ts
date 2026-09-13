import { describe, test, beforeEach, expect } from "bun:test";
import { createTestD1Env, clearD1Tables } from "../d1-setup";
import { createD1MedicationRepository } from "../../repositories/d1/medication.d1";

describe("D1 MedicationRepository", () => {
  let env: Awaited<ReturnType<typeof createTestD1Env>>;

  beforeEach(async () => {
    env = await createTestD1Env();
    await clearD1Tables(env);
  });

  test("creates scheduled and PRN plans", async () => {
    const repo = createD1MedicationRepository(env);
    const scheduled = await repo.createPlan({
      name: "Augmentin",
      dose: "2.5",
      unit: "mL",
      type: "scheduled",
      schedule_mode: "specific_times",
      schedule_definition: {
        mode: "specific_times",
        times: ["08:00", "16:00"],
      },
      start_date: "2026-09-11",
    });
    const prn = await repo.createPlan({
      name: "Paracetamol",
      dose: "2.5",
      unit: "mL",
      type: "prn",
      start_date: "2026-09-11",
    });

    expect(scheduled.schedule_definition).toEqual({
      mode: "specific_times",
      times: ["08:00", "16:00"],
    });
    expect(prn.type).toBe("prn");
    expect(await repo.listPlans("active")).toHaveLength(2);
  });

  test("stores administration snapshots and prevents duplicate scheduled records", async () => {
    const repo = createD1MedicationRepository(env);
    const plan = await repo.createPlan({
      name: "Augmentin",
      dose: "2.5",
      unit: "mL",
      type: "scheduled",
      schedule_mode: "specific_times",
      schedule_definition: { mode: "specific_times", times: ["08:00"] },
      start_date: "2026-09-11",
    });
    const input = {
      scheduled_at: "2026-09-11T08:00:00.000Z",
      actual_at: "2026-09-11T08:03:00.000Z",
      dose: "2.5",
      unit: "mL",
      given_by: "dad" as const,
      status: "given" as const,
    };
    const administration = await repo.createAdministration(plan.id, input);

    await expect(repo.createAdministration(plan.id, input)).rejects.toThrow();
    expect(administration.dose).toBe("2.5");
    expect(administration.actual_at).toBe(input.actual_at);
    expect(administration.given_by).toBe("dad");
  });

  test("edits and deletes only the selected administration", async () => {
    const repo = createD1MedicationRepository(env);
    const plan = await repo.createPlan({
      name: "Paracetamol",
      dose: "2.5",
      unit: "mL",
      type: "prn",
      start_date: "2026-09-11",
    });
    const first = await repo.createAdministration(plan.id, {
      actual_at: "2026-09-11T08:00:00.000Z",
      dose: "2.5",
      unit: "mL",
      given_by: "mum",
      status: "given",
    });
    const second = await repo.createAdministration(plan.id, {
      actual_at: "2026-09-11T12:00:00.000Z",
      dose: "2.5",
      unit: "mL",
      given_by: "dad",
      status: "given",
    });

    await repo.updateAdministration(first.id, { notes: "Corrected" });
    await repo.deleteAdministration(second.id);

    expect((await repo.getAdministration(first.id))?.notes).toBe("Corrected");
    expect(await repo.getAdministration(second.id)).toBeNull();
  });
});
