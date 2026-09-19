const {
  safe,
  computeBuddyPay,
  filterTasks,
  computeDefaultDateISO,
  demoTasks
} = require("../app.js");


describe("safe()", () => {

  it("escapes each of the five special characters", () => {
    expect(safe("&")).toBe("&amp;");
    expect(safe("<")).toBe("&lt;");
    expect(safe(">")).toBe("&gt;");
    expect(safe('"')).toBe("&quot;");
    expect(safe("'")).toBe("&#039;");
  });

  it("neutralizes a script-injection payload", () => {
    const input = `<script>alert('xss')</script>`;
    const output = safe(input);

    expect(output).not.toContain("<script>");
    expect(output).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");
  });

  it("neutralizes an attribute-breakout payload", () => {
    const input = `"><img src=x onerror=alert(1)>`;
    const output = safe(input);

    expect(output).not.toContain('"');
    expect(output).not.toContain("<img");
  });

  it("leaves plain text untouched", () => {
    expect(safe("Help move a dresser upstairs")).toBe("Help move a dresser upstairs");
  });

  it("defaults to an empty string when called with no argument", () => {
    expect(safe()).toBe("");
  });

  it("coerces non-string values", () => {
    expect(safe(65)).toBe("65");
  });

});


describe("computeBuddyPay()", () => {

  it("returns zero buddy pay and full lead pay when no buddy is required", () => {
    expect(computeBuddyPay(100, false)).toEqual({ buddyPay: 0, leadPay: 100 });
  });

  it("splits pay 22% to the buddy, rounded, when a buddy is required", () => {
    expect(computeBuddyPay(100, true)).toEqual({ buddyPay: 22, leadPay: 78 });
  });

  it("rounds the buddy share to the nearest dollar", () => {
    // 65 * .22 = 14.3 -> rounds to 14
    expect(computeBuddyPay(65, true)).toEqual({ buddyPay: 14, leadPay: 51 });
  });

  it("floors the buddy pay at $10 even when 22% of payment is less", () => {
    // 22% of 40 is 8.8 (rounds to 9), floored up to the $10 minimum
    expect(computeBuddyPay(40, true)).toEqual({ buddyPay: 10, leadPay: 30 });
  });

  it("can drive lead pay to zero at the form's $10 minimum payment", () => {
    expect(computeBuddyPay(10, true)).toEqual({ buddyPay: 10, leadPay: 0 });
  });

  it("documents that lead pay goes negative below the $10 minimum (no clamp in computeBuddyPay)", () => {
    // The post form enforces min="10" on payment, but computeBuddyPay itself
    // does not guard against smaller values, so leadPay can go negative.
    expect(computeBuddyPay(5, true)).toEqual({ buddyPay: 10, leadPay: -5 });
  });

});


describe("filterTasks()", () => {

  const tasks = [
    { id: "a", category: "Moving", payment: 50, distance: 5, date: "Saturday" },
    { id: "b", category: "Pets", payment: 90, distance: 1, date: "Today" },
    { id: "c", category: "Moving", payment: 20, distance: 8, date: "Today" }
  ];

  it("returns all tasks, unsorted, for the 'All' filter", () => {
    expect(filterTasks(tasks, "All")).toEqual(tasks);
  });

  it("sorts ascending by distance for 'Near Me'", () => {
    const result = filterTasks(tasks, "Near Me");
    expect(result.map(t => t.id)).toEqual(["b", "a", "c"]);
  });

  it("sorts descending by payment for 'Highest Pay'", () => {
    const result = filterTasks(tasks, "Highest Pay");
    expect(result.map(t => t.id)).toEqual(["b", "a", "c"]);
  });

  it("filters to only tasks dated 'Today'", () => {
    const result = filterTasks(tasks, "Today");
    expect(result.map(t => t.id)).toEqual(["b", "c"]);
  });

  it("filters by category for any other filter name", () => {
    const result = filterTasks(tasks, "Moving");
    expect(result.map(t => t.id)).toEqual(["a", "c"]);
  });

  it("returns an empty array for a category with no matching tasks", () => {
    expect(filterTasks(tasks, "Tech")).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const original = [...tasks];
    filterTasks(tasks, "Near Me");
    expect(tasks).toEqual(original);
  });

  it("matches every demoTasks category filter without throwing", () => {
    ["Moving", "Household", "Cleaning", "Outdoors", "Errands", "Tech", "Pets"].forEach(cat => {
      expect(() => filterTasks(demoTasks, cat)).not.toThrow();
    });
  });

});


describe("computeDefaultDateISO()", () => {

  it("returns today's date plus two days, in YYYY-MM-DD form", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    expect(computeDefaultDateISO(now)).toBe("2026-01-03");
  });

  it("rolls over into the next month correctly", () => {
    const now = new Date("2026-01-30T12:00:00Z");
    expect(computeDefaultDateISO(now)).toBe("2026-02-01");
  });

  it("rolls over across a year boundary", () => {
    const now = new Date("2025-12-30T12:00:00Z");
    expect(computeDefaultDateISO(now)).toBe("2026-01-01");
  });

});
