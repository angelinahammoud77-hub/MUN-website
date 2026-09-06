/* =====================================================
   DELEGATEOS - MAIN JAVASCRIPT
===================================================== */

let selectedWorkspaceDelegateId = null;

/* Global Storage Helpers */
function getData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (error) {
        console.error("Error reading:", key, error);
        return fallback;
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function getCurrentUser() {
    return getData("currentUser", null);
}

function canManageDelegates() {
    const user = getCurrentUser();
    return user && (user.role === "chair" || user.role === "admin");
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === "admin";
}

function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/* Sample Seed Data */
(function initDefaultData() {
    if (!localStorage.getItem("committees")) {
        saveData("committees", [
            { id: 1, name: "UNSC", topic: "Crisis in the Middle East", description: "Security Council" },
            { id: 2, name: "DISEC", topic: "Cyber Warfare Standards", description: "Disarmament Committee" }
        ]);
    }
    if (!localStorage.getItem("delegates")) {
        saveData("delegates", [
            { id: 101, name: "Alex Rivera", country: "France", committee: "UNSC", points: 12 },
            { id: 102, name: "Sarah Chen", country: "Japan", committee: "UNSC", points: 8 },
            { id: 103, name: "David Kim", country: "USA", committee: "DISEC", points: 15 }
        ]);
    }
})();

/* AUTHENTICATION */
function showLogin() {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("signupForm").classList.add("hidden");
}

function showSignup() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signupForm").classList.remove("hidden");
}

function toggleConferenceFields() {
    const mode = document.getElementById("signupConferenceMode").value;
    document.getElementById("createConferenceFields").classList.toggle("hidden", mode !== "create");
    document.getElementById("joinConferenceFields").classList.toggle("hidden", mode === "create");
}

function signup() {
    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const role = document.getElementById("signupRole").value;
    const mode = document.getElementById("signupConferenceMode").value;

    if (!username || !email || !password) {
        alert("Please complete all account fields.");
        return;
    }

    let users = getData("users", []);
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert("Username already exists.");
        return;
    }

    let conferenceName = "";
    let conferenceCode = "";

    if (mode === "create") {
        conferenceName = document.getElementById("newConferenceName").value.trim();
        if (!conferenceName) return alert("Please enter the Conference Name.");
        conferenceCode = "MUN-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    } else {
        conferenceCode = document.getElementById("joinConferenceCode").value.trim();
        if (!conferenceCode) return alert("Please enter the conference code.");
        conferenceName = localStorage.getItem("conferenceName") || "MUN Conference";
    }

    const user = { id: Date.now(), username, email, password, role, conferenceCode };
    users.push(user);

    saveData("users", users);
    localStorage.setItem("conferenceName", conferenceName);
    localStorage.setItem("conferenceCode", conferenceCode);
    saveData("currentUser", user);

    alert(`Account created successfully. Conference Code: ${conferenceCode}`);
    openApp();
}

function login() {
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const users = getData("users", []);

    const user = users.find(u => 
        (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) && 
        u.password === password
    );

    if (!user) return alert("Incorrect credentials.");

    saveData("currentUser", user);
    openApp();
}

function logout() {
    localStorage.removeItem("currentUser");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("authScreen").classList.remove("hidden");
    showLogin();
}

/* APP NAVIGATION & RENDERING */
function openApp() {
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    updateHeader();
    setupNavigation();
    applyPermissions();
    renderAllPages();
}

function updateHeader() {
    const user = getCurrentUser();
    document.getElementById("conferenceName").textContent = localStorage.getItem("conferenceName") || "MUN Conference";
    if (user) {
        document.getElementById("userName").textContent = user.username;
        document.getElementById("userRole").textContent = capitalize(user.role);
    }
}

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.onclick = function() { showPage(this.dataset.page); };
    });
}

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    const selectedPage = document.getElementById(pageName);
    if (selectedPage) selectedPage.classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.page === pageName);
    });

    renderAllPages();
}

function applyPermissions() {
    const user = getCurrentUser();
    const isChair = user && (user.role === "chair" || user.role === "admin");
    const isAdm = user && user.role === "admin";

    document.querySelectorAll(".chair-only").forEach(e => e.style.display = isChair ? "" : "none");
    document.querySelectorAll(".admin-only").forEach(e => e.style.display = isAdm ? "" : "none");
}

