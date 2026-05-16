import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Container,
	Divider,
	FormControlLabel,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Switch,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import ShieldIcon from '@mui/icons-material/Shield';
import api from '../services/api';
import { useThemeMode } from '../theme-context';

type ProfileForm = {
	username: string;
	firstName: string;
	lastName: string;
	email: string;
	avatar: string;
};

type PasswordForm = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};

const emptyProfile: ProfileForm = {
	username: '',
	firstName: '',
	lastName: '',
	email: '',
	avatar: '',
};

const emptyPassword: PasswordForm = {
	currentPassword: '',
	newPassword: '',
	confirmPassword: '',
};

const getFullName = (profile: ProfileForm) =>
	[profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
	profile.username ||
	profile.email ||
	'Usuário';

const getInitials = (profile: ProfileForm) => {
	const fullName = getFullName(profile);
	const initials = fullName
		.split(' ')
		.filter(Boolean)
		.map((part) => part[0])
		.join('')
		.slice(0, 2)
		.toUpperCase();

	return initials || 'U';
};

export default function Settings() {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const navigate = useNavigate();
	const muiTheme = useTheme();
	const { mode, toggleTheme } = useThemeMode();
	const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);
	const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPassword);
	const [loading, setLoading] = useState(true);
	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');
	const [errorMessage, setErrorMessage] = useState('');

	useEffect(() => {
		let active = true;

		const loadUser = async () => {
			try {
				const response = await api.get('/users/me/');
				if (!active) return;

				const data = response.data || {};
				setProfileForm({
					username: data.username || '',
					firstName: data.first_name || '',
					lastName: data.last_name || '',
					email: data.email || '',
					avatar: data.avatar || '',
				});
			} catch (error) {
				if (active) {
					const responseError = error as { response?: { status?: number } };
					if (responseError.response?.status === 401) {
						localStorage.removeItem('access_token');
						localStorage.removeItem('refresh_token');
						localStorage.removeItem('user_role');
						navigate('/login');
						return;
					}

					setErrorMessage('Não foi possível carregar seus dados agora. Verifique sua conexão e tente novamente.');
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		loadUser();

		return () => {
			active = false;
		};
	}, []);

	const updateProfileField = (field: keyof ProfileForm) => (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setProfileForm((current) => ({ ...current, [field]: event.target.value }));
	};

	const updatePasswordField = (field: keyof PasswordForm) => (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
	};

	const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			setProfileForm((current) => ({
				...current,
				avatar: typeof reader.result === 'string' ? reader.result : '',
			}));
		};
		reader.readAsDataURL(file);
	};

	const handleProfileSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setSavingProfile(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			await api.patch('/users/me/', {
				username: profileForm.username,
				first_name: profileForm.firstName,
				last_name: profileForm.lastName,
				email: profileForm.email,
				avatar: profileForm.avatar,
			});
			setSuccessMessage('Perfil atualizado com sucesso.');
		} catch {
			setErrorMessage('Não foi possível salvar as alterações do perfil.');
		} finally {
			setSavingProfile(false);
		}
	};

	const handlePasswordSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setErrorMessage('A confirmação da nova senha não confere.');
			return;
		}

		setSavingPassword(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			await api.post('/users/me/password/', {
				current_password: passwordForm.currentPassword,
				new_password: passwordForm.newPassword,
				confirm_password: passwordForm.confirmPassword,
			});

			setPasswordForm(emptyPassword);
			setSuccessMessage('Senha alterada com sucesso.');
		} catch (error) {
			const responseError = error as { response?: { data?: { error?: string } } };
			setErrorMessage(
				responseError.response?.data?.error || 'Não foi possível alterar a senha.'
			);
		} finally {
			setSavingPassword(false);
		}
	};

	const avatarLabel = getInitials(profileForm);

	if (loading) {
		return (
			<Box
				sx={{
					minHeight: 'calc(100vh - 140px)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: 'background.default',
				}}
			>
				<CircularProgress color="primary" />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				minHeight: 'calc(100vh - 140px)',
				py: { xs: 4, md: 6 },
					backgroundColor: muiTheme.palette.background.default,
			}}
		>
			<Container maxWidth="lg">
				<Stack spacing={1.5} sx={{ mb: 3 }}>
					<Chip
						label="Perfil do usuário"
						sx={{
							alignSelf: 'flex-start',
							bgcolor: alpha('#147DAC', 0.12),
							color: 'primary.main',
							fontWeight: 600,
						}}
					/>
					<Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
						Configurações da conta
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ maxWidth: 780 }}>
						Atualize sua foto, nome, e-mail e senha com a identidade visual do BurnoutZero.
					</Typography>
				</Stack>

				<Stack spacing={2} sx={{ mb: 3 }}>
					{successMessage && <Alert severity="success">{successMessage}</Alert>}
					{errorMessage && <Alert severity="error">{errorMessage}</Alert>}
				</Stack>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
						gap: 3,
					}}
				>
					<Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 4' } }}>
						<Card
							sx={{
								height: '100%',
								border: '1px solid',
								borderColor: alpha('#AE45AF', 0.12),
								backgroundColor: muiTheme.palette.background.paper,
							}}
						>
							<CardContent>
								<Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
									<Box
										sx={{
											position: 'relative',
											width: 144,
											height: 144,
										}}
									>
										<Avatar
											src={profileForm.avatar || undefined}
											sx={{
												width: 144,
												height: 144,
												bgcolor: 'primary.main',
												fontSize: 44,
												fontWeight: 700,
												boxShadow: '0 18px 40px rgba(20, 125, 172, 0.25)',
											}}
										>
											{avatarLabel}
										</Avatar>
										<IconButton
											onClick={() => fileInputRef.current?.click()}
											sx={{
												position: 'absolute',
												right: 8,
												bottom: 8,
												bgcolor: 'secondary.main',
												color: '#fff',
												'&:hover': { bgcolor: 'secondary.dark' },
											}}
										>
											<PhotoCameraIcon fontSize="small" />
										</IconButton>
									</Box>

									<Box>
										<Typography variant="h5" sx={{ fontWeight: 700 }}>
											{getFullName(profileForm)}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{profileForm.email || 'Seu e-mail aparecerá aqui'}
										</Typography>
									</Box>

									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										hidden
										onChange={handleAvatarSelect}
									/>

									<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
										<Chip label="Login seguro" color="primary" variant="outlined" />
										<Chip label="Tema BurnoutZero" color="secondary" variant="outlined" />
									</Stack>

									<Box sx={{ width: '100%' }}>
										<Divider sx={{ my: 1 }} />
										<Stack
											direction="row"
											alignItems="center"
											justifyContent="space-between"
											sx={{ width: '100%' }}
										>
											<Box sx={{ textAlign: 'left' }}>
												<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
													Tema do app
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Alterne entre claro e escuro.
												</Typography>
											</Box>
											<FormControlLabel
												control={
													<Switch checked={mode === 'dark'} onChange={toggleTheme} color="secondary" />
												}
												label={mode === 'dark' ? 'Escuro' : 'Claro'}
											/>
										</Stack>
									</Box>

									<Button
										fullWidth
										variant="outlined"
										onClick={() => fileInputRef.current?.click()}
										startIcon={<PhotoCameraIcon />}
										sx={{ borderRadius: 999, py: 1.2 }}
									>
										Trocar foto
									</Button>

									<Button
										fullWidth
										variant="text"
										color="inherit"
										onClick={() => setProfileForm((current) => ({ ...current, avatar: '' }))}
										sx={{ borderRadius: 999 }}
									>
										Remover foto
									</Button>
								</Stack>
							</CardContent>
						</Card>
					</Box>

					<Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 8' } }}>
						<Stack spacing={3}>
							<Card
								component="form"
								onSubmit={handleProfileSubmit}
								sx={{
									border: '1px solid',
									borderColor: alpha('#AE45AF', 0.12),
								}}
							>
								<CardContent>
									<Stack spacing={2.5}>
										<Box>
											<Typography variant="h5" sx={{ fontWeight: 700 }}>
												Dados do perfil
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Ajuste o que aparece para o resto da plataforma.
											</Typography>
										</Box>

										<Divider />

										<TextField
											label="Nome de usuário"
											value={profileForm.username}
											onChange={updateProfileField('username')}
											fullWidth
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<BadgeIcon color="action" />
													</InputAdornment>
												),
											}}
										/>

										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
												gap: 2,
											}}
										>
											<Box>
												<TextField
													label="Nome"
													value={profileForm.firstName}
													onChange={updateProfileField('firstName')}
													fullWidth
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<PersonIcon color="action" />
															</InputAdornment>
														),
													}}
												/>
											</Box>
											<Box>
												<TextField
													label="Sobrenome"
													value={profileForm.lastName}
													onChange={updateProfileField('lastName')}
													fullWidth
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<PersonIcon color="action" />
															</InputAdornment>
														),
													}}
												/>
											</Box>
										</Box>

										<TextField
											label="E-mail"
											type="email"
											value={profileForm.email}
											onChange={updateProfileField('email')}
											fullWidth
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<EmailIcon color="action" />
													</InputAdornment>
												),
											}}
										/>

										<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
											<Button
												type="submit"
												variant="contained"
												size="large"
												disabled={savingProfile}
												startIcon={<SaveIcon />}
												sx={{
													px: 3,
													background: 'linear-gradient(135deg, #147DAC 0%, #AE45AF 100%)',
												}}
											>
												{savingProfile ? 'Salvando...' : 'Salvar perfil'}
											</Button>
										</Stack>
									</Stack>
								</CardContent>
							</Card>

							<Card
								component="form"
								onSubmit={handlePasswordSubmit}
								sx={{
									border: '1px solid',
									borderColor: alpha('#147DAC', 0.12),
								}}
							>
								<CardContent>
									<Stack spacing={2.5}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
											<Avatar sx={{ bgcolor: alpha('#AE45AF', 0.16), color: 'secondary.main' }}>
												<ShieldIcon />
											</Avatar>
											<Box>
												<Typography variant="h5" sx={{ fontWeight: 700 }}>
													Segurança
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Troque sua senha quando precisar reforçar o acesso.
												</Typography>
											</Box>
										</Box>

										<Divider />

										<TextField
											label="Senha atual"
											type={showCurrentPassword ? 'text' : 'password'}
											value={passwordForm.currentPassword}
											onChange={updatePasswordField('currentPassword')}
											fullWidth
											required
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<LockIcon color="action" />
													</InputAdornment>
												),
												endAdornment: (
													<InputAdornment position="end">
														<IconButton onClick={() => setShowCurrentPassword((value) => !value)} edge="end">
															{showCurrentPassword ? <VisibilityOff /> : <Visibility />}
														</IconButton>
													</InputAdornment>
												),
											}}
										/>

										<Box
											sx={{
												display: 'grid',
												gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
												gap: 2,
											}}
										>
											<Box>
												<TextField
													label="Nova senha"
													type={showNewPassword ? 'text' : 'password'}
													value={passwordForm.newPassword}
													onChange={updatePasswordField('newPassword')}
													fullWidth
													required
													helperText="Use uma senha forte com pelo menos 6 caracteres."
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<LockIcon color="action" />
															</InputAdornment>
														),
														endAdornment: (
															<InputAdornment position="end">
																<IconButton onClick={() => setShowNewPassword((value) => !value)} edge="end">
																	{showNewPassword ? <VisibilityOff /> : <Visibility />}
																</IconButton>
															</InputAdornment>
														),
													}}
												/>
											</Box>
											<Box>
												<TextField
													label="Confirmar nova senha"
													type={showConfirmPassword ? 'text' : 'password'}
													value={passwordForm.confirmPassword}
													onChange={updatePasswordField('confirmPassword')}
													fullWidth
													required
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<LockIcon color="action" />
															</InputAdornment>
														),
														endAdornment: (
															<InputAdornment position="end">
																<IconButton onClick={() => setShowConfirmPassword((value) => !value)} edge="end">
																	{showConfirmPassword ? <VisibilityOff /> : <Visibility />}
																</IconButton>
															</InputAdornment>
														),
													}}
												/>
											</Box>
										</Box>

										<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end">
											<Button
												type="submit"
												variant="contained"
												color="secondary"
												size="large"
												disabled={savingPassword}
												sx={{ px: 3 }}
											>
												{savingPassword ? 'Alterando...' : 'Alterar senha'}
											</Button>
										</Stack>
									</Stack>
								</CardContent>
							</Card>
						</Stack>
					</Box>
				</Box>
			</Container>
		</Box>
	);
}
