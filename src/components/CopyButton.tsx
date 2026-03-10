import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  className?: string
  label?: string
}

export function CopyButton({ text, className, label }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        className
      )}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  )
}
