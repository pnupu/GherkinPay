import { ShieldCheck } from "lucide-react"

import { Badge } from "~/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip"

export function MpcBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-help gap-1 border-emerald-700/40 text-[10px] text-emerald-400"
        >
          <ShieldCheck className="size-3" />
          MPC Compatible
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          Compatible with MPC custody providers like Fireblocks, Fordefi, and
          other institutional wallets. Standard Solana signers — no protocol
          changes needed.
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
