import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal config for Phase 1. Path aliases (e.g. "@/services") can be added
// once the folder structure has settled — not needed yet.
export default defineConfig({
  plugins: [react()],
})
