export function MessageContent({ content }) {
  // Simple markdown-like rendering for chat messages
  const formatMessage = (text) => {
    // Replace **bold** with <strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Replace *italic* with <em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Replace newlines with <br>
    text = text.replace(/\n/g, '<br>')
    
    // Replace bullet points
    text = text.replace(/^•\s/gm, '&bull; ')
    
    return text
  }

  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: formatMessage(content) }}
    />
  )
}