function renderAllPages() {
    renderOverview();
    renderCommittees();
    renderWorkspace();
    renderRollCall();
    renderMotions();
    renderChairNotes();
    renderDelegates();
    renderAwards();
    renderAccounts();
    renderSettings();
}

/* OVERVIEW */
function renderOverview() {
    const page = document.getElementById("overview");
    if (!page) return;
    const delegates = getData("delegates", []);
    const committees = getData("committees", []);

    page.innerHTML = `
        <div class="page-header">
            <h2>Overview</h2>
            <p>Conference management dashboard.</p>
        </div>
        <div class="workspace-grid">
            <div class="workspace-stat"><span>Delegates</span><strong>${delegates.length}</strong></div>
            <div class="workspace-stat"><span>Committees</span><strong>${committees.length}</strong></div>
            <div class="workspace-stat"><span>Conference</span><strong>${escapeHTML(localStorage.getItem("conferenceName") || "-")}</strong></div>
        </div>
    `;
}

/* COMMITTEES PAGE */
function renderCommittees() {
    const page = document.getElementById("committees");
    if (!page) return;
    const committees = getData("committees", []);

    page.innerHTML = `
        <div class="page-header">
            <h2>Committees</h2>
            <p>Manage conference committees.</p>
        </div>

        ${canManageDelegates() ? `
        <div class="card">
            <h3>Add New Committee</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                <input type="text" id="newCommName" placeholder="Committee Name (e.g. WHO)" style="flex: 1; min-width: 150px;">
                <input type="text" id="newCommTopic" placeholder="Topic" style="flex: 1; min-width: 150px;">
                <input type="text" id="newCommDesc" placeholder="Description / Details" style="flex: 1; min-width: 150px;">
                <button class="primary-btn" onclick="addCommittee()">Add Committee</button>
            </div>
        </div>
        ` : ""}

        <div class="card">
            ${committees.length === 0 ? `<p>No committees found.</p>` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Committee</th>
                                <th>Topic</th>
                                <th>Description</th>
                                ${canManageDelegates() ? "<th>Actions</th>" : ""}
                            </tr>
                        </thead>
                        <tbody>
                            ${committees.map(c => `
                                <tr>
                                    <td><strong>${escapeHTML(c.name)}</strong></td>
                                    <td>${escapeHTML(c.topic)}</td>
                                    <td>${escapeHTML(c.description || "-")}</td>
                                    ${canManageDelegates() ? `
                                        <td><button class="danger-btn" onclick="deleteCommittee(${c.id})">Delete</button></td>
                                    ` : ""}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function addCommittee() {
    const nameInput = document.getElementById("newCommName");
    const topicInput = document.getElementById("newCommTopic");
    const descInput = document.getElementById("newCommDesc");

    const name = nameInput.value.trim();
    const topic = topicInput.value.trim();
    const description = descInput.value.trim();

    if (!name || !topic) {
        alert("Please enter both a Committee Name and a Topic.");
        return;
    }

    const committees = getData("committees", []);
    committees.push({
        id: Date.now(),
        name,
        topic,
        description
    });

    saveData("committees", committees);
    renderAllPages();
}

function deleteCommittee(id) {
    if (!confirm("Are you sure you want to delete this committee?")) return;
    let committees = getData("committees", []);
    committees = committees.filter(c => String(c.id) !== String(id));
    saveData("committees", committees);
    renderAllPages();
}

/* CHAIR WORKSPACE */
function renderWorkspace() {
    const page = document.getElementById("workspace");
    if (!page) return;

    if (!canManageDelegates()) {
        page.innerHTML = `<div class="card"><p>Access restricted to Chairs and Admins.</p></div>`;
        return;
    }

    const delegates = getData("delegates", []);
    const committees = getData("committees", []);

    if (!selectedWorkspaceDelegateId && delegates.length > 0) {
        selectedWorkspaceDelegateId = delegates[0].id;
    }

    const delegate = delegates.find(d => String(d.id) === String(selectedWorkspaceDelegateId));
    const stats = getData("delegateDetailedStats", {});
    const dStats = delegate ? (stats[delegate.id] || {}) : {};

    page.innerHTML = `
        <div class="page-header">
            <h2>Chair Workspace</h2>
            <p>Comprehensive delegate evaluation, roster management, and log tracking.</p>
        </div>

        <div class="card">
            <h3>Quick Delegate Management</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                <input type="text" id="wsDelName" placeholder="Delegate Full Name" style="flex: 1; min-width: 150px;">
                <input type="text" id="wsDelCountry" placeholder="Representing Country" style="flex: 1; min-width: 150px;">
                <select id="wsDelCommittee" style="flex: 1; min-width: 150px;">
                    ${committees.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("")}
                </select>
                <button class="primary-btn" onclick="addDelegateFromWorkspace()">+ Add Delegate</button>
            </div>
        </div>

        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    <label><strong>Select Delegate:</strong></label>
                    <select onchange="selectWorkspaceDelegate(this.value)">
                        ${delegates.map(d => `
                            <option value="${d.id}" ${delegate && delegate.id === d.id ? "selected" : ""}>
                                ${escapeHTML(d.name)} (${escapeHTML(d.country)} - ${escapeHTML(d.committee)})
                            </option>
                        `).join("")}
                    </select>
                </div>
                ${delegate ? `
                    <button class="danger-btn" style="margin-top: 18px;" onclick="deleteDelegate(${delegate.id})">Delete Selected Delegate</button>
                ` : ""}
            </div>
        </div>

        ${delegate ? `
            <div class="card">
                <h3>Log Metrics: ${escapeHTML(delegate.name)} (${escapeHTML(delegate.country)})</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div>
                        <label>Speaking Time (mins)</label>
                        <input type="number" value="${dStats.speakingTime || 0}" onchange="updateDelegateStat(${delegate.id}, 'speakingTime', this.value)">
                    </div>
                    <div>
                        <label>Resolution Contribution</label>
                        <select onchange="updateDelegateStat(${delegate.id}, 'resolutionRole', this.value)">
                            <option value="None" ${dStats.resolutionRole === 'None' ? 'selected' : ''}>None</option>
                            <option value="Sponsor" ${dStats.resolutionRole === 'Sponsor' ? 'selected' : ''}>Sponsor</option>
                            <option value="Signatory" ${dStats.resolutionRole === 'Signatory' ? 'selected' : ''}>Signatory</option>
                        </select>
                    </div>
                    <div>
                        <label>Unmod Participation</label>
                        <input type="text" value="${escapeHTML(dStats.unmod || '')}" placeholder="Notes on unmod..." onchange="updateDelegateStat(${delegate.id}, 'unmod', this.value)">
                    </div>
                    <div>
                        <label>Mod Participation</label>
                        <input type="text" value="${escapeHTML(dStats.mod || '')}" placeholder="Notes on mod..." onchange="updateDelegateStat(${delegate.id}, 'mod', this.value)">
                    </div>
                    <div>
                        <label>Consultation & Crisis</label>
                        <input type="text" value="${escapeHTML(dStats.crisis || '')}" placeholder="Crisis actions..." onchange="updateDelegateStat(${delegate.id}, 'crisis', this.value)">
                    </div>
                    <div>
                        <label>POIs Asked</label>
                        <input type="number" value="${dStats.poisAsked || 0}" onchange="updateDelegateStat(${delegate.id}, 'poisAsked', this.value)">
                    </div>
                    <div>
                        <label>POIs Answered</label>
                        <input type="number" value="${dStats.poisAnswered || 0}" onchange="updateDelegateStat(${delegate.id}, 'poisAnswered', this.value)">
                    </div>
                    <div>
                        <label>Chair Questions Asked/Answered</label>
                        <input type="text" value="${escapeHTML(dStats.chairQuestions || '')}" placeholder="Chair Q&A..." onchange="updateDelegateStat(${delegate.id}, 'chairQuestions', this.value)">
                    </div>
                    <div>
                        <label>Notes Sent / Received</label>
                        <input type="text" value="${escapeHTML(dStats.notePassing || '')}" placeholder="Note passing behavior..." onchange="updateDelegateStat(${delegate.id}, 'notePassing', this.value)">
                    </div>
                </div>

                <div style="margin-top:15px;">
                    <label>Speech Feedback Notes</label>
                    <textarea onchange="updateDelegateStat(${delegate.id}, 'speechNotes', this.value)" placeholder="Write speech specific feedback...">${escapeHTML(dStats.speechNotes || '')}</textarea>
                </div>

                <div style="margin-top: 15px;">
                    <strong>Total Points: ${delegate.points || 0}</strong>
                    <button class="primary-btn" onclick="adjustPoints(${delegate.id}, 1)">+1 Point</button>
                    <button class="danger-btn" onclick="adjustPoints(${delegate.id}, -1)">-1 Point</button>
                </div>
            </div>
        ` : `<div class="card"><p>No delegates registered yet.</p></div>`}
    `;
}

function selectWorkspaceDelegate(id) {
    selectedWorkspaceDelegateId = id;
    renderWorkspace();
}

function addDelegateFromWorkspace() {
    const name = document.getElementById("wsDelName").value.trim();
    const country = document.getElementById("wsDelCountry").value.trim();
    const committee = document.getElementById("wsDelCommittee").value;

    if (!name || !country) {
        alert("Please specify the delegate's name and country.");
        return;
    }

    const newId = Date.now();
    const delegates = getData("delegates", []);
    delegates.push({ id: newId, name, country, committee, points: 0 });
    
    saveData("delegates", delegates);
    selectedWorkspaceDelegateId = newId;
    renderAllPages();
}

function updateDelegateStat(delegateId, key, value) {
    const stats = getData("delegateDetailedStats", {});
    if (!stats[delegateId]) stats[delegateId] = {};
    stats[delegateId][key] = value;
    saveData("delegateDetailedStats", stats);
}

function adjustPoints(delegateId, delta) {
    let delegates = getData("delegates", []);
    const index = delegates.findIndex(d => String(d.id) === String(delegateId));
    if (index !== -1) {
        delegates[index].points = (delegates[index].points || 0) + delta;
        saveData("delegates", delegates);
        renderWorkspace();
        renderDelegates();
        renderAwards();
    }
}

/* ROLL CALL */
function renderRollCall() {
    const page = document.getElementById("rollcall");
    if (!page) return;
    const delegates = getData("delegates", []);
    const attendance = getData("attendance", {});

    page.innerHTML = `
        <div class="page-header">
            <h2>Roll Call</h2>
            <p>Record delegate attendance.</p>
        </div>
        <div class="card">
            ${delegates.length === 0 ? `<p>No delegates added.</p>` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr><th>Delegate</th><th>Country</th><th>Attendance</th></tr>
                        </thead>
                        <tbody>
                            ${delegates.map(d => `
                                <tr>
                                    <td>${escapeHTML(d.name)}</td>
                                    <td>${escapeHTML(d.country)}</td>
                                    <td>
                                        <select onchange="updateAttendance(${d.id}, this.value)">
                                            <option value="Present" ${attendance[d.id] === "Present" ? "selected" : ""}>Present</option>
                                            <option value="Present and Voting" ${attendance[d.id] === "Present and Voting" ? "selected" : ""}>Present and Voting</option>
                                            <option value="Absent" ${attendance[d.id] === "Absent" ? "selected" : ""}>Absent</option>
                                        </select>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function updateAttendance(delegateId, status) {
    const attendance = getData("attendance", {});
    attendance[delegateId] = status;
    saveData("attendance", attendance);
}

/* MOTIONS PAGE */
function renderMotions() {
    const page = document.getElementById("motions");
    if (!page) return;

    const motions = getData("motions", []);
    const delegates = getData("delegates", []);

    page.innerHTML = `
        <div class="page-header">
            <h2>Motions & Floor Control</h2>
            <p>Log motions, manage timing, and maintain speaker lists.</p>
        </div>

        ${canManageDelegates() ? `
        <div class="card">
            <h3>Log New Motion</h3>
            <div style="display: flex; flex-direction: column; gap: 10px; max-width: 500px; margin-top:10px;">
                <select id="motionType">
                    <option value="Moderated Caucus">Moderated Caucus</option>
                    <option value="Unmoderated Caucus">Unmoderated Caucus</option>
                    <option value="Speaker's List">Speaker's List</option>
                    <option value="Consultation">Consultation</option>
                </select>
                
                <select id="motionProposer">
                    <option value="">-- Proposed By (Delegate) --</option>
                    ${delegates.map(d => `<option value="${escapeHTML(d.country)}">${escapeHTML(d.country)} (${escapeHTML(d.name)})</option>`).join("")}
                </select>

                <input type="text" id="motionTopic" placeholder="Topic / Purpose">
                <input type="number" id="motionDuration" placeholder="Total Duration (minutes)">
                <input type="number" id="motionSpeakingTime" placeholder="Speaking Time per Delegate (seconds)">
                <button class="primary-btn" onclick="addMotion()">Submit Motion</button>
            </div>
        </div>
        ` : ""}

        <div class="card">
            <h3>Active & Logged Motions</h3>
            ${motions.length === 0 ? `<p>No motions logged yet.</p>` : `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Proposer</th>
                                <th>Topic</th>
                                <th>Duration</th>
                                <th>Speaking Time</th>
                                <th>Status</th>
                                ${canManageDelegates() ? "<th>Actions</th>" : ""}
                            </tr>
                        </thead>
                        <tbody>
                            ${motions.map(m => `
                                <tr>
                                    <td>${escapeHTML(m.type)}</td>
                                    <td>${escapeHTML(m.proposer || "N/A")}</td>
                                    <td>${escapeHTML(m.topic)}</td>
                                    <td>${m.duration} mins</td>
                                    <td>${m.speakingTime ? m.speakingTime + 's' : 'N/A'}</td>
                                    <td><strong>${escapeHTML(m.status)}</strong></td>
                                    ${canManageDelegates() ? `
                                        <td>
                                            ${m.status === "Pending" ? `<button class="primary-btn" onclick="updateMotionStatus(${m.id}, 'Passed')">Pass</button> <button class="danger-btn" onclick="updateMotionStatus(${m.id}, 'Failed')">Fail</button>` : ""}
                                            <button class="danger-btn" onclick="deleteMotion(${m.id})">Delete</button>
                                        </td>
                                    ` : ""}
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

function addMotion() {
    const type = document.getElementById("motionType").value;
    const proposer = document.getElementById("motionProposer").value;
    const topic = document.getElementById("motionTopic").value.trim();
    const duration = document.getElementById("motionDuration").value;
    const speakingTime = document.getElementById("motionSpeakingTime").value;

    if (!topic || !duration) {
        alert("Please enter both a topic and total duration.");
        return;
    }

    const motions = getData("motions", []);
    motions.push({
        id: Date.now(),
        type,
        proposer,
        topic,
        duration,
        speakingTime,
        status: "Pending"
    });

    saveData("motions", motions);
    renderMotions();
}

function updateMotionStatus(id, status) {
    let motions = getData("motions", []);
    const motion = motions.find(m => String(m.id) === String(id));
    if (motion) {
        motion.status = status;
        saveData("motions", motions);
        renderMotions();
    }
}

function deleteMotion(id) {
    let motions = getData("motions", []);
    motions = motions.filter(m => String(m.id) !== String(id));
    saveData("motions", motions);
    renderMotions();
}

/* CHAIR NOTES PAGE */
function renderChairNotes() {
    const page = document.getElementById("chairNotes");
    if (!page) return;

    if (!canManageDelegates()) {
        page.innerHTML = `<div class="card"><p>Access restricted to Chairs and Admins.</p></div>`;
        return;
    }

    const delegates = getData("delegates", []);
    const notes = getData("chairNotes", {});

    page.innerHTML = `
        <div class="page-header">
            <h2>Delegate Feedback & Notes</h2>
            <p>Private observations and performance evaluation for each delegate.</p>
        </div>

        <div class="chair-notes-grid">
            ${delegates.map(d => `
                <div class="chair-note-card">
                    <h3>${escapeHTML(d.name)}</h3>
                    <div>${escapeHTML(d.country)} — ${escapeHTML(d.committee)}</div>
                    <textarea 
                        placeholder="Write notes on position, diplomacy, resolution skills..." 
                        onchange="saveChairNote(${d.id}, this.value)"
                    >${escapeHTML(notes[d.id] || "")}</textarea>
                </div>
            `).join("")}
        </div>
    `;
}

function saveChairNote(delegateId, text) {
    const notes = getData("chairNotes", {});
    notes[delegateId] = text;
    saveData("chairNotes", notes);
}

/* DELEGATES PAGE */
function renderDelegates() {
    const page = document.getElementById("delegates");
    if (!page) return;

    const delegates = getData("delegates", []);
    const committees = getData("committees", []);

    page.innerHTML = `
        <div class="page-header">
            <h2>Delegates Directory</h2>
            <p>View roster and manage conference participants.</p>
        </div>

        ${canManageDelegates() ? `
        <div class="card">
            <h3>Add New Delegate</h3>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                <input type="text" id="newDelName" placeholder="Full Name" style="flex: 1; min-width: 150px;">
                <input type="text" id="newDelCountry" placeholder="Country / Position" style="flex: 1; min-width: 150px;">
                <select id="newDelCommittee" style="flex: 1; min-width: 150px;">
                    ${committees.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join("")}
                </select>
                <button class="primary-btn" onclick="addDelegate()">Add Delegate</button>
            </div>
        </div>
        ` : ""}

        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Country</th>
                            <th>Committee</th>
                            <th>Score</th>
                            ${canManageDelegates() ? "<th>Actions</th>" : ""}
                        </tr>
                    </thead>
                    <tbody>
                        ${delegates.map(d => `
                            <tr>
                                <td>${escapeHTML(d.name)}</td>
                                <td>${escapeHTML(d.country)}</td>
                                <td>${escapeHTML(d.committee)}</td>
                                <td><strong>${d.points || 0} pts</strong></td>
                                ${canManageDelegates() ? `
                                    <td><button class="danger-btn" onclick="deleteDelegate(${d.id})">Delete</button></td>
                                ` : ""}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function addDelegate() {
    const name = document.getElementById("newDelName").value.trim();
    const country = document.getElementById("newDelCountry").value.trim();
    const committee = document.getElementById("newDelCommittee").value;

    if (!name || !country) return alert("Please fill in delegate details.");

    const delegates = getData("delegates", []);
    const newId = Date.now();
    delegates.push({ id: newId, name, country, committee, points: 0 });
    
    saveData("delegates", delegates);
    selectedWorkspaceDelegateId = newId;
    renderAllPages();
}

function deleteDelegate(id) {
    if (!confirm("Are you sure you want to delete this delegate?")) return;
    
    let delegates = getData("delegates", []);
    delegates = delegates.filter(d => String(d.id) !== String(id));
    saveData("delegates", delegates);

    if (String(selectedWorkspaceDelegateId) === String(id)) {
        selectedWorkspaceDelegateId = delegates.length > 0 ? delegates[0].id : null;
    }

    renderAllPages();
}

/* AWARDS PAGE */
function renderAwards() {
    const page = document.getElementById("awards");
    if (!page) return;

    const delegates = getData("delegates", []);
    const sorted = [...delegates].sort((a, b) => (b.points || 0) - (a.points || 0));

    page.innerHTML = `
        <div class="page-header">
            <h2>Awards & Leaderboard</h2>
            <p>Calculated delegate scores based on workspace evaluations.</p>
        </div>

        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Delegate</th>
                            <th>Country</th>
                            <th>Committee</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map((d, index) => `
                            <tr>
                                <td><strong>#${index + 1}</strong></td>
                                <td>${escapeHTML(d.name)}</td>
                                <td>${escapeHTML(d.country)}</td>
                                <td>${escapeHTML(d.committee)}</td>
                                <td>${d.points || 0} pts</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* ACCOUNTS (ADMIN ONLY) */
function renderAccounts() {
    const page = document.getElementById("accounts");
    if (!page) return;

    if (!isAdmin()) {
        page.innerHTML = `<div class="card"><p>Access restricted to Administrators.</p></div>`;
        return;
    }

    const users = getData("users", []);

    page.innerHTML = `
        <div class="page-header">
            <h2>Account Management</h2>
            <p>Manage system users and access roles.</p>
        </div>

        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Code</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${escapeHTML(u.username)}</td>
                                <td>${escapeHTML(u.email)}</td>
                                <td>${capitalize(u.role)}</td>
                                <td><code>${escapeHTML(u.conferenceCode || "-")}</code></td>
                                <td><button class="danger-btn" onclick="deleteUser(${u.id})">Remove</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function deleteUser(id) {
    if (!confirm("Delete this user?")) return;
    let users = getData("users", []);
    users = users.filter(u => String(u.id) !== String(id));
    saveData("users", users);
    renderAccounts();
}

/* SETTINGS PAGE */
function renderSettings() {
    const page = document.getElementById("settings");
    if (!page) return;

    page.innerHTML = `
        <div class="page-header">
            <h2>Settings</h2>
            <p>Customize system behavior and appearance.</p>
        </div>

        <div class="card">
            <h3>Interface Theme</h3>
            <button class="primary-btn" onclick="toggleDarkMode()">Toggle Dark / Light Theme</button>
        </div>
    `;
}

function toggleDarkMode() {
    document.body.classList.toggle("theme-dark");
}

/* INITIAL STARTUP ROUTINE */
window.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    if (user) {
        openApp();
    } else {
        showLogin();
    }
});