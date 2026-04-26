from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, UserDetailView, AvaliacaoViewSet, AcompanhamentoViewSet, AgendamentoViewSet

router = DefaultRouter()
router.register(r'avaliacoes', AvaliacaoViewSet, basename='avaliacao')
router.register(r'acompanhamentos', AcompanhamentoViewSet, basename='acompanhamento')
router.register(r'agendamentos', AgendamentoViewSet, basename='agendamento')

urlpatterns = [
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('users/me/', UserDetailView.as_view(), name='user_me'),
    path('', include(router.urls)),
]
