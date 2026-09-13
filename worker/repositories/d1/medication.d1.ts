import type {
  Env,
  MedicationAdministration,
  MedicationPlan,
  MedicationPlanInput,
} from "../../types";
import type { MedicationRepository } from "../interfaces/medication.repository";

function parsePlan(row: MedicationPlan): MedicationPlan {
  return {
    ...row,
    schedule_definition:
      typeof row.schedule_definition === "string"
        ? JSON.parse(row.schedule_definition)
        : null,
  };
}

function parseAdministration(
  row: MedicationAdministration,
): MedicationAdministration {
  return row;
}

export function createD1MedicationRepository(env: Env): MedicationRepository {
  return {
    async createPlan(input: MedicationPlanInput) {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        `INSERT INTO medication_plans
          (name, thumbnail_data, dose, unit, type, schedule_mode, schedule_definition, start_date, end_date, notes, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
         RETURNING *`,
      )
        .bind(
          input.name,
          input.thumbnail_data ?? null,
          input.dose,
          input.unit,
          input.type,
          input.schedule_mode ?? null,
          input.schedule_definition
            ? JSON.stringify(input.schedule_definition)
            : null,
          input.start_date,
          input.end_date ?? null,
          input.notes ?? null,
          now,
          now,
        )
        .first<MedicationPlan>();
      return parsePlan(row!);
    },

    async getPlan(id) {
      const row = await env.DB.prepare(
        "SELECT * FROM medication_plans WHERE id = ?",
      )
        .bind(id)
        .first<MedicationPlan>();
      return row ? parsePlan(row) : null;
    },

    async listPlans(status) {
      const query = status
        ? "SELECT * FROM medication_plans WHERE status = ? ORDER BY created_at DESC"
        : "SELECT * FROM medication_plans ORDER BY created_at DESC";
      const statement = status
        ? env.DB.prepare(query).bind(status)
        : env.DB.prepare(query);
      const { results } = await statement.all<MedicationPlan>();
      return results.map(parsePlan);
    },

    async updatePlan(id, updates) {
      const fields: string[] = [];
      const values: unknown[] = [];
      const columns: (keyof MedicationPlanInput)[] = [
        "name",
        "thumbnail_data",
        "dose",
        "unit",
        "type",
        "schedule_mode",
        "start_date",
        "end_date",
        "notes",
      ];
      for (const column of columns) {
        if (updates[column] !== undefined) {
          fields.push(`${column} = ?`);
          values.push(updates[column] ?? null);
        }
      }
      if (updates.schedule_definition !== undefined) {
        fields.push("schedule_definition = ?");
        values.push(
          updates.schedule_definition
            ? JSON.stringify(updates.schedule_definition)
            : null,
        );
      }
      if (updates.status !== undefined) {
        fields.push("status = ?");
        values.push(updates.status);
      }
      if (fields.length === 0) return;
      fields.push("updated_at = ?");
      values.push(new Date().toISOString(), id);
      await env.DB.prepare(
        `UPDATE medication_plans SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async createAdministration(medicationId, input) {
      const now = new Date().toISOString();
      const row = await env.DB.prepare(
        `INSERT INTO medication_administrations
          (medication_id, scheduled_at, actual_at, dose, unit, given_by, status, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`,
      )
        .bind(
          medicationId,
          input.scheduled_at ?? null,
          input.actual_at ?? null,
          input.dose,
          input.unit,
          input.given_by ?? null,
          input.status,
          input.notes ?? null,
          now,
          now,
        )
        .first<MedicationAdministration>();
      return parseAdministration(row!);
    },

    async getAdministration(id) {
      const row = await env.DB.prepare(
        "SELECT * FROM medication_administrations WHERE id = ?",
      )
        .bind(id)
        .first<MedicationAdministration>();
      return row ? parseAdministration(row) : null;
    },

    async listAdministrations(medicationId) {
      const { results } = await env.DB.prepare(
        "SELECT * FROM medication_administrations WHERE medication_id = ? ORDER BY COALESCE(actual_at, scheduled_at, created_at) DESC",
      )
        .bind(medicationId)
        .all<MedicationAdministration>();
      return results.map(parseAdministration);
    },

    async updateAdministration(id, updates) {
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const column of [
        "scheduled_at",
        "actual_at",
        "dose",
        "unit",
        "given_by",
        "status",
        "notes",
      ] as const) {
        if (updates[column] !== undefined) {
          fields.push(`${column} = ?`);
          values.push(updates[column] ?? null);
        }
      }
      if (fields.length === 0) return;
      fields.push("updated_at = ?");
      values.push(new Date().toISOString(), id);
      await env.DB.prepare(
        `UPDATE medication_administrations SET ${fields.join(", ")} WHERE id = ?`,
      )
        .bind(...values)
        .run();
    },

    async deleteAdministration(id) {
      await env.DB.prepare(
        "DELETE FROM medication_administrations WHERE id = ?",
      )
        .bind(id)
        .run();
    },
  };
}
