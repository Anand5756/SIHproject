// System Data (Non-persistent - stored in memory)
window.issuedIDs = [];
window.firReports = [];
window.checkins = [];

// --- Utility Functions ---

/**
 * Converts a File object to a Base64 data URL string.
 * @param {File} file - The file to read.
 * @returns {Promise<string|null>} - Base64 string or null if no file.
 */
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// --- Section Management Function ---

/**
 * Shows a specific group of cards and hides all others.
 * @param {string} groupName - The data-group attribute value to show (e.g., 'registration', 'checkin', 'sos', 'fir', 'idcard', 'splash').
 */
function showSection(groupName) {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        // Hide all cards initially
        card.classList.add('hidden');
    });

    const targetCards = document.querySelectorAll(`.card[data-group="${groupName}"]`);
    targetCards.forEach(card => {
        // Show only the cards belonging to the target group
        card.classList.remove('hidden');
    });

    // Toggle visibility of dashboard elements
    const isDashboardView = groupName !== 'splash';
    document.getElementById('navbar').classList.toggle('hidden', !isDashboardView);
    document.getElementById('main-header').classList.toggle('hidden', !isDashboardView);
    document.getElementById('stats-section').classList.toggle('hidden', !isDashboardView);

    // Scroll to the top of the main content area
    document.getElementById('top').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hides the splash screen and reveals the main application dashboard (Registration section).
 */
function hideSplashAndShowMain() {
    showSection('registration');
}

/**
 * Shows the card for the most recently registered Digital ID.
 */
function showLastIDCard() {
    const cardContainer = document.getElementById('idCardContainer');
    if (window.issuedIDs.length === 0) {
        // Show the ID card section with an error message instead of an alert()
        cardContainer.innerHTML = '<div class="text-red-500 text-center py-8">❌ No Digital IDs have been registered yet. Please register a tourist first.</div>';
        showSection('idcard');
        return;
    }
    const lastId = window.issuedIDs[window.issuedIDs.length - 1].digitalId;
    showDigitalIDCard(lastId);
}

// --- Core Rendering Functions ---

