from django.contrib import admin
from .models import NewsArticle


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "published_at", "created_by", "created_at")
    list_filter = ("status", "published_at", "created_at")
    search_fields = ("title", "summary", "content", "created_by__username")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at", "updated_at")
