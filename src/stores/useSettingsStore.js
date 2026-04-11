import { create } from 'zustand'
import { load, save, remove } from './_storage.js'
import { applyPalette } from '../lib/palettes.js'

const SETTINGS_DEFAULTS = {
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  pageSize: 50,
  customRules: [],
  theme: 'system',
}

const BRANDING_DEFAULTS = {
  appName: 'Fiscus',
  tagline: 'AI-Powered Finance',
  logoUrl: '',
  palette: 'forest',
}

export const useSettingsStore = create((set, get) => ({
  settings: SETTINGS_DEFAULTS,
  branding: BRANDING_DEFAULTS,
  rentalProperties: [],
  wizard: { completed: false, skipped: false, profile: {} },

  hydrate() {
    set({
      settings:         load('settings',          SETTINGS_DEFAULTS),
      branding:         load('branding',          BRANDING_DEFAULTS),
      rentalProperties: load('rental_properties', []),
      wizard:           load('wizard',            { completed: false, skipped: false, profile: {} }),
    })
  },

  saveSettings(settings) {
    set({ settings })
    save('settings', settings)
  },

  saveBranding(branding) {
    set({ branding })
    save('branding', branding)
  },

  saveRentalProperties(rentalProperties) {
    set({ rentalProperties })
    save('rental_properties', rentalProperties)
  },

  saveWizard(wizard) {
    set({ wizard })
    save('wizard', wizard)
  },

  /** Wipe every persisted key for this user. */
  clearAll() {
    ;['transactions','budgets','debts','rules','merchant_rules','settings',
      'wizard','rental_properties','review_progress','branding','chat_history',
      'workflow_checklist',
    ].forEach((k) => remove(k))
  },

  // ── Workflow checklist (auto-resets weekly) ──────────────────────────────
  getWorkflowChecklist()    { return load('workflow_checklist', {}) },
  saveWorkflowChecklist(v)  { save('workflow_checklist', v) },

  // ── Chat history ─────────────────────────────────────────────────────────
  getChatHistory()   { return load('chat_history', []) },
  saveChatHistory(v) { save('chat_history', v) },
  clearChatHistory() { remove('chat_history') },

  // ── Review progress ───────────────────────────────────────────────────────
  getReviewProgress()   { return load('review_progress', null) },
  saveReviewProgress(v) { save('review_progress', v) },
  clearReviewProgress() { remove('review_progress') },

  // ── Merchant rules ────────────────────────────────────────────────────────
  getMerchantRules()   { return load('merchant_rules', []) },
  saveMerchantRules(v) { save('merchant_rules', v) },

  // ── Custom keyword rules (stored inside settings) ────────────────────────
  getRules()   { return load('rules', []) },
  saveRules(v) { save('rules', v) },
}))
