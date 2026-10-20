'use client'

import { useTransition } from 'react'
import { signOutAction } from '@/actions/auth/auth'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleLogout}
      className={className ?? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'}
    >
      {isPending ? 'Saliendo...' : 'Cerrar sesión'}
    </Button>
  )
}
