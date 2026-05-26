"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { manualAddBook } from "@/actions/books";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SHELF_LABELS } from "@/lib/shelf-labels";
import type { ShelfValue } from "@/lib/validators";

export function ManualEntryDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [shelf, setShelf] = useState<ShelfValue>("WANT_TO_READ");

  function onSubmit(formData: FormData) {
    formData.set("shelf", shelf);
    startTransition(async () => {
      const res = await manualAddBook(formData);
      if (res.ok) {
        toast.success("Book added.");
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus className="mr-1 h-4 w-4" />
        Add manually
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a book manually</DialogTitle>
          <DialogDescription>
            For books that don&apos;t show up in the search.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-title">Title</Label>
            <Input id="manual-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-author">Author</Label>
            <Input id="manual-author" name="author" required />
          </div>
          <div className="space-y-2">
            <Label>Shelf</Label>
            <Select
              value={shelf}
              onValueChange={(v) => setShelf(v as ShelfValue)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SHELF_LABELS) as ShelfValue[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SHELF_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding..." : "Add book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
