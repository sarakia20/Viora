'use client'

import { useState, useTransition } from 'react'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function DeleteDialog({
  id,
  action,
  callbackAction,
}: {
  id: string
  action: (id: string) => Promise<{ success: boolean; message: string }>
  callbackAction?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size='sm' variant='outline'>
          حذف
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent dir='rtl'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            آیا از حذف این مورد مطمئن هستید؟
          </AlertDialogTitle>

          <AlertDialogDescription>
            این عملیات قابل بازگشت نیست.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            انصراف
          </AlertDialogCancel>

          <Button
            variant='destructive'
            size='sm'
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await action(id)

                if (!res.success) {
                  toast({
                    variant: 'destructive',
                    description: res.message,
                  })
                } else {
                  setOpen(false)

                  toast({
                    description: res.message,
                  })

                  if (callbackAction) callbackAction()
                }
              })
            }
          >
            {isPending ? 'در حال حذف...' : 'حذف'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
