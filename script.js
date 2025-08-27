// script.js - client logic for OCR + contacting backend
// Expects backend running at /solve (same origin or full URL)

const extractBtn = document.getElementById('extractBtn');
const solveBtn = document.getElementById('solveBtn');
const clearBtn = document.getElementById('clearBtn');
const imageInput = document.getElementById('imageInput');
const questionEl = document.getElementById('question');
const extractedEl = document.getElementById('extractedText');
const answerBox = document.getElementById('answerBox');
const answerEl = document.getElementById('answer');

extractBtn?.addEventListener('click', async () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) return alert('Please choose an image file first.');
  extractedEl.textContent = 'Processing image...';
  try {
    const { data } = await Tesseract.recognize(file, 'eng', { logger: m => {
      // optional: console.log(m);
    }});
    const text = data?.text?.trim() || '';
    extractedEl.textContent = text || 'No text detected.';
    if (text) questionEl.value = text;
  } catch (err) {
    extractedEl.textContent = 'Error extracting text.';
    console.error(err);
  }
});

solveBtn?.addEventListener('click', async () => {
  const q = questionEl.value.trim();
  if (!q) return alert('Please enter or extract a question first.');
  answerBox.hidden = false;
  answerEl.textContent = 'Thinking...';

  try {
    // If your backend is on a different host, replace with full URL
    const resp = await fetch('/solve', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ question: q })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({error:'Unknown'}));
      answerEl.textContent = `Error from server: ${err?.error || resp.statusText}`;
      return;
    }

    const data = await resp.json();
    answerEl.textContent = data.answer || 'No answer returned.';
  } catch (err) {
    console.error(err);
    answerEl.textContent = 'Network or server error. Check console.';
  }
});

clearBtn?.addEventListener('click', () => {
  questionEl.value = '';
  extractedEl.textContent = '';
  answerEl.textContent = '';
  answerBox.hidden = true;
  imageInput.value = '';
});
