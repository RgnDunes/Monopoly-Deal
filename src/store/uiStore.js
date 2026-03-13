import { create } from 'zustand'

let toastIdCounter = 0

const useUIStore = create((set) => ({
  activeModal: null,
  modalData: null,
  toasts: [],
  draggedCard: null,
  selectedCards: [],
  showPassDevice: false,
  nextPlayerName: '',

  showModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  addToast: (message, variant = 'info') => {
    const id = ++toastIdCounter
    set(s => ({
      toasts: [...s.toasts, { id, message, variant }].slice(-4),
    }))
    setTimeout(() => {
      set(s => ({
        toasts: s.toasts.filter(t => t.id !== id),
      }))
    }, 3500)
  },

  removeToast: (id) => set(s => ({
    toasts: s.toasts.filter(t => t.id !== id),
  })),

  setDraggedCard: (card) => set({ draggedCard: card }),

  toggleCardSelection: (cardId) => set(s => {
    const selected = s.selectedCards.includes(cardId)
      ? s.selectedCards.filter(id => id !== cardId)
      : [...s.selectedCards, cardId]
    return { selectedCards: selected }
  }),

  clearSelection: () => set({ selectedCards: [] }),

  showPassDeviceModal: (nextPlayerName) => set({
    showPassDevice: true,
    nextPlayerName,
  }),

  hidePassDeviceModal: () => set({
    showPassDevice: false,
    nextPlayerName: '',
  }),
}))

export default useUIStore
