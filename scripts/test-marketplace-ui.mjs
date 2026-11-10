#!/usr/bin/env node
/**
 * Dependency-free BL-003 browser smoke test.
 * Run the app first, then:
 *   TEST_BASE_URL=http://127.0.0.1:5000 node scripts/test-marketplace-ui.mjs
 * Requires Node 22+ and Chromium on PATH (or CHROMIUM_BIN).
 * Uses an isolated temporary browser profile; never touches a real user's data.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:5000";
const profile = await mkdtemp(join(tmpdir(), "bookloop-ui-test-"));
const browser = spawn(
  process.env.CHROMIUM_BIN ?? "chromium",
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-debugging-address=127.0.0.1",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let socket;
const browserErrors = [];

try {
  assert.equal(typeof WebSocket, "function", "This smoke test requires Node 22+.");
  const debugUrl = await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Chromium did not start.")), 15_000);
    browser.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    browser.stderr.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
  });
  const debugOrigin = new URL(debugUrl);
  const targets = await fetch(`http://${debugOrigin.host}/json/list`).then((response) => response.json());
  const page = targets.find((target) => target.type === "page");
  assert.ok(page, "Chromium must expose a page target.");

  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      clearTimeout(waiter.timeout);
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)));
      else waiter.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") {
      const detail = message.params.exceptionDetails;
      browserErrors.push(detail.exception?.description ?? detail.text);
    } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      browserErrors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "));
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 30_000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
    }
    return response.result.value;
  }
  async function waitFor(expression, label) {
    const deadline = Date.now() + 25_000;
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const location = await evaluate(`({ url: location.href, heading: document.querySelector("h1")?.textContent })`);
    throw new Error(`Timed out: ${label}; page=${JSON.stringify(location)}`);
  }
  async function navigate(path, expression) {
    await send("Page.navigate", { url: new URL(path, baseUrl).href });
    await waitFor(expression, path);
  }
  async function fill(selector, value) {
    await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) throw new Error("Missing field: " + ${JSON.stringify(selector)});
      const prototype = element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
  }
  async function select(selector, value) {
    await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      element.value = ${JSON.stringify(value)};
      element.dispatchEvent(new Event("change", { bubbles: true }));
    })()`);
  }
  async function click(selector) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  }
  const hasText = (text) => `document.body.innerText.includes(${JSON.stringify(text)})`;
  const cardsEqual = (count) => `document.querySelectorAll("article").length === ${count}`;
  const pass = (label) => console.log(`PASS ${label}`);

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });

  await navigate("/browse", cardsEqual(8));
  assert.equal(await evaluate(`document.querySelectorAll("main").length`), 1);
  pass("sample listings hydrate with one main landmark");

  await fill('input[type="search"]', "organic chemistry");
  await waitFor(cardsEqual(1), "search result");
  await select('select', "notes");
  await evaluate(`(() => {
    const selects = document.querySelectorAll("select");
    selects[1].value = "digital";
    selects[1].dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await waitFor(`${cardsEqual(1)} && ${hasText("Organic chemistry revision notes")}`, "combined filters");
  await fill('input[type="search"]', "unmatched-bookloop-resource-987654");
  await waitFor(hasText("Nothing on this shelf yet"), "search empty state");
  await evaluate(`[...document.querySelectorAll("button")].find((button) => button.textContent.includes("Reset search")).click()`);
  await waitFor(cardsEqual(8), "reset search");
  pass("search, combined filters, empty state and reset");

  await click('a[href="/browse/introduction-to-algorithms-4e"]');
  await waitFor(`document.querySelector("h1")?.textContent.includes("Introduction to Algorithms")`, "detail navigation");
  assert.equal(await evaluate(hasText("₹1,450")), true);
  assert.equal(await evaluate(hasText("Sample listing")), true);
  await click('button[aria-pressed]');
  await waitFor(`document.querySelector("button[aria-pressed]")?.getAttribute("aria-pressed") === "true"`, "save detail");
  await navigate("/saved", cardsEqual(1));
  await send("Page.reload");
  await waitFor(`${cardsEqual(1)} && ${hasText("Introduction to Algorithms")}`, "saved reload persistence");
  await click('button[aria-pressed]');
  await waitFor(hasText("Your shortlist is still open"), "unsave empty state");
  pass("detail navigation, save, reload persistence and unsave");

  await navigate("/sell", `(() => {
    const field = document.querySelector("#field-title");
    return field && Object.keys(field).some((key) => key.startsWith("__reactProps$"));
  })()`);
  await click('button[type="submit"]');
  await waitFor(`document.querySelector("#field-title")?.getAttribute("aria-invalid") === "true"`, "required validation");
  await waitFor(`document.activeElement?.id === "listing-errors"`, "validation summary focus");
  const title = `Browser smoke textbook ${Date.now()}`;
  await fill("#field-title", title);
  await fill("#field-description", "A locally created demo textbook with clean pages and an intact binding.");
  await select("#field-categorySlug", "textbooks");
  await fill("#field-priceRupees", "123.456");
  await select("#field-condition", "good");
  await click('button[type="submit"]');
  await waitFor(`document.querySelector("#field-priceRupees")?.getAttribute("aria-invalid") === "true"`, "price precision validation");
  await fill("#field-priceRupees", "123.45");
  await click('button[type="submit"]');
  await waitFor(hasText("Your demo listing is ready"), "submission success");
  const listingPath = await evaluate(`[...document.querySelectorAll("a")].find((link) => link.textContent === "View your listing").getAttribute("href")`);
  await navigate(listingPath, `document.querySelector("h1")?.textContent === ${JSON.stringify(title)}`);
  assert.equal(await evaluate(hasText("₹123.45")), true, "Display exact paise.");
  assert.equal(await evaluate(hasText("Local demo listing")), true);
  await send("Page.reload");
  await waitFor(`document.querySelector("h1")?.textContent === ${JSON.stringify(title)}`, "created detail reload");
  await navigate("/browse", cardsEqual(9));
  await fill('input[type="search"]', title);
  await waitFor(cardsEqual(1), "created listing is searchable");
  pass("required/price validation, summary focus, local submission and reload persistence");

  await navigate("/sell", `(() => {
    const field = document.querySelector("#field-title");
    return field && Object.keys(field).some((key) => key.startsWith("__reactProps$"));
  })()`);
  const digitalTitle = `Browser smoke digital guide ${Date.now()}`;
  await fill("#field-title", digitalTitle);
  await fill("#field-description", "An original demo revision guide with worked examples and a study checklist.");
  await select("#field-categorySlug", "digital-resources");
  await waitFor(`document.querySelector("#field-kind")?.value === "digital" && !document.querySelector("#field-condition")`, "digital category mapping");
  await fill("#field-format", "PDF · 20 pages");
  await fill("#field-priceRupees", "49.75");
  await click('button[type="submit"]');
  await waitFor(hasText("Your demo listing is ready"), "digital submission");
  const digitalPath = await evaluate(`[...document.querySelectorAll("a")].find((link) => link.textContent === "View your listing").getAttribute("href")`);
  await navigate(digitalPath, `document.querySelector("h1")?.textContent === ${JSON.stringify(digitalTitle)}`);
  assert.equal(await evaluate(hasText("₹49.75")), true);
  assert.equal(await evaluate(hasText("PDF · 20 pages")), true);
  await send("Page.reload");
  await waitFor(`document.querySelector("h1")?.textContent === ${JSON.stringify(digitalTitle)}`, "digital reload persistence");
  pass("digital category restrictions, submission and reload persistence");

  await send("Emulation.setDeviceMetricsOverride", {
    width: 768, height: 1024, deviceScaleFactor: 1, mobile: false,
  });
  await navigate("/browse", cardsEqual(10));
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true);
  pass("tablet layout without horizontal overflow");

  await send("Emulation.setDeviceMetricsOverride", {
    width: 402, height: 874, deviceScaleFactor: 1, mobile: true,
  });
  await waitFor(`document.documentElement.scrollWidth <= window.innerWidth`, "mobile overflow");
  await click('button[aria-label="Open menu"]');
  await waitFor(`document.querySelector('[role="dialog"]') !== null`, "mobile menu opens");
  await click('[role="dialog"] a[href="/saved"]');
  await waitFor(`location.pathname === "/saved" && !document.querySelector('[role="dialog"]')`, "mobile menu navigation");
  pass("mobile layout and menu navigation");

  assert.deepEqual(browserErrors, [], "No browser exceptions, hydration errors or console errors.");
  pass("no browser errors");
  console.log("All BL-003 browser smoke checks passed.");
} catch (error) {
  if (browserErrors.length) console.error("Browser errors:", browserErrors);
  throw error;
} finally {
  socket?.close();
  browser.kill("SIGTERM");
  await new Promise((resolve) => {
    if (browser.exitCode !== null) resolve();
    else {
      browser.once("exit", resolve);
      setTimeout(resolve, 3000).unref();
    }
  });
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
