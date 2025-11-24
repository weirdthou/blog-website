from django.db import models
from core.utils import generate_unique_slug


class Tag(models.Model):
    name = models.CharField(max_length=50)
    slug = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, 'name')
        super().save(*args, **kwargs)

    class Meta:
        db_table = 'tags'
        ordering = ['name']

    def __str__(self):
        return self.name
