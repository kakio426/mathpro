"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CopyShareLinkButtonProps = {
  shareUrl: string;
  copyText?: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
};

export function CopyShareLinkButton({
  shareUrl,
  copyText = shareUrl,
  label = "학생 링크 복사",
  copiedLabel = "복사 완료",
  className,
}: CopyShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard?.writeText(copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button className={className} type="button" variant="secondary" onClick={handleCopy}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}
