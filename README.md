# Blog Website

**Blog Website** is a modern, community-driven blogging platform where anyone can read, write, and share articles. Readers can browse high-quality posts, register to write their own, and interact with content through likes, dislikes, and bookmarks — while administrators ensure the quality and integrity of the published content.

## Setup & Installation

Follow these steps to run **Blog Website** locally.

### Clone the Repository

```bash
git clone https://github.com/r-shafi/blog-website.git
cd blog-website
```

### Install & Run the **Frontend**

```bash
cd frontend
npm install
npm run dev
```

### Install & Run the **Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python seed.py --reset
python manage.py runserver
```

**Default Admin Credentials (after seeding):**

- Email: `admin@example.com`
- Password: `admin1234`

### Access the App

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Backend API:** [http://localhost:8000](http://localhost:8000)

## ✅ Features

- Public reading of published blogs
- User registration and post creation (drafts & publish flow)
- Like / Dislike / Bookmark articles
- Admin approval and moderation
- Contact form and newsletter subscription
- Secure role-based access and management
