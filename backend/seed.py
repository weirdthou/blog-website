#!/usr/bin/env python
"""
Comprehensive database seeding script for Blog Website
Handles migrations and creates realistic seed data for all models
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.management import call_command
import random

# Django setup
if not os.environ.get('DJANGO_SETTINGS_MODULE'):
    os.environ['DJANGO_SETTINGS_MODULE'] = 'blog_backend.settings'

# Ensure logs directory exists
logs_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(logs_dir, exist_ok=True)

django.setup()

# Import models after Django setup
from users.models import User
from categories.models import Category
from tags.models import Tag
from articles.models import Article, ArticleLike, BookmarkedArticle
from comments.models import Comment, CommentLike, CommentFlag
from contact.models import Contact
from subscribers.models import Subscriber


class DatabaseSeeder:
    """Handles database migration and seeding"""
    
    def __init__(self, reset=False):
        self.reset = reset
        self.users = []
        self.categories = []
        self.tags = []
        self.articles = []
        
    def run(self):
        """Execute the full seeding process"""
        print("=" * 60)
        print("Blog Website Database Seeder")
        print("=" * 60)
        
        if self.reset:
            self.reset_database()
        
        self.run_migrations()
        self.seed_users()
        self.seed_categories()
        self.seed_tags()
        # self.seed_articles()
        # self.seed_article_engagement()
        # self.seed_comments()
        # self.seed_comment_engagement()
        # self.seed_contacts()
        # self.seed_subscribers()
        
        print("\n" + "=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        self.print_summary()
    
    def reset_database(self):
        """Delete and recreate the database"""
        print("\n[RESET] Deleting existing database...")
        db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')
        if os.path.exists(db_path):
            os.remove(db_path)
            print("✓ Database deleted")
    
    def run_migrations(self):
        """Run Django migrations"""
        print("\n[MIGRATE] Running database migrations...")
        call_command('makemigrations', interactive=False)
        call_command('migrate', interactive=False)
        print("✓ Migrations completed")
    
    def seed_users(self):
        """Create admin user only"""
        print("\n[SEED] Creating admin user...")
        
        # Create superuser/admin
        admin, created = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'name': 'Admin User',
                'role': 'admin',
                'bio': 'System administrator and chief editor',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        if created:
            admin.set_password('admin1234')
            admin.save()
            print(f"  ✓ Created admin: {admin.email}")
        else:
            # Update existing admin to ensure correct password
            admin.set_password('admin1234')
            admin.is_staff = True
            admin.is_superuser = True
            admin.is_active = True
            admin.role = 'admin'
            admin.save()
            print(f"  ✓ Updated admin: {admin.email}")
        self.users.append(admin)
        
        print(f"  Total users: {len(self.users)}")
    
    def seed_categories(self):
        """Create popular categories only"""
        print("\n[SEED] Creating popular categories...")
        
        category_data = [
            {'name': 'Politics', 'description': 'Political news, analysis, and current affairs', 'parent': None},
            {'name': 'Entertainment', 'description': 'Movies, music, TV shows, and celebrity news', 'parent': None},
            {'name': 'Sports', 'description': 'Sports news, scores, and athlete updates', 'parent': None},
            {'name': 'Business', 'description': 'Business news, finance, and economics', 'parent': None},
            {'name': 'Lifestyle', 'description': 'Health, wellness, travel, and lifestyle trends', 'parent': None},
            {'name': 'Opinion', 'description': 'Editorial content and opinion pieces', 'parent': None},
        ]
        
        # First pass: create all categories
        category_map = {}
        for data in category_data:
            cat, created = Category.objects.get_or_create(
                name=data['name'],
                defaults={'description': data['description']}
            )
            category_map[data['name']] = cat
            self.categories.append(cat)
            if created:
                print(f"  ✓ Created category: {cat.name}")
        
        # Second pass: set parent relationships
        for data in category_data:
            if data['parent']:
                cat = category_map[data['name']]
                cat.parent = category_map[data['parent']]
                cat.save()
        
        print(f"  Total categories: {len(self.categories)}")
    
    def seed_tags(self):
        """Create popular tags only"""
        print("\n[SEED] Creating popular tags...")
        
        tag_names = [
            'Breaking News', 'World News', 'Local News', 'Election', 'Government',
            'Movies', 'Music', 'TV Shows', 'Celebrity', 'Culture',
            'Football', 'Basketball', 'Baseball', 'Soccer', 'Olympics',
            'Finance', 'Economy', 'Stock Market', 'Cryptocurrency',
            'Health', 'Travel', 'Food', 'Fashion', 'Wellness',
            'Editorial', 'Analysis', 'Commentary', 'Interview',
        ]
        
        for name in tag_names:
            tag, created = Tag.objects.get_or_create(
                name=name,
                defaults={'description': f'Articles related to {name}'}
            )
            self.tags.append(tag)
            if created:
                print(f"  ✓ Created tag: {tag.name}")
        
        print(f"  Total tags: {len(self.tags)}")
    
    def seed_articles(self):
        """Create articles with varied content"""
        print("\n[SEED] Creating articles...")
        
        article_data = [
            {
                'title': 'Getting Started with Django: A Comprehensive Guide',
                'excerpt': 'Learn the fundamentals of Django web framework and build your first web application',
                'content': '<h2>Introduction to Django</h2><p>Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. Built by experienced developers, it takes care of much of the hassle of web development, so you can focus on writing your app without needing to reinvent the wheel.</p><h2>Why Choose Django?</h2><p>Django follows the model-template-views architectural pattern. It emphasizes reusability and "pluggability" of components, less code, low coupling, rapid development, and the principle of don\'t repeat yourself.</p><h2>Setting Up Your Environment</h2><p>First, install Django using pip: <code>pip install django</code>. Then create a new project with <code>django-admin startproject myproject</code>.</p>',
                'status': 'published',
                'featured': True,
                'categories': ['Programming', 'Web Development'],
                'tags': ['Django', 'Python', 'Backend', 'Tutorial', 'Beginner'],
                'views': 1250,
            },
            {
                'title': 'React Hooks: Modern State Management',
                'excerpt': 'Master React Hooks and learn how to manage state effectively in functional components',
                'content': '<h2>Understanding React Hooks</h2><p>React Hooks revolutionized how we write React components. They let you use state and other React features without writing a class component.</p><h2>useState Hook</h2><p>The useState hook allows you to add state to functional components. Example: <code>const [count, setCount] = useState(0);</code></p><h2>useEffect Hook</h2><p>The useEffect hook lets you perform side effects in functional components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount in React classes.</p>',
                'status': 'published',
                'featured': True,
                'categories': ['Programming', 'Web Development'],
                'tags': ['React', 'JavaScript', 'Frontend', 'Tutorial', 'Advanced'],
                'views': 980,
            },
            {
                'title': 'Docker for Beginners: Containerization Made Easy',
                'excerpt': 'A practical introduction to Docker and containerization for modern application deployment',
                'content': '<h2>What is Docker?</h2><p>Docker is a platform for developing, shipping, and running applications in containers. Containers allow you to package an application with all its dependencies into a standardized unit.</p><h2>Benefits of Containerization</h2><p>Containers are lightweight, portable, and ensure consistency across different environments. They solve the "it works on my machine" problem.</p><h2>Your First Docker Container</h2><p>Create a Dockerfile, build an image with <code>docker build</code>, and run it with <code>docker run</code>.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['DevOps', 'Technology'],
                'tags': ['Docker', 'DevOps', 'CI/CD', 'Tutorial', 'Beginner'],
                'views': 750,
            },
            {
                'title': 'TypeScript: JavaScript with Superpowers',
                'excerpt': 'Discover how TypeScript adds static typing to JavaScript and improves code quality',
                'content': '<h2>Why TypeScript?</h2><p>TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.</p><h2>Type Safety Benefits</h2><p>TypeScript catches errors at compile time rather than runtime, making your code more robust and maintainable.</p><h2>Getting Started</h2><p>Install TypeScript with <code>npm install -g typescript</code> and compile your first .ts file with <code>tsc filename.ts</code>.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Programming', 'Web Development'],
                'tags': ['TypeScript', 'JavaScript', 'Full Stack', 'Best Practices'],
                'views': 620,
            },
            {
                'title': 'Building RESTful APIs with FastAPI',
                'excerpt': 'Learn how to create high-performance APIs using FastAPI and Python',
                'content': '<h2>Introduction to FastAPI</h2><p>FastAPI is a modern, fast web framework for building APIs with Python 3.7+ based on standard Python type hints.</p><h2>Key Features</h2><p>FastAPI offers automatic API documentation, data validation, async support, and incredible performance.</p><h2>Your First API</h2><p>Create a simple API endpoint: <code>@app.get("/") def read_root(): return {"Hello": "World"}</code></p>',
                'status': 'published',
                'featured': False,
                'categories': ['Programming'],
                'tags': ['FastAPI', 'Python', 'API', 'Backend', 'Tutorial'],
                'views': 540,
            },
            {
                'title': 'CSS Grid vs Flexbox: When to Use Which',
                'excerpt': 'Understand the differences between CSS Grid and Flexbox and make informed layout decisions',
                'content': '<h2>Understanding CSS Layouts</h2><p>Both Grid and Flexbox are powerful layout systems, but they serve different purposes.</p><h2>Flexbox for One-Dimensional Layouts</h2><p>Use Flexbox when you need to layout items in a single direction - either row or column.</p><h2>Grid for Two-Dimensional Layouts</h2><p>Use Grid when you need to control layout in both rows and columns simultaneously.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Web Development', 'Design'],
                'tags': ['Frontend', 'Best Practices', 'Tutorial'],
                'views': 890,
            },
            {
                'title': 'Kubernetes Essentials: Orchestrating Containers at Scale',
                'excerpt': 'Master container orchestration with Kubernetes for production deployments',
                'content': '<h2>What is Kubernetes?</h2><p>Kubernetes is an open-source container orchestration platform that automates deployment, scaling, and management of containerized applications.</p><h2>Core Concepts</h2><p>Learn about Pods, Services, Deployments, and other Kubernetes resources.</p><h2>Getting Started</h2><p>Set up a local Kubernetes cluster with Minikube and deploy your first application.</p>',
                'status': 'published',
                'featured': True,
                'categories': ['DevOps', 'Technology'],
                'tags': ['Kubernetes', 'Docker', 'DevOps', 'Advanced', 'Tutorial'],
                'views': 1100,
            },
            {
                'title': 'Machine Learning with Python: A Practical Introduction',
                'excerpt': 'Get started with machine learning using Python and popular libraries like scikit-learn',
                'content': '<h2>Introduction to ML</h2><p>Machine learning enables computers to learn from data and make predictions without being explicitly programmed.</p><h2>Essential Libraries</h2><p>Learn about NumPy, Pandas, Matplotlib, and scikit-learn - the foundation of ML in Python.</p><h2>Your First Model</h2><p>Train a simple linear regression model and make predictions on new data.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Technology'],
                'tags': ['Machine Learning', 'Python', 'Data Science', 'AI', 'Tutorial'],
                'views': 670,
            },
            {
                'title': 'Modern JavaScript: ES6+ Features You Should Know',
                'excerpt': 'Explore the latest JavaScript features that make your code cleaner and more powerful',
                'content': '<h2>ES6+ Overview</h2><p>ECMAScript 6 and beyond introduced many features that modernize JavaScript development.</p><h2>Arrow Functions</h2><p>Arrow functions provide a shorter syntax and lexical this binding.</p><h2>Destructuring and Spread</h2><p>Destructuring allows you to unpack values from arrays or properties from objects into distinct variables.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Programming', 'Web Development'],
                'tags': ['JavaScript', 'Frontend', 'Best Practices', 'Tutorial'],
                'views': 780,
            },
            {
                'title': 'PostgreSQL vs MongoDB: Choosing the Right Database',
                'excerpt': 'Compare SQL and NoSQL databases to make the best choice for your application',
                'content': '<h2>Database Paradigms</h2><p>SQL databases like PostgreSQL offer ACID compliance and structured data, while NoSQL databases like MongoDB provide flexibility and scalability.</p><h2>When to Use PostgreSQL</h2><p>Choose PostgreSQL for complex queries, transactions, and relational data.</p><h2>When to Use MongoDB</h2><p>MongoDB excels with unstructured data, rapid prototyping, and horizontal scaling.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Technology', 'Programming'],
                'tags': ['Database', 'PostgreSQL', 'MongoDB', 'Backend', 'Best Practices'],
                'views': 820,
            },
            {
                'title': 'Vue.js 3: The Progressive Framework',
                'excerpt': 'Discover Vue.js 3 and its composition API for building interactive user interfaces',
                'content': '<h2>Why Vue.js?</h2><p>Vue.js is an approachable, versatile, and performant framework for building web user interfaces.</p><h2>Composition API</h2><p>Vue 3 introduces the Composition API, offering better code organization and reusability.</p><h2>Creating Your First App</h2><p>Set up a Vue project with Vite and create reactive components.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Programming', 'Web Development'],
                'tags': ['Vue.js', 'JavaScript', 'Frontend', 'Tutorial', 'Beginner'],
                'views': 590,
            },
            {
                'title': 'API Security Best Practices',
                'excerpt': 'Essential security measures to protect your APIs from common vulnerabilities',
                'content': '<h2>Securing Your APIs</h2><p>API security is critical for protecting sensitive data and preventing unauthorized access.</p><h2>Authentication & Authorization</h2><p>Implement JWT tokens, OAuth 2.0, and proper access controls.</p><h2>Rate Limiting and Validation</h2><p>Protect against DDoS attacks and injection vulnerabilities with proper input validation.</p>',
                'status': 'published',
                'featured': True,
                'categories': ['Technology', 'Programming'],
                'tags': ['Security', 'API', 'REST', 'Best Practices', 'Advanced'],
                'views': 950,
            },
            {
                'title': 'GraphQL: A Better Way to Build APIs',
                'excerpt': 'Learn how GraphQL solves common REST API problems with flexible queries',
                'content': '<h2>What is GraphQL?</h2><p>GraphQL is a query language for APIs that gives clients the power to request exactly what they need.</p><h2>Advantages Over REST</h2><p>No over-fetching or under-fetching, strongly typed schema, and single endpoint.</p><h2>Building Your First GraphQL API</h2><p>Define schemas, resolvers, and queries for a production-ready API.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Programming', 'Web Development'],
                'tags': ['GraphQL', 'API', 'Backend', 'Tutorial', 'Advanced'],
                'views': 710,
            },
            {
                'title': 'Testing in JavaScript: Jest and Testing Library',
                'excerpt': 'Write better tests for your JavaScript applications with modern testing tools',
                'content': '<h2>Importance of Testing</h2><p>Testing ensures code quality, prevents regressions, and documents your codebase.</p><h2>Jest Framework</h2><p>Jest is a delightful JavaScript testing framework with a focus on simplicity.</p><h2>Testing React Components</h2><p>Use React Testing Library to test components from a user perspective.</p>',
                'status': 'published',
                'featured': False,
                'categories': ['Programming'],
                'tags': ['Testing', 'JavaScript', 'React', 'Best Practices', 'Tutorial'],
                'views': 640,
            },
            {
                'title': 'Next.js: The React Framework for Production',
                'excerpt': 'Build production-ready React applications with Next.js server-side rendering',
                'content': '<h2>Introduction to Next.js</h2><p>Next.js is a React framework that enables server-side rendering, static site generation, and more.</p><h2>Key Features</h2><p>File-based routing, API routes, image optimization, and automatic code splitting.</p><h2>Your First Next.js App</h2><p>Create a new project with <code>npx create-next-app</code> and explore the pages directory.</p>',
                'status': 'published',
                'featured': True,
                'categories': ['Programming', 'Web Development'],
                'tags': ['Next.js', 'React', 'Full Stack', 'Tutorial', 'Advanced'],
                'views': 1050,
            },
            {
                'title': 'Draft: Future of Web Development',
                'excerpt': 'Exploring upcoming trends in web development (draft)',
                'content': '<p>This article is still being written...</p>',
                'status': 'draft',
                'featured': False,
                'categories': ['Technology'],
                'tags': ['Frontend', 'Backend'],
                'views': 0,
            },
        ]
        
        for i, data in enumerate(article_data):
            # Assign author (rotate through users)
            author = self.users[i % len(self.users)]
            
            # Create article
            article, created = Article.objects.get_or_create(
                title=data['title'],
                defaults={
                    'excerpt': data['excerpt'],
                    'content': data['content'],
                    'status': data['status'],
                    'featured': data['featured'],
                    'author': author,
                    'views': data['views'],
                }
            )
            
            if created:
                # Set publish date for published articles
                if article.status == 'published':
                    days_ago = random.randint(1, 90)
                    article.publish_date = timezone.now() - timedelta(days=days_ago)
                    article.save()
                
                # Add categories
                for cat_name in data['categories']:
                    cat = Category.objects.filter(name=cat_name).first()
                    if cat:
                        article.categories.add(cat)
                
                # Add tags
                for tag_name in data['tags']:
                    tag = Tag.objects.filter(name=tag_name).first()
                    if tag:
                        article.tags.add(tag)
                
                print(f"  ✓ Created article: {article.title[:50]}...")
            
            self.articles.append(article)
        
        print(f"  Total articles: {len(self.articles)}")
    
    def seed_article_engagement(self):
        """Create likes and bookmarks for articles"""
        print("\n[SEED] Creating article engagement (likes, bookmarks)...")
        
        published_articles = [a for a in self.articles if a.status == 'published']
        likes_count = 0
        bookmarks_count = 0
        
        for article in published_articles:
            # Each article gets 3-8 likes/dislikes from random users
            num_reactions = random.randint(3, 8)
            reactor_users = random.sample(self.users, min(num_reactions, len(self.users)))
            
            for user in reactor_users:
                if user != article.author:  # Don't let authors like their own articles
                    is_like = random.random() > 0.15  # 85% likes, 15% dislikes
                    ArticleLike.objects.get_or_create(
                        user=user,
                        article=article,
                        defaults={'is_like': is_like}
                    )
                    likes_count += 1
            
            # Each article gets 2-5 bookmarks
            num_bookmarks = random.randint(2, 5)
            bookmark_users = random.sample(self.users, min(num_bookmarks, len(self.users)))
            
            for user in bookmark_users:
                BookmarkedArticle.objects.get_or_create(
                    user=user,
                    article=article
                )
                bookmarks_count += 1
        
        print(f"  ✓ Created {likes_count} article reactions")
        print(f"  ✓ Created {bookmarks_count} bookmarks")
    
    def seed_comments(self):
        """Create comments on articles"""
        print("\n[SEED] Creating comments...")
        
        published_articles = [a for a in self.articles if a.status == 'published']
        comments_count = 0
        
        comment_templates = [
            "Great article! Very informative and well-written.",
            "Thanks for sharing this. It really helped me understand {topic} better.",
            "I've been looking for a tutorial like this. Excellent work!",
            "This is exactly what I needed. Clear and concise explanation.",
            "Really helpful article. Can you write more about {topic}?",
            "I disagree with some points here. I think {topic} is better approached differently.",
            "As a beginner, this was perfect for me. Thank you!",
            "Awesome post! I learned a lot from this.",
            "Could you elaborate more on the {topic} section?",
            "This is a comprehensive guide. Bookmarking for future reference!",
        ]
        
        for article in published_articles:
            # Each article gets 3-10 comments
            num_comments = random.randint(3, 10)
            
            for _ in range(num_comments):
                user = random.choice(self.users)
                template = random.choice(comment_templates)
                content = template.replace('{topic}', article.title.split(':')[0])
                
                comment, created = Comment.objects.get_or_create(
                    article=article,
                    user=user,
                    content=content,
                    defaults={
                        'status': 'approved',
                        'created_at': timezone.now() - timedelta(days=random.randint(1, 60))
                    }
                )
                
                if created:
                    comments_count += 1
                    
                    # 30% chance of having a reply
                    if random.random() < 0.3:
                        reply_user = random.choice([u for u in self.users if u != user])
                        Comment.objects.create(
                            article=article,
                            user=reply_user,
                            content=f"Thanks for your feedback! I'm glad it was helpful.",
                            status='approved',
                            parent=comment,
                            created_at=comment.created_at + timedelta(hours=random.randint(1, 48))
                        )
                        comments_count += 1
        
        print(f"  ✓ Created {comments_count} comments (including replies)")
    
    def seed_comment_engagement(self):
        """Create likes and flags for comments"""
        print("\n[SEED] Creating comment engagement (likes, flags)...")
        
        comments = Comment.objects.filter(parent__isnull=True)  # Top-level comments
        likes_count = 0
        flags_count = 0
        
        for comment in comments:
            # Each comment gets 1-5 likes/dislikes
            num_reactions = random.randint(1, 5)
            reactor_users = random.sample(self.users, min(num_reactions, len(self.users)))
            
            for user in reactor_users:
                if user != comment.user:
                    is_like = random.random() > 0.2  # 80% likes, 20% dislikes
                    CommentLike.objects.get_or_create(
                        comment=comment,
                        user=user,
                        defaults={'is_like': is_like}
                    )
                    likes_count += 1
            
            # 5% chance of being flagged
            if random.random() < 0.05:
                flagger = random.choice([u for u in self.users if u != comment.user])
                reasons = ['spam', 'inappropriate', 'other']
                CommentFlag.objects.get_or_create(
                    comment=comment,
                    user=flagger,
                    defaults={
                        'reason': random.choice(reasons),
                        'description': 'This comment seems inappropriate.'
                    }
                )
                flags_count += 1
        
        print(f"  ✓ Created {likes_count} comment reactions")
        print(f"  ✓ Created {flags_count} comment flags")
    
    def seed_contacts(self):
        """Create contact form submissions"""
        print("\n[SEED] Creating contact submissions...")
        
        contact_data = [
            {
                'name': 'Alex Thompson',
                'email': 'alex.t@example.com',
                'subject': 'Question about Django tutorial',
                'message': 'Hi, I followed your Django tutorial but got stuck on the models section. Can you help?',
                'status': 'resolved',
                'newsletter': True,
            },
            {
                'name': 'Maria Garcia',
                'email': 'maria.g@example.com',
                'subject': 'Partnership Opportunity',
                'message': 'I represent a tech company interested in advertising opportunities on your blog.',
                'status': 'in-progress',
                'newsletter': False,
            },
            {
                'name': 'Robert Chen',
                'email': 'robert.c@example.com',
                'subject': 'Guest Post Proposal',
                'message': 'I would like to contribute a guest post about cloud architecture. Are you accepting submissions?',
                'status': 'new',
                'newsletter': True,
            },
            {
                'name': 'Emma Wilson',
                'email': 'emma.w@example.com',
                'subject': 'Technical Error on Website',
                'message': 'I noticed a broken link on the React Hooks article. Thought you should know.',
                'status': 'resolved',
                'newsletter': False,
            },
            {
                'name': 'James Lee',
                'email': 'james.l@example.com',
                'subject': 'Request for Tutorial',
                'message': 'Could you create a tutorial on microservices architecture? I think it would be very valuable.',
                'status': 'new',
                'newsletter': True,
            },
        ]
        
        contacts_count = 0
        for data in contact_data:
            contact, created = Contact.objects.get_or_create(
                email=data['email'],
                subject=data['subject'],
                defaults={
                    'name': data['name'],
                    'message': data['message'],
                    'status': data['status'],
                    'newsletter': data['newsletter'],
                    'assigned_to': self.users[0] if data['status'] != 'new' else None,
                }
            )
            if created:
                contacts_count += 1
                print(f"  ✓ Created contact: {contact.subject[:40]}...")
        
        print(f"  Total contacts: {contacts_count}")
    
    def seed_subscribers(self):
        """Create newsletter subscribers"""
        print("\n[SEED] Creating subscribers...")
        
        subscriber_emails = [
            'subscriber1@example.com',
            'subscriber2@example.com',
            'subscriber3@example.com',
            'newsletter.fan@example.com',
            'techreader@example.com',
            'developer123@example.com',
            'codeenthusiast@example.com',
            'unsubscribed.user@example.com',
        ]
        
        subscribers_count = 0
        for i, email in enumerate(subscriber_emails):
            status = 'unsubscribed' if 'unsubscribed' in email else 'active'
            subscriber, created = Subscriber.objects.get_or_create(
                email=email,
                defaults={
                    'name': f'Subscriber {i+1}',
                    'status': status,
                }
            )
            if created:
                subscribers_count += 1
                print(f"  ✓ Created subscriber: {subscriber.email}")
        
        print(f"  Total subscribers: {subscribers_count}")
    
    def print_summary(self):
        """Print database statistics"""
        print("\nDatabase Statistics:")
        print(f"  Users:              {User.objects.count()}")
        print(f"    - Admins:         {User.objects.filter(role='admin').count()}")
        print(f"    - Regular users:  {User.objects.filter(role='user').count()}")
        print(f"  Categories:         {Category.objects.count()}")
        print(f"  Tags:               {Tag.objects.count()}")
        print(f"  Articles:           {Article.objects.count()}")
        print(f"    - Published:      {Article.objects.filter(status='published').count()}")
        print(f"    - Draft:          {Article.objects.filter(status='draft').count()}")
        print(f"    - Featured:       {Article.objects.filter(featured=True).count()}")
        print(f"  Article Likes:      {ArticleLike.objects.count()}")
        print(f"  Bookmarks:          {BookmarkedArticle.objects.count()}")
        print(f"  Comments:           {Comment.objects.count()}")
        print(f"    - Top-level:      {Comment.objects.filter(parent__isnull=True).count()}")
        print(f"    - Replies:        {Comment.objects.filter(parent__isnull=False).count()}")
        print(f"  Comment Likes:      {CommentLike.objects.count()}")
        print(f"  Comment Flags:      {CommentFlag.objects.count()}")
        print(f"  Contact Messages:   {Contact.objects.count()}")
        print(f"  Subscribers:        {Subscriber.objects.count()}")
        print(f"    - Active:         {Subscriber.objects.filter(status='active').count()}")
        print(f"    - Unsubscribed:   {Subscriber.objects.filter(status='unsubscribed').count()}")
        
        print("\nDefault Credentials:")
        print(f"  Admin email:    admin@example.com")
        print(f"  Admin password: admin1234")
        print(f"  User password:  password123 (for all other users)")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Seed database with sample data')
    parser.add_argument('--reset', action='store_true', 
                       help='Delete existing database before seeding')
    args = parser.parse_args()
    
    seeder = DatabaseSeeder(reset=args.reset)
    seeder.run()


if __name__ == '__main__':
    main()
