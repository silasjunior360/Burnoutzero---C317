// frontend/components/Footer.tsx
import { Box, Container, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        
        <Typography variant="body2" color="text.secondary" align="center">
          © 2026 Burnoutzero. Todos os direitos reservados.
        </Typography>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="center" 
          display="block" 
          sx={{ mt: 1 }}
        >
           Apoio e monitoramento de saúde mental
        </Typography>
      </Container>
    </Box>
  );
}