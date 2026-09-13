import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppBindings, MedicationCaregiver } from "../types";
import { createD1MedicationRepository } from "../repositories/d1/medication.d1";
import { createD1ConfigRepository } from "../repositories/d1/config.d1";

const medication = new Hono<AppBindings>();
const caregivers = ["dad", "mum", "helper", "other"] as const;
const scheduleModes = [
  "specific_times",
  "interval",
  "daily_frequency",
] as const;

const scheduleDefinitionSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("specific_times"),
    times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1),
  }),
  z.object({
    mode: z.literal("interval"),
    interval_hours: z.number().positive(),
    anchor_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }),
  z.object({
    mode: z.literal("daily_frequency"),
    times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1),
  }),
]);

const planBaseSchema = z.object({
  name: z.string().trim().min(1),
  thumbnail_data: z.string().nullable().optional(),
  dose: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  type: z.enum(["scheduled", "prn"]),
  schedule_mode: z.enum(scheduleModes).nullable().optional(),
  schedule_definition: scheduleDefinitionSchema.nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["active", "completed"]).optional(),
});

const planSchema = planBaseSchema.superRefine((value, context) => {
  if (
    value.type === "scheduled" &&
    (!value.schedule_mode || !value.schedule_definition)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["schedule_definition"],
      message: "Schedule is required for scheduled medication",
    });
  }
  if (
    value.type === "prn" &&
    (value.schedule_mode || value.schedule_definition)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["schedule_definition"],
      message: "PRN medication cannot have a schedule",
    });
  }
  if (
    value.schedule_definition &&
    value.schedule_mode !== value.schedule_definition.mode
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["schedule_mode"],
      message: "Schedule mode must match schedule definition",
    });
  }
});

const updatePlanSchema = planBaseSchema.partial();

const administrationBaseSchema = z.object({
  scheduled_at: z.string().datetime().nullable().optional(),
  actual_at: z.string().datetime().nullable().optional(),
  dose: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  given_by: z.enum(caregivers).nullable().optional(),
  status: z.enum(["given", "skipped"]),
  notes: z.string().nullable().optional(),
});

const administrationSchema = administrationBaseSchema.superRefine(
  (value, context) => {
    if (value.status === "given") {
      if (!value.actual_at)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["actual_at"],
          message: "Actual time is required",
        });
      if (!value.given_by)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["given_by"],
          message: "Caregiver is required",
        });
    }
  },
);

const updateAdministrationSchema = administrationBaseSchema.partial();

medication.get("/", async (c) => {
  const repo = createD1MedicationRepository(c.env);
  const [plans, lastCaregiver] = await Promise.all([
    repo.listPlans(),
    createD1ConfigRepository(c.env).get("medication.last_caregiver"),
  ]);
  return c.json({ data: { plans, last_caregiver: lastCaregiver } });
});

medication.post("/", zValidator("json", planSchema), async (c) => {
  const repo = createD1MedicationRepository(c.env);
  const plan = await repo.createPlan(c.req.valid("json"));
  return c.json({ data: { plan } }, 201);
});

medication.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const repo = createD1MedicationRepository(c.env);
  const plan = await repo.getPlan(id);
  if (!plan) return c.json({ error: "Medication not found" }, 404);
  const administrations = await repo.listAdministrations(id);
  return c.json({ data: { plan, administrations } });
});

medication.put("/:id", zValidator("json", updatePlanSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const repo = createD1MedicationRepository(c.env);
  if (!(await repo.getPlan(id)))
    return c.json({ error: "Medication not found" }, 404);
  await repo.updatePlan(id, c.req.valid("json"));
  return c.json({ data: { plan: await repo.getPlan(id) } });
});

medication.post("/:id/complete", async (c) => {
  const id = Number(c.req.param("id"));
  const repo = createD1MedicationRepository(c.env);
  if (!(await repo.getPlan(id)))
    return c.json({ error: "Medication not found" }, 404);
  await repo.updatePlan(id, { status: "completed" });
  return c.json({ data: { plan: await repo.getPlan(id) } });
});

medication.get("/:id/administrations", async (c) => {
  const id = Number(c.req.param("id"));
  const repo = createD1MedicationRepository(c.env);
  if (!(await repo.getPlan(id)))
    return c.json({ error: "Medication not found" }, 404);
  return c.json({
    data: { administrations: await repo.listAdministrations(id) },
  });
});

medication.post(
  "/:id/administrations",
  zValidator("json", administrationSchema),
  async (c) => {
    const id = Number(c.req.param("id"));
    const repo = createD1MedicationRepository(c.env);
    if (!(await repo.getPlan(id)))
      return c.json({ error: "Medication not found" }, 404);
    try {
      const input = c.req.valid("json");
      const administration = await repo.createAdministration(id, input);
      if (input.status === "given" && input.given_by) {
        await createD1ConfigRepository(c.env).set(
          "medication.last_caregiver",
          input.given_by,
        );
      }
      return c.json({ data: { administration } }, 201);
    } catch (error) {
      if (String(error).toLowerCase().includes("unique"))
        return c.json(
          { error: "This scheduled occurrence is already recorded" },
          409,
        );
      throw error;
    }
  },
);

medication.put(
  "/:id/administrations/:administrationId",
  zValidator("json", updateAdministrationSchema),
  async (c) => {
    const id = Number(c.req.param("id"));
    const administrationId = Number(c.req.param("administrationId"));
    const repo = createD1MedicationRepository(c.env);
    const existing = await repo.getAdministration(administrationId);
    if (!existing || existing.medication_id !== id)
      return c.json({ error: "Administration not found" }, 404);
    const updates = c.req.valid("json");
    await repo.updateAdministration(administrationId, updates);
    if (updates.status === "given" && updates.given_by) {
      await createD1ConfigRepository(c.env).set(
        "medication.last_caregiver",
        updates.given_by as MedicationCaregiver,
      );
    }
    return c.json({
      data: { administration: await repo.getAdministration(administrationId) },
    });
  },
);

medication.delete("/:id/administrations/:administrationId", async (c) => {
  const id = Number(c.req.param("id"));
  const administrationId = Number(c.req.param("administrationId"));
  const repo = createD1MedicationRepository(c.env);
  const existing = await repo.getAdministration(administrationId);
  if (!existing || existing.medication_id !== id)
    return c.json({ error: "Administration not found" }, 404);
  await repo.deleteAdministration(administrationId);
  return c.json({ data: { success: true } });
});

export default medication;
