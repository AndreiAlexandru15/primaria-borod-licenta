"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

export function LoginForm({
  className,
  ...props
}) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({      ...prev,
      [id]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/auth/login', {
        email: formData.email,
        parola: formData.password
      })

      if (response.status === 200) {
        // Login successful
        console.log('Login reușit:', response.data)
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Eroare login:', error)
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else if (error.response?.status === 401) {
        setError('Credențiale invalide')
      } else {
        setError('Eroare de conexiune. Încearcă din nou.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    (<div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 max-w-xl w-full mx-auto shadow-2xl scale-110 md:scale-125">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-8 md:p-12" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-4xl font-extrabold">Bine ai revenit</h1>
                <p className="text-muted-foreground text-balance">
                  Autentificare în contul E-Registratura
                </p>
              </div>
              
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>              <div className="grid gap-3">
                <Label htmlFor="password">Parolă</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Se autentifică...' : 'Autentificare'}
              </Button>

              <div className="text-center text-sm">
                © 2025 E-Registratura
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/logo.png"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" />
          </div>
        </CardContent>
      </Card>      <div
        className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Prin continuare, accepți <a href="#">Termenii și Condițiile</a>{" "}
        și <a href="#">Politica de Confidențialitate</a>.
      </div>
    </div>)
  );
}
