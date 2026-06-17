// src/app/(dashboard)/cofrinho/page.tsx

import { Metadata } from "next";
import { CofrinhoClient } from "./CofrinhoClient";

export const metadata: Metadata = {
  title: "Cofrinho | FinPilot",
  description: "Registre e acompanhe seu hábito de guardar dinheiro com o Finn.",
};

export default function CofrinhoPage() {
  return <CofrinhoClient />;
}