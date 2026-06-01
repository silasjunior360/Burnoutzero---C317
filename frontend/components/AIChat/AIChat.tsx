import { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, TextField, Button, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageBubble from './MessageBubble';
// Lembre-se de verificar se o caminho de importação do aiApi bate com a sua estrutura de pastas!
import { streamAIChat } from '../../services/aiApi'; 

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIChatProps {
    onClose: () => void;
}

const AIChat = ({ onClose }: AIChatProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Olá! Como você está se sentindo hoje? Estou aqui para ouvir você.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cria um ID de sessão único nativo do navegador para manter o histórico da conversa
    const [sessionId] = useState(() => {
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Math.random().toString(36).substring(2, 15);
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        // Prepara um balão de assistente vazio que será preenchido aos poucos
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            // CORREÇÃO APLICADA: Passando 3 argumentos e tipando (chunk: string)
            await streamAIChat(userMsg, sessionId, (chunk: string) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsgIndex = newMessages.length - 1;
                    newMessages[lastMsgIndex] = {
                        ...newMessages[lastMsgIndex],
                        content: newMessages[lastMsgIndex].content + chunk
                    };
                    return newMessages;
                });
            });
        } catch {
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMsgIndex = newMessages.length - 1;
                newMessages[lastMsgIndex] = {
                    ...newMessages[lastMsgIndex],
                    content: newMessages[lastMsgIndex].content + '\n\n[Erro de conexão com o assistente.]'
                };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>IA</Avatar>
                    <Box>
                        <Typography variant="h6">Assistente de Acolhimento</Typography>
                        <Typography variant="caption" color="text.secondary">
                            IA de suporte emocional
                        </Typography>
                    </Box>
                </Box>
                <Button onClick={onClose}>Voltar</Button>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                {messages.map((msg, index) => (
                    <MessageBubble key={index} content={msg.content} isUser={msg.role === 'user'} />
                ))}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2, ml: 5 }}>
                        <CircularProgress size={20} />
                    </Box>
                )}
                <div ref={messagesEndRef} />
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField 
                    fullWidth 
                    placeholder="Digite sua mensagem..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                    size="small"
                />
                <Button 
                    variant="contained" 
                    endIcon={<SendIcon />}
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                >
                    Enviar
                </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                Lembre-se: este chat é um espaço de acolhimento e não substitui acompanhamento profissional.
            </Typography>
        </Paper>
    );
};

export default AIChat;