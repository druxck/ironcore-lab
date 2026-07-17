/**
 * Minimal, dependency-free markdown renderer for first-party lesson content
 * (headings, paragraphs, fenced code, lists, blockquotes, bold/italic/inline
 * code). Deliberately not a full CommonMark implementation — authored .md
 * files stick to this subset (see docs/content-authoring-guide.md) — and
 * builds plain React elements rather than dangerouslySetInnerHTML.
 */
export default function Markdown({ content }: { content: string }): JSX.Element {
  return <div className="flex flex-col gap-3">{parseBlocks(content)}</div>
}

function parseBlocks(content: string): JSX.Element[] {
  const lines = content.split(/\r?\n/)
  const elements: JSX.Element[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++
      elements.push(
        <pre
          key={key++}
          className="overflow-x-auto rounded border border-lab-wire bg-black/50 p-3 text-xs text-lab-phosphor"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length
      const text = line.replace(/^#{1,3}\s/, '')
      const Tag = (level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3') as 'h1' | 'h2' | 'h3'
      const sizeClass = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base'
      elements.push(
        <Tag key={key++} className={`glow-text-phosphor font-blueprint ${sizeClass} text-lab-phosphor`}>
          {inline(text)}
        </Tag>
      )
      i++
      continue
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={key++} className="ml-5 list-disc text-sm text-lab-phosphorDim">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (/^>\s/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s/, ''))
        i++
      }
      elements.push(
        <blockquote key={key++} className="border-l-2 border-lab-amber/50 pl-3 text-sm italic text-lab-amber/90">
          {quoteLines.map((l, idx) => (
            <p key={idx}>{inline(l)}</p>
          ))}
        </blockquote>
      )
      continue
    }

    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^>\s/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    elements.push(
      <p key={key++} className="text-sm leading-relaxed text-lab-phosphorDim">
        {inline(paraLines.join(' '))}
      </p>
    )
  }

  return elements
}

function inline(text: string): (string | JSX.Element)[] {
  const tokens: (string | JSX.Element)[] = []
  let remaining = text
  let key = 0
  const pattern = /(\*\*.+?\*\*|`.+?`|\*.+?\*)/

  while (remaining.length > 0) {
    const match = pattern.exec(remaining)
    if (!match) {
      tokens.push(remaining)
      break
    }
    if (match.index > 0) tokens.push(remaining.slice(0, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      tokens.push(
        <strong key={key++} className="text-lab-phosphor">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`')) {
      tokens.push(
        <code key={key++} className="rounded bg-black/50 px-1 text-lab-amber">
          {token.slice(1, -1)}
        </code>
      )
    } else {
      tokens.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }
    remaining = remaining.slice(match.index + token.length)
  }

  return tokens
}
