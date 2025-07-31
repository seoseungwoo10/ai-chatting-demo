class ApiService {
  constructor() {
    // API 설정
    this.openaiKey = process.env.VUE_APP_OPENAI_API_KEY
    this.anthropicKey = process.env.VUE_APP_ANTHROPIC_API_KEY
    
    // 스트리밍 성능을 위해 직접 API 호출 사용 (CORS 해결됨)
    this.openaiEndpoint = process.env.VUE_APP_OPENAI_ENDPOINT || 'https://api.openai.com/v1/chat/completions'
    this.anthropicEndpoint = process.env.VUE_APP_ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1/messages'
    
    // 개발 환경에서도 직접 API 호출 (프록시 스트리밍 한계 극복)
    console.log('API Service initialized with direct endpoints for better streaming performance')
  }

  // OpenAI API 호출 (스트리밍)
  async streamOpenAIResponse(messages, model = 'gpt-4o-mini', onChunk) {
    try {
      const response = await fetch(this.openaiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          stream: true,
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') return

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI Streaming Error:', error)
      throw error
    }
  }

  // Anthropic API 호출 (스트리밍)
  async streamAnthropicResponse(messages, model = 'claude-3-5-haiku-20241022', onChunk) {
    try {
      // Anthropic 메시지 형식으로 변환
      const anthropicMessages = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))

      console.log('Anthropic API Request:', {
        endpoint: this.anthropicEndpoint,
        model: model,
        messagesCount: anthropicMessages.length,
        keyPrefix: this.anthropicKey ? this.anthropicKey.substring(0, 15) + '...' : 'Missing'
      })

      const response = await fetch(this.anthropicEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: model,
          messages: anthropicMessages,
          max_tokens: 2000,
          stream: true
        })
      })

      console.log('Anthropic API Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Anthropic API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText
        })
        throw new Error(`Anthropic API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            // 스트림 종료 확인
            if (data === '[DONE]') {
              break
            }
            
            try {
              const parsed = JSON.parse(data)
              
              // Anthropic API 응답 형식에 따라 처리
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text)
              } else if (parsed.type === 'content_block_start' && parsed.content_block?.text) {
                onChunk(parsed.content_block.text)
              } else if (parsed.delta?.text) {
                // 일반적인 텍스트 델타
                onChunk(parsed.delta.text)
              } else if (parsed.content) {
                // 일반적인 콘텐츠
                onChunk(parsed.content)
              }
            } catch (e) {
              console.warn('Failed to parse Anthropic response:', data, e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Anthropic Streaming Error:', error)
      throw error
    }
  }

  // 통합 API 호출 함수
  async streamResponse(messages, selectedModel, onChunk) {
    // 모델에 따라 적절한 API 호출
    if (selectedModel.startsWith('gpt-')) {
      return await this.streamOpenAIResponse(messages, selectedModel, onChunk)
    } else if (selectedModel.startsWith('claude-')) {
      return await this.streamAnthropicResponse(messages, selectedModel, onChunk)
    } else {
      throw new Error(`Unsupported model: ${selectedModel}`)
    }
  }

  // API 키 검증
  validateApiKeys() {
    const errors = []
    
    console.log('API Key Validation:')
    console.log('OpenAI Key:', this.openaiKey ? `${this.openaiKey.substring(0, 10)}...` : 'Missing')
    console.log('Anthropic Key:', this.anthropicKey ? `${this.anthropicKey.substring(0, 10)}...` : 'Missing')
    
    if (!this.openaiKey || !this.openaiKey.startsWith('sk-')) {
      errors.push('OpenAI API key is missing or invalid format')
    }
    
    if (!this.anthropicKey || !this.anthropicKey.startsWith('sk-ant-')) {
      errors.push('Anthropic API key is missing or invalid format')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export default new ApiService()