function renderDigitalList() {
  const list = document.getElementById('idList');
  if (!list) return;
  list.innerHTML = '';
  if (window.issuedIDs.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500" data-label="Status">No Digital IDs issued yet.</td></tr>';
  }
  window.issuedIDs.forEach(idObj => {
    const statusClass = idObj.revoked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition duration-100';
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900" data-label="Digital ID">${idObj.digitalId}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Name">${idObj.fullName}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Check-in">${idObj.checkIn}</td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Status"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${idObj.revoked ? 'Revoked' : 'Active'}</span></td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" data-label="Action">
        <button onclick="showDigitalIDCard('${idObj.digitalId}')" class='bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded-lg text-xs transition duration-150'>View ID Card</button>
      </td>
    `;
    list.appendChild(tr);
  });
}

/**
 * Renders the Digital ID Card for a specific tourist and switches the view.
 * @param {string} id - The Digital ID of the tourist.
 */
function showDigitalIDCard(id) {
    const tourist = window.issuedIDs.find(t => t.digitalId === id);
    const cardContainer = document.getElementById('idCardContainer');

    if (!tourist) {
        cardContainer.innerHTML = '<div class="text-red-500 text-center py-8">Tourist ID not found.</div>';
        return;
    }

    // Use the uploaded photo if available, otherwise use a placeholder.
    const photoSource = tourist.photoBase64 
        ? tourist.photoBase64 
        : `https://placehold.co/120x150/fca5a5/000?text=Tourist+Photo`; 
    
    // --- QR CODE LOGIC (Uses Base64 SVG for authentic look) ---
    // This SVG visually simulates the block pattern of a QR code.
    const svgContent = `
        <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="80" height="80" fill="#FFF"/>
            <rect x="5" y="5" width="20" height="20" fill="#000"/>
            <rect x="55" y="5" width="20" height="20" fill="#000"/>
            <rect x="5" y="55" width="20" height="20" fill="#000"/>
            <rect x="30" y="30" width="20" height="20" fill="#000"/>
            <rect x="10" y="30" width="10" height="10" fill="#000"/>
            <rect x="60" y="30" width="10" height="10" fill="#000"/>
            <rect x="30" y="10" width="10" height="10" fill="#000"/>
            <rect x="30" y="60" width="10" height="10" fill="#000"/>
            <rect x="60" y="60" width="10" height="10" fill="#000"/>
        </svg>
    `;
    const encodedSvg = btoa(svgContent.trim());
    const qrCodeImg = `data:image/svg+xml;base64,${encodedSvg}`;
    // --- END UPDATED QR CODE LOGIC ---

    
    // Render the ID card HTML structure
    cardContainer.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="text-left">
                <p class="text-xs text-blue-400 font-semibold uppercase">Smart Tourist Authority</p>
                <h3 class="text-xl font-bold tracking-wider">Digital Tourist ID</h3>
                <p class="text-sm font-mono mt-1 bg-blue-700 inline-block px-2 py-0.5 rounded">${tourist.digitalId}</p>
            </div>
            <!-- QR Code Display -->
            <div class="flex flex-col items-center">
                <img src="${qrCodeImg}" alt="QR Code" class="w-20 h-20 p-1 bg-white rounded-lg border border-blue-500">
                <p class="text-xs mt-1 text-gray-300">Scan for Verification</p>
            </div>
        </div>

        <div class="flex items-start border-t border-b border-gray-600 py-4">
            <!-- Photo Display (using Base64 if uploaded) -->
            <div class="flex-shrink-0 mr-4">
                <img src="${photoSource}" alt="Tourist Photo" class="w-24 h-32 object-cover rounded-lg border-2 border-white">
            </div>
            <div class="flex-grow grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                <div>
                    <p class="text-blue-300">Name</p>
                    <p class="font-bold text-lg">${tourist.fullName.toUpperCase()}</p>
                </div>
                <div>
                    <p class="text-blue-300">D.O.B</p>
                    <p class="font-semibold">${tourist.dob}</p>
                </div>
                <div class="col-span-2">
                    <p class="text-blue-300">Nationality</p>
                    <p class="font-semibold">${tourist.nationality.toUpperCase()}</p>
                </div>
                <div>
                    <p class="text-blue-300">Issued</p>
                    <p class="font-semibold">${tourist.checkIn}</p>
                </div>
                <div>
                    <p class="text-blue-300">Expires</p>
                    <p class="font-semibold">${tourist.checkOut}</p>
                </div>
            </div>
        </div>

        <div class="mt-4 text-xs flex justify-between items-center">
            <p class="font-light italic text-gray-400">This digital ID verifies safe passage and registration with local authorities.</p>
            <p class="font-bold text-blue-400">STATUS: ${tourist.revoked ? 'REVOKED' : 'ACTIVE'}</p>
        </div>
    `;

    showSection('idcard');
}

function updateStats() {
  document.getElementById('totalIDs').innerText = window.issuedIDs.length;
  document.getElementById('activeIDs').innerText = window.issuedIDs.filter(i => !i.revoked).length;
  const checkedInCount = window.checkins.filter(c => c.status === 'Checked-in').length;
  document.getElementById('checkedIn').innerText = checkedInCount;
}

function renderCheckins(filter = '') {
  const tb = document.getElementById('checkinTbody');
  const noCheckins = document.getElementById('noCheckins');
  if (!tb || !noCheckins) return;
  tb.innerHTML = '';
  const q = filter.toLowerCase();
  const list = window.checkins.filter(c => {
    return (c.name && c.name.toLowerCase().includes(q)) ||
           (c.id && c.id.toLowerCase().includes(q)) ||
           (c.location && c.location.toLowerCase().includes(q));
  }).reverse(); // Show newest first

  if (list.length === 0) {
    noCheckins.classList.remove('hidden');
    return;
  } else {
    noCheckins.classList.add('hidden');
  }

  list.forEach((c, i) => {
    const isCheckedIn = c.status === 'Checked-in';
    const statusClass = isCheckedIn ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800';
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition duration-100';
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Name">${c.name || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500" data-label="ID">${c.id || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Location">${c.location || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Time">${c.time || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap" data-label="Status"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">${c.status || ''}</span></td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center" data-label="Action">
        <button onclick='checkout("${c.id}", "${c.time}")' class='add-btn ${isCheckedIn ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-400 cursor-not-allowed'} text-white py-1 px-2 rounded-lg text-xs transition duration-150' ${!isCheckedIn ? 'disabled' : ''}>Check-out</button>
      </td>
    `;
    tb.appendChild(tr);
  });
}

function checkout(id, time) {
  const record = window.checkins.find(c => c.id === id && c.time === time && c.status === 'Checked-in');
  if (record) {
    record.status = 'Checked-out';
    const tourist = window.issuedIDs.find(t => t.digitalId === id);
    // We only mark the tourist as 'not checked in' if this was their last active check-in
    const hasOtherActiveCheckins = window.checkins.some(c => c.id === id && c.status === 'Checked-in');
    if (tourist && !hasOtherActiveCheckins) {
         tourist.checkedIn = false;
    }
    renderCheckins(document.getElementById('searchCheckin').value);
    updateStats();
  }
}

