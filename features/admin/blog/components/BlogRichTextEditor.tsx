"use client"

import * as React from "react"
import { useEditor } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Underline } from "@tiptap/extension-underline"
import { TextAlign } from "@tiptap/extension-text-align"
import { Placeholder } from "@tiptap/extension-placeholder"
import { CharacterCount } from "@tiptap/extension-character-count"
import { RichTextEditor, Link } from "@/components/editor"
import { cn } from "@/lib/utils"

interface BlogRichTextEditorProps {
  value: string
  onChange: (value: string, wordCount: number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function BlogRichTextEditor({
  value,
  onChange,
  placeholder = "Compose your editorial article here...",
  className,
  disabled = false,
}: BlogRichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const words = ed.storage.characterCount.words()
      onChange(html, words)
    },
  })

  // Sync value if changed from outside (e.g. when editing an existing post)
  React.useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return (
      <div className="min-h-[300px] border border-border bg-muted/20 animate-pulse flex items-center justify-center text-xs text-muted-foreground uppercase tracking-wider">
        Loading editor...
      </div>
    )
  }

  return (
    <RichTextEditor
      editor={editor}
      className={cn("w-full transition-colors", className)}
    >
      <RichTextEditor.Toolbar sticky stickyOffset={0}>
        {/* Text Style Group */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
          <RichTextEditor.Code />
          <RichTextEditor.ClearFormatting />
        </RichTextEditor.ControlsGroup>

        {/* Heading Group */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
        </RichTextEditor.ControlsGroup>

        {/* Lists & Quotes */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
          <RichTextEditor.Blockquote />
          <RichTextEditor.Hr />
        </RichTextEditor.ControlsGroup>

        {/* Alignment */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.AlignLeft />
          <RichTextEditor.AlignCenter />
          <RichTextEditor.AlignRight />
          <RichTextEditor.AlignJustify />
        </RichTextEditor.ControlsGroup>

        {/* Links */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>

        {/* History */}
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Undo />
          <RichTextEditor.Redo />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      {/* Editor Content */}
      <RichTextEditor.Content className="focus:outline-none" />

      {/* Footer with Word Count */}
      <RichTextEditor.Footer
        showWordCount
        wordCountFormatter={({ words, characters }) => `${words} words · ${characters} characters`}
      />
    </RichTextEditor>
  )
}

