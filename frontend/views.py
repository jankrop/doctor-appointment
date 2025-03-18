from django.shortcuts import render, reverse, redirect


def index(request):
    if request.user.is_authenticated:
        return render(request, 'index.html')
    return redirect(reverse('login'))
