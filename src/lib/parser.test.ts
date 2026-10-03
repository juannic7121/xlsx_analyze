import { describe, expect, it } from "vitest";
import {
  computeFirma,
  normalizeText,
  parseDataset,
} from "@/lib/parser";

describe("normalizeText", () => {
  it("handles CRLF, LF, and BOM", () => {
    expect(normalizeText("\uFEFF8791\r\n8798\r8796\n")).toEqual([
      "8791",
      "8798",
      "8796",
      "",
    ]);
  });

  it("preserves blank lines as empty strings", () => {
    expect(normalizeText("\n\n8791\n\n")).toEqual(["", "", "8791", "", ""]);
  });
});

describe("computeFirma", () => {
  it("sorts digits ascending", () => {
    expect(computeFirma("8791")).toBe("1789");
    expect(computeFirma("1235")).toBe("1235");
    expect(computeFirma("5321")).toBe("1235");
    expect(computeFirma("1155")).toBe("1155");
    expect(computeFirma("0001")).toBe("0001");
  });
});

describe("parseDataset", () => {
  it("parses valid codes and skips blanks", () => {
    const result = parseDataset("\r\n\r\n8791\r\n8798\r\n\r\n8791\r\n");
    expect(result.records).toEqual(["8791", "8798", "8791"]);
    expect(result.unique).toEqual(["8791", "8798"]);
    expect(result.blankLines).toBeGreaterThan(0);
    expect(result.issues).toEqual([]);
  });

  it("trims whitespace around codes", () => {
    const result = parseDataset("  8791  \n\t8798\t");
    expect(result.records).toEqual(["8791", "8798"]);
  });

  it("reports malformed rows", () => {
    const result = parseDataset("8791\nabc\n123\n12345\n12a4\n");
    expect(result.records).toEqual(["8791"]);
    expect(result.issues).toHaveLength(4);
  });

  it("handles empty input", () => {
    const result = parseDataset("");
    expect(result.records).toEqual([]);
    expect(result.unique).toEqual([]);
  });

  it("handles only blank lines", () => {
    const result = parseDataset("\n\n\r\n");
    expect(result.records).toEqual([]);
  });
});
