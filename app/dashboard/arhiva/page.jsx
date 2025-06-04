import ComingSoon from "@/components/coming-soon"

export default function ArhivaPage() {
  const plannedFeatures = [
    "Căutare avansată în arhivă",
    "Filtrare după perioada de arhivare",
    "Export documente arhivate",
    "Restaurare documente din arhivă",
    "Gestionare spațiu de stocare",
    "Programare automată arhivare"
  ]

  return (
    <ComingSoon 
      title="Arhiva Documentelor"
      description="Sistem complet de gestionare a documentelor arhivate"
      iconName="Archive"
      expectedDate="Q3 2025"
      features={plannedFeatures}
    />
  )
}
