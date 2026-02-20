document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentMedicine = null;
    let schedules = JSON.parse(localStorage.getItem('mediscan_schedules') || '[]');
    let medsData = [];

    // Selectors
    const navButtons = document.querySelectorAll('.nav-links button');
    const pages = document.querySelectorAll('.page');
    const medicineResults = document.getElementById('medicine-results');
    const manualSearchInput = document.getElementById('manual-search');
    const searchButton = document.getElementById('search-btn');
    const openCameraButton = document.getElementById('open-camera');
    const captureButton = document.getElementById('capture');
    const closeCameraButton = document.getElementById('close-camera');
    const video = document.getElementById('video');
    const cameraContainer = document.getElementById('camera-container');
    const canvas = document.getElementById('canvas');
    const scheduleForm = document.getElementById('schedule-form');
    const scheduleCardsContainer = document.getElementById('schedule-cards');
    const discountShopsContainer = document.getElementById('discount-shops');
    const normalShopsContainer = document.getElementById('normal-shops');

    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const pageId = `page-${btn.id.split('-')[1]}`;
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (pageId === 'page-locations') loadLocations();
            if (pageId === 'page-schedule') renderSchedules();
        });
    });

    // Medicine Search
    async function loadMedicines(query = '') {
        try {
            const response = await fetch(`/api/medicines?query=${query}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                medsData = data;
            } else {
                console.error('API returned non-array data:', data);
                medsData = [];
            }
            renderMedicines(medsData);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            try {
                const res = await fetch('/static/medidatas.json');
                const localData = await res.json();
                medsData = Array.isArray(localData) ? localData : [];
            } catch (fallbackError) {
                medsData = [];
            }

            const filtered = query && medsData.length > 0 ? medsData.filter(m =>
                (m.name || '').toLowerCase().includes(query.toLowerCase()) ||
                (m.composition || '').toLowerCase().includes(query.toLowerCase())
            ) : medsData;
            renderMedicines(filtered);
        }
    }

    function renderMedicines(medicines) {
        if (!Array.isArray(medicines)) {
            medicineResults.innerHTML = '<p style="padding: 20px;">No medicines found.</p>';
            return;
        }

        if (medicines.length === 0) {
            medicineResults.innerHTML = '<p style="padding: 20px;">No results matching your search.</p>';
            return;
        }

        const limitedMeds = medicines.slice(0, 10);
        medicineResults.innerHTML = limitedMeds.map(m => `
            <div class="card medicine-card" onclick="openMedicineDetail('${m.id}')">
                <h4>${m.name || 'Unknown Medicine'}</h4>
                <p style="font-size: 12px; color: var(--text-light);">${m.manufacturer_name || 'Unknown Manufacturer'}</p>
                <p>pack size - ${m.pack_size_label || ''}</p>
            </div>
        `).join('');
    }

    searchButton.addEventListener('click', () => {
        const query = manualSearchInput.value.trim();
        if (query) {
            loadMedicines(query);
        } else {
            medicineResults.innerHTML = '<p style="padding: 20px;">Please enter a search term.</p>';
        }
    });

    // Don't load on input anymore, and don't load initially
    // manualSearchInput.addEventListener('input', (e) => loadMedicines(e.target.value));
    // loadMedicines(); 

    window.openMedicineDetail = (id) => {
        const med = medsData.find(m => m.id === id);
        if (med) {
            document.getElementById('modal-name').innerText = med.name;
            document.getElementById('modal-details').innerText = `${med.type}\nPrice: ${med.price}\nManufacturer: ${med.manufacturer_name}\nMedicine Type: ${med.type}\n`;
            document.getElementById('medicine-modal').style.display = 'flex';
        }
    };

    // Camera & OCR
    function stopCamera() {
        const stream = video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        cameraContainer.style.display = 'none';
        captureButton.style.display = 'none';
        closeCameraButton.style.display = 'none';
        openCameraButton.style.display = 'inline-block';
    }

    openCameraButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            cameraContainer.style.display = 'block';
            captureButton.style.display = 'inline-block';
            closeCameraButton.style.display = 'inline-block';
            openCameraButton.style.display = 'none';
        } catch (err) {
            console.error('Camera access error:', err);
            alert('Camera access denied or not available.');
        }
    });

    closeCameraButton.addEventListener('click', stopCamera);

    captureButton.addEventListener('click', async () => {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        captureButton.innerText = 'Scanning...';
        captureButton.disabled = true;

        try {
            const { data: { text } } = await Tesseract.recognize(canvas, 'eng');
            console.log('OCR Output:', text);
            // Simple heuristic to find medicine names from OCR
            const lines = text.split('\n');
            const possibleNames = lines.filter(l => l.length > 3);
            if (possibleNames.length > 0) {
                manualSearchInput.value = possibleNames[0].trim();
                loadMedicines(manualSearchInput.value);
            }
        } catch (err) {
            console.error('OCR Error:', err);
        } finally {
            captureButton.innerText = 'Capture & Scan';
            captureButton.disabled = false;
        }
    });

    // Locations
    async function loadLocations() {
        try {
            const response = await fetch('/api/locations');
            const locations = await response.json();
            renderLocations(locations);
        } catch (error) {
            const res = await fetch('/static/locations.json');
            const locations = await res.json();
            renderLocations(locations);
        }
    }

    function renderLocations(locations) {
        const discounts = locations.filter(l => l.category === 'discount');
        const normals = locations.filter(l => l.category === 'normal');

        discountShopsContainer.innerHTML = discounts.map(l => `
            <div class="card">
                <h4>${l.name}</h4>
                <p><strong>Discount: ${l.discount}</strong></p>
                <p>Contact: ${l.contact}</p>
                <a href="${l.link}" target="_blank" class="btn btn-primary" style="display: inline-block; margin-top: 10px; text-decoration: none; font-size: 14px;">Visit Store</a>
            </div>
        `).join('');

        normalShopsContainer.innerHTML = normals.map(l => `
            <div class="card">
                <h4>${l.name}</h4>
                <p>Contact: ${l.contact}</p>
                <a href="${l.link}" target="_blank" class="btn btn-primary" style="display: inline-block; margin-top: 10px; text-decoration: none; font-size: 14px;">Visit Store</a>
            </div>
        `).join('');
    }

    // Schedule Management
    scheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const timeSlots = Array.from(document.querySelectorAll('input[name="time-slot"]:checked')).map(cb => cb.value);
        const newSched = {
            id: 'SCH' + Date.now(),
            medicine_name: document.getElementById('sched-name').value,
            times_per_day: parseInt(document.getElementById('sched-times').value),
            duration_days: parseInt(document.getElementById('sched-duration').value),
            time_slots: timeSlots,
            food_timing: document.getElementById('sched-food').value,
            start_date: new Date().toISOString()
        };

        schedules.push(newSched);
        localStorage.setItem('mediscan_schedules', JSON.stringify(schedules));

        try {
            await fetch('/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSched)
            });
        } catch (err) {
            console.warn('Backend sync failed, saved to local storage.');
        }

        scheduleForm.reset();
        renderSchedules();
    });

    function renderSchedules() {
        scheduleCardsContainer.innerHTML = schedules.map(s => {
            const status = getScheduleStatus(s);
            return `
                <div class="card">
                    <h4>${s.medicine_name}</h4>
                    <p>${s.times_per_day} times/day for ${s.duration_days} days</p>
                    <p>Slots: ${s.time_slots.join(', ')}</p>
                    <p><em>${s.food_timing.replace('_', ' ')}</em></p>
                    <button class="btn ${status.btnClass}" onclick="consumeMed('${s.id}')" ${status.disabled ? 'disabled' : ''}>
                        ${status.label}
                    </button>
                </div>
            `;
        }).join('');
    }

    function getScheduleStatus(s) {
        const now = new Date();
        const hour = now.getHours();

        // Simple logic for consumption status
        let label = 'Consume Now';
        let btnClass = 'btn-accent';
        let disabled = false;

        if (hour < 10 && s.time_slots.includes('morning')) {
            label = 'Consume Morning';
        } else if (hour >= 11 && hour < 15 && s.time_slots.includes('noon')) {
            label = 'Consume Noon';
        } else if (hour >= 18 && s.time_slots.includes('night')) {
            label = 'Consume Night';
        } else {
            label = 'Not Scheduled Now';
            btnClass = 'btn-primary'; // Greyish in real CSS but using primary here
            disabled = true;
        }

        return { label, btnClass, disabled };
    }

    window.consumeMed = async (id) => {
        try {
            await fetch(`/api/schedules/${id}/consume`, { method: 'POST' });
            alert('Medicine consumption logged!');
        } catch (err) {
            alert('Logged locally (Server offline).');
        }
    };
});
