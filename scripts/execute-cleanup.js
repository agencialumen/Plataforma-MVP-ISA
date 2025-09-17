// Script para executar a limpeza das notificações da Isabelle
import { forceDeleteIsabelleNotifications } from "../lib/firebase/firestore.js"

console.log("[v0] Iniciando limpeza das notificações da Isabelle...")

try {
  const result = await forceDeleteIsabelleNotifications()

  if (result.success) {
    console.log("[v0] ✅ Limpeza concluída com sucesso!")
    console.log(`[v0] 📊 ${result.removedCount} notificações removidas`)
    console.log(`[v0] 💬 ${result.message}`)
  } else {
    console.log("[v0] ❌ Erro durante a limpeza:")
    console.log(`[v0] 💬 ${result.message}`)
  }
} catch (error) {
  console.error("[v0] ❌ Erro fatal durante a execução:", error)
}
