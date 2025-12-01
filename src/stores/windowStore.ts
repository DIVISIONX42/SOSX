import create from 'zustand'

type WindowItem = {
  id: string
  title: string
  component?: React.ReactNode
  open: boolean
  x?: number
  y?: number
  width?: number
  height?: number
}

type WindowState = {
  windows: WindowItem[]
  openWindow: (w: WindowItem) => void
  closeWindow: (id: string) => void
  toggleWindow: (id: string, w?: WindowItem) => void
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: [],
  openWindow: (w) => set(state => ({ windows: [...state.windows.filter(win => win.id !== w.id), { ...w, open: true }] })),
  closeWindow: (id) => set(state => ({ windows: get().windows.map(w => w.id === id ? { ...w, open: false } : w) })),
  toggleWindow: (id, w) => {
    const exists = get().windows.find(win => win.id === id)
    if (exists) {
      set(state => ({ windows: state.windows.map(win => win.id === id ? { ...win, open: !win.open } : win) }))
    } else if (w) {
      set(state => ({ windows: [...get().windows, { ...w, open: true }] }))
    }
  }
}))
