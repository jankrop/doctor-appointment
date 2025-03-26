from django.shortcuts import render, reverse, redirect


def index(request):
    if request.user.is_authenticated:
        return render(request, 'index.html')
    return redirect(reverse('login'))


def api_docs(request):
    return render(request, 'api_docs.html')
