"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Diamond, ArrowLeft } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    id: "platinum", // mudando id de premium para platinum
    name: "Platinum", // mudando nome de Premium para Platinum
    price: "R$ 29,90",
    period: "/mês",
    icon: <Crown className="w-5 h-5 text-purple-400" />,
    popular: true,
    features: [
      "Acesso a conteúdo Platinum", // mudando referência de Premium para Platinum
      "Fotos em alta resolução",
      "Vídeos exclusivos",
      "Chat direto",
      "Suporte prioritário",
    ],
  },
  {
    id: "diamante",
    name: "Diamante",
    price: "R$ 59,90",
    period: "/mês",
    icon: <Diamond className="w-5 h-5 text-blue-400" />,
    popular: false,
    features: [
      "Tudo do plano Platinum", // mudando referência de Premium para Platinum
      "Acesso total ao conteúdo",
      "Lives exclusivas",
      "Videochamadas mensais",
      "Conteúdo personalizado",
      "Experiência VIP completa",
    ],
  },
]

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center fade-in">
          <h1 className="text-3xl font-bold text-primary mb-2">DeLuxe Isa</h1>
          <p className="text-muted-foreground">Escolha seu plano de assinatura</p>
        </div>

        {/* Plano Gratuito */}
        <div className="fade-in">
          <Card className="max-w-md mx-auto border-border/50 bg-black">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <span className="text-lg">🥇</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white">Gold (Gratuito)</h3>
              <p className="text-sm text-muted-foreground">Acesso básico ao conteúdo</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold mb-4 text-white">Grátis</div>
              <ul className="text-sm text-muted-foreground space-y-2 mb-4">
                <li className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Conteúdo público limitado
                </li>
                <li className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Fotos em baixa resolução
                </li>
              </ul>
              <p className="text-xs text-muted-foreground">Você já tem acesso!</p>
            </CardContent>
          </Card>
        </div>

        {/* Planos Premium */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto fade-in">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-300 hover:scale-105 border-border/50 bg-black glow-pink-hover ${
                selectedPlan === plan.id ? "glow-pink border-primary" : ""
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 rounded-full bg-gray-900 border border-gray-700">{plan.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">Plano {plan.name.toLowerCase()}</p>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-left">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão de Checkout */}
        {selectedPlan && (
          <div className="text-center fade-in">
            <Button size="lg" className="bg-primary hover:bg-primary/80 glow-pink-hover px-8 py-3">
              Assinar Plano {plans.find((p) => p.id === selectedPlan)?.name}
            </Button>
            <p className="text-xs text-muted-foreground mt-4">Gateway de pagamento será integrado em breve</p>
          </div>
        )}

        {/* Voltar */}
        <div className="text-center fade-in">
          <Link href="/feed">
            <Button variant="ghost" className="text-muted-foreground hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Feed
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
