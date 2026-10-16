"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FAQItem, DEFAULT_FAQS } from "../types"
import {
  HelpCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react"

interface FAQEditorSectionProps {
  faqs: FAQItem[]
  onChange: (faqs: FAQItem[]) => void
}

export function FAQEditorSection({ faqs = [], onChange }: FAQEditorSectionProps) {
  function handleAdd() {
    const newItem: FAQItem = {
      id: `faq_${Date.now()}`,
      question: "",
      answer: "",
    }
    onChange([...faqs, newItem])
  }

  function handleUpdate(index: number, field: "question" | "answer", value: string) {
    const next = [...faqs]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  function handleDelete(index: number) {
    const next = faqs.filter((_, i) => i !== index)
    onChange(next)
  }

  function handleMoveUp(index: number) {
    if (index <= 0) return
    const next = [...faqs]
    const temp = next[index]
    next[index] = next[index - 1]
    next[index - 1] = temp
    onChange(next)
  }

  function handleMoveDown(index: number) {
    if (index >= faqs.length - 1) return
    const next = [...faqs]
    const temp = next[index]
    next[index] = next[index + 1]
    next[index + 1] = temp
    onChange(next)
  }

  function handleResetDefaults() {
    onChange(DEFAULT_FAQS)
  }

  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-muted-foreground">
            <HelpCircle className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-sm font-semibold text-foreground">
                Frequently Asked Questions (FAQ)
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted text-muted-foreground">
                {faqs.length} {faqs.length === 1 ? "question" : "questions"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-relaxed">
              Manage the customer FAQ items displayed across the boutique storefront and contact page.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {faqs.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="h-8 px-2.5 text-xs font-sans rounded-none border-border hover:bg-muted text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="size-3" />
              <span>Load Defaults</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="h-8 px-3 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none border-border hover:bg-muted gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>Add Question</span>
          </Button>
        </div>
      </div>

      {/* FAQ Items List */}
      {faqs.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border p-6 bg-muted/20">
          <p className="text-xs font-sans text-muted-foreground">
            No FAQ questions configured. Click &ldquo;Add Question&rdquo; or load boutique defaults.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="h-8 px-3 text-xs font-sans rounded-none border-border hover:bg-muted gap-1.5"
            >
              <RotateCcw className="size-3" />
              <span>Load Boutique Defaults</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              className="h-8 px-3 text-xs font-sans rounded-none bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Add Question</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={faq.id || `faq_${index}`}
              className="border border-border bg-background/50 p-4 space-y-3 transition-colors hover:border-border/80"
            >
              {/* Item Header Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    Question {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    title="Move up"
                    className="size-7 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === faqs.length - 1}
                    onClick={() => handleMoveDown(index)}
                    title="Move down"
                    className="size-7 rounded-none text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                  <div className="w-px h-3.5 bg-border mx-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(index)}
                    title="Delete question"
                    className="size-7 rounded-none text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Question Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Question
                </label>
                <Input
                  value={faq.question}
                  onChange={(e) => handleUpdate(index, "question", e.target.value)}
                  placeholder="e.g. What are your delivery timeframes across the UAE?"
                  className="h-9 text-xs font-sans bg-background border-input rounded-none"
                />
              </div>

              {/* Answer Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-sans font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Answer
                </label>
                <Textarea
                  value={faq.answer}
                  onChange={(e) => handleUpdate(index, "answer", e.target.value)}
                  placeholder="Write clear, concise guidance for the customer..."
                  rows={3}
                  className="text-xs font-sans bg-background border-input rounded-none resize-y min-h-[70px] leading-relaxed"
                />
              </div>
            </div>
          ))}

          {/* Bottom Add Button */}
          <div className="pt-1 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="h-8 px-3 text-xs font-sans font-medium uppercase tracking-[0.08em] rounded-none border-border hover:bg-muted gap-1.5"
            >
              <Plus className="size-3.5" />
              <span>Add Another Question</span>
            </Button>

            <span className="text-[10px] font-sans text-muted-foreground">
              Questions are displayed in the exact order shown above
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
