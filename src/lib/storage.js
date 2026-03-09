/**
 * Per-user localStorage storage.
 * Call storage.setUser(username) after login before using any other method.
 */

let _user = null

function prefix(suffix) {
  return _user ? `fiscus_u_${_user}_${suffix}` : `fiscus_${suffix}`
}

function get(suffix, fallback = null) {
  try {
    const raw = localStorage.getItem(prefix(suffix))
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function set(suffix, value) {
  localStorage.setItem(prefix(suffix), JSON.stringify(value))
}

function remove(suffix) {
  localStorage.removeItem(prefix(suffix))
}

export const storage = {
  setUser(username) { _user = username },
  getUser() { return _user },

  getTransactions:       () => get('transactions', []),
  saveTransactions:      (v) => set('transactions', v),

  getBudgets:            () => get('budgets', []),
  saveBudgets:           (v) => set('budgets', v),

  getDebts:              () => get('debts', []),
  saveDebts:             (v) => set('debts', v),

  getRules:              () => get('rules', []),
  saveRules:             (v) => set('rules', v),

  getMerchantRules:      () => get('merchant_rules', []),
  saveMerchantRules:     (v) => set('merchant_rules', v),

  getSettings:           () => get('settings', {
    openaiKey: '',
    openaiModel: 'gpt-4o-mini',
    pageSize: 50,
    customRules: [],
    theme: 'system',
  }),
  saveSettings:          (v) => set('settings', v),

  getWizard:             () => get('wizard', { completed: false, skipped: false, profile: {} }),
  saveWizard:            (v) => set('wizard', v),

  getRentalProperties:   () => get('rental_properties', []),
  saveRentalProperties:  (v) => set('rental_properties', v),

  // AI review progress — persists across page navigation
  getReviewProgress:     () => get('review_progress', null),
  saveReviewProgress:    (v) => set('review_progress', v),
  clearReviewProgress:   ()  => remove('review_progress'),

  // Branding customization
  getBranding:           () => get('branding', { appName: 'Fiscus', tagline: 'AI-Powered Finance', logoUrl: '', palette: 'forest' }),
  saveBranding:          (v) => set('branding', v),

  // AI Advisor chat history
  getChatHistory:        () => get('chat_history', []),
  saveChatHistory:       (v) => set('chat_history', v),
  clearChatHistory:      ()  => remove('chat_history'),

  // Weekly workflow checklist (auto-resets each week)
  getWorkflowChecklist:  () => get('workflow_checklist', {}),
  saveWorkflowChecklist: (v) => set('workflow_checklist', v),

  clearAll() {
    const keys = [
      'transactions','budgets','debts','rules','merchant_rules','settings',
      'wizard','rental_properties','review_progress','branding','chat_history','workflow_checklist',
    ]
    keys.forEach(k => remove(k))
  },
}
