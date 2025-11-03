# ✅ To-Do App (Django)

A simple and responsive To-Do application built with **Django**.  
Users can add, edit, complete, and delete tasks easily — designed to be clean, fast, and modern with **Dark/Light mode** support.

---

## 🚀 Features
- Add, edit, and delete tasks  
- Mark tasks as completed  
- Toggle between **Dark and Light mode**  
- Responsive UI (works on desktop & mobile)  
- Simple, clean Django backend  

---

## 🛠️ Tech Stack
**Backend:** Django  
**Frontend:** HTML, CSS, JavaScript  
**Database:** SQLite3 (default Django DB)  
**Version Control:** Git + GitHub  

---

## ⚙️ Installation & Setup

1. **Clone this repository**
   ```bash
   git clone https://github.com/okta/todo-app.git
   cd todo-app
2. **Create and activate a virtual environment**
    ```bash
    python -m venv venv
    source venv/bin/activate   # Mac / Linux
    venv\Scripts\activate      # Windows

3. **Install dependencies**
    ```bash
    pip install -r requirements.txt

4. **Start the development server**
    ```bash
    python manage.py runserver

5. **Open in browser**
    ```bash
    http://127.0.0.1:8000/
    
## 📁 Folder Structure
    
    todo-app/
    │
    ├── todo/                 # Main app folder
    │   ├── templates/        # HTML templates
    │   ├── static/           # CSS, JS, images
    │   └── views.py          # Main logic
    │
    ├── todo_project/         # Django project settings
    │   ├── settings.py
    │   └── urls.py
    │
    ├── db.sqlite3            # Database (auto-generated)
    ├── manage.py
    └── README.md

## 🌗 Dark/Light Mode
The app includes a toggle for dark and light mode using CSS and JavaScript.
Your last selected theme is automatically saved in the browser (via localStorage).

## 💡 Future Improvements
- Add user authentication (login/signup)

- Add due dates and priority levels

- Integrate with APIs or cloud DB

- Add task categories

