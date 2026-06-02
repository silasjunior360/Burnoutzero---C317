from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView
)
from .views import (
    InsightViewSet, RegisterView, UserDetailView,
    AssessmentViewSet, FollowUpViewSet,
    AppointmentViewSet,
    SectorViewSet,
    validate_insight, team_overview, my_points,
    gamification_me, award_gamification_points,
    UserPasswordChangeView
)

router = DefaultRouter()
router.register(
    r'assessments', AssessmentViewSet, basename='assessment'
)
router.register(
    r'follow-ups', FollowUpViewSet,
    basename='follow-up'
)
router.register(
    r'appointments', AppointmentViewSet,
    basename='appointment'
)
router.register(r'insights', InsightViewSet, basename='insight')
router.register(r'manager/sectors', SectorViewSet, basename='manager-sectors')

urlpatterns = [
    path(
        'auth/login/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),
    path(
        'auth/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path(
        'auth/register/',
        RegisterView.as_view(),
        name='auth_register'
    ),
    path(
        'users/me/',
        UserDetailView.as_view(),
        name='user_me'
    ),
    path(
        'users/me/password/',
        UserPasswordChangeView.as_view(),
        name='user_password_change'
    ),
    path('', include(router.urls)),
    path('insights/<int:pk>/validate/', validate_insight, name='validate_insight'),
    path('manager/team-overview/', team_overview, name='team_overview'),
    path('gamification/my-points/', my_points, name='my_points'),
    path('gamification/me/', gamification_me, name='gamification_me'),
    path('gamification/me/award/', award_gamification_points, name='gamification_award'),
]
