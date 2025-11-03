# todos/views.py
import json, os
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.shortcuts import render

DATA_FILE = os.path.join(settings.BASE_DIR, 'data', 'todos.json')

def index(request):
    # Render single page app yang akan memanggil API /api/todos/...
    return render(request, 'todos/index.html')

# in-memory store (will be initialized from file if exists)
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, 'r') as f:
        TODOS = json.load(f)
else:
    TODOS = []
NEXT_ID = max([t['id'] for t in TODOS], default=0) + 1

def save_to_file():
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(TODOS, f, indent=2)

def list_todos(request):
    return JsonResponse(TODOS, safe=False)

@csrf_exempt
def create_todo(request):
    global NEXT_ID
    if request.method != 'POST':
        return HttpResponse(status=405)
    try:
        payload = json.loads(request.body)
        title = payload.get('title', '').strip()
        if not title:
            return HttpResponseBadRequest("Title required")
        item = {'id': NEXT_ID, 'title': title, 'done': False}
        NEXT_ID += 1
        TODOS.append(item)
        save_to_file()
        return JsonResponse(item, status=201)
    except Exception as e:
        return HttpResponseBadRequest(str(e))

@csrf_exempt
def update_todo(request, tid):
    if request.method not in ('PUT','PATCH'):
        return HttpResponse(status=405)
    try:
        payload = json.loads(request.body)
        for t in TODOS:
            if t['id'] == int(tid):
                t.update({k: v for k, v in payload.items() if k in ('title','done')})
                save_to_file()
                return JsonResponse(t)
        return HttpResponse(status=404)
    except Exception as e:
        return HttpResponseBadRequest(str(e))

@csrf_exempt
def delete_todo(request, tid):
    if request.method != 'DELETE':
        return HttpResponse(status=405)
    global TODOS
    TODOS = [t for t in TODOS if t['id'] != int(tid)]
    save_to_file()
    return HttpResponse(status=204)

@csrf_exempt
def import_json(request):
    # accept uploaded JSON file
    if request.method != 'POST' or 'file' not in request.FILES:
        return HttpResponseBadRequest("File required")
    f = request.FILES['file']
    try:
        data = json.load(f)
        if not isinstance(data, list):
            return HttpResponseBadRequest("JSON must be a list")
        global TODOS, NEXT_ID
        TODOS = data
        NEXT_ID = max([t['id'] for t in TODOS], default=0) + 1
        save_to_file()
        return JsonResponse({'imported': len(TODOS)})
    except Exception as e:
        return HttpResponseBadRequest(str(e))

def export_json(request):
    return JsonResponse(TODOS, safe=False)
