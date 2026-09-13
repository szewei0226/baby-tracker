import { Hono } from "hono";
import type { AppBindings } from "../types";
import { APP_VERSION } from "../../shared/constants";

const exportRoute = new Hono<AppBindings>();

exportRoute.get("/", async (c) => {
  if (c.req.query("format") !== "json") {
    return c.json({ error: "format=json query parameter required" }, 400);
  }

  const [
    sleep,
    feed,
    nappy,
    pump,
    growth,
    dailyTasks,
    dailyTaskCompletions,
    medicationPlans,
    medicationAdministrations,
  ] = await Promise.all([
    c.env.DB.prepare(
      "SELECT status, started_at, ended_at, pauses, duration_seconds, notes, created_at, updated_at FROM sleep_entries ORDER BY started_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT type, status, side, started_at, ended_at, pauses, duration_seconds, amount_ml, is_tracked, notes, created_at, updated_at FROM feed_entries ORDER BY started_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT type, occurred_at, notes, created_at FROM nappy_entries ORDER BY occurred_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT status, started_at, ended_at, pauses, duration_seconds, amount_ml, notes, created_at, updated_at FROM pump_entries ORDER BY started_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT weight_grams, height_mm, measured_at, notes, created_at FROM growth_entries ORDER BY measured_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT name, frequency_days, start_date, created_at FROM daily_tasks ORDER BY created_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT daily_tasks.name AS task_name, daily_task_completions.completed_at, daily_task_completions.created_at FROM daily_task_completions JOIN daily_tasks ON daily_tasks.id = daily_task_completions.task_id ORDER BY daily_task_completions.completed_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT * FROM medication_plans ORDER BY created_at ASC",
    ).all(),
    c.env.DB.prepare(
      "SELECT * FROM medication_administrations ORDER BY COALESCE(actual_at, scheduled_at, created_at) ASC",
    ).all(),
  ]);

  const exportedAt = new Date().toISOString();
  const body = JSON.stringify({
    exportedAt,
    appVersion: APP_VERSION,
    records: {
      sleep: sleep.results,
      feed: feed.results,
      nappy: nappy.results,
      pump: pump.results,
      growth: growth.results,
      dailyTasks: dailyTasks.results,
      dailyTaskCompletions: dailyTaskCompletions.results,
      medicationPlans: medicationPlans.results,
      medicationAdministrations: medicationAdministrations.results,
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Content-Disposition": `attachment; filename="baby-tracker-backup-${exportedAt.slice(0, 10)}.json"`,
    },
  });
});

export default exportRoute;
