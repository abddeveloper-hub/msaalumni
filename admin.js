/**
 * admin.js — Admin Panel Logic
 * MUHYISSUNNA DARS UKKUDA Alumni Network
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ── Guard ── */
    const session = App.getSession();
    if (!session || session.user.role !== 'admin') {
        window.location.href = 'login.html'; return;
    }

    let currentTab    = 'pending';
    let activeAlumni  = null; 

    /* ══════════════════════════════════════
       STATS
    ══════════════════════════════════════ */
    function renderStats() {
        const al = App.getAlumni();
        const pe = App.getPendingRegistrations();
        const batches  = new Set(al.map(a => a.batch).filter(Boolean));
        document.getElementById('s-total').textContent    = al.length;
        document.getElementById('s-pending').textContent  = pe.length;
        document.getElementById('s-approved').textContent = al.length;
        document.getElementById('s-batches').textContent  = batches.size;
        document.getElementById('s-teaching').textContent = al.filter(a => a.status === 'teaching').length;
        document.getElementById('s-employed').textContent = al.filter(a => a.status === 'employed').length;
    }

    /* ══════════════════════════════════════
       AVATAR CELL
    ══════════════════════════════════════ */
    function avatarCell(a) {
        return `<td style="padding:.75rem 1.25rem">
            <div style="display:flex;align-items:center;gap:.65rem">
                ${App.avatarHTML(a, 38)}
                <div>
                    <div style="font-weight:600;font-size:.88rem">${a.name}</div>
                    <div style="font-size:.74rem;color:var(--text-muted)">${a.email}</div>
                </div>
            </div>
        </td>`;
    }

    /* ══════════════════════════════════════
       PENDING TABLE
    ══════════════════════════════════════ */
    function renderPending(q = '') {
        const tbody = document.getElementById('tbody-p');
        let list = App.getPendingRegistrations();
        if (q) list = list.filter(a => (a.name + a.batch + a.email + a.phone).toLowerCase().includes(q.toLowerCase()));
        tbody.innerHTML = '';
        document.getElementById('empty-p').style.display = list.length ? 'none' : 'block';
        list.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                ${avatarCell(a)}
                <td>${a.batch || '—'}</td>
                <td>${a.passedYear || '—'}</td>
                <td>${a.phone || '—'}</td>
                <td style="font-size:.78rem;color:var(--text-muted)">${App.formatDate(a.registeredAt)}</td>
                <td>
                    <div style="display:flex;gap:.35rem;flex-wrap:wrap">
                        <button class="ta ta-v" data-action="view-p" data-id="${a.fbId}">👁 View</button>
                        <button class="ta ta-e" data-action="edit-p" data-id="${a.fbId}">✏️ Edit</button>
                        <button class="ta ta-a" data-action="approve" data-id="${a.fbId}">✓ Approve</button>
                        <button class="ta ta-r" data-action="reject"  data-id="${a.fbId}">✕ Reject</button>
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    /* ══════════════════════════════════════
       APPROVED TABLE
    ══════════════════════════════════════ */
    function renderApproved(q = '') {
        const tbody = document.getElementById('tbody-a');
        let list = App.getAlumni(q ? { search: q } : {});
        tbody.innerHTML = '';
        document.getElementById('empty-a').style.display = list.length ? 'none' : 'block';
        list.forEach(a => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="mid-tag">${a.memberId || '—'}</span></td>
                ${avatarCell(a)}
                <td><div style="font-size:.85rem">${a.batch || '—'}</div><div style="font-size:.75rem;color:var(--text-muted)">Passed ${a.passedYear || '—'}</div></td>
                <td><span class="badge badge-success" style="font-size:.74rem">${App.statusLabel(a.status)}</span></td>
                <td style="font-size:.82rem;color:var(--text-secondary);max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.address || '—'}</td>
                <td>
                    <div style="display:flex;gap:.35rem;flex-wrap:wrap">
                        <button class="ta ta-v" data-action="view-a"  data-id="${a.fbId}">👁 View</button>
                        <button class="ta ta-e" data-action="edit"     data-id="${a.fbId}">✏️ Edit</button>
                        <button class="ta ta-d" data-action="delete"   data-id="${a.fbId}">🗑</button>
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    /* ══════════════════════════════════════
       DETAIL ROWS HELPER
    ══════════════════════════════════════ */
    function detailRows(pairs) {
        return pairs.map(([l, v]) => v
            ? `<div class="dr"><span class="dl">${l}</span><span class="dv">${v}</span></div>`
            : ''
        ).join('');
    }

    /* ══════════════════════════════════════
       VIEW PENDING MODAL
    ══════════════════════════════════════ */
    function showPendingDetail(a) {
        document.getElementById('view-p-body').innerHTML = `
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem">
                ${App.avatarHTML(a, 60)}
                <div>
                    <h2 style="font-size:1.2rem;margin-bottom:.2rem">${a.name}</h2>
                    <span class="badge badge-pending">⏳ Pending Approval</span>
                </div>
            </div>
            <div class="gold-divider" style="margin:.75rem 0"></div>
            ${detailRows([
                ['Email',          a.email],
                ['Phone',          a.phone],
                ["Father's Name",  a.fatherName],
                ['Address',        a.address],
                ['Dars Qual.',     a.darsQual],
                ['School Qual.',   a.schoolQual],
                ['Joined Year',    a.joinedYear],
                ['Passed Year',    a.passedYear],
                ['Batch',          a.batch],
                ['Current Status', App.statusLabel(a.status)],
                ['Job / Role',     a.job || a.course || a.subject],
                ['Location',       a.company || a.institute || a.teachInst],
                ['Submitted',      App.formatDate(a.registeredAt)]
            ])}
            <div style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
                <button class="btn btn-success ta-a" style="flex:1;min-width:120px" data-action="approve" data-id="${a.fbId}">✓ Approve</button>
                <button class="btn btn-danger  ta-r" style="flex:1;min-width:120px" data-action="reject"  data-id="${a.fbId}">✕ Reject</button>
            </div>`;
        openModal('modal-view-p');
    }

    /* ══════════════════════════════════════
       VIEW APPROVED DETAIL MODAL
    ══════════════════════════════════════ */
    function showApprovedDetail(a) {
        activeAlumni = a;
        document.getElementById('view-a-body').innerHTML = `
            <div class="id-card">
                <div>${App.avatarHTML(a, 54)}</div>
                <div>
                    <div class="id-num">${a.memberId || '—'}</div>
                    <div class="id-lbl">Member ID</div>
                </div>
                <div style="margin-left:auto;text-align:right">
                    <div style="font-size:1.1rem;font-weight:700">${a.name}</div>
                    <div style="font-size:.8rem;opacity:.85">${a.darsQual || 'Dars Graduate'}</div>
                </div>
            </div>
            <div class="gold-divider" style="margin:.75rem 0 1rem"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1.5rem">
                <div>
                    <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.5rem">Personal</p>
                    ${detailRows([
                        ['Email',         a.email],
                        ['Phone',         a.phone],
                        ["Father's Name", a.fatherName],
                        ['Address',       a.address]
                    ])}
                </div>
                <div>
                    <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.5rem">Academic</p>
                    ${detailRows([
                        ['Dars Qual.',  a.darsQual],
                        ['School Qual.',a.schoolQual],
                        ['Joined Year', a.joinedYear],
                        ['Passed Year', a.passedYear],
                        ['Batch',       a.batch]
                    ])}
                </div>
            </div>
            <div style="margin-top:.75rem">
                <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:.5rem">Current Status</p>
                ${detailRows([
                    ['Status',   App.statusLabel(a.status)],
                    ['Job/Role', a.job || a.course || a.subject || '—'],
                    ['Location', a.company || a.institute || a.teachInst || '—'],
                    ['Registered', App.formatDate(a.registeredAt)]
                ])}
            </div>`;
        openModal('modal-view-a');
    }

    /* ══════════════════════════════════════
       PDF DOWNLOAD (print-based)
    ══════════════════════════════════════ */
    document.getElementById('pdf-btn').addEventListener('click', () => {
        if (!activeAlumni) return;
        const a = activeAlumni;
        const photoHTML = a.photo
            ? `<img src="${a.photo}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #b8860b">`
            : `<div style="width:80px;height:80px;border-radius:50%;background:#b8860b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:800">${App.getInitials(a.name)}</div>`;

        const row = (l, v) => v ? `<tr><td style="padding:5px 10px;font-weight:600;color:#7a6020;width:140px;font-size:11px">${l}</td><td style="padding:5px 10px;font-size:11px">${v}</td></tr>` : '';

        document.getElementById('print-area').innerHTML = `
            <div style="font-family:Georgia,serif;max-width:680px;margin:0 auto;border:2px solid #b8860b;border-radius:12px;overflow:hidden">
                <div style="background:linear-gradient(135deg,#b8860b,#d4af37);padding:24px 28px;color:#fff;display:flex;align-items:center;gap:20px">
                    ${photoHTML}
                    <div>
                        <div style="font-size:11px;opacity:.8;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">MUHYISSUNNA DARS UKKUDA Alumni</div>
                        <div style="font-size:24px;font-weight:800;letter-spacing:.05em">${a.memberId || 'MDU-???'}</div>
                        <div style="font-size:16px;font-weight:700;margin-top:2px">${a.name}</div>
                        <div style="font-size:11px;opacity:.85;margin-top:2px">${a.darsQual || ''}</div>
                    </div>
                </div>
                <div style="padding:20px 28px;background:#fff">
                    <table style="width:100%;border-collapse:collapse">
                        <tr><td colspan="2" style="padding:4px 10px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b8860b;border-bottom:1px solid #f0d060">PERSONAL INFORMATION</td></tr>
                        ${row("Father's Name", a.fatherName)}
                        ${row("Phone",         a.phone)}
                        ${row("Email",         a.email)}
                        ${row("Address",       a.address)}
                        <tr><td colspan="2" style="padding:10px 10px 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b8860b;border-bottom:1px solid #f0d060">ACADEMIC DETAILS</td></tr>
                        ${row("Dars Qualification",  a.darsQual)}
                        ${row("School Qualification",a.schoolQual)}
                        ${row("Joined Year",         a.joinedYear)}
                        ${row("Passed Year",         a.passedYear)}
                        ${row("Batch",               a.batch)}
                        <tr><td colspan="2" style="padding:10px 10px 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#b8860b;border-bottom:1px solid #f0d060">CURRENT STATUS</td></tr>
                        ${row("Status",    App.statusLabel(a.status))}
                        ${row("Job/Role",  a.job || a.course || a.subject)}
                        ${row("Location",  a.company || a.institute || a.teachInst)}
                    </table>
                    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;font-size:9px;color:#aaa;text-align:center">
                        Generated on ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})} — MUHYISSUNNA DARS UKKUDA Alumni Network
                    </div>
                </div>
            </div>`;
        window.print();
    });

    /* ══════════════════════════════════════
       EDIT MODAL — OPEN
    ══════════════════════════════════════ */
    function openEditModal(a) {
        activeAlumni = a;
        document.getElementById('ef-memberid').value = a.memberId || '';
        document.getElementById('ef-name').value    = a.name         || '';
        document.getElementById('ef-father').value  = a.fatherName   || '';
        document.getElementById('ef-phone').value   = a.phone        || '';
        document.getElementById('ef-email').value   = a.email        || '';
        document.getElementById('ef-address').value = a.address      || '';
        document.getElementById('ef-dars').value    = a.darsQual     || '';
        document.getElementById('ef-school').value  = a.schoolQual   || '';
        document.getElementById('ef-joined').value  = a.joinedYear   || '';
        document.getElementById('ef-passed').value  = a.passedYear   || '';
        document.getElementById('ef-batch').value   = a.batch        || '';
        document.getElementById('ef-status').value  = a.status       || 'other';
        document.getElementById('ef-job').value     = a.job || a.course || a.subject || '';
        document.getElementById('ef-company').value = a.company || a.institute || a.teachInst || '';
        
        const preview = document.getElementById('ef-photo-preview');
        if (a.photo) {
            preview.src = a.photo;
        } else {
            preview.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
        }

        document.getElementById('edit-err').style.display = 'none';
        closeModal('modal-view-a');
        openModal('modal-edit');
    }

    /* PHOTO PREVIEW IN EDIT */
    const efPhotoInput = document.getElementById('ef-photo-input');
    if (efPhotoInput) {
        efPhotoInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                document.getElementById('ef-photo-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /* SWITCH from detail view to edit */
    document.getElementById('switch-to-edit-btn').addEventListener('click', () => {
        if (activeAlumni) openEditModal(activeAlumni);
    });

    /* EDIT FORM SUBMIT */
    document.getElementById('edit-form').addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('ef-name').value.trim();
        if (!name) {
            document.getElementById('edit-err').textContent = 'Full name is required.';
            document.getElementById('edit-err').style.display = 'block';
            return;
        }
        const btn = e.target.querySelector('button[type="submit"]');
        const oldText = btn.textContent;
        btn.textContent = "Saving...";
        btn.disabled = true;

        const status = document.getElementById('ef-status').value;
        const jobVal = document.getElementById('ef-job').value.trim();
        const coVal  = document.getElementById('ef-company').value.trim();
        const data = {
            memberId:    document.getElementById('ef-memberid').value.trim(),
            name:        name,
            fatherName:  document.getElementById('ef-father').value.trim(),
            phone:       document.getElementById('ef-phone').value.trim(),
            email:       document.getElementById('ef-email').value.trim(),
            address:     document.getElementById('ef-address').value.trim(),
            darsQual:    document.getElementById('ef-dars').value.trim(),
            schoolQual:  document.getElementById('ef-school').value.trim(),
            joinedYear:  document.getElementById('ef-joined').value.trim(),
            passedYear:  document.getElementById('ef-passed').value.trim(),
            batch:       document.getElementById('ef-batch').value,
            status:      status,
            job:         status === 'employed' ? jobVal : '',
            company:     status === 'employed' ? coVal  : '',
            course:      status === 'studying' ? jobVal : '',
            institute:   status === 'studying' ? coVal  : '',
            subject:     status === 'teaching' ? jobVal : '',
            teachInst:   status === 'teaching' ? coVal  : '',
            photo:       document.getElementById('ef-photo-preview').src
        };

        if (activeAlumni.approvalStatus === 'pending') {
            if (db) await db.collection('pending').doc(activeAlumni.fbId).update(data);
        } else {
            await App.updateAlumni(activeAlumni.fbId, data);
        }
        closeModal('modal-edit');
        renderStats();
        renderApproved(document.getElementById('srch-a').value);
        showToast('✅ Profile updated successfully!');
        
        btn.textContent = oldText;
        btn.disabled = false;
    });

    /* ══════════════════════════════════════
       TABLE DELEGATION — PENDING
    ══════════════════════════════════════ */
    document.getElementById('tbody-p').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id  = btn.dataset.id;
        
        // Show loading state on button
        const originalText = btn.textContent;
        const disableBtn = () => { btn.textContent = '...'; btn.disabled = true; };
        
        if (btn.dataset.action === 'view-p') {
            const r = App.getPendingRegistrations().find(a => a.fbId === id);
            if (r) showPendingDetail(r);
        } else if (btn.dataset.action === 'edit-p') {
            const r = App.getPendingRegistrations().find(a => a.fbId === id);
            if (r) openEditModal(r);
        } else if (btn.dataset.action === 'approve') {
            if (confirm('Approve this registration?')) {
                disableBtn();
                await App.approveRegistration(id);
                closeModal('modal-view-p');
                refresh();
                showToast('✅ Registration approved! Member ID assigned.');
            }
        } else if (btn.dataset.action === 'reject') {
            if (confirm('Reject and remove this registration?')) {
                disableBtn();
                await App.rejectRegistration(id);
                closeModal('modal-view-p');
                renderPending();
                renderStats();
                showToast('🗑 Registration rejected.');
            }
        }
    });

    /* Approve/Reject buttons inside pending view modal */
    document.getElementById('view-p-body').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id  = btn.dataset.id;
        
        const disableBtn = () => { btn.textContent = '...'; btn.disabled = true; };

        if (btn.dataset.action === 'approve') {
            if (confirm('Approve this registration?')) {
                disableBtn();
                await App.approveRegistration(id);
                closeModal('modal-view-p');
                refresh();
                showToast('✅ Registration approved! Member ID assigned.');
            }
        } else if (btn.dataset.action === 'reject') {
            if (confirm('Reject and remove this registration?')) {
                disableBtn();
                await App.rejectRegistration(id);
                closeModal('modal-view-p');
                renderPending();
                renderStats();
                showToast('🗑 Registration rejected.');
            }
        }
    });

    /* ══════════════════════════════════════
       TABLE DELEGATION — APPROVED
    ══════════════════════════════════════ */
    document.getElementById('tbody-a').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const id  = btn.dataset.id;
        
        const disableBtn = () => { btn.textContent = '...'; btn.disabled = true; };

        if (btn.dataset.action === 'view-a') {
            const r = App.getAlumni().find(a => a.fbId === id);
            if (r) showApprovedDetail(r);
        } else if (btn.dataset.action === 'edit') {
            const r = App.getAlumni().find(a => a.fbId === id);
            if (r) openEditModal(r);
        } else if (btn.dataset.action === 'delete') {
            const r = App.getAlumni().find(a => a.fbId === id);
            if (confirm(`Permanently delete ${r?.name || 'this alumni'}? This cannot be undone.`)) {
                disableBtn();
                await App.deleteAlumni(id);
                refresh();
                showToast('🗑 Alumni record deleted. IDs recalculated.');
            }
        }
    });

    function renderAdminEvents() {
        const tbody = document.getElementById('tbody-e');
        if (!tbody) return;
        const list = App.getEvents();
        tbody.innerHTML = '';
        document.getElementById('empty-e').style.display = list.length ? 'none' : 'block';
        
        list.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(ev => {
            const tr = document.createElement('tr');
            const d = new Date(ev.date);
            const dateStr = isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
            
            tr.innerHTML = `
                <td style="font-weight:600; font-size:0.85rem;">${dateStr}</td>
                <td style="font-weight:600;">${ev.title}</td>
                <td><span class="badge" style="font-size:.72rem; background:var(--bg-secondary); color:var(--text-main); border:1px solid var(--border-color);">${ev.category || 'Other'}</span></td>
                <td style="font-size:0.85rem; color:var(--text-secondary);">${ev.location || '—'}</td>
                <td>
                    <div style="display:flex;gap:.35rem">
                        <button class="ta ta-e" data-action="edit-event" data-id="${ev.fbId}">✏️ Edit</button>
                        <button class="ta ta-d" data-action="del-event" data-id="${ev.fbId}">🗑</button>
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });
    }

    const btnAddEvent = document.getElementById('btn-add-event');
    if(btnAddEvent) {
        btnAddEvent.addEventListener('click', () => {
            document.getElementById('event-form').reset();
            document.getElementById('ev-id').value = '';
            document.getElementById('event-modal-title').textContent = '➕ Add New Event';
            openModal('modal-event');
        });
    }

    const evForm = document.getElementById('event-form');
    if(evForm) {
        evForm.addEventListener('submit', async e => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const oldText = btn.textContent;
            btn.textContent = "Saving...";
            btn.disabled = true;

            const id = document.getElementById('ev-id').value;
            const title = document.getElementById('ev-title').value.trim();
            const date = document.getElementById('ev-date').value;
            const category = document.getElementById('ev-category').value;
            const location = document.getElementById('ev-location').value.trim();

            if (!title || !date) { btn.disabled = false; btn.textContent = oldText; return; }

            if (id) {
                await App.updateEvent(id, { title, date, category, location });
            } else {
                await App.addEvent({ title, date, category, location });
            }
            
            closeModal('modal-event');
            renderAdminEvents();
            showToast(id ? '✅ Event updated successfully!' : '✅ New event published!');
            
            btn.textContent = oldText;
            btn.disabled = false;
        });
    }

    const tbodyE = document.getElementById('tbody-e');
    if(tbodyE) {
        tbodyE.addEventListener('click', async e => {
            const btn = e.target.closest('[data-action]'); if (!btn) return;
            const id = btn.dataset.id;
            let evts = App.getEvents();
            
            if (btn.dataset.action === 'edit-event') {
                const ev = evts.find(e => e.fbId == id);
                if (ev) {
                    document.getElementById('ev-id').value = ev.fbId;
                    document.getElementById('ev-title').value = ev.title;
                    document.getElementById('ev-date').value = ev.date; 
                    document.getElementById('ev-category').value = ev.category || 'Other';
                    document.getElementById('ev-location').value = ev.location || '';
                    document.getElementById('event-modal-title').textContent = '✏️ Edit Event';
                    openModal('modal-event');
                }
            } else if (btn.dataset.action === 'del-event') {
                if (confirm(`Permanently delete this event? This action cannot be undone.`)) {
                    btn.textContent = '...';
                    await App.deleteEvent(id);
                    renderAdminEvents();
                    showToast('🗑 Event deleted successfully.');
                }
            }
        });
    }

    /* ══════════════════════════════════════
       TABS
    ══════════════════════════════════════ */
    document.querySelectorAll('.tb').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tb').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            
            document.getElementById('panel-pending').style.display  = currentTab === 'pending'  ? '' : 'none';
            document.getElementById('panel-approved').style.display = currentTab === 'approved' ? '' : 'none';
            document.getElementById('panel-events').style.display   = currentTab === 'events'   ? '' : 'none';
            
            if (currentTab === 'approved') renderApproved();
            if (currentTab === 'events') renderAdminEvents();
        });
    });

    /* ══════════════════════════════════════
       SEARCH & EXPORT
    ══════════════════════════════════════ */
    document.getElementById('srch-p').addEventListener('input', e => renderPending(e.target.value));
    document.getElementById('srch-a').addEventListener('input', e => renderApproved(e.target.value));

    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const alumni = App.getAlumni();
            if (!alumni.length) {
                showToast('⚠️ No approved alumni to export.');
                return;
            }

            let csvContent = "Member ID,Full Name,Phone,Email,Batch,Status,Location\n";

            alumni.forEach(a => {
                const location = a.company || a.institute || a.teachInst || 'N/A';
                csvContent += `"${a.memberId || 'Pending'}","${a.name}","${a.phone}","${a.email}","${a.batch || 'N/A'}","${a.status}","${location}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "MUHYISSUNNA_Alumni_Directory.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('✅ CSV Exported successfully!');
        });
    }

    const exportPdfBtn = document.getElementById('btn-export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            const alumni = App.getAlumni();
            if (!alumni.length) {
                showToast('⚠️ No approved alumni to export.');
                return;
            }

            const sortedAlumni = [...alumni].sort((a, b) => {
                const idA = parseInt((a.memberId || '').replace(/\D/g, '')) || 0;
                const idB = parseInt((b.memberId || '').replace(/\D/g, '')) || 0;
                if (idA !== idB) return idA - idB;
                return (a.memberId || '').localeCompare(b.memberId || '');
            });

            let tableRows = '';
            sortedAlumni.forEach((a, i) => {
                tableRows += `
                    <tr>
                        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i + 1}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${a.memberId || '—'}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;color:#b8860b">${a.name}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.phone || '—'}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #eee">${a.batch || '—'}</td>
                    </tr>
                `;
            });

            document.getElementById('print-area').innerHTML = `
                <div style="font-family:Georgia,serif;max-width:800px;margin:0 auto;">
                    <div style="text-align:center;margin-bottom:2rem;">
                        <h1 style="color:#b8860b;font-size:24px;margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em;">Muhyissunna Dars Ukkuda</h1>
                        <h2 style="font-size:16px;color:#555;margin:0;">Official Alumni Directory Roster</h2>
                        <div style="margin-top:10px;font-size:12px;color:#888;">Generated on ${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:left;">
                        <thead>
                            <tr>
                                <th style="padding:10px 12px;background:#fdfaf4;border-bottom:2px solid #b8860b;color:#b8860b;text-align:center;width:50px;">#</th>
                                <th style="padding:10px 12px;background:#fdfaf4;border-bottom:2px solid #b8860b;color:#b8860b;">ID Number</th>
                                <th style="padding:10px 12px;background:#fdfaf4;border-bottom:2px solid #b8860b;color:#b8860b;">Full Name</th>
                                <th style="padding:10px 12px;background:#fdfaf4;border-bottom:2px solid #b8860b;color:#b8860b;">Phone</th>
                                <th style="padding:10px 12px;background:#fdfaf4;border-bottom:2px solid #b8860b;color:#b8860b;">Batch</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            `;
            window.print();
        });
    }

    /* ══════════════════════════════════════
       HELP TOGGLE
    ══════════════════════════════════════ */
    document.getElementById('help-toggle').addEventListener('click', () => {
        const body  = document.getElementById('help-body');
        const arrow = document.getElementById('help-arrow');
        const hdr   = document.getElementById('help-toggle');
        const open  = body.classList.toggle('open');
        hdr.classList.toggle('open', open);
        arrow.style.transform = open ? 'rotate(180deg)' : '';
    });

    /* ══════════════════════════════════════
       MODAL HELPERS
    ══════════════════════════════════════ */
    function openModal(id)  { document.getElementById(id).classList.add('active'); }
    function closeModal(id) { document.getElementById(id).classList.remove('active'); }

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    document.querySelectorAll('.mo').forEach(mo => {
        mo.addEventListener('click', e => { if (e.target === mo) closeModal(mo.id); });
    });

    /* ══════════════════════════════════════
       TOAST
    ══════════════════════════════════════ */
    function showToast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position:'fixed', bottom:'2rem', left:'50%', transform:'translateX(-50%) translateY(20px)',
            background:'var(--text-main)', color:'var(--bg-main)', padding:'.75rem 1.5rem',
            borderRadius:'var(--radius-full)', fontSize:'.88rem', fontWeight:'600',
            boxShadow:'var(--shadow-xl)', zIndex:'9999', opacity:'0', transition:'all .3s ease',
            whiteSpace:'nowrap'
        });
        document.body.appendChild(t);
        requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; });
        setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, 3000);
    }

    /* ══════════════════════════════════════
       INIT
    ══════════════════════════════════════ */
    function refresh() {
        renderStats();
        renderPending(document.getElementById('srch-p').value);
        if (currentTab === 'approved') renderApproved(document.getElementById('srch-a').value);
        if (currentTab === 'events') renderAdminEvents();
    }

    refresh();
    window.addEventListener('dbSynced', refresh);
});
