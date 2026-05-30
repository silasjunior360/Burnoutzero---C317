import api from './api';

export const streamAIChat = (message: string) => {
    return api.post('/ai/chat/', { message }, { responseType: 'stream' });
};
