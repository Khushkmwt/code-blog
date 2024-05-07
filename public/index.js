document.addEventListener("DOMContentLoaded", function () {
    const logoPaths = document.querySelectorAll('.logo-svg path');
    logoPaths.forEach(path => {
        const length = path.getTotalLength();
        path.style.transition = path.style.WebkitTransition = 'none';
        path.style.strokeDasharray = length + ' ' + length;
        path.style.strokeDashoffset = length;
        path.getBoundingClientRect();
        path.style.transition = path.style.WebkitTransition = 'stroke-dashoffset 1s ease-in-out';
        path.style.strokeDashoffset = '0';
    });
});