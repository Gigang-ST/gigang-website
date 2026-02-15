"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import JoinForm from "@/components/join-form";

export default function JoinDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="w-full bg-white text-black hover:bg-white/90 text-base"
      >
        가입신청
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/20 bg-black text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">가입신청</DialogTitle>
            <DialogDescription className="text-white/60">
              아래 양식을 작성하여 가입을 신청해주세요.
            </DialogDescription>
          </DialogHeader>
          <JoinForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
