// MODAL
export function createViewModal(title, reservation) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="exit-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Type of Event:</label>
                    <p>${reservation.type}</p>
                </div>
                <div class="form-group">
                    <label>Customer Name:</label>
                    <p>${reservation.customerName}</p>
                </div>
                <div class="form-group">
                    <label>Contact Number:</label>
                    <p>${reservation.contactNumber}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="close-btn">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.exit-btn');
    const closeButton = modal.querySelector('.close-btn');
    
    closeBtn.addEventListener('click', () => modal.remove());
    closeButton.addEventListener('click', () => modal.remove());

    return {
        show: () => {
            modal.style.display = 'flex';
        }
    };
}

export function createEditModal(title, reservation, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="exit-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="eventType">Type of Event:</label>
                    <input type="text" id="eventType" class="form-input" value="${reservation.type}">
                </div>
                <div class="form-group">
                    <label for="customerName">Customer Name:</label>
                    <input type="text" id="customerName" class="form-input" value="${reservation.customerName}">
                </div>
                <div class="form-group">
                    <label for="contactNumber">Contact Number:</label>
                    <input type="text" id="contactNumber" class="form-input" value="${reservation.contactNumber}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn">Cancel</button>
                <button class="save-btn">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const closeBtn = modal.querySelector('.exit-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const saveBtn = modal.querySelector('.save-btn');

    closeBtn.addEventListener('click', () => modal.remove());
    cancelBtn.addEventListener('click', () => modal.remove());

    saveBtn.addEventListener('click', () => {
        const formData = {
            type: modal.querySelector('#eventType').value,
            customerName: modal.querySelector('#customerName').value,
            contactNumber: modal.querySelector('#contactNumber').value
        };

        if (formData.type && formData.customerName && formData.contactNumber) {
            onSave(formData);
            modal.remove();
        } else {
            alert('Please fill in all fields');
        }
    });

    return {
        show: () => {
            modal.style.display = 'flex';
        }
    };
}