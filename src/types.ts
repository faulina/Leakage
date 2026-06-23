/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StatusDefinition {
  id: string;
  name: string;
  category: 'active' | 'pipeline' | 'closed-lost' | 'closed-won' | 'other';
  color: string; // Tailwind border or background color class
  textClass: string; // Tailwind text color class
  bgClass: string; // Tailwind subtle background color
}

export interface DateRecord {
  dateStr: string; // 'YYYY-MM-DD' key
  label: string; // e.g. '20 Jun 26'
  values: Record<string, number>; // statusId -> count
}

export interface TransitionBlock {
  key: string;       // unique key for React rendering e.g. '2026-06-19_2026-06-20'
  currentDate: string; // '2026-06-20'
  previousDate: string; // '2026-06-19'
  currentLabel: string; // '20 Jun 26'
  previousLabel: string; // '19 Jun 26'
}

export interface AppState {
  statuses: StatusDefinition[];
  records: Record<string, Record<string, number>>; // dateStr -> { statusId -> value }
  orderedDates: string[]; // sorted newest to oldest, e.g. ['2026-06-20', '2026-06-19', ...]
}
