// Script para remover todas as notificações da Isabelle do banco de dados
import { initializeApp } from "firebase/app"
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"

const firebaseConfig = {
  // Configuração será carregada automaticamente
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function removeIsabelleNotifications() {
  try {
    console.log("[v0] Iniciando busca por notificações da Isabelle...")

    // Buscar todas as notificações que contenham "Isabelle" no título ou mensagem
    const notificationsRef = collection(db, "notifications")

    // Query para encontrar notificações com "Isabelle" no título
    const titleQuery = query(notificationsRef, where("title", ">=", "Nova mensagem da Isabelle"))
    const titleSnapshot = await getDocs(titleQuery)

    // Query para encontrar notificações com "Isabelle" na mensagem
    const messageQuery = query(notificationsRef, where("message", ">=", "A Isabelle acabou"))
    const messageSnapshot = await getDocs(messageQuery)

    // Combinar resultados e remover duplicatas
    const allDocs = new Map()

    titleSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.title && data.title.includes("Isabelle")) {
        allDocs.set(doc.id, doc)
      }
    })

    messageSnapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.message && data.message.includes("Isabelle")) {
        allDocs.set(doc.id, doc)
      }
    })

    console.log(`[v0] Encontradas ${allDocs.size} notificações da Isabelle para remover`)

    // Remover cada notificação encontrada
    let removedCount = 0
    for (const [docId, docRef] of allDocs) {
      try {
        await deleteDoc(doc(db, "notifications", docId))
        removedCount++
        console.log(`[v0] Removida notificação: ${docId}`)
      } catch (error) {
        console.error(`[v0] Erro ao remover notificação ${docId}:`, error)
      }
    }

    console.log(`[v0] Processo concluído! ${removedCount} notificações da Isabelle foram removidas.`)

    return {
      success: true,
      removedCount,
      message: `${removedCount} notificações da Isabelle foram removidas com sucesso!`,
    }
  } catch (error) {
    console.error("[v0] Erro durante a limpeza das notificações:", error)
    return {
      success: false,
      error: error.message,
      message: "Erro ao remover notificações da Isabelle",
    }
  }
}

// Executar a função
removeIsabelleNotifications()
  .then((result) => {
    console.log("[v0] Resultado final:", result)
  })
  .catch((error) => {
    console.error("[v0] Erro fatal:", error)
  })
