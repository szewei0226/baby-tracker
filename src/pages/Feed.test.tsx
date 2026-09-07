import { describe, test, expect } from "bun:test";
import { http, HttpResponse } from "msw";
import { renderAppAsAuthenticated, screen, userEvent } from "../test/utils";
import { server } from "../test/mocks/server";
import { TEST_BASE_URL } from "../test/global-setup";
import { createFeedEntry } from "../test/fixtures";
import Feed from "./Feed";

function setupFeedHandlers(options?: {
  active?: ReturnType<typeof createFeedEntry> | null;
  entries?: ReturnType<typeof createFeedEntry>[];
}) {
  const active = options?.active ?? null;
  const entries = options?.entries ?? [
    createFeedEntry({ id: 1, status: "completed" }),
  ];

  server.use(
    http.get(`${TEST_BASE_URL}/api/feed/active`, () => {
      return HttpResponse.json({ data: { entry: active } });
    }),
    http.get(`${TEST_BASE_URL}/api/feed`, () => {
      return HttpResponse.json({ data: { entries } });
    }),
  );
}

describe("Feed", () => {
  test("shows today's feed stats", async () => {
    setupFeedHandlers();
    renderAppAsAuthenticated(<Feed />);

    expect(await screen.findByText(/today:/i)).toBeInTheDocument();
  });

  test("shows Formula logging without removed feeding options", async () => {
    setupFeedHandlers();
    renderAppAsAuthenticated(<Feed />);

    expect(
      await screen.findByRole("button", { name: /log formula feed/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^left$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^right$/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Breast")).not.toBeInTheDocument();
    expect(screen.queryByText("Expressed")).not.toBeInTheDocument();
  });

  test("opens amount modal and logs formula feed", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(
      await screen.findByRole("button", { name: /log formula feed/i }),
    );
    await user.type(await screen.findByLabelText(/amount/i), "150");
    await user.click(screen.getByRole("button", { name: /^log feed$/i }));

    expect(
      await screen.findByText(/formula feed logged \(150ml\)/i),
    ).toBeInTheDocument();
  });

  test("shows error toast for invalid amount", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(
      await screen.findByRole("button", { name: /log formula feed/i }),
    );
    await user.click(screen.getByRole("button", { name: /^log feed$/i }));

    expect(
      await screen.findByText(/enter a valid amount/i),
    ).toBeInTheDocument();
  });

  test("keeps historical entries readable", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({
          id: 1,
          type: "breast",
          side: "left",
          status: "completed",
          duration_seconds: 1200,
        }),
        createFeedEntry({
          id: 2,
          type: "formula",
          side: null,
          status: "completed",
          amount_ml: 150,
          duration_seconds: null,
        }),
      ],
    });
    renderAppAsAuthenticated(<Feed />);

    expect(await screen.findByText("150ml")).toBeInTheDocument();
    expect(screen.getByText("20m 0s")).toBeInTheDocument();
  });

  test("opens edit modal for a formula entry", async () => {
    setupFeedHandlers({
      entries: [
        createFeedEntry({
          id: 1,
          type: "formula",
          status: "completed",
          amount_ml: 150,
          duration_seconds: null,
          notes: "After nap",
        }),
      ],
    });
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(await screen.findByText("150ml"));

    expect(await screen.findByText("Edit Feed")).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toHaveValue("After nap");
  });

  test("closes amount modal on close", async () => {
    setupFeedHandlers();
    const user = userEvent.setup();
    renderAppAsAuthenticated(<Feed />);

    await user.click(
      await screen.findByRole("button", { name: /log formula feed/i }),
    );
    expect(await screen.findByLabelText(/amount/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByLabelText(/amount/i)).not.toBeInTheDocument();
  });

  test("shows empty state when there are no entries", async () => {
    setupFeedHandlers({ entries: [] });
    renderAppAsAuthenticated(<Feed />);

    expect(await screen.findByText(/no feeds yet/i)).toBeInTheDocument();
  });
});
