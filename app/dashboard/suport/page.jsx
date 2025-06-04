import ComingSoon from "@/components/coming-soon"

export default function SuportPage() {
  const plannedFeatures = [
    "Chat în timp real cu suportul",
    "Baza de cunoștințe (FAQ)",
    "Ticketing system pentru probleme",
    "Ghiduri pas cu pas",
    "Video tutorials",
    "Contact direct cu dezvoltatorii",
    "Raportare bug-uri",
    "Solicitări de funcționalități noi"
  ]

  return (
    <ComingSoon 
      title="Centrul de Suport"
      description="Portal complet de asistență și documentație pentru utilizatori"
      iconName="HelpCircle"
      expectedDate="Q2 2025"
      features={plannedFeatures}
    />
  )
}
