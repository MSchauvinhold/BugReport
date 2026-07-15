"use client";

import { create } from "zustand";

export type BugFormState = {
  title: string;
  description: string;
  severity: string;
  priority: string;
  steps: string[];
  expected: string;
  actual: string;
  notes: string;
  environment: string;
  module: string;
  tags: string[];
  screenshots: string[];
  uploadingCount: number;
};

type BugFormActions = {
  setField: <K extends keyof BugFormState>(key: K, value: BugFormState[K]) => void;
  addStep: () => void;
  updateStep: (index: number, value: string) => void;
  removeStep: (index: number) => void;
  moveStep: (index: number, direction: -1 | 1) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addScreenshot: (url: string) => void;
  removeScreenshot: (url: string) => void;
  startUpload: () => void;
  finishUpload: () => void;
  applyDraft: (draft: Partial<Omit<BugFormState, "uploadingCount">>) => void;
  reset: () => void;
};

const initialState: BugFormState = {
  title: "",
  description: "",
  severity: "",
  priority: "",
  steps: [""],
  expected: "",
  actual: "",
  notes: "",
  environment: "",
  module: "",
  tags: [],
  screenshots: [],
  uploadingCount: 0,
};

/** Indica si el formulario tiene datos cargados sin guardar. */
export function isBugFormDirty(s: BugFormState): boolean {
  return (
    s.title.trim() !== "" ||
    s.description.trim() !== "" ||
    s.severity !== "" ||
    s.priority !== "" ||
    s.expected.trim() !== "" ||
    s.actual.trim() !== "" ||
    s.notes.trim() !== "" ||
    s.environment.trim() !== "" ||
    s.module.trim() !== "" ||
    s.tags.length > 0 ||
    s.screenshots.length > 0 ||
    s.steps.some((step) => step.trim() !== "")
  );
}

export const useBugFormStore = create<BugFormState & BugFormActions>((set) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value }),

  addStep: () =>
    set((s) => ({ steps: [...s.steps, ""] })),

  updateStep: (index, value) =>
    set((s) => {
      const steps = [...s.steps];
      steps[index] = value;
      return { steps };
    }),

  removeStep: (index) =>
    set((s) => ({ steps: s.steps.filter((_, i) => i !== index) })),

  moveStep: (index, direction) =>
    set((s) => {
      const target = index + direction;
      if (target < 0 || target >= s.steps.length) return {};
      const steps = [...s.steps];
      [steps[index], steps[target]] = [steps[target], steps[index]];
      return { steps };
    }),

  addTag: (tag) =>
    set((s) =>
      s.tags.includes(tag) ? {} : { tags: [...s.tags, tag] }
    ),

  removeTag: (tag) =>
    set((s) => ({ tags: s.tags.filter((t) => t !== tag) })),

  addScreenshot: (url) =>
    set((s) => ({ screenshots: [...s.screenshots, url] })),

  removeScreenshot: (url) =>
    set((s) => ({ screenshots: s.screenshots.filter((u) => u !== url) })),

  startUpload: () => set((s) => ({ uploadingCount: s.uploadingCount + 1 })),

  finishUpload: () =>
    set((s) => ({ uploadingCount: Math.max(0, s.uploadingCount - 1) })),

  applyDraft: (draft) =>
    set((s) => ({
      ...s,
      ...draft,
      // garantizamos al menos un paso editable
      steps: draft.steps && draft.steps.length > 0 ? draft.steps : s.steps,
    })),

  reset: () => set(initialState),
}));
