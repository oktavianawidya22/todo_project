from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),            # halaman frontend
    # API endpoints (pakai yang sudah ada)
    path('api/', views.list_todos),                 # GET list
    path('api/create/', views.create_todo),         # POST create
    path('api/<int:tid>/update/', views.update_todo),
    path('api/<int:tid>/delete/', views.delete_todo),
    path('api/import/', views.import_json),
    path('api/export/', views.export_json),
]
