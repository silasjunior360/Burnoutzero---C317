import { Box, Paper, Typography, Avatar } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
    content: string;
    isUser: boolean;
}

const MessageBubble = ({ content, isUser }: MessageBubbleProps) => {
    return (
        <Box sx={{ display: 'flex', mb: 2, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            {!isUser && (
                <Avatar sx={{ bgcolor: 'primary.main', mr: 1, width: 32, height: 32 }}>IA</Avatar>
            )}
            <Paper 
                sx={{ 
                    p: 2, 
                    maxWidth: '80%', 
                    bgcolor: isUser ? 'grey.200' : 'primary.light', 
                    color: isUser ? 'text.primary' : 'white',
                    borderRadius: 2
                }}
            >
                {isUser ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {content}
                    </Typography>
                ) : (
                    <Box 
                        sx={{ 
                            '& p': { margin: 0, marginBottom: 1, fontSize: '0.875rem', fontFamily: '"Roboto","Helvetica","Arial",sans-serif' },
                            '& strong': { fontWeight: 'bold' },
                            '& ul, & ol': { marginTop: 0.5, marginBottom: 1, paddingLeft: 2.5 },
                            '& li': { fontSize: '0.875rem', fontFamily: '"Roboto","Helvetica","Arial",sans-serif', marginBottom: 0.5 },
                            whiteSpace: 'pre-wrap' 
                        }}
                    >
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default MessageBubble;