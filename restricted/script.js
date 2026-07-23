pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const ocFiles = [
    'pdfs/oc1.pdf', 
    'pdfs/oc2.pdf', 
    'pdfs/oc3.pdf',
    'pdfs/oc4.pdf', 
    'pdfs/oc5.pdf', 
    'pdfs/oc6.pdf',
    'pdfs/oc7.pdf', 
    'pdfs/oc8.pdf', 
    'pdfs/oc9.pdf',
    'pdfs/oc10.pdf'
];

let currentFileIndex = 0;
let pdfDoc = null;
let pageNum = 1;
let isRendering = false;
let pageRenderingQueue = null;
let isSliding = false; 
let entranceReached = false;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const audioBuffers = {};
let ambientSource = null;
let ambientGain = null;

const soundUrls = {
    book: 'sounds/book.mp3',
    page: 'sounds/page.mp3',
    whoosh: 'sounds/whoosh.mp3',
    flicker: 'sounds/flicker.mp3',
    whisper: 'sounds/whisper.mp3',
    light: 'sounds/light.mp3',
    switch: 'sounds/switch.mp3'
};

async function preloadAudio() {
    for (const [key, url] of Object.entries(soundUrls)) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            audioBuffers[key] = audioBuffer;
        } catch (e) {}
    }
}
preloadAudio();

function playSfx(key, vol) {
    if (!audioBuffers[key]) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[key];

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = vol;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(0);
}

function startAmbientLight() {
    if (!audioBuffers['light'] || ambientSource) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    ambientSource = audioCtx.createBufferSource();
    ambientSource.buffer = audioBuffers['light'];
    ambientSource.loop = true;

    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.03;

    ambientSource.connect(ambientGain);
    ambientGain.connect(audioCtx.destination);
    ambientSource.start(0);
}

function stopAmbientLight() {
    if (ambientSource) {
        ambientSource.stop();
        ambientSource.disconnect();
        ambientSource = null;
    }
}

document.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (entranceReached && !ambientSource) {
        startAmbientLight();
    }
});

const VOL_QUIET = 0.03;
const VOL_NORMAL = 0.12;

const brandNormal = document.querySelector('.brand-normal');
const brandScp = document.querySelector('.brand-scp');
const restrictedText = document.querySelector('.restricted-text');
const exitBtn = document.getElementById('exit-btn');

const paper = document.getElementById('paper-container');
const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');

const bigLeft = document.getElementById('big-left');
const bigRight = document.getElementById('big-right');
const littleControls = document.querySelector('.little-controls');
const littleLeft = document.getElementById('little-left');
const littleRight = document.getElementById('little-right');

window.onload = () => {
    setTimeout(() => {
        brandNormal.style.opacity = '0';
        brandScp.style.opacity = '1';
        exitBtn.style.opacity = '1';
    }, 500);

    setTimeout(() => {
        restrictedText.style.opacity = '1';
    }, 2500); 

    setTimeout(() => {
        entranceReached = true;
        restrictedText.classList.add('pulse-anim');
        paper.classList.add('flicker-anim');
        playSfx('flicker', VOL_NORMAL);
        startAmbientLight();
    }, 4000); 

    setTimeout(() => {
        loadAndRenderDocument(ocFiles[currentFileIndex]);
        bigLeft.classList.remove('hidden-ui');
        bigRight.classList.remove('hidden-ui');
        littleControls.classList.remove('hidden-ui');
    }, 5500); 
};

exitBtn.addEventListener('click', () => {
    playSfx('switch', VOL_NORMAL);
    
    setTimeout(() => {
        stopAmbientLight();
    }, 800); 

    restrictedText.classList.remove('pulse-anim');
    document.body.classList.add('exit-active');
    paper.classList.remove('flicker-anim');
    paper.classList.add('exit-flicker-anim');

    setTimeout(() => {
        document.body.classList.add('exit-reveal');
        playSfx('whoosh', VOL_NORMAL);
        
        setTimeout(() => {
            window.location.href = "/";
        }, 1500); 
    }, 1500); 
});

async function loadAndRenderDocument(url) {
    canvas.style.opacity = '0'; 
    
    try {
        const loadingTask = pdfjsLib.getDocument(url);
        pdfDoc = await loadingTask.promise;
        pageNum = 1; 
        await renderPage(pageNum);
        canvas.style.opacity = '1'; 
    } catch (error) {}
}

async function renderPage(num) {
    if (!pdfDoc) return;
    isRendering = true;
    
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 2.0 }); 
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: ctx,
        viewport: viewport
    };

    await page.render(renderContext).promise;
    isRendering = false;

    if (pageRenderingQueue !== null) {
        renderPage(pageRenderingQueue);
        pageRenderingQueue = null;
    }
}

function queueRenderPage(num) {
    if (isRendering) pageRenderingQueue = num;
    else renderPage(num);
}

function handleSmallButton(direction) {
    if (!pdfDoc || isSliding) return;
    
    playSfx('page', VOL_NORMAL);
    
    if (Math.floor(Math.random() * 50) === 0) {
        playSfx('whisper', VOL_QUIET);
    }
    
    if (Math.floor(Math.random() * 50) === 0) {
        playSfx('flicker', VOL_NORMAL);
        paper.classList.remove('flicker-anim');
        void paper.offsetWidth; 
        paper.classList.add('flicker-anim');
    }

    if (direction === 'left' && pageNum > 1) {
        pageNum--;
    } else if (direction === 'right' && pageNum < pdfDoc.numPages) {
        pageNum++;
    } else {
        return; 
    }
    
    queueRenderPage(pageNum);
}

littleLeft.addEventListener('click', () => handleSmallButton('left'));
littleRight.addEventListener('click', () => handleSmallButton('right'));

function slidePaper(direction) {
    if (isSliding) return; 
    isSliding = true;

    playSfx('book', VOL_NORMAL);

    if (Math.floor(Math.random() * 50) === 0) {
        playSfx('whisper', VOL_QUIET);
    }

    littleControls.classList.add('hidden-ui');
    
    const outTransform = direction === 'right' ? 'translateX(-150vw)' : 'translateX(150vw)';
    paper.style.transition = 'transform 0.6s cubic-bezier(0.5, 0, 1, 1)'; 
    paper.style.transform = outTransform;
    
    setTimeout(() => {
        paper.style.transition = 'none';
        const inTransform = direction === 'right' ? 'translateX(150vw)' : 'translateX(-150vw)';
        paper.style.transform = inTransform;
        
        loadAndRenderDocument(ocFiles[currentFileIndex]);
        
        setTimeout(() => {
            paper.style.transition = 'transform 0.8s cubic-bezier(0, 0, 0.2, 1)'; 
            paper.style.transform = 'translateX(0)';
            
            setTimeout(() => {
                littleControls.classList.remove('hidden-ui');
                isSliding = false; 
            }, 800);
        }, 50); 
    }, 600); 
}

bigRight.addEventListener('click', () => {
    if (isSliding) return;
    currentFileIndex++;
    if (currentFileIndex >= ocFiles.length) currentFileIndex = 0; 
    slidePaper('right');
});

bigLeft.addEventListener('click', () => {
    if (isSliding) return;
    currentFileIndex--;
    if (currentFileIndex < 0) currentFileIndex = ocFiles.length - 1; 
    slidePaper('left');
});