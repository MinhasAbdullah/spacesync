import { ApiError } from "@/lib/api/http";

const weekdayMap: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

type Rule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY";
  interval: number;
  count?: number;
  until?: Date;
  byDay?: number[];
};

function parseUntil(value: string) {
  if (/^\d{8}T\d{6}Z$/.test(value)) {
    return new Date(
      `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`,
    );
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(422, "INVALID_RRULE", "RRULE UNTIL is invalid.");
  }
  return date;
}

export function parseRRule(input: string): Rule {
  const normalized = input.trim().replace(/^RRULE:/i, "");
  const parts = Object.fromEntries(
    normalized.split(";").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key?.toUpperCase(), value?.toUpperCase()];
    }),
  );

  if (!parts.FREQ || !["DAILY", "WEEKLY", "MONTHLY"].includes(parts.FREQ)) {
    throw new ApiError(
      422,
      "INVALID_RRULE",
      "RRULE FREQ must be DAILY, WEEKLY, or MONTHLY.",
    );
  }

  const interval = parts.INTERVAL ? Number(parts.INTERVAL) : 1;
  const count = parts.COUNT ? Number(parts.COUNT) : undefined;
  if (!Number.isInteger(interval) || interval < 1 || interval > 365) {
    throw new ApiError(422, "INVALID_RRULE", "RRULE INTERVAL is invalid.");
  }
  if (count !== undefined && (!Number.isInteger(count) || count < 1)) {
    throw new ApiError(422, "INVALID_RRULE", "RRULE COUNT is invalid.");
  }

  let byDay: number[] | undefined;
  if (parts.BYDAY) {
    byDay = parts.BYDAY.split(",").map((day) => {
      const value = weekdayMap[day];
      if (value === undefined) {
        throw new ApiError(
          422,
          "INVALID_RRULE",
          `Unsupported BYDAY value: ${day}.`,
        );
      }
      return value;
    });
  }

  return {
    freq: parts.FREQ as Rule["freq"],
    interval,
    count,
    until: parts.UNTIL ? parseUntil(parts.UNTIL) : undefined,
    byDay,
  };
}

function addUtcDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addUtcMonths(date: Date, months: number) {
  const day = date.getUTCDate();
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const maxDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, maxDay));
  return result;
}

export function materializeOccurrences(options: {
  start: Date;
  end: Date;
  rrule: string;
  maxOccurrences: number;
  horizonDays: number;
}) {
  const rule = parseRRule(options.rrule);
  const durationMs = options.end.getTime() - options.start.getTime();
  const horizon = addUtcDays(options.start, options.horizonDays);
  const hardLimit = Math.min(rule.count ?? options.maxOccurrences, options.maxOccurrences);
  const stopAt = rule.until && rule.until < horizon ? rule.until : horizon;
  const occurrences: Array<{ start: Date; end: Date }> = [];

  if (rule.freq === "DAILY") {
    let cursor = new Date(options.start);
    while (cursor <= stopAt && occurrences.length < hardLimit) {
      if (!rule.byDay || rule.byDay.includes(cursor.getUTCDay())) {
        occurrences.push({
          start: new Date(cursor),
          end: new Date(cursor.getTime() + durationMs),
        });
      }
      cursor = addUtcDays(cursor, rule.interval);
    }
  }

  if (rule.freq === "WEEKLY") {
    const allowedDays = rule.byDay ?? [options.start.getUTCDay()];
    let cursor = new Date(options.start);
    let scannedDays = 0;
    while (cursor <= stopAt && occurrences.length < hardLimit) {
      const weeksFromStart = Math.floor(scannedDays / 7);
      if (
        weeksFromStart % rule.interval === 0 &&
        allowedDays.includes(cursor.getUTCDay())
      ) {
        occurrences.push({
          start: new Date(cursor),
          end: new Date(cursor.getTime() + durationMs),
        });
      }
      cursor = addUtcDays(cursor, 1);
      scannedDays += 1;
    }
  }

  if (rule.freq === "MONTHLY") {
    let cursor = new Date(options.start);
    while (cursor <= stopAt && occurrences.length < hardLimit) {
      if (!rule.byDay || rule.byDay.includes(cursor.getUTCDay())) {
        occurrences.push({
          start: new Date(cursor),
          end: new Date(cursor.getTime() + durationMs),
        });
      }
      cursor = addUtcMonths(cursor, rule.interval);
    }
  }

  if (occurrences.length === 0) {
    throw new ApiError(
      422,
      "EMPTY_RECURRENCE",
      "The RRULE produced no occurrences in the requested horizon.",
    );
  }

  return occurrences;
}
