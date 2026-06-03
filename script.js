const toggleButton = document.getElementById('darkModeToggle');
const body = document.body;
const gmailIcon = document.getElementById('gmailIcon');
const githubIcon = document.getElementById('githubIcon');
const linkedinIcon = document.getElementById('linkedinIcon');

toggleButton.addEventListener('click', function() {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        toggleButton.src = 'pictures/light-button.png';
        gmailIcon.src = 'pictures/gmail-white.png';
        githubIcon.src = 'pictures/github-white.png';
        linkedinIcon.src = 'pictures/linkedin-white.png';
    } else {
        toggleButton.src = 'pictures/dark-button.png';
        gmailIcon.src = 'pictures/gmail-black.png';
        githubIcon.src = 'pictures/github-black.png';
        linkedinIcon.src = 'pictures/linkedin-black.png';
    }
});