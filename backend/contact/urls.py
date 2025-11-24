from django.urls import path
from . import views

urlpatterns = [
    path('', views.ContactAPIView.as_view(), name='contact_list_create'),
    path('submit/', views.ContactCreateView.as_view(), name='contact_submit'),
    path('submissions/', views.ContactSubmissionListView.as_view(),
         name='contact_submissions'),
    path('submissions/<int:pk>/',
         views.ContactSubmissionDetailView.as_view(), name='contact_detail'),
    path('submissions/<int:pk>/status/',
         views.UpdateSubmissionStatusView.as_view(), name='update_status'),
    path('submissions/<int:pk>/note/',
         views.AddSubmissionNoteView.as_view(), name='add_note'),
]
