const button = document.getElementById('change-password-button');
const passContainer = document.getElementById('password-container');

button.addEventListener('click', () => {
	if (passContainer.style.display !== 'none') {
		passContainer.style.display = 'none';
	} else {
		passContainer.style.display = 'block';
	}
});
