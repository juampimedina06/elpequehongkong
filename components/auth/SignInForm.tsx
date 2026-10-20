'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { signInAction } from '@/actions/auth/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SignInFormProps {
  redirectTo?: string
}

export function SignInForm({ redirectTo = '/admin' }: SignInFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const formData = new FormData(event.currentTarget)
    formData.set('redirectTo', redirectTo)

    startTransition(async () => {
      const result = await signInAction(formData)
      if (!result.success) {
        setErrorMessage(result.error)
        toast.error(result.error)
        return
      }

      toast.success('Sesión iniciada correctamente')
      router.push(result.data.redirectTo)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-1.5">
        <label
          htmlFor="admin-email"
          className="block text-xs font-medium text-zinc-700"
        >
          Correo electrónico
        </label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="admin@elpequehongkong.com"
          disabled={isPending}
          className="bg-white border-zinc-200 text-zinc-900"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="admin-password"
          className="block text-xs font-medium text-zinc-700"
        >
          Contraseña
        </label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={isPending}
          className="bg-white border-zinc-200 text-zinc-900"
        />
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {errorMessage}
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-zinc-900 text-white hover:bg-zinc-800"
      >
        {isPending ? 'Verificando acceso...' : 'Ingresar al Panel'}
      </Button>
    </form>
  )
}
