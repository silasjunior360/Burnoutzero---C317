import api from './api';

export const streamAIChat = async (message: string, sessionId: string, onChunk: (text: string) => void) => {
    const token = localStorage.getItem('access_token');
    const baseURL = api.defaults.baseURL || 'http://localhost:8000/api/';
    
    const response = await fetch(`${baseURL}ai/chat/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, session_id: sessionId })
    });

    if (!response.ok) {
        throw new Error('Erro na requisição');
    }

    if (!response.body) {
        throw new Error('Sem corpo de resposta');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = ''; 

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim() === '') continue; 
            
            if (line.startsWith('data: ')) {
                const dataStr = line.substring(6).trim(); 
                
                if (dataStr === '[DONE]') {
                    return; 
                }
                
                try {
                    const data = JSON.parse(dataStr);
                    if (data.chunk) {
                        onChunk(data.chunk);
                    }
                } catch (e) {
                    console.error('Erro ao fazer parse do JSON:', dataStr, e);
                }
            }
        }
    }
};