function renderFirReports() {
  const list = document.getElementById('firList');
  if (!list) return;
  list.innerHTML = '';
   if (window.firReports.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500" data-label="Status">No e-FIRs submitted yet.</td></tr>';
  }
  window.firReports.forEach(fir => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 transition duration-100';
    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900" data-label="ID">${fir.id}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Name">${fir.name}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Type">${fir.type}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Date">${fir.date}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="Location">${fir.location}</td>
    `;
    list.appendChild(tr);
  });
}

// --- Dynamic Row Functions ---

function makeItineraryRow() {
  const div = document.createElement('div');
  // Added dynamic-row class for custom styling on very small screens
  div.className = 'dynamic-row flex flex-wrap gap-2 items-center p-2 rounded-lg bg-gray-50 border border-gray-200 ghost';
  div.innerHTML = `
    <input type="text" placeholder="Location/Description" class="loc flex-1 p-1 border border-gray-300 rounded-md text-sm">
    <input type="date" class="loc-date w-full sm:w-32 p-1 border border-gray-300 rounded-md text-sm">
    <select class="loc-type w-full sm:w-28 p-1 border border-gray-300 rounded-md text-sm">
      <option>Hotel</option>
      <option>Sightseeing</option>
      <option>Restaurant</option>
      <option>Transit</option>
    </select>
    <button type="button" class="remove-row text-red-500 hover:text-red-700 p-1 transition duration-150" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" /></svg>
    </button>
  `;
  return div;
}

function makeEmergencyRow() {
  const div = document.createElement('div');
  // Added dynamic-row class for custom styling on very small screens
  div.className = 'dynamic-row flex flex-wrap gap-2 items-center p-2 rounded-lg bg-gray-50 border border-gray-200 ghost';
  div.innerHTML = `
    <input type="text" placeholder="Contact name" class="ec-name flex-1 p-1 border border-gray-300 rounded-md text-sm">
    <input type="text" placeholder="Relationship" class="ec-rel w-full sm:w-28 p-1 border border-gray-300 rounded-md text-sm">
    <input type="tel" placeholder="Phone number" class="ec-phone w-full sm:w-36 p-1 border border-gray-300 rounded-md text-sm">
    <button type="button" class="remove-row text-red-500 hover:text-red-700 p-1 transition duration-150" title="Remove">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clip-rule="evenodd" /></svg>
    </button>
  `;
  return div;
}

// --- Event Listeners ---

document.getElementById('addLocation')?.addEventListener('click', () => {
  document.getElementById('itineraryList').appendChild(makeItineraryRow());
});

document.getElementById('addEmergency')?.addEventListener('click', () => {
  document.getElementById('emergencyList').appendChild(makeEmergencyRow());
});

document.addEventListener('click', (e) => {
  if (e.target.closest('.remove-row')) {
    const row = e.target.closest('.ghost');
    if (row) row.parentNode.removeChild(row);
  }
});

document.getElementById('regForm')?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const regMsg = document.getElementById('regMsg');
  regMsg.classList.remove('text-red-500', 'text-green-500');
  regMsg.innerText = '';
  
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const dob = document.getElementById('dob').value; 
  const nationality = document.getElementById('nationality').value.trim(); 
  const entryPoint = document.getElementById('entryPoint').value;
  const docType = document.getElementById('docType').value;
  const docNumber = document.getElementById('docNumber').value.trim();
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;
  const photoFile = document.getElementById('photoFile').files[0]; // Get the file object

  // Check required fields
  if (!fullName || !email || !phone || !dob || !nationality || !entryPoint || !docType || !docNumber || !checkIn || !checkOut) {
    regMsg.innerText = "Please fill all required fields.";
    regMsg.classList.add('text-red-500');
    return;
  }

  // Convert photo to Base64
  let photoBase64 = null;
  if (photoFile) {
    regMsg.innerText = "Processing image...";
    try {
        photoBase64 = await readFileAsBase64(photoFile);
    } catch (error) {
        regMsg.innerText = "❌ Error processing image. Registration failed.";
        regMsg.classList.add('text-red-500');
        return;
    }
  }
  
  // Collect itinerary and emergency contacts (for completeness)
  const itinerary = Array.from(document.querySelectorAll('#itineraryList .ghost')).map(row => ({
      location: row.querySelector('.loc').value,
      date: row.querySelector('.loc-date').value,
      type: row.querySelector('.loc-type').value,
  }));

  const emergencyContacts = Array.from(document.querySelectorAll('#emergencyList .ghost')).map(row => ({
      name: row.querySelector('.ec-name').value,
      relationship: row.querySelector('.ec-rel').value,
      phone: row.querySelector('.ec-phone').value,
  }));

  const digitalId = 'TID' + (Math.floor(Math.random() * 90000) + 10000);
  
  window.issuedIDs.push({
    digitalId,
    fullName,
    email,
    phone,
    dob,
    nationality,
    entryPoint,
    docType,
    docNumber,
    checkIn,
    checkOut,
    itinerary,
    emergencyContacts,
    photoBase64, // Store Base64 string here
    revoked: false,
  });

  renderDigitalList();
  updateStats();
  
  regMsg.innerText = `✅ Registration successful! Digital ID ${digitalId} issued. Loading ID Card...`;
  regMsg.classList.add('text-green-500');

  ev.target.reset();
  document.getElementById('itineraryList').innerHTML = '';
  document.getElementById('emergencyList').innerHTML = '';
  
  // Automatically show the generated ID card after a short delay
  setTimeout(() => {
      showDigitalIDCard(digitalId);
  }, 500); 
});

document.getElementById('checkinForm')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const checkinMsg = document.getElementById('checkinMsg');
  checkinMsg.classList.remove('text-red-500', 'text-green-500');
  checkinMsg.innerText = '';
  
  const id = document.getElementById('checkinId').value.trim();
  const location = document.getElementById('checkinLocation').value.trim();
  const tourist = window.issuedIDs.find(t => t.digitalId === id && !t.revoked);
  
  if (!tourist) {
    checkinMsg.innerText = "❌ Invalid or revoked Digital ID.";
    checkinMsg.classList.add('text-red-500');
    return;
  }
  
  const now = new Date();
  window.checkins.push({
    name: tourist.fullName,
    id,
    location,
    time: now.toLocaleString(),
    status: 'Checked-in'
  });
  
  tourist.checkedIn = true;
  renderCheckins();
  updateStats();
  checkinMsg.innerText = "✅ Check-in successful!";
  checkinMsg.classList.add('text-green-500');
  ev.target.reset();
});

document.getElementById('searchCheckin')?.addEventListener('input', (ev) => {
  renderCheckins(ev.target.value);
});

// SOS Button
document.getElementById('sosBtn')?.addEventListener('click', () => {
  const sosMsg = document.getElementById('sosMsg');
  sosMsg.classList.remove('text-red-500', 'text-green-500');
  sosMsg.innerText = '';
  
  const id = document.getElementById('sosId').value.trim();
  const tourist = window.issuedIDs.find(t => t.digitalId === id && !t.revoked);
  
  if (!tourist) {
    sosMsg.innerText = "❌ Invalid or revoked Digital ID.";
    sosMsg.classList.add('text-red-500');
    return;
  }
  
  sosMsg.innerText = `🚨 SOS triggered for ${tourist.fullName} (ID: ${id})! Authorities have been notified and response initiated.`;
  sosMsg.classList.add('text-red-500');
  document.getElementById('sosId').value = '';
});

// e-FIR Form
document.getElementById('firForm')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const firGenMsg = document.getElementById('firGenMsg');
  firGenMsg.classList.remove('text-red-500', 'text-green-500');
  firGenMsg.innerText = '';
  
  const id = document.getElementById('firId').value.trim();
  const type = document.getElementById('firType').value;
  const desc = document.getElementById('firDesc').value.trim();
  const location = document.getElementById('firLocation').value.trim();
  const date = document.getElementById('firDate').value;
  const tourist = window.issuedIDs.find(t => t.digitalId === id && !t.revoked);
  
  if (!tourist) {
    firGenMsg.innerText = "❌ Invalid or revoked Digital ID. Cannot file FIR.";
    firGenMsg.classList.add('text-red-500');
    return;
  }

  window.firReports.push({
    id,
    name: tourist.fullName,
    type,
    desc,
    location,
    date,
    reportTime: new Date().toLocaleString()
  });
  
  renderFirReports();
  firGenMsg.innerText = `✅ e-FIR (${type}) submitted successfully for ID: ${id}.`;
  firGenMsg.classList.add('text-green-500');
  ev.target.reset();
});

// Initial render and section display management
window.onload = function() {
  // Initialize data tables
  renderDigitalList();
  renderCheckins();
  renderFirReports();
  updateStats();
  
  // Load the default section (Splash Screen)
  showSection('splash'); 
}

function checkout(id, time) {
  const record = window.checkins.find(c => c.id === id && c.time === time && c.status === 'Checked-in');
  if (record) {
    record.status = 'Checked-out';
    const tourist = window.issuedIDs.find(t => t.digitalId === id);
    // We only mark the tourist as 'not checked in' if this was their last active check-in
    const hasOtherActiveCheckins = window.checkins.some(c => c.id === id && c.status === 'Checked-in');
    if (tourist && !hasOtherActiveCheckins) {
         tourist.checkedIn = false;
    }
    renderCheckins(document.getElementById('searchCheckin').value);
    updateStats();
  }
}